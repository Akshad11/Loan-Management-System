import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/serverAuth';
import { getChecklist, updateChecklistItem } from '@/services/checklist/checklistService';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, ['checklist.view', 'credit.view', 'view_applications']);
    if (authResult instanceof NextResponse) return authResult;

    const { id } = await params;
    const checklist = await getChecklist(id);
    return NextResponse.json(checklist);
  } catch (error: any) {
    console.error('API /checklist GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request, ['checklist.update', 'credit.review', 'edit_application']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { id } = await params;
    const body = await request.json();
    const { itemId, status, remarks, evidenceRef } = body;

    if (!itemId || !status) {
      return NextResponse.json({ error: 'itemId and status are required' }, { status: 400 });
    }

    const updated = await updateChecklistItem({
      applicationId: id,
      itemId,
      status,
      remarks,
      evidenceRef,
      actorUser,
      request,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('API /checklist PUT error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 400 });
  }
}
