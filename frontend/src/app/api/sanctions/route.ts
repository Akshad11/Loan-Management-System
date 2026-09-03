import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, writeAuditLog } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const applicationId = searchParams.get('applicationId');

    if (id || applicationId) {
      const sanction = await prisma.sanction.findFirst({
        where: id ? { id } : { applicationId: applicationId! },
        include: {
          conditions: true,
          letters: true,
        },
      });

      if (!sanction) return NextResponse.json({ error: 'Sanction not found' }, { status: 404 });
      return NextResponse.json(formatSanction(sanction));
    }

    const sanctions = await prisma.sanction.findMany({
      include: {
        conditions: true,
        letters: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(sanctions.map(formatSanction));
  } catch (error: any) {
    console.error('API /sanctions GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function formatSanction(s: any) {
  const audit = (Array.isArray(s.auditTrail) ? s.auditTrail : []) as any[];

  return {
    id: s.id,
    sanctionNumber: s.sanctionNumber,
    applicationId: s.applicationId,
    applicationNumber: s.applicationNumber,
    approvalId: s.approvalId || '',
    approvalNumber: s.approvalNumber,
    customerId: s.customerId,
    customerNumber: s.customerNumber,
    customerName: s.customerName,
    customerMobile: s.customerMobile,
    customerEmail: s.customerEmail || '',
    customerAddress: s.customerAddress,
    branchId: s.branchId,
    branchName: s.branchName,
    productCode: s.productCode,
    productName: s.productName,
    status: s.status,
    requestedAmount: Number(s.requestedAmount),
    approvedAmount: Number(s.approvedAmount),
    approvedTenureMonths: s.approvedTenureMonths,
    approvedInterestRate: Number(s.approvedInterestRate),
    finalApproverName: s.finalApproverName,
    finalApproverRole: s.finalApproverRole,
    approvedDate: s.approvedDate,
    terms: s.terms,
    termDeviationReason: (s.terms as any)?.deviationNotes,
    conditions: (s.conditions || []).map((sc: any) => ({
      id: sc.id,
      sanctionId: s.id,
      category: sc.category,
      description: sc.description,
      requiredBefore: sc.requiredBefore,
      dueDate: sc.dueDate,
      owner: sc.owner || 'Customer',
      status: sc.status,
      source: sc.source || 'APPROVAL',
      addedBy: sc.addedBy,
      addedAt: sc.addedAt.toISOString(),
      resolvedBy: sc.resolvedBy,
      resolvedAt: sc.resolvedAt?.toISOString(),
    })),
    letters: (s.letters || []).map((lv: any) => ({
      id: lv.id,
      version: lv.version,
      sanctionId: s.id,
      status: lv.status,
      generatedAt: lv.generatedAt.toISOString(),
      generatedBy: lv.generatedBy,
      generatedByRole: 'Branch Manager',
      issuedAt: lv.issuedAt?.toISOString(),
      issuedBy: lv.issuedBy,
      templateVersion: lv.templateId || 'v2.4',
      contentSnapshot: {
        institutionName: 'Apex Financial Services Ltd.',
        institutionAddress: 'Corporate Towers, Nariman Point, Mumbai 400021',
        cinNumber: 'L65923MH1995PLC089123',
        rbiRegistrationNumber: 'B-13.01928',
        date: s.approvedDate || new Date().toISOString().split('T')[0],
        sanctionNumber: s.sanctionNumber,
        applicationNumber: s.applicationNumber,
        approvalNumber: s.approvalNumber,
        customerName: s.customerName,
        customerNumber: s.customerNumber,
        customerAddress: s.customerAddress,
        customerMobile: s.customerMobile,
        customerEmail: s.customerEmail || '',
        productName: s.productName,
        productCode: s.productCode,
        sanctionAmount: Number(s.approvedAmount),
        tenureMonths: s.approvedTenureMonths,
        interestRate: Number(s.approvedInterestRate),
        approxMonthlyEmi: Number((s.terms as any)?.approxMonthlyEmi || 0),
        repaymentFrequency: (s.terms as any)?.repaymentFrequency || 'Monthly',
        purpose: (s.terms as any)?.purpose || 'Personal Use',
        processingFee: Number((s.terms as any)?.processingFee || 0),
        documentationCharge: Number((s.terms as any)?.documentationCharge || 750),
        insuranceCharge: Number((s.terms as any)?.insuranceCharge || 0),
        interestMethodology: (s.terms as any)?.interestMethodology || 'Reducing Balance',
        firstRepaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        validityDays: 45,
        validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        conditions: (s.conditions || []).map((c: any) => ({
          category: c.category,
          description: c.description,
          requiredBefore: c.requiredBefore,
          status: c.status,
        })),
        signatoryName: s.finalApproverName || 'Alex Morgan',
        signatoryRole: s.finalApproverRole || 'Branch Manager',
        signatoryBranch: s.branchName,
      },
    })),
    confirmedAt: s.confirmedAt?.toISOString(),
    confirmedBy: s.confirmedBy,
    auditTrail: audit.map((a: any, idx: number) => ({
      id: a.id || `audit_${idx}`,
      sanctionId: s.id,
      timestamp: a.timestamp || s.updatedAt.toISOString(),
      action: a.action || 'SANCTION_UPDATED',
      actor: a.actor || 'Alex Morgan',
      actorRole: a.actorRole || 'Officer',
      previousState: a.previousState || 'DRAFT',
      newState: a.newState || s.status,
      version: 1,
      notes: a.notes || 'Status changed',
    })),
  };
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, 'create_sanction');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const count = await prisma.sanction.count();
    const sanctionNumber =
      body.sanctionNumber || `SN-2026-${String(count + 1).padStart(6, '0')}`;

    const sanction = await prisma.sanction.create({
      data: {
        id: body.id || undefined,
        sanctionNumber,
        applicationId: body.applicationId,
        applicationNumber: body.applicationNumber,
        approvalId: body.approvalId || null,
        approvalNumber: body.approvalNumber,
        customerId: body.customerId,
        customerNumber: body.customerNumber,
        customerName: body.customerName,
        customerMobile: body.customerMobile || '',
        customerEmail: body.customerEmail || null,
        customerAddress: body.customerAddress || 'Address on record',
        branchId: body.branchId || actorUser.branchId || 'br_panjim',
        branchName: body.branchName || actorUser.branchName || 'Main Branch',
        productCode: body.productCode,
        productName: body.productName,
        status: body.status || 'DRAFT',
        requestedAmount: body.requestedAmount,
        approvedAmount: body.approvedAmount,
        approvedTenureMonths: body.approvedTenureMonths,
        approvedInterestRate: body.approvedInterestRate,
        finalApproverName: body.finalApproverName || actorUser.name,
        finalApproverRole: body.finalApproverRole || actorUser.roleName,
        approvedDate: body.approvedDate || new Date().toISOString().split('T')[0],
        terms: body.terms || {},
        auditTrail: body.auditTrail || [],
      },
    });

    await writeAuditLog({
      actorUser,
      entityType: 'SANCTION',
      entityId: sanction.id,
      entityName: sanctionNumber,
      action: 'CREATE',
      details: `Created sanction ${sanctionNumber} for application ${sanction.applicationNumber}`,
      request,
    });

    return NextResponse.json(formatSanction(sanction), { status: 201 });
  } catch (error: any) {
    console.error('API /sanctions POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireAuth(request, ['edit_sanction', 'confirm_sanction', 'manage_sanction_conditions']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'Sanction ID required' }, { status: 400 });

    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.terms) updateData.terms = data.terms;
    if (data.auditTrail) updateData.auditTrail = data.auditTrail;
    if (data.confirmedBy !== undefined) updateData.confirmedBy = data.confirmedBy;
    if (data.confirmedAt) updateData.confirmedAt = new Date(data.confirmedAt);

    const updated = await prisma.sanction.update({
      where: { id },
      data: updateData,
      include: {
        conditions: true,
        letters: true,
      },
    });

    await writeAuditLog({
      actorUser,
      entityType: 'SANCTION',
      entityId: updated.id,
      entityName: updated.sanctionNumber,
      action: updated.status === 'SANCTION_CONFIRMED' ? 'CONFIRM' : 'UPDATE',
      details: `Sanction ${updated.sanctionNumber} updated. Status: ${updated.status}`,
      request,
    });

    return NextResponse.json(formatSanction(updated));
  } catch (error: any) {
    console.error('API /sanctions PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
