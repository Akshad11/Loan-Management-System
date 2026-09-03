import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateWaiverEligibility } from '@/services/chargeAdjustmentEngine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, ["view_repayments","view_loans"]);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { searchParams } = new URL(request.url);
    const loanId = searchParams.get('loanId');
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const where: any = {};
    if (loanId) where.loanId = loanId;
    if (customerId) where.customerId = customerId;
    if (status && status !== 'ALL') where.status = status;
    if (category && category !== 'ALL') where.category = category;

    if (search) {
      where.OR = [
        { waiverNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { accountNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const waivers = await prisma.waiverRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        loan: {
          select: {
            id: true,
            accountNumber: true,
            customerName: true,
            status: true,
            feeOutstanding: true,
            penaltyOutstanding: true,
            interestOutstanding: true,
          },
        },
        charge: true,
      },
    });

    const allWaivers = await prisma.waiverRequest.findMany();
    const pendingCount = allWaivers.filter((w) => w.status === 'SUBMITTED' || w.status === 'UNDER_REVIEW').length;
    const approvedCount = allWaivers.filter((w) => w.status === 'APPROVED').length;
    const totalWaived = allWaivers
      .filter((w) => w.status === 'APPLIED')
      .reduce((sum, w) => sum + Number(w.approvedAmount || w.requestedAmount || 0), 0);

    return NextResponse.json({
      waivers,
      kpis: {
        pendingCount,
        approvedCount,
        totalWaived,
        totalCount: allWaivers.length,
      },
    });
  } catch (error: any) {
    console.error('API /waivers GET error:', error);
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
      chargeId,
      waiverType = 'PARTIAL_WAIVER',
      category = 'FEE',
      requestedAmount,
      reason,
      requestedBy,
      requestedByName,
      requestedByRole,
    } = body;

    if (!loanId || !requestedAmount || Number(requestedAmount) <= 0) {
      return NextResponse.json({ error: 'Valid Loan ID and positive waiver amount are required.' }, { status: 400 });
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

    let chargeRecord = null;
    if (chargeId) {
      chargeRecord = await prisma.loanCharge.findUnique({ where: { id: chargeId } });
    }

    // Eligibility check against real balances
    const validation = validateWaiverEligibility({
      loan: loan as any,
      category,
      requestedAmount: Number(requestedAmount),
      charge: chargeRecord as any,
    });

    if (!validation.eligible) {
      return NextResponse.json({ error: validation.reason }, { status: 422 });
    }

    const count = await prisma.waiverRequest.count();
    const waiverNumber = `WVR-${new Date().getFullYear()}-${String(count + 101).padStart(6, '0')}`;

    const newWaiver = await prisma.waiverRequest.create({
      data: {
        waiverNumber,
        loanId: loan.id,
        customerId: loan.customerId,
        accountNumber: loan.accountNumber,
        customerName: loan.customerName,
        chargeId: chargeRecord ? chargeRecord.id : null,
        waiverType,
        category,
        requestedAmount: Number(requestedAmount),
        eligibleOutstandingBefore: validation.maxEligibleAmount,
        reason,
        status: 'SUBMITTED',
        requestedBy: requestedBy || 'usr_ops_01',
        requestedByName: requestedByName || 'Operations Officer',
        requestedByRole: requestedByRole || 'Operations Officer',
      },
    });

    return NextResponse.json(newWaiver, { status: 201 });
  } catch (error: any) {
    console.error('API /waivers POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
