import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { HOME_LOAN_FORM_SCHEMA } from '@/config/systemTemplates';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, 'view_loan_products');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params; const id = resolvedParams?.id;
    const product = await prisma.loanProduct.findFirst({
      where: { OR: [{ id }, { code: id }] },
      include: {
        formTemplates: {
          include: {
            versions: {
              orderBy: { versionNumber: 'desc' },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Loan Product not found.' }, { status: 404 });
    }

    let template = product.formTemplates[0];

    // If template does not exist yet, initialize it
    if (!template) {
      template = await prisma.applicationFormTemplate.create({
        data: {
          productId: product.id,
          title: `${product.name} Application Form`,
          description: `Custom multi-page form for ${product.name}`,
          status: 'PUBLISHED',
          currentVersion: 1,
          versions: {
            create: {
              versionNumber: 1,
              status: 'PUBLISHED',
              schemaJson: HOME_LOAN_FORM_SCHEMA as any,
              publishedAt: new Date(),
              publishedBy: 'System',
              changeSummary: 'Baseline form template',
            },
          },
        },
        include: {
          versions: {
            orderBy: { versionNumber: 'desc' },
          },
        },
      });

      await prisma.loanProduct.update({
        where: { id: product.id },
        data: { activeFormVersionId: template.versions[0]?.id },
      });
    }

    return NextResponse.json({
      product: {
        id: product.id,
        code: product.code,
        name: product.name,
        category: product.category,
        activeFormVersionId: product.activeFormVersionId,
      },
      template,
      versions: template.versions,
    });
  } catch (error: any) {
    console.error('API /loan-products/[id]/form-builder GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, 'manage_loan_products');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params; const id = resolvedParams?.id;
    const body = await request.json();
    const { schemaJson, changeSummary, savedBy } = body;

    if (!schemaJson || !schemaJson.pages || schemaJson.pages.length === 0) {
      return NextResponse.json({ error: 'Form schema must have at least 1 page.' }, { status: 400 });
    }

    const product = await prisma.loanProduct.findFirst({
      where: { OR: [{ id }, { code: id }] },
      include: {
        formTemplates: {
          include: {
            versions: {
              orderBy: { versionNumber: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Loan Product not found.' }, { status: 404 });
    }

    let template = product.formTemplates[0];
    if (!template) {
      template = await prisma.applicationFormTemplate.create({
        data: {
          productId: product.id,
          title: `${product.name} Application Form`,
          status: 'DRAFT',
          currentVersion: 1,
        },
        include: {
          versions: {
            orderBy: { versionNumber: 'desc' as const },
            take: 1,
          },
        },
      });
    }

    const latestVersion = template.versions?.[0];
    let nextVerNumber = (latestVersion?.versionNumber || 0) + 1;

    // Check if there is already an un-published DRAFT version
    const existingDraft = await prisma.applicationFormVersion.findFirst({
      where: { formTemplateId: template.id, status: 'DRAFT' },
    });

    let draftVersion;
    if (existingDraft) {
      draftVersion = await prisma.applicationFormVersion.update({
        where: { id: existingDraft.id },
        data: {
          schemaJson,
          changeSummary: changeSummary || 'Draft updated.',
          publishedBy: savedBy || 'usr_admin_01',
        },
      });
    } else {
      draftVersion = await prisma.applicationFormVersion.create({
        data: {
          formTemplateId: template.id,
          versionNumber: nextVerNumber,
          status: 'DRAFT',
          schemaJson,
          changeSummary: changeSummary || `Draft version v${nextVerNumber}`,
          publishedBy: savedBy || 'usr_admin_01',
        },
      });
    }

    return NextResponse.json({
      message: 'Draft form schema saved successfully.',
      version: draftVersion,
    });
  } catch (error: any) {
    console.error('API /loan-products/[id]/form-builder POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
