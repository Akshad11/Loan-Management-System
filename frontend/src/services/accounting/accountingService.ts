// Priority LMS Batch 5 — Core Double-Entry General Ledger (GL) & Accounting Service
import prisma from '../../lib/prisma';
import { roundMoney } from '../loanFinancialService';

export interface AccountingPosting {
  glAccountCode: string;
  glAccountName: string;
  debitAmount: number;
  creditAmount: number;
  narration?: string;
}

export interface CreateJournalEntryPayload {
  transactionType: 'DISBURSEMENT' | 'REPAYMENT' | 'REVERSAL' | 'FEE_ACCRUAL' | 'WAIVER' | 'PENALTY';
  referenceId?: string;
  loanId?: string;
  accountNumber?: string;
  narration: string;
  postings: AccountingPosting[];
  idempotencyKey?: string;
  createdBy: string;
}

/**
 * Standard General Ledger Chart of Accounts (COA)
 */
export const GL_ACCOUNTS = {
  CASH_AND_BANK: { code: '1001', name: 'Cash and Bank Clearing Account' },
  LOAN_PRINCIPAL_ASSET: { code: '1002', name: 'Loans & Advances Asset (Principal)' },
  INTEREST_RECEIVABLE: { code: '1003', name: 'Interest Dues Receivable' },
  FEES_RECEIVABLE: { code: '1004', name: 'Charges & Fees Receivable' },
  BORROWER_PAYABLE: { code: '2001', name: 'Borrower Disbursement Payable' },
  UNALLOCATED_SUSPENSE: { code: '2002', name: 'Unallocated Payment Suspense Account' },
  INTEREST_INCOME: { code: '4001', name: 'Interest Income from Loans' },
  FEE_INCOME: { code: '4002', name: 'Processing & Loan Service Fee Income' },
  PENALTY_INCOME: { code: '4003', name: 'Penal Charges & Late Fee Income' },
  GATEWAY_EXPENSE: { code: '5001', name: 'Bank & Payment Gateway Expenses' },
  WAIVER_EXPENSE: { code: '5002', name: 'Fee & Charge Waivers Concession Expense' },
};

/**
 * Creates an immutable, balanced double-entry Journal Entry with postings.
 * Strictly verifies that totalDebit === totalCredit.
 */
export async function createJournalEntry(payload: CreateJournalEntryPayload) {
  const {
    transactionType,
    referenceId,
    loanId,
    accountNumber,
    narration,
    postings,
    idempotencyKey,
    createdBy,
  } = payload;

  // 1. Check idempotency
  if (idempotencyKey) {
    const existing = await prisma.journalEntry.findUnique({
      where: { idempotencyKey },
      include: { postings: true },
    });
    if (existing) {
      return existing;
    }
  }

  // 2. Validate double-entry integrity
  let totalDebit = 0;
  let totalCredit = 0;

  for (const p of postings) {
    totalDebit = roundMoney(totalDebit + (p.debitAmount || 0));
    totalCredit = roundMoney(totalCredit + (p.creditAmount || 0));
  }

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(
      `Double-Entry Invariant Violation: Debits (₹${totalDebit}) must exactly equal Credits (₹${totalCredit}).`
    );
  }

  if (totalDebit <= 0) {
    throw new Error('Journal entry total debit amount must be greater than zero.');
  }

  // 3. Generate sequential entry number
  const year = new Date().getFullYear();
  const timeSuffix = Date.now().toString().slice(-6);
  const rand = Math.floor(10 + Math.random() * 90);
  const entryNumber = `JRN-${year}-${timeSuffix}${rand}`;

  // 4. Persist in database
  const entry = await prisma.journalEntry.create({
    data: {
      entryNumber,
      transactionType,
      referenceId: referenceId || null,
      loanId: loanId || null,
      accountNumber: accountNumber || null,
      narration,
      totalDebit,
      totalCredit,
      status: 'POSTED',
      idempotencyKey: idempotencyKey || null,
      createdBy,
      postings: {
        create: postings.map((p) => ({
          glAccountCode: p.glAccountCode,
          glAccountName: p.glAccountName,
          debitAmount: p.debitAmount || 0,
          creditAmount: p.creditAmount || 0,
          narration: p.narration || null,
        })),
      },
    },
    include: {
      postings: true,
    },
  });

  return entry;
}

