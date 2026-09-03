import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, 'view_loans');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { searchParams } = new URL(request.url);
    const loanId = searchParams.get('loanId');
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};
    if (loanId) where.loanId = loanId;
    if (customerId) where.customerId = customerId;
    if (status && status !== 'ALL') where.status = status;

    if (search) {
      where.OR = [
        { nocNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { accountNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const nocs = await prisma.nocRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        loan: {
          select: {
            id: true,
            accountNumber: true,
            customerName: true,
            status: true,
            productName: true,
          },
        },
      },
    });

    const allNocs = await prisma.nocRecord.findMany();
    const readyCount = allNocs.filter((n) => n.status === 'READY').length;
    const generatedCount = allNocs.filter((n) => n.status === 'GENERATED').length;
    const issuedCount = allNocs.filter((n) => n.status === 'ISSUED').length;

    return NextResponse.json({
      nocs,
      kpis: {
        readyCount,
        generatedCount,
        issuedCount,
        totalCount: allNocs.length,
      },
    });
  } catch (error: any) {
    console.error('API /noc GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, 'close_loan');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const { loanId, generatedBy } = body;

    const loan = await prisma.loanAccount.findFirst({
      where: { OR: [{ id: loanId }, { accountNumber: loanId }] },
    });

    if (!loan) {
      return NextResponse.json({ error: 'Loan account not found.' }, { status: 404 });
    }

    if (loan.status !== 'CLOSED') {
      return NextResponse.json(
        { error: `Cannot generate NOC for loan with status '${loan.status}'. Must be CLOSED first.` },
        { status: 422 }
      );
    }

    let existingNoc = await prisma.nocRecord.findUnique({
      where: { loanId: loan.id },
    });

    if (existingNoc) {
      const updated = await prisma.nocRecord.update({
        where: { id: existingNoc.id },
        data: {
          status: 'GENERATED',
          generatedAt: new Date(),
          generatedBy: generatedBy || 'Operations Officer',
        },
      });
      return NextResponse.json(updated);
    }

    const count = await prisma.nocRecord.count();
    const nocNumber = `NOC-${new Date().getFullYear()}-${String(count + 101).padStart(6, '0')}`;

    const newNoc = await prisma.nocRecord.create({
      data: {
        nocNumber,
        loanId: loan.id,
        customerId: loan.customerId,
        accountNumber: loan.accountNumber,
        customerName: loan.customerName,
        closureRequestId: `clr_direct_${Date.now()}`,
        closureType: 'NORMAL_CLOSURE',
        closureDate: new Date().toISOString().split('T')[0],
        sanctionedAmount: loan.originalPrincipal || loan.disbursedPrincipal,
        disbursedAmount: loan.disbursedPrincipal,
        totalRecoveredAmount: loan.totalPaidAmount || 0,
        status: 'GENERATED',
        documentReference: `DOC-${nocNumber}`,
        generatedAt: new Date(),
        generatedBy: generatedBy || 'Operations Officer',
      },
    });

    return NextResponse.json(newNoc, { status: 201 });
  } catch (error: any) {
    console.error('API /noc POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
