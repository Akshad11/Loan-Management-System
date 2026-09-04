import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/serverAuth';
import { addCoApplicant } from '@/services/coApplicant/coApplicantService';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, 'coapplicant.view');
    if (authResult instanceof NextResponse) return authResult;

    const { id: applicationId } = await context.params;
    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    const coApplicants = await prisma.coApplicant.findMany({
      where: { applicationId },
      orderBy: { addedAt: 'asc' },
    });

    const formatted = coApplicants.map((ca) => ({
      ...ca,
      monthlyIncome: Number(ca.monthlyIncome || 0),
      existingObligations: Number(ca.existingObligations || 0),
      ownershipShare: ca.ownershipShare ? Number(ca.ownershipShare) : null,
      totalOutstanding: Number(ca.totalOutstanding || 0),
      addedAt: ca.addedAt.toISOString(),
      dob: ca.dob?.toISOString() || null,
      consentDate: ca.consentDate?.toISOString() || null,
    }));

    return NextResponse.json({ coApplicants: formatted });
  } catch (error: any) {
    console.error('GET /api/applications/[id]/co-applicants error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, 'coapplicant.create');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { id: applicationId } = await context.params;
    const body = await request.json();

    const created = await addCoApplicant({
      applicationId,
      existingCustomerId: body.existingCustomerId,
      customerData: body.customerData,
      relationship: body.relationship || 'CO_BORROWER',
      applicantType: body.applicantType || 'CO_APPLICANT',
      ownershipShare: body.ownershipShare,
      actorUser,
      request,
    });

    return NextResponse.json({ coApplicant: created }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/applications/[id]/co-applicants error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
