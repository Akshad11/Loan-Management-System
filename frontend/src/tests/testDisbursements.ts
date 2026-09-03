import { mockLMSStore } from '../services/mockService';

function runDisbursementInvariantTests() {
  console.log('================================================================');
  console.log('RUNNING BATCH 9 DISBURSEMENT INVARIANT & WORKFLOW TESTS');
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

  // TEST 1: Initial Seed Disbursements & Correct Calculations
  const initialDsbs = mockLMSStore.getDisbursements();
  assert(initialDsbs.length >= 3, 'Seed disbursements loaded successfully', `Found ${initialDsbs.length}`);

  const dsb1 = initialDsbs.find((d) => d.sanctionNumber === 'SN-2026-000245');
  assert(!!dsb1, 'Found disbursement for SN-2026-000245');

  if (dsb1) {
    const expectedRemaining = dsb1.sanctionAmount - dsb1.totalDisbursedAmount;
    assert(
      dsb1.remainingAmount === expectedRemaining,
      'Financial Invariant: Remaining Amount == Sanction Amount - Total Disbursed',
      `Remaining: ${dsb1.remainingAmount}, Expected: ${expectedRemaining}`
    );
  }

  // TEST 2: Pre-Disbursement Readiness Evaluation across 7 Sources
  const readiness = mockLMSStore.evaluateDisbursementReadiness('SN-2026-000245');
  assert(readiness.totalChecks === 7, 'Readiness engine evaluates exactly 7 sources', `Got ${readiness.totalChecks}`);
  assert(readiness.checks.some((c) => c.category === 'CUSTOMER'), 'Customer KYC check present');
  assert(readiness.checks.some((c) => c.category === 'CONDITIONS'), 'Pre-disbursement conditions check present');
  assert(readiness.checks.some((c) => c.category === 'DOCUMENTS'), 'Mandatory documents check present');
  assert(readiness.checks.some((c) => c.category === 'BANKING'), 'Beneficiary bank check present');

  // TEST 3: Prevent Over-Disbursement (Server / Store Invariant)
  try {
    mockLMSStore.createDisbursementRequest({
      sanctionId: 'SN-2026-000244',
      requestedAmount: 999999999, // Way above sanction limit
      disbursementType: 'FULL',
      paymentMethod: 'NEFT',
      actorName: 'Rohan Sharma',
      actorRole: 'Loan Officer',
      actorId: 'usr_rohan',
    });
    assert(false, 'Over-disbursement should throw an error');
  } catch (err: any) {
    assert(
      err.message.includes('exceeds the remaining sanction amount') || err.message.includes('exceeds remaining'),
      'Over-disbursement prevented: requested amount cannot exceed remaining balance',
      err.message
    );
  }

  // TEST 4: Segregation of Duties (Maker cannot be Checker / Approver)
  const newReqDsb = mockLMSStore.createDisbursementRequest({
    sanctionId: 'SN-2026-000245',
    requestedAmount: 200000,
    disbursementType: 'PARTIAL',
    paymentMethod: 'RTGS',
    purpose: 'Equipment Purchase Tranche 1',
    actorName: 'Pooja Nair',
    actorRole: 'Operations Maker',
    actorId: 'usr_pooja',
  });

  const createdReq = newReqDsb.requests[0];
  assert(!!createdReq, 'New disbursement request created successfully');

  // Maker tries to approve their own request
  try {
    mockLMSStore.approveDisbursement(
      newReqDsb.id,
      createdReq.id,
      'Pooja Nair', // Same user!
      'Credit Approver',
      'Self approving'
    );
    assert(false, 'Maker-Checker Segregation violation should throw error');
  } catch (err: any) {
    assert(
      err.message.includes('Segregation of Duties Violation'),
      'Maker-Checker Segregation enforced: Creator cannot approve their own disbursement',
      err.message
    );
  }

  // TEST 5: Independent Checker Approval
  const approvedDsb = mockLMSStore.approveDisbursement(
    newReqDsb.id,
    createdReq.id,
    'Suresh Menon', // Independent Checker
    'Senior Branch Manager',
    'Pre-disbursement conditions and invoice verified.'
  );

  assert(
    approvedDsb.requests[0].status === 'APPROVED',
    'Independent Checker successfully approves disbursement request'
  );

  // TEST 6: Execute Payout Transaction & Balance Update
  const prevDisbursed = approvedDsb.totalDisbursedAmount;
  const prevRemaining = approvedDsb.remainingAmount;

  const executedDsb = mockLMSStore.executeDisbursementTransaction(
    approvedDsb.id,
    createdReq.id,
    {
      paymentMethod: 'RTGS',
      utrNumber: 'RTGSR20260901889911',
    },
    'Vikram Seth',
    'Treasury Officer'
  );

  assert(
    executedDsb.totalDisbursedAmount === prevDisbursed + 200000,
    'Total Disbursed Amount updated correctly after successful payout',
    `New Disbursed: ${executedDsb.totalDisbursedAmount}`
  );
  assert(
    executedDsb.remainingAmount === prevRemaining - 200000,
    'Remaining Available Balance decreased by exact payout amount',
    `New Remaining: ${executedDsb.remainingAmount}`
  );

  const settledTxn = executedDsb.transactions.find((t) => t.utrNumber === 'RTGSR20260901889911');
  assert(settledTxn?.status === 'SUCCESSFUL', 'Transaction recorded with status SUCCESSFUL and UTR reference');

  // TEST 7: Controlled Reversal & Balance Restoration
  if (settledTxn) {
    const reversedDsb = mockLMSStore.reverseDisbursementTransaction(
      executedDsb.id,
      settledTxn.id,
      'Beneficiary account returned RTGS due to IFSC mismatch',
      'Vikram Seth',
      'Treasury Officer'
    );

    assert(
      reversedDsb.remainingAmount === prevRemaining,
      'Reversal correctly restored available sanction balance',
      `Restored: ${reversedDsb.remainingAmount}, Expected: ${prevRemaining}`
    );
    assert(
      reversedDsb.totalDisbursedAmount === prevDisbursed,
      'Reversal correctly decremented total disbursed amount',
      `Disbursed: ${reversedDsb.totalDisbursedAmount}`
    );

    const revTxn = reversedDsb.transactions.find((t) => t.id === settledTxn.id);
    assert(revTxn?.status === 'REVERSED', 'Original transaction preserved in audit log with status REVERSED');
  }

  // TEST 8: KPIs Aggregation
  const kpis = mockLMSStore.getDisbursementKPIs();
  assert(kpis.totalSanctionedAmount > 0, 'KPIs: totalSanctionedAmount > 0', `Amount: ${kpis.totalSanctionedAmount}`);
  assert(
    kpis.totalRemainingAmount + kpis.totalDisbursedAmount === kpis.totalSanctionedAmount,
    'KPIs Invariant: totalRemainingAmount + totalDisbursedAmount == totalSanctionedAmount',
    `Remaining: ${kpis.totalRemainingAmount}, Disbursed: ${kpis.totalDisbursedAmount}, Sanctioned: ${kpis.totalSanctionedAmount}`
  );

  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runDisbursementInvariantTests();
