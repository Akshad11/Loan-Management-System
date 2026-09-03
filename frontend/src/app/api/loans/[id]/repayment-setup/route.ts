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
    const settings = await prisma.loanRepaymentSetting.findFirst({
      where: {
        OR: [{ loanId: id }, { loan: { accountNumber: id } }],
      },
    });

    if (!settings) {
      return NextResponse.json({ error: 'Repayment settings not found.' }, { status: 404 });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error('API /loans/[id]/repayment-setup GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
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

    const updated = await prisma.loanRepaymentSetting.upsert({
      where: { loanId: loan.id },
      create: {
        loanId: loan.id,
        repaymentFrequency: body.repaymentFrequency || 'MONTHLY',
        paymentMethod: body.paymentMethod || 'NACH_EMANDATE',
        mandateStatus: body.mandateStatus || 'ACTIVE',
        mandateReference: body.mandateReference || null,
        bankAccountMasked: body.bankAccountMasked || null,
        bankName: body.bankName || null,
        ifscCode: body.ifscCode || null,
        accountHolderName: body.accountHolderName || null,
        preferredDebitDate: body.preferredDebitDate || 5,
        gracePeriodDays: body.gracePeriodDays || 3,
        updatedBy: actorUser.name,
      },
      update: {
        repaymentFrequency: body.repaymentFrequency || undefined,
        paymentMethod: body.paymentMethod || undefined,
        mandateStatus: body.mandateStatus || undefined,
        mandateReference: body.mandateReference || undefined,
        bankAccountMasked: body.bankAccountMasked || undefined,
        bankName: body.bankName || undefined,
        ifscCode: body.ifscCode || undefined,
        accountHolderName: body.accountHolderName || undefined,
        preferredDebitDate: body.preferredDebitDate !== undefined ? body.preferredDebitDate : undefined,
        gracePeriodDays: body.gracePeriodDays !== undefined ? body.gracePeriodDays : undefined,
        updatedBy: actorUser.name,
      },
    });

    await writeAuditLog({
      actorUser,
      entityType: 'LOAN_ACCOUNT',
      entityId: loan.id,
      entityName: loan.accountNumber,
      action: 'UPDATE_REPAYMENT_SETUP',
      details: `Updated repayment setup for loan ${loan.accountNumber}`,
      request,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('API /loans/[id]/repayment-setup PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
