import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { roundMoney } from '@/services/loanFinancialService';
import { requireAuth, writeAuditLog } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, 'view_repayments');
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const loanId = searchParams.get('loanId');
    const customerId = searchParams.get('customerId');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('paymentMethod');
    const branchId = searchParams.get('branchId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where: any = {};
    if (loanId) where.loanId = loanId;
    if (customerId) where.customerId = customerId;
    if (status && status !== 'ALL') where.status = status;
    if (paymentMethod && paymentMethod !== 'ALL') where.paymentMethod = paymentMethod;

    if (dateFrom || dateTo) {
      where.paymentDate = {};
      if (dateFrom) where.paymentDate.gte = dateFrom;
      if (dateTo) where.paymentDate.lte = dateTo;
    }

    if (search) {
      where.OR = [
        { paymentNumber: { contains: search, mode: 'insensitive' } },
        { accountNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { receiptNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const payments = await prisma.payment.findMany({
      where,
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
      },
      orderBy: { createdAt: 'desc' },
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
      unallocated: p.unallocated
        ? {
            ...p.unallocated,
            unallocatedAmount: Number(p.unallocated.unallocatedAmount),
            resolvedAmount: Number(p.unallocated.resolvedAmount),
          }
        : undefined,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authResult = await requireAuth(request, 'post_repayment');
    if (authResult instanceof NextResponse) return authResult;
    const { actorUser } = authResult;

    const body = await request.json();
    const {
      loanId,
      amount,
      paymentDate,
      valueDate,
      paymentMethod,
      referenceNumber,
      bankName,
      channel,
      notes,
      idempotencyKey,
      supportingDocument,
      requireVerification,
      receivedBy = actorUser.id,
      receivedByName = actorUser.name,
    } = body;

    if (!loanId) {
      return NextResponse.json({ error: 'Loan ID is required' }, { status: 400 });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Payment amount must be greater than zero' }, { status: 400 });
    }

    // Check loan exists and is active
    const loan = await prisma.loanAccount.findFirst({
      where: { OR: [{ id: loanId }, { accountNumber: loanId }] },
    });

    if (!loan) {
      return NextResponse.json({ error: 'Loan account not found' }, { status: 404 });
    }

    if (loan.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Cannot record payment for a cancelled loan' }, { status: 400 });
    }

    // Check Idempotency
    if (idempotencyKey) {
      const existingIdemp = await prisma.payment.findUnique({
        where: { idempotencyKey },
        include: { allocations: true, receipt: true, reversal: true, history: true },
      });
      if (existingIdemp) {
        return NextResponse.json(existingIdemp);
      }
    }

    // Check duplicate reference
    if (referenceNumber && referenceNumber.trim() !== '') {
      const existingRef = await prisma.payment.findFirst({
        where: {
          referenceNumber,
          paymentMethod,
          status: { notIn: ['CANCELLED', 'FAILED', 'REVERSED'] },
        },
      });
      if (existingRef) {
        return NextResponse.json(
          { error: `Payment with reference number ${referenceNumber} already exists (${existingRef.paymentNumber})` },
          { status: 409 }
        );
      }
    }

    const count = await prisma.payment.count();
    const paymentSeq = count + 101;
    const paymentNumber = `PAY-${new Date().getFullYear()}-${String(paymentSeq).padStart(6, '0')}`;

    const newPayment = await prisma.payment.create({
      data: {
        paymentNumber,
        loanId: loan.id,
        accountNumber: loan.accountNumber,
        customerId: loan.customerId,
        customerNumber: loan.customerNumber,
        customerName: loan.customerName,
        amount: numAmount,
        allocatedAmount: 0,
        unallocatedAmount: 0,
        paymentDate: paymentDate || new Date().toISOString().split('T')[0],
        valueDate: valueDate || paymentDate || new Date().toISOString().split('T')[0],
        paymentMethod: paymentMethod || 'NACH_EMANDATE',
        referenceNumber,
        bankName,
        channel,
        status: requireVerification ? 'PENDING_VERIFICATION' : 'RECEIVED',
        idempotencyKey,
        notes,
        supportingDocument,
        receivedBy,
        receivedByName,
        history: {
          create: {
            event: 'RECEIVED',
            actor: receivedByName,
            actorName: receivedByName,
            actorRole: 'Operations Officer',
            previousState: 'NONE',
            newState: requireVerification ? 'PENDING_VERIFICATION' : 'RECEIVED',
            amount: numAmount,
            reference: referenceNumber,
            notes: `Payment of ₹${numAmount.toLocaleString('en-IN')} recorded.`,
          },
        },
      },
      include: {
        allocations: true,
        receipt: true,
        reversal: true,
        history: true,
      },
    });

    return NextResponse.json({
      ...newPayment,
      amount: Number(newPayment.amount),
      allocatedAmount: Number(newPayment.allocatedAmount),
      unallocatedAmount: Number(newPayment.unallocatedAmount),
    });
  } catch (error: any) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ error: error.message || 'Failed to record payment' }, { status: 500 });
  }
}