/**
 * Generates balanced double-entry accounting for loan principal disbursement.
 */
export async function recordDisbursementAccounting(params: {
  disbursementId: string;
  disbursementNumber: string;
  loanId?: string;
  accountNumber?: string;
  grossAmount: number;
  deductionsAmount?: number;
  netPayoutAmount: number;
  idempotencyKey?: string;
  actorName: string;
}) {
  const {
    disbursementId,
    disbursementNumber,
    loanId,
    accountNumber,
    grossAmount,
    deductionsAmount = 0,
    netPayoutAmount,
    idempotencyKey,
    actorName,
  } = params;

  const postings: AccountingPosting[] = [
    {
      glAccountCode: GL_ACCOUNTS.LOAN_PRINCIPAL_ASSET.code,
      glAccountName: GL_ACCOUNTS.LOAN_PRINCIPAL_ASSET.name,
      debitAmount: roundMoney(grossAmount),
      creditAmount: 0,
      narration: `Principal loan advancement for Disbursement ${disbursementNumber}`,
    },
    {
      glAccountCode: GL_ACCOUNTS.CASH_AND_BANK.code,
      glAccountName: GL_ACCOUNTS.CASH_AND_BANK.name,
      debitAmount: 0,
      creditAmount: roundMoney(netPayoutAmount),
      narration: `Bank payout credit release for Disbursement ${disbursementNumber}`,
    },
  ];

  if (deductionsAmount > 0) {
    postings.push({
      glAccountCode: GL_ACCOUNTS.FEE_INCOME.code,
      glAccountName: GL_ACCOUNTS.FEE_INCOME.name,
      debitAmount: 0,
      creditAmount: roundMoney(deductionsAmount),
      narration: `Upfront processing fee deductions retained from Disbursement ${disbursementNumber}`,
    });
  }

  return createJournalEntry({
    transactionType: 'DISBURSEMENT',
    referenceId: disbursementId,
    loanId,
    accountNumber,
    narration: `Disbursement release of ₹${netPayoutAmount} (Gross: ₹${grossAmount}) for ${disbursementNumber}`,
    postings,
    idempotencyKey: idempotencyKey || `dsb_acct_${disbursementId}_${grossAmount}`,
    createdBy: actorName,
  });
}

/**
 * Generates balanced double-entry accounting for repayment collection and allocation.
 */
