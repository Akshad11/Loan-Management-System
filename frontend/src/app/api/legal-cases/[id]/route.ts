import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, 'view_collections');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params; const id = resolvedParams?.id;
    const lc = await prisma.legalCase.findFirst({
      where: { OR: [{ id }, { legalCaseNumber: id }] },
      include: {
        events: { orderBy: { eventDate: 'desc' } },
        notices: { orderBy: { noticeDate: 'desc' } },
        recoveryCase: true,
        loan: {
          include: {
            schedules: { orderBy: { instalmentNumber: 'asc' } },
            charges: true,
          },
        },
        customer: true,
      },
    });

    if (!lc) {
      return NextResponse.json({ error: 'Legal case not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...lc,
      claimAmount: Number(lc.claimAmount),
      recoveredAmount: Number(lc.recoveredAmount),
    });
  } catch (error: any) {
    console.error('Error fetching legal case detail:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch legal case' }, { status: 500 });
  }
}
