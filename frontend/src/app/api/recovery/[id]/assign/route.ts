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
    const { officerId, officerName, reason, actorName = 'Recovery Manager' } = body;

    const rc = await prisma.recoveryCase.findFirst({
      where: { OR: [{ id }, { recoveryCaseNumber: id }] },
    });

    if (!rc) {
      return NextResponse.json({ error: 'Recovery case not found' }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedCase = await tx.recoveryCase.update({
        where: { id: rc.id },
        data: {
          assignedOfficerId: officerId,
          assignedOfficerName: officerName,
          status: 'ASSIGNED',
        },
      });

      await tx.recoveryAssignment.create({
        data: {
          recoveryCaseId: rc.id,
          loanId: rc.loanId,
          officerId,
          officerName,
          branchId: rc.branchId,
          branchName: rc.branchName,
          assignedBy: actorName,
          assignedByName: actorName,
          reason: reason || 'Officer reassignment',
          status: 'ACTIVE',
        },
      });

      await tx.loanHistory.create({
        data: {
          loanId: rc.loanId,
          action: 'RECOVERY_CASE_ASSIGNED',
          actor: actorName,
          actorName,
          actorRole: 'Recovery Manager',
          reference: rc.recoveryCaseNumber,
          notes: `Recovery case assigned to ${officerName}. Reason: ${reason || 'Workload distribution'}.`,
        },
      });

      return updatedCase;
    });

    return NextResponse.json({
      ...updated,
      overdueAmount: Number(updated.overdueAmount),
      totalOutstanding: Number(updated.totalOutstanding),
      collectedAmount: Number(updated.collectedAmount),
    });
  } catch (error: any) {
    console.error('Error assigning recovery case:', error);
    return NextResponse.json({ error: error.message || 'Failed to assign recovery case' }, { status: 500 });
  }
}
