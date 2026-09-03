import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { executePaymentAllocation } from '@/services/repaymentAllocationEngine';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, 'post_repayment');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params; const id = resolvedParams?.id;
    const body = await request.json().catch(() => ({}));
    const { actorName = 'Operations Officer', actorRole = 'Operations Officer' } = body;

    const payment = await prisma.payment.findFirst({
      where: { OR: [{ id }, { paymentNumber: id }] },
      include: {
        allocations: true,
        receipt: true,
        history: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (
      payment.status === 'POSTED' ||
      payment.status === 'FULLY_ALLOCATED' ||
      payment.status === 'PARTIALLY_ALLOCATED'
    ) {
      return NextResponse.json({ error: 'This payment has already been posted.' }, { status: 400 });
    }

    if (payment.status === 'REVERSED' || payment.status === 'CANCELLED') {
      return NextResponse.json(
        { error: `Cannot post payment with status ${payment.status}` },
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

    // Convert Prisma types to domain record for allocation engine
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
    };

    // Execute core deterministic allocation engine
    const allocResult = executePaymentAllocation({
      loan: domainLoan,
      payment: domainPayment,
      actorName,
      actorRole,
    });

    // Execute atomic PostgreSQL database transaction
    const receiptNumber = `RCT-${new Date().getFullYear()}-${String(payment.paymentNumber.split('-')[2] || Math.floor(100000 + Math.random() * 900000))}`;

    const postedPayment = await prisma.$transaction(async (tx) => {
      // 1. Create Allocations
      for (const alloc of allocResult.allocations) {
        await tx.paymentAllocation.create({
          data: {
            paymentId: payment.id,
            loanId: loan.id,
            scheduleItemId: alloc.scheduleItemId || null,
            chargeId: alloc.chargeId || null,
            allocationType: alloc.allocationType,
            amount: alloc.amount,
            status: 'ACTIVE',
            createdBy: actorName,
          },
        });
      }

      // 2. Update Repayment Schedules
      for (const sch of allocResult.updatedSchedules) {
        await tx.repaymentSchedule.update({
          where: { id: sch.id },
          data: {
            principalPaid: sch.principalPaid,
            interestPaid: sch.interestPaid,
            feesPaid: sch.feesPaid,
            totalPaid: sch.totalPaid,
            outstandingAmount: sch.outstandingAmount,
            status: sch.status,
            paidDate: sch.paidDate,
            paymentReference: sch.paymentReference,
          },
        });
      }

      // 3. Update Charges
      for (const chg of allocResult.updatedCharges) {
        await tx.loanCharge.update({
          where: { id: chg.id },
          data: {
            status: chg.status,
          },
        });
      }

      // 4. Update Loan Balances
      await tx.loanAccount.update({
        where: { id: loan.id },
        data: {
          outstandingPrincipal: allocResult.updatedLoan.principalOutstanding!,
          interestOutstanding: allocResult.updatedLoan.interestOutstanding!,
          feeOutstanding: allocResult.updatedLoan.feeOutstanding!,
          penaltyOutstanding: allocResult.updatedLoan.penaltyOutstanding!,
          totalOutstanding: allocResult.updatedLoan.totalOutstanding!,
          totalPaidAmount: allocResult.updatedLoan.totalPaidAmount!,
          totalPrincipalPaid: allocResult.updatedLoan.totalPrincipalPaid!,
          totalInterestPaid: allocResult.updatedLoan.totalInterestPaid!,
          totalFeesPaid: allocResult.updatedLoan.totalFeesPaid!,
          overdueAmount: allocResult.updatedLoan.overdueAmount!,
          dpd: allocResult.updatedLoan.dpd!,
          dpdBucket: allocResult.updatedLoan.dpdBucket!,
          status: allocResult.updatedLoan.status!,
          updatedBy: actorName,
        },
      });

      // 5. Create Loan Transaction
      await tx.loanTransaction.create({
        data: {
          loanId: loan.id,
          accountNumber: loan.accountNumber,
          transactionReference: allocResult.repaymentTransaction.transactionReference,
          transactionType: 'REPAYMENT',
          amount: allocResult.repaymentTransaction.amount,
          principalPortion: allocResult.repaymentTransaction.principalPortion,
          interestPortion: allocResult.repaymentTransaction.interestPortion,
          feePortion: allocResult.repaymentTransaction.feePortion,
          penaltyPortion: allocResult.repaymentTransaction.penaltyPortion,
          status: 'SUCCESSFUL',
          referenceId: payment.referenceNumber,
          utrNumber: payment.referenceNumber,
          paymentMethod: payment.paymentMethod,
          notes: allocResult.repaymentTransaction.notes,
          transactionDate: payment.paymentDate,
          createdBy: actorName,
        },
      });

      // 6. Create Loan History
      await tx.loanHistory.create({
        data: {
          loanId: loan.id,
          action: 'PAYMENT_POSTED',
          actor: actorName,
          actorName,
          actorRole,
          previousState: loan.status,
          newState: allocResult.updatedLoan.status || loan.status,
          amount: payment.amount,
          reference: payment.paymentNumber,
          notes: allocResult.loanHistoryEntry.notes,
        },
      });

      // 7. Create Receipt
      await tx.paymentReceipt.create({
        data: {
          receiptNumber,
          paymentId: payment.id,
          loanId: loan.id,
          customerId: loan.customerId,
          amount: payment.amount,
          paymentDate: payment.paymentDate,
          valueDate: payment.valueDate,
          paymentMethod: payment.paymentMethod,
          referenceNumber: payment.referenceNumber,
          allocationSummary: allocResult.receiptSummary as any,
          generatedBy: actorName,
        },
      });

      // 8. Create Unallocated Payment if excess
      if (allocResult.unallocatedRecord) {
        await tx.unallocatedPayment.create({
          data: {
            paymentId: payment.id,
            loanId: loan.id,
            customerId: loan.customerId,
            totalAmount: payment.amount,
            allocatedAmount: allocResult.allocatedAmount,
            remainingAmount: allocResult.unallocatedAmount,
            status: 'UNALLOCATED',
            reason: allocResult.unallocatedRecord.reason,
          },
        });
      }

      // 9. Update Payment record
      const finalPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status:
            allocResult.unallocatedAmount > 0 && allocResult.allocatedAmount > 0
              ? 'PARTIALLY_ALLOCATED'
              : 'POSTED',
          allocatedAmount: allocResult.allocatedAmount,
          unallocatedAmount: allocResult.unallocatedAmount,
          postingDate: new Date(),
          postedBy: actorName,
          postedByName: actorName,
          postedAt: new Date(),
          receiptNumber,
        },
        include: {
          allocations: true,
          receipt: true,
          reversal: true,
          history: true,
          unallocated: true,
        },
      });

      // 10. Create Payment History
      await tx.paymentHistory.create({
        data: {
          paymentId: payment.id,
          event: 'POSTED',
          actor: actorName,
          actorName,
          actorRole,
          previousState: payment.status,
          newState: finalPayment.status,
          amount: payment.amount,
          reference: receiptNumber,
          notes: 'Payment posted, allocated, and receipt generated.',
        },
      });

      return finalPayment;
    });

    return NextResponse.json({
      ...postedPayment,
      amount: Number(postedPayment.amount),
      allocatedAmount: Number(postedPayment.allocatedAmount),
      unallocatedAmount: Number(postedPayment.unallocatedAmount),
    });
  } catch (error: any) {
    console.error('Error posting payment:', error);
    return NextResponse.json({ error: error.message || 'Failed to post payment' }, { status: 500 });
  }
}
