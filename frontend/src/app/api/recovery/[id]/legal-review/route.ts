import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, 'manage_collections');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params; const id = resolvedParams?.id;
    const body = await request.json();
    const {
      action = 'REQUEST', // 'REQUEST' or 'DECIDE'
      reason,
      recommendedAction,
      reviewId,
      approved,
      notes,
      actorName = 'Senior Recovery Officer',
      actorRole = 'Senior Recovery Officer',
    } = body;

    const rc = await prisma.recoveryCase.findFirst({
      where: { OR: [{ id }, { recoveryCaseNumber: id }] },
    });

    if (!rc) {
      return NextResponse.json({ error: 'Recovery case not found' }, { status: 404 });
    }

    if (action === 'DECIDE') {
      const review = await prisma.legalReview.findUnique({
        where: { id: reviewId },
      });

      if (!review) {
        return NextResponse.json({ error: 'Legal review record not found' }, { status: 404 });
      }

      // Maker-checker segregation: Requester cannot approve
      if (review.requestedBy === actorName || review.requestedByName === actorName) {
        return NextResponse.json(
          { error: 'Segregation of Duties Violation: Requester cannot approve their own legal review.' },
          { status: 403 }
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        const updatedReview = await tx.legalReview.update({
          where: { id: reviewId },
          data: {
            status: approved ? 'APPROVED_FOR_LEGAL' : 'RETURNED_TO_RECOVERY',
            reviewedBy: actorName,
            reviewedByName: actorName,
            reviewedByRole: actorRole,
            reviewedAt: new Date(),
            reviewerNotes: notes,
          },
        });

        await tx.recoveryCase.update({
          where: { id: rc.id },
          data: {
            recoveryStage: approved ? 'LEGAL_ACTION' : 'HARD_RECOVERY',
            status: approved ? 'LEGAL_ACTION' : 'IN_PROGRESS',
          },
        });

        await tx.loanHistory.create({
          data: {
            loanId: rc.loanId,
            action: approved ? 'LEGAL_REVIEW_APPROVED' : 'LEGAL_REVIEW_RETURNED',
            actor: actorName,
            actorName,
            actorRole,
            reference: review.reviewNumber,
            notes: `Legal review ${approved ? 'APPROVED' : 'RETURNED'} by ${actorName} (${actorRole}). Notes: ${notes || 'None'}`,
          },
        });

        return updatedReview;
      });

      return NextResponse.json(updated);
    }

    // Default: Request Legal Review
    const count = await prisma.legalReview.count();
    const revSeq = count + 31;
    const reviewNumber = `LRV-${new Date().getFullYear()}-${String(revSeq).padStart(6, '0')}`;

    const createdReview = await prisma.$transaction(async (tx) => {
      const review = await tx.legalReview.create({
        data: {
          reviewNumber,
          recoveryCaseId: rc.id,
          loanId: rc.loanId,
          customerId: rc.customerId,
          requestedBy: actorName,
          requestedByName: actorName,
          requestedByRole: actorRole,
          reviewReason: reason,
          recommendedAction,
          status: 'PENDING_REVIEW',
        },
      });

      await tx.recoveryCase.update({
        where: { id: rc.id },
        data: {
          status: 'LEGAL_REVIEW',
        },
      });

      await tx.loanHistory.create({
        data: {
          loanId: rc.loanId,
          action: 'LEGAL_REVIEW_REQUESTED',
          actor: actorName,
          actorName,
          actorRole,
          reference: reviewNumber,
          reason,
          notes: `Legal review requested. Recommended: ${recommendedAction || 'Statutory Notice & Suit'}`,
        },
      });

      return review;
    });

    return NextResponse.json(createdReview);
  } catch (error: any) {
    console.error('Error processing legal review:', error);
    return NextResponse.json({ error: error.message || 'Failed to process legal review' }, { status: 500 });
  }
}
