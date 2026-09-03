import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, 'view_collections');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { searchParams } = new URL(request.url);
    const recoveryCaseId = searchParams.get('recoveryCaseId');
    const loanId = searchParams.get('loanId');
    const status = searchParams.get('status');

    const where: any = {};
    if (recoveryCaseId) where.recoveryCaseId = recoveryCaseId;
    if (loanId) where.loanId = loanId;
    if (status && status !== 'ALL') where.status = status;

    const cases = await prisma.legalCase.findMany({
      where,
      include: {
        events: { orderBy: { eventDate: 'desc' } },
        notices: { orderBy: { noticeDate: 'desc' } },
        recoveryCase: true,
        loan: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = cases.map((c: any) => ({
      ...c,
      claimAmount: Number(c.claimAmount),
      recoveredAmount: Number(c.recoveredAmount),
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Error fetching legal cases:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch legal cases' }, { status: 500 });
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
      actorName = 'Sanjay Deshmukh',
      actorRole = 'Legal Officer',
    } = body;

    const {
      recoveryCaseId,
      caseType = 'DEMAND_NOTICE_138',
      jurisdiction = 'Panaji Commercial Court',
      courtOrForum = 'Court of Civil Judge Senior Division',
      courtCaseNumber,
      filingDate,
      nextHearingDate,
      advocateName,
      advocateContact,
      externalCounsel,
      claimAmount,
      notes,
    } = payload || body;

    const rc = await prisma.recoveryCase.findFirst({
      where: { OR: [{ id: recoveryCaseId }, { recoveryCaseNumber: recoveryCaseId }] },
    });

    if (!rc) {
      return NextResponse.json({ error: 'Recovery case not found' }, { status: 404 });
    }

    const count = await prisma.legalCase.count();
    const caseSeq = count + 41;
    const legalCaseNumber = `LC-${new Date().getFullYear()}-${String(caseSeq).padStart(6, '0')}`;

    const newLegalCase = await prisma.$transaction(async (tx) => {
      const created = await tx.legalCase.create({
        data: {
          legalCaseNumber,
          recoveryCaseId: rc.id,
          loanId: rc.loanId,
          customerId: rc.customerId,
          accountNumber: rc.accountNumber,
          customerName: rc.customerName,
          caseType,
          jurisdiction,
          courtOrForum,
          courtCaseNumber,
          filingDate: filingDate || new Date().toISOString().split('T')[0],
          nextHearingDate,
          advocateName,
          advocateContact,
          externalCounsel,
          assignedLegalOfficer: actorName,
          claimAmount: claimAmount || rc.totalOutstanding,
          recoveredAmount: 0,
          status: 'FILED_IN_COURT',
          notes,
        },
      });

      await tx.legalCaseEvent.create({
        data: {
          legalCaseId: created.id,
          eventType: 'CASE_FILED',
          eventDate: filingDate || new Date().toISOString().split('T')[0],
          actorName,
          actorRole,
          notes: `Legal case instituted before ${courtOrForum}. Case Type: ${caseType}.`,
          referenceNumber: courtCaseNumber || legalCaseNumber,
          nextHearingDate,
        },
      });

      await tx.recoveryCase.update({
        where: { id: rc.id },
        data: {
          recoveryStage: 'LEGAL_ACTION',
          status: 'LEGAL_ACTION',
        },
      });

      await tx.loanHistory.create({
        data: {
          loanId: rc.loanId,
          action: 'LEGAL_CASE_INSTITUTED',
          actor: actorName,
          actorName,
          actorRole,
          reference: legalCaseNumber,
          notes: `Formal legal case ${legalCaseNumber} filed before ${courtOrForum}.`,
        },
      });

      return created;
    });

    return NextResponse.json({
      ...newLegalCase,
      claimAmount: Number(newLegalCase.claimAmount),
      recoveredAmount: Number(newLegalCase.recoveredAmount),
    });
  } catch (error: any) {
    console.error('Error creating legal case:', error);
    return NextResponse.json({ error: error.message || 'Failed to create legal case' }, { status: 500 });
  }
}
