// Batch 11 — Comprehensive Automated Verification Suite for Repayment & Payment Posting
import {
  executePaymentAllocation,
  executePaymentReversal,
  roundMoney,
} from '../services/repaymentAllocationEngine';
import { generateRepaymentSchedule } from '../services/loanFinancialService';
import { LoanAccountRecord, LoanChargeItem } from '../types/loanAccountTypes';
import { PaymentRecord, RecordPaymentPayload } from '../types/repaymentTypes';

function createMockLoan(): LoanAccountRecord {
  const schedResult = generateRepaymentSchedule({
    loanId: 'ln_test_001',
    versionNumber: 1,
    reason: 'Initial test schedule',
    principal: 300000,
    annualRate: 12.0,
    tenureMonths: 12,
    frequency: 'MONTHLY',
    interestMethod: 'REDUCING_BALANCE',
    startDate: '2026-09-01',
    firstDueDate: '2026-10-05',
    createdBy: 'Test Engine',
  });

  const charges: LoanChargeItem[] = [
    {
      id: 'chg_pen_001',
      loanId: 'ln_test_001',
      chargeTypeId: 'CHG_PEN',
      chargeCode: 'LATE_PENALTY',
      chargeName: 'Late Payment Penalty',
      chargeType: 'PREPAYMENT_PENALTY',
      calculationType: 'FIXED',
      rateOrValue: 500,
      amount: 500,
      taxAmount: 0,
      totalAmount: 500,
      chargeTiming: 'ON_EVENT',
      status: 'PENDING',
      source: 'TEST',
      createdAt: '2026-09-01T00:00:00Z',
      createdBy: 'Test Engine',
    },
    {
      id: 'chg_fee_001',
      loanId: 'ln_test_001',
      chargeTypeId: 'CHG_FEE',
      chargeCode: 'SERVICE_FEE',
      chargeName: 'Service Maintenance Fee',
      chargeType: 'ADMINISTRATIVE_FEE',
      calculationType: 'FIXED',
      rateOrValue: 1000,
      amount: 1000,
      taxAmount: 0,
      totalAmount: 1000,
      chargeTiming: 'ON_EVENT',
      status: 'PENDING',
      source: 'TEST',
      createdAt: '2026-09-01T00:00:00Z',
      createdBy: 'Test Engine',
    },
  ];

  return {
    id: 'ln_test_001',
    accountNumber: 'LN-2026-TEST01',
    customerId: 'CUS-TEST01',
    customerNumber: 'CUS-TEST01',
    customerName: 'Test Borrower',
    productCode: 'PL_STANDARD',
    productName: 'Personal Loan',
    branchId: 'br_panjim',
    branchName: 'Panaji',
    assignedOfficer: 'Alex Morgan',
    assignedOfficerId: 'usr_ops_01',
    originalPrincipal: 300000,
    disbursedPrincipal: 300000,
    principalOutstanding: 300000,
    interestOutstanding: schedResult.totalInterest,
    feeOutstanding: 1000,
    penaltyOutstanding: 500,
    totalOutstanding: roundMoney(300000 + schedResult.totalInterest + 1500),
    totalPaidAmount: 0,
    totalPrincipalPaid: 0,
    totalInterestPaid: 0,
    totalFeesPaid: 0,
    overdueAmount: 0,
    dpd: 0,
    dpdBucket: 'CURRENT',
    status: 'ACTIVE',
    interestRate: 12.0,
    interestMethod: 'REDUCING_BALANCE',
    repaymentFrequency: 'MONTHLY',
    tenureMonths: 12,
    totalInstalments: 12,
    remainingInstalments: 12,
    emiAmount: schedResult.emiAmount,
    disbursementDate: '2026-09-01',
    loanStartDate: '2026-09-01',
    firstDueDate: '2026-10-05',
    maturityDate: schedResult.maturityDate,
    nextDueDate: '2026-10-05',
    currentScheduleVersion: 1,
    scheduleVersions: [schedResult.version],
    schedules: schedResult.schedules,
    charges,
    transactions: [],
    history: [],
    repaymentSettings: {
      id: 'lrs_test',
      loanId: 'ln_test_001',
      repaymentFrequency: 'MONTHLY',
      paymentMethod: 'NACH_EMANDATE',
      mandateStatus: 'ACTIVE',
      preferredDebitDate: 5,
      gracePeriodDays: 3,
      updatedAt: '2026-09-01',
      updatedBy: 'Test',
    },
    createdAt: '2026-09-01',
    createdBy: 'Test',
    updatedAt: '2026-09-01',
  };
}

function runTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING BATCH 11 REPAYMENTS & PAYMENT POSTING TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  // --- TEST 1: Waterfall Priority (Penalty -> Fees -> Interest -> Principal) ---
  console.log('--- Suite 1: Allocation Waterfall Ordering ---');
  const loan1 = createMockLoan();
  const payment1: PaymentRecord = {
    id: 'pay_test_01',
    paymentNumber: 'PAY-2026-000001',
    loanId: loan1.id,
    accountNumber: loan1.accountNumber,
    customerId: loan1.customerId,
    customerName: loan1.customerName,
    amount: 1500, // Exactly equals penalty (500) + fee (1000)
    allocatedAmount: 0,
    unallocatedAmount: 0,
    paymentDate: '2026-09-05',
    valueDate: '2026-09-05',
    paymentMethod: 'UPI',
    status: 'RECEIVED',
    receivedBy: 'usr_01',
    receivedByName: 'User 1',
    allocations: [],
    history: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const res1 = executePaymentAllocation({
    loan: loan1,
    payment: payment1,
    actorName: 'Tester',
    actorRole: 'Test Engineer',
  });

  assert(res1.receiptSummary.penalty === 500, 'Allocates penalty first (₹500)');
  assert(res1.receiptSummary.fees === 1000, 'Allocates fees second (₹1,000)');
  assert(res1.receiptSummary.interest === 0, 'Does not allocate interest when exhausted by fees');
  assert(res1.receiptSummary.principal === 0, 'Does not allocate principal when exhausted by fees');
  assert(res1.unallocatedAmount === 0, 'Unallocated amount is zero');

  // --- TEST 2: Partial Payment Allocation ---
  console.log('\n--- Suite 2: Partial Payment against Single Instalment ---');
  const loan2 = createMockLoan();
  loan2.charges = []; // No pending charges
  loan2.feeOutstanding = 0;
  loan2.penaltyOutstanding = 0;

  const firstInstalment = loan2.schedules![0];
  const halfEmi = roundMoney(firstInstalment.instalmentAmount / 2);

  const payment2: PaymentRecord = {
    id: 'pay_test_02',
    paymentNumber: 'PAY-2026-000002',
    loanId: loan2.id,
    accountNumber: loan2.accountNumber,
    customerId: loan2.customerId,
    customerName: loan2.customerName,
    amount: halfEmi,
    allocatedAmount: 0,
    unallocatedAmount: 0,
    paymentDate: '2026-10-05',
    valueDate: '2026-10-05',
    paymentMethod: 'BANK_TRANSFER',
    status: 'RECEIVED',
    receivedBy: 'usr_01',
    receivedByName: 'User 1',
    allocations: [],
    history: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const res2 = executePaymentAllocation({
    loan: loan2,
    payment: payment2,
    actorName: 'Tester',
    actorRole: 'Test Engineer',
  });

  const updatedSch1 = res2.updatedSchedules[0];
  assert(updatedSch1.status === 'PARTIALLY_PAID', 'Instalment status set to PARTIALLY_PAID');
  assert(updatedSch1.outstandingAmount > 0, 'Instalment has remaining outstanding dues');
  assert(
    updatedSch1.totalPaid === halfEmi,
    'Instalment total paid equals partial payment amount'
  );
  assert(
    res2.allocatedAmount + res2.unallocatedAmount === halfEmi,
    'Financial sum invariant satisfied'
  );

  // --- TEST 3: Multi-Instalment Cascade Allocation ---
  console.log('\n--- Suite 3: Multi-Instalment Cascade Allocation ---');
  const loan3 = createMockLoan();
  loan3.charges = [];
  loan3.feeOutstanding = 0;
  loan3.penaltyOutstanding = 0;

  const emi = loan3.schedules![0].instalmentAmount;
  const threeEmis = roundMoney(emi * 3);

  const payment3: PaymentRecord = {
    id: 'pay_test_03',
    paymentNumber: 'PAY-2026-000003',
    loanId: loan3.id,
    accountNumber: loan3.accountNumber,
    customerId: loan3.customerId,
    customerName: loan3.customerName,
    amount: threeEmis,
    allocatedAmount: 0,
    unallocatedAmount: 0,
    paymentDate: '2026-10-05',
    valueDate: '2026-10-05',
    paymentMethod: 'NACH_EMANDATE',
    status: 'RECEIVED',
    receivedBy: 'usr_01',
    receivedByName: 'User 1',
    allocations: [],
    history: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const res3 = executePaymentAllocation({
    loan: loan3,
    payment: payment3,
    actorName: 'Tester',
    actorRole: 'Test Engineer',
  });

  assert(res3.updatedSchedules[0].status === 'PAID', 'Instalment #1 is PAID');
  assert(res3.updatedSchedules[1].status === 'PAID', 'Instalment #2 is PAID');
  assert(res3.updatedSchedules[2].status === 'PAID', 'Instalment #3 is PAID');
  assert(res3.updatedSchedules[3].status === 'FUTURE', 'Instalment #4 remains FUTURE');
  assert(res3.allocatedAmount === threeEmis, 'All 3 EMIs fully allocated across schedule');

  // --- TEST 4: Overpayment & Suspense Unallocated Handling ---
  console.log('\n--- Suite 4: Overpayment & Suspense Handling ---');
  const loan4 = createMockLoan();
  loan4.charges = [];
  loan4.feeOutstanding = 0;
  loan4.penaltyOutstanding = 0;
  loan4.totalOutstanding = roundMoney(300000 + loan4.interestOutstanding);

  const massivePayment = roundMoney(loan4.totalOutstanding + 50000); // 50k excess
  const payment4: PaymentRecord = {
    id: 'pay_test_04',
    paymentNumber: 'PAY-2026-000004',
    loanId: loan4.id,
    accountNumber: loan4.accountNumber,
    customerId: loan4.customerId,
    customerName: loan4.customerName,
    amount: massivePayment,
    allocatedAmount: 0,
    unallocatedAmount: 0,
    paymentDate: '2026-10-05',
    valueDate: '2026-10-05',
    paymentMethod: 'CHEQUE',
    status: 'RECEIVED',
    receivedBy: 'usr_01',
    receivedByName: 'User 1',
    allocations: [],
    history: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const res4 = executePaymentAllocation({
    loan: loan4,
    payment: payment4,
    actorName: 'Tester',
    actorRole: 'Test Engineer',
  });

  assert(res4.unallocatedAmount === 50000, 'Excess ₹50,000 routed into Suspense unallocated account');
  assert(res4.unallocatedRecord !== undefined, 'Unallocated record created with traceable attributes');
  assert(res4.updatedLoan.principalOutstanding === 0, 'Principal outstanding reduced to exactly ₹0 (no negative balance)');
  assert(
    res4.allocatedAmount + res4.unallocatedAmount === massivePayment,
    'Payment total equals allocated + suspense amount'
  );

  // --- TEST 5: Compensating Reversal & Restoration ---
  console.log('\n--- Suite 5: Compensating Payment Reversal ---');
  const loan5 = createMockLoan();
  const payment5: PaymentRecord = {
    id: 'pay_test_05',
    paymentNumber: 'PAY-2026-000005',
    loanId: loan5.id,
    accountNumber: loan5.accountNumber,
    customerId: loan5.customerId,
    customerName: loan5.customerName,
    amount: loan5.schedules![0].instalmentAmount,
    allocatedAmount: 0,
    unallocatedAmount: 0,
    paymentDate: '2026-10-05',
    valueDate: '2026-10-05',
    paymentMethod: 'UPI',
    status: 'RECEIVED',
    receivedBy: 'usr_01',
    receivedByName: 'User 1',
    allocations: [],
    history: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Post first
  const postRes5 = executePaymentAllocation({
    loan: loan5,
    payment: payment5,
    actorName: 'Tester',
    actorRole: 'Test Engineer',
  });

  payment5.status = 'POSTED';
  payment5.allocatedAmount = postRes5.allocatedAmount;
  payment5.allocations = postRes5.allocations;
  Object.assign(loan5, postRes5.updatedLoan);
  loan5.schedules = postRes5.updatedSchedules;
  loan5.charges = postRes5.updatedCharges;

  // Now reverse
  const revRes5 = executePaymentReversal({
    payment: payment5,
    loan: loan5,
    reason: 'Bank UTR returned as fraudulent counter chargeback.',
    actorName: 'Supervisor',
    actorRole: 'Branch Manager',
  });

  assert(revRes5.reversalRecord.reversalNumber.startsWith('REV-'), 'Reversal record generated with REV- ref');
  assert(revRes5.compensatingTransaction.transactionType === 'REVERSAL', 'Compensating transaction type is REVERSAL');
  assert(revRes5.updatedLoan.principalOutstanding === 300000, 'Original principal balance restored');
  assert(revRes5.updatedSchedules[0].status === 'DUE', 'Schedule instalment status restored to DUE');
  assert(revRes5.updatedCharges[0].status === 'PENDING', 'Pending charge status restored');

  // Double reversal check
  let doubleReversalThrew = false;
  try {
    payment5.status = 'REVERSED';
    executePaymentReversal({
      payment: payment5,
      loan: loan5,
      reason: 'Second reversal attempt',
      actorName: 'Supervisor',
      actorRole: 'Branch Manager',
    });
  } catch (err: any) {
    doubleReversalThrew = true;
  }
  assert(doubleReversalThrew, 'Prevents double reversal of already reversed payment');

  // --- SUMMARY ---
  console.log('\n================================================================');
  console.log(`🏁 TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
