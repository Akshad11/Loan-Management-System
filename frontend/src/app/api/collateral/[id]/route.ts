import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/serverAuth';
import { getCollateralById, deleteCollateral } from '@/services/collateral/collateralService';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, 'collateral.view');
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await context.params;
    const collateral = await getCollateralById(id);

    if (!collateral) {
      return NextResponse.json({ error: 'Collateral record not found' }, { status: 404 });
    }

    return NextResponse.json({ collateral });
  } catch (error: any) {
    console.error('GET /api/collateral/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, 'collateral.delete');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { id } = await context.params;
    const result = await deleteCollateral(id, actorUser, request);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('DELETE /api/collateral/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
