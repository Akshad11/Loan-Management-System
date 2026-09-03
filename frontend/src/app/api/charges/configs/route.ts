import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { INITIAL_CHARGE_CONFIGURATIONS } from '@/data/chargeAdjustmentData';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, 'view_loans');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    let configs = await prisma.chargeConfiguration.findMany({
      orderBy: { chargeCode: 'asc' },
    });

    if (configs.length === 0) {
      // Seed default configs if table empty
      await prisma.chargeConfiguration.createMany({
        data: INITIAL_CHARGE_CONFIGURATIONS.map((c) => ({
          id: c.id,
          chargeCode: c.chargeCode,
          chargeName: c.chargeName,
          chargeType: c.chargeType,
          calculationBasis: c.calculationBasis,
          rateOrValue: c.rateOrValue,
          taxPercentage: c.taxPercentage,
          minAmount: c.minAmount,
          maxAmount: c.maxAmount,
          applicableEvent: c.applicableEvent,
          isWaivable: c.isWaivable,
          isActive: c.isActive,
        })),
        skipDuplicates: true,
      });

      configs = await prisma.chargeConfiguration.findMany({
        orderBy: { chargeCode: 'asc' },
      });
    }

    return NextResponse.json(configs);
  } catch (error: any) {
    console.error('API /charges/configs GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, 'manage_repayments');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const {
      chargeCode,
      chargeName,
      chargeType,
      calculationBasis = 'FIXED_AMOUNT',
      rateOrValue,
      taxPercentage = 18.0,
      minAmount,
      maxAmount,
      applicableEvent,
      isWaivable = true,
      isActive = true,
    } = body;

    const created = await prisma.chargeConfiguration.create({
      data: {
        chargeCode,
        chargeName,
        chargeType,
        calculationBasis,
        rateOrValue: Number(rateOrValue),
        taxPercentage: Number(taxPercentage),
        minAmount: minAmount ? Number(minAmount) : null,
        maxAmount: maxAmount ? Number(maxAmount) : null,
        applicableEvent,
        isWaivable,
        isActive,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error('API /charges/configs POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
