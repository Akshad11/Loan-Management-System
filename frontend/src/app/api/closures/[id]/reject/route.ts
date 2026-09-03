import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, ["close_loan","action_approvals"]);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params; const id = resolvedParams?.id;
    const body = await request.json();
    const { rejectionReason, rejectorId, rejectorName } = body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return NextResponse.json({ error: 'Rejection reason is mandatory.' }, { status: 400 });
    }

    const closureReq = await prisma.loanClosureRequest.findFirst({
      where: { OR: [{ id }, { requestNumber: id }] },
    });

    if (!closureReq) {
      return NextResponse.json({ error: 'Closure request not found.' }, { status: 404 });
    }

    if (['CLOSED', 'REJECTED', 'CANCELLED'].includes(closureReq.status)) {
      return NextResponse.json(
        { error: `Cannot reject closure request with status '${closureReq.status}'.` },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.loanClosureRequest.update({
        where: { id: closureReq.id },
        data: {
          status: 'REJECTED',
          rejectedBy: rejectorId || 'usr_mgr_01',
          rejectedByName: rejectorName || 'Credit Committee',
          rejectedAt: new Date(),
          rejectionReason,
        },
      });

      await tx.closureEvent.create({
        data: {
          closureRequestId: closureReq.id,
          eventType: 'REJECTED',
          actor: rejectorId || 'usr_mgr_01',
          actorName: rejectorName || 'Credit Committee',
          actorRole: 'Approver',
          title: 'Closure Request Rejected',
          description: rejectionReason,
        },
      });

      return updated;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API /closures/[id]/reject POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
