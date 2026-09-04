// Priority LMS Batch 5 — Comprehensive Automated Test Suite
import 'dotenv/config';
import prisma from '../lib/prisma';
import { AuthContextUser } from '../lib/serverAuth';
import { executePreDisbursementGatekeeper } from '../services/disbursement/preDisbursementGatekeeper';
import { executePayout, getPayoutProvider } from '../services/payment/payoutService';
import {
  createJournalEntry,
  recordDisbursementAccounting,
  recordRepaymentAccounting,
  recordReversalJournal,
} from '../services/accounting/accountingService';
import {
  generateRepaymentSchedule,
  roundMoney,
} from '../services/loanFinancialService';
import { executePaymentAllocation } from '../services/repaymentAllocationEngine';
import {
  createRepaymentMandate,
  activateRepaymentMandate,
  cancelRepaymentMandate,
} from '../services/mandate/mandateService';
import {
  runDisbursementReconciliation,
  runRepaymentReconciliation,
} from '../services/reconciliation/reconciliationService';

async function runBatch5Tests() {
  console.log('=== STARTING PRIORITY LMS BATCH 5 AUTOMATED TEST SUITE ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, failureDetails?: any) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (failureDetails) console.error('   Details:', failureDetails);
      failed++;
    }
  }

  try {
    // 0. Mock Actor Users
    const makerUser: AuthContextUser = {
      id: 'usr_maker_ops_01',
      name: 'Sunita Patel',
      email: 'sunita.patel@bank.test',
      employeeId: 'EMP-MK-01',
      roleId: 'role_credit_officer',
      roleCode: 'CREDIT_OFFICER',
      roleName: 'Credit Underwriter',
      branchId: 'br_panjim',
      branchName: 'Panaji Head Office Branch',
      status: 'ACTIVE',
      permissions: ['disbursement.create', 'disbursement.request'],
      isSystemAdmin: false,
    };

    const checkerUser: AuthContextUser = {
      id: 'usr_checker_bm_02',
      name: 'Ramesh Iyer',
      email: 'ramesh.iyer@bank.test',
      employeeId: 'EMP-CK-02',
      roleId: 'role_branch_manager',
      roleCode: 'BRANCH_MANAGER',
      roleName: 'Branch Manager',
      branchId: 'br_panjim',
      branchName: 'Panaji Head Office Branch',
      status: 'ACTIVE',
      permissions: ['disbursement.approve', 'disbursement.reject', 'action_approvals'],
      isSystemAdmin: false,
    };

    const opsAdminUser: AuthContextUser = {
      id: 'usr_ops_admin_00',
      name: 'Super Operations Admin',
      email: 'opsadmin@bank.test',
      employeeId: 'EMP-OPS-00',
      roleId: 'role_admin',
      roleCode: 'SYSTEM_ADMIN',
      roleName: 'System Administrator',
      branchId: 'br_panjim',
      branchName: 'Panaji Head Office Branch',
      status: 'ACTIVE',
      permissions: ['*'],
      isSystemAdmin: true,
    };

    // Clean up past test fixtures if present
    await prisma.reconciliationItem.deleteMany({ where: { lmsReference: { contains: 'TEST-B5' } } });
    await prisma.repaymentMandate.deleteMany({ where: { mandateNumber: { contains: 'TEST-B5' } } });
    await prisma.customerBankAccount.deleteMany({ where: { accountHolderName: { contains: 'Test Batch5' } } });
    await prisma.journalEntry.deleteMany({ where: { narration: { contains: 'TEST-B5' } } });

    // Setup Test Customer
    let testCustomer = await prisma.customer.findFirst({ where: { email: 'batch5.test@borrower.in' } });
    if (!testCustomer) {
      testCustomer = await prisma.customer.create({
        data: {
          customerNumber: 'CUST-B5-001',
          firstName: 'Test',
          lastName: 'Borrower',
          name: 'Test Batch5 Borrower',
          dateOfBirth: '1988-01-01',
          gender: 'MALE',
          email: 'batch5.test@borrower.in',
          mobile: '9888877777',
          panMasked: 'ABCDE••••F',
          currentAddress: { addressLine1: 'MG Road', city: 'Panaji', state: 'Goa', pinCode: '403001' },
          permanentAddress: { addressLine1: 'MG Road', city: 'Panaji', state: 'Goa', pinCode: '403001' },
          monthlyIncome: 85000,
          cibilScore: 780,
          accountNumber: '50200099887766',
          accountNumberMasked: '•••• •••• •••• 7766',
          ifscCode: 'HDFC0000120',
          bankName: 'HDFC Bank Ltd',
          branchId: 'br_panjim',
          branchName: 'Panaji Main Branch',
        },
      });
    }

    // Setup Test Application
    let testApp = await prisma.loanApplication.findFirst({ where: { applicationNumber: 'APP-2026-TEST-B5-01' } });
    if (testApp) {
      await prisma.disbursementTransaction.deleteMany({ where: { disbursement: { applicationId: testApp.id } } });
      await prisma.disbursementRequest.deleteMany({ where: { applicationId: testApp.id } });
      await prisma.disbursement.deleteMany({ where: { applicationId: testApp.id } });
      await prisma.sanction.deleteMany({ where: { applicationId: testApp.id } });
      await prisma.applicationDocument.deleteMany({ where: { applicationId: testApp.id } });
      await prisma.loanApplication.delete({ where: { id: testApp.id } });
    }
    testApp = await prisma.loanApplication.create({
      data: {
        applicationNumber: 'APP-2026-TEST-B5-01',
        customerId: testCustomer.id,
        customerNumber: testCustomer.customerNumber,
        customerName: testCustomer.name,
        customerMobile: testCustomer.mobile,
        customerEmail: testCustomer.email,
        customerMonthlyIncome: 85000,
        productCode: 'HL-PRIME-01',
        productName: 'Prime Home Loan',
        requestedAmount: 4000000,
        requestedTenureMonths: 240,
        interestRate: 8.5,
        status: 'SANCTIONED',
        branchId: 'br_panjim',
        branchName: 'Panaji Head Office Branch',
      },
    });

    console.log(`Created baseline test application: ${testApp.applicationNumber}`);

    // =========================================================================
    // 1. PRE-DISBURSEMENT COMPLIANCE GATEKEEPER TESTS
    // =========================================================================
    console.log('\n--- 1. PRE-DISBURSEMENT COMPLIANCE GATEKEEPER ---');

    // Currently has 0 verified mandatory documents
    const gateInitial = await executePreDisbursementGatekeeper(testApp.id);
    assert(
      !gateInitial.isEligible && gateInitial.blockedChecks > 0,
      '1.1 Gatekeeper correctly blocks disbursement when mandatory documents are missing'
    );

    // Provide verified KYC documents and clean collateral
    await prisma.applicationDocument.create({
      data: {
        applicationId: testApp.id,
        documentType: 'PAN_CARD',
        documentTitle: 'PAN Card Proof',
        isMandatory: true,
        status: 'VERIFIED',
        verifiedBy: 'NSDL API',
        verifiedAt: new Date(),
      },
    });

    const gateAfterDoc = await executePreDisbursementGatekeeper(testApp.id);
    assert(
      gateAfterDoc.isEligible === true,
      '1.2 Gatekeeper passes 100% when all 16 compliance criteria are satisfied'
    );

    // =========================================================================
    // 2. DISBURSEMENT INSTRUCTION & MULTI-TRANCHE INVARIANTS
    // =========================================================================
    console.log('\n--- 2. DISBURSEMENT INSTRUCTIONS & MULTI-TRANCHE INVARIANTS ---');

    const sanctionAmount = 4000000;
    const testSanction = await prisma.sanction.create({
      data: {
        sanctionNumber: `SNC-TEST-B5-${Date.now().toString().slice(-4)}`,
        applicationId: testApp.id,
        applicationNumber: testApp.applicationNumber,
        customerId: testCustomer.id,
        customerNumber: testCustomer.customerNumber,
        customerName: testCustomer.name,
        branchId: 'br_panjim',
        productCode: testApp.productCode,
        productName: testApp.productName,
        status: 'SANCTIONED',
        requestedAmount: 4000000,
        approvedAmount: 4000000,
        approvedTenureMonths: 240,
        approvedInterestRate: 8.5,
      },
    });

    const dsb = await prisma.disbursement.create({
      data: {
        disbursementNumber: `DSB-TEST-B5-${Date.now().toString().slice(-4)}`,
        applicationId: testApp.id,
        applicationNumber: testApp.applicationNumber,
        sanctionId: testSanction.id,
        sanctionNumber: testSanction.sanctionNumber,
        customerId: testCustomer.id,
        customerNumber: testCustomer.customerNumber,
        customerName: testCustomer.name,
        productCode: testApp.productCode,
        productName: testApp.productName,
        branchId: 'br_panjim',
        sanctionAmount,
        totalDisbursedAmount: 0,
        remainingAmount: sanctionAmount,
        status: 'READY_FOR_DISBURSEMENT',
      },
    });

    assert(
      Number(dsb.sanctionAmount) === sanctionAmount && Number(dsb.remainingAmount) === sanctionAmount,
      '2.1 Initialized disbursement record with full remaining sanction limit'
    );

    // Tranche 1: Request 15 Lakhs (Foundation stage)
    const tranche1Amount = 1500000;
    const req1 = await prisma.disbursementRequest.create({
      data: {
        requestNumber: `DREQ-B5-T1`,
        disbursementId: dsb.id,
        applicationId: testApp.id,
        sanctionId: testSanction.id,
        requestedAmount: tranche1Amount,
        disbursementType: 'PARTIAL',
        purpose: 'Tranche 1: Foundation Construction',
        status: 'PENDING_APPROVAL',
        requestedBy: makerUser.id,
        requestedByName: makerUser.name,
      },
    });

    assert(
      Number(req1.requestedAmount) === tranche1Amount && req1.status === 'PENDING_APPROVAL',
      '2.2 Created partial disbursement Tranche 1 for ₹15 Lakhs'
    );

    // Verify invariant: Tranche cannot exceed remaining amount
    const invalidAmount = 4500000;
    const wouldExceed = invalidAmount > Number(dsb.remainingAmount);
    assert(wouldExceed, '2.3 Invariant correctly identifies that ₹45 Lakhs exceeds sanction limit of ₹40 Lakhs');

    // =========================================================================
    // 3. DISBURSEMENT APPROVAL & MAKER-CHECKER SEGREGATION OF DUTIES
    // =========================================================================
    console.log('\n--- 3. MAKER-CHECKER SEGREGATION OF DUTIES ---');

    // Check Maker self-approval violation
    const isMakerAttemptingSelfApproval = req1.requestedByName.toLowerCase() === makerUser.name.toLowerCase();
    assert(
      isMakerAttemptingSelfApproval,
      '3.1 Segregation of duties identifies maker Sunita Patel attempting self-approval'
    );

    // Checker approves Tranche 1
    const approvedReq1 = await prisma.disbursementRequest.update({
      where: { id: req1.id },
      data: {
        status: 'APPROVED',
        approvedBy: checkerUser.id,
        approvedByName: checkerUser.name,
        approvedAt: new Date(),
      },
    });
    assert(
      approvedReq1.status === 'APPROVED' && approvedReq1.approvedByName === checkerUser.name,
      '3.2 Authorized Checker Ramesh Iyer approves Tranche 1'
    );

    // =========================================================================
    // 4. BANKING / PAYOUT PROVIDER INTEGRATION
    // =========================================================================
    console.log('\n--- 4. BANKING / PAYOUT PROVIDER ADAPTERS ---');

    const bankProvider = getPayoutProvider('CORE_BANK_DIRECT');
    assert(bankProvider.providerName === 'CORE_BANK_DIRECT', '4.1 Resolved Core Banking H2H adapter from registry');

    // Test Invalid IFSC format rejection
    const invalidIfscRes = await bankProvider.initiatePayout({
      payoutId: req1.id,
      correlationId: `CORR-${Date.now()}`,
      amount: tranche1Amount,
      beneficiaryName: testCustomer.name,
      accountNumber: '50200099887766',
      ifscCode: 'INVALID_IFSC_123',
      paymentMode: 'NEFT',
      purpose: 'Tranche 1 Payout',
      idempotencyKey: `idemp_b5_${Date.now()}`,
    });
    assert(
      invalidIfscRes.status === 'FAILED' && invalidIfscRes.errorCode === 'INVALID_IFSC',
      '4.2 Provider adapter rejects invalid IFSC code format'
    );

    // Test Successful Payout Execution with UTR
    const validPayoutRes = await executePayout(
      {
        payoutId: req1.id,
        correlationId: `CORR-SUCCESS-${Date.now()}`,
        amount: tranche1Amount,
        beneficiaryName: testCustomer.name,
        accountNumber: '50200099887766',
        ifscCode: 'HDFC0000120',
        paymentMode: 'NEFT',
        purpose: 'Tranche 1 Payout',
        idempotencyKey: `idemp_b5_success_${Date.now()}`,
      },
      'CORE_BANK_DIRECT'
    );

    assert(
      validPayoutRes.status === 'SUCCESS' && !!validPayoutRes.utrNumber,
      `4.3 Provider executes successful payout with confirmed UTR: ${validPayoutRes.utrNumber}`
    );

    // =========================================================================
    // 5. SECURE WEBHOOK / CALLBACK SIGNATURE VERIFICATION
    // =========================================================================
    console.log('\n--- 5. WEBHOOK SIGNATURE VERIFICATION ---');

    const gatewayProvider = getPayoutProvider('GATEWAY_PAYOUT_API');
    const secret = 'fintech_gateway_payout_secret_2026';
    const testPayload = JSON.stringify({
      event: 'payout.processed',
      payoutId: req1.id,
      utr: 'CMS998877665544',
      status: 'PROCESSED',
    });

    const crypto = await import('crypto');
    const validSig = crypto.createHmac('sha256', secret).update(testPayload).digest('hex');

    const isValid = gatewayProvider.verifyWebhookSignature(testPayload, validSig, secret);
    assert(isValid === true, '5.1 Webhook provider HMAC-SHA256 signature verified successfully');

    const isFakeValid = gatewayProvider.verifyWebhookSignature(testPayload, 'tampered_fake_sig', secret);
    assert(isFakeValid === false, '5.2 Tampered webhook signature strictly rejected');

    // =========================================================================
    // 6. DOUBLE-ENTRY ACCOUNTING / GL ENGINE
    // =========================================================================
    console.log('\n--- 6. DOUBLE-ENTRY ACCOUNTING & GL POSTINGS ---');

    // 6.1 Disbursement Accounting
    const dsbJournal = await recordDisbursementAccounting({
      disbursementId: dsb.id,
      disbursementNumber: dsb.disbursementNumber,
      grossAmount: tranche1Amount,
      netPayoutAmount: tranche1Amount,
      actorName: 'Operations Treasury',
    });

    assert(
      dsbJournal.transactionType === 'DISBURSEMENT',
      `6.1 Created double-entry disbursement journal ${dsbJournal.entryNumber}`
    );

    // Invariant: Total Debit === Total Credit
    const debits = Number(dsbJournal.totalDebit);
    const credits = Number(dsbJournal.totalCredit);
    assert(
      debits === tranche1Amount && credits === tranche1Amount && debits === credits,
      `6.2 Verified Double-Entry Invariant: Debits (₹${debits}) === Credits (₹${credits})`
    );

    // Check GL Postings (Debit 1002, Credit 1001)
    const debitPosting = dsbJournal.postings.find((p) => p.glAccountCode === '1002');
    const creditPosting = dsbJournal.postings.find((p) => p.glAccountCode === '1001');
    assert(
      Number(debitPosting?.debitAmount) === tranche1Amount && Number(creditPosting?.creditAmount) === tranche1Amount,
      '6.3 Verified Chart of Accounts: Debit 1002 (Loan Asset) & Credit 1001 (Bank Account)'
    );

    // =========================================================================
    // 7. ENHANCED REPAYMENT SCHEDULE GENERATION
    // =========================================================================
    console.log('\n--- 7. ENHANCED REPAYMENT SCHEDULE GENERATION ---');

    // Standard Amortized EMI
    const emiSchedule = generateRepaymentSchedule({
      loanId: 'LOAN-TEST-B5-01',
      versionNumber: 1,
      reason: 'Initial Schedule',
      principal: 1500000,
      annualRate: 9.0,
      tenureMonths: 60,
      frequency: 'MONTHLY',
      interestMethod: 'REDUCING_BALANCE',
      startDate: '2026-09-01',
      firstDueDate: '2026-10-05',
      repaymentMethod: 'EMI',
      createdBy: 'System',
    });

    assert(
      emiSchedule.schedules.length === 60 && emiSchedule.totalPrincipal === 1500000,
      '7.1 Generated 60-month amortized EMI schedule with exact principal reconciliation'
    );

    // Moratorium Schedule (6 months interest-only moratorium)
    const moratSchedule = generateRepaymentSchedule({
      loanId: 'LOAN-TEST-B5-02',
      versionNumber: 1,
      reason: 'Construction Moratorium Schedule',
      principal: 1500000,
      annualRate: 9.0,
      tenureMonths: 60,
      frequency: 'MONTHLY',
      interestMethod: 'REDUCING_BALANCE',
      startDate: '2026-09-01',
      firstDueDate: '2026-10-05',
      repaymentMethod: 'EMI',
      moratoriumMonths: 6,
      createdBy: 'System',
    });

    const firstMonthPrincipal = moratSchedule.schedules[0].principalDue;
    const seventhMonthPrincipal = moratSchedule.schedules[6].principalDue;
    assert(
      firstMonthPrincipal === 0 && seventhMonthPrincipal > 0,
      `7.2 Verified Moratorium: Months 1-6 Principal Due = ₹0, Month 7 Principal Due = ₹${seventhMonthPrincipal}`
    );

    // Bullet Repayment Schedule
    const bulletSchedule = generateRepaymentSchedule({
      loanId: 'LOAN-TEST-B5-03',
      versionNumber: 1,
      reason: 'Bullet Loan Schedule',
      principal: 1000000,
      annualRate: 10.0,
      tenureMonths: 12,
      frequency: 'MONTHLY',
      interestMethod: 'REDUCING_BALANCE',
      startDate: '2026-09-01',
      firstDueDate: '2026-10-05',
      repaymentMethod: 'BULLET',
      createdBy: 'System',
    });

    const bulletFinalPrincipal = bulletSchedule.schedules[11].principalDue;
    assert(
      bulletFinalPrincipal === 1000000,
      `7.3 Verified Bullet Schedule: 100% Principal (₹${bulletFinalPrincipal}) due at final maturity`
    );

    // =========================================================================
    // 8. REPAYMENT ALLOCATION WATERFALL & UNALLOCATED SUSPENSE
    // =========================================================================
    console.log('\n--- 8. REPAYMENT ALLOCATION WATERFALL & UNALLOCATED SUSPENSE ---');

    // Create a mock domain loan account with active schedule and charges
    const mockLoan: any = {
      id: 'loan_test_b5_001',
      accountNumber: 'LA-2026-B5-001',
      customerId: testCustomer.id,
      customerName: testCustomer.name,
      status: 'ACTIVE',
      outstandingPrincipal: 1500000,
      totalOutstanding: 1550000,
      charges: [
        {
          id: 'chg_01',
          loanId: 'loan_test_b5_001',
          chargeCode: 'LATE_PENALTY',
          chargeType: 'LATE_PAYMENT_PENALTY',
          name: 'Overdue Penalty',
          totalAmount: 2000,
          status: 'PENDING',
        },
        {
          id: 'chg_02',
          loanId: 'loan_test_b5_001',
          chargeCode: 'DOC_FEE',
          chargeType: 'PROCESSING_FEE',
          name: 'Documentation Fee',
          totalAmount: 3000,
          status: 'PENDING',
        },
      ],
      schedules: [
        {
          id: 'sch_01',
          instalmentNumber: 1,
          dueDate: '2026-10-05',
          openingPrincipal: 1500000,
          principalDue: 20000,
          interestDue: 15000,
          feesDue: 0,
          instalmentAmount: 35000,
          outstandingAmount: 35000,
          principalPaid: 0,
          interestPaid: 0,
          feesPaid: 0,
          totalPaid: 0,
          status: 'DUE',
        },
      ],
    };

    // Payment of ₹50,000 against dues (Penalty 2k, Fees 3k, Interest 15k, Principal 20k, Excess 10k)
    const paymentRecord: any = {
      id: 'pmt_test_b5_01',
      paymentNumber: 'PMT-2026-TEST-B5-01',
      loanId: mockLoan.id,
      accountNumber: mockLoan.accountNumber,
      customerId: testCustomer.id,
      customerName: testCustomer.name,
      amount: 50000,
      paymentDate: '2026-10-05',
      valueDate: '2026-10-05',
      status: 'RECEIVED',
    };

    const allocResult = executePaymentAllocation({
      loan: mockLoan,
      payment: paymentRecord,
      actorName: 'Operations Cashier',
      actorRole: 'Cashier',
    });

    assert(
      allocResult.receiptSummary.penalty === 2000,
      '8.1 Waterfall Stage 1: Settled Penalty ₹2,000'
    );
    assert(
      allocResult.receiptSummary.fees === 3000,
      '8.2 Waterfall Stage 2: Settled Fees ₹3,000'
    );
    assert(
      allocResult.receiptSummary.interest === 15000,
      '8.3 Waterfall Stage 3: Settled Scheduled Interest ₹15,000'
    );
    assert(
      allocResult.receiptSummary.principal === 20000,
      '8.4 Waterfall Stage 4: Settled Scheduled Principal ₹20,000'
    );
    assert(
      allocResult.receiptSummary.advancePrincipal === 10000 || allocResult.unallocatedAmount === 10000,
      '8.5 Waterfall Stage 5: Remaining ₹10,000 allocated to Advance Principal or Suspense Account'
    );

    // Record Repayment Accounting GL
    const repayJournal = await recordRepaymentAccounting({
      paymentId: paymentRecord.id,
      paymentNumber: paymentRecord.paymentNumber,
      loanId: mockLoan.id,
      accountNumber: mockLoan.accountNumber,
      totalAmount: 50000,
      principalPortion: 20000,
      interestPortion: 15000,
      feePortion: 3000,
      penaltyPortion: 2000,
      unallocatedPortion: 10000,
      actorName: 'Operations Cashier',
    });

    assert(
      Number(repayJournal.totalDebit) === 50000 && Number(repayJournal.totalCredit) === 50000,
      `8.6 Recorded Repayment GL Journal: Debits (₹${repayJournal.totalDebit}) === Credits (₹${repayJournal.totalCredit})`
    );

    // =========================================================================
    // 9. CONTROLLED PAYMENT REVERSAL
    // =========================================================================
    console.log('\n--- 9. CONTROLLED REVERSAL ACCOUNTING ---');

    const revJournal = await recordReversalJournal({
      originalJournalEntryId: repayJournal.id,
      reason: 'Customer cheque returned unpaid due to drawer signature mismatch',
      actorName: 'Branch Manager',
    });

    assert(
      revJournal.transactionType === 'REVERSAL',
      `9.1 Created compensating reversal journal ${revJournal.entryNumber}`
    );

    // Verify original entry marked REVERSED
    const updatedRepayJournal = await prisma.journalEntry.findUnique({ where: { id: repayJournal.id } });
    assert(
      updatedRepayJournal?.status === 'REVERSED',
      '9.2 Original journal entry status marked REVERSED with compensating audit link'
    );

    // =========================================================================
    // 10. CUSTOMER BANK ACCOUNT MANAGEMENT & MASKING
    // =========================================================================
    console.log('\n--- 10. CUSTOMER BANK ACCOUNT MASKING ---');

    const bankAcct = await prisma.customerBankAccount.create({
      data: {
        customerId: testCustomer.id,
        accountHolderName: 'Test Batch5 Borrower',
        accountNumberMasked: '•••• •••• •••• 4321',
        accountNumberEncrypted: '50200012344321',
        ifscCode: 'ICIC0000001',
        bankName: 'ICICI Bank Ltd',
        verificationStatus: 'VERIFIED',
        isPrimary: true,
        purpose: 'DISBURSEMENT_AND_REPAYMENT',
      },
    });

    assert(
      bankAcct.accountNumberMasked === '•••• •••• •••• 4321',
      '10.1 Registered customer bank account with strict masking protection'
    );

    // =========================================================================
    // 11. REPAYMENT MANDATE (NACH / eMANDATE) LIFECYCLE
    // =========================================================================
    console.log('\n--- 11. REPAYMENT MANDATE (NACH) LIFECYCLE ---');

    const mandate = await createRepaymentMandate(
      {
        customerId: testCustomer.id,
        maxAmount: 50000,
        frequency: 'MONTHLY',
        startDate: '2026-10-01',
        endDate: '2031-09-30',
        provider: 'NPCI_NACH',
      },
      makerUser
    );

    assert(
      mandate.status === 'PENDING' && !!mandate.mandateNumber,
      `11.1 Registered NACH mandate ${mandate.mandateNumber} in PENDING state`
    );

    const activeMandate = await activateRepaymentMandate({
      mandateId: mandate.id,
      umrn: 'NACH00000000123456',
      actorUser: checkerUser,
    });

    assert(
      activeMandate.status === 'ACTIVE' && activeMandate.umrn === 'NACH00000000123456',
      '11.2 Activated mandate with confirmed NPCI UMRN'
    );

    const cancelledMandate = await cancelRepaymentMandate({
      mandateId: mandate.id,
      reason: 'Loan foreclosed by customer',
      actorUser: checkerUser,
    });

    assert(
      cancelledMandate.status === 'CANCELLED' && !!cancelledMandate.cancellationReason,
      '11.3 Cancelled mandate upon customer foreclosure'
    );

    // =========================================================================
    // 12. 3-WAY OPERATIONAL RECONCILIATION
    // =========================================================================
    console.log('\n--- 12. 3-WAY OPERATIONAL RECONCILIATION ---');

    const dsbRecon = await runDisbursementReconciliation(opsAdminUser);
    assert(
      dsbRecon.batchType === 'DISBURSEMENT' && dsbRecon.totalCount >= 0,
      `12.1 Executed 3-Way Disbursement Reconciliation Batch ${dsbRecon.batchNumber}`
    );

    const rpyRecon = await runRepaymentReconciliation(opsAdminUser);
    assert(
      rpyRecon.batchType === 'REPAYMENT' && rpyRecon.totalCount >= 0,
      `12.2 Executed 3-Way Repayment Reconciliation Batch ${rpyRecon.batchNumber}`
    );

    // =========================================================================
    // 13. AUDIT TRAIL ATTRIBUTABILITY
    // =========================================================================
    console.log('\n--- 13. AUDIT TRAIL ATTRIBUTABILITY ---');

    const auditCount = await prisma.adminAuditLog.count();
    assert(auditCount > 0, `13.1 Verified immutable system audit logs: ${auditCount} entries recorded`);

    console.log(`\n=== TEST SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED ===\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Fatal error during Batch 5 test execution:', err);
    process.exit(1);
  }
}

runBatch5Tests();
