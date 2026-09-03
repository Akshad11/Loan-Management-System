import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
    const adjustmentType = searchParams.get('adjustmentType');
    const search = searchParams.get('search');

    const where: any = {};
    if (loanId) where.loanId = loanId;
    if (customerId) where.customerId = customerId;
    if (status && status !== 'ALL') where.status = status;
    if (adjustmentType && adjustmentType !== 'ALL') where.adjustmentType = adjustmentType;

    if (search) {
      where.OR = [
        { adjustmentNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { accountNumber: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
      ];
    }

    const adjustments = await prisma.financialAdjustmentRequest.findMany({
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
      },
    });

    const allAdjustments = await prisma.financialAdjustmentRequest.findMany();
    const pendingCount = allAdjustments.filter((a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW').length;
    const appliedCount = allAdjustments.filter((a) => a.status === 'APPLIED').length;
    const totalAdjustedAmount = allAdjustments
      .filter((a) => a.status === 'APPLIED')
      .reduce((sum, a) => sum + Number(a.amount || 0), 0);

    return NextResponse.json({
      adjustments,
      kpis: {
        pendingCount,
        appliedCount,
        totalAdjustedAmount,
        totalCount: allAdjustments.length,
      },
    });
  } catch (error: any) {
    console.error('API /adjustments GET error:', error);
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
      adjustmentType = 'CREDIT_ADJUSTMENT',
      amount,
      principalAdjustment = 0,
      interestAdjustment = 0,
      feeAdjustment = 0,
      penaltyAdjustment = 0,
      effectiveDate,
      reason,
      reference,
      requestedBy,
      requestedByName,
      requestedByRole,
    } = body;

    if (!loanId || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: 'Valid Loan ID and positive adjustment amount are required.' }, { status: 400 });
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

    const count = await prisma.financialAdjustmentRequest.count();
    const adjustmentNumber = `ADJ-${new Date().getFullYear()}-${String(count + 101).padStart(6, '0')}`;

    const created = await prisma.financialAdjustmentRequest.create({
      data: {
        adjustmentNumber,
        loanId: loan.id,
        customerId: loan.customerId,
        accountNumber: loan.accountNumber,
        customerName: loan.customerName,
        adjustmentType,
        amount: Number(amount),
        principalAdjustment: Number(principalAdjustment || 0),
        interestAdjustment: Number(interestAdjustment || 0),
        feeAdjustment: Number(feeAdjustment || 0),
        penaltyAdjustment: Number(penaltyAdjustment || 0),
        effectiveDate: effectiveDate || new Date().toISOString().split('T')[0],
        reason,
        reference,
        status: 'SUBMITTED',
        requestedBy: requestedBy || 'usr_ops_01',
        requestedByName: requestedByName || 'Operations Officer',
        requestedByRole: requestedByRole || 'Operations Officer',
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('API /adjustments POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
