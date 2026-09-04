import 'dotenv/config';
import prisma from '../lib/prisma';
import {
  getProductWorkflowStages,
  transitionWorkflowStage,
  assignWorkflowApplication,
} from '../services/workflow/workflowService';
import {
  initializeChecklistForApplication,
  getChecklist,
  updateChecklistItem,
} from '../services/checklist/checklistService';
import {
  syncApplicationDocumentRequirements,
  verifyDocument,
  rejectDocument,
} from '../services/document/documentRequirementService';
import {
  createDeviation,
  approveDeviation,
  rejectDeviation,
  getApplicationDeviations,
} from '../services/deviation/deviationService';
import {
  submitCreditDecision,
  returnForCorrection,
  validateApprovalAuthority,
} from '../services/credit/creditDecisionService';
import { executePreDisbursementGatekeeper } from '../services/disbursement/preDisbursementGatekeeper';

import { AuthContextUser } from '../lib/serverAuth';

async function runBatch4Tests() {
  console.log('=== STARTING PRIORITY LMS BATCH 4 AUTOMATED TEST SUITE ===\n');

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
    // 0. Setup Mock Actor Users
    const makerUser: AuthContextUser = {
      id: 'maker_user_1',
      name: 'Sunita Patel',
      email: 'sunita.patel@bank.test',
      employeeId: 'EMP-MK-01',
      roleId: 'role_credit_officer',
      roleCode: 'CREDIT_OFFICER',
      roleName: 'Credit Underwriter',
      branchId: 'br_panjim',
      branchName: 'Panaji Head Office Branch',
      status: 'ACTIVE',
      permissions: ['credit.review', 'credit.recommend', 'workflow.assign', 'checklist.update'],
      isSystemAdmin: false,
    };

    const checkerUser: AuthContextUser = {
      id: 'checker_user_2',
      name: 'Ramesh Iyer',
      email: 'ramesh.iyer@bank.test',
      employeeId: 'EMP-CK-02',
      roleId: 'role_branch_manager',
      roleCode: 'BRANCH_MANAGER',
      roleName: 'Branch Manager',
      branchId: 'br_panjim',
      branchName: 'Panaji Head Office Branch',
      status: 'ACTIVE',
      permissions: ['credit.approve', 'credit.reject', 'credit.return', 'action_approvals'],
      isSystemAdmin: false,
    };

    const adminUser: AuthContextUser = {
      id: 'admin_user_0',
      name: 'Super Administrator',
      email: 'admin@bank.test',
      employeeId: 'EMP-ADM-00',
      roleId: 'role_admin',
      roleCode: 'SYSTEM_ADMIN',
      roleName: 'System Administrator',
      branchId: 'br_panjim',
      branchName: 'Panaji Head Office Branch',
      status: 'ACTIVE',
      permissions: ['*'],
      isSystemAdmin: true,
    };

    // Clean previous test artifacts if existing
    await prisma.applicationReturnHistory.deleteMany({
      where: { application: { applicationNumber: { in: ['APP-2026-TEST-B4-01', 'APP-2026-TEST-B4-02'] } } },
    });
    await prisma.creditDecisionRecord.deleteMany({
      where: { application: { applicationNumber: { in: ['APP-2026-TEST-B4-01', 'APP-2026-TEST-B4-02'] } } },
    });
    await prisma.applicationDeviation.deleteMany({
      where: { application: { applicationNumber: { in: ['APP-2026-TEST-B4-01', 'APP-2026-TEST-B4-02'] } } },
    });
    await prisma.creditChecklistItem.deleteMany({
      where: { application: { applicationNumber: { in: ['APP-2026-TEST-B4-01', 'APP-2026-TEST-B4-02'] } } },
    });
    await prisma.applicationDocument.deleteMany({
      where: { application: { applicationNumber: { in: ['APP-2026-TEST-B4-01', 'APP-2026-TEST-B4-02'] } } },
    });
    await prisma.applicationHistory.deleteMany({
      where: { application: { applicationNumber: { in: ['APP-2026-TEST-B4-01', 'APP-2026-TEST-B4-02'] } } },
    });
    await prisma.loanApplication.deleteMany({
      where: { applicationNumber: { in: ['APP-2026-TEST-B4-01', 'APP-2026-TEST-B4-02'] } },
    });
    await prisma.customer.deleteMany({
      where: { mobile: '9988771122' },
    });

    // Create Test Branch & Product
    let branch = await prisma.branch.findFirst();
    if (!branch) {
      branch = await prisma.branch.create({
        data: {
          code: 'BR-TEST-01',
          name: 'Corporate Underwriting Branch',
          city: 'Mumbai',
          state: 'Maharashtra',
        },
      });
    }

    // Create Test Customer
    const custNum = `CUST-B4-${Date.now().toString().slice(-6)}`;
    const customer = await prisma.customer.create({
      data: {
        customerNumber: custNum,
        firstName: 'Venkatesh',
        lastName: 'Rao',
        name: 'Venkatesh Rao',
        dateOfBirth: '1988-04-12',
        gender: 'MALE',
        mobile: '9988771122',
        email: 'venkatesh.rao@example.com',
        panMasked: 'ABCDE1234F',
        status: 'ACTIVE',
        accountNumber: '91234567890123',
        accountNumberMasked: 'XXXXXXXXX0123',
        ifscCode: 'HDFC0001234',
        bankName: 'HDFC Bank',
        monthlyIncome: 125000,
        cibilScore: 782,
        currentAddress: { addressLine1: 'Flat 402, High View', city: 'Mumbai', state: 'Maharashtra', pinCode: '400050' },
        permanentAddress: { addressLine1: 'Flat 402, High View', city: 'Mumbai', state: 'Maharashtra', pinCode: '400050' },
        branchId: branch.id,
        branchName: branch.name,
      },
    });

    // Create Test Loan Application
    const app = await prisma.loanApplication.create({
      data: {
        applicationNumber: 'APP-2026-TEST-B4-01',
        customerId: customer.id,
        customerNumber: customer.customerNumber,
        customerName: customer.name,
        customerMobile: customer.mobile,
        customerMonthlyIncome: 125000,
        productCode: 'HL_01',
        productName: 'Prime Home Loan',
        requestedAmount: 4500000,
        requestedTenureMonths: 180,
        interestRate: 8.75,
        status: 'DRAFT',
        branchId: branch.id,
        branchName: branch.name,
        assignedOfficerId: makerUser.id,
        loanOfficer: makerUser.name,
        submittedBy: makerUser.name,
      },
    });

    console.log(`Created baseline test application: ${app.applicationNumber} (ID: ${app.id})\n`);

    // --- TEST GROUP 1: WORKFLOW STAGE TRANSITIONS & PRODUCT WORKFLOW ---
    console.log('--- 1. WORKFLOW PIPELINE & TRANSITION GUARDS ---');
    const stages = await getProductWorkflowStages('HL_01');
    assert(stages.length > 5 && stages.includes('CREDIT_REVIEW'), '1.1 Get product-specific workflow stages');

    const expressStages = await getProductWorkflowStages('PL_PERSONAL_EXPRESS');
    assert(expressStages.includes('ELIGIBILITY_REVIEW'), '1.2 Get express unsecured workflow stages');

    // Progression: DRAFT -> SUBMITTED
    const subRes = await transitionWorkflowStage({
      applicationId: app.id,
      targetStage: 'SUBMITTED',
      actorUser: makerUser,
      remarks: 'Application completed and submitted by borrower',
    });
    assert(subRes.currentStage === 'SUBMITTED', '1.3 Transition from DRAFT to SUBMITTED');

    // Progression: SUBMITTED -> DOCUMENT_REVIEW
    const docRevRes = await transitionWorkflowStage({
      applicationId: app.id,
      targetStage: 'DOCUMENT_REVIEW',
      actorUser: makerUser,
    });
    assert(docRevRes.currentStage === 'DOCUMENT_REVIEW', '1.4 Transition to DOCUMENT_REVIEW');

    // Guard check: Cannot transition directly to APPROVAL when mandatory checklist & documents are incomplete
    let guardBlocked = false;
    try {
      await transitionWorkflowStage({
        applicationId: app.id,
        targetStage: 'APPROVAL',
        actorUser: makerUser,
      });
    } catch (err: any) {
      guardBlocked = true;
    }
    assert(guardBlocked, '1.5 Guard blocks transition to APPROVAL when prerequisites are unmet');

    // Officer Assignment
    const assignRes = await assignWorkflowApplication({
      applicationId: app.id,
      officerId: checkerUser.id,
      officerName: checkerUser.name,
      roleName: checkerUser.roleName,
      actorUser: adminUser,
      remarks: 'Allocated to credit checker for final underwriting review',
    });
    assert(assignRes.application.loanOfficer === checkerUser.name, '1.6 Workflow officer reassignment with audit attribution');

    // --- TEST GROUP 2: CREDIT REVIEW CHECKLIST ENGINE ---
    console.log('\n--- 2. CREDIT REVIEW CHECKLIST ENGINE ---');
    const chkList = await initializeChecklistForApplication(app.id, makerUser);
    assert(chkList.length >= 10, '2.1 Initialized comprehensive credit review checklist');

    const chkSummary = await getChecklist(app.id);
    assert(chkSummary.total === chkList.length, '2.2 Fetched checklist summary metrics');
    assert(!chkSummary.isCompliant, '2.3 Identified incomplete checklist before verification');

    // Mark items as PASSED
    const kycItem = chkList.find((c) => c.itemCode === 'KYC_VERIFIED')!;
    const updatedKyc = await updateChecklistItem({
      applicationId: app.id,
      itemId: kycItem.id,
      status: 'PASSED',
      remarks: 'Aadhaar and PAN validated online with zero discrepancy',
      evidenceRef: 'DOC-KYC-001',
      actorUser: makerUser,
    });
    assert(updatedKyc.status === 'PASSED' && updatedKyc.reviewerName === makerUser.name, '2.4 Passed checklist item with reviewer attribution');

    // Mark item as WAIVED
    const colItem = chkList.find((c) => c.itemCode === 'COLLATERAL_VERIFIED');
    if (colItem) {
      const waivedCol = await updateChecklistItem({
        applicationId: app.id,
        itemId: colItem.id,
        status: 'WAIVED',
        remarks: 'Collateral exempt under unsecured scheme',
        actorUser: makerUser,
      });
      assert(waivedCol.status === 'WAIVED', '2.5 Waived non-mandatory checklist item');
    }

    // --- TEST GROUP 3: DOCUMENT REQUIREMENT & VERIFICATION SYSTEM ---
    console.log('\n--- 3. DOCUMENT SYSTEM & VERIFICATION LIFECYCLE ---');
    const docs = await syncApplicationDocumentRequirements(app.id, makerUser);
    assert(docs.length >= 5, '3.1 Auto-synchronized mandatory product document requirements');

    const panDoc = docs.find((d) => d.documentType === 'PAN_CARD')!;
    const verifiedPan = await verifyDocument({
      applicationId: app.id,
      documentId: panDoc.id,
      actorUser: makerUser,
      notes: 'Cleared against NSDL PAN database',
    });
    assert(verifiedPan.status === 'VERIFIED' && verifiedPan.verifiedBy === makerUser.name, '3.2 Marked document VERIFIED with auditor name');

    // Rejection with reason test
    const addrDoc = docs.find((d) => d.documentType === 'ADDRESS_PROOF')!;
    const rejectedDoc = await rejectDocument({
      applicationId: app.id,
      documentId: addrDoc.id,
      reason: 'Electricity bill is more than 3 months old; please provide recent bill',
      actorUser: makerUser,
    });
    assert(
      rejectedDoc.status === 'REJECTED' && Boolean(rejectedDoc.rejectionReason?.includes('3 months')),
      '3.3 Marked document REJECTED with mandatory reason'
    );

    // Verify remaining mandatory documents for subsequent gates
    for (const d of docs) {
      if (d.isMandatory && d.id !== addrDoc.id) {
        await verifyDocument({ applicationId: app.id, documentId: d.id, actorUser: makerUser });
      }
    }
    // Now verify address proof as well after "resubmission"
    await verifyDocument({ applicationId: app.id, documentId: addrDoc.id, actorUser: makerUser });

    // --- TEST GROUP 4: POLICY DEVIATIONS & ROI NEGOTIATION ---
    console.log('\n--- 4. POLICY DEVIATIONS & ROI NEGOTIATION ---');
    const dev = await createDeviation({
      applicationId: app.id,
      category: 'ROI',
      title: 'Competitive ROI Concession Request',
      deviationReason: 'Borrower has competing sanction letter from rival bank at 8.50%',
      mitigantNotes: 'High net worth customer with salaried spouse',
      severity: 'MEDIUM',
      requestedRoi: 8.50,
      actorUser: makerUser,
    });
    assert(dev.deviationNumber.startsWith('DEV-'), '4.1 Generated formal deviation reference number');
    assert(dev.status === 'PENDING', '4.2 Deviation status set to PENDING');

    // Approve deviation
    const approvedDev = await approveDeviation({
      applicationId: app.id,
      deviationId: dev.id,
      approvedRoi: 8.50,
      actorUser: checkerUser,
    });
    assert(approvedDev.status === 'APPROVED' && approvedDev.approvedByName === checkerUser.name, '4.3 Checker approved ROI deviation');

    const allDevs = await getApplicationDeviations(app.id);
    assert(allDevs.isCompliant, '4.4 Verified 100% resolution of open deviations');

    // --- TEST GROUP 5: MAKER-CHECKER SEGREGATION OF DUTIES ---
    console.log('\n--- 5. MAKER-CHECKER SEGREGATION OF DUTIES ---');
    // Ensure application assignedOfficerId is makerUser.id
    await prisma.loanApplication.update({
      where: { id: app.id },
      data: { assignedOfficerId: makerUser.id, loanOfficer: makerUser.name },
    });

    let selfApprovalBlocked = false;
    try {
      // Maker attempts to self-approve proposal
      await submitCreditDecision({
        applicationId: app.id,
        decision: 'APPROVE',
        approvedAmount: 4500000,
        approvedTenureMonths: 180,
        approvedRoi: 8.50,
        actorUser: makerUser, // Self!
      });
    } catch (err: any) {
      if (err.message.includes('Segregation of Duties Violation')) {
        selfApprovalBlocked = true;
      }
    }
    assert(selfApprovalBlocked, '5.1 Segregation of duties strictly blocks maker from self-approving proposal');

    // --- TEST GROUP 6: APPROVAL AUTHORITY MATRIX ---
    console.log('\n--- 6. APPROVAL AUTHORITY MATRIX ---');
    // Underwriter limit test: 45 Lakhs exceeds standard underwriter limit (25 Lakhs)
    const underwriterAuth = await validateApprovalAuthority(4500000, 'Credit Underwriter', false);
    assert(!underwriterAuth.allowed, '6.1 Underwriter authority limit correctly blocks 45 Lakhs proposal');

    // Branch manager limit test (50 Lakhs limit handles 45 Lakhs)
    const managerAuth = await validateApprovalAuthority(4500000, 'Branch Manager', false);
    assert(managerAuth.allowed, '6.2 Branch Manager authority successfully approves 45 Lakhs proposal');

    // --- TEST GROUP 7: RETURN FOR CORRECTION ---
    console.log('\n--- 7. RETURN FOR CORRECTION LIFECYCLE ---');
    const returnRecord = await returnForCorrection({
      applicationId: app.id,
      returnReason: 'DOCUMENT_DEFICIENCY',
      comments: 'Please verify original property title deed chain dating back 30 years',
      requiredCorrections: ['Provide 30-year title deed search report', 'Sign sanction advisory acceptance'],
      actorUser: checkerUser,
    });
    assert(returnRecord.cycleNumber === 1, '7.1 Recorded return cycle 1');

    const appAfterReturn = await prisma.loanApplication.findUnique({ where: { id: app.id } });
    assert(appAfterReturn?.status === 'RETURNED_FOR_CORRECTION', '7.2 Application status transitioned to RETURNED_FOR_CORRECTION');

    // --- TEST GROUP 8: FINAL CREDIT DECISION RECORD ---
    console.log('\n--- 8. FORMAL CREDIT DECISION RECORD ---');
    // Separate checker approves proposal with covenants
    const decisionRecord = await submitCreditDecision({
      applicationId: app.id,
      decision: 'APPROVE_WITH_CONDITIONS',
      approvedAmount: 4200000,
      approvedTenureMonths: 180,
      approvedRoi: 8.50,
      conditions: [
        'Deposit original title deeds with branch locker prior to disbursement',
        'Provide PDC cheques for upfront documentation fee',
      ],
      remarks: 'Sanction approved based on strong CIBIL 782 and low FOIR (38%).',
      creditNotes: 'Stable employment in PSU bank, zero credit card DPD.',
      actorUser: checkerUser,
    });
    assert(decisionRecord.decision === 'APPROVE_WITH_CONDITIONS', '8.1 Recorded formal decision APPROVE_WITH_CONDITIONS');
    assert(Number(decisionRecord.approvedAmount) === 4200000, '8.2 Persisted approved loan amount');
    assert(Array.isArray(decisionRecord.conditions) && (decisionRecord.conditions as any[]).length === 2, '8.3 Recorded pre-disbursement covenants');

    const approvedApp = await prisma.loanApplication.findUnique({ where: { id: app.id } });
    assert(approvedApp?.status === 'APPROVED', '8.4 Application moved to formal APPROVED status');

    // --- TEST GROUP 9: PRE-DISBURSEMENT COMPLIANCE GATEKEEPER ---
    console.log('\n--- 9. PRE-DISBURSEMENT COMPLIANCE GATEKEEPER ---');
    // Pass remaining checklist items
    const pendingItems = await prisma.creditChecklistItem.findMany({
      where: { applicationId: app.id, status: 'PENDING' },
    });
    for (const item of pendingItems) {
      await updateChecklistItem({
        applicationId: app.id,
        itemId: item.id,
        status: 'PASSED',
        actorUser: makerUser,
      });
    }

    const gateResult = await executePreDisbursementGatekeeper(app.id);
    assert(gateResult.totalChecks >= 10, `9.1 Evaluated complete compliance gatekeeper (${gateResult.totalChecks} checks)`);
    assert(gateResult.isEligible, '9.2 All pre-disbursement compliance checks passed successfully');

    // --- TEST GROUP 10: AUDIT TRAIL ATTRIBUTABILITY ---
    console.log('\n--- 10. AUDIT TRAIL ATTRIBUTABILITY ---');
    const historyEntries = await prisma.applicationHistory.findMany({
      where: { applicationId: app.id },
      orderBy: { timestamp: 'desc' },
    });
    assert(historyEntries.length >= 5, '10.1 Recorded full application lifecycle history timeline');

    const auditLogs = await prisma.adminAuditLog.findMany({
      where: { entityId: app.id },
    });
    assert(auditLogs.length >= 3, '10.2 Attributable admin audit log entries recorded for workflow changes');

    console.log(`\n=== TEST SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED ===`);
    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal test error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runBatch4Tests();
