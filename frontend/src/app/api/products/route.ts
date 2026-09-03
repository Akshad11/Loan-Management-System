import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, 'view_loan_products');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const products = await prisma.loanProduct.findMany({
      orderBy: { name: 'asc' },
    });

    const formatted = products.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      category: p.category,
      description: p.description,
      minAmount: Number(p.minAmount),
      maxAmount: Number(p.maxAmount),
      minTenureMonths: p.minTenureMonths,
      maxTenureMonths: p.maxTenureMonths,
      baseInterestRate: Number(p.baseInterestRate),
      processingFeePercent: Number(p.processingFeePercent || 1.0),
      documentationCharges: Number(p.documentationCharges || 750),
      allowedFrequencies: p.allowedFrequencies,
      requiredDocumentTypes: p.requiredDocumentTypes || [],
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('API /products GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, 'manage_loan_products');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const product = await prisma.loanProduct.create({
      data: {
        id: body.id || undefined,
        code: body.code,
        name: body.name,
        category: body.category,
        description: body.description || '',
        minAmount: body.minAmount,
        maxAmount: body.maxAmount,
        minTenureMonths: body.minTenureMonths,
        maxTenureMonths: body.maxTenureMonths,
        baseInterestRate: body.baseInterestRate,
        processingFeePercent: body.processingFeePercent || 1.0,
        documentationCharges: body.documentationCharges || 750,
        allowedFrequencies: body.allowedFrequencies || ['MONTHLY'],
        requiredDocumentTypes: body.requiredDocumentTypes || [],
        status: body.status || 'ACTIVE',
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('API /products POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'Product ID required' }, { status: 400 });

    const updated = await prisma.loanProduct.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.category && { category: data.category }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.minAmount !== undefined && { minAmount: data.minAmount }),
        ...(data.maxAmount !== undefined && { maxAmount: data.maxAmount }),
        ...(data.minTenureMonths !== undefined && { minTenureMonths: data.minTenureMonths }),
        ...(data.maxTenureMonths !== undefined && { maxTenureMonths: data.maxTenureMonths }),
        ...(data.baseInterestRate !== undefined && { baseInterestRate: data.baseInterestRate }),
        ...(data.processingFeePercent !== undefined && { processingFeePercent: data.processingFeePercent }),
        ...(data.documentationCharges !== undefined && { documentationCharges: data.documentationCharges }),
        ...(data.status && { status: data.status }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('API /products PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
