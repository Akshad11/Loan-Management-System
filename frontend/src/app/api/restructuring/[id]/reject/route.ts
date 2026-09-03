import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, ["manage_repayments","action_approvals"]);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params; const id = resolvedParams?.id;
    const body = await request.json();
    const { rejectorId, rejectorName, rejectorRole, rejectionReason } = body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return NextResponse.json({ error: 'Rejection reason is mandatory.' }, { status: 400 });
    }

    const restructuring = await prisma.restructuringRequest.findFirst({
      where: { OR: [{ id }, { requestNumber: id }] },
    });

    if (!restructuring) {
      return NextResponse.json({ error: 'Restructuring request not found.' }, { status: 404 });
    }

    if (['EFFECTIVE', 'REJECTED', 'CANCELLED'].includes(restructuring.status)) {
      return NextResponse.json(
        { error: `Cannot reject request with status '${restructuring.status}'.` },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const req = await tx.restructuringRequest.update({
        where: { id: restructuring.id },
        data: {
          status: 'REJECTED',
          rejectedBy: rejectorId || 'usr_mgr_01',
          rejectedByName: rejectorName || 'Credit Committee',
          rejectedByRole: rejectorRole || 'Branch Manager / Approver',
          rejectedAt: new Date(),
          rejectionReason,
        },
      });

      await tx.restructuringEvent.create({
        data: {
          requestId: req.id,
          eventType: 'REJECTED',
          actor: rejectorId || 'usr_mgr_01',
          actorName: rejectorName || 'Credit Committee',
          actorRole: rejectorRole || 'Branch Manager / Approver',
          title: 'Restructuring Request Rejected',
          description: rejectionReason,
        },
      });

      return req;
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('API /restructuring/[id]/reject POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
