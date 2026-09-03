import { mockLMSStore } from '../services/mockService';
import {
  calculateInstalmentAmount,
  calculateTotalInstalments,
  generateRepaymentSchedule,
  roundMoney,
} from '../services/loanFinancialService';

export function runLoanAccountInvariantTests() {
  console.log('================================================================');
  console.log('RUNNING BATCH 10 LOAN ACCOUNT & REPAYMENT SETUP INVARIANT TESTS');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // TEST 1: Initial Seed Loan Accounts & Integrity
  const loans = mockLMSStore.getLoanAccounts();
  assert(loans.length >= 2, 'Seed loan accounts loaded', `Found ${loans.length} loans`);

  const loan1 = mockLMSStore.getLoanAccountById('ln_001');
  assert(!!loan1, 'Found initial Loan LN-2026-000921');
  if (loan1) {
    assert(
      loan1.originalPrincipal === 450000,
      'Original Principal matches Sanction Limit',
      `Got ${loan1.originalPrincipal}`
    );
    assert(
      loan1.principalOutstanding === 450000,
      'Principal Outstanding matches Disbursed Balance',
      `Got ${loan1.principalOutstanding}`
    );
    assert(loan1.status === 'ACTIVE', 'Loan status is ACTIVE');
    assert(
      Boolean(loan1.scheduleVersions && loan1.scheduleVersions.length >= 1),
      'Repayment Schedule Version 1 exists',
      `Version count: ${loan1.scheduleVersions?.length}`
    );
  }

  // TEST 2: Deterministic Reducing Balance EMI Calculation
  // Principal = 450,000, Rate = 14.5% p.a., Tenure = 36 months, Monthly
  // Formula: P * r * (1+r)^n / ((1+r)^n - 1)
  // r = 0.145 / 12 = 0.012083333...
  // Expected EMI: 15489.44
  const emi1 = calculateInstalmentAmount({
    principal: 450000,
    annualRate: 14.5,
    tenureMonths: 36,
    frequency: 'MONTHLY',
    interestMethod: 'REDUCING_BALANCE',
  });
  assert(
    Math.abs(emi1 - 15489.44) < 0.5,
    'Deterministic Reducing Balance EMI matches financial benchmark',
    `Calculated EMI: ₹${emi1}, Expected ~₹15,489.44`
  );

  // TEST 3: Flat Rate Interest Calculation
  // Principal = 100,000, Rate = 12% p.a., Tenure = 12 months -> Total Interest = 12,000 -> Total = 112,000 -> EMI = 9333.33
  const emiFlat = calculateInstalmentAmount({
    principal: 100000,
    annualRate: 12.0,
    tenureMonths: 12,
    frequency: 'MONTHLY',
    interestMethod: 'FLAT_RATE',
  });
  assert(
    emiFlat === 9333.33,
    'Flat Rate EMI is deterministic and exact',
    `Calculated Flat EMI: ₹${emiFlat}, Expected ₹9,333.33`
  );

  // TEST 4: 0% Interest Rate & Low Rate Edge Cases
  const emiZero = calculateInstalmentAmount({
    principal: 120000,
    annualRate: 0,
    tenureMonths: 12,
    frequency: 'MONTHLY',
    interestMethod: 'REDUCING_BALANCE',
  });
  assert(
    emiZero === 10000,
    '0% Interest Rate safely handled without division-by-zero',
    `Calculated: ₹${emiZero}, Expected ₹10,000`
  );

  // TEST 5: Exact Principal Reconciliation & Rounding Invariant
  // Generate schedule for 500,000 over 36 months @ 13.75%
  const scheduleGen = generateRepaymentSchedule({
    loanId: 'test_ln_rec',
    versionNumber: 1,
    reason: 'Reconciliation Test',
    principal: 500000,
    annualRate: 13.75,
    tenureMonths: 36,
    frequency: 'MONTHLY',
    interestMethod: 'REDUCING_BALANCE',
    startDate: '2026-08-01',
    firstDueDate: '2026-09-05',
    createdBy: 'Test Suite',
  });

  const sumPrincipalDue = roundMoney(
    scheduleGen.schedules.reduce((sum, item) => sum + item.principalDue, 0)
  );
  assert(
    sumPrincipalDue === 500000,
    'Critical Invariant: Sum(Scheduled Principal Due) === Scheduled Principal (Zero Drift)',
    `Sum: ₹${sumPrincipalDue}, Target: ₹500,000`
  );
  assert(
    scheduleGen.schedules.length === 36,
    'Instalment count matches tenure exactly',
    `Count: ${scheduleGen.schedules.length}`
  );
  assert(
    scheduleGen.schedules[scheduleGen.schedules.length - 1].closingPrincipal === 0,
    'Final instalment closing principal is exactly ₹0',
    `Closing: ${scheduleGen.schedules[scheduleGen.schedules.length - 1].closingPrincipal}`
  );

  // TEST 6: Repayment Frequency Factors (Bi-Weekly, Weekly, Quarterly)
  const biWeeklyInstalments = calculateTotalInstalments(12, 'BI_WEEKLY');
  assert(
    biWeeklyInstalments === 26,
    'Bi-Weekly frequency generates 26 instalments for 12 months',
    `Got ${biWeeklyInstalments}`
  );
  const quarterlyInstalments = calculateTotalInstalments(12, 'QUARTERLY');
  assert(
    quarterlyInstalments === 4,
    'Quarterly frequency generates 4 instalments for 12 months',
    `Got ${quarterlyInstalments}`
  );

  // TEST 7: Idempotent Loan Account Creation On Disbursement Execution
  // Disbursement DSB-2026-000101 has sanction SN-2026-000245
  const dsb = mockLMSStore.getDisbursementById('dsb_001');
  assert(!!dsb, 'Found test disbursement dsb_001');

  if (dsb) {
    const loanBeforeCount = mockLMSStore.getLoanAccounts().length;
    // Payout request
    const existingLoan = mockLMSStore.getLoanAccountBySanctionId(dsb.sanctionId);
    assert(!!existingLoan, 'Found existing loan account for dsb_001 sanction');

    // Executing disbursement again updates existing loan without duplicating account
    const dsbReq = dsb.requests[0] || { id: 'req_test', requestedAmount: 50000, disbursementType: 'TRANCHE_2' };
    if (existingLoan) {
      const initialDisbursed = existingLoan.disbursedPrincipal;
      mockLMSStore.processLoanAccountOnDisbursement(
        dsb,
        { ...dsbReq, requestedAmount: 50000 } as any,
        {
          id: 'txn_test_1',
          transactionReference: 'TXN-TEST-001',
          disbursementId: dsb.id,
          amount: 50000,
          paymentMethod: 'NEFT',
          status: 'SUCCESSFUL',
          beneficiaryName: 'Test Beneficiary',
          beneficiaryAccountNumberMasked: '•••• 1234',
          beneficiaryIfsc: 'HDFC0000120',
          bankName: 'HDFC Bank Ltd',
          utrNumber: 'UTR-TEST-001',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        'Test Operator',
        'Disbursement Authority'
      );

      const loanAfterCount = mockLMSStore.getLoanAccounts().length;
      assert(
        loanAfterCount === loanBeforeCount,
        'Idempotency Invariant: Subsequent disbursement does not create duplicate Loan Account',
        `Before: ${loanBeforeCount}, After: ${loanAfterCount}`
      );
      assert(
        existingLoan.disbursedPrincipal === initialDisbursed + 50000,
        'Tranche amount successfully increments disbursed principal balance',
        `New Disbursed: ₹${existingLoan.disbursedPrincipal}`
      );
    }
  }

  // TEST 8: Schedule Versioning & Immutability
  const loan2 = mockLMSStore.getLoanAccountById('ln_001');
  if (loan2) {
    const initialVersionCount = loan2.scheduleVersions?.length || 1;
    const newVersion = mockLMSStore.generateScheduleVersion(
      loan2.id,
      'Tenure extension of 6 months requested by borrower',
      { tenureMonths: 42, annualRate: 14.0 },
      'Test Risk Officer',
      'Risk Manager'
    );

    assert(
      newVersion.version === 2,
      'New schedule version successfully incremented to Version 2',
      `Version: ${newVersion.version}`
    );
    assert(
      loan2.currentScheduleVersion === 2,
      'Loan active currentScheduleVersion points to Version 2'
    );
    assert(
      loan2.scheduleVersions?.find((v) => v.version === 1)?.status === 'SUPERSEDED',
      'Previous Version 1 is marked SUPERSEDED and preserved immutably'
    );
    assert(
      newVersion.status === 'ACTIVE',
      'New Version 2 is marked ACTIVE'
    );
  }

  // TEST 9: Repayment Settings & Mandate Persistence
  if (loan1) {
    const updatedSettings = mockLMSStore.updateRepaymentSettings(
      loan1.id,
      { preferredDebitDate: 10, gracePeriodDays: 5, paymentMethod: 'UPI' },
      'Alex Morgan',
      'Loan Officer'
    );

    assert(
      updatedSettings.preferredDebitDate === 10,
      'Preferred debit date updated to 10th of month',
      `Got ${updatedSettings.preferredDebitDate}`
    );
    assert(
      updatedSettings.gracePeriodDays === 5,
      'Grace period updated to 5 days',
      `Got ${updatedSettings.gracePeriodDays}`
    );
    assert(
      updatedSettings.paymentMethod === 'UPI',
      'Payment channel updated to UPI',
      `Got ${updatedSettings.paymentMethod}`
    );
  }

  console.log('\n================================================================');
  console.log(`BATCH 10 INVARIANT TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  return { passed, failed };
}
