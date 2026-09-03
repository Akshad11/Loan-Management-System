import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateFormResponses, calculateFormProgress } from '@/services/formEngine';
import { requireAuth, writeAuditLog } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, 'view_applications');
    if (authResult instanceof NextResponse) return authResult;

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const application = await prisma.loanApplication.findFirst({
      where: { OR: [{ id }, { applicationNumber: id }] },
      include: {
        product: {
          include: {
            formTemplates: {
              include: {
                versions: {
                  where: { status: 'PUBLISHED' },
                  orderBy: { versionNumber: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
        formResponse: {
          include: { formVersion: true },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Loan Application not found.' }, { status: 404 });
    }

    let formVersion = application.formResponse?.formVersion;

    // If application has no response yet, load the product's active published form version
    if (!formVersion && application.product) {
      const activeTemplate = application.product.formTemplates[0];
      formVersion = activeTemplate?.versions[0];
    }

    return NextResponse.json({
      application: {
        id: application.id,
        applicationNumber: application.applicationNumber,
        customerId: application.customerId,
        customerName: application.customerName,
        productCode: application.productCode,
        productName: application.productName,
        requestedAmount: Number(application.requestedAmount),
        requestedTenureMonths: application.requestedTenureMonths,
        status: application.status,
      },
      formVersion,
      formResponse: application.formResponse,
    });
  } catch (error: any) {
    console.error('API /applications/[id]/form-response GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, 'edit_application');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const {
      formVersionId,
      productId,
      responses = {},
      signatures = {},
      uploadedDocumentIds = {},
      currentPageIndex = 0,
    } = body;

    const application = await prisma.loanApplication.findFirst({
      where: { OR: [{ id }, { applicationNumber: id }] },
    });

    if (!application) {
      return NextResponse.json({ error: 'Loan Application not found.' }, { status: 404 });
    }

    // Retrieve form schema to calculate progress
    let schemaJson: any = null;
    if (formVersionId) {
      const version = await prisma.applicationFormVersion.findUnique({
        where: { id: formVersionId },
      });
      if (version) schemaJson = version.schemaJson;
    }

    let completionPercentage = 0;
    if (schemaJson) {
      const progress = calculateFormProgress({
        schema: schemaJson,
        responses,
        signatures,
      });
      completionPercentage = progress.overallPercentage;
    }

    const savedResponse = await prisma.loanApplicationFormResponse.upsert({
      where: { applicationId: application.id },
      create: {
        applicationId: application.id,
        formVersionId: formVersionId || 'default',
        productId: productId || application.productId || 'default',
        responses,
        signatures,
        uploadedDocumentIds,
        completionPercentage,
        currentPageIndex,
        isSubmitted: false,
      },
      update: {
        responses,
        signatures,
        uploadedDocumentIds,
        completionPercentage,
        currentPageIndex,
        formVersionId: formVersionId || undefined,
      },
    });

    return NextResponse.json({
      message: 'Draft responses auto-saved successfully.',
      formResponse: savedResponse,
    });
  } catch (error: any) {
    console.error('API /applications/[id]/form-response PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params; const id = resolvedParams?.id;
    const body = await request.json();
    const {
      formVersionId,
      productId,
      responses = {},
      signatures = {},
      uploadedDocumentIds = {},
      submittedBy,
    } = body;

    const application = await prisma.loanApplication.findFirst({
      where: { OR: [{ id }, { applicationNumber: id }] },
    });

    if (!application) {
      return NextResponse.json({ error: 'Loan Application not found.' }, { status: 404 });
    }

    const version = await prisma.applicationFormVersion.findUnique({
      where: { id: formVersionId },
    });

    if (!version) {
      return NextResponse.json({ error: 'Form version not found.' }, { status: 404 });
    }

    // Server-side validation of complete schema
    const validation = validateFormResponses({
      schema: version.schemaJson as any,
      responses,
      signatures,
      isFinalSubmit: true,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Form submission failed validation.',
          errors: validation.errors,
        },
        { status: 422 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Save final response record
      const formResp = await tx.loanApplicationFormResponse.upsert({
        where: { applicationId: application.id },
        create: {
          applicationId: application.id,
          formVersionId,
          productId: productId || application.productId || 'default',
          responses,
          signatures,
          uploadedDocumentIds,
          completionPercentage: 100.0,
          currentPageIndex: 0,
          isSubmitted: true,
          submittedAt: new Date(),
        },
        update: {
          responses,
          signatures,
          uploadedDocumentIds,
          completionPercentage: 100.0,
          isSubmitted: true,
          submittedAt: new Date(),
        },
      });

      // 2. Transition Application Status to SUBMITTED
      const updatedApp = await tx.loanApplication.update({
        where: { id: application.id },
        data: {
          status: 'SUBMITTED',
          submittedAt: new Date(),
          submittedBy: submittedBy || 'Applicant',
          requestedAmount: responses.requested_loan_amount
            ? Number(responses.requested_loan_amount)
            : application.requestedAmount,
        },
      });

      // 3. Log Application History
      await tx.applicationHistory.create({
        data: {
          applicationId: application.id,
          action: 'FORM_SUBMITTED',
          actor: submittedBy || 'Applicant',
          actorRole: 'Applicant / Officer',
          description: `Status changed from ${application.status} to SUBMITTED`,
          notes: `Custom form v${version.versionNumber} submitted with 100% completion & verified digital signature.`,
        },
      });

      return {
        application: updatedApp,
        formResponse: formResp,
      };
    });

    return NextResponse.json({
      message: 'Loan Application submitted successfully with complete responses & signatures.',
      result,
    });
  } catch (error: any) {
    console.error('API /applications/[id]/form-response POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
