import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateRecoveryPriority, evaluateRecoveryEligibility } from '@/services/recoveryEngine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, 'view_collections');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { searchParams } = new URL(request.url);
    const loanId = searchParams.get('loanId');
    const customerId = searchParams.get('customerId');
    const search = searchParams.get('search');
    const stage = searchParams.get('stage');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const branchId = searchParams.get('branchId');

    const where: any = {};
    if (loanId) where.loanId = loanId;
    if (customerId) where.customerId = customerId;
    if (stage && stage !== 'ALL') where.recoveryStage = stage;
    if (status && status !== 'ALL') where.status = status;
    if (priority && priority !== 'ALL') where.priority = priority;
    if (branchId && branchId !== 'ALL') where.branchId = branchId;

    if (search) {
      where.OR = [
        { recoveryCaseNumber: { contains: search, mode: 'insensitive' } },
        { accountNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const cases = await prisma.recoveryCase.findMany({
      where,
      include: {
        actions: { orderBy: { actionDate: 'desc' } },
        escalations: { orderBy: { triggeredAt: 'desc' } },
        assignments: { orderBy: { assignedAt: 'desc' } },
        negotiations: { orderBy: { createdAt: 'desc' } },
        legalReviews: { orderBy: { requestedAt: 'desc' } },
        legalCases: {
          include: {
            events: { orderBy: { eventDate: 'desc' } },
            notices: { orderBy: { noticeDate: 'desc' } },
          },
        },
        legalNotices: { orderBy: { noticeDate: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = cases.map((c: any) => ({
      ...c,
      overdueAmount: Number(c.overdueAmount),
      totalOutstanding: Number(c.totalOutstanding),
      targetAmount: c.targetAmount ? Number(c.targetAmount) : undefined,
      collectedAmount: Number(c.collectedAmount),
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Error fetching recovery cases:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch recovery cases' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, 'manage_collections');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const {
      payload,
      actorName = 'Collection Officer',
      actorRole = 'Collection Officer',
    } = body;

    const { loanId, targetStage = 'EARLY_RECOVERY', reason, assignedOfficerId, assignedOfficerName, assignedTeam, targetAmount, priority } = payload || body;

    if (!loanId) {
      return NextResponse.json({ error: 'Loan ID is required for recovery escalation' }, { status: 400 });
    }

    const loan = await prisma.loanAccount.findFirst({
      where: { OR: [{ id: loanId }, { accountNumber: loanId }] },
    });

    if (!loan) {
      return NextResponse.json({ error: 'Loan account not found' }, { status: 404 });
    }

    // Check duplicate active recovery case
    const existing = await prisma.recoveryCase.findFirst({
      where: {
        loanId: loan.id,
        status: { notIn: ['CLOSED', 'CANCELLED'] },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Active recovery case ${existing.recoveryCaseNumber} already exists for this loan.` },
        { status: 409 }
      );
    }

    const count = await prisma.recoveryCase.count();
    const caseSeq = count + 101;
    const recoveryCaseNumber = `RC-${new Date().getFullYear()}-${String(caseSeq).padStart(6, '0')}`;
    const escSeq = count + 41;
    const escalationNumber = `ESC-${new Date().getFullYear()}-${String(escSeq).padStart(6, '0')}`;

    const evaluatedPriority = priority || calculateRecoveryPriority(loan.dpd, Number(loan.overdueAmount));

    const newCase = await prisma.$transaction(async (tx) => {
      const createdCase = await tx.recoveryCase.create({
        data: {
          recoveryCaseNumber,
          loanId: loan.id,
          accountNumber: loan.accountNumber,
          customerId: loan.customerId,
          customerNumber: loan.customerNumber,
          customerName: loan.customerName,
          dpd: loan.dpd,
          dpdBucket: loan.dpdBucket,
          overdueAmount: loan.overdueAmount,
          totalOutstanding: loan.totalOutstanding,
          targetAmount: targetAmount || loan.overdueAmount,
          collectedAmount: 0,
          recoveryStage: targetStage,
          status: 'OPEN',
          priority: evaluatedPriority,
          assignedOfficerId: assignedOfficerId || 'usr_rec_01',
          assignedOfficerName: assignedOfficerName || 'Rajesh Naik',
          assignedTeam: assignedTeam || 'Field Recovery Team 1',
          branchId: loan.branchId,
          branchName: loan.branchName,
          openedDate: new Date().toISOString().split('T')[0],
          lastActionDate: new Date().toISOString().split('T')[0],
          notes: reason,
        },
      });

      await tx.recoveryEscalation.create({
        data: {
          escalationNumber,
          recoveryCaseId: createdCase.id,
          loanId: loan.id,
          previousStage: 'COLLECTION',
          newStage: targetStage,
          reason,
          triggeredBy: actorName,
          triggeredByName: actorName,
          triggeredByRole: actorRole,
          effectiveDate: new Date().toISOString().split('T')[0],
          assignedTeam: assignedTeam || 'Field Recovery Team 1',
          assignedOfficer: assignedOfficerName || 'Rajesh Naik',
          status: 'COMPLETED',
          notes: reason,
        },
      });

      await tx.recoveryAssignment.create({
        data: {
          recoveryCaseId: createdCase.id,
          loanId: loan.id,
          officerId: assignedOfficerId || 'usr_rec_01',
          officerName: assignedOfficerName || 'Rajesh Naik',
          teamName: assignedTeam || 'Field Recovery Team 1',
          branchId: loan.branchId,
          branchName: loan.branchName,
          assignedBy: actorName,
          assignedByName: actorName,
          reason: 'Initial assignment upon escalation',
          status: 'ACTIVE',
        },
      });

      await tx.loanHistory.create({
        data: {
          loanId: loan.id,
          action: 'ESCALATED_TO_RECOVERY',
          actor: actorName,
          actorName,
          actorRole,
          reference: recoveryCaseNumber,
          reason,
          notes: `Loan account escalated to Recovery Stage: ${targetStage}. Case Ref: ${recoveryCaseNumber}.`,
        },
      });

      return createdCase;
    });

    return NextResponse.json({
      ...newCase,
      overdueAmount: Number(newCase.overdueAmount),
      totalOutstanding: Number(newCase.totalOutstanding),
      collectedAmount: Number(newCase.collectedAmount),
    });
  } catch (error: any) {
    console.error('Error creating recovery case:', error);
    return NextResponse.json({ error: error.message || 'Failed to create recovery case' }, { status: 500 });
  }
}
