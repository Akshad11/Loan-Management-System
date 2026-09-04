import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/serverAuth';
import { designatePrimaryApplicant } from '@/services/coApplicant/coApplicantService';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; coApplicantId: string }> }
) {
  try {
    const authResult = await requireAuth(request, 'coapplicant.edit');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { id: applicationId, coApplicantId } = await context.params;

    const result = await designatePrimaryApplicant(
      applicationId,
      coApplicantId,
      actorUser,
      request
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('POST /api/applications/[id]/co-applicants/[coApplicantId]/make-primary error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
