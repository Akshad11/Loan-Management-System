import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, 'manage_collections');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params; const id = resolvedParams?.id;
    const body = await request.json();
    const {
      payload,
      officerName = 'Senior Recovery Officer',
      officerRole = 'Senior Recovery Officer',
    } = body;

    const { actionType, actionDate, outcome, outcomeNotes, promisedAmount, promisedDate, nextAction, nextActionDate, location } = payload || body;

    const rc = await prisma.recoveryCase.findFirst({
      where: { OR: [{ id }, { recoveryCaseNumber: id }] },
    });

    if (!rc) {
      return NextResponse.json({ error: 'Recovery case not found' }, { status: 404 });
    }

    const action = await prisma.$transaction(async (tx) => {
      const createdAction = await tx.recoveryAction.create({
        data: {
          recoveryCaseId: rc.id,
          loanId: rc.loanId,
          actionType: actionType || 'PHONE_CALL',
          actionDate: actionDate || new Date().toISOString().split('T')[0],
          officerId: rc.assignedOfficerId || 'usr_rec_01',
          officerName: officerName || rc.assignedOfficerName || 'Recovery Officer',
          officerRole: officerRole || 'Senior Recovery Officer',
          outcome: outcome || 'CONTACTED',
          outcomeNotes,
          promisedAmount: promisedAmount ? Number(promisedAmount) : null,
          promisedDate,
          nextAction,
          nextActionDate,
          location,
          createdBy: officerName,
        },
      });

      await tx.recoveryCase.update({
        where: { id: rc.id },
        data: {
          status: 'IN_PROGRESS',
          lastActionDate: actionDate || new Date().toISOString().split('T')[0],
          nextAction: nextAction || rc.nextAction,
          nextActionDate: nextActionDate || rc.nextActionDate,
        },
      });

      await tx.loanHistory.create({
        data: {
          loanId: rc.loanId,
          action: 'RECOVERY_ACTION_LOGGED',
          actor: officerName,
          actorName: officerName,
          actorRole: officerRole,
          reference: rc.recoveryCaseNumber,
          notes: `${actionType} logged with outcome "${outcome}". ${outcomeNotes ? `Notes: ${outcomeNotes}` : ''}`,
        },
      });

      return createdAction;
    });

    return NextResponse.json({
      ...action,
      promisedAmount: action.promisedAmount ? Number(action.promisedAmount) : undefined,
    });
  } catch (error: any) {
    console.error('Error logging recovery action:', error);
    return NextResponse.json({ error: error.message || 'Failed to log recovery action' }, { status: 500 });
  }
}
