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

    const waiver = await prisma.waiverRequest.findFirst({
      where: { OR: [{ id }, { waiverNumber: id }] },
      include: { loan: true, charge: true },
    });

    if (!waiver) {
      return NextResponse.json({ error: 'Waiver request not found.' }, { status: 404 });
    }

    if (waiver.status === 'APPLIED') {
      return NextResponse.json({ error: 'This waiver has already been applied.' }, { status: 409 });
    }

    if (waiver.status !== 'APPROVED') {
      return NextResponse.json(
        { error: `Cannot apply waiver with status '${waiver.status}'. Must be APPROVED first.` },
        { status: 400 }
      );
    }

    const loan = waiver.loan;
    const amountToWaive = Number(waiver.approvedAmount || waiver.requestedAmount);
    const txCount = await prisma.loanTransaction.count();
    const txnReference = `TXN-WVR-${new Date().getFullYear()}-${String(txCount + 101).padStart(6, '0')}`;

    const isPenalty = waiver.category === 'PENALTY';
    const isInterest = waiver.category === 'INTEREST';

    const result = await prisma.$transaction(async (tx) => {
      // 1. If linked to a charge, update the charge record
      if (waiver.chargeId && waiver.charge) {
        const currentWaived = Number(waiver.charge.waivedAmount || 0);
        const currentOutstanding = Number(waiver.charge.outstandingAmount ?? waiver.charge.totalAmount);
        const newWaived = currentWaived + amountToWaive;
        const newOutstanding = Math.max(0, currentOutstanding - amountToWaive);

        await tx.loanCharge.update({
          where: { id: waiver.chargeId },
          data: {
            waivedAmount: newWaived,
            outstandingAmount: newOutstanding,
            status: newOutstanding === 0 ? 'WAIVED' : 'PARTIALLY_PAID',
          },
        });
      }

      // 2. Recalculate and update Loan Balances
      let balanceDelta = {};
      if (isPenalty) {
        balanceDelta = { penaltyDelta: -amountToWaive };
      } else if (isInterest) {
        balanceDelta = { interestDelta: -amountToWaive };
      } else {
        balanceDelta = { feeDelta: -amountToWaive };
      }

      const updatedBalances = recalculateLoanBalances(loan as any, balanceDelta);

      await tx.loanAccount.update({
        where: { id: loan.id },
        data: {
          feeOutstanding: updatedBalances.feeOutstanding,
          penaltyOutstanding: updatedBalances.penaltyOutstanding,
          interestOutstanding: updatedBalances.interestOutstanding,
          totalOutstanding: updatedBalances.totalOutstanding,
        },
      });

      // 3. Create Loan Transaction
      await tx.loanTransaction.create({
        data: {
          loanId: loan.id,
          accountNumber: loan.accountNumber,
          transactionReference: txnReference,
          transactionType: 'WAIVER',
          amount: -amountToWaive,
          principalPortion: 0,
          interestPortion: isInterest ? -amountToWaive : 0,
          feePortion: !isInterest && !isPenalty ? -amountToWaive : 0,
          penaltyPortion: isPenalty ? -amountToWaive : 0,
          status: 'SUCCESSFUL',
          transactionDate: new Date().toISOString().split('T')[0],
          createdBy: actorName || 'Operations Officer',
          notes: `Applied ${waiver.waiverType.replace(/_/g, ' ')} (${waiver.waiverNumber}). Category: ${waiver.category}.`,
        },
      });

      // 4. Log Loan History
      await tx.loanHistory.create({
        data: {
          loanId: loan.id,
          action: 'WAIVER_APPLIED',
          actor: actorId || 'usr_ops_01',
          actorName: actorName || 'Operations Officer',
          actorRole: actorRole || 'Operations Officer',
          previousState: `Total Dues: ₹${loan.totalOutstanding}`,
          newState: `Total Dues: ₹${updatedBalances.totalOutstanding}`,
          amount: -amountToWaive,
          reference: waiver.waiverNumber,
          notes: `Waiver ${waiver.waiverNumber} applied for ₹${amountToWaive}. Reason: ${waiver.reason}`,
        },
      });

      // 5. Update Waiver Request status
      const updatedWaiver = await tx.waiverRequest.update({
        where: { id: waiver.id },
        data: {
          status: 'APPLIED',
          appliedAt: new Date(),
          appliedBy: actorId || 'usr_ops_01',
          resultingTransactionRef: txnReference,
        },
      });

      return updatedWaiver;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API /waivers/[id]/apply POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
