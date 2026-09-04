import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, writeAuditLog } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, 'execute_disbursement');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const {
      requestId,
      paymentMethod = 'NEFT',
      utrNumber,
      externalReference,
      simulateFailure = false,
      failureReason,
      actorName = actorUser.name,
      actorRole = actorUser.roleName,
    } = body;

    const disbursement = await prisma.disbursement.findUnique({
      where: { id },
      include: {
        requests: true,
        beneficiaries: true,
        transactions: true,
      },
    });

    if (!disbursement) {
      return NextResponse.json({ error: 'Disbursement not found' }, { status: 404 });
    }

    const reqItem = disbursement.requests.find((r) => r.id === requestId);
    if (!reqItem) {
      return NextResponse.json({ error: 'Disbursement request not found' }, { status: 404 });
    }

    if (reqItem.status !== 'APPROVED' && reqItem.status !== 'FAILED') {
      return NextResponse.json(
        { error: `Cannot execute transaction for request with status "${reqItem.status}". Request must be in APPROVED status.` },
        { status: 400 }
      );
    }

    // Pre-Disbursement Compliance Gatekeeper Enforcement
    if (disbursement.applicationId) {
      const { executePreDisbursementGatekeeper } = await import('@/services/disbursement/preDisbursementGatekeeper');
      const gateResult = await executePreDisbursementGatekeeper(disbursement.applicationId);
      if (!gateResult.isEligible && !simulateFailure) {
        return NextResponse.json(
          {
            error: 'Disbursement Blocked: Pre-disbursement compliance checks failed.',
            blockingReasons: gateResult.blockingReasons,
            checks: gateResult.checks,
          },
          { status: 422 }
        );
      }
    }

    const beneficiary =
      disbursement.beneficiaries.find((b) => b.id === reqItem.beneficiaryId) ||
      disbursement.beneficiaries[0];

    const txnCount = await prisma.disbursementTransaction.count();
    const txnRef = `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(txnCount + 315).padStart(5, '0')}`;
    const generatedUtr =
      utrNumber ||
      `${paymentMethod.slice(0, 4)}R${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Math.floor(100000 + Math.random() * 900000)}`;

    const { executePayout } = await import('@/services/payment/payoutService');
    const { recordDisbursementAccounting } = await import('@/services/accounting/accountingService');

    let payoutResult;
    if (simulateFailure) {
      payoutResult = {
        status: 'FAILED' as const,
        payoutId: reqItem.id,
        correlationId: txnRef,
        providerReference: externalReference || 'BANK-ERR-502',
        valueDate: new Date().toISOString().split('T')[0],
        failureReason: failureReason || 'Beneficiary bank network rejected the transaction.',
        isRetryable: false,
      };
    } else {
      payoutResult = await executePayout({
        payoutId: reqItem.id,
        correlationId: txnRef,
        amount: Number(reqItem.requestedAmount),
        beneficiaryName: beneficiary?.beneficiaryName || disbursement.customerName,
        accountNumber: beneficiary?.accountNumber || '50200084920192',
        ifscCode: beneficiary?.ifscCode || 'HDFC0000120',
        paymentMode: (paymentMethod as any) || 'NEFT',
        purpose: reqItem.purpose || 'Loan Disbursement Payout',
        idempotencyKey: `payout_dsb_${reqItem.id}`,
        sanctionNumber: disbursement.sanctionNumber,
        borrowerName: disbursement.customerName,
      });
    }

    if (payoutResult.status === 'FAILED') {
      // Record failed transaction
      await prisma.disbursementTransaction.create({
        data: {
          transactionReference: txnRef,
          disbursementId: disbursement.id,
          requestId: reqItem.id,
          amount: reqItem.requestedAmount,
          paymentMethod: paymentMethod as any,
          status: 'FAILED',
          beneficiaryName: beneficiary?.beneficiaryName || disbursement.customerName,
          beneficiaryAccountNumberMasked: beneficiary?.accountNumberMasked || '•••• •••• •••• 0000',
          beneficiaryIfsc: beneficiary?.ifscCode || 'HDFC0000120',
          bankName: beneficiary?.bankName || 'HDFC Bank Ltd',
          externalReference: payoutResult.providerReference || 'BANK-ERR-502',
          failureReason: payoutResult.failureReason || failureReason || 'Beneficiary bank network rejected the transaction.',
          processingStartedAt: new Date(),
          failedAt: new Date(),
        },
      });

      await prisma.disbursementRequest.update({
        where: { id: reqItem.id },
        data: { status: 'FAILED' },
      });

      await prisma.disbursement.update({
        where: { id: disbursement.id },
        data: {
          status: 'FAILED',
          history: {
            create: [
              {
                requestId: reqItem.id,
                event: 'TRANSACTION_FAILED',
                actor: actorName,
                actorName,
                actorRole,
                previousState: 'PROCESSING',
                newState: 'FAILED',
                amount: reqItem.requestedAmount,
                reference: txnRef,
                notes: `Payout transaction failed: ${payoutResult.failureReason || 'Beneficiary bank rejected transaction.'}`,
              },
            ],
          },
        },
      });
    } else {
      // Successful / Processing transaction execution
      const reqAmount = Number(reqItem.requestedAmount);
      const isSuccess = payoutResult.status === 'SUCCESS';
      const effectiveUtr = payoutResult.utrNumber || generatedUtr;

      await prisma.disbursementTransaction.create({
        data: {
          transactionReference: txnRef,
          disbursementId: disbursement.id,
          requestId: reqItem.id,
          amount: reqAmount,
          paymentMethod: paymentMethod as any,
          status: isSuccess ? 'SUCCESSFUL' : 'PROCESSING',
          beneficiaryName: beneficiary?.beneficiaryName || disbursement.customerName,
          beneficiaryAccountNumberMasked: beneficiary?.accountNumberMasked || '•••• •••• •••• 0000',
          beneficiaryIfsc: beneficiary?.ifscCode || 'HDFC0000120',
          bankName: beneficiary?.bankName || 'HDFC Bank Ltd',
          externalReference: payoutResult.providerReference || `EXT-${paymentMethod}-${Date.now()}`,
          utrNumber: effectiveUtr,
          processingStartedAt: new Date(),
          completedAt: isSuccess ? new Date() : null,
        },
      });

      await prisma.disbursementRequest.update({
        where: { id: reqItem.id },
        data: { status: isSuccess ? 'SUCCESSFUL' : 'PROCESSING' },
      });

      const newTotalDisbursed = Number(disbursement.totalDisbursedAmount) + reqAmount;
      const newRemaining = Math.max(0, Number(disbursement.sanctionAmount) - newTotalDisbursed);
      const finalStatus = newRemaining === 0 ? 'DISBURSED' : 'PARTIAL';

      await prisma.disbursement.update({
        where: { id: disbursement.id },
        data: {
          totalDisbursedAmount: newTotalDisbursed,
          remainingAmount: newRemaining,
          status: finalStatus as any,
          firstDisbursedAt: disbursement.firstDisbursedAt || new Date(),
          lastDisbursedAt: new Date(),
          history: {
            create: [
              {
                requestId: reqItem.id,
                event: isSuccess ? 'TRANSACTION_SUCCESSFUL' : 'TRANSACTION_PROCESSING',
                actor: actorName,
                actorName,
                actorRole,
                previousState: 'APPROVED',
                newState: finalStatus,
                amount: reqAmount,
                reference: effectiveUtr,
                notes: `Payout of ₹${reqAmount.toLocaleString('en-IN')} via ${paymentMethod} (${payoutResult.status}). UTR: ${effectiveUtr}. Remaining Sanction Balance: ₹${newRemaining.toLocaleString('en-IN')}.`,
              },
            ],
          },
        },
      });

      // Post balanced double-entry accounting journal
      if (isSuccess) {
        await recordDisbursementAccounting({
          disbursementId: disbursement.id,
          disbursementNumber: disbursement.disbursementNumber,
          loanId: disbursement.applicationId,
          grossAmount: reqAmount,
          netPayoutAmount: reqAmount,
          actorName,
        });
      }

      // If fully disbursed, update application status
      if (newRemaining === 0) {
        await prisma.loanApplication.update({
          where: { id: disbursement.applicationId },
          data: { status: 'DISBURSED' },
        });
      }
    }

    const updated = await prisma.disbursement.findUnique({
      where: { id },
      include: {
        requests: true,
        beneficiaries: true,
        transactions: true,
        history: { orderBy: { timestamp: 'desc' } },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('API /api/disbursements/[id]/transactions POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { transactionId, reason, actorName = 'Operations Officer', actorRole = 'Operations Manager' } = body;

    if (!transactionId || !reason) {
      return NextResponse.json({ error: 'transactionId and reason are required for reversal' }, { status: 400 });
    }

    const disbursement = await prisma.disbursement.findUnique({
      where: { id },
      include: {
        requests: true,
        beneficiaries: true,
        transactions: true,
      },
    });

    if (!disbursement) {
      return NextResponse.json({ error: 'Disbursement not found' }, { status: 404 });
    }

    const txn = disbursement.transactions.find((t) => t.id === transactionId);
    if (!txn) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (txn.status !== 'SUCCESSFUL') {
      return NextResponse.json({ error: 'Only successful transactions can be reversed' }, { status: 400 });
    }

    const txnAmount = Number(txn.amount);

    await prisma.disbursementTransaction.update({
      where: { id: txn.id },
      data: {
        status: 'REVERSED',
        reversedAt: new Date(),
        reversedBy: actorName,
        reversalReason: reason,
      },
    });

    if (txn.requestId) {
      await prisma.disbursementRequest.update({
        where: { id: txn.requestId },
        data: { status: 'REVERSED' },
      });
    }

    const newTotalDisbursed = Math.max(0, Number(disbursement.totalDisbursedAmount) - txnAmount);
    const newRemaining = Number(disbursement.sanctionAmount) - newTotalDisbursed;

    await prisma.disbursement.update({
      where: { id: disbursement.id },
      data: {
        totalDisbursedAmount: newTotalDisbursed,
        remainingAmount: newRemaining,
        status: 'REVERSED',
        history: {
          create: [
            {
              requestId: txn.requestId || undefined,
              event: 'TRANSACTION_REVERSED',
              actor: actorName,
              actorName,
              actorRole,
              previousState: 'SUCCESSFUL',
              newState: 'REVERSED',
              amount: txnAmount,
              reference: txn.transactionReference,
              notes: `Transaction ${txn.transactionReference} of ₹${txnAmount.toLocaleString('en-IN')} reversed. Reason: ${reason}. Restored Balance: ₹${newRemaining.toLocaleString('en-IN')}.`,
            },
          ],
        },
      },
    });

    // Check if journal entry exists for this disbursement, and reverse it
    const existingJournal = await prisma.journalEntry.findFirst({
      where: {
        transactionType: 'DISBURSEMENT',
        referenceId: disbursement.id,
        status: 'POSTED',
      },
    });
    if (existingJournal) {
      const { recordReversalJournal } = await import('@/services/accounting/accountingService');
      await recordReversalJournal({
        originalJournalEntryId: existingJournal.id,
        reason,
        actorName,
      });
    }

    const updated = await prisma.disbursement.findUnique({
      where: { id },
      include: {
        requests: true,
        beneficiaries: true,
        transactions: true,
        history: { orderBy: { timestamp: 'desc' } },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('API /api/disbursements/[id]/transactions PUT error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
