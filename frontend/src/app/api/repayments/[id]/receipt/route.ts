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
      where: { OR: [{ id }, { paymentNumber: id }, { receiptNumber: id }] },
      include: {
        receipt: true,
        loan: true,
        customer: true,
        allocations: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (!payment.receipt) {
      return NextResponse.json({ error: 'No receipt generated for this payment yet' }, { status: 404 });
    }

    return NextResponse.json({
      ...payment.receipt,
      amount: Number(payment.receipt.amount),
      customerName: payment.customerName,
      customerNumber: payment.customerNumber,
      accountNumber: payment.accountNumber,
    });
  } catch (error: any) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch receipt' }, { status: 500 });
  }
}
