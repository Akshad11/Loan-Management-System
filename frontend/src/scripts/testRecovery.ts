import { mockLMSStore } from '../services/mockService';
import {
  evaluateRecoveryEligibility,
  calculateRecoveryPriority,
  evaluateAutoCure,
  generateStatutoryNoticeText,
} from '../services/recoveryEngine';
import { LoanAccountRecord } from '../types/loanAccountTypes';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    failedTests++;
  }
}

async function runRecoveryTests() {
  console.log('\n===============================================================');
  console.log('🧪 BATCH 13 — RECOVERY, ESCALATION & LEGAL COLLECTIONS TEST SUITE');
  console.log('===============================================================\n');

  // Test 1: Eligibility Evaluation for NPA Loan (DPD >= 90)
  console.log('--- TEST 1: Recovery Eligibility Engine ---');
  const npaLoan: Partial<LoanAccountRecord> = {
    id: 'test_loan_npa',
    accountNumber: 'LN-2026-NPA01',
    customerName: 'Delinquent Borrower 1',
    dpd: 95,
    dpdBucket: '90+ DPD',
    overdueAmount: 85000,
    totalOutstanding: 450000,
    status: 'OVERDUE',
  };
  const npaEligibility = evaluateRecoveryEligibility(npaLoan as LoanAccountRecord, 3, 2);
  assert(npaEligibility.isEligible === true, 'NPA loan with 95 DPD must be marked eligible for recovery');
  assert(npaEligibility.priority === 'CRITICAL', '90+ DPD loan must receive CRITICAL recovery priority');
  assert(npaEligibility.recommendedStage === 'PRE_LEGAL' || npaEligibility.recommendedStage === 'HARD_RECOVERY' || npaEligibility.recommendedStage === 'LEGAL_ACTION', 'NPA loan recommended for Pre-Legal or Hard Recovery');

  // Test 2: Ineligible Regular Performing Loan (DPD = 0)
  const currentLoan: Partial<LoanAccountRecord> = {
    id: 'test_loan_current',
    accountNumber: 'LN-2026-CURR01',
    customerName: 'Performing Borrower',
    dpd: 0,
    dpdBucket: 'CURRENT',
    overdueAmount: 0,
    totalOutstanding: 300000,
    status: 'ACTIVE',
  };
  const currEligibility = evaluateRecoveryEligibility(currentLoan as LoanAccountRecord, 0, 0);
  assert(currEligibility.isEligible === false, 'Current loan (0 DPD) must be ineligible for recovery escalation');
  assert(currEligibility.blockers.length > 0, 'Ineligible loan must have explicit blocker descriptions');

  // Test 3: Priority Calculation Function
  console.log('\n--- TEST 2: Deterministic Priority Matrix ---');
  const prioCritical = calculateRecoveryPriority(120, 150000);
  const prioHigh = calculateRecoveryPriority(75, 40000);
  const prioMed = calculateRecoveryPriority(45, 15000);
  const prioLow = calculateRecoveryPriority(15, 2000);
  assert(prioCritical === 'CRITICAL', '120 DPD & ₹1.5L overdue yields CRITICAL priority');
  assert(prioHigh === 'HIGH', '75 DPD yields HIGH priority');
  assert(prioMed === 'MEDIUM', '45 DPD yields MEDIUM priority');
  assert(prioLow === 'LOW', '15 DPD yields LOW priority');

  // Test 4: Statutory Legal Notice Template Generator
  console.log('\n--- TEST 3: Statutory Legal Notice Drafting ---');
  const statutoryNotice = generateStatutoryNoticeText({
    noticeType: 'SECTION_138_CHEQUE_BOUNCE',
    customerName: 'Suresh Patil',
    customerAddress: 'Flat 401, Alfran Plaza, Panaji, Goa',
    accountNumber: 'LN-2026-000918',
    disbursementDate: '2026-06-01',
    originalPrincipal: 600000,
    overdueAmount: 94500,
    principalOutstanding: 540000,
    interestOutstanding: 22000,
    feeOutstanding: 4500,
    penaltyOutstanding: 3500,
    totalOutstanding: 570000,
    curePeriodDays: 15,
    noticeDate: '2026-08-20',
    dueDate: '2026-09-04',
    customClauses: 'Cheque No. 492019 drawn on SBI returned unpaid for Insufficient Funds.',
  });
  assert(statutoryNotice.includes('SECTION 138 OF THE NEGOTIABLE INSTRUMENTS ACT'), 'Notice text must cite Section 138 NI Act');
  assert(statutoryNotice.includes('LN-2026-000918'), 'Notice text must embed loan account number');
  assert(statutoryNotice.toUpperCase().includes('15') && statutoryNotice.toUpperCase().includes('DAYS'), 'Notice text must state statutory cure period in days');
  assert(statutoryNotice.includes('Suresh Patil'), 'Notice text must specify recipient borrower');

  // Test 5: Controlled Recovery Escalation via Store
  console.log('\n--- TEST 4: Store Escalation Workflow ---');
  const targetLoan = mockLMSStore.getState().loanAccounts.find((l) => l.id === 'loan_003' || l.dpd >= 60) || mockLMSStore.getState().loanAccounts[0];
  const initialCaseCount = mockLMSStore.getRecoveryCases().length;

  let newCase;
  try {
    newCase = mockLMSStore.escalateToRecovery(
      {
        loanId: targetLoan.id,
        targetStage: 'HARD_RECOVERY',
        reason: 'Repeated non-payment and broken telephonic PTPs',
        assignedOfficerName: 'Rajesh Naik',
        assignedTeam: 'Field Recovery Team 1',
        priority: 'CRITICAL',
      },
      'Vikram Mehta',
      'Head of Credit & Remedial'
    );
  } catch (err: any) {
    // If already escalated, fetch it
    newCase = mockLMSStore.getRecoveryByLoanId(targetLoan.id);
  }

  assert(newCase !== undefined, 'Recovery case created successfully on delinquent loan');
  assert(Boolean(newCase?.recoveryCaseNumber.startsWith('RC-')), 'Recovery case assigned canonical RC-YYYY-NNNNNN format');
  assert(newCase?.status === 'OPEN' || newCase?.status === 'ASSIGNED' || newCase?.status === 'IN_PROGRESS', 'Case starts in active operational status');
  assert(Boolean(newCase?.escalations && newCase.escalations.length > 0), 'Escalation history log entry created');

  // Test 6: Idempotency Prevention (Cannot create duplicate active recovery case on same loan)
  console.log('\n--- TEST 5: Idempotency & Duplicate Guard ---');
  let duplicateThrew = false;
  try {
    mockLMSStore.escalateToRecovery(
      {
        loanId: targetLoan.id,
        targetStage: 'EARLY_RECOVERY',
        reason: 'Attempt duplicate escalation',
      },
      'Collection Officer',
      'Collection Officer'
    );
  } catch (err: any) {
    duplicateThrew = true;
  }
  assert(duplicateThrew === true, 'Prevent duplicate active recovery cases for the same loan');

  // Test 7: Log Recovery Field Action
  console.log('\n--- TEST 6: Activity Logging & PTP Commitments ---');
  if (newCase) {
    const action = mockLMSStore.logRecoveryAction(
      {
        recoveryCaseId: newCase.id,
        actionType: 'FIELD_VISIT',
        actionDate: '2026-08-25',
        outcome: 'PTP_OBTAINED',
        outcomeNotes: 'Met borrower at shop premises. Promised to pay ₹35,000 via RTGS by end of week.',
        promisedAmount: 35000,
        promisedDate: '2026-08-30',
        location: 'Panaji Market',
      },
      'Rajesh Naik',
      'Senior Recovery Officer'
    );
    assert(action.actionType === 'FIELD_VISIT', 'Field visit action logged');
    assert(action.promisedAmount === 35000, 'PTP amount ₹35,000 captured');
    assert(Boolean(newCase.actions && newCase.actions.length > 0), 'Recovery case action timeline updated');
    assert(newCase.status === 'IN_PROGRESS', 'Case status transitioned to IN_PROGRESS upon action');
  }

  // Test 8: Legal Review Request & Maker-Checker Segregation
  console.log('\n--- TEST 7: Legal Review Request & Maker-Checker ---');
  if (newCase) {
    const legalReview = mockLMSStore.requestLegalReview(
      {
        recoveryCaseId: newCase.id,
        reason: 'Broken commitments and repeated defaults. Legal notice recommended.',
        recommendedAction: 'Issue 138 Notice and file summary civil suit',
      },
      'Rajesh Naik',
      'Senior Recovery Officer'
    );
    assert(legalReview.reviewNumber.startsWith('LRV-'), 'Legal review assigned LRV-YYYY-NNNNNN reference');
    assert(legalReview.status === 'PENDING_REVIEW', 'Legal review placed in PENDING_REVIEW status');

    // Segregation of Duties: Rajesh Naik cannot approve his own review
    let checkerThrew = false;
    try {
      mockLMSStore.approveLegalReview(legalReview.id, true, 'Approved by requester (illegal)', 'Rajesh Naik', 'Senior Recovery Officer');
    } catch (err: any) {
      checkerThrew = true;
    }
    assert(checkerThrew === true, 'Maker-checker blocks requester from self-approving legal review');

    // Checker approval by distinct authorized official
    const approvedReview = mockLMSStore.approveLegalReview(
      legalReview.id,
      true,
      'Approved for filing Section 138 complaint.',
      'Vikram Mehta',
      'Head of Credit & Remedial'
    );
    assert(approvedReview.status === 'APPROVED_FOR_LEGAL', 'Authorized checker successfully approved legal review');
    assert(newCase.recoveryStage === 'LEGAL_ACTION', 'Case stage escalated to LEGAL_ACTION');
  }

  // Test 9: Legal Notice Generation & Maker-Checker
  console.log('\n--- TEST 8: Legal Notice Drafting & Approval ---');
  if (newCase) {
    const notice = mockLMSStore.createLegalNotice(
      {
        recoveryCaseId: newCase.id,
        noticeType: 'SECTION_138_CHEQUE_BOUNCE',
        curePeriodDays: 15,
        recipientName: newCase.customerName,
        recipientAddress: 'Panaji, Goa',
      },
      'Sanjay Deshmukh'
    );
    assert(notice.noticeNumber.startsWith('NOT-'), 'Legal notice assigned NOT-YYYY-NNNNNN reference');
    assert(notice.status === 'DRAFT', 'Notice initialized in DRAFT status');

    // Segregation of duties: preparer cannot approve
    let noticeCheckerThrew = false;
    try {
      mockLMSStore.approveLegalNotice(notice.id, 'Sanjay Deshmukh');
    } catch (err: any) {
      noticeCheckerThrew = true;
    }
    assert(noticeCheckerThrew === true, 'Maker-checker blocks drafter from self-approving statutory notice');

    // Valid checker approval
    const approvedNotice = mockLMSStore.approveLegalNotice(notice.id, 'Vikram Mehta');
    assert(approvedNotice.status === 'APPROVED', 'Notice approved by checker');

    // Dispatch notice
    const dispatchedNotice = mockLMSStore.dispatchLegalNotice(notice.id, 'ED998811223IN', 'REGISTERED_POST_AD', 'Sanjay Deshmukh');
    assert(dispatchedNotice.status === 'DISPATCHED', 'Notice transitioned to DISPATCHED');
    assert(dispatchedNotice.trackingNumber === 'ED998811223IN', 'Postal tracking number stored');
  }

  // Test 10: Legal Court Case Creation & Hearing Events
  console.log('\n--- TEST 9: Court Case & Hearing Proceedings ---');
  if (newCase) {
    const legalCase = mockLMSStore.createLegalCase(
      {
        recoveryCaseId: newCase.id,
        caseType: 'DEMAND_NOTICE_138',
        jurisdiction: 'Panaji District Court',
        courtOrForum: 'Court of JMFC Panaji',
        courtCaseNumber: 'CC/2026/891',
        filingDate: '2026-08-28',
        nextHearingDate: '2026-09-20',
        advocateName: 'Adv. Rohan Verlekar',
        claimAmount: newCase.totalOutstanding,
      },
      'Sanjay Deshmukh',
      'Legal Officer'
    );
    assert(legalCase.legalCaseNumber.startsWith('LC-'), 'Legal court case assigned LC-YYYY-NNNNNN reference');
    assert(legalCase.status === 'FILED_IN_COURT', 'Legal case status marked FILED_IN_COURT');

    // Add court hearing event
    const event = mockLMSStore.addLegalCaseEvent(
      legalCase.id,
      'HEARING_HELD',
      'Accused appeared. Verification done. Next date for evidence.',
      'Order Sheet P. 4',
      '2026-10-15',
      'Sanjay Deshmukh',
      'Legal Officer'
    );
    assert(event.eventType === 'HEARING_HELD', 'Court hearing event logged');
    assert(legalCase.nextHearingDate === '2026-10-15', 'Legal case next hearing date updated');
  }

  // Test 11: Real-Time Auto-Cure Evaluation
  console.log('\n--- TEST 10: Auto-Cure Trigger on Delinquency Settlement ---');
  const curedLoan: Partial<LoanAccountRecord> = {
    id: 'test_loan_cured',
    accountNumber: 'LN-2026-CURED01',
    customerName: 'Cured Borrower',
    dpd: 0,
    dpdBucket: 'CURRENT',
    overdueAmount: 0,
    totalOutstanding: 250000,
    status: 'ACTIVE',
  };
  const activeCaseForCure = {
    ...newCase,
    id: 'rc_cure_test',
    status: 'IN_PROGRESS' as any,
    recoveryStage: 'HARD_RECOVERY' as any,
    overdueAmount: 50000,
  };
  const cureResult = evaluateAutoCure(activeCaseForCure as any, curedLoan as LoanAccountRecord);
  assert(cureResult.isCured === true, 'Recovery case automatically cured when loan overdue balance reaches zero');
  assert(cureResult.newStatus === 'CURED', 'Status changed to CURED');
  assert(cureResult.newStage === 'RESOLVED', 'Stage changed to RESOLVED');

  // Test 12: Recovery KPIs
  console.log('\n--- TEST 11: Recovery KPIs Aggregation ---');
  const kpis = mockLMSStore.getRecoveryKPIs();
  assert(typeof kpis.openCasesCount === 'number', 'KPI openCasesCount is numeric');
  assert(typeof kpis.totalRecoveryExposure === 'number', 'KPI totalRecoveryExposure is numeric');
  assert(typeof kpis.recoveryRatePercent === 'number', 'KPI recoveryRatePercent is calculated');

  console.log('\n===============================================================');
  console.log(`🏁 TEST EXECUTION COMPLETE: ${passedTests} Passed | ${failedTests} Failed`);
  console.log('===============================================================\n');

  if (failedTests > 0) {
    throw new Error(`${failedTests} tests failed.`);
  }
}

runRecoveryTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
