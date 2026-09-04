// Priority LMS Batch 5 — Repayment Mandates (NACH / eMandate) API
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { createRepaymentMandate, activateRepaymentMandate, cancelRepaymentMandate } from '@/services/mandate/mandateService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, ['view_repayments', 'view_loans']);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const loanId = searchParams.get('loanId');
    const status = searchParams.get('status');

    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (loanId) where.loanId = loanId;
    if (status && status !== 'ALL') where.status = status;

    const mandates = await prisma.repaymentMandate.findMany({
      where,
      include: {
        customer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      mandates.map((m) => ({
        id: m.id,
        mandateNumber: m.mandateNumber,
        umrn: m.umrn,
        customerId: m.customerId,
        customerName: m.customer.name,
        loanId: m.loanId,
        provider: m.provider,
        maxAmount: Number(m.maxAmount),
        frequency: m.frequency,
        startDate: m.startDate,
        endDate: m.endDate,
        status: m.status,
        failureReason: m.failureReason,
        createdAt: m.createdAt,
      }))
    );
  } catch (error: any) {
    console.error('API /api/mandates GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, ['manage_repayments', 'post_repayment']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const { action = 'CREATE', mandateId, ...payload } = body;

    if (action === 'ACTIVATE') {
      if (!mandateId || !payload.umrn) {
        return NextResponse.json({ error: 'mandateId and umrn are required for activation' }, { status: 400 });
      }
      const updated = await activateRepaymentMandate({
        mandateId,
        umrn: payload.umrn,
        actorUser,
      });

      await writeAuditLog({
        actorUser,
        entityType: 'MANDATE',
        entityId: updated.id,
        entityName: updated.mandateNumber,
        action: 'ACTIVATE_MANDATE',
        details: `Activated NACH mandate with UMRN ${payload.umrn}`,
        request,
      });

      return NextResponse.json(updated);
    }

    if (action === 'CANCEL') {
      if (!mandateId || !payload.reason) {
        return NextResponse.json({ error: 'mandateId and reason are required for cancellation' }, { status: 400 });
      }
      const updated = await cancelRepaymentMandate({
        mandateId,
        reason: payload.reason,
        actorUser,
      });

      await writeAuditLog({
        actorUser,
        entityType: 'MANDATE',
        entityId: updated.id,
        entityName: updated.mandateNumber,
        action: 'CANCEL_MANDATE',
        details: `Cancelled mandate: ${payload.reason}`,
        request,
      });

      return NextResponse.json(updated);
    }

    // Default: CREATE
    const mandate = await createRepaymentMandate(payload, actorUser);

    await writeAuditLog({
      actorUser,
      entityType: 'MANDATE',
      entityId: mandate.id,
      entityName: mandate.mandateNumber,
      action: 'CREATE_MANDATE',
      details: `Created new repayment mandate limit ₹${mandate.maxAmount}`,
      request,
    });

    return NextResponse.json(mandate, { status: 201 });
  } catch (error: any) {
    console.error('API /api/mandates POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
