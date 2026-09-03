import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, writeAuditLog } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, 'view_loans');
    if (authResult instanceof NextResponse) return authResult;

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const loan = await prisma.loanAccount.findFirst({
      where: { OR: [{ id }, { accountNumber: id }] },
      select: { id: true },
    });

    if (!loan) {
      return NextResponse.json({ error: 'Loan Account not found.' }, { status: 404 });
    }

    const charges = await prisma.loanCharge.findMany({
      where: { loanId: loan.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(charges);
  } catch (error: any) {
    console.error('API /loans/[id]/charges GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, ['manage_repayments', 'view_loans']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    const loan = await prisma.loanAccount.findFirst({
      where: { OR: [{ id }, { accountNumber: id }] },
    });

    if (!loan) {
      return NextResponse.json({ error: 'Loan Account not found.' }, { status: 404 });
    }

    const charge = await prisma.loanCharge.create({
      data: {
        id: body.id || undefined,
        loanId: loan.id,
        chargeTypeId: body.chargeTypeId || 'CHG_CUSTOM',
        chargeCode: body.chargeCode || 'CUSTOM_FEE',
        chargeName: body.chargeName || 'Manual Service Charge',
        chargeType: body.chargeType || 'ADMINISTRATIVE_FEE',
        calculationType: body.calculationType || 'FIXED',
        rateOrValue: body.rateOrValue || body.amount || 0,
        amount: body.amount || 0,
        taxAmount: body.taxAmount || 0,
        totalAmount: body.totalAmount || body.amount || 0,
        chargeTiming: body.chargeTiming || 'OVERDUE_EVENT',
        dueDate: body.dueDate ? String(body.dueDate) : null,
        status: body.status || 'UNPAID',
        source: body.source || 'MANUAL',
        createdBy: actorUser.name,
      },
    });

    await writeAuditLog({
      actorUser,
      entityType: 'LOAN_CHARGE',
      entityId: charge.id,
      entityName: charge.chargeName,
      action: 'CREATE',
      details: `Added charge "${charge.chargeName}" for ₹${Number(charge.totalAmount)} to loan ${loan.accountNumber}`,
      request,
    });

    return NextResponse.json(charge, { status: 201 });
  } catch (error: any) {
    console.error('API /loans/[id]/charges POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
