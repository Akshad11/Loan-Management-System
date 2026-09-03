import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth, writeAuditLog } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, ['view_customers', 'view_application_documents']);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    const where = customerId ? { customerId } : {};
    const docs = await prisma.documentItem.findMany({
      where,
      include: {
        customer: {
          select: { customerNumber: true, name: true },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    const formatted = docs.map((d: any) => ({
      id: d.id,
      customerId: d.customerId,
      customerNumber: d.customer?.customerNumber || '',
      customerName: d.customer?.name || '',
      documentNumberMasked: d.documentNumber || '',
      title: d.title,
      documentTitle: d.title,
      category: d.category,
      documentType: d.documentType,
      fileName: d.fileUrl || `${d.documentType.toLowerCase()}.pdf`,
      fileFormat: d.fileFormat,
      fileSizeKb: d.fileSizeKb,
      status: d.status,
      uploadedAt: d.uploadedAt.toISOString(),
      uploadedBy: d.uploadedBy,
      uploadedByRole: 'Loan Officer',
      version: 1,
      verifiedAt: d.verifiedAt?.toISOString(),
      verifiedBy: d.verifiedBy,
      rejectionNotes: d.rejectionNote,
      rejectionReason: d.rejectionNote,
      isLifetimeValid: true,
      ocrExtractedData: d.ocrExtracted,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('API /documents GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, ['manage_customers', 'upload_application_documents']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    if (!body.customerId) {
      return NextResponse.json({ error: 'customerId is required to save document' }, { status: 400 });
    }

    // Ensure customer exists in PostgreSQL before creating document
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
          mobile: body.mobile || '9876543210',
          monthlyIncome: 0,
          branchId: body.branchId || actorUser.branchId || 'br_panjim',
          branchName: body.branchName || actorUser.branchName || 'Panaji Main Branch',
          currentAddress: {},
          permanentAddress: {},
        },
      });
    }

    const doc = await prisma.documentItem.create({
      data: {
        id: body.id || undefined,
        customerId: body.customerId,
        documentNumber: body.documentNumber || body.documentNumberMasked || null,
        title: body.title || body.documentTitle || body.documentType || 'Uploaded Document',
        category: body.category || 'IDENTITY_PROOF',
        documentType: body.documentType || 'OTHER',
        fileFormat: body.fileFormat || 'PDF',
        fileSizeKb: body.fileSizeKb || 512,
        fileUrl: body.fileUrl || body.fileName || null,
        status: body.status || 'PENDING_VERIFICATION',
        uploadedAt: body.uploadedAt ? new Date(body.uploadedAt) : new Date(),
        uploadedBy: body.uploadedBy || actorUser.name,
        verifiedAt: body.verifiedAt ? new Date(body.verifiedAt) : null,
        verifiedBy: body.verifiedBy || null,
        rejectionNote: body.rejectionNote || body.rejectionNotes || null,
        ocrExtracted: body.ocrExtractedData || body.ocrExtracted || null,
      },
      include: {
        customer: {
          select: { customerNumber: true, name: true },
        },
      },
    });

    await writeAuditLog({
      actorUser,
      entityType: 'CUSTOMER',
      entityId: body.customerId,
      entityName: doc.title,
      action: 'DOCUMENT_UPLOAD',
      details: `Uploaded document "${doc.title}" (${doc.documentType}) for customer ${customer.name}`,
      request,
    });

    const formattedDoc = {
      id: doc.id,
      customerId: doc.customerId,
      customerNumber: doc.customer?.customerNumber || customer.customerNumber,
      customerName: doc.customer?.name || customer.name,
      documentNumberMasked: doc.documentNumber || '',
      title: doc.title,
      documentTitle: doc.title,
      category: doc.category,
      documentType: doc.documentType,
      fileName: doc.fileUrl || `${doc.documentType.toLowerCase()}.pdf`,
      fileFormat: doc.fileFormat,
      fileSizeKb: doc.fileSizeKb,
      status: doc.status,
      uploadedAt: doc.uploadedAt.toISOString(),
      uploadedBy: doc.uploadedBy,
      uploadedByRole: body.uploadedByRole || 'Loan Officer',
      version: 1,
      verifiedAt: doc.verifiedAt?.toISOString(),
      verifiedBy: doc.verifiedBy,
      rejectionNotes: doc.rejectionNote,
      rejectionReason: doc.rejectionNote,
      isLifetimeValid: true,
      ocrExtractedData: doc.ocrExtracted,
    };

    return NextResponse.json(formattedDoc, { status: 201 });
  } catch (error: any) {
    console.error('API /documents POST error:', error);
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
    if (!id) return NextResponse.json({ error: 'Document ID required' }, { status: 400 });

    const doc = await prisma.documentItem.update({
      where: { id },
      data: {
        status: data.status,
        verifiedAt: data.status === 'VERIFIED' ? new Date() : undefined,
        verifiedBy: data.status === 'VERIFIED' ? (data.verifiedBy || actorUser.name) : undefined,
        rejectionNote: data.rejectionNote || data.rejectionReason || data.notes || undefined,
      },
      include: {
        customer: {
          select: { customerNumber: true, name: true },
        },
      },
    });

    await writeAuditLog({
      actorUser,
      entityType: 'CUSTOMER',
      entityId: doc.customerId,
      entityName: doc.title,
      action: 'DOCUMENT_VERIFY',
      details: `Document "${doc.title}" marked as ${data.status}`,
      request,
    });

    return NextResponse.json(doc);
  } catch (error: any) {
    console.error('API /documents PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const authResult = await requireAuth(request, ['manage_customers']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Document ID required' }, { status: 400 });

    const existing = await prisma.documentItem.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    await prisma.documentItem.delete({ where: { id } });

    await writeAuditLog({
      actorUser,
      entityType: 'CUSTOMER',
      entityId: existing.customerId,
      entityName: existing.title,
      action: 'DOCUMENT_DELETE',
      details: `Document "${existing.title}" deleted from vault`,
      request,
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error('API /documents DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
