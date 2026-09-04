// Priority LMS Batch 5 — Operational 3-Way Reconciliation Engine
import prisma from '../../lib/prisma';
import { roundMoney } from '../loanFinancialService';
import { AuthContextUser } from '../../lib/serverAuth';

export interface ReconciliationSummary {
  batchId: string;
  batchNumber: string;
  batchType: string;
  totalCount: number;
  matchedCount: number;
  mismatchCount: number;
  discrepancies: {
    id: string;
    itemType: string;
    lmsReference: string;
    status: string;
    discrepancyNote: string;
  }[];
}

/**
 * Runs 3-Way Operational Reconciliation for Disbursements (LMS Transaction ↔ Bank/UTR ↔ GL Journal).
 */
export async function runDisbursementReconciliation(
  actorUser: AuthContextUser
): Promise<ReconciliationSummary> {
  const transactions = await prisma.disbursementTransaction.findMany({
    include: {
      disbursement: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const batchCount = await prisma.reconciliationBatch.count();
  const year = new Date().getFullYear();
  const batchNumber = `REC-${year}-DSB-${String(batchCount + 1).padStart(5, '0')}`;

  const batch = await prisma.reconciliationBatch.create({
    data: {
      batchNumber,
      batchType: 'DISBURSEMENT',
      performedBy: actorUser.name,
      status: 'PROCESSING',
    },
  });

  let matchedCount = 0;
  let mismatchCount = 0;
  const itemsToCreate: any[] = [];
  const discrepancies: any[] = [];

  // Track seen reference numbers for duplicate detection
  const seenRefs = new Set<string>();

  for (const txn of transactions) {
    const txnAmount = Number(txn.amount);
    let status = 'MATCHED';
    let discrepancyNote: string | null = null;

    // Check for duplicate reference
    if (seenRefs.has(txn.transactionReference)) {
      status = 'DUPLICATE';
      discrepancyNote = `Duplicate transaction reference ${txn.transactionReference} detected.`;
    } else {
      seenRefs.add(txn.transactionReference);
    }

    // Check Provider/Bank UTR existence for SUCCESSFUL transactions
    if (status === 'MATCHED' && txn.status === 'SUCCESSFUL' && !txn.utrNumber && !txn.externalReference) {
      status = 'MISSING_IN_BANK';
      discrepancyNote = `Successful disbursement transaction lacks confirmed bank UTR or gateway payout reference.`;
    }

    // Check Accounting GL Journal Entry
    const journalEntry = await prisma.journalEntry.findFirst({
      where: {
        transactionType: 'DISBURSEMENT',
        referenceId: txn.disbursementId,
      },
      include: { postings: true },
    });

    let glAmount = txnAmount;
    if (status === 'MATCHED') {
      if (!journalEntry && txn.status === 'SUCCESSFUL') {
        status = 'MISSING_IN_GL';
        discrepancyNote = `Disbursement transaction has no registered double-entry GL Journal record.`;
      } else if (journalEntry) {
        glAmount = Number(journalEntry.totalDebit);
        if (Math.abs(glAmount - txnAmount) > 0.01) {
          status = 'AMOUNT_MISMATCH';
          discrepancyNote = `Disbursement amount ₹${txnAmount} does not match GL Journal entry amount ₹${glAmount}.`;
        }
      }
    }

    if (status === 'MATCHED') {
      matchedCount++;
    } else {
      mismatchCount++;
      discrepancies.push({
        id: txn.id,
        itemType: 'DISBURSEMENT',
        lmsReference: txn.transactionReference,
        status,
        discrepancyNote: discrepancyNote || 'Discrepancy identified',
      });
    }

    itemsToCreate.push({
      batchId: batch.id,
      itemType: 'DISBURSEMENT',
      lmsReference: txn.transactionReference,
      providerReference: txn.utrNumber || txn.externalReference || null,
      lmsAmount: txnAmount,
      providerAmount: txnAmount,
      glAmount,
      status,
      discrepancyNote,
    });
  }

  // Persist items
  if (itemsToCreate.length > 0) {
    await prisma.reconciliationItem.createMany({
      data: itemsToCreate,
    });
  }

  await prisma.reconciliationBatch.update({
    where: { id: batch.id },
    data: {
      status: 'COMPLETED',
      totalCount: itemsToCreate.length,
      matchedCount,
      mismatchCount,
      summary: {
        totalAnalyzed: itemsToCreate.length,
        cleanTransactions: matchedCount,
        exceptions: mismatchCount,
      },
    },
  });

  return {
    batchId: batch.id,
    batchNumber,
    batchType: 'DISBURSEMENT',
    totalCount: itemsToCreate.length,
    matchedCount,
    mismatchCount,
    discrepancies,
  };
}

/**
 * Runs 3-Way Operational Reconciliation for Repayments (Payment ↔ Allocation Waterfall ↔ GL).
 */
export async function runRepaymentReconciliation(
  actorUser: AuthContextUser
): Promise<ReconciliationSummary> {
  const payments = await prisma.payment.findMany({
    include: {
      allocations: true,
      unallocated: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const batchCount = await prisma.reconciliationBatch.count();
  const year = new Date().getFullYear();
  const batchNumber = `REC-${year}-RPY-${String(batchCount + 1).padStart(5, '0')}`;

  const batch = await prisma.reconciliationBatch.create({
    data: {
      batchNumber,
      batchType: 'REPAYMENT',
      performedBy: actorUser.name,
      status: 'PROCESSING',
    },
  });

  let matchedCount = 0;
  let mismatchCount = 0;
  const itemsToCreate: any[] = [];
  const discrepancies: any[] = [];

  for (const p of payments) {
    const pmtAmount = Number(p.amount);
    let status = 'MATCHED';
    let discrepancyNote: string | null = null;

    // Sum of active allocations
    const allocatedSum = roundMoney(
      p.allocations
        .filter((a) => a.status === 'ACTIVE')
        .reduce((sum, a) => sum + Number(a.amount), 0)
    );
    const unallocatedAmt = p.unallocated ? Number(p.unallocated.remainingAmount) : 0;
    const totalAccounted = roundMoney(allocatedSum + unallocatedAmt);

    // If POSTED or FULLY_ALLOCATED, verify totalAccounted matches payment amount
    if (['POSTED', 'FULLY_ALLOCATED', 'PARTIALLY_ALLOCATED'].includes(p.status)) {
      if (Math.abs(totalAccounted - pmtAmount) > 0.05 && pmtAmount > 0) {
        status = 'AMOUNT_MISMATCH';
        discrepancyNote = `Payment amount ₹${pmtAmount} differs from allocations + suspense total ₹${totalAccounted}.`;
      }

      // Check GL Journal entry
      const journalEntry = await prisma.journalEntry.findFirst({
        where: {
          transactionType: 'REPAYMENT',
          referenceId: p.id,
        },
      });

      if (!journalEntry && p.status !== 'RECEIVED') {
        status = 'MISSING_IN_GL';
        discrepancyNote = `Posted repayment receipt ${p.paymentNumber} has no registered double-entry GL Journal record.`;
      }
    }

    if (status === 'MATCHED') {
      matchedCount++;
    } else {
      mismatchCount++;
      discrepancies.push({
        id: p.id,
        itemType: 'REPAYMENT',
        lmsReference: p.paymentNumber,
        status,
        discrepancyNote: discrepancyNote || 'Discrepancy identified',
      });
    }

    itemsToCreate.push({
      batchId: batch.id,
      itemType: 'REPAYMENT',
      lmsReference: p.paymentNumber,
      providerReference: p.referenceNumber || null,
      lmsAmount: pmtAmount,
      providerAmount: pmtAmount,
      glAmount: totalAccounted,
      status,
      discrepancyNote,
    });
  }

  if (itemsToCreate.length > 0) {
    await prisma.reconciliationItem.createMany({
      data: itemsToCreate,
    });
  }

  await prisma.reconciliationBatch.update({
    where: { id: batch.id },
    data: {
      status: 'COMPLETED',
      totalCount: itemsToCreate.length,
      matchedCount,
      mismatchCount,
      summary: {
        totalAnalyzed: itemsToCreate.length,
        cleanPayments: matchedCount,
        exceptions: mismatchCount,
      },
    },
  });

  return {
    batchId: batch.id,
    batchNumber,
    batchType: 'REPAYMENT',
    totalCount: itemsToCreate.length,
    matchedCount,
    mismatchCount,
    discrepancies,
  };
}

/**
 * Resolves a flagged reconciliation discrepancy.
 */
export async function resolveReconciliationItem(params: {
  itemId: string;
  resolutionNotes: string;
  actorUser: AuthContextUser;
}) {
  const { itemId, resolutionNotes, actorUser } = params;
  return prisma.reconciliationItem.update({
    where: { id: itemId },
    data: {
      resolved: true,
      resolvedBy: actorUser.name,
      resolvedAt: new Date(),
      resolutionNotes,
    },
  });
}
