import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/serverAuth';
import {
  createDeviation,
  getApplicationDeviations,
} from '@/services/deviation/deviationService';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, ['credit.view', 'view_applications']);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const deviations = await getApplicationDeviations(id);
    return NextResponse.json(deviations);
  } catch (error: any) {
    console.error('API /deviations GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, ['credit.review', 'edit_application']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { id } = await params;
    const body = await request.json();
    const { category, title, deviationReason, mitigantNotes, severity, requestedRoi } = body;

    if (!title || !deviationReason) {
      return NextResponse.json({ error: 'Title and deviationReason are required' }, { status: 400 });
    }

    const deviation = await createDeviation({
      applicationId: id,
      category,
      title,
      deviationReason,
      mitigantNotes,
      severity,
      requestedRoi,
      actorUser,
      request,
    });

    return NextResponse.json(deviation, { status: 201 });
  } catch (error: any) {
    console.error('API /deviations POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 400 });
  }
}
