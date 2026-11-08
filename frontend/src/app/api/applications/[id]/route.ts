import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, writeAuditLog } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, ['view_applications', 'credit.view']);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    const app = await prisma.loanApplication.findFirst({
      where: {
        OR: [{ id }, { applicationNumber: id }],
      },
      include: {
        customer: true,
        coApplicants: true,
        guarantors: true,
        documents: true,
        history: { orderBy: { timestamp: 'desc' } },
        formResponse: true,
      },
    });

    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...app,
      requestedAmount: Number(app.requestedAmount),
      interestRate: Number(app.interestRate),
      customerMonthlyIncome: Number(app.customerMonthlyIncome),
      customerTotalExposure: Number(app.customerTotalExposure),
      sanctionedAmount: app.sanctionedAmount ? Number(app.sanctionedAmount) : null,
      formResponse: app.formResponse,
    });
  } catch (error: any) {
    console.error('API /applications/[id] GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, ['edit_application', 'credit.review']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { id } = await params;
    const existing = await prisma.loanApplication.findFirst({
      where: {
        OR: [{ id }, { applicationNumber: id }],
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const body = await request.json();
    const updateData: any = {};

    if (body.status !== undefined) updateData.status = body.status;
    if (body.assignedOfficerId !== undefined) updateData.assignedOfficerId = body.assignedOfficerId;
    if (body.loanOfficer !== undefined) updateData.loanOfficer = body.loanOfficer;
    if (body.sanctionedAmount !== undefined) updateData.sanctionedAmount = body.sanctionedAmount;
    if (body.sanctionedTenureMonths !== undefined) updateData.sanctionedTenureMonths = body.sanctionedTenureMonths;
    if (body.interestRate !== undefined) updateData.interestRate = body.interestRate;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const updated = await prisma.loanApplication.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        customer: true,
        coApplicants: true,
        guarantors: true,
        documents: true,
        history: { orderBy: { timestamp: 'desc' } },
        formResponse: true,
      },
    });

    await writeAuditLog({
      actorUser,
      entityType: 'APPLICATION',
      entityId: existing.id,
      entityName: existing.applicationNumber,
      action: 'UPDATE_APPLICATION',
      details: `Application ${existing.applicationNumber} updated with fields: ${Object.keys(updateData).join(', ')}`,
      changes: updateData,
    });

    return NextResponse.json({
      ...updated,
      requestedAmount: Number(updated.requestedAmount),
      interestRate: Number(updated.interestRate),
      customerMonthlyIncome: Number(updated.customerMonthlyIncome),
      customerTotalExposure: Number(updated.customerTotalExposure),
      sanctionedAmount: updated.sanctionedAmount ? Number(updated.sanctionedAmount) : null,
    });
  } catch (error: any) {
    console.error('API /applications/[id] PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
