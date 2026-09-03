import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateMakerChecker } from '@/services/restructuringEngine';

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
    const { approverId, approverName, approverRole, approvalNotes } = body;

    const restructuring = await prisma.restructuringRequest.findFirst({
      where: { OR: [{ id }, { requestNumber: id }] },
    });

    if (!restructuring) {
      return NextResponse.json({ error: 'Restructuring request not found.' }, { status: 404 });
    }

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(restructuring.status)) {
      return NextResponse.json(
        { error: `Cannot approve request with status '${restructuring.status}'.` },
        { status: 400 }
      );
    }

    // Segregation of Duties: Creator cannot approve their own restructuring
    const makerChecker = validateMakerChecker(restructuring as any, {
      id: approverId || 'usr_mgr_01',
      name: approverName || 'Branch Credit Committee Head',
      roleName: approverRole || 'Branch Manager / Approver',
    });

    if (!makerChecker.allowed) {
      return NextResponse.json({ error: makerChecker.reason }, { status: 403 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const req = await tx.restructuringRequest.update({
        where: { id: restructuring.id },
        data: {
          status: 'APPROVED',
          approvedBy: approverId || 'usr_mgr_01',
          approvedByName: approverName || 'Branch Credit Committee Head',
          approvedByRole: approverRole || 'Branch Manager / Approver',
          approvedAt: new Date(),
          approvalNotes: approvalNotes || 'Approved by Credit Committee.',
        },
      });

      await tx.restructuringEvent.create({
        data: {
          requestId: req.id,
          eventType: 'APPROVED',
          actor: approverId || 'usr_mgr_01',
          actorName: approverName || 'Branch Credit Committee Head',
          actorRole: approverRole || 'Branch Manager / Approver',
          title: 'Restructuring Approved',
          description: approvalNotes || `Terms signed off by ${approverName || 'Credit Committee'}. Ready to execute on effective date.`,
        },
      });

      return req;
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('API /restructuring/[id]/approve POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
