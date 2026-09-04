import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/serverAuth';
import { executePreDisbursementGatekeeper } from '@/services/disbursement/preDisbursementGatekeeper';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, [
      'view_disbursements',
      'credit.view',
      'view_applications',
    ]);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const checkResult = await executePreDisbursementGatekeeper(id);
    return NextResponse.json(checkResult);
  } catch (error: any) {
    console.error('API /pre-disbursement-check GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
