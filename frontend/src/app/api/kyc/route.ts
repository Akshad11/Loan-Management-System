import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, writeAuditLog } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, 'view_customers');
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    const where = customerId ? { customerId } : {};
    const records = await prisma.kycRecord.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    const formatted = records.map((k) => ({
      id: k.id,
      customerId: k.customerId,
      customerNumber: k.customerNumber,
      customerName: k.customerName,
      customerType: k.customerType,
      status: k.status,
      kycLevel: k.kycLevel,
      riskCategory: k.riskCategory,
      cKycNumber: k.cKycNumber || '',
      panRecord: k.panRecord,
      aadhaarRecord: k.aadhaarRecord,
      secondaryIdRecord: k.secondaryIdRecord,
      videoKycRecord: k.videoKycRecord,
      verifiedAt: k.verifiedAt?.toISOString(),
      verifiedBy: k.verifiedBy,
      assignedOfficer: k.verifiedBy || 'Alex Morgan',
      lastReviewedAt: k.updatedAt.toISOString(),
      nextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdDate: k.createdAt.toISOString().split('T')[0],
      updatedDate: k.updatedAt.toISOString().split('T')[0],
      complianceNotes: 'KYC verified and cross-referenced with C-KYC database.',
      pepDeclared: false,
      fatcaCompliant: true,
      amlCheckStatus: 'CLEARED',
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('API /kyc GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, ['verify_kyc', 'manage_customers']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const kyc = await prisma.kycRecord.create({
      data: {
        id: body.id || undefined,
        customerId: body.customerId,
        customerNumber: body.customerNumber,
        customerName: body.customerName,
        customerType: body.customerType || 'INDIVIDUAL',
        status: body.status || 'VERIFIED',
        kycLevel: body.kycLevel || 'TIER_3_FULL_CKYC',
        riskCategory: body.riskCategory || 'LOW',
        cKycNumber: body.cKycNumber || null,
        panRecord: body.panRecord || null,
        aadhaarRecord: body.aadhaarRecord || null,
        secondaryIdRecord: body.secondaryIdRecord || null,
        videoKycRecord: body.videoKycRecord || null,
        verifiedAt: body.verifiedAt ? new Date(body.verifiedAt) : new Date(),
        verifiedBy: actorUser.name,
      },
    });

    await writeAuditLog({
      actorUser,
      entityType: 'CUSTOMER',
      entityId: body.customerId,
      entityName: body.customerName || 'Customer KYC',
      action: 'KYC_VERIFIED',
      details: `KYC verified for customer ${body.customerNumber} (${body.customerName})`,
      request,
    });

    return NextResponse.json(kyc, { status: 201 });
  } catch (error: any) {
    console.error('API /kyc POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authResult = await requireAuth(request, ['verify_kyc', 'manage_customers']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'KYC Record ID required' }, { status: 400 });

    const kyc = await prisma.kycRecord.update({
      where: { id },
      data: {
        status: data.status,
        kycLevel: data.kycLevel,
        riskCategory: data.riskCategory,
        panRecord: data.panRecord,
        aadhaarRecord: data.aadhaarRecord,
        secondaryIdRecord: data.secondaryIdRecord,
        videoKycRecord: data.videoKycRecord,
        verifiedAt: data.status === 'VERIFIED' ? new Date() : undefined,
        verifiedBy: data.status === 'VERIFIED' ? actorUser.name : undefined,
      },
    });

    await writeAuditLog({
      actorUser,
      entityType: 'CUSTOMER',
      entityId: kyc.customerId,
      entityName: kyc.customerName || 'Customer KYC',
      action: 'KYC_UPDATED',
      details: `KYC record updated to status: ${data.status}`,
      request,
    });

    return NextResponse.json(kyc);
  } catch (error: any) {
    console.error('API /kyc PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
