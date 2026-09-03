// Batch 11 — Real Repayment & Payment Allocation Engine
import {
  LoanAccountRecord,
  LoanChargeItem,
  RepaymentScheduleItem,
  LoanTransactionItem,
  LoanHistoryItem,
} from '../types/loanAccountTypes';
import {
  PaymentRecord,
  PaymentAllocationRecord,
  PaymentReceiptRecord,
  PaymentReversalRecord,
  PaymentHistoryRecord,
  UnallocatedPaymentRecord,
  PaymentAllocationType,
} from '../types/repaymentTypes';

/**
 * Decimal-safe rounding utility to 2 decimal places.
 */
export function roundMoney(value: number): number {
  if (value === undefined || value === null || isNaN(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export interface AllocationExecutionResult {
  allocations: PaymentAllocationRecord[];
  updatedSchedules: RepaymentScheduleItem[];
  updatedCharges: LoanChargeItem[];
  updatedLoan: Partial<LoanAccountRecord>;
  allocatedAmount: number;
  unallocatedAmount: number;
  unallocatedRecord?: UnallocatedPaymentRecord;
  receiptSummary: {
    principal: number;
    interest: number;
    fees: number;
    penalty: number;
    advancePrincipal: number;
    unallocated: number;
  };
  repaymentTransaction: LoanTransactionItem;
  loanHistoryEntry: LoanHistoryItem;
  paymentHistoryEntry: PaymentHistoryRecord;
}

export interface ReversalExecutionResult {
  reversalRecord: PaymentReversalRecord;
  updatedAllocations: PaymentAllocationRecord[];
  updatedSchedules: RepaymentScheduleItem[];
  updatedCharges: LoanChargeItem[];
  updatedLoan: Partial<LoanAccountRecord>;
  compensatingTransaction: LoanTransactionItem;
  loanHistoryEntry: LoanHistoryItem;
  paymentHistoryEntry: PaymentHistoryRecord;
}

/**
 * Executes a deterministic financial waterfall allocation for a payment against a loan account.
 * Sequence:
 * 1. Penalties / Overdue Charges
 * 2. Fees / Levied Charges
 * 3. Schedule Dues (Interest Due first, then Fees Due, then Principal Due across instalments sorted by instalmentNumber)
 * 4. Advance Principal (if scheduled dues satisfied but principal remains)
 * 5. Suspense / Unallocated Account (for any residual payment amount)
 */
export function executePaymentAllocation(params: {
  loan: LoanAccountRecord;
  payment: PaymentRecord;
  actorName: string;
  actorRole: string;
}): AllocationExecutionResult {
  const { loan, payment, actorName, actorRole } = params;

  if (payment.amount <= 0) {
    throw new Error('Payment amount must be strictly greater than zero.');
  }

  if (loan.status === 'CANCELLED') {
    throw new Error('Payments cannot be posted to a cancelled loan account.');
  }

  let remainingPayment = roundMoney(payment.amount);
  const allocations: PaymentAllocationRecord[] = [];

  let totalPenaltyAllocated = 0;
  let totalFeeAllocated = 0;
  let totalInterestAllocated = 0;
  let totalPrincipalAllocated = 0;
  let totalAdvancePrincipalAllocated = 0;

  // Clone charges and schedules to ensure pure immutability
  const updatedCharges: LoanChargeItem[] = (loan.charges || []).map((c) => ({ ...c }));
  const updatedSchedules: RepaymentScheduleItem[] = (loan.schedules || []).map((s) => ({ ...s }));

  // Sort schedules by instalment number ascending (oldest first)
  updatedSchedules.sort((a, b) => a.instalmentNumber - b.instalmentNumber);

  // --- STAGE 1: ALLOCATE TO PENDING CHARGES & PENALTIES ---
  for (const charge of updatedCharges) {
    if (remainingPayment <= 0) break;
    if (charge.status === 'PENDING') {
      const chargeDue = roundMoney(charge.totalAmount);
      if (chargeDue > 0) {
        const allocAmount = Math.min(remainingPayment, chargeDue);
        const isPenalty = charge.chargeType === 'PREPAYMENT_PENALTY' || charge.chargeCode.includes('PENALTY');
        const allocType: PaymentAllocationType = isPenalty ? 'PENALTY' : 'FEE';

        allocations.push({
          id: `alloc_${payment.id}_chg_${charge.id}_${Date.now()}`,
          paymentId: payment.id,
          loanId: loan.id,
          chargeId: charge.id,
          allocationType: allocType,
          amount: roundMoney(allocAmount),
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          createdBy: actorName,
        });

        if (isPenalty) {
          totalPenaltyAllocated = roundMoney(totalPenaltyAllocated + allocAmount);
        } else {
          totalFeeAllocated = roundMoney(totalFeeAllocated + allocAmount);
        }

        charge.status = allocAmount >= chargeDue ? 'PAID' : 'PENDING';
        remainingPayment = roundMoney(remainingPayment - allocAmount);
      }
    }
  }

  // --- STAGE 2: ALLOCATE TO SCHEDULE INSTALMENTS (Waterfall per instalment) ---
  for (const item of updatedSchedules) {
    if (remainingPayment <= 0) break;

    const principalDueRemaining = Math.max(0, roundMoney(item.principalDue - item.principalPaid));
    const interestDueRemaining = Math.max(0, roundMoney(item.interestDue - item.interestPaid));
    const feesDueRemaining = Math.max(0, roundMoney(item.feesDue - item.feesPaid));
    const totalInstalmentRemaining = roundMoney(
      principalDueRemaining + interestDueRemaining + feesDueRemaining
    );

    if (totalInstalmentRemaining <= 0) continue;

    // 2a. Interest Due on Instalment
    if (interestDueRemaining > 0 && remainingPayment > 0) {
      const allocInterest = Math.min(remainingPayment, interestDueRemaining);
      allocations.push({
        id: `alloc_${payment.id}_inst_${item.instalmentNumber}_int_${Date.now()}`,
        paymentId: payment.id,
        loanId: loan.id,
        scheduleItemId: item.id,
        instalmentNumber: item.instalmentNumber,
        allocationType: 'INTEREST',
        amount: roundMoney(allocInterest),
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        createdBy: actorName,
      });
      item.interestPaid = roundMoney(item.interestPaid + allocInterest);
      totalInterestAllocated = roundMoney(totalInterestAllocated + allocInterest);
      remainingPayment = roundMoney(remainingPayment - allocInterest);
    }

    // 2b. Fees Due on Instalment
    if (feesDueRemaining > 0 && remainingPayment > 0) {
      const allocFee = Math.min(remainingPayment, feesDueRemaining);
      allocations.push({
        id: `alloc_${payment.id}_inst_${item.instalmentNumber}_fee_${Date.now()}`,
        paymentId: payment.id,
        loanId: loan.id,
        scheduleItemId: item.id,
        instalmentNumber: item.instalmentNumber,
        allocationType: 'FEE',
        amount: roundMoney(allocFee),
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        createdBy: actorName,
      });
      item.feesPaid = roundMoney(item.feesPaid + allocFee);
      totalFeeAllocated = roundMoney(totalFeeAllocated + allocFee);
      remainingPayment = roundMoney(remainingPayment - allocFee);
    }

    // 2c. Principal Due on Instalment
    if (principalDueRemaining > 0 && remainingPayment > 0) {
      const allocPrincipal = Math.min(remainingPayment, principalDueRemaining);
      allocations.push({
        id: `alloc_${payment.id}_inst_${item.instalmentNumber}_prin_${Date.now()}`,
        paymentId: payment.id,
        loanId: loan.id,
        scheduleItemId: item.id,
        instalmentNumber: item.instalmentNumber,
        allocationType: 'PRINCIPAL',
        amount: roundMoney(allocPrincipal),
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        createdBy: actorName,
      });
      item.principalPaid = roundMoney(item.principalPaid + allocPrincipal);
      totalPrincipalAllocated = roundMoney(totalPrincipalAllocated + allocPrincipal);
      remainingPayment = roundMoney(remainingPayment - allocPrincipal);
    }

    // Update instalment aggregate paid and outstanding balances
    item.totalPaid = roundMoney(item.principalPaid + item.interestPaid + item.feesPaid);
    item.outstandingAmount = Math.max(0, roundMoney(item.instalmentAmount - item.totalPaid));

    if (item.outstandingAmount <= 0) {
      item.status = 'PAID';
      item.paidDate = payment.paymentDate;
      item.paymentReference = payment.paymentNumber;
    } else if (item.totalPaid > 0) {
      item.status = 'PARTIALLY_PAID';
      item.paymentReference = payment.paymentNumber;
    }
  }

  // --- STAGE 3: ADVANCE PRINCIPAL OR UNALLOCATED SUSPENSE ---
  let unallocatedRecord: UnallocatedPaymentRecord | undefined;

  if (remainingPayment > 0) {
    const currentPrincipalRemaining = Math.max(
      0,
      roundMoney(loan.principalOutstanding - totalPrincipalAllocated)
    );

    if (currentPrincipalRemaining > 0) {
      // Allocate toward unamortized principal
      const advanceAlloc = Math.min(remainingPayment, currentPrincipalRemaining);
      allocations.push({
        id: `alloc_${payment.id}_adv_prin_${Date.now()}`,
        paymentId: payment.id,
        loanId: loan.id,
        allocationType: 'ADVANCE_PRINCIPAL',
        amount: roundMoney(advanceAlloc),
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        createdBy: actorName,
      });
      totalAdvancePrincipalAllocated = roundMoney(advanceAlloc);
      remainingPayment = roundMoney(remainingPayment - advanceAlloc);
    }

    // Any residual money goes into Suspense / Unallocated Payment
    if (remainingPayment > 0) {
      allocations.push({
        id: `alloc_${payment.id}_unalloc_${Date.now()}`,
        paymentId: payment.id,
        loanId: loan.id,
        allocationType: 'UNALLOCATED',
        amount: roundMoney(remainingPayment),
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        createdBy: actorName,
      });

      unallocatedRecord = {
        id: `unalloc_${payment.id}`,
        paymentId: payment.id,
        paymentNumber: payment.paymentNumber,
        loanId: loan.id,
        accountNumber: loan.accountNumber,
        customerId: loan.customerId,
        customerName: loan.customerName,
        totalAmount: payment.amount,
        allocatedAmount: roundMoney(payment.amount - remainingPayment),
        remainingAmount: roundMoney(remainingPayment),
        status: 'UNALLOCATED',
        reason: 'Payment amount exceeded current outstanding loan obligations.',
        paymentDate: payment.paymentDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  const allocatedAmount = roundMoney(payment.amount - remainingPayment);
  const unallocatedAmount = roundMoney(remainingPayment);

  // --- STAGE 4: COMPUTE UPDATED LOAN FINANCIAL BALANCES ---
  const totalPrincipalPaidNow = roundMoney(totalPrincipalAllocated + totalAdvancePrincipalAllocated);
  const newDisbursedPrincipal = loan.disbursedPrincipal;
  const newPrincipalOutstanding = Math.max(
    0,
    roundMoney(loan.principalOutstanding - totalPrincipalPaidNow)
  );
  const newInterestOutstanding = Math.max(
    0,
    roundMoney(loan.interestOutstanding - totalInterestAllocated)
  );
  const newFeeOutstanding = Math.max(
    0,
    roundMoney(loan.feeOutstanding - totalFeeAllocated)
  );
  const newPenaltyOutstanding = Math.max(
    0,
    roundMoney(loan.penaltyOutstanding - totalPenaltyAllocated)
  );
  const newTotalOutstanding = roundMoney(
    newPrincipalOutstanding + newInterestOutstanding + newFeeOutstanding + newPenaltyOutstanding
  );

  const newTotalPaidAmount = roundMoney(loan.totalPaidAmount + allocatedAmount);
  const newTotalPrincipalPaid = roundMoney(loan.totalPrincipalPaid + totalPrincipalPaidNow);
  const newTotalInterestPaid = roundMoney(loan.totalInterestPaid + totalInterestAllocated);
  const newTotalFeesPaid = roundMoney(
    loan.totalFeesPaid + totalFeeAllocated + totalPenaltyAllocated
  );

  // Calculate overdue amount from past-due schedule items
  const today = new Date().toISOString().split('T')[0];
  let calculatedOverdueAmount = 0;
  let maxDpd = 0;

  for (const s of updatedSchedules) {
    if (s.dueDate < today && s.outstandingAmount > 0) {
      calculatedOverdueAmount = roundMoney(calculatedOverdueAmount + s.outstandingAmount);
      const diffTime = Math.abs(new Date(today).getTime() - new Date(s.dueDate).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > maxDpd) maxDpd = diffDays;
    }
  }

  let dpdBucket: 'CURRENT' | '1-30 DPD' | '31-60 DPD' | '61-90 DPD' | '90+ DPD' = 'CURRENT';
  if (maxDpd > 90) dpdBucket = '90+ DPD';
  else if (maxDpd > 60) dpdBucket = '61-90 DPD';
  else if (maxDpd > 30) dpdBucket = '31-60 DPD';
  else if (maxDpd > 0) dpdBucket = '1-30 DPD';

  const updatedLoan: Partial<LoanAccountRecord> = {
    disbursedPrincipal: newDisbursedPrincipal,
    principalOutstanding: newPrincipalOutstanding,
    interestOutstanding: newInterestOutstanding,
    feeOutstanding: newFeeOutstanding,
    penaltyOutstanding: newPenaltyOutstanding,
    totalOutstanding: newTotalOutstanding,
    totalPaidAmount: newTotalPaidAmount,
    totalPrincipalPaid: newTotalPrincipalPaid,
    totalInterestPaid: newTotalInterestPaid,
    totalFeesPaid: newTotalFeesPaid,
    overdueAmount: calculatedOverdueAmount,
    dpd: maxDpd,
    dpdBucket,
    status: calculatedOverdueAmount > 0 ? 'OVERDUE' : loan.status === 'OVERDUE' ? 'ACTIVE' : loan.status,
    updatedAt: new Date().toISOString(),
    updatedBy: actorName,
  };

  // --- STAGE 5: CRITICAL FINANCIAL INVARIANT CHECKS ---
  if (allocatedAmount + unallocatedAmount !== payment.amount) {
    throw new Error(
      `Financial invariant violated: Allocated (${allocatedAmount}) + Unallocated (${unallocatedAmount}) !== Payment (${payment.amount})`
    );
  }
  if (newPrincipalOutstanding < 0 || newInterestOutstanding < 0 || newFeeOutstanding < 0) {
    throw new Error('Financial invariant violated: Loan balance cannot become negative.');
  }

  // --- STAGE 6: CREATE TRANSACTION & AUDIT LOGS ---
  const repaymentTransaction: LoanTransactionItem = {
    id: `ltxn_rep_${payment.id}`,
    loanId: loan.id,
    accountNumber: loan.accountNumber,
    transactionReference: payment.paymentNumber,
    transactionType: 'REPAYMENT',
    amount: payment.amount,
    principalPortion: totalPrincipalPaidNow,
    interestPortion: totalInterestAllocated,
    feePortion: totalFeeAllocated,
    penaltyPortion: totalPenaltyAllocated,
    status: 'SUCCESSFUL',
    referenceId: payment.referenceNumber,
    utrNumber: payment.referenceNumber,
    paymentMethod: payment.paymentMethod,
    notes: payment.notes || `Repayment of ₹${payment.amount.toLocaleString('en-IN')} received via ${payment.paymentMethod}`,
    transactionDate: payment.paymentDate,
    createdAt: new Date().toISOString(),
    createdBy: actorName,
  };

  const loanHistoryEntry: LoanHistoryItem = {
    id: `lh_rep_${payment.id}`,
    loanId: loan.id,
    timestamp: new Date().toISOString(),
    action: 'PAYMENT_POSTED',
    actor: actorName,
    actorName,
    actorRole,
    previousState: loan.status,
    newState: updatedLoan.status || loan.status,
    amount: payment.amount,
    reference: payment.paymentNumber,
    notes: `Payment ${payment.paymentNumber} posted. Allocated: Principal ₹${totalPrincipalPaidNow}, Interest ₹${totalInterestAllocated}, Fees ₹${totalFeeAllocated + totalPenaltyAllocated}${unallocatedAmount > 0 ? `, Suspense ₹${unallocatedAmount}` : ''}`,
  };

  const paymentHistoryEntry: PaymentHistoryRecord = {
    id: `ph_posted_${payment.id}`,
    paymentId: payment.id,
    timestamp: new Date().toISOString(),
    event: 'POSTED',
    actor: actorName,
    actorName,
    actorRole,
    previousState: payment.status,
    newState: unallocatedAmount > 0 && allocatedAmount > 0 ? 'PARTIALLY_ALLOCATED' : 'POSTED',
    amount: payment.amount,
    reference: payment.paymentNumber,
    notes: `Payment allocated and posted successfully. Receipt generated.`,
  };

  return {
    allocations,
    updatedSchedules,
    updatedCharges,
    updatedLoan,
    allocatedAmount,
    unallocatedAmount,
    unallocatedRecord,
    receiptSummary: {
      principal: totalPrincipalPaidNow,
      interest: totalInterestAllocated,
      fees: totalFeeAllocated,
      penalty: totalPenaltyAllocated,
      advancePrincipal: totalAdvancePrincipalAllocated,
      unallocated: unallocatedAmount,
    },
    repaymentTransaction,
    loanHistoryEntry,
    paymentHistoryEntry,
  };
}

/**
 * Executes a compensating reversal of a posted payment.
 * Restores schedule instalments, pending charges, and loan balances to their prior state.
 */
export function executePaymentReversal(params: {
  payment: PaymentRecord;
  loan: LoanAccountRecord;
  reason: string;
  notes?: string;
  actorName: string;
  actorRole: string;
}): ReversalExecutionResult {
  const { payment, loan, reason, notes, actorName, actorRole } = params;

  if (payment.status === 'REVERSED') {
    throw new Error('This payment has already been reversed.');
  }

  if (payment.status !== 'POSTED' && payment.status !== 'PARTIALLY_ALLOCATED' && payment.status !== 'FULLY_ALLOCATED') {
    throw new Error(`Only posted payments can be reversed. Current status: ${payment.status}`);
  }

  let restoredPrincipal = 0;
  let restoredInterest = 0;
  let restoredFees = 0;
  let restoredPenalty = 0;

  const updatedAllocations: PaymentAllocationRecord[] = payment.allocations.map((a) => ({
    ...a,
    status: 'REVERSED',
  }));

  const updatedCharges: LoanChargeItem[] = (loan.charges || []).map((c) => ({ ...c }));
  const updatedSchedules: RepaymentScheduleItem[] = (loan.schedules || []).map((s) => ({ ...s }));

  for (const alloc of payment.allocations) {
    if (alloc.status === 'REVERSED') continue;

    if (alloc.allocationType === 'PRINCIPAL' || alloc.allocationType === 'ADVANCE_PRINCIPAL') {
      restoredPrincipal = roundMoney(restoredPrincipal + alloc.amount);
    } else if (alloc.allocationType === 'INTEREST') {
      restoredInterest = roundMoney(restoredInterest + alloc.amount);
    } else if (alloc.allocationType === 'FEE') {
      restoredFees = roundMoney(restoredFees + alloc.amount);
    } else if (alloc.allocationType === 'PENALTY') {
      restoredPenalty = roundMoney(restoredPenalty + alloc.amount);
    }

    if (alloc.scheduleItemId) {
      const scheduleItem = updatedSchedules.find((s) => s.id === alloc.scheduleItemId);
      if (scheduleItem) {
        if (alloc.allocationType === 'PRINCIPAL') {
          scheduleItem.principalPaid = Math.max(0, roundMoney(scheduleItem.principalPaid - alloc.amount));
        } else if (alloc.allocationType === 'INTEREST') {
          scheduleItem.interestPaid = Math.max(0, roundMoney(scheduleItem.interestPaid - alloc.amount));
        } else if (alloc.allocationType === 'FEE') {
          scheduleItem.feesPaid = Math.max(0, roundMoney(scheduleItem.feesPaid - alloc.amount));
        }

        scheduleItem.totalPaid = roundMoney(
          scheduleItem.principalPaid + scheduleItem.interestPaid + scheduleItem.feesPaid
        );
        scheduleItem.outstandingAmount = roundMoney(
          scheduleItem.instalmentAmount - scheduleItem.totalPaid
        );

        if (scheduleItem.outstandingAmount >= scheduleItem.instalmentAmount) {
          scheduleItem.status = 'DUE';
          scheduleItem.paidDate = undefined;
          scheduleItem.paymentReference = undefined;
        } else if (scheduleItem.totalPaid > 0) {
          scheduleItem.status = 'PARTIALLY_PAID';
        }
      }
    }

    if (alloc.chargeId) {
      const charge = updatedCharges.find((c) => c.id === alloc.chargeId);
      if (charge) {
        charge.status = 'PENDING';
      }
    }
  }

  // Restore loan balances
  const newPrincipalOutstanding = roundMoney(loan.principalOutstanding + restoredPrincipal);
  const newInterestOutstanding = roundMoney(loan.interestOutstanding + restoredInterest);
  const newFeeOutstanding = roundMoney(loan.feeOutstanding + restoredFees);
  const newPenaltyOutstanding = roundMoney(loan.penaltyOutstanding + restoredPenalty);
  const newTotalOutstanding = roundMoney(
    newPrincipalOutstanding + newInterestOutstanding + newFeeOutstanding + newPenaltyOutstanding
  );

  const newTotalPaidAmount = Math.max(0, roundMoney(loan.totalPaidAmount - payment.allocatedAmount));
  const newTotalPrincipalPaid = Math.max(0, roundMoney(loan.totalPrincipalPaid - restoredPrincipal));
  const newTotalInterestPaid = Math.max(0, roundMoney(loan.totalInterestPaid - restoredInterest));
  const newTotalFeesPaid = Math.max(
    0,
    roundMoney(loan.totalFeesPaid - (restoredFees + restoredPenalty))
  );

  const reversalNumber = `REV-${new Date().getFullYear()}-${String(Math.floor(100000 + Math.random() * 900000))}`;

  const updatedLoan: Partial<LoanAccountRecord> = {
    principalOutstanding: newPrincipalOutstanding,
    interestOutstanding: newInterestOutstanding,
    feeOutstanding: newFeeOutstanding,
    penaltyOutstanding: newPenaltyOutstanding,
    totalOutstanding: newTotalOutstanding,
    totalPaidAmount: newTotalPaidAmount,
    totalPrincipalPaid: newTotalPrincipalPaid,
    totalInterestPaid: newTotalInterestPaid,
    totalFeesPaid: newTotalFeesPaid,
    updatedAt: new Date().toISOString(),
    updatedBy: actorName,
  };

  const compensatingTransaction: LoanTransactionItem = {
    id: `ltxn_rev_${payment.id}`,
    loanId: loan.id,
    accountNumber: loan.accountNumber,
    transactionReference: reversalNumber,
    transactionType: 'REVERSAL',
    amount: payment.allocatedAmount,
    principalPortion: restoredPrincipal,
    interestPortion: restoredInterest,
    feePortion: restoredFees,
    penaltyPortion: restoredPenalty,
    status: 'SUCCESSFUL',
    referenceId: payment.paymentNumber,
    notes: `Reversal of payment ${payment.paymentNumber}. Reason: ${reason}`,
    transactionDate: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
    createdBy: actorName,
  };

  const reversalRecord: PaymentReversalRecord = {
    id: `rev_${payment.id}_${Date.now()}`,
    reversalNumber,
    paymentId: payment.id,
    loanId: loan.id,
    amount: payment.amount,
    reason,
    notes,
    reversedBy: actorName,
    reversedByName: actorName,
    reversedAt: new Date().toISOString(),
    compensatingTxnId: compensatingTransaction.id,
  };

  const loanHistoryEntry: LoanHistoryItem = {
    id: `lh_rev_${payment.id}`,
    loanId: loan.id,
    timestamp: new Date().toISOString(),
    action: 'PAYMENT_REVERSED',
    actor: actorName,
    actorName,
    actorRole,
    amount: payment.amount,
    reference: reversalNumber,
    reason,
    notes: `Payment ${payment.paymentNumber} reversed. Reason: ${reason}. Restored Principal: ₹${restoredPrincipal}, Interest: ₹${restoredInterest}, Fees: ₹${restoredFees + restoredPenalty}.`,
  };

  const paymentHistoryEntry: PaymentHistoryRecord = {
    id: `ph_rev_${payment.id}`,
    paymentId: payment.id,
    timestamp: new Date().toISOString(),
    event: 'REVERSED',
    actor: actorName,
    actorName,
    actorRole,
    previousState: payment.status,
    newState: 'REVERSED',
    amount: payment.amount,
    reference: reversalNumber,
    reason,
    notes: `Payment reversed by ${actorName}. Reversal Ref: ${reversalNumber}.`,
  };

  return {
    reversalRecord,
    updatedAllocations,
    updatedSchedules,
    updatedCharges,
    updatedLoan,
    compensatingTransaction,
    loanHistoryEntry,
    paymentHistoryEntry,
  };
}
