import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/serverAuth';
import { getBureauReportsForApplication } from '@/services/bureau/bureauService';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, 'bureau.view');
    if (authResult instanceof NextResponse) return authResult;

    const { id: loanId } = await context.params;
    if (!loanId) {
      return NextResponse.json({ error: 'Loan ID is required' }, { status: 400 });
    }

    const loan = await prisma.loanAccount.findUnique({
      where: { id: loanId },
      select: { applicationId: true },
    });

    if (!loan || !loan.applicationId) {
      return NextResponse.json({ reports: [] });
    }

    const reports = await getBureauReportsForApplication(loan.applicationId);
    return NextResponse.json({ reports });
  } catch (error: any) {
    console.error('GET /api/loans/[id]/bureau error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
