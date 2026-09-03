import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, writeAuditLog } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, 'view_loans');
    if (authResult instanceof NextResponse) return authResult;

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const loan = await prisma.loanAccount.findFirst({
      where: {
        OR: [{ id }, { accountNumber: id }],
      },
      include: {
        scheduleVersions: {
          orderBy: { version: 'desc' },
        },
        schedules: {
          orderBy: { instalmentNumber: 'asc' },
        },
        charges: {
          orderBy: { createdAt: 'asc' },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
        },
        repaymentSettings: true,
        history: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!loan) {
      return NextResponse.json({ error: 'Loan Account not found.' }, { status: 404 });
    }

    return NextResponse.json(loan);
  } catch (error: any) {
    console.error(`API /loans/[id] GET error:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, ['view_loans', 'manage_repayments', 'close_loan']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    const updated = await prisma.loanAccount.update({
      where: { id },
      data: {
        status: body.status || undefined,
        outstandingPrincipal: body.principalOutstanding !== undefined ? body.principalOutstanding : undefined,
        totalOutstanding: body.totalOutstanding !== undefined ? body.totalOutstanding : undefined,
        interestOutstanding: body.interestOutstanding !== undefined ? body.interestOutstanding : undefined,
        feeOutstanding: body.feeOutstanding !== undefined ? body.feeOutstanding : undefined,
        penaltyOutstanding: body.penaltyOutstanding !== undefined ? body.penaltyOutstanding : undefined,
        dpd: body.dpd !== undefined ? body.dpd : undefined,
        dpdBucket: body.dpdBucket || undefined,
        overdueAmount: body.overdueAmount !== undefined ? body.overdueAmount : undefined,
        nextDueDate: body.nextDueDate || undefined,
        updatedBy: body.updatedBy || 'Operations Officer',
      },
    });

    await writeAuditLog({
      actorUser,
      entityType: 'LOAN_ACCOUNT',
      entityId: updated.id,
      entityName: updated.accountNumber,
      action: 'UPDATE',
      details: `Loan ${updated.accountNumber} updated. Status: ${updated.status}`,
      request,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error(`API /loans/[id] PATCH error:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
