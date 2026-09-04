import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/serverAuth';
import { addValuation } from '@/services/collateral/collateralService';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, 'collateral.valuation');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { id: collateralId } = await context.params;
    const body = await request.json();

    const updated = await addValuation({
      collateralId,
      marketValue: Number(body.marketValue),
      forcedSaleValue: body.forcedSaleValue !== undefined ? Number(body.forcedSaleValue) : undefined,
      valuerName: body.valuerName,
      valuerFirm: body.valuerFirm,
      reportNumber: body.reportNumber,
      valuationDate: body.valuationDate,
      notes: body.notes,
      actorUser,
      request,
    });

    return NextResponse.json({ collateral: updated }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/collateral/[id]/valuation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
