import { requireAuth, writeAuditLog } from '@/lib/serverAuth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, 'view_repayments');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const unallocated = await prisma.unallocatedPayment.findMany({
      include: {
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = unallocated.map((u: any) => ({
      ...u,
      totalAmount: Number(u.totalAmount),
      allocatedAmount: Number(u.allocatedAmount),
      remainingAmount: Number(u.remainingAmount),
      paymentNumber: u.payment?.paymentNumber,
      accountNumber: u.payment?.accountNumber,
      customerName: u.payment?.customerName,
      paymentDate: u.payment?.paymentDate,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Error fetching unallocated payments:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch unallocated payments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, 'manage_repayments');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const { unallocId, action, actorName = 'Operations Officer' } = body;

    const unalloc = await prisma.unallocatedPayment.findUnique({
      where: { id: unallocId },
    });

    if (!unalloc) {
      return NextResponse.json({ error: 'Unallocated payment record not found' }, { status: 404 });
    }

    const updated = await prisma.unallocatedPayment.update({
      where: { id: unallocId },
      data: {
        status: action === 'REFUND' ? 'REFUNDED' : 'FULLY_ALLOCATED',
        allocatedAmount: action === 'REFUND' ? unalloc.allocatedAmount : unalloc.totalAmount,
        remainingAmount: action === 'REFUND' ? unalloc.remainingAmount : 0,
        resolvedAt: new Date(),
        resolvedBy: actorName,
      },
    });

    return NextResponse.json({
      ...updated,
      totalAmount: Number(updated.totalAmount),
      allocatedAmount: Number(updated.allocatedAmount),
      remainingAmount: Number(updated.remainingAmount),
    });
  } catch (error: any) {
    console.error('Error resolving unallocated payment:', error);
    return NextResponse.json({ error: error.message || 'Failed to resolve unallocated payment' }, { status: 500 });
  }
}
