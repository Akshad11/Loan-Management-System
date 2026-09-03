import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, 'view_loans');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params; const id = resolvedParams?.id;

    const restructuring = await prisma.restructuringRequest.findFirst({
      where: { OR: [{ id }, { requestNumber: id }] },
      include: {
        events: { orderBy: { timestamp: 'desc' } },
        proposals: true,
        customer: true,
        loan: {
          include: {
            scheduleVersions: {
              include: {
                schedules: {
                  orderBy: { instalmentNumber: 'asc' },
                },
              },
              orderBy: { version: 'desc' },
            },
            history: {
              orderBy: { timestamp: 'desc' },
              take: 10,
            },
          },
        },
      },
    });

    if (!restructuring) {
      return NextResponse.json({ error: 'Restructuring request not found.' }, { status: 404 });
    }

    return NextResponse.json(restructuring);
  } catch (error: any) {
    console.error('API /restructuring/[id] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
