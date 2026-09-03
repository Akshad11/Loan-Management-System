import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, 'manage_repayments');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params; const id = resolvedParams?.id;
    const body = await request.json();
    const { actorId, actorName, actorRole, notes } = body;

    const restructuring = await prisma.restructuringRequest.findFirst({
      where: { OR: [{ id }, { requestNumber: id }] },
    });

    if (!restructuring) {
      return NextResponse.json({ error: 'Restructuring request not found.' }, { status: 404 });
    }

    if (restructuring.status !== 'DRAFT') {
      return NextResponse.json(
        { error: `Cannot submit request in '${restructuring.status}' status.` },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const req = await tx.restructuringRequest.update({
        where: { id: restructuring.id },
        data: {
          status: 'SUBMITTED',
        },
      });

      await tx.restructuringEvent.create({
        data: {
          requestId: req.id,
          eventType: 'SUBMITTED',
          actor: actorId || 'usr_ops_01',
          actorName: actorName || 'Operations Officer',
          actorRole: actorRole || 'Operations Officer',
          title: 'Submitted for Credit Review',
          description: notes || 'Restructuring request submitted into review pipeline.',
        },
      });

      return req;
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('API /restructuring/[id]/submit POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
