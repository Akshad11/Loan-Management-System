import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/serverAuth';
import { calculateCombinedEligibility } from '@/services/coApplicant/eligibilityService';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, ['perm_credit_view', 'view_credit_assessment', 'view_applications']);
    if (authResult instanceof NextResponse) return authResult;

    const { id: applicationId } = await context.params;
    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    const eligibility = await calculateCombinedEligibility(applicationId);
    return NextResponse.json({ eligibility });
  } catch (error: any) {
    console.error('GET /api/applications/[id]/eligibility error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
