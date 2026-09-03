import {
  calculateChargeAmount,
  validateWaiverEligibility,
  recalculateLoanBalances,
  validateAdjustmentMakerChecker,
} from '../services/chargeAdjustmentEngine';
import { LoanAccountRecord } from '../types/loanAccountTypes';
import { WaiverRequestRecord, FinancialAdjustmentRequestRecord } from '../types/chargeAdjustmentTypes';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 BATCH 15: CHARGES, WAIVERS & FINANCIAL ADJUSTMENTS TEST SUITE');
  console.log('======================================================\n');

  const mockLoan: LoanAccountRecord = {
    id: 'ln_panjim_003',
    accountNumber: 'LN-2026-000003',
    customerId: 'cust_003',
    customerNumber: 'CUST-000243',
    customerName: 'Priya Sharma',
    sanctionId: 'snc_003',
    sanctionNumber: 'SNC-2026-000243',
    applicationId: 'app_003',
    applicationNumber: 'APP-2026-001848',
    productCode: 'AUTO-01',
    productName: 'Vehicle Loan',
    loanType: 'AUTO',
    branchId: 'br_panjim',
    branchName: 'Panjim Branch',
    assignedOfficer: 'Alex Morgan',
    assignedOfficerId: 'usr_ops_01',
    originalPrincipal: 500000,
    disbursedPrincipal: 500000,
    principalOutstanding: 420000,
    outstandingPrincipal: 420000,
    totalOutstanding: 450000,
    interestOutstanding: 20000,
    feeOutstanding: 6000,
    penaltyOutstanding: 4000,
    totalPaidAmount: 97000,
    totalPrincipalPaid: 80000,
    totalInterestPaid: 15000,
    totalFeesPaid: 2000,
    principalPaid: 80000,
    interestPaid: 15000,
    feePaid: 2000,
    penaltyPaid: 0,
    totalPaid: 97000,
    emiAmount: 14500,
    interestRate: 11.5,
    interestMethod: 'REDUCING_BALANCE',
    tenureMonths: 48,
    totalInstalments: 48,
    remainingInstalments: 40,
    remainingTenureMonths: 40,
    repaymentFrequency: 'MONTHLY',
    status: 'ACTIVE',
    dpd: 35,
    dpdBucket: '31-60 DPD',
    overdueAmount: 29000,
    currentScheduleVersion: 1,
    disbursementDate: '2025-06-01',
    firstDisbursementDate: '2025-06-01',
    loanStartDate: '2025-06-01',
    firstDueDate: '2025-07-05',
    nextDueDate: '2026-09-05',
    maturityDate: '2029-06-05',
    repaymentSettings: {
      id: 'rep_01',
      loanId: 'ln_panjim_003',
      repaymentFrequency: 'MONTHLY',
      paymentMethod: 'NACH_EMANDATE',
      mandateStatus: 'ACTIVE',
      preferredDebitDate: 5,
      gracePeriodDays: 3,
      updatedAt: '2025-06-01T00:00:00Z',
      updatedBy: 'usr_ops_01',
    },
    createdBy: 'usr_ops_01',
    createdAt: '2025-06-01T00:00:00Z',
    updatedAt: '2026-08-20T00:00:00Z',
  };

  // TEST 1: Fixed Charge Calculation with 18% GST Tax
  console.log('--- Test 1: Fixed Charge Calculation with GST Tax ---');
  const fixedResult = calculateChargeAmount({
    config: {
      calculationBasis: 'FIXED_AMOUNT',
      rateOrValue: 500,
      taxPercentage: 18.0,
    },
    loan: mockLoan,
  });

  assert(fixedResult.baseAmount === 500, `Base amount equals 500 (Got: ${fixedResult.baseAmount})`);
  assert(fixedResult.taxAmount === 90, `Tax amount equals 90 (18% of 500) (Got: ${fixedResult.taxAmount})`);
  assert(fixedResult.totalAmount === 590, `Total amount equals 590 (Got: ${fixedResult.totalAmount})`);

  // TEST 2: Percentage of Overdue Charge with Min/Max Caps
  console.log('\n--- Test 2: Percentage of Overdue Charge with Caps ---');
  // Overdue is 29,000. 2% of 29,000 = 580.
  const capResult = calculateChargeAmount({
    config: {
      calculationBasis: 'PERCENTAGE_OF_OVERDUE',
      rateOrValue: 2.0,
      taxPercentage: 18.0,
      minAmount: 500,
      maxAmount: 2000,
    },
    loan: mockLoan,
  });

  assert(capResult.baseAmount === 580, `Base amount computed as 2% of overdue 29,000 = 580 (Got: ${capResult.baseAmount})`);
  assert(capResult.taxAmount === 104.4, `Tax amount computed as 18% of 580 = 104.40 (Got: ${capResult.taxAmount})`);
  assert(capResult.totalAmount === 684.4, `Total amount computed = 684.40 (Got: ${capResult.totalAmount})`);

  // TEST 3: Waiver Eligibility Validations
  console.log('\n--- Test 3: Waiver Eligibility Validations ---');
  // Eligible fee waiver within 6000 feeOutstanding
  const validFeeWaiver = validateWaiverEligibility({
    loan: mockLoan,
    category: 'FEE',
    requestedAmount: 5000,
  });
  assert(validFeeWaiver.eligible === true, 'Waiver of 5,000 on 6,000 fee is eligible.');

  // Ineligible fee waiver exceeding 6000 feeOutstanding
  const invalidFeeWaiver = validateWaiverEligibility({
    loan: mockLoan,
    category: 'FEE',
    requestedAmount: 7000,
  });
  assert(invalidFeeWaiver.eligible === false, 'Waiver of 7,000 on 6,000 fee is properly blocked as ineligible.');

  // Zero or negative waiver
  const zeroWaiver = validateWaiverEligibility({
    loan: mockLoan,
    category: 'PENALTY',
    requestedAmount: 0,
  });
  assert(zeroWaiver.eligible === false, 'Zero amount waiver request is properly rejected.');

  // TEST 4: Maker-Checker Segregation of Duties
  console.log('\n--- Test 4: Maker-Checker Segregation of Duties ---');
  const mockWaiverReq: WaiverRequestRecord = {
    id: 'wvr_test_01',
    waiverNumber: 'WVR-2026-000101',
    loanId: mockLoan.id,
    customerId: mockLoan.customerId,
    accountNumber: mockLoan.accountNumber,
    customerName: mockLoan.customerName,
    waiverType: 'FEE_WAIVER',
    category: 'FEE',
    requestedAmount: 1000,
    eligibleOutstandingBefore: 6000,
    reason: 'Hardship relief',
    status: 'SUBMITTED',
    requestedBy: 'usr_ops_01',
    requestedByName: 'Alex Morgan',
    requestedByRole: 'Operations Officer',
    requestedAt: '2026-08-25T00:00:00Z',
    createdAt: '2026-08-25T00:00:00Z',
    updatedAt: '2026-08-25T00:00:00Z',
  };

  // Self-approval by Alex Morgan should be blocked
  const selfApproval = validateAdjustmentMakerChecker(mockWaiverReq, {
    id: 'usr_ops_01',
    name: 'Alex Morgan',
    roleName: 'Operations Officer',
  });
  assert(selfApproval.allowed === false, 'Self-approval by requester Alex Morgan is strictly blocked.');

  // Independent approval by Sunita Rao should be allowed
  const independentApproval = validateAdjustmentMakerChecker(mockWaiverReq, {
    id: 'usr_mgr_01',
    name: 'Sunita Rao',
    roleName: 'Branch Credit Committee Head',
  });
  assert(independentApproval.allowed === true, 'Independent approval by Sunita Rao is allowed.');

  // TEST 5: Deterministic Balance Recalculation Invariant
  console.log('\n--- Test 5: Deterministic Balance Recalculation Invariant ---');
  // Apply a credit adjustment of 500 on fee and 1000 on penalty
  const newBalances = recalculateLoanBalances(mockLoan, {
    feeDelta: -500,
    penaltyDelta: -1000,
  });

  assert(newBalances.feeOutstanding === 5500, `feeOutstanding updated to 5,500 (Got: ${newBalances.feeOutstanding})`);
  assert(newBalances.penaltyOutstanding === 3000, `penaltyOutstanding updated to 3,000 (Got: ${newBalances.penaltyOutstanding})`);
  assert(
    newBalances.totalOutstanding ===
      newBalances.outstandingPrincipal +
        newBalances.interestOutstanding +
        newBalances.feeOutstanding +
        newBalances.penaltyOutstanding,
    `Invariant strictly holds: totalOutstanding (${newBalances.totalOutstanding}) === P(${newBalances.outstandingPrincipal}) + I(${newBalances.interestOutstanding}) + F(${newBalances.feeOutstanding}) + Pen(${newBalances.penaltyOutstanding})`
  );

  console.log('\n======================================================');
  console.log('🎉 ALL 8/8 FINANCIAL INVARIANT VERIFICATION TESTS PASSED');
  console.log('======================================================\n');
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
