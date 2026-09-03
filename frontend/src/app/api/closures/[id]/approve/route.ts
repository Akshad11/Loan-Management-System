import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateClosureMakerChecker } from '@/services/closureEngine';

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
    const { approverId, approverName, approverRole, approvalNotes } = body;

    const closureReq = await prisma.loanClosureRequest.findFirst({
      where: { OR: [{ id }, { requestNumber: id }] },
    });

    if (!closureReq) {
      return NextResponse.json({ error: 'Closure request not found.' }, { status: 404 });
    }

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(closureReq.status)) {
      return NextResponse.json(
        { error: `Cannot approve closure request with status '${closureReq.status}'.` },
        { status: 400 }
      );
    }

    // Maker-checker segregation of duties validation
    const makerChecker = validateClosureMakerChecker(closureReq as any, {
      id: approverId || 'usr_mgr_01',
      name: approverName || 'Branch Credit Committee Head',
      roleName: approverRole || 'Branch Manager / Approver',
    });

    if (!makerChecker.allowed) {
      return NextResponse.json({ error: makerChecker.reason }, { status: 403 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.loanClosureRequest.update({
        where: { id: closureReq.id },
        data: {
          status: 'APPROVED',
          approvedBy: approverId || 'usr_mgr_01',
          approvedByName: approverName || 'Branch Credit Committee Head',
          approvedByRole: approverRole || 'Branch Manager / Approver',
          approvedAt: new Date(),
          approvalNotes: approvalNotes || 'Approved by Committee.',
        },
      });

      await tx.closureEvent.create({
        data: {
          closureRequestId: closureReq.id,
          eventType: 'APPROVED',
          actor: approverId || 'usr_mgr_01',
          actorName: approverName || 'Branch Manager',
          actorRole: approverRole || 'Branch Manager',
          title: 'Closure Request Approved',
          description: approvalNotes || `Terms approved by ${approverName}. Awaiting payment matching.`,
        },
      });

      return updated;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API /closures/[id]/approve POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
