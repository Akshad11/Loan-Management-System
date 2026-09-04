import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/serverAuth';
import { getCollaterals, createCollateral } from '@/services/collateral/collateralService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, 'collateral.view');
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId') || undefined;
    const loanId = searchParams.get('loanId') || undefined;
    const customerId = searchParams.get('customerId') || undefined;

    const collaterals = await getCollaterals({ applicationId, loanId, customerId });
    return NextResponse.json({ collaterals });
  } catch (error: any) {
    console.error('GET /api/collateral error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, 'collateral.create');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();

    const collateral = await createCollateral({
      ...body,
      actorUser,
      request,
    });

    return NextResponse.json({ collateral }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/collateral error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
