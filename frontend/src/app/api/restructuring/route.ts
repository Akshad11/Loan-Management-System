import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  evaluateRestructuringEligibility,
  generateRestructuringSchedulePreview,
} from '@/services/restructuringEngine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, ["view_loans","view_repayments"]);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const requestType = searchParams.get('requestType');
    const branchId = searchParams.get('branchId');
    const loanId = searchParams.get('loanId');
    const customerId = searchParams.get('customerId');
    const search = searchParams.get('search');

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (requestType && requestType !== 'ALL') where.requestType = requestType;
    if (branchId && branchId !== 'ALL') where.branchId = branchId;
    if (loanId) where.loanId = loanId;
    if (customerId) where.customerId = customerId;

    if (search) {
      where.OR = [
        { requestNumber: { contains: search, mode: 'insensitive' } },
        { accountNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const requests = await prisma.restructuringRequest.findMany({
      where,
      include: {
        events: { orderBy: { timestamp: 'desc' } },
        proposals: true,
        loan: {
          select: {
            id: true,
            accountNumber: true,
            status: true,
            dpd: true,
            totalOutstanding: true,
            outstandingPrincipal: true,
            interestRate: true,
            emiAmount: true,
            currentScheduleVersion: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Server-side Aggregated KPIs
    const allRequests = await prisma.restructuringRequest.findMany({
      select: {
        status: true,
        proposedPrincipal: true,
        emiDifference: true,
        tenureDifference: true,
        createdAt: true,
      },
    });

    const currentMonth = new Date().toISOString().slice(0, 7);
    const kpis = {
      totalRequests: allRequests.length,
      pendingRequests: allRequests.filter((r) => r.status === 'SUBMITTED').length,
      underReview: allRequests.filter((r) => r.status === 'UNDER_REVIEW').length,
      approved: allRequests.filter((r) => r.status === 'APPROVED').length,
      rejected: allRequests.filter((r) => r.status === 'REJECTED').length,
      effectiveThisMonth: allRequests.filter(
        (r) => r.status === 'EFFECTIVE' && r.createdAt.toISOString().startsWith(currentMonth)
      ).length,
      totalRestructuredExposure: allRequests
        .filter((r) => r.status === 'EFFECTIVE' || r.status === 'APPROVED')
        .reduce((sum, r) => sum + Number(r.proposedPrincipal || 0), 0),
      avgEmiDelta:
        allRequests.length > 0
          ? Math.round(allRequests.reduce((sum, r) => sum + Number(r.emiDifference || 0), 0) / allRequests.length)
          : 0,
      avgTenureDeltaMonths:
        allRequests.length > 0
          ? Math.round(allRequests.reduce((sum, r) => sum + Number(r.tenureDifference || 0), 0) / allRequests.length)
          : 0,
    };

    return NextResponse.json({
      requests,
      kpis,
      totalCount: requests.length,
    });
  } catch (error: any) {
    console.error('API /restructuring GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, 'manage_repayments');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const {
      loanId,
      requestType,
      reason,
      effectiveDate,
      proposedTenureMonths,
      proposedInterestRate,
      proposedEmiAmount,
      proposedRepaymentFrequency,
      proposedFirstDueDate,
      moratoriumMonths = 0,
      moratoriumInterestTreatment = 'ACCRUE_AND_AMORTIZE',
      moratoriumPrincipalTreatment = 'DEFER',
      moratoriumFeeTreatment = 'REMAIN_DUE',
      feeTreatment = 'REMAIN_DUE',
      penaltyTreatment = 'REMAIN_DUE',
      consentReceived = false,
      consentMethod,
      consentDocumentRef,
      requestedBy,
      requestedByName,
      requestedByRole,
      assignedOfficer,
      assignedOfficerId,
      status = 'SUBMITTED',
    } = body;

    if (!loanId) {
      return NextResponse.json({ error: 'Loan ID is required.' }, { status: 400 });
    }

    const loan = await prisma.loanAccount.findFirst({
      where: { OR: [{ id: loanId }, { accountNumber: loanId }] },
    });

    if (!loan) {
      return NextResponse.json({ error: 'Loan account not found.' }, { status: 404 });
    }

    // Check for active pending restructuring
    const activeRestructuring = await prisma.restructuringRequest.findFirst({
      where: {
        loanId: loan.id,
        status: { in: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED'] },
      },
    });

    // Check for active legal cases
    const activeLegalCase = await prisma.legalCase.findFirst({
      where: {
        loanId: loan.id,
        status: { notIn: ['SETTLED', 'WITHDRAWN', 'CLOSED'] },
      },
    });

    // Server-side eligibility evaluation
    const eligibility = evaluateRestructuringEligibility({
      loan: loan as any,
      hasActiveRestructuring: !!activeRestructuring,
      activeLegalCaseStatus: activeLegalCase?.status,
    });

    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          error: 'Loan is not eligible for restructuring.',
          reasons: eligibility.blockers,
        },
        { status: 422 }
      );
    }

    // Calculate server-side authoritative financial preview and impact
    const firstDueDate = proposedFirstDueDate || effectiveDate || new Date().toISOString().split('T')[0];
    const previewResult = generateRestructuringSchedulePreview({
      loan: loan as any,
      requestType,
      proposedTenureMonths: Number(proposedTenureMonths),
      proposedInterestRate: Number(proposedInterestRate),
      proposedRepaymentFrequency: (proposedRepaymentFrequency || loan.repaymentFrequency) as any,
      proposedFirstDueDate: firstDueDate,
      moratoriumMonths: Number(moratoriumMonths),
      moratoriumInterestTreatment: moratoriumInterestTreatment as any,
      moratoriumPrincipalTreatment: moratoriumPrincipalTreatment as any,
      targetEmiAmount: proposedEmiAmount ? Number(proposedEmiAmount) : undefined,
    });

    const count = await prisma.restructuringRequest.count();
    const requestSeq = count + 101;
    const requestNumber = `REQ-${new Date().getFullYear()}-${String(requestSeq).padStart(6, '0')}`;

    const newRequest = await prisma.$transaction(async (tx) => {
      const created = await tx.restructuringRequest.create({
        data: {
          requestNumber,
          loanId: loan.id,
          accountNumber: loan.accountNumber,
          customerId: loan.customerId,
          customerNumber: loan.customerNumber,
          customerName: loan.customerName,
          requestType,
          reason,
          requestedBy: requestedBy || 'usr_ops_01',
          requestedByName: requestedByName || 'Operations Officer',
          requestedByRole: requestedByRole || 'Operations Officer',
          requestedAt: new Date(),
          effectiveDate: effectiveDate || firstDueDate,
          status,
          assignedOfficer: assignedOfficer || 'Senior Credit Underwriter',
          assignedOfficerId: assignedOfficerId || 'usr_credit_01',
          branchId: loan.branchId || 'br_panjim',
          branchName: loan.branchName || 'Panjim Main Branch',

          // Current Terms Snapshot
          currentPrincipalOutstanding: loan.outstandingPrincipal,
          currentInterestRate: loan.interestRate,
          currentRemainingTenureMonths: loan.remainingTenureMonths,
          currentEmiAmount: loan.emiAmount,
          currentRepaymentFrequency: loan.repaymentFrequency,
          currentNextDueDate: loan.nextDueDate,
          currentMaturityDate: loan.maturityDate,
          currentDpd: loan.dpd,
          currentOverdueAmount: loan.overdueAmount,
          currentScheduleVersion: loan.currentScheduleVersion,

          // Proposed Terms
          proposedPrincipal: previewResult.totalPrincipal,
          proposedInterestRate: Number(proposedInterestRate),
          proposedTenureMonths: Number(proposedTenureMonths),
          proposedEmiAmount: previewResult.emiAmount,
          proposedRepaymentFrequency: proposedRepaymentFrequency || loan.repaymentFrequency,
          proposedFirstDueDate: firstDueDate,
          proposedMaturityDate: previewResult.maturityDate,

          moratoriumMonths: Number(moratoriumMonths),
          moratoriumInterestTreatment,
          moratoriumPrincipalTreatment,
          moratoriumFeeTreatment,
          capitalizedAmount: 0,
          feeTreatment,
          penaltyTreatment,

          // Financial Impact
          currentRemainingInterest: previewResult.financialImpact.currentRemainingInterest,
          proposedRemainingInterest: previewResult.financialImpact.proposedRemainingInterest,
          interestDifference: previewResult.financialImpact.interestDifference,
          currentTotalScheduled: previewResult.financialImpact.currentTotalScheduled,
          proposedTotalScheduled: previewResult.financialImpact.proposedTotalScheduled,
          emiDifference: previewResult.financialImpact.emiDifference,
          tenureDifference: previewResult.financialImpact.tenureDifference,

          consentRequired: true,
          consentReceived,
          consentDate: consentReceived ? new Date().toISOString().split('T')[0] : null,
          consentMethod: consentMethod || null,
          consentDocumentRef: consentDocumentRef || null,
        },
      });

      // Log initial creation event
      await tx.restructuringEvent.create({
        data: {
          requestId: created.id,
          eventType: 'CREATED',
          actor: requestedBy || 'usr_ops_01',
          actorName: requestedByName || 'Operations Officer',
          actorRole: requestedByRole || 'Operations Officer',
          title: `Restructuring Request ${created.requestNumber} Initiated`,
          description: `Contractual restructuring (${requestType.replace(/_/g, ' ')}) created for ${loan.customerName}. Reason: ${reason}`,
        },
      });

      if (status === 'SUBMITTED') {
        await tx.restructuringEvent.create({
          data: {
            requestId: created.id,
            eventType: 'SUBMITTED',
            actor: requestedBy || 'usr_ops_01',
            actorName: requestedByName || 'Operations Officer',
            actorRole: requestedByRole || 'Operations Officer',
            title: 'Submitted for Underwriting Review',
            description: 'Request submitted into credit assessment queue.',
          },
        });
      }

      return created;
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error: any) {
    console.error('API /restructuring POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
