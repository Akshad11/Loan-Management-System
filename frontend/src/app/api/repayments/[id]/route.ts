import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, 'view_repayments');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const resolvedParams = await params; const id = resolvedParams?.id;
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [{ id }, { paymentNumber: id }],
      },
      include: {
        allocations: {
          orderBy: { createdAt: 'asc' },
        },
        receipt: true,
        reversal: true,
        history: {
          orderBy: { timestamp: 'desc' },
        },
        unallocated: true,
        loan: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...payment,
      amount: Number(payment.amount),
      allocatedAmount: Number(payment.allocatedAmount),
      unallocatedAmount: Number(payment.unallocatedAmount),
      allocations: (payment.allocations || []).map((a: any) => ({
        ...a,
        amount: Number(a.amount),
      })),
      receipt: payment.receipt
        ? {
            ...payment.receipt,
            amount: Number(payment.receipt.amount),
          }
        : undefined,
      reversal: payment.reversal
        ? {
            ...payment.reversal,
            amount: Number(payment.reversal.amount),
          }
        : undefined,
    });
  } catch (error: any) {
    console.error('Error fetching payment detail:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch payment' }, { status: 500 });
  }
}