export async function recordRepaymentAccounting(params: {
  paymentId: string;
  paymentNumber: string;
  loanId: string;
  accountNumber: string;
  totalAmount: number;
  principalPortion: number;
  interestPortion: number;
  feePortion: number;
  penaltyPortion: number;
  unallocatedPortion: number;
  idempotencyKey?: string;
  actorName: string;
}) {
  const {
    paymentId,
    paymentNumber,
    loanId,
    accountNumber,
    totalAmount,
    principalPortion,
    interestPortion,
    feePortion,
    penaltyPortion,
    unallocatedPortion,
    idempotencyKey,
    actorName,
  } = params;

  const postings: AccountingPosting[] = [
    {
      glAccountCode: GL_ACCOUNTS.CASH_AND_BANK.code,
      glAccountName: GL_ACCOUNTS.CASH_AND_BANK.name,
      debitAmount: roundMoney(totalAmount),
      creditAmount: 0,
      narration: `Repayment collection receipt ${paymentNumber}`,
    },
  ];

  if (principalPortion > 0) {
    postings.push({
      glAccountCode: GL_ACCOUNTS.LOAN_PRINCIPAL_ASSET.code,
      glAccountName: GL_ACCOUNTS.LOAN_PRINCIPAL_ASSET.name,
      debitAmount: 0,
      creditAmount: roundMoney(principalPortion),
      narration: `Principal reduction on Loan ${accountNumber}`,
    });
  }

  if (interestPortion > 0) {
    postings.push({
      glAccountCode: GL_ACCOUNTS.INTEREST_INCOME.code,
      glAccountName: GL_ACCOUNTS.INTEREST_INCOME.name,
      debitAmount: 0,
      creditAmount: roundMoney(interestPortion),
      narration: `Interest income realization on Loan ${accountNumber}`,
    });
  }

  if (feePortion > 0) {
    postings.push({
      glAccountCode: GL_ACCOUNTS.FEE_INCOME.code,
      glAccountName: GL_ACCOUNTS.FEE_INCOME.name,
      debitAmount: 0,
      creditAmount: roundMoney(feePortion),
      narration: `Fee dues settlement on Loan ${accountNumber}`,
    });
  }

  if (penaltyPortion > 0) {
    postings.push({
      glAccountCode: GL_ACCOUNTS.PENALTY_INCOME.code,
      glAccountName: GL_ACCOUNTS.PENALTY_INCOME.name,
      debitAmount: 0,
      creditAmount: roundMoney(penaltyPortion),
      narration: `Late payment penal charges recovered on Loan ${accountNumber}`,
    });
  }

  if (unallocatedPortion > 0) {
    postings.push({
      glAccountCode: GL_ACCOUNTS.UNALLOCATED_SUSPENSE.code,
      glAccountName: GL_ACCOUNTS.UNALLOCATED_SUSPENSE.name,
      debitAmount: 0,
      creditAmount: roundMoney(unallocatedPortion),
      narration: `Advance/Suspense credit held for Loan ${accountNumber}`,
    });
  }

  return createJournalEntry({
    transactionType: 'REPAYMENT',
    referenceId: paymentId,
    loanId,
    accountNumber,
    narration: `Repayment allocation for ${paymentNumber} on Loan ${accountNumber}`,
    postings,
    idempotencyKey: idempotencyKey || `repay_acct_${paymentId}`,
    createdBy: actorName,
  });
}

/**
 * Creates a compensating reversal journal entry that mirrors and inverts an existing entry.
 */
export async function recordReversalJournal(params: {
  originalJournalEntryId: string;
  reason: string;
  actorName: string;
}) {
  const { originalJournalEntryId, reason, actorName } = params;

  const original = await prisma.journalEntry.findUnique({
    where: { id: originalJournalEntryId },
    include: { postings: true },
  });

  if (!original) {
    throw new Error(`Original Journal Entry ${originalJournalEntryId} not found for reversal.`);
  }

  if (original.status === 'REVERSED') {
    throw new Error(`Journal Entry ${original.entryNumber} has already been reversed.`);
  }

  // Invert debits and credits
  const reversedPostings: AccountingPosting[] = original.postings.map((p) => ({
    glAccountCode: p.glAccountCode,
    glAccountName: p.glAccountName,
    debitAmount: Number(p.creditAmount),
    creditAmount: Number(p.debitAmount),
    narration: `Reversal of ${p.narration || original.entryNumber}`,
  }));

  const reversalEntry = await createJournalEntry({
    transactionType: 'REVERSAL',
    referenceId: original.referenceId || original.id,
    loanId: original.loanId || undefined,
    accountNumber: original.accountNumber || undefined,
    narration: `Compensating reversal of ${original.entryNumber}. Reason: ${reason}`,
    postings: reversedPostings,
    idempotencyKey: `rev_${original.id}`,
    createdBy: actorName,
  });

  // Mark original as reversed and link
  await prisma.journalEntry.update({
    where: { id: original.id },
    data: {
      status: 'REVERSED',
      reversedAt: new Date(),
      reversalEntryId: reversalEntry.id,
    },
  });

  return reversalEntry;
}
