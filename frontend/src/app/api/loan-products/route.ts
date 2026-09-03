import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { HOME_LOAN_FORM_SCHEMA } from '@/config/systemTemplates';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, 'view_loan_products');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};
    if (category && category !== 'ALL') where.category = category;
    if (status && status !== 'ALL') where.status = status;

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.loanProduct.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
        applications: {
          select: { id: true },
        },
      },
    });

    const formattedProducts = products.map((p) => {
      const activeTemplate = p.formTemplates[0];
      const activeVersion = activeTemplate?.versions[0];
      return {
        ...p,
        minAmount: Number(p.minAmount),
        maxAmount: Number(p.maxAmount),
        baseInterestRate: Number(p.baseInterestRate),
        maxInterestRate: p.maxInterestRate ? Number(p.maxInterestRate) : undefined,
        processingFeePercent: p.processingFeePercent ? Number(p.processingFeePercent) : 1.0,
        processingFeeFlat: p.processingFeeFlat ? Number(p.processingFeeFlat) : 0,
        documentationCharges: p.documentationCharges ? Number(p.documentationCharges) : 750,
        applicationsCount: p.applications.length,
        activeFormVersion: activeVersion,
      };
    });

    return NextResponse.json({ products: formattedProducts });
  } catch (error: any) {
    console.error('API /loan-products GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, 'manage_loan_products');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const {
      code,
      name,
      category,
      description,
      minAmount,
      maxAmount,
      minTenureMonths,
      maxTenureMonths,
      baseInterestRate,
      maxInterestRate,
      interestMethod = 'REDUCING_BALANCE',
      repaymentFrequency = 'MONTHLY',
      processingFeePercent = 1.0,
      processingFeeFlat = 0,
      documentationCharges = 750,
      minCreditScore = 650,
      requiredDocumentTypes,
      eligibilityCriteria,
      createdBy,
    } = body;

    if (!code || !name || !category) {
      return NextResponse.json({ error: 'Code, name, and category are required.' }, { status: 400 });
    }

    const existingCode = await prisma.loanProduct.findUnique({
      where: { code },
    });

    if (existingCode) {
      return NextResponse.json({ error: `Product code '${code}' already exists.` }, { status: 409 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.loanProduct.create({
        data: {
          code: code.toUpperCase().trim(),
          name: name.trim(),
          category,
          description,
          minAmount: minAmount || 50000,
          maxAmount: maxAmount || 1000000,
          minTenureMonths: minTenureMonths || 12,
          maxTenureMonths: maxTenureMonths || 60,
          baseInterestRate: baseInterestRate || 10.5,
          maxInterestRate: maxInterestRate || 15.0,
          interestMethod,
          repaymentFrequency,
          processingFeePercent,
          processingFeeFlat,
          documentationCharges,
          minCreditScore,
          requiredDocumentTypes: requiredDocumentTypes || ['PAN', 'AADHAAR', 'INCOME_PROOF'],
          eligibilityCriteria: eligibilityCriteria || { minAge: 21, maxAge: 65, minMonthlyIncome: 25000 },
          status: 'ACTIVE',
          version: 1,
          createdBy: createdBy || 'usr_admin_01',
        },
      });

      // Automatically create the initial application form template & published version v1
      const initialTemplate = await tx.applicationFormTemplate.create({
        data: {
          productId: newProduct.id,
          title: `${newProduct.name} Application Form`,
          description: `Standard multi-page application form for ${newProduct.name}`,
          status: 'PUBLISHED',
          currentVersion: 1,
        },
      });

      // Default customized schema
      const initialSchema = JSON.parse(JSON.stringify(HOME_LOAN_FORM_SCHEMA));
      initialSchema.metadata = {
        productCode: newProduct.code,
        productName: newProduct.name,
        estimatedCompletionMinutes: 10,
      };

      const initialVersion = await tx.applicationFormVersion.create({
        data: {
          formTemplateId: initialTemplate.id,
          versionNumber: 1,
          status: 'PUBLISHED',
          schemaJson: initialSchema,
          publishedAt: new Date(),
          publishedBy: createdBy || 'usr_admin_01',
          changeSummary: 'Initial baseline published form v1.',
        },
      });

      await tx.loanProduct.update({
        where: { id: newProduct.id },
        data: { activeFormVersionId: initialVersion.id },
      });

      return {
        product: newProduct,
        template: initialTemplate,
        version: initialVersion,
      };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('API /loan-products POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
