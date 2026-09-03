import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateRestructuringSchedulePreview } from '@/services/restructuringEngine';
import { roundMoney } from '@/services/loanFinancialService';

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

    const restructuring = await prisma.restructuringRequest.findFirst({
      where: { OR: [{ id }, { requestNumber: id }] },
      include: { loan: true },
    });

    if (!restructuring) {
      return NextResponse.json({ error: 'Restructuring request not found.' }, { status: 404 });
    }

    // Idempotency & Status Guard
    if (restructuring.status === 'EFFECTIVE') {
      return NextResponse.json(
        { error: 'This restructuring request has already been applied and is currently effective.' },
        { status: 409 }
      );
    }

    if (restructuring.status !== 'APPROVED') {
      return NextResponse.json(
        { error: `Cannot apply restructuring with status '${restructuring.status}'. Request must be APPROVED first.` },
        { status: 400 }
      );
    }

    const loan = restructuring.loan;
    const newVersionNumber = loan.currentScheduleVersion + 1;
    const firstDueDate = restructuring.proposedFirstDueDate || restructuring.effectiveDate;

    // Generate authoritative new schedule
    const preview = generateRestructuringSchedulePreview({
      loan: loan as any,
      requestType: restructuring.requestType as any,
      proposedTenureMonths: restructuring.proposedTenureMonths,
      proposedInterestRate: Number(restructuring.proposedInterestRate),
      proposedRepaymentFrequency: restructuring.proposedRepaymentFrequency as any,
      proposedFirstDueDate: firstDueDate,
      moratoriumMonths: restructuring.moratoriumMonths || 0,
      moratoriumInterestTreatment: (restructuring.moratoriumInterestTreatment as any) || 'ACCRUE_AND_AMORTIZE',
      moratoriumPrincipalTreatment: (restructuring.moratoriumPrincipalTreatment as any) || 'DEFER',
      capitalizedAmount: Number(restructuring.capitalizedAmount || 0),
      targetEmiAmount: Number(restructuring.proposedEmiAmount),
    });

    const txCount = await prisma.loanTransaction.count();
    const txnReference = `TXN-RES-${new Date().getFullYear()}-${String(txCount + 101).padStart(6, '0')}`;

    const appliedResult = await prisma.$transaction(async (tx) => {
      // 1. Supersede previous active schedule version
      await tx.repaymentScheduleVersion.updateMany({
        where: { loanId: loan.id, status: 'ACTIVE' },
        data: { status: 'SUPERSEDED' },
      });

      // 2. Create New Schedule Version
      const newVersion = await tx.repaymentScheduleVersion.create({
        data: {
          loanId: loan.id,
          version: newVersionNumber,
          reason: `Restructuring ${restructuring.requestNumber} (${restructuring.requestType})`,
          effectiveDate: restructuring.effectiveDate,
          totalInstalments: preview.totalInstalments,
          totalPrincipal: preview.totalPrincipal,
          totalInterest: preview.totalInterest,
          totalAmount: preview.totalAmount,
          status: 'ACTIVE',
          createdBy: actorName || 'Operations Officer',
        },
      });

      // 3. Persist New Schedule Items
      const scheduleItemsData = preview.schedules.map((item) => ({
        loanId: loan.id,
        versionId: newVersion.id,
        versionNumber: newVersionNumber,
        instalmentNumber: item.instalmentNumber,
        dueDate: item.dueDate,
        openingPrincipal: item.openingPrincipal,
        principalDue: item.principalDue,
        interestDue: item.interestDue,
        feesDue: item.feesDue,
        instalmentAmount: item.instalmentAmount,
        closingPrincipal: item.closingPrincipal,
        principalPaid: 0,
        interestPaid: 0,
        feesPaid: 0,
        totalPaid: 0,
        outstandingAmount: item.instalmentAmount,
        status: item.instalmentNumber === 1 ? ('DUE' as const) : ('FUTURE' as const),
        dpd: 0,
      }));

      await tx.repaymentSchedule.createMany({
        data: scheduleItemsData,
      });

      // 4. Update Loan Account Terms
      const capitalized = Number(restructuring.capitalizedAmount || 0);
      const updatedOutstandingPrincipal = roundMoney(Number(loan.outstandingPrincipal) + capitalized);
      const updatedTotalOutstanding = roundMoney(Number(loan.totalOutstanding) + capitalized);

      await tx.loanAccount.update({
        where: { id: loan.id },
        data: {
          currentScheduleVersion: newVersionNumber,
          interestRate: Number(restructuring.proposedInterestRate),
          remainingTenureMonths: restructuring.proposedTenureMonths,
          remainingInstalments: preview.totalInstalments,
          emiAmount: preview.emiAmount,
          repaymentFrequency: restructuring.proposedRepaymentFrequency,
          nextDueDate: firstDueDate,
          maturityDate: preview.maturityDate,
          outstandingPrincipal: updatedOutstandingPrincipal,
          totalOutstanding: updatedTotalOutstanding,
          updatedBy: actorName || 'Operations Officer',
        },
      });

      // 5. Record Financial Adjustment Transaction
      await tx.loanTransaction.create({
        data: {
          loanId: loan.id,
          accountNumber: loan.accountNumber,
          transactionReference: txnReference,
          transactionType: capitalized > 0 ? 'CAPITALIZATION' : 'RESTRUCTURE',
          amount: capitalized > 0 ? capitalized : preview.emiAmount,
          principalPortion: capitalized > 0 ? capitalized : 0,
          interestPortion: 0,
          feePortion: 0,
          penaltyPortion: 0,
          status: 'SUCCESSFUL',
          transactionDate: restructuring.effectiveDate,
          createdBy: actorName || 'Operations Officer',
          notes: `Applied Restructuring ${restructuring.requestNumber}. Schedule Version ${newVersionNumber} active.`,
        },
      });

      // 6. Record Loan History
      await tx.loanHistory.create({
        data: {
          loanId: loan.id,
          action: 'LOAN_RESTRUCTURED',
          actor: actorId || 'usr_ops_01',
          actorName: actorName || 'Operations Officer',
          actorRole: actorRole || 'Operations Officer',
          previousState: `Version ${loan.currentScheduleVersion} (EMI ₹${loan.emiAmount}, Rate ${loan.interestRate}%)`,
          newState: `Version ${newVersionNumber} (EMI ₹${preview.emiAmount}, Rate ${restructuring.proposedInterestRate}%, Tenure ${restructuring.proposedTenureMonths}m)`,
          amount: preview.emiAmount,
          reference: restructuring.requestNumber,
          reason: restructuring.reason,
          notes: `Restructuring applied. Effective date: ${restructuring.effectiveDate}.`,
        },
      });

      // 7. Update Restructuring Request to EFFECTIVE
      const updatedReq = await tx.restructuringRequest.update({
        where: { id: restructuring.id },
        data: {
          status: 'EFFECTIVE',
          appliedAt: new Date(),
          appliedBy: actorId || 'usr_ops_01',
          appliedByName: actorName || 'Operations Officer',
          resultingScheduleVersionId: newVersion.id,
          resultingScheduleVersionNumber: newVersionNumber,
        },
      });

      // 8. Log Restructuring Event
      await tx.restructuringEvent.create({
        data: {
          requestId: restructuring.id,
          eventType: 'APPLIED_EFFECTIVE',
          actor: actorId || 'usr_ops_01',
          actorName: actorName || 'Operations Officer',
          actorRole: actorRole || 'Operations Officer',
          title: `Schedule Version ${newVersionNumber} Activated`,
          description: `Contractual restructuring successfully applied. New terms effective from ${restructuring.effectiveDate}.`,
        },
      });

      return {
        request: updatedReq,
        scheduleVersion: newVersion,
        newEmiAmount: preview.emiAmount,
        newMaturityDate: preview.maturityDate,
        newVersionNumber,
      };
    });

    return NextResponse.json(appliedResult);
  } catch (error: any) {
    console.error('API /restructuring/[id]/apply POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
