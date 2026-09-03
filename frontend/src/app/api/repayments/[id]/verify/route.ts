import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, ["post_repayment","manage_repayments"]);
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params; const id = resolvedParams?.id;
    const body = await request.json().catch(() => ({}));
    const { actorName = 'Branch Manager', actorRole = 'Branch Manager' } = body;

    const payment = await prisma.payment.findFirst({
      where: { OR: [{ id }, { paymentNumber: id }] },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.status !== 'PENDING_VERIFICATION' && payment.status !== 'RECEIVED') {
      return NextResponse.json(
        { error: `Payment is in ${payment.status} status and cannot be verified` },
        { status: 400 }
      );
    }

    // Segregation of Duties: Creator cannot verify
    if (payment.receivedBy === actorName || payment.receivedByName === actorName) {
      return NextResponse.json(
        {
          error:
            'Segregation of Duties Violation: The user who recorded the payment cannot verify it.',
        },
        { status: 403 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'VERIFIED',
          verifiedBy: actorName,
          verifiedByName: actorName,
          verifiedAt: new Date(),
        },
      });

      await tx.paymentHistory.create({
        data: {
          paymentId: payment.id,
          event: 'VERIFIED',
          actor: actorName,
          actorName,
          actorRole,
          previousState: payment.status,
          newState: 'VERIFIED',
          amount: payment.amount,
          notes: `Payment verified by ${actorName} (${actorRole}).`,
        },
      });

      return p;
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: error.message || 'Failed to verify payment' }, { status: 500 });
  }
}
