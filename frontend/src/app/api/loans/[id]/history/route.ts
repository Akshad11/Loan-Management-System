import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, 'view_loans');
    if (authResult instanceof NextResponse) return authResult;

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const loan = await prisma.loanAccount.findFirst({
      where: { OR: [{ id }, { accountNumber: id }] },
      select: { id: true },
    });

    if (!loan) {
      return NextResponse.json({ error: 'Loan Account not found.' }, { status: 404 });
    }

    const history = await prisma.loanHistory.findMany({
      where: { loanId: loan.id },
      orderBy: { timestamp: 'desc' },
    });

    return NextResponse.json(history);
  } catch (error: any) {
    console.error('API /loans/[id]/history GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

