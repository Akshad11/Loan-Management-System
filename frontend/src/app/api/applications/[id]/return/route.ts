import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/serverAuth';
import { returnForCorrection } from '@/services/credit/creditDecisionService';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, ['credit.return', 'credit.review', 'action_approvals']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { id } = await params;
    const body = await request.json();
    const { returnReason, comments, requiredCorrections } = body;

    if (!returnReason || !comments) {
      return NextResponse.json(
        { error: 'returnReason and comments are mandatory' },
        { status: 400 }
      );
    }

    const result = await returnForCorrection({
      applicationId: id,
      returnReason,
      comments,
      requiredCorrections: requiredCorrections || [],
      actorUser,
      request,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('API /return POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 400 });
  }
}
