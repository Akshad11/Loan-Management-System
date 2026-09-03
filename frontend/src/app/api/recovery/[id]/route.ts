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
    const rc = await prisma.recoveryCase.findFirst({
      where: { OR: [{ id }, { recoveryCaseNumber: id }] },
      include: {
        loan: {
          include: {
            schedules: { orderBy: { instalmentNumber: 'asc' } },
            charges: true,
            transactions: { orderBy: { transactionDate: 'desc' } },
            payments: {
              include: {
                allocations: true,
                receipt: true,
              },
              orderBy: { paymentDate: 'desc' },
            },
          },
        },
        customer: true,
        actions: { orderBy: { actionDate: 'desc' } },
        escalations: { orderBy: { triggeredAt: 'desc' } },
        assignments: { orderBy: { assignedAt: 'desc' } },
        negotiations: { orderBy: { createdAt: 'desc' } },
        legalReviews: { orderBy: { requestedAt: 'desc' } },
        legalCases: {
          include: {
            events: { orderBy: { eventDate: 'desc' } },
            notices: { orderBy: { noticeDate: 'desc' } },
          },
        },
        legalNotices: { orderBy: { noticeDate: 'desc' } },
      },
    });

    if (!rc) {
      return NextResponse.json({ error: 'Recovery case not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...rc,
      overdueAmount: Number(rc.overdueAmount),
      totalOutstanding: Number(rc.totalOutstanding),
      targetAmount: rc.targetAmount ? Number(rc.targetAmount) : undefined,
      collectedAmount: Number(rc.collectedAmount),
    });
  } catch (error: any) {
    console.error('Error fetching recovery case detail:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch recovery case' }, { status: 500 });
  }
}
