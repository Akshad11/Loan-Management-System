// Priority LMS Batch 5 — Real Operations Dashboard Metrics API
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await requireAuth(request, ['view_dashboard', 'view_loans', 'view_disbursements']);
    if (authResult instanceof NextResponse) return authResult;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 1. Pending disbursements count & total requested amount
    const pendingRequests = await prisma.disbursementRequest.findMany({
      where: {
        status: { in: ['PENDING_APPROVAL', 'APPROVED'] },
      },
    });
    const pendingDisbursementsCount = pendingRequests.length;
    const pendingDisbursementsAmount = pendingRequests.reduce(
      (sum, r) => sum + Number(r.requestedAmount),
      0
    );

    // 2. Failed disbursements
    const failedTransactions = await prisma.disbursementTransaction.findMany({
      where: { status: 'FAILED' },
      orderBy: { failedAt: 'desc' },
      take: 10,
    });
    const failedDisbursementsCount = failedTransactions.length;

    // 3. Processing transactions
    const processingTransactionsCount = await prisma.disbursementTransaction.count({
      where: { status: 'PROCESSING' },
    });

    // 4. Today's disbursement amount & count
    const todayDisbursements = await prisma.disbursementTransaction.findMany({
      where: {
        status: 'SUCCESSFUL',
        completedAt: { gte: todayStart },
      },
    });
    const todayDisbursementAmount = todayDisbursements.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );
    const todayDisbursementCount = todayDisbursements.length;

    // 5. Today's repayment amount & count
    const todayPayments = await prisma.payment.findMany({
      where: {
        status: { in: ['POSTED', 'FULLY_ALLOCATED', 'PARTIALLY_ALLOCATED'] },
        postingDate: { gte: todayStart },
      },
    });
    const todayRepaymentAmount = todayPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );
    const todayRepaymentCount = todayPayments.length;

    // 6. Failed payments
    const failedPaymentsCount = await prisma.payment.count({
      where: { status: 'FAILED' },
    });

    // 7. Pending reconciliation exceptions
    const pendingReconItems = await prisma.reconciliationItem.findMany({
      where: {
        resolved: false,
        status: { not: 'MATCHED' },
      },
      take: 15,
      orderBy: { id: 'desc' },
    });
    const pendingReconciliationCount = await prisma.reconciliationItem.count({
      where: {
        resolved: false,
        status: { not: 'MATCHED' },
      },
    });

    // 8. Unallocated suspense payments
    const unallocatedRecords = await prisma.unallocatedPayment.findMany({
      where: { status: 'UNALLOCATED' },
      take: 15,
    });
    const totalUnallocatedSuspense = unallocatedRecords.reduce(
      (sum, u) => sum + Number(u.remainingAmount),
      0
    );

    // 9. Reversed transactions
    const reversedDisbursementsCount = await prisma.disbursementTransaction.count({
      where: { status: 'REVERSED' },
    });
    const reversedPaymentsCount = await prisma.payment.count({
      where: { status: 'REVERSED' },
    });
    const totalReversalsCount = reversedDisbursementsCount + reversedPaymentsCount;

    // 10. Critical exceptions requiring attention
    const exceptions = [
      ...failedTransactions.map((f) => ({
        id: f.id,
        type: 'FAILED_PAYOUT',
        severity: 'HIGH',
        reference: f.transactionReference,
        title: `Failed Payout: ₹${Number(f.amount).toLocaleString('en-IN')}`,
        detail: f.failureReason || 'Beneficiary bank network error',
        timestamp: f.failedAt || f.createdAt,
      })),
      ...pendingReconItems.slice(0, 5).map((r) => ({
        id: r.id,
        type: 'RECON_DISCREPANCY',
        severity: 'MEDIUM',
        reference: r.lmsReference,
        title: `Reconciliation ${r.status}: ₹${Number(r.lmsAmount).toLocaleString('en-IN')}`,
        detail: r.discrepancyNote || 'Mismatch against bank/GL',
        timestamp: new Date(),
      })),
    ];

    return NextResponse.json({
      metrics: {
        pendingDisbursementsCount,
        pendingDisbursementsAmount,
        failedDisbursementsCount,
        processingTransactionsCount,
        todayDisbursementAmount,
        todayDisbursementCount,
        todayRepaymentAmount,
        todayRepaymentCount,
        failedPaymentsCount,
        pendingReconciliationCount,
        totalUnallocatedSuspense,
        totalReversalsCount,
      },
      exceptions,
      unallocatedQueue: unallocatedRecords.map((u) => ({
        id: u.id,
        paymentId: u.paymentId,
        loanId: u.loanId,
        customerId: u.customerId,
        totalAmount: Number(u.totalAmount),
        remainingAmount: Number(u.remainingAmount),
        reason: u.reason,
      })),
    });
  } catch (error: any) {
    console.error('API /api/operations/dashboard GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
