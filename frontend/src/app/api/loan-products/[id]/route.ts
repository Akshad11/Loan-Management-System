import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
        applications: {
          take: 5,
          select: { id: true, applicationNumber: true, customerName: true, status: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Loan Product not found.' }, { status: 404 });
    }

    const activeTemplate = product.formTemplates[0];
    const activeVersion =
      activeTemplate?.versions.find((v) => v.id === product.activeFormVersionId) ||
      activeTemplate?.versions.find((v) => v.status === 'PUBLISHED') ||
      activeTemplate?.versions[0];

    return NextResponse.json({
      product: {
        ...product,
        minAmount: Number(product.minAmount),
        maxAmount: Number(product.maxAmount),
        baseInterestRate: Number(product.baseInterestRate),
        maxInterestRate: product.maxInterestRate ? Number(product.maxInterestRate) : undefined,
        processingFeePercent: product.processingFeePercent ? Number(product.processingFeePercent) : 1.0,
        processingFeeFlat: product.processingFeeFlat ? Number(product.processingFeeFlat) : 0,
        documentationCharges: product.documentationCharges ? Number(product.documentationCharges) : 750,
        activeFormVersion: activeVersion,
      },
    });
  } catch (error: any) {
    console.error('API /loan-products/[id] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, 'manage_loan_products');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params; const id = resolvedParams?.id;
    const body = await request.json();

    const product = await prisma.loanProduct.findFirst({
      where: { OR: [{ id }, { code: id }] },
    });

    if (!product) {
      return NextResponse.json({ error: 'Loan Product not found.' }, { status: 404 });
    }

    const {
      name,
      description,
      category,
      minAmount,
      maxAmount,
      minTenureMonths,
      maxTenureMonths,
      baseInterestRate,
      maxInterestRate,
      interestMethod,
      repaymentFrequency,
      processingFeePercent,
      processingFeeFlat,
      documentationCharges,
      minCreditScore,
      requiredDocumentTypes,
      eligibilityCriteria,
      status,
      updatedBy,
    } = body;

    const updated = await prisma.loanProduct.update({
      where: { id: product.id },
      data: {
        name: name !== undefined ? name : product.name,
        description: description !== undefined ? description : product.description,
        category: category !== undefined ? category : product.category,
        minAmount: minAmount !== undefined ? minAmount : product.minAmount,
        maxAmount: maxAmount !== undefined ? maxAmount : product.maxAmount,
        minTenureMonths: minTenureMonths !== undefined ? minTenureMonths : product.minTenureMonths,
        maxTenureMonths: maxTenureMonths !== undefined ? maxTenureMonths : product.maxTenureMonths,
        baseInterestRate: baseInterestRate !== undefined ? baseInterestRate : product.baseInterestRate,
        maxInterestRate: maxInterestRate !== undefined ? maxInterestRate : product.maxInterestRate,
        interestMethod: interestMethod !== undefined ? interestMethod : product.interestMethod,
        repaymentFrequency: repaymentFrequency !== undefined ? repaymentFrequency : product.repaymentFrequency,
        processingFeePercent: processingFeePercent !== undefined ? processingFeePercent : product.processingFeePercent,
        processingFeeFlat: processingFeeFlat !== undefined ? processingFeeFlat : product.processingFeeFlat,
        documentationCharges: documentationCharges !== undefined ? documentationCharges : product.documentationCharges,
        minCreditScore: minCreditScore !== undefined ? minCreditScore : product.minCreditScore,
        requiredDocumentTypes: requiredDocumentTypes !== undefined ? requiredDocumentTypes : product.requiredDocumentTypes,
        eligibilityCriteria: eligibilityCriteria !== undefined ? eligibilityCriteria : product.eligibilityCriteria,
        status: status !== undefined ? status : product.status,
        version: { increment: 1 },
        updatedBy: updatedBy || 'usr_admin_01',
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('API /loan-products/[id] PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, 'manage_loan_products');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params; const id = resolvedParams?.id;
    const product = await prisma.loanProduct.findFirst({
      where: { OR: [{ id }, { code: id }] },
      include: { applications: { select: { id: true } } },
    });

    if (!product) {
      return NextResponse.json({ error: 'Loan Product not found.' }, { status: 404 });
    }

    if (product.applications.length > 0) {
      // Archive instead of hard deleting to preserve referential integrity
      const archived = await prisma.loanProduct.update({
        where: { id: product.id },
        data: { status: 'ARCHIVED' },
      });
      return NextResponse.json({
        message: 'Product is referenced by active loan applications. Archived product safely instead of deletion.',
        product: archived,
      });
    }

    await prisma.loanProduct.delete({
      where: { id: product.id },
    });

    return NextResponse.json({ message: 'Product deleted successfully.' });
  } catch (error: any) {
    console.error('API /loan-products/[id] DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
