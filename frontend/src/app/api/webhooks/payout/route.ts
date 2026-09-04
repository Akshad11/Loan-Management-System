// Priority LMS Batch 5 — Secure Payout Webhook / Callback Handler
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getPayoutProvider } from '@/services/payment/payoutService';
import { recordDisbursementAccounting } from '@/services/accounting/accountingService';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const signature =
      request.headers.get('x-webhook-signature') ||
      request.headers.get('x-provider-signature') ||
      request.headers.get('x-signature') ||
      '';

    const providerName = request.headers.get('x-provider-name') || 'GATEWAY_PAYOUT_API';
    const provider = getPayoutProvider(providerName);

    const rawBody = await request.text();
    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // 1. Verify provider signature if signature header provided
    if (signature) {
      const isValid = provider.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Webhook signature verification failed. Untrusted payload.' },
          { status: 401 }
        );
      }
    }

    const { event, payload, payoutId, correlationId, utr, status, failureReason } = body;
    const effectiveRef = correlationId || payoutId || payload?.payout?.id;
    const effectiveStatus = (status || payload?.payout?.status || '').toUpperCase();
    const effectiveUtr = utr || payload?.payout?.utr;

    if (!effectiveRef) {
      return NextResponse.json({ error: 'Missing correlationId or payout reference' }, { status: 400 });
    }

    // 2. Lookup transaction
    const transaction = await prisma.disbursementTransaction.findFirst({
      where: {
        OR: [
          { transactionReference: effectiveRef },
          { externalReference: effectiveRef },
          { requestId: effectiveRef },
        ],
      },
      include: {
        disbursement: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: `Transaction with reference "${effectiveRef}" not found in LMS.` },
        { status: 404 }
      );
    }

    // Idempotency check: if transaction is already in terminal state, ignore duplicate webhook
    if (transaction.status === 'SUCCESSFUL' || transaction.status === 'FAILED') {
      return NextResponse.json({
        message: 'Event acknowledged (already processed).',
        transactionStatus: transaction.status,
      });
    }

    // 3. Process status transition safely
    if (effectiveStatus === 'SUCCESS' || effectiveStatus === 'PROCESSED') {
      await prisma.disbursementTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'SUCCESSFUL',
          utrNumber: effectiveUtr || transaction.utrNumber || `UTR-WH-${Date.now()}`,
          completedAt: new Date(),
        },
      });

      if (transaction.requestId) {
        await prisma.disbursementRequest.update({
          where: { id: transaction.requestId },
          data: { status: 'SUCCESSFUL' },
        });
      }

      // Record GL Journal
      await recordDisbursementAccounting({
        disbursementId: transaction.disbursementId,
        disbursementNumber: transaction.disbursement.disbursementNumber,
        loanId: transaction.disbursement.applicationId,
        grossAmount: Number(transaction.amount),
        netPayoutAmount: Number(transaction.amount),
        idempotencyKey: `wh_payout_acct_${transaction.id}`,
        actorName: 'Webhook Provider Callback',
      });
    } else if (effectiveStatus === 'FAILED' || effectiveStatus === 'REJECTED') {
      await prisma.disbursementTransaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          failureReason: failureReason || 'Payout rejected by provider clearing partner.',
          failedAt: new Date(),
        },
      });

      if (transaction.requestId) {
        await prisma.disbursementRequest.update({
          where: { id: transaction.requestId },
          data: { status: 'FAILED' },
        });
      }

      await prisma.disbursement.update({
        where: { id: transaction.disbursementId },
        data: { status: 'FAILED' },
      });
    }

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      updatedStatus: effectiveStatus,
    });
  } catch (error: any) {
    console.error('API /api/webhooks/payout POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
