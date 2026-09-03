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
    const { rejectionReason, rejectorId, rejectorName } = body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return NextResponse.json({ error: 'Rejection reason is mandatory.' }, { status: 400 });
    }

    const waiver = await prisma.waiverRequest.findFirst({
      where: { OR: [{ id }, { waiverNumber: id }] },
    });

    if (!waiver) {
      return NextResponse.json({ error: 'Waiver request not found.' }, { status: 404 });
    }

    if (['APPLIED', 'REJECTED', 'CANCELLED'].includes(waiver.status)) {
      return NextResponse.json({ error: `Cannot reject waiver with status '${waiver.status}'.` }, { status: 400 });
    }

    const updated = await prisma.waiverRequest.update({
      where: { id: waiver.id },
      data: {
        status: 'REJECTED',
        rejectedBy: rejectorId || 'usr_mgr_01',
        rejectedByName: rejectorName || 'Credit Committee',
        rejectedAt: new Date(),
        rejectionReason,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('API /waivers/[id]/reject POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
