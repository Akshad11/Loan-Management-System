import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/serverAuth';
import { getBureauReportsForApplication, pullBureauReport } from '@/services/bureau/bureauService';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, 'bureau.view');
    if (authResult instanceof NextResponse) return authResult;

    const { id: applicationId } = await context.params;
    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    const reports = await getBureauReportsForApplication(applicationId);
    return NextResponse.json({ reports });
  } catch (error: any) {
    console.error('GET /api/applications/[id]/bureau error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: applicationId } = await context.params;
    const body = await request.json();
    const { applicantId, applicantType = 'PRIMARY', forceRefresh = false } = body;

    const requiredPerm = forceRefresh ? 'bureau.refresh' : 'bureau.request';
    const authResult = await requireAuth(request, requiredPerm);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    if (!applicationId || !applicantId) {
      return NextResponse.json(
        { error: 'Application ID and Applicant ID are required' },
        { status: 400 }
      );
    }

    const report = await pullBureauReport({
      applicationId,
      applicantId,
      applicantType,
      actorUser,
      forceRefresh,
      request,
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/applications/[id]/bureau error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
