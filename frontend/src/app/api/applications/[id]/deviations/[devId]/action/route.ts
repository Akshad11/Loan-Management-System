import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/serverAuth';
import { approveDeviation, rejectDeviation } from '@/services/deviation/deviationService';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; devId: string }> }
) {
  try {
    const authResult = await requireAuth(request, ['credit.approve', 'action_approvals']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { id, devId } = await params;
    const body = await request.json();
    const { action, approvedRoi, reason } = body;

    if (action === 'APPROVE') {
      const updated = await approveDeviation({
        applicationId: id,
        deviationId: devId,
        approvedRoi,
        actorUser,
        request,
      });
      return NextResponse.json({ success: true, deviation: updated });
    } else if (action === 'REJECT') {
      if (!reason) {
        return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
      }
      const updated = await rejectDeviation({
        applicationId: id,
        deviationId: devId,
        reason,
        actorUser,
        request,
      });
      return NextResponse.json({ success: true, deviation: updated });
    }

    return NextResponse.json({ error: 'Invalid action. Expected APPROVE or REJECT.' }, { status: 400 });
  } catch (error: any) {
    console.error('API /deviations/[devId]/action POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 400 });
  }
}
