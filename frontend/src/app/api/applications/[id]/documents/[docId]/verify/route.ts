import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/serverAuth';
import { verifyDocument, rejectDocument } from '@/services/document/documentRequirementService';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const authResult = await requireAuth(request, ['document.verify', 'document.reject', 'verify_kyc']);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const { id, docId } = await params;
    const body = await request.json();
    const { action, reason, notes } = body;

    if (action === 'VERIFY') {
      const result = await verifyDocument({
        applicationId: id,
        documentId: docId,
        actorUser,
        notes,
        request,
      });
      return NextResponse.json({ success: true, document: result });
    } else if (action === 'REJECT') {
      if (!reason) {
        return NextResponse.json({ error: 'A specific rejection reason is required' }, { status: 400 });
      }
      const result = await rejectDocument({
        applicationId: id,
        documentId: docId,
        reason,
        actorUser,
        request,
      });
      return NextResponse.json({ success: true, document: result });
    }

    return NextResponse.json({ error: 'Invalid action. Expected VERIFY or REJECT.' }, { status: 400 });
  } catch (error: any) {
    console.error('API /documents/[docId]/verify POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 400 });
  }
}
