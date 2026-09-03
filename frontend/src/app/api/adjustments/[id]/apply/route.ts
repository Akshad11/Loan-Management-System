import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { recalculateLoanBalances } from '@/services/chargeAdjustmentEngine';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, 'manage_repayments');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params; const id = resolvedParams?.id;
    const body = await request.json();
    const { actorId, actorName, actorRole } = body;

    const adjustment = await prisma.financialAdjustmentRequest.findFirst({
      where: { OR: [{ id }, { adjustmentNumber: id }] },
      include: { loan: true },
    });

    if (!adjustment) {
      return NextResponse.json({ error: 'Adjustment request not found.' }, { status: 404 });
    }

    if (adjustment.status === 'APPLIED') {
      return NextResponse.json({ error: 'This adjustment has already been applied.' }, { status: 409 });
    }

    if (adjustment.status !== 'APPROVED') {
      return NextResponse.json(
        { error: `Cannot apply adjustment with status '${adjustment.status}'. Must be APPROVED first.` },
        { status: 400 }
      );
    }

    const loan = adjustment.loan;
    const isCredit = adjustment.adjustmentType === 'CREDIT_ADJUSTMENT' || adjustment.adjustmentType.includes('CREDIT');
    const factor = isCredit ? -1 : 1;

    const pAdj = Number(adjustment.principalAdjustment || 0) * factor;
    const iAdj = Number(adjustment.interestAdjustment || (adjustment.adjustmentType === 'INTEREST_ADJUSTMENT' ? Number(adjustment.amount) : 0)) * factor;
    const fAdj = Number(adjustment.feeAdjustment || (adjustment.adjustmentType === 'FEE_ADJUSTMENT' ? Number(adjustment.amount) : 0)) * factor;
    const penAdj = Number(adjustment.penaltyAdjustment || (adjustment.adjustmentType === 'PENALTY_ADJUSTMENT' ? Number(adjustment.amount) : 0)) * factor;

    // Recalculate balances
    const updatedBalances = recalculateLoanBalances(loan as any, {
      principalDelta: pAdj,
      interestDelta: iAdj,
      feeDelta: fAdj,
      penaltyDelta: penAdj,
    });

    const txCount = await prisma.loanTransaction.count();
    const txnReference = `TXN-ADJ-${new Date().getFullYear()}-${String(txCount + 101).padStart(6, '0')}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Loan Balances
      await tx.loanAccount.update({
        where: { id: loan.id },
        data: {
          outstandingPrincipal: updatedBalances.outstandingPrincipal,
          interestOutstanding: updatedBalances.interestOutstanding,
          feeOutstanding: updatedBalances.feeOutstanding,
          penaltyOutstanding: updatedBalances.penaltyOutstanding,
          totalOutstanding: updatedBalances.totalOutstanding,
        },
      });

      // 2. Create Transaction
      await tx.loanTransaction.create({
        data: {
          loanId: loan.id,
          accountNumber: loan.accountNumber,
          transactionReference: txnReference,
          transactionType: adjustment.adjustmentType,
          amount: isCredit ? -Number(adjustment.amount) : Number(adjustment.amount),
          principalPortion: pAdj,
          interestPortion: iAdj,
          feePortion: fAdj,
          penaltyPortion: penAdj,
          status: 'SUCCESSFUL',
          transactionDate: adjustment.effectiveDate || new Date().toISOString().split('T')[0],
          createdBy: actorName || 'Operations Officer',
          notes: `Applied ${adjustment.adjustmentType} (${adjustment.adjustmentNumber}). Reason: ${adjustment.reason}`,
        },
      });

      // 3. Log History
      await tx.loanHistory.create({
        data: {
          loanId: loan.id,
          action: adjustment.adjustmentType,
          actor: actorId || 'usr_ops_01',
          actorName: actorName || 'Operations Officer',
          actorRole: actorRole || 'Operations Officer',
          previousState: `Total Dues: ₹${loan.totalOutstanding}`,
          newState: `Total Dues: ₹${updatedBalances.totalOutstanding}`,
          amount: isCredit ? -Number(adjustment.amount) : Number(adjustment.amount),
          reference: adjustment.adjustmentNumber,
          notes: `Financial adjustment ${adjustment.adjustmentNumber} applied. Reason: ${adjustment.reason}`,
        },
      });

      // 4. Update Adjustment Request Status
      const updatedAdj = await tx.financialAdjustmentRequest.update({
        where: { id: adjustment.id },
        data: {
          status: 'APPLIED',
          appliedAt: new Date(),
          appliedBy: actorId || 'usr_ops_01',
          resultingTransactionRef: txnReference,
        },
      });

      return updatedAdj;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API /adjustments/[id]/apply POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
