import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateStatutoryNoticeText } from '@/services/recoveryEngine';

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

    const notices = await prisma.legalNotice.findMany({
      where,
      include: {
        loan: true,
        recoveryCase: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = notices.map((n: any) => ({
      ...n,
      demandAmount: Number(n.demandAmount),
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Error fetching legal notices:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch legal notices' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, 'manage_collections');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const {
      action = 'CREATE', // 'CREATE', 'APPROVE', 'DISPATCH'
      payload,
      noticeId,
      trackingNumber,
      dispatchMode,
      actorName = 'Sanjay Deshmukh',
      actorRole = 'Legal Officer',
    } = body;

    if (action === 'APPROVE') {
      const notice = await prisma.legalNotice.findUnique({ where: { id: noticeId } });
      if (!notice) return NextResponse.json({ error: 'Legal notice not found' }, { status: 404 });

      // Segregation of duties: preparer cannot approve
      if (notice.preparedBy === actorName || notice.preparedByName === actorName) {
        return NextResponse.json(
          { error: 'Segregation of Duties Violation: Preparer cannot approve their own legal notice.' },
          { status: 403 }
        );
      }

      const approvedNotice = await prisma.legalNotice.update({
        where: { id: noticeId },
        data: {
          status: 'APPROVED',
          approvedBy: actorName,
          approvedByName: actorName,
          approvedAt: new Date(),
        },
      });

      return NextResponse.json({
        ...approvedNotice,
        demandAmount: Number(approvedNotice.demandAmount),
      });
    }

    if (action === 'DISPATCH') {
      const notice = await prisma.legalNotice.findUnique({ where: { id: noticeId } });
      if (!notice) return NextResponse.json({ error: 'Legal notice not found' }, { status: 404 });

      const dispatched = await prisma.legalNotice.update({
        where: { id: noticeId },
        data: {
          status: 'DISPATCHED',
          trackingNumber: trackingNumber || `ED${Math.floor(100000000 + Math.random() * 900000000)}IN`,
          dispatchMode: dispatchMode || notice.dispatchMode,
          dispatchedDate: new Date().toISOString().split('T')[0],
          dispatchedBy: actorName,
        },
      });

      return NextResponse.json({
        ...dispatched,
        demandAmount: Number(dispatched.demandAmount),
      });
    }

    // Default: CREATE NOTICE
    const { recoveryCaseId, legalCaseId, noticeType = 'SECTION_138_CHEQUE_BOUNCE', curePeriodDays = 15, recipientName, recipientAddress, customClauses } = payload || body;

    const rc = await prisma.recoveryCase.findFirst({
      where: { OR: [{ id: recoveryCaseId }, { recoveryCaseNumber: recoveryCaseId }] },
    });

    if (!rc) {
      return NextResponse.json({ error: 'Recovery case not found' }, { status: 404 });
    }

    const loan = await prisma.loanAccount.findUnique({ where: { id: rc.loanId } });
    if (!loan) {
      return NextResponse.json({ error: 'Loan account not found' }, { status: 404 });
    }

    const count = await prisma.legalNotice.count();
    const notSeq = count + 15;
    const noticeNumber = `NOT-${new Date().getFullYear()}-${String(notSeq).padStart(6, '0')}`;

    const noticeDate = new Date().toISOString().split('T')[0];
    const d = new Date();
    d.setDate(d.getDate() + curePeriodDays);
    const dueDate = d.toISOString().split('T')[0];

    const draftContent = generateStatutoryNoticeText({
      noticeType,
      customerName: recipientName || rc.customerName,
      customerAddress: recipientAddress || 'Customer Address on Record',
      accountNumber: rc.accountNumber,
      disbursementDate: loan.disbursementDate,
      originalPrincipal: Number(loan.originalPrincipal),
      overdueAmount: Number(rc.overdueAmount),
      principalOutstanding: Number(loan.outstandingPrincipal),
      interestOutstanding: Number(loan.interestOutstanding),
      feeOutstanding: Number(loan.feeOutstanding),
      penaltyOutstanding: Number(loan.penaltyOutstanding),
      totalOutstanding: Number(loan.totalOutstanding),
      curePeriodDays,
      noticeDate,
      dueDate,
      customClauses,
    });

    const newNotice = await prisma.legalNotice.create({
      data: {
        noticeNumber,
        loanId: rc.loanId,
        recoveryCaseId: rc.id,
        legalCaseId,
        customerId: rc.customerId,
        noticeType,
        status: 'DRAFT',
        demandAmount: Number(rc.overdueAmount) > 0 ? rc.overdueAmount : loan.totalOutstanding,
        noticeDate,
        curePeriodDays,
        dueDate,
        recipientName: recipientName || rc.customerName,
        recipientAddress: recipientAddress || 'Customer Address on Record',
        dispatchMode: 'REGISTERED_POST_AD',
        draftContent,
        preparedBy: actorName,
        preparedByName: actorName,
      },
    });

    return NextResponse.json({
      ...newNotice,
      demandAmount: Number(newNotice.demandAmount),
    });
  } catch (error: any) {
    console.error('Error processing legal notice:', error);
    return NextResponse.json({ error: error.message || 'Failed to process legal notice' }, { status: 500 });
  }
}
