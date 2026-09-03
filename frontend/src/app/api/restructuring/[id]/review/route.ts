import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, 'manage_repayments');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params; const id = resolvedParams?.id;
    const body = await request.json();
    const { reviewerId, reviewerName, reviewerRole, reviewNotes } = body;

    const restructuring = await prisma.restructuringRequest.findFirst({
      where: { OR: [{ id }, { requestNumber: id }] },
    });

    if (!restructuring) {
      return NextResponse.json({ error: 'Restructuring request not found.' }, { status: 404 });
    }

    if (!['SUBMITTED', 'UNDER_REVIEW'].includes(restructuring.status)) {
      return NextResponse.json(
        { error: `Cannot start review on request with status '${restructuring.status}'.` },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const req = await tx.restructuringRequest.update({
        where: { id: restructuring.id },
        data: {
          status: 'UNDER_REVIEW',
          reviewedBy: reviewerId || 'usr_credit_01',
          reviewedByName: reviewerName || 'Credit Underwriter',
          reviewedByRole: reviewerRole || 'Credit Underwriter',
          reviewedAt: new Date(),
          reviewNotes: reviewNotes || restructuring.reviewNotes,
        },
      });

      await tx.restructuringEvent.create({
        data: {
          requestId: req.id,
          eventType: 'UNDER_REVIEW',
          actor: reviewerId || 'usr_credit_01',
          actorName: reviewerName || 'Credit Underwriter',
          actorRole: reviewerRole || 'Credit Underwriter',
          title: 'Underwriting Review In Progress',
          description: reviewNotes || `Assessment started by ${reviewerName || 'Credit Underwriter'}.`,
        },
      });

      return req;
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('API /restructuring/[id]/review POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
