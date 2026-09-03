import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateForeclosureQuote } from '@/services/closureEngine';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, 'view_loans');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params; const id = resolvedParams?.id;
    const closureReq = await prisma.loanClosureRequest.findFirst({
      where: { OR: [{ id }, { requestNumber: id }] },
      include: { loan: true, foreclosureQuote: true, settlementProposal: true },
    });

    if (!closureReq) {
      return NextResponse.json({ error: 'Closure request not found.' }, { status: 404 });
    }

    const today = new Date().toISOString().split('T')[0];
    const isExpired = closureReq.quoteValidUntil ? closureReq.quoteValidUntil < today : false;

    return NextResponse.json({
      request: closureReq,
      isExpired,
      loan: closureReq.loan,
      foreclosureQuote: closureReq.foreclosureQuote,
      settlementProposal: closureReq.settlementProposal,
    });
  } catch (error: any) {
    console.error('API /closures/[id]/quote GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
