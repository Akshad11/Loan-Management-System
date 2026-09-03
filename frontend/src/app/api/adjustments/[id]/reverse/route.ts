import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { recalculateLoanBalances } from '@/services/chargeAdjustmentEngine';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, ["reverse_repayment","manage_repayments"]);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params; const id = resolvedParams?.id;
    const body = await request.json();
    const { reason, reversedBy, reversedByName } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'Reversal reason is mandatory.' }, { status: 400 });
    }

    const adjustment = await prisma.financialAdjustmentRequest.findFirst({
      where: { OR: [{ id }, { adjustmentNumber: id }] },
      include: { loan: true },
    });

    if (!adjustment) {
      return NextResponse.json({ error: 'Adjustment request not found.' }, { status: 404 });
    }

    if (adjustment.status !== 'APPLIED') {
      return NextResponse.json(
        { error: `Cannot reverse adjustment with status '${adjustment.status}'. Must be APPLIED first.` },
        { status: 400 }
      );
    }

    const loan = adjustment.loan;
    const isCredit = adjustment.adjustmentType === 'CREDIT_ADJUSTMENT' || adjustment.adjustmentType.includes('CREDIT');
    // Reverse the effect: if it was a credit, we add it back; if debit, we subtract it
    const factor = isCredit ? 1 : -1;

    const pDelta = Number(adjustment.principalAdjustment || 0) * factor;
    const iDelta = Number(adjustment.interestAdjustment || (adjustment.adjustmentType === 'INTEREST_ADJUSTMENT' ? Number(adjustment.amount) : 0)) * factor;
    const fDelta = Number(adjustment.feeAdjustment || (adjustment.adjustmentType === 'FEE_ADJUSTMENT' ? Number(adjustment.amount) : 0)) * factor;
    const penDelta = Number(adjustment.penaltyAdjustment || (adjustment.adjustmentType === 'PENALTY_ADJUSTMENT' ? Number(adjustment.amount) : 0)) * factor;

    const updatedBalances = recalculateLoanBalances(loan as any, {
      principalDelta: pDelta,
      interestDelta: iDelta,
      feeDelta: fDelta,
      penaltyDelta: penDelta,
    });

    const revCount = await prisma.adjustmentReversal.count();
    const reversalNumber = `REV-${new Date().getFullYear()}-${String(revCount + 101).padStart(6, '0')}`;
    const txCount = await prisma.loanTransaction.count();
    const txnReference = `TXN-REV-${new Date().getFullYear()}-${String(txCount + 101).padStart(6, '0')}`;

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

      // 2. Persist Reversal Record
      await tx.adjustmentReversal.create({
        data: {
          reversalNumber,
          targetType: 'ADJUSTMENT',
          targetId: adjustment.id,
          targetReference: adjustment.adjustmentNumber,
          loanId: loan.id,
          amount: adjustment.amount,
          reason,
          status: 'COMPLETED',
          requestedBy: reversedBy || 'usr_ops_01',
          requestedByName: reversedByName || 'Operations Officer',
          compensatingTransactionRef: txnReference,
          notes: `Reversed adjustment ${adjustment.adjustmentNumber}. Reason: ${reason}`,
        },
      });

      // 3. Create Compensating Transaction
      await tx.loanTransaction.create({
        data: {
          loanId: loan.id,
          accountNumber: loan.accountNumber,
          transactionReference: txnReference,
          transactionType: 'ADJUSTMENT_REVERSAL',
          amount: isCredit ? Number(adjustment.amount) : -Number(adjustment.amount),
          principalPortion: pDelta,
          interestPortion: iDelta,
          feePortion: fDelta,
          penaltyPortion: penDelta,
          status: 'SUCCESSFUL',
          transactionDate: new Date().toISOString().split('T')[0],
          createdBy: reversedByName || 'Operations Officer',
          notes: `Compensating reversal of ${adjustment.adjustmentNumber}. Reason: ${reason}`,
        },
      });

      // 4. Update Adjustment Request Status
      const updatedAdj = await tx.financialAdjustmentRequest.update({
        where: { id: adjustment.id },
        data: {
          status: 'REVERSED',
        },
      });

      return updatedAdj;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API /adjustments/[id]/reverse POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
