// Batch 16 — Settlement, Foreclosure, Loan Closure & NOC Automated Verification Tests
import {
  calculateForeclosureQuote,
  calculateSettlementConcession,
  validateClosureEligibility,
  validateFinancialReconciliation,
  validateClosureMakerChecker,
} from '../services/closureEngine';
import { LoanAccountRecord } from '../types/loanAccountTypes';
import { LoanClosureRequestRecord } from '../types/closureTypes';

function runTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 BATCH 16: SETTLEMENT, FORECLOSURE, CLOSURE & NOC TEST SUITE');
  console.log('======================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, message: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ PASSED: ${message}`);
      passedTests++;
    } else {
      console.error(`❌ FAILED: ${message}`);
      process.exit(1);
    }
  }

  // Sample active loan for testing
  const mockActiveLoan: LoanAccountRecord = {
    id: 'ln_test_001',
    accountNumber: 'LN-2026-000999',
    customerId: 'cust_001',
    customerNumber: 'CUST-001',
    customerName: 'Aarav Patel',
    productCode: 'BL-UNSEC',
    productName: 'Unsecured Business Loan',
    branchId: 'br_panjim',
    branchName: 'Panjim Main Branch',
    assignedOfficer: 'Sarah Jenkins',
    assignedOfficerId: 'usr_credit_01',
    originalPrincipal: 300000,
    disbursedPrincipal: 300000,
    principalOutstanding: 300000,
    outstandingPrincipal: 300000,
    interestOutstanding: 8500,
    feeOutstanding: 2000,
    penaltyOutstanding: 1500,
    totalOutstanding: 312000,
    totalPaidAmount: 45000,
    totalPrincipalPaid: 35000,
    totalInterestPaid: 10000,
    totalFeesPaid: 0,
    overdueAmount: 12000,
    dpd: 15,
    dpdBucket: '1-30 DPD',
    status: 'ACTIVE',
    interestRate: 14.0,
    interestMethod: 'REDUCING_BALANCE',
    repaymentFrequency: 'MONTHLY',
    tenureMonths: 24,
    remainingTenureMonths: 18,
    totalInstalments: 24,
    remainingInstalments: 18,
    emiAmount: 14400,
    disbursementDate: '2026-01-10',
    loanStartDate: '2026-01-10',
    firstDueDate: '2026-02-10',
    maturityDate: '2028-01-10',
    nextDueDate: '2026-09-10',
    repaymentSettings: {
      id: 'rep_01',
      loanId: 'ln_test_001',
      repaymentFrequency: 'MONTHLY',
      paymentMethod: 'NACH_EMANDATE',
      mandateStatus: 'ACTIVE',
      preferredDebitDate: 10,
      gracePeriodDays: 3,
      updatedAt: '2026-01-10',
      updatedBy: 'usr_ops_01',
    },
    currentScheduleVersion: 1,
    createdAt: '2026-01-10',
    createdBy: 'usr_ops_01',
    updatedAt: '2026-09-01',
  };

  // --- Test 1: Foreclosure Quote Calculation with 2% Prepayment Fee and 18% GST ---
  console.log('--- Test 1: Foreclosure Payoff Calculation ---');
  const fcQuote = calculateForeclosureQuote({
    loan: mockActiveLoan,
    calculationDate: '2026-09-01',
    foreclosureFeeRate: 2.0, // 2% on 300,000 = 6,000
    taxPercentage: 18.0, // 18% on 6,000 = 1,080
  });

  assert(fcQuote.principalOutstanding === 300000, `Principal balance equals 300,000 (Got: ${fcQuote.principalOutstanding})`);
  assert(fcQuote.foreclosureFeeAmount === 6000, `Foreclosure fee is 2% of 300,000 = 6,000 (Got: ${fcQuote.foreclosureFeeAmount})`);
  assert(fcQuote.foreclosureFeeTax === 1080, `GST Tax on fee is 18% of 6,000 = 1,080 (Got: ${fcQuote.foreclosureFeeTax})`);
  assert(fcQuote.totalForeclosureCharge === 7080, `Total foreclosure charge is 7,080 (Got: ${fcQuote.totalForeclosureCharge})`);
  assert(
    fcQuote.netPayableAmount === 300000 + fcQuote.accruedInterest + 2000 + 1500 + 7080,
    `Net payable amount correctly aggregates principal + interest + charges (Got: ${fcQuote.netPayableAmount})`
  );

  // --- Test 2: Settlement Concession & Distribution ---
  console.log('\n--- Test 2: Settlement Concession Calculation ---');
  // Total exposure: 300,000 (P) + 8,500 (I) + 2,000 (F) + 1,500 (Pen) = 312,000
  // Proposed settlement amount: 250,000 -> Concession: 62,000
  const settlementConcession = calculateSettlementConcession({
    loan: mockActiveLoan,
    proposedSettlementAmount: 250000,
    paymentDeadline: '2026-09-15',
  });

  assert(settlementConcession.totalExposure === 312000, `Total exposure equals 312,000 (Got: ${settlementConcession.totalExposure})`);
  assert(settlementConcession.concessionAmount === 62000, `Concession amount is 62,000 (Got: ${settlementConcession.concessionAmount})`);
  assert(settlementConcession.concessionPercentage === 19.87, `Concession percentage is 19.87% (Got: ${settlementConcession.concessionPercentage})`);
  assert(settlementConcession.feePenaltyConcession === 3500, `Fees & penalties absorbed first = 3,500 (Got: ${settlementConcession.feePenaltyConcession})`);
  assert(settlementConcession.interestConcession === 8500, `Interest absorbed second = 8,500 (Got: ${settlementConcession.interestConcession})`);
  assert(settlementConcession.principalConcession === 50000, `Remaining concession applied to principal = 50,000 (Got: ${settlementConcession.principalConcession})`);

  // --- Test 3: Maker-Checker Segregation of Duties ---
  console.log('\n--- Test 3: Maker-Checker Validation ---');
  const mockClosureRequest: LoanClosureRequestRecord = {
    id: 'clr_test_01',
    requestNumber: 'CLR-2026-000999',
    loanId: 'ln_test_001',
    customerId: 'cust_001',
    accountNumber: 'LN-2026-000999',
    customerName: 'Aarav Patel',
    closureType: 'SETTLEMENT',
    status: 'SUBMITTED',
    calculationDate: '2026-09-01',
    effectiveDate: '2026-09-15',
    requestedBy: 'usr_ops_01',
    requestedByName: 'Alex Morgan',
    requestedByRole: 'Operations Officer',
    requestedAt: '2026-09-01T10:00:00Z',
    reason: 'Hardship settlement proposal.',
    principalOutstanding: 300000,
    interestOutstanding: 8500,
    feeOutstanding: 2000,
    penaltyOutstanding: 1500,
    totalExposure: 312000,
    foreclosureChargeAmount: 0,
    foreclosureChargeTax: 0,
    waiverAmount: 0,
    concessionAmount: 62000,
    finalPayableAmount: 250000,
    paidAmount: 0,
    createdAt: '2026-09-01',
    updatedAt: '2026-09-01',
  };

  const selfApproval = validateClosureMakerChecker(mockClosureRequest, {
    id: 'usr_ops_01',
    name: 'Alex Morgan',
    roleName: 'Operations Officer',
  });
  assert(!selfApproval.allowed, 'Requester self-approval is strictly blocked by maker-checker.');

  const checkerApproval = validateClosureMakerChecker(mockClosureRequest, {
    id: 'usr_mgr_01',
    name: 'Sunita Rao',
    roleName: 'Branch Credit Committee Head',
  });
  assert(checkerApproval.allowed, 'Independent committee approval is permitted.');

  // --- Test 4: Financial Reconciliation and Shortfall Detection ---
  console.log('\n--- Test 4: Financial Reconciliation Check ---');
  const fullReconciliation = validateFinancialReconciliation({
    loan: mockActiveLoan,
    request: mockClosureRequest,
    receivedPaymentAmount: 250000,
  });
  assert(fullReconciliation.reconciled, 'Full payment of 250,000 matches payable and is reconciled.');

  const shortFallReconciliation = validateFinancialReconciliation({
    loan: mockActiveLoan,
    request: mockClosureRequest,
    receivedPaymentAmount: 200000, // Shortfall of 50,000
  });
  assert(!shortFallReconciliation.reconciled, 'Partial payment of 200,000 fails reconciliation and prevents closure.');
  assert(shortFallReconciliation.shortFallAmount === 50000, `Shortfall amount is accurately calculated as 50,000 (Got: ${shortFallReconciliation.shortFallAmount})`);

  // --- Test 5: Eligibility Validation ---
  console.log('\n--- Test 5: Closure Eligibility ---');
  const activeEligibility = validateClosureEligibility(mockActiveLoan, 'FORECLOSURE');
  assert(activeEligibility.eligible, 'Active loan is eligible for foreclosure quote.');

  const closedLoan: LoanAccountRecord = { ...mockActiveLoan, status: 'CLOSED', totalOutstanding: 0 };
  const closedEligibility = validateClosureEligibility(closedLoan, 'FORECLOSURE');
  assert(!closedEligibility.eligible, 'Already closed loan is not eligible for new closure requests.');

  console.log('\n======================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} BATCH 16 VERIFICATION TESTS PASSED`);
  console.log('======================================================\n');
}

runTestSuite();
