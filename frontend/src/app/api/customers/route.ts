import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, writeAuditLog } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, 'view_customers');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          kycRecords: true,
          documents: true,
          applications: true,
          loans: true,
          history: { orderBy: { timestamp: 'desc' } },
        },
      });
      if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

      return NextResponse.json({
        ...customer,
        monthlyIncome: Number(customer.monthlyIncome),
        totalOutstanding: Number(customer.totalOutstanding),
        totalOverdue: Number(customer.totalOverdue),
      });
    }

    const customers = await prisma.customer.findMany({
      include: {
        kycRecords: true,
        history: { orderBy: { timestamp: 'desc' }, take: 10 },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = customers.map((c: any) => {
      const latestKyc = c.kycRecords[0];
      return {
        id: c.id,
        customerNumber: c.customerNumber,
        firstName: c.firstName,
        middleName: c.middleName,
        lastName: c.lastName,
        name: c.name,
        dateOfBirth: c.dateOfBirth,
        gender: c.gender,
        maritalStatus: c.maritalStatus,
        nationality: c.nationality,
        customerType: c.customerType,
        mobile: c.mobile,
        alternateMobile: c.alternateMobile,
        email: c.email,
        preferredContact: c.preferredContact,
        currentAddress: c.currentAddress,
        permanentAddress: c.permanentAddress,
        sameAsCurrentAddress: c.sameAsCurrentAddress,
        employmentType: c.employmentType,
        employerName: c.employerName,
        occupation: c.occupation,
        monthlyIncome: Number(c.monthlyIncome),
        employmentSince: c.employmentSince,
        bankName: c.bankName,
        accountNumberMasked: c.accountNumberMasked,
        accountNumber: c.accountNumber,
        ifscCode: c.ifscCode,
        branchId: c.branchId,
        branchName: c.branchName,
        status: c.status,
        kycStatus: latestKyc?.status || 'UNVERIFIED',
        kycLevel: latestKyc?.kycLevel || 'TIER_1_BASIC',
        assignedOfficer: c.assignedOfficer,
        activeLoanCount: c.activeLoanCount,
        closedLoanCount: c.closedLoanCount,
        totalOutstanding: Number(c.totalOutstanding),
        totalOverdue: Number(c.totalOverdue),
        cibilScore: c.cibilScore || 720,
        panMasked: c.panMasked,
        aadhaarMasked: c.aadhaarMasked,
        archivedReason: c.archivedReason,
        archivedDate: c.archivedDate?.toISOString(),
        archivedBy: c.archivedBy,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('API /customers GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, 'manage_customers');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const customerCount = await prisma.customer.count();
    const customerNumber = body.customerNumber || `CUS-${String(customerCount + 1).padStart(6, '0')}`;

    const customer = await prisma.customer.create({
      data: {
        id: body.id || undefined,
        customerNumber,
        firstName: body.firstName,
        middleName: body.middleName || null,
        lastName: body.lastName,
        name: `${body.firstName} ${body.lastName}`,
        dateOfBirth: body.dateOfBirth,
        gender: body.gender || 'MALE',
        maritalStatus: body.maritalStatus || 'SINGLE',
        nationality: body.nationality || 'Indian',
        customerType: body.customerType || 'INDIVIDUAL',
        mobile: body.mobile,
        alternateMobile: body.alternateMobile || null,
        email: body.email || null,
        preferredContact: body.preferredContact || 'MOBILE',
        currentAddress: body.currentAddress || {},
        permanentAddress: body.permanentAddress || {},
        sameAsCurrentAddress: body.sameAsCurrentAddress ?? true,
        employmentType: body.employmentType || 'SALARIED',
        employerName: body.employerName || null,
        occupation: body.occupation || null,
        monthlyIncome: body.monthlyIncome || 0,
        employmentSince: body.employmentSince || null,
        bankName: body.bankName || null,
        accountNumberMasked: body.accountNumberMasked || null,
        accountNumber: body.accountNumber || null,
        ifscCode: body.ifscCode || null,
        branchId: body.branchId || actorUser.branchId || 'br_panjim',
        branchName: body.branchName || actorUser.branchName || 'Main Branch',
        status: body.status || 'ACTIVE',
        assignedOfficer: body.assignedOfficer || actorUser.name,
        cibilScore: body.cibilScore || 750,
        panMasked: body.panMasked || null,
        aadhaarMasked: body.aadhaarMasked || null,
      },
    });

    // Add initial history event
    await prisma.customerHistory.create({
      data: {
        customerId: customer.id,
        eventType: 'CUSTOMER_CREATED',
        title: 'Customer Onboarded',
        actor: actorUser.name,
        actorRole: actorUser.roleName,
        description: `Customer profile created with identification ${customerNumber}`,
        module: 'CUSTOMERS',
      },
    });

    await writeAuditLog({
      actorUser,
      entityType: 'CUSTOMER',
      entityId: customer.id,
      entityName: customer.name,
      action: 'CREATE',
      details: `Created customer profile ${customerNumber} (${customer.name})`,
      request,
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error: any) {
    console.error('API /customers POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireAuth(request, 'manage_customers');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });

    const updateData: any = {};
    if (data.firstName || data.lastName) {
      updateData.firstName = data.firstName;
      updateData.lastName = data.lastName;
      updateData.name = `${data.firstName || ''} ${data.lastName || ''}`.trim();
    }
    if (data.mobile) updateData.mobile = data.mobile;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.monthlyIncome !== undefined) updateData.monthlyIncome = data.monthlyIncome;
    if (data.employmentType) updateData.employmentType = data.employmentType;
    if (data.employerName !== undefined) updateData.employerName = data.employerName;
    if (data.currentAddress) updateData.currentAddress = data.currentAddress;
    if (data.permanentAddress) updateData.permanentAddress = data.permanentAddress;
    if (data.status) updateData.status = data.status;
    if (data.cibilScore) updateData.cibilScore = data.cibilScore;
    if (data.branchId) updateData.branchId = data.branchId;
    if (data.branchName) updateData.branchName = data.branchName;
    if (data.assignedOfficer !== undefined) updateData.assignedOfficer = data.assignedOfficer;
    if (data.archivedReason) updateData.archivedReason = data.archivedReason;
    if (data.archivedDate) updateData.archivedDate = new Date(data.archivedDate);
    if (data.archivedBy) updateData.archivedBy = data.archivedBy;

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error('API /customers PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
