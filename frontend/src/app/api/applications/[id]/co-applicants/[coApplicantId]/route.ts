import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/serverAuth';
import { updateCoApplicant, removeCoApplicant } from '@/services/coApplicant/coApplicantService';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string; coApplicantId: string }> }
) {
  try {
    const authResult = await requireAuth(request, 'coapplicant.edit');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { id: applicationId, coApplicantId } = await context.params;
    const body = await request.json();

    const updated = await updateCoApplicant({
      applicationId,
      coApplicantId,
      relationship: body.relationship,
      ownershipShare: body.ownershipShare,
      monthlyIncome: body.monthlyIncome,
      existingObligations: body.existingObligations,
      employmentType: body.employmentType,
      employerName: body.employerName,
      notes: body.notes,
      actorUser,
      request,
    });

    return NextResponse.json({ coApplicant: updated });
  } catch (error: any) {
    console.error('PUT /api/applications/[id]/co-applicants/[coApplicantId] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string; coApplicantId: string }> }
) {
  try {
    const authResult = await requireAuth(request, 'coapplicant.delete');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { id: applicationId, coApplicantId } = await context.params;

    const result = await removeCoApplicant(applicationId, coApplicantId, actorUser, request);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('DELETE /api/applications/[id]/co-applicants/[coApplicantId] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
