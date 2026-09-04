import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/serverAuth';
import { updateVerification } from '@/services/collateral/collateralService';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, 'collateral.verify');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { id: collateralId } = await context.params;
    const body = await request.json();

    const updated = await updateVerification({
      collateralId,
      legalStatus: body.legalStatus,
      legalAdvocateName: body.legalAdvocateName,
      technicalStatus: body.technicalStatus,
      technicalEngineerName: body.technicalEngineerName,
      actorUser,
      request,
    });

    return NextResponse.json({ collateral: updated });
  } catch (error: any) {
    console.error('POST /api/collateral/[id]/verify error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
