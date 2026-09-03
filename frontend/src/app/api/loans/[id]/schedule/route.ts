import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateRepaymentSchedule } from '@/services/loanFinancialService';
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
    const { searchParams } = new URL(request.url);
    const versionStr = searchParams.get('version');

    const loan = await prisma.loanAccount.findFirst({
      where: { OR: [{ id }, { accountNumber: id }] },
    });

    if (!loan) {
      return NextResponse.json({ error: 'Loan Account not found.' }, { status: 404 });
    }

    const versionNumber = versionStr ? parseInt(versionStr, 10) : loan.currentScheduleVersion;

    const version = await prisma.repaymentScheduleVersion.findFirst({
      where: { loanId: loan.id, version: versionNumber },
      include: {
        schedules: {
          orderBy: { instalmentNumber: 'asc' },
        },
      },
    });

    return NextResponse.json(version || { error: 'Schedule version not found.' });
  } catch (error: any) {
    console.error(`API /loans/[id]/schedule GET error:`, error);
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

    const newVersionNumber = loan.currentScheduleVersion + 1;
    const rate = body.annualRate !== undefined ? Number(body.annualRate) : Number(loan.interestRate);
    const tenure = body.tenureMonths !== undefined ? Number(body.tenureMonths) : loan.remainingInstalments;
    const frequency = body.frequency || loan.repaymentFrequency;
    const reason = body.reason || 'Restructuring / Rate Adjustment';

    const startDate = new Date().toISOString().split('T')[0];
    const firstDueDateObj = new Date();
    firstDueDateObj.setDate(firstDueDateObj.getDate() + 30);
    const firstDueDate = firstDueDateObj.toISOString().split('T')[0];

    const result = generateRepaymentSchedule({
      loanId: loan.id,
      versionNumber: newVersionNumber,
      reason,
      principal: Number(loan.outstandingPrincipal),
      annualRate: rate,
      tenureMonths: tenure,
      frequency: frequency as any,
      interestMethod: loan.interestMethod as any,
      startDate,
      firstDueDate,
      createdBy: body.createdBy || 'Operations Officer',
    });

    // Mark previous versions superseded
    await prisma.repaymentScheduleVersion.updateMany({
      where: { loanId: loan.id, status: 'ACTIVE' },
      data: { status: 'SUPERSEDED' },
    });

    const newVersion = await prisma.repaymentScheduleVersion.create({
      data: {
        id: result.version.id,
        loanId: loan.id,
        version: newVersionNumber,
        reason,
        effectiveDate: result.version.effectiveDate,
        totalInstalments: result.totalInstalments,
        totalPrincipal: result.totalPrincipal,
        totalInterest: result.totalInterest,
        totalAmount: result.totalAmount,
        status: 'ACTIVE',
        createdBy: body.createdBy || 'Operations Officer',
      },
    });

    // Create schedule rows
    await prisma.repaymentSchedule.createMany({
      data: result.schedules.map((s) => ({
        id: s.id,
        loanId: loan.id,
        versionId: newVersion.id,
        versionNumber: newVersionNumber,
        instalmentNumber: s.instalmentNumber,
        dueDate: s.dueDate,
        openingPrincipal: s.openingPrincipal,
        principalDue: s.principalDue,
        interestDue: s.interestDue,
        feesDue: s.feesDue,
        instalmentAmount: s.instalmentAmount,
        closingPrincipal: s.closingPrincipal,
        principalPaid: 0,
        interestPaid: 0,
        feesPaid: 0,
        totalPaid: 0,
        outstandingAmount: s.outstandingAmount,
        status: s.status as any,
        dpd: 0,
      })),
    });

    // Update loan account current version
    await prisma.loanAccount.update({
      where: { id: loan.id },
      data: {
        currentScheduleVersion: newVersionNumber,
        emiAmount: result.emiAmount,
        interestRate: rate,
        repaymentFrequency: frequency,
        remainingInstalments: result.totalInstalments,
        maturityDate: result.maturityDate,
        updatedBy: body.createdBy || 'Operations Officer',
      },
    });

    return NextResponse.json({ version: newVersion, schedules: result.schedules }, { status: 201 });
  } catch (error: any) {
    console.error(`API /loans/[id]/schedule POST error:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
