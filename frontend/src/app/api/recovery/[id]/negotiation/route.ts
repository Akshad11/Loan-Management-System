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
      proposedAmount,
      proposedDate,
      frequency = 'MONTHLY',
      reason,
      customerResponse,
      officerName = 'Rajesh Naik',
    } = body;

    const rc = await prisma.recoveryCase.findFirst({
      where: { OR: [{ id }, { recoveryCaseNumber: id }] },
    });

    if (!rc) {
      return NextResponse.json({ error: 'Recovery case not found' }, { status: 404 });
    }

    const neg = await prisma.$transaction(async (tx) => {
      const createdNeg = await tx.recoveryNegotiation.create({
        data: {
          recoveryCaseId: rc.id,
          loanId: rc.loanId,
          proposedAmount: Number(proposedAmount),
          proposedDate: proposedDate || new Date().toISOString().split('T')[0],
          frequency,
          reason,
          officerId: rc.assignedOfficerId || 'usr_rec_01',
          officerName,
          customerResponse,
          status: 'PROPOSED',
        },
      });

      await tx.recoveryCase.update({
        where: { id: rc.id },
        data: {
          status: 'NEGOTIATION',
        },
      });

      await tx.loanHistory.create({
        data: {
          loanId: rc.loanId,
          action: 'RECOVERY_NEGOTIATION_RECORDED',
          actor: officerName,
          actorName: officerName,
          actorRole: 'Recovery Officer',
          reference: rc.recoveryCaseNumber,
          notes: `Arrangement proposal of ₹${Number(proposedAmount).toLocaleString('en-IN')} recorded.`,
        },
      });

      return createdNeg;
    });

    return NextResponse.json({
      ...neg,
      proposedAmount: Number(neg.proposedAmount),
    });
  } catch (error: any) {
    console.error('Error recording recovery negotiation:', error);
    return NextResponse.json({ error: error.message || 'Failed to record negotiation' }, { status: 500 });
  }
}
