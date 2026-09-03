import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, writeAuditLog } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, 'view_applications');
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const app = await prisma.loanApplication.findUnique({
        where: { id },
        include: {
          coApplicants: true,
          guarantors: true,
          documents: true,
          history: { orderBy: { timestamp: 'desc' } },
        },
      });
      if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

      return NextResponse.json({
        ...app,
        requestedAmount: Number(app.requestedAmount),
        interestRate: Number(app.interestRate),
        customerMonthlyIncome: Number(app.customerMonthlyIncome),
        customerTotalExposure: Number(app.customerTotalExposure),
      });
    }

    const apps = await prisma.loanApplication.findMany({
      include: {
        coApplicants: true,
        guarantors: true,
        documents: true,
        history: { orderBy: { timestamp: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = apps.map((app: any) => ({
      id: app.id,
      applicationNumber: app.applicationNumber,
      customerId: app.customerId,
      customerNumber: app.customerNumber,
      customerName: app.customerName,
      customerMobile: app.customerMobile,
      customerKycStatus: app.customerKycStatus,
      customerMonthlyIncome: Number(app.customerMonthlyIncome),
      customerEmploymentType: app.customerEmploymentType,
      customerExistingLoansCount: app.customerExistingLoansCount,
      customerTotalExposure: Number(app.customerTotalExposure),
      productCode: app.productCode,
      productName: app.productName,
      requestedAmount: Number(app.requestedAmount),
      requestedTenureMonths: app.requestedTenureMonths,
      interestRate: Number(app.interestRate),
      repaymentFrequency: app.repaymentFrequency,
      preferredRepaymentDate: app.preferredRepaymentDate,
      purpose: app.purpose,
      purposeCategory: app.purposeCategory || 'GENERAL',
      branchId: app.branchId,
      branchName: app.branchName,
      loanOfficer: app.loanOfficer,
      assignedOfficerId: app.assignedOfficerId,
      status: app.status,
      priority: app.priority,
      notes: app.notes,
      submissionDeclarations: app.submissionDeclarations,
      submittedAt: app.submittedAt?.toISOString(),
      submittedBy: app.submittedBy,
      rejectionReason: app.rejectionReason,
      cancellationReason: app.cancellationReason,
      coApplicants: app.coApplicants.map((ca: any) => ({
        ...ca,
        monthlyIncome: Number(ca.monthlyIncome),
        totalOutstanding: Number(ca.totalOutstanding),
        addedAt: ca.addedAt.toISOString(),
      })),
      guarantors: app.guarantors.map((g: any) => ({
        ...g,
        netWorth: Number(g.netWorthEstimated || 0),
        addedAt: g.addedAt.toISOString(),
      })),
      documents: app.documents.map((d: any) => ({
        ...d,
        uploadedAt: d.uploadedAt?.toISOString() || new Date().toISOString(),
        verifiedAt: d.verifiedAt?.toISOString(),
      })),
      history: app.history.map((h: any) => ({
        ...h,
        timestamp: h.timestamp.toISOString(),
      })),
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('API /applications GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, 'create_application');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const appCount = await prisma.loanApplication.count();
    const applicationNumber =
      body.applicationNumber || `APP-2026-${String(appCount + 1).padStart(6, '0')}`;

    if (!body.customerId) {
      return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
    }

    let customer = await prisma.customer.findUnique({
      where: { id: body.customerId },
    });

    if (!customer) {
      const customerCount = await prisma.customer.count();
      const customerNumber = body.customerNumber || `CUS-${String(customerCount + 1).padStart(6, '0')}`;
      const name = body.customerName || 'Borrower Customer';
      const parts = name.trim().split(' ');
      const firstName = parts[0] || 'Borrower';
      const lastName = parts.slice(1).join(' ') || 'Customer';

      customer = await prisma.customer.create({
        data: {
          id: body.customerId,
          customerNumber,
          firstName,
          lastName,
          name,
          dateOfBirth: '1990-01-01',
          mobile: body.customerMobile || '9876543210',
          monthlyIncome: body.customerMonthlyIncome || 50000,
          branchId: body.branchId || actorUser.branchId || 'br_panjim',
          branchName: body.branchName || actorUser.branchName || 'Panaji Head Office Branch',
          currentAddress: {},
          permanentAddress: {},
        },
      });
    }

    const app = await prisma.loanApplication.create({
      data: {
        id: body.id || undefined,
        applicationNumber,
        customerId: customer.id,
        customerNumber: customer.customerNumber,
        customerName: customer.name,
        customerMobile: body.customerMobile || customer.mobile,
        customerKycStatus: body.customerKycStatus || 'VERIFIED',
        customerMonthlyIncome: body.customerMonthlyIncome || 0,
        customerEmploymentType: body.customerEmploymentType || 'SALARIED',
        customerExistingLoansCount: body.customerExistingLoansCount || 0,
        customerTotalExposure: body.customerTotalExposure || 0,
        productCode: body.productCode,
        productName: body.productName,
        requestedAmount: body.requestedAmount,
        requestedTenureMonths: body.requestedTenureMonths,
        interestRate: body.interestRate,
        repaymentFrequency: body.repaymentFrequency || 'MONTHLY',
        preferredRepaymentDate: body.preferredRepaymentDate || 5,
        purpose: body.purpose,
        purposeCategory: body.purposeCategory || 'GENERAL',
        branchId: body.branchId || actorUser.branchId || 'br_panjim',
        branchName: body.branchName || actorUser.branchName || 'Main Branch',
        loanOfficer: body.loanOfficer || actorUser.name,
        assignedOfficerId: body.assignedOfficerId || actorUser.id,
        status: (body.status as any) || 'DRAFT',
        priority: body.priority || 'NORMAL',
        notes: body.notes || null,
        submissionDeclarations: body.submissionDeclarations || {},
        submittedAt: body.submittedAt ? new Date(body.submittedAt) : null,
        submittedBy: body.submittedBy || null,
      },
    });

    // Create history entry
    await prisma.applicationHistory.create({
      data: {
        applicationId: app.id,
        eventType: 'APPLICATION_CREATED',
        action: 'Application Created',
        actor: actorUser.name,
        actorRole: actorUser.roleName,
        description: `Loan application ${applicationNumber} created for ₹${Number(app.requestedAmount).toLocaleString('en-IN')}`,
      },
    });

    await writeAuditLog({
      actorUser,
      entityType: 'APPLICATION',
      entityId: app.id,
      entityName: applicationNumber,
      action: 'CREATE',
      details: `Created application ${applicationNumber} for customer ${app.customerName}`,
      request,
    });

    return NextResponse.json(app, { status: 201 });
  } catch (error: any) {
    console.error('API /applications POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireAuth(request, ['edit_application', 'submit_application', 'cancel_application']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const { id, historyEvent, ...data } = body;
    if (!id) return NextResponse.json({ error: 'Application ID required' }, { status: 400 });

    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.priority) updateData.priority = data.priority;
    if (data.assignedOfficerId !== undefined) updateData.assignedOfficerId = data.assignedOfficerId;
    if (data.loanOfficer !== undefined) updateData.loanOfficer = data.loanOfficer;
    if (data.requestedAmount !== undefined) updateData.requestedAmount = data.requestedAmount;
    if (data.requestedTenureMonths !== undefined) updateData.requestedTenureMonths = data.requestedTenureMonths;
    if (data.interestRate !== undefined) updateData.interestRate = data.interestRate;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.rejectionReason !== undefined) updateData.rejectionReason = data.rejectionReason;
    if (data.cancellationReason !== undefined) updateData.cancellationReason = data.cancellationReason;
    if (data.submittedAt) updateData.submittedAt = new Date(data.submittedAt);
    if (data.submittedBy) updateData.submittedBy = data.submittedBy;

    const app = await prisma.loanApplication.update({
      where: { id },
      data: updateData,
    });

    if (historyEvent) {
      await prisma.applicationHistory.create({
        data: {
          applicationId: id,
          eventType: historyEvent.eventType || 'STATUS_CHANGED',
          action: historyEvent.title || historyEvent.action || 'Application Updated',
          actor: actorUser.name,
          actorRole: actorUser.roleName,
          description: historyEvent.description || `Application status updated to ${app.status}`,
        },
      });
    }

    await writeAuditLog({
      actorUser,
      entityType: 'APPLICATION',
      entityId: app.id,
      entityName: app.applicationNumber,
      action: 'UPDATE',
      details: `Application ${app.applicationNumber} updated. Status: ${app.status}`,
      request,
    });

    return NextResponse.json(app);
  } catch (error: any) {
    console.error('API /applications PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

