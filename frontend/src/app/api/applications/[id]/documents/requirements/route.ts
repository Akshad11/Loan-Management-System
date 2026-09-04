import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/serverAuth';
import { syncApplicationDocumentRequirements } from '@/services/document/documentRequirementService';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, ['credit.view', 'view_application_documents']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { id } = await params;

    // Synchronize to ensure all required document slots exist
    const documents = await syncApplicationDocumentRequirements(id, actorUser);

    const primaryDocs = documents.filter((d) => d.applicantType === 'PRIMARY' || !d.applicantType);
    const coAppDocs = documents.filter((d) => d.applicantType === 'CO_APPLICANT');
    const collateralDocs = documents.filter((d) => d.applicantType === 'COLLATERAL');

    const total = documents.length;
    const verified = documents.filter((d) => d.status === 'VERIFIED').length;
    const rejected = documents.filter((d) => d.status === 'REJECTED').length;
    const mandatoryTotal = documents.filter((d) => d.isMandatory).length;
    const mandatoryVerified = documents.filter((d) => d.isMandatory && d.status === 'VERIFIED').length;

    return NextResponse.json({
      applicationId: id,
      total,
      verified,
      rejected,
      mandatoryTotal,
      mandatoryVerified,
      isComplete: mandatoryTotal > 0 && mandatoryTotal === mandatoryVerified,
      documents,
      groups: {
        primary: primaryDocs,
        coApplicants: coAppDocs,
        collateral: collateralDocs,
      },
    });
  } catch (error: any) {
    console.error('API /documents/requirements GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, ['upload_application_documents', 'edit_application']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { id } = await params;
    const documents = await syncApplicationDocumentRequirements(id, actorUser);
    return NextResponse.json({ success: true, count: documents.length, documents });
  } catch (error: any) {
    console.error('API /documents/requirements POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
