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

    const charge = await prisma.loanCharge.findFirst({
      where: { OR: [{ id }, { chargeNumber: id }] },
      include: { loan: true },
    });

    if (!charge) {
      return NextResponse.json({ error: 'Charge record not found.' }, { status: 404 });
    }

    if (charge.status === 'REVERSED') {
      return NextResponse.json({ error: 'This charge has already been reversed.' }, { status: 409 });
    }

    if (charge.status === 'PAID') {
      return NextResponse.json(
        { error: 'Cannot reverse a fully PAID charge directly. Reversal of paid transaction required.' },
        { status: 400 }
      );
    }

    const uncollectedAmount = Number(charge.outstandingAmount ?? charge.totalAmount ?? 0);
    const loan = charge.loan;
    const isPenalty = charge.chargeType === 'LATE_PAYMENT_FEE' || charge.chargeCode.includes('PENALTY') || charge.chargeCode.includes('LATE');

    const revCount = await prisma.adjustmentReversal.count();
    const reversalNumber = `REV-${new Date().getFullYear()}-${String(revCount + 101).padStart(6, '0')}`;
    const txCount = await prisma.loanTransaction.count();
    const txnReference = `TXN-REV-${new Date().getFullYear()}-${String(txCount + 101).padStart(6, '0')}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Charge status
      const updatedCharge = await tx.loanCharge.update({
        where: { id: charge.id },
        data: {
          status: 'REVERSED',
          outstandingAmount: 0,
          reversedAt: new Date(),
          reversedBy: reversedByName || reversedBy || 'Operations Officer',
          reversalReason: reason,
        },
      });

      // 2. Recalculate Loan Balances
      const balanceDelta = isPenalty
        ? { penaltyDelta: -uncollectedAmount }
        : { feeDelta: -uncollectedAmount };

      const updatedBalances = recalculateLoanBalances(loan as any, balanceDelta);

      await tx.loanAccount.update({
        where: { id: loan.id },
        data: {
          feeOutstanding: updatedBalances.feeOutstanding,
          penaltyOutstanding: updatedBalances.penaltyOutstanding,
          totalOutstanding: updatedBalances.totalOutstanding,
        },
      });

      // 3. Persist Reversal Record
      await tx.adjustmentReversal.create({
        data: {
          reversalNumber,
          targetType: 'CHARGE',
          targetId: charge.id,
          targetReference: charge.chargeNumber || charge.id,
          loanId: loan.id,
          amount: uncollectedAmount,
          reason,
          status: 'COMPLETED',
          requestedBy: reversedBy || 'usr_ops_01',
          requestedByName: reversedByName || 'Operations Officer',
          compensatingTransactionRef: txnReference,
          notes: `Reversed charge ${charge.chargeNumber} for ₹${uncollectedAmount}.`,
        },
      });

      // 4. Create Compensating Loan Transaction
      await tx.loanTransaction.create({
        data: {
          loanId: loan.id,
          accountNumber: loan.accountNumber,
          transactionReference: txnReference,
          transactionType: isPenalty ? 'PENALTY_REVERSAL' : 'FEE_REVERSAL',
          amount: -uncollectedAmount,
          principalPortion: 0,
          interestPortion: 0,
          feePortion: isPenalty ? 0 : -uncollectedAmount,
          penaltyPortion: isPenalty ? -uncollectedAmount : 0,
          status: 'SUCCESSFUL',
          transactionDate: new Date().toISOString().split('T')[0],
          createdBy: reversedByName || 'Operations Officer',
          notes: `Compensating reversal of charge ${charge.chargeNumber}. Reason: ${reason}`,
        },
      });

      // 5. Log History
      await tx.loanHistory.create({
        data: {
          loanId: loan.id,
          action: isPenalty ? 'PENALTY_REVERSED' : 'FEE_REVERSED',
          actor: reversedBy || 'usr_ops_01',
          actorName: reversedByName || 'Operations Officer',
          actorRole: 'Operations Officer',
          previousState: `Total Dues: ₹${loan.totalOutstanding}`,
          newState: `Total Dues: ₹${updatedBalances.totalOutstanding}`,
          amount: -uncollectedAmount,
          reference: reversalNumber,
          notes: `Charge ${charge.chargeNumber} reversed. Reason: ${reason}`,
        },
      });

      return updatedCharge;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API /charges/[id]/reverse POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
