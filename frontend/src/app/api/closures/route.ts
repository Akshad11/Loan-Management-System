import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  calculateForeclosureQuote,
  calculateSettlementConcession,
  validateClosureEligibility,
} from '@/services/closureEngine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, 'view_loans');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { searchParams } = new URL(request.url);
    const loanId = searchParams.get('loanId');
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');
    const closureType = searchParams.get('closureType');
    const search = searchParams.get('search');

    const where: any = {};
    if (loanId) where.loanId = loanId;
    if (customerId) where.customerId = customerId;
    if (status && status !== 'ALL') where.status = status;
    if (closureType && closureType !== 'ALL') where.closureType = closureType;

    if (search) {
      where.OR = [
        { requestNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { accountNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const closureRequests = await prisma.loanClosureRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        loan: {
          select: {
            id: true,
            accountNumber: true,
            customerName: true,
            status: true,
            outstandingPrincipal: true,
            interestOutstanding: true,
            feeOutstanding: true,
            penaltyOutstanding: true,
            totalOutstanding: true,
          },
        },
        foreclosureQuote: true,
        settlementProposal: true,
        nocRecord: true,
        events: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    const allRequests = await prisma.loanClosureRequest.findMany();
    const activeQuotesCount = allRequests.filter(
      (r) => r.closureType === 'FORECLOSURE' && ['SUBMITTED', 'APPROVED', 'PAYMENT_PENDING'].includes(r.status)
    ).length;
    const pendingSettlementsCount = allRequests.filter(
      (r) => r.closureType === 'SETTLEMENT' && ['SUBMITTED', 'UNDER_REVIEW'].includes(r.status)
    ).length;
    const pendingApprovalCount = allRequests.filter((r) => ['SUBMITTED', 'UNDER_REVIEW'].includes(r.status)).length;
    const closedLoansCount = allRequests.filter((r) => r.status === 'CLOSED').length;
    const totalSettlementVolume = allRequests
      .filter((r) => r.closureType === 'SETTLEMENT' && r.status === 'CLOSED')
      .reduce((sum, r) => sum + Number(r.finalPayableAmount || 0), 0);
    const totalConcessionsGranted = allRequests
      .filter((r) => r.status === 'CLOSED')
      .reduce((sum, r) => sum + Number(r.concessionAmount || 0), 0);

    const allNocs = await prisma.nocRecord.findMany();
    const pendingNocsCount = allNocs.filter((n) => n.status === 'READY' || n.status === 'GENERATED').length;
    const issuedNocsCount = allNocs.filter((n) => n.status === 'ISSUED').length;

    return NextResponse.json({
      requests: closureRequests,
      kpis: {
        activeQuotesCount,
        pendingSettlementsCount,
        pendingApprovalCount,
        closedLoansCount,
        totalSettlementVolume,
        totalConcessionsGranted,
        pendingNocsCount,
        issuedNocsCount,
        totalCount: allRequests.length,
      },
    });
  } catch (error: any) {
    console.error('API /closures GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, 'close_loan');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const {
      loanId,
      closureType = 'FORECLOSURE',
      calculationDate,
      foreclosureFeeRate = 2.0,
      taxPercentage = 18.0,
      proposedSettlementAmount,
      paymentDeadline,
      hardshipCategory,
      reason,
      requestedBy,
      requestedByName,
      requestedByRole,
    } = body;

    if (!loanId) {
      return NextResponse.json({ error: 'Loan ID is required.' }, { status: 400 });
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'Justification reason is mandatory.' }, { status: 400 });
    }

    const loan = await prisma.loanAccount.findFirst({
      where: { OR: [{ id: loanId }, { accountNumber: loanId }] },
    });

    if (!loan) {
      return NextResponse.json({ error: 'Loan account not found.' }, { status: 404 });
    }

    const eligibility = validateClosureEligibility(loan as any, closureType);
    if (!eligibility.eligible) {
      return NextResponse.json({ error: eligibility.reason }, { status: 422 });
    }

    const count = await prisma.loanClosureRequest.count();
    const requestNumber = `CLR-${new Date().getFullYear()}-${String(count + 101).padStart(6, '0')}`;

    if (closureType === 'FORECLOSURE') {
      const quote = calculateForeclosureQuote({
        loan: loan as any,
        calculationDate,
        foreclosureFeeRate,
        taxPercentage,
      });

      const fcqCount = await prisma.foreclosureQuote.count();
      const quoteNumber = `FCQ-${new Date().getFullYear()}-${String(fcqCount + 101).padStart(6, '0')}`;

      const result = await prisma.$transaction(async (tx) => {
        const closureReq = await tx.loanClosureRequest.create({
          data: {
            requestNumber,
            loanId: loan.id,
            customerId: loan.customerId,
            accountNumber: loan.accountNumber,
            customerName: loan.customerName,
            closureType: 'FORECLOSURE',
            status: 'SUBMITTED',
            calculationDate: quote.quoteDate,
            effectiveDate: quote.validUntil,
            requestedBy: requestedBy || 'usr_ops_01',
            requestedByName: requestedByName || 'Operations Officer',
            requestedByRole: requestedByRole || 'Operations Officer',
            reason,
            branchId: loan.branchId,
            branchName: loan.branchName,
            principalOutstanding: quote.principalOutstanding,
            interestOutstanding: quote.accruedInterest,
            feeOutstanding: quote.feesDue,
            penaltyOutstanding: quote.penaltiesDue,
            totalExposure: quote.principalOutstanding + quote.accruedInterest + quote.feesDue + quote.penaltiesDue,
            foreclosureChargeAmount: quote.foreclosureFeeAmount,
            foreclosureChargeTax: quote.foreclosureFeeTax,
            waiverAmount: quote.approvedWaivers,
            concessionAmount: 0,
            finalPayableAmount: quote.netPayableAmount,
            quoteValidUntil: quote.validUntil,
          },
        });

        await tx.foreclosureQuote.create({
          data: {
            quoteNumber,
            closureRequestId: closureReq.id,
            loanId: loan.id,
            quoteDate: quote.quoteDate,
            validUntil: quote.validUntil,
            principalOutstanding: quote.principalOutstanding,
            accruedInterest: quote.accruedInterest,
            feesDue: quote.feesDue,
            penaltiesDue: quote.penaltiesDue,
            foreclosureFeeRate: quote.foreclosureFeeRate,
            foreclosureFeeAmount: quote.foreclosureFeeAmount,
            foreclosureFeeTax: quote.foreclosureFeeTax,
            totalForeclosureCharge: quote.totalForeclosureCharge,
            approvedWaivers: quote.approvedWaivers,
            netPayableAmount: quote.netPayableAmount,
            status: 'ACTIVE',
            generatedBy: requestedByName || 'Operations Officer',
          },
        });

        await tx.closureEvent.create({
          data: {
            closureRequestId: closureReq.id,
            eventType: 'REQUESTED',
            actor: requestedBy || 'usr_ops_01',
            actorName: requestedByName || 'Operations Officer',
            actorRole: requestedByRole || 'Operations Officer',
            title: 'Foreclosure Quote Requested',
            description: `Generated quote ${quoteNumber} for ₹${quote.netPayableAmount.toLocaleString()} (valid until ${quote.validUntil}).`,
            amount: quote.netPayableAmount,
          },
        });

        return closureReq;
      });

      return NextResponse.json(result, { status: 201 });
    } else {
      // SETTLEMENT
      if (!proposedSettlementAmount || Number(proposedSettlementAmount) <= 0) {
        return NextResponse.json({ error: 'Valid proposed settlement amount is required.' }, { status: 400 });
      }

      const concession = calculateSettlementConcession({
        loan: loan as any,
        proposedSettlementAmount: Number(proposedSettlementAmount),
        paymentDeadline,
      });

      const setCount = await prisma.settlementProposal.count();
      const proposalNumber = `SET-${new Date().getFullYear()}-${String(setCount + 101).padStart(6, '0')}`;

      const result = await prisma.$transaction(async (tx) => {
        const closureReq = await tx.loanClosureRequest.create({
          data: {
            requestNumber,
            loanId: loan.id,
            customerId: loan.customerId,
            accountNumber: loan.accountNumber,
            customerName: loan.customerName,
            closureType: 'SETTLEMENT',
            status: 'SUBMITTED',
            calculationDate: new Date().toISOString().split('T')[0],
            effectiveDate: concession.paymentDeadline,
            requestedBy: requestedBy || 'usr_ops_01',
            requestedByName: requestedByName || 'Operations Officer',
            requestedByRole: requestedByRole || 'Operations Officer',
            reason,
            branchId: loan.branchId,
            branchName: loan.branchName,
            principalOutstanding: Number(loan.outstandingPrincipal || 0),
            interestOutstanding: Number(loan.interestOutstanding || 0),
            feeOutstanding: Number(loan.feeOutstanding || 0),
            penaltyOutstanding: Number(loan.penaltyOutstanding || 0),
            totalExposure: concession.totalExposure,
            foreclosureChargeAmount: 0,
            foreclosureChargeTax: 0,
            waiverAmount: 0,
            concessionAmount: concession.concessionAmount,
            finalPayableAmount: concession.proposedSettlementAmount,
            quoteValidUntil: concession.paymentDeadline,
          },
        });

        await tx.settlementProposal.create({
          data: {
            proposalNumber,
            closureRequestId: closureReq.id,
            loanId: loan.id,
            totalExposure: concession.totalExposure,
            proposedSettlementAmount: concession.proposedSettlementAmount,
            concessionAmount: concession.concessionAmount,
            concessionPercentage: concession.concessionPercentage,
            principalConcession: concession.principalConcession,
            interestConcession: concession.interestConcession,
            feePenaltyConcession: concession.feePenaltyConcession,
            paymentDeadline: concession.paymentDeadline,
            settlementReason: reason,
            hardshipCategory,
            status: 'PROPOSED',
          },
        });

        await tx.closureEvent.create({
          data: {
            closureRequestId: closureReq.id,
            eventType: 'REQUESTED',
            actor: requestedBy || 'usr_ops_01',
            actorName: requestedByName || 'Operations Officer',
            actorRole: requestedByRole || 'Operations Officer',
            title: 'Settlement Proposal Submitted',
            description: `Proposed OTS of ₹${concession.proposedSettlementAmount.toLocaleString()} (${concession.concessionPercentage}% concession).`,
            amount: concession.proposedSettlementAmount,
          },
        });

        return closureReq;
      });

      return NextResponse.json(result, { status: 201 });
    }
  } catch (error: any) {
    console.error('API /closures POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
