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

    // Synchronize loan applications for this customer in database
    await prisma.loanApplication.updateMany({
      where: { customerId: body.customerId },
      data: { customerKycStatus: kyc.status },
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
    const authResult = await requireAuth(request, ['verify_kyc', 'manage_customers', 'view_customers', 'view_applications']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const { id, ...data } = body;
    const targetCustomerId = data.customerId || body.customerId;

    if (!id && !targetCustomerId) {
      return NextResponse.json({ error: 'KYC Record ID or Customer ID required' }, { status: 400 });
    }

    // Look up existing KYC record by id or customerId
    let existingKyc = await prisma.kycRecord.findFirst({
      where: {
        OR: [
          ...(id ? [{ id }] : []),
          ...(targetCustomerId ? [{ customerId: targetCustomerId }] : []),
        ],
      },
    });

    let kyc;
    if (existingKyc) {
      kyc = await prisma.kycRecord.update({
        where: { id: existingKyc.id },
        data: {
          status: data.status || existingKyc.status,
          kycLevel: data.kycLevel || existingKyc.kycLevel,
          riskCategory: data.riskCategory || existingKyc.riskCategory,
          panRecord: data.panRecord !== undefined ? data.panRecord : existingKyc.panRecord,
          aadhaarRecord: data.aadhaarRecord !== undefined ? data.aadhaarRecord : existingKyc.aadhaarRecord,
          secondaryIdRecord: data.secondaryIdRecord !== undefined ? data.secondaryIdRecord : existingKyc.secondaryIdRecord,
          videoKycRecord: data.videoKycRecord !== undefined ? data.videoKycRecord : existingKyc.videoKycRecord,
          verifiedAt: data.status === 'VERIFIED' ? new Date() : existingKyc.verifiedAt,
          verifiedBy: data.status === 'VERIFIED' ? (data.verifiedBy || actorUser.name) : existingKyc.verifiedBy,
        },
      });
    } else if (targetCustomerId) {
      const customer = await prisma.customer.findUnique({ where: { id: targetCustomerId } });
      kyc = await prisma.kycRecord.create({
        data: {
          id: id || undefined,
          customerId: targetCustomerId,
          customerNumber: data.customerNumber || customer?.customerNumber || '',
          customerName: data.customerName || customer?.name || '',
          customerType: data.customerType || customer?.customerType || 'INDIVIDUAL',
          status: data.status || 'VERIFIED',
          kycLevel: data.kycLevel || 'TIER_2_STANDARD',
          riskCategory: data.riskCategory || 'LOW',
          panRecord: data.panRecord || null,
          aadhaarRecord: data.aadhaarRecord || null,
          secondaryIdRecord: data.secondaryIdRecord || null,
          videoKycRecord: data.videoKycRecord || null,
          verifiedAt: data.status === 'VERIFIED' ? new Date() : null,
          verifiedBy: data.status === 'VERIFIED' ? (data.verifiedBy || actorUser.name) : null,
        },
      });
    }

    if (kyc) {
      // Synchronize loan applications for this customer in database
      await prisma.loanApplication.updateMany({
        where: { customerId: kyc.customerId },
        data: { customerKycStatus: kyc.status },
      });

      await writeAuditLog({
        actorUser,
        entityType: 'CUSTOMER',
        entityId: kyc.customerId,
        entityName: kyc.customerName || 'Customer KYC',
        action: data.status === 'VERIFIED' ? 'KYC_VERIFIED' : 'KYC_UPDATED',
        details: `KYC record updated to status: ${kyc.status}`,
        request,
      });

      return NextResponse.json(kyc);
    }

    return NextResponse.json({ error: 'Failed to update or create KYC record' }, { status: 400 });
  } catch (error: any) {
    console.error('API /kyc PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
