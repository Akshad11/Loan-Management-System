import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateFinancialReconciliation } from '@/services/closureEngine';
import { roundMoney } from '@/services/loanFinancialService';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, 'close_loan');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params; const id = resolvedParams?.id;
    const body = await request.json();
    const {
      receivedPaymentAmount,
      paymentReference,
      closureNotes,
      actorId,
      actorName,
      actorRole,
    } = body;

    const closureReq = await prisma.loanClosureRequest.findFirst({
      where: { OR: [{ id }, { requestNumber: id }] },
      include: { loan: true, settlementProposal: true },
    });

    if (!closureReq) {
      return NextResponse.json({ error: 'Closure request not found.' }, { status: 404 });
    }

    if (closureReq.status === 'CLOSED') {
      return NextResponse.json({ error: 'This loan closure has already been executed.' }, { status: 409 });
    }

    if (!['APPROVED', 'PAYMENT_PENDING'].includes(closureReq.status)) {
      return NextResponse.json(
        { error: `Cannot execute closure with status '${closureReq.status}'. Must be APPROVED first.` },
        { status: 400 }
      );
    }

    const loan = closureReq.loan;
    const recPayment = Number(receivedPaymentAmount || closureReq.finalPayableAmount);

    // Financial Reconciliation Validation
    const reconciliation = validateFinancialReconciliation({
      loan: loan as any,
      request: closureReq as any,
      receivedPaymentAmount: recPayment,
    });

    if (!reconciliation.reconciled) {
      // Record partial payment without closing the loan
      await prisma.loanClosureRequest.update({
        where: { id: closureReq.id },
        data: {
          paidAmount: recPayment,
          status: 'PAYMENT_PENDING',
        },
      });

      return NextResponse.json(
        {
          error: reconciliation.reason,
          status: 'PAYMENT_PENDING',
          paidAmount: recPayment,
        },
        { status: 422 }
      );
    }

    const txCount = await prisma.loanTransaction.count();
    const txnReference = `TXN-CLR-${new Date().getFullYear()}-${String(txCount + 101).padStart(6, '0')}`;
    const nocCount = await prisma.nocRecord.count();
    const nocNumber = `NOC-${new Date().getFullYear()}-${String(nocCount + 101).padStart(6, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    const concessionAmt = Number(closureReq.concessionAmount || 0);

    const result = await prisma.$transaction(async (tx) => {
      // 1. If Settlement Concession exists, create concession adjustment transaction
      if (concessionAmt > 0) {
        const adjCount = await prisma.financialAdjustmentRequest.count();
        const adjNumber = `ADJ-SET-${new Date().getFullYear()}-${String(adjCount + 101).padStart(6, '0')}`;

        await tx.financialAdjustmentRequest.create({
          data: {
            adjustmentNumber: adjNumber,
            loanId: loan.id,
            customerId: loan.customerId,
            accountNumber: loan.accountNumber,
            customerName: loan.customerName,
            adjustmentType: 'CREDIT_ADJUSTMENT',
            amount: concessionAmt,
            principalAdjustment: closureReq.settlementProposal
              ? Number(closureReq.settlementProposal.principalConcession)
              : concessionAmt,
            interestAdjustment: closureReq.settlementProposal
              ? Number(closureReq.settlementProposal.interestConcession)
              : 0,
            feeAdjustment: closureReq.settlementProposal
              ? Number(closureReq.settlementProposal.feePenaltyConcession)
              : 0,
            effectiveDate: today,
            reason: `Settlement concession granted under OTS request ${closureReq.requestNumber}.`,
            status: 'APPLIED',
            requestedBy: closureReq.requestedBy,
            requestedByName: closureReq.requestedByName,
            requestedByRole: closureReq.requestedByRole,
            approvedBy: closureReq.approvedBy,
            approvedByName: closureReq.approvedByName,
            approvedByRole: closureReq.approvedByRole,
            appliedAt: new Date(),
            appliedBy: actorId || 'usr_ops_01',
            resultingTransactionRef: txnReference,
          },
        });
      }

      // 2. Update Loan Account Status to CLOSED and zero all balances
      const totalPaid = roundMoney(Number(loan.totalPaidAmount || 0) + recPayment);
      await tx.loanAccount.update({
        where: { id: loan.id },
        data: {
          status: 'CLOSED',
          outstandingPrincipal: 0,
          interestOutstanding: 0,
          feeOutstanding: 0,
          penaltyOutstanding: 0,
          totalOutstanding: 0,
          totalPaidAmount: totalPaid,
        },
      });

      // 3. Mark future active repayment schedule items as CANCELLED
      await tx.repaymentSchedule.updateMany({
        where: {
          loanId: loan.id,
          status: { in: ['FUTURE', 'DUE', 'OVERDUE'] },
        },
        data: {
          status: 'CANCELLED',
        },
      });

      // 4. Resolve any open Recovery Cases
      await tx.recoveryCase.updateMany({
        where: {
          loanId: loan.id,
          status: { notIn: ['CLOSED', 'CANCELLED', 'CURED'] },
        },
        data: {
          status: 'CLOSED',
          recoveryStage: 'RESOLVED',
          resolutionOutcome: closureReq.closureType === 'SETTLEMENT' ? 'SETTLED' : 'FULL_PAYMENT',
          resolutionNotes: `Loan fully resolved through ${closureReq.closureType} (${closureReq.requestNumber}).`,
        },
      });

      // 5. Create Final Closure Transaction
      await tx.loanTransaction.create({
        data: {
          loanId: loan.id,
          accountNumber: loan.accountNumber,
          transactionReference: txnReference,
          transactionType: 'LOAN_CLOSURE',
          amount: -recPayment,
          principalPortion: -Number(closureReq.principalOutstanding),
          interestPortion: -Number(closureReq.interestOutstanding),
          feePortion: -Number(closureReq.feeOutstanding),
          penaltyPortion: -Number(closureReq.penaltyOutstanding),
          status: 'SUCCESSFUL',
          transactionDate: today,
          createdBy: actorName || 'Operations Officer',
          notes: `Account fully closed via ${closureReq.closureType} (${closureReq.requestNumber}). Payment: ₹${recPayment.toLocaleString()}`,
        },
      });

      // 6. Log Loan History
      await tx.loanHistory.create({
        data: {
          loanId: loan.id,
          action: 'LOAN_CLOSED',
          actor: actorId || 'usr_ops_01',
          actorName: actorName || 'Operations Officer',
          actorRole: actorRole || 'Operations Officer',
          previousState: `Status: ${loan.status} | Exposure: ₹${loan.totalOutstanding}`,
          newState: 'Status: CLOSED | Outstanding: ₹0.00',
          amount: recPayment,
          reference: closureReq.requestNumber,
          notes: `Loan ${loan.accountNumber} successfully closed. NOC initialized.`,
        },
      });

      // 7. Update Loan Closure Request to CLOSED
      const updatedClosure = await tx.loanClosureRequest.update({
        where: { id: closureReq.id },
        data: {
          status: 'CLOSED',
          paidAmount: recPayment,
          closedAt: new Date(),
          closedBy: actorId || 'usr_ops_01',
          closureNotes: closureNotes || `Loan successfully closed on ${today}.`,
          reconciliationTransactionRef: txnReference,
        },
      });

      // 8. Automatically generate NOC record in READY status
      const createdNoc = await tx.nocRecord.create({
        data: {
          nocNumber,
          loanId: loan.id,
          customerId: loan.customerId,
          accountNumber: loan.accountNumber,
          customerName: loan.customerName,
          closureRequestId: closureReq.id,
          closureType: closureReq.closureType,
          closureDate: today,
          sanctionedAmount: loan.originalPrincipal || loan.disbursedPrincipal,
          disbursedAmount: loan.disbursedPrincipal,
          totalRecoveredAmount: totalPaid,
          status: 'READY',
          documentReference: `DOC-${nocNumber}`,
          generatedBy: actorName || 'Operations Officer',
          generatedAt: new Date(),
        },
      });

      // 9. Log Closure Event
      await tx.closureEvent.create({
        data: {
          closureRequestId: closureReq.id,
          eventType: 'LOAN_CLOSED',
          actor: actorId || 'usr_ops_01',
          actorName: actorName || 'Operations Officer',
          actorRole: actorRole || 'Operations Officer',
          title: `Loan ${loan.accountNumber} Closed`,
          description: `Account closed with 0 balance. NOC ${nocNumber} generated.`,
          amount: recPayment,
        },
      });

      return {
        closureRequest: updatedClosure,
        noc: createdNoc,
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API /closures/[id]/reconcile-close POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
