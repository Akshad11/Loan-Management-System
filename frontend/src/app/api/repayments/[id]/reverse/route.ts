import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { executePaymentReversal } from '@/services/repaymentAllocationEngine';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, 'reverse_repayment');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params; const id = resolvedParams?.id;
    const body = await request.json().catch(() => ({}));
    const {
      reason,
      notes,
      actorName = 'Branch Manager',
      actorRole = 'Branch Manager',
    } = body;

    if (!reason || reason.trim() === '') {
      return NextResponse.json({ error: 'Reversal reason is mandatory' }, { status: 400 });
    }

    const payment = await prisma.payment.findFirst({
      where: { OR: [{ id }, { paymentNumber: id }] },
      include: {
        allocations: true,
        receipt: true,
        reversal: true,
        history: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.status === 'REVERSED') {
      return NextResponse.json({ error: 'This payment has already been reversed.' }, { status: 400 });
    }

    if (
      payment.status !== 'POSTED' &&
      payment.status !== 'PARTIALLY_ALLOCATED' &&
      payment.status !== 'FULLY_ALLOCATED'
    ) {
      return NextResponse.json(
        { error: `Only posted payments can be reversed. Current status: ${payment.status}` },
        { status: 400 }
      );
    }

    const loan = await prisma.loanAccount.findUnique({
      where: { id: payment.loanId },
      include: {
        schedules: {
          orderBy: { instalmentNumber: 'asc' },
        },
        charges: true,
      },
    });

    if (!loan) {
      return NextResponse.json({ error: 'Associated loan account not found' }, { status: 404 });
    }

    const domainLoan: any = {
      ...loan,
      originalPrincipal: Number(loan.originalPrincipal),
      disbursedPrincipal: Number(loan.disbursedPrincipal),
      principalOutstanding: Number(loan.outstandingPrincipal),
      interestOutstanding: Number(loan.interestOutstanding),
      feeOutstanding: Number(loan.feeOutstanding),
      penaltyOutstanding: Number(loan.penaltyOutstanding),
      totalOutstanding: Number(loan.totalOutstanding),
      totalPaidAmount: Number(loan.totalPaidAmount),
      totalPrincipalPaid: Number(loan.totalPrincipalPaid),
      totalInterestPaid: Number(loan.totalInterestPaid),
      totalFeesPaid: Number(loan.totalFeesPaid),
      overdueAmount: Number(loan.overdueAmount),
      emiAmount: Number(loan.emiAmount),
      charges: loan.charges.map((c) => ({
        ...c,
        amount: Number(c.amount),
        taxAmount: Number(c.taxAmount),
        totalAmount: Number(c.totalAmount),
        rateOrValue: Number(c.rateOrValue),
      })),
      schedules: loan.schedules.map((s) => ({
        ...s,
        openingPrincipal: Number(s.openingPrincipal),
        principalDue: Number(s.principalDue),
        interestDue: Number(s.interestDue),
        feesDue: Number(s.feesDue),
        instalmentAmount: Number(s.instalmentAmount),
        closingPrincipal: Number(s.closingPrincipal),
        principalPaid: Number(s.principalPaid),
        interestPaid: Number(s.interestPaid),
        feesPaid: Number(s.feesPaid),
        totalPaid: Number(s.totalPaid),
        outstandingAmount: Number(s.outstandingAmount),
      })),
    };

    const domainPayment: any = {
      ...payment,
      amount: Number(payment.amount),
      allocatedAmount: Number(payment.allocatedAmount),
      unallocatedAmount: Number(payment.unallocatedAmount),
      allocations: payment.allocations.map((a) => ({
        ...a,
        amount: Number(a.amount),
      })),
    };

    const reversalResult = executePaymentReversal({
      payment: domainPayment,
      loan: domainLoan,
      reason,
      notes,
      actorName,
      actorRole,
    });

    const reversedPayment = await prisma.$transaction(async (tx) => {
      // 1. Update allocations to REVERSED
      await tx.paymentAllocation.updateMany({
        where: { paymentId: payment.id },
        data: { status: 'REVERSED' },
      });

      // 2. Restore Schedules
      for (const sch of reversalResult.updatedSchedules) {
        await tx.repaymentSchedule.update({
          where: { id: sch.id },
          data: {
            principalPaid: sch.principalPaid,
            interestPaid: sch.interestPaid,
            feesPaid: sch.feesPaid,
            totalPaid: sch.totalPaid,
            outstandingAmount: sch.outstandingAmount,
            status: sch.status,
            paidDate: sch.paidDate || null,
            paymentReference: sch.paymentReference || null,
          },
        });
      }

      // 3. Restore Charges
      for (const chg of reversalResult.updatedCharges) {
        await tx.loanCharge.update({
          where: { id: chg.id },
          data: { status: chg.status },
        });
      }

      // 4. Restore Loan Balances
      await tx.loanAccount.update({
        where: { id: loan.id },
        data: {
          outstandingPrincipal: reversalResult.updatedLoan.principalOutstanding!,
          interestOutstanding: reversalResult.updatedLoan.interestOutstanding!,
          feeOutstanding: reversalResult.updatedLoan.feeOutstanding!,
          penaltyOutstanding: reversalResult.updatedLoan.penaltyOutstanding!,
          totalOutstanding: reversalResult.updatedLoan.totalOutstanding!,
          totalPaidAmount: reversalResult.updatedLoan.totalPaidAmount!,
          totalPrincipalPaid: reversalResult.updatedLoan.totalPrincipalPaid!,
          totalInterestPaid: reversalResult.updatedLoan.totalInterestPaid!,
          totalFeesPaid: reversalResult.updatedLoan.totalFeesPaid!,
          updatedBy: actorName,
        },
      });

      // 5. Compensating Transaction
      const compTxn = await tx.loanTransaction.create({
        data: {
          loanId: loan.id,
          accountNumber: loan.accountNumber,
          transactionReference: reversalResult.compensatingTransaction.transactionReference,
          transactionType: 'REVERSAL',
          amount: reversalResult.compensatingTransaction.amount,
          principalPortion: reversalResult.compensatingTransaction.principalPortion,
          interestPortion: reversalResult.compensatingTransaction.interestPortion,
          feePortion: reversalResult.compensatingTransaction.feePortion,
          penaltyPortion: reversalResult.compensatingTransaction.penaltyPortion,
          status: 'SUCCESSFUL',
          referenceId: payment.paymentNumber,
          notes: reversalResult.compensatingTransaction.notes,
          transactionDate: new Date().toISOString().split('T')[0],
          createdBy: actorName,
        },
      });

      // 6. Payment Reversal Record
      await tx.paymentReversal.create({
        data: {
          reversalNumber: reversalResult.reversalRecord.reversalNumber,
          paymentId: payment.id,
          loanId: loan.id,
          amount: payment.amount,
          reason,
          notes,
          reversedBy: actorName,
          reversedByName: actorName,
          compensatingTxnId: compTxn.id,
        },
      });

      // 7. Loan History
      await tx.loanHistory.create({
        data: {
          loanId: loan.id,
          action: 'PAYMENT_REVERSED',
          actor: actorName,
          actorName,
          actorRole,
          amount: payment.amount,
          reference: reversalResult.reversalRecord.reversalNumber,
          reason,
          notes: reversalResult.loanHistoryEntry.notes,
        },
      });

      // 8. Payment History
      await tx.paymentHistory.create({
        data: {
          paymentId: payment.id,
          event: 'REVERSED',
          actor: actorName,
          actorName,
          actorRole,
          previousState: payment.status,
          newState: 'REVERSED',
          amount: payment.amount,
          reference: reversalResult.reversalRecord.reversalNumber,
          reason,
          notes: `Payment reversed by ${actorName}. Reversal Ref: ${reversalResult.reversalRecord.reversalNumber}.`,
        },
      });

      // 9. Update Payment status
      return await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REVERSED',
          reversedBy: actorName,
          reversedByName: actorName,
          reversedAt: new Date(),
          reversalReason: reason,
        },
        include: {
          allocations: true,
          receipt: true,
          reversal: true,
          history: true,
        },
      });
    });

    return NextResponse.json({
      ...reversedPayment,
      amount: Number(reversedPayment.amount),
      allocatedAmount: Number(reversedPayment.allocatedAmount),
      unallocatedAmount: Number(reversedPayment.unallocatedAmount),
    });
  } catch (error: any) {
    console.error('Error reversing payment:', error);
    return NextResponse.json({ error: error.message || 'Failed to reverse payment' }, { status: 500 });
  }
}
