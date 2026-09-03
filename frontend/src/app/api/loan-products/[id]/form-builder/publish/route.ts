import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, 'manage_loan_products');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params; const id = resolvedParams?.id;
    const body = await request.json();
    const { schemaJson, changeSummary, publishedBy } = body;

    if (!schemaJson || !schemaJson.pages || schemaJson.pages.length === 0) {
      return NextResponse.json({ error: 'Cannot publish empty form schema. At least 1 page required.' }, { status: 400 });
    }

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
    if (!template) {
      template = await prisma.applicationFormTemplate.create({
        data: {
          productId: product.id,
          title: `${product.name} Application Form`,
          status: 'PUBLISHED',
          currentVersion: 1,
        },
        include: { versions: true },
      });
    }

    const maxVersion = template.versions?.reduce((max, v) => Math.max(max, v.versionNumber), 0) || 0;
    const newVersionNumber = maxVersion + 1;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark existing PUBLISHED versions as SUPERSEDED to preserve historical immutability
      await tx.applicationFormVersion.updateMany({
        where: { formTemplateId: template.id, status: 'PUBLISHED' },
        data: { status: 'SUPERSEDED' },
      });

      // 2. Remove any transient DRAFT versions
      await tx.applicationFormVersion.deleteMany({
        where: { formTemplateId: template.id, status: 'DRAFT' },
      });

      // 3. Create the new immutable PUBLISHED version
      const newPublishedVersion = await tx.applicationFormVersion.create({
        data: {
          formTemplateId: template.id,
          versionNumber: newVersionNumber,
          status: 'PUBLISHED',
          schemaJson,
          publishedAt: new Date(),
          publishedBy: publishedBy || 'usr_admin_01',
          changeSummary: changeSummary || `Published version v${newVersionNumber}`,
        },
      });

      // 4. Update the template status and version
      await tx.applicationFormTemplate.update({
        where: { id: template.id },
        data: {
          status: 'PUBLISHED',
          currentVersion: newVersionNumber,
        },
      });

      // 5. Update the Loan Product's active form version pointer
      const updatedProduct = await tx.loanProduct.update({
        where: { id: product.id },
        data: {
          activeFormVersionId: newPublishedVersion.id,
          version: { increment: 1 },
        },
      });

      return {
        product: updatedProduct,
        version: newPublishedVersion,
      };
    });

    return NextResponse.json({
      message: `Form v${newVersionNumber} published successfully and linked to ${product.name}.`,
      result,
    });
  } catch (error: any) {
    console.error('API /loan-products/[id]/form-builder/publish POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
