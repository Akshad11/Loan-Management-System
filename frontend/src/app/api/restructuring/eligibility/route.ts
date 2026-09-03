import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { evaluateRestructuringEligibility } from '@/services/restructuringEngine';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, ["view_loans","manage_repayments"]);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const { loanId } = body;

    if (!loanId) {
      return NextResponse.json({ error: 'Loan ID is required.' }, { status: 400 });
    }

    const loan = await prisma.loanAccount.findFirst({
      where: { OR: [{ id: loanId }, { accountNumber: loanId }] },
    });

    if (!loan) {
      return NextResponse.json({ error: 'Loan account not found.' }, { status: 404 });
    }

    // Check active pending restructuring
    const activeRestructuring = await prisma.restructuringRequest.findFirst({
      where: {
        loanId: loan.id,
        status: { in: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED'] },
      },
    });

    // Check active legal case
    const activeLegalCase = await prisma.legalCase.findFirst({
      where: {
        loanId: loan.id,
        status: { notIn: ['SETTLED', 'WITHDRAWN', 'CLOSED'] },
      },
    });

    const eligibility = evaluateRestructuringEligibility({
      loan: loan as any,
      hasActiveRestructuring: !!activeRestructuring,
      activeLegalCaseStatus: activeLegalCase?.status,
    });

    return NextResponse.json(eligibility);
  } catch (error: any) {
    console.error('API /restructuring/eligibility POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
