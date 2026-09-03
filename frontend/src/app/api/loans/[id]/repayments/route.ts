import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuth(request, 'view_loans');
    if (authResult instanceof NextResponse) return authResult;

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const loan = await prisma.loanAccount.findFirst({
      where: { OR: [{ id }, { accountNumber: id }] },
    });

    if (!loan) {
      return NextResponse.json({ error: 'Loan account not found' }, { status: 404 });
    }

    const payments = await prisma.payment.findMany({
      where: { loanId: loan.id },
      include: {
        allocations: {
          orderBy: { createdAt: 'asc' },
        },
        receipt: true,
        reversal: true,
        history: {
          orderBy: { timestamp: 'desc' },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    const formatted = payments.map((p: any) => ({
      ...p,
      amount: Number(p.amount),
      allocatedAmount: Number(p.allocatedAmount),
      unallocatedAmount: Number(p.unallocatedAmount),
      allocations: (p.allocations || []).map((a: any) => ({
        ...a,
        amount: Number(a.amount),
      })),
      receipt: p.receipt
        ? {
            ...p.receipt,
            amount: Number(p.receipt.amount),
          }
        : undefined,
      reversal: p.reversal
        ? {
            ...p.reversal,
            amount: Number(p.reversal.amount),
          }
        : undefined,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Error fetching loan repayments:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch loan repayments' }, { status: 500 });
  }
}
