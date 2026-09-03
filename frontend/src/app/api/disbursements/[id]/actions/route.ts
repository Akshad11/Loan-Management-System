import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, writeAuditLog } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, ['execute_disbursement', 'action_approvals']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const {
      action,
      requestId,
      actorName = actorUser.name,
      actorRole = actorUser.roleName,
      assignedToId,
      assignedToName,
      notes,
      reason,
    } = body;

    const disbursement = await prisma.disbursement.findUnique({
      where: { id },
      include: {
        requests: true,
        beneficiaries: true,
        transactions: true,
      },
    });

    if (!disbursement) {
      return NextResponse.json({ error: 'Disbursement not found' }, { status: 404 });
    }

    const reqItem = disbursement.requests.find((r) => r.id === requestId);
    if (!reqItem) {
      return NextResponse.json({ error: 'Disbursement request not found' }, { status: 404 });
    }

    if (action === 'ASSIGN') {
      await prisma.disbursementRequest.update({
        where: { id: reqItem.id },
        data: {
          assignedTo: assignedToId,
          assignedToName: assignedToName,
          assignedAt: new Date(),
        },
      });

      await prisma.disbursementHistory.create({
        data: {
          disbursementId: disbursement.id,
          requestId: reqItem.id,
          event: 'ASSIGNED',
          actor: actorName,
          actorName,
          actorRole,
          notes: `Assigned to ${assignedToName || assignedToId} for checker review.`,
        },
      });
    } else if (action === 'APPROVE') {
      // Maker-Checker Segregation of Duties Enforcement
      if (reqItem.requestedByName && reqItem.requestedByName.trim().toLowerCase() === actorName.trim().toLowerCase()) {
        return NextResponse.json(
          {
            error: 'Segregation of Duties Violation: You cannot approve a disbursement request that you created. A separate approver is required.',
          },
          { status: 403 }
        );
      }

      await prisma.disbursementRequest.update({
        where: { id: reqItem.id },
        data: {
          status: 'APPROVED',
          approvedBy: actorName,
          approvedByName: actorName,
          approvedAt: new Date(),
          approvalNotes: notes || 'Approved for payment execution.',
        },
      });

      await prisma.disbursement.update({
        where: { id: disbursement.id },
        data: {
          status: 'APPROVED',
          history: {
            create: [
              {
                requestId: reqItem.id,
                event: 'APPROVED',
                actor: actorName,
                actorName,
                actorRole,
                previousState: 'PENDING_APPROVAL',
                newState: 'APPROVED',
                amount: reqItem.requestedAmount,
                notes: `Disbursement request ${reqItem.requestNumber} approved by ${actorName} (${actorRole}).`,
              },
            ],
          },
        },
      });
    } else if (action === 'REJECT') {
      await prisma.disbursementRequest.update({
        where: { id: reqItem.id },
        data: {
          status: 'REJECTED',
          rejectedBy: actorName,
          rejectedByName: actorName,
          rejectedAt: new Date(),
          rejectionReason: reason || 'Disbursement request rejected by checker.',
        },
      });

      await prisma.disbursement.update({
        where: { id: disbursement.id },
        data: {
          status: Number(disbursement.totalDisbursedAmount) > 0 ? 'PARTIAL' as any : 'REJECTED',
          history: {
            create: [
              {
                requestId: reqItem.id,
                event: 'REJECTED',
                actor: actorName,
                actorName,
                actorRole,
                previousState: 'PENDING_APPROVAL',
                newState: 'REJECTED',
                amount: reqItem.requestedAmount,
                notes: `Request ${reqItem.requestNumber} rejected: ${reason || 'No reason provided.'}`,
              },
            ],
          },
        },
      });
    } else if (action === 'RETURN') {
      await prisma.disbursementRequest.update({
        where: { id: reqItem.id },
        data: {
          status: 'RETURNED',
          returnedBy: actorName,
          returnedByName: actorName,
          returnedAt: new Date(),
          returnReason: reason || 'Returned for corrections.',
        },
      });

      await prisma.disbursement.update({
        where: { id: disbursement.id },
        data: {
          status: 'RETURNED',
          history: {
            create: [
              {
                requestId: reqItem.id,
                event: 'RETURNED',
                actor: actorName,
                actorName,
                actorRole,
                previousState: 'PENDING_APPROVAL',
                newState: 'RETURNED',
                amount: reqItem.requestedAmount,
                notes: `Request returned: ${reason || 'Returned for modification.'}`,
              },
            ],
          },
        },
      });
    } else {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    const updated = await prisma.disbursement.findUnique({
      where: { id },
      include: {
        requests: true,
        beneficiaries: true,
        transactions: true,
        history: { orderBy: { timestamp: 'desc' } },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('API /api/disbursements/[id]/actions POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
