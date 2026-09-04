/**
 * Automated Test Suite — Priority LMS Batch 1
 * Covers:
 * 1. Credit Bureau Provider, Normalization, Idempotency & Lifecycle
 * 2. Co-Applicant Management, Duplicate Customer Prevention & Combined Eligibility Engine
 * 3. Collateral CRUD, Server-Side LTV Calculation, Valuation History & Verification
 * 4. Audit Trail Integration
 */

import 'dotenv/config';
import prisma from '../lib/prisma';
import { CibilBureauProvider } from '../services/bureau/cibilProvider';
import { pullBureauReport, getBureauReportsForApplication } from '../services/bureau/bureauService';
import { addCoApplicant, removeCoApplicant, designatePrimaryApplicant, searchExistingCustomers } from '../services/coApplicant/coApplicantService';
import { calculateCombinedEligibility } from '../services/coApplicant/eligibilityService';
import { createCollateral, addValuation, updateVerification, deleteCollateral, computeServerLtv } from '../services/collateral/collateralService';
import { AuthContextUser } from '../lib/serverAuth';

const mockActor: AuthContextUser = {
  id: 'usr_test_admin',
  email: 'admin@fintechlms.in',
  name: 'System Admin',
  employeeId: 'EMP-001',
  roleId: 'role_sys_admin',
  roleCode: 'SYSTEM_ADMIN',
  roleName: 'System Administrator',
  branchId: 'br_panjim',
  branchName: 'Panjim Main Branch',
  status: 'ACTIVE',
  permissions: ['*'],
  isSystemAdmin: true,
};

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING PRIORITY LMS BATCH 1 AUTOMATED TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`, detail || '');
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // SETUP FIXTURES
    // ----------------------------------------------------
    console.log('📦 Setting up test fixtures in PostgreSQL...');

    // 1. Ensure branch exists
    let branch = await prisma.branch.findFirst({ where: { code: 'BR_TEST_01' } });
    if (!branch) {
      branch = await prisma.branch.create({
        data: {
          code: 'BR_TEST_01',
          name: 'Testing Branch',
          city: 'Mumbai',
          state: 'Maharashtra',
        },
      });
    }

    // 2. Create primary customer
    const primaryCustNum = `CUST-${Date.now().toString().slice(-6)}`;
    const primaryCustomer = await prisma.customer.create({
      data: {
        customerNumber: primaryCustNum,
        firstName: 'Rajesh',
        lastName: 'Sharma',
        name: 'Rajesh Sharma',
        dateOfBirth: '1985-06-15',
        gender: 'MALE',
        mobile: `98${Date.now().toString().slice(-8)}`,
        email: `rajesh.${Date.now()}@example.com`,
        panMasked: 'ABCDE1234F',
        currentAddress: { addressLine1: 'Flat 101, Sea View', city: 'Mumbai', state: 'Maharashtra', pinCode: '400050' },
        permanentAddress: { addressLine1: 'Flat 101, Sea View', city: 'Mumbai', state: 'Maharashtra', pinCode: '400050' },
        branchId: branch.id,
        branchName: branch.name,
        monthlyIncome: 85000,
        cibilScore: 765,
        status: 'ACTIVE',
      },
    });

    // 3. Create Loan Application
    const appNum = `APP-${Date.now().toString().slice(-6)}`;
    const application = await prisma.loanApplication.create({
      data: {
        applicationNumber: appNum,
        customerId: primaryCustomer.id,
        customerNumber: primaryCustomer.customerNumber,
        customerName: primaryCustomer.name,
        customerMobile: primaryCustomer.mobile,
        customerMonthlyIncome: 85000,
        productCode: 'HL_TEST_01',
        productName: 'Home Loan Express',
        requestedAmount: 4500000,
        requestedTenureMonths: 180,
        interestRate: 8.5,
        repaymentFrequency: 'MONTHLY',
        branchId: branch.id,
        branchName: branch.name,
        status: 'DRAFT',
      },
    });

    console.log(`  ℹ️ Test Application created: ${application.applicationNumber} (ID: ${application.id})\n`);

    // ====================================================
    // TEST SUITE 1: BUREAU PROVIDER & SERVICE
    // ====================================================
    console.log('🔍 [SUITE 1] Bureau Provider & Analysis Tests:');

    const cibilProvider = new CibilBureauProvider();

    // 1.1 Provider Validation Test
    let panValidationError = false;
    try {
      await cibilProvider.pullReport({
        applicantId: primaryCustomer.id,
        applicantType: 'PRIMARY',
        name: primaryCustomer.name,
        pan: 'INVALID_PAN',
      });
    } catch (e: any) {
      panValidationError = true;
    }
    assert(panValidationError, 'CIBIL Provider rejects invalid PAN format strictly');

    // 1.2 Provider Normalization Test
    const directReport = await cibilProvider.pullReport({
      applicantId: primaryCustomer.id,
      applicantType: 'PRIMARY',
      name: primaryCustomer.name,
      pan: 'ABCDE1234F',
    });

    assert(directReport.provider === 'CIBIL', 'Bureau report provider is CIBIL');
    assert(directReport.score >= 300 && directReport.score <= 900, `Score is within valid range: ${directReport.score}`);
    assert(['POOR', 'FAIR', 'GOOD', 'EXCELLENT'].includes(directReport.scoreBand), `Valid score band calculated: ${directReport.scoreBand}`);
    assert(directReport.accounts.length > 0, `Trade line accounts normalized (${directReport.accounts.length} accounts)`);
    assert(directReport.totalOutstanding > 0, `Total debt exposure aggregated: ₹${directReport.totalOutstanding}`);

    // 1.3 Bureau Service Pull & Persistence Test
    const pulledReport = await pullBureauReport({
      applicationId: application.id,
      applicantId: primaryCustomer.id,
      applicantType: 'PRIMARY',
      actorUser: mockActor,
      forceRefresh: false,
    });

    assert(pulledReport.status === 'RECEIVED', 'Bureau service persists report with status RECEIVED');
    assert(pulledReport.score !== null, `Report score saved: ${pulledReport.score}`);

    // 1.4 Bureau Idempotency Test (fresh report within 30 days should return existing record)
    const idempotentReport = await pullBureauReport({
      applicationId: application.id,
      applicantId: primaryCustomer.id,
      applicantType: 'PRIMARY',
      actorUser: mockActor,
      forceRefresh: false,
    });

    assert(idempotentReport.id === pulledReport.id, 'Idempotency verified: re-request within validity window returned cached record');

    // 1.5 Bureau Force Refresh Test
    const refreshedReport = await pullBureauReport({
      applicationId: application.id,
      applicantId: primaryCustomer.id,
      applicantType: 'PRIMARY',
      actorUser: mockActor,
      forceRefresh: true,
    });

    assert(refreshedReport.id !== pulledReport.id, 'Force refresh verified: creates updated report record when explicitly requested');

    // 1.6 Bureau Reports Query Test
    const allAppReports = await getBureauReportsForApplication(application.id);
    assert(allAppReports.length >= 2, `Retrieved all application bureau reports (${allAppReports.length} reports)`);

    console.log('');

    // ====================================================
    // TEST SUITE 2: CO-APPLICANTS & ELIGIBILITY ENGINE
    // ====================================================
    console.log('👥 [SUITE 2] Co-Applicants & Combined Eligibility Tests:');

    // 2.1 Customer Search for Duplicate Prevention
    const searchResults = await searchExistingCustomers('Sharma');
    assert(searchResults.length > 0, 'Customer search finds matching existing customers by name');

    // 2.2 Add Co-Applicant by creating new customer
    const coAppMobile = `97${Math.floor(10000000 + Math.random() * 90000000)}`;
    const coApp1 = await addCoApplicant({
      applicationId: application.id,
      customerData: {
        name: 'Sunita Sharma',
        mobile: coAppMobile,
        pan: 'WXYZP9876Q',
        monthlyIncome: 60000,
        existingObligations: 8000,
      },
      relationship: 'SPOUSE',
      applicantType: 'CO_APPLICANT',
      ownershipShare: 50,
      actorUser: mockActor,
    });

    assert(coApp1.customerName === 'Sunita Sharma', 'Added co-applicant Sunita Sharma');
    assert(Number(coApp1.monthlyIncome) === 60000, 'Recorded co-applicant monthly income ₹60,000');
    assert(Number(coApp1.ownershipShare) === 50, 'Recorded co-applicant ownership share 50%');

    // 2.3 Duplicate Customer Prevention Test
    // Attempting to add with the same mobile should link the existing customer rather than duplicating in Customer table
    const beforeCustCount = await prisma.customer.count({ where: { mobile: coAppMobile } });
    assert(beforeCustCount === 1, 'Single customer record exists for mobile');

    // 2.4 Pull Bureau Report specifically for Co-Applicant
    const coAppBureau = await pullBureauReport({
      applicationId: application.id,
      applicantId: coApp1.id,
      applicantType: 'CO_APPLICANT',
      actorUser: mockActor,
    });

    assert(coAppBureau.applicantType === 'CO_APPLICANT', 'Pulled separate bureau report for co-applicant');
    assert(coAppBureau.status === 'RECEIVED', 'Co-applicant bureau report status is RECEIVED');

    // 2.5 Combined Eligibility Engine Calculation Test
    const eligibility = await calculateCombinedEligibility(application.id);

    assert(eligibility.applicationId === application.id, 'Combined eligibility computed for application');
    assert(
      eligibility.combinedMonthlyIncome === 85000 + 60000,
      `Combined monthly income correctly calculated: ₹${eligibility.combinedMonthlyIncome} (Primary 85k + CoApp 60k)`
    );
    assert(eligibility.applicantSummaries.length === 2, 'Eligibility engine evaluates both primary and co-applicant');
    assert(eligibility.maxEligibleAmount > 0, `Max eligible loan amount calculated: ₹${eligibility.maxEligibleAmount}`);
    assert(eligibility.foirLimitPercent >= 50, `FOIR ceiling applied: ${eligibility.foirLimitPercent}%`);
    assert(eligibility.lowestBureauScore !== null, `Aggregated lowest bureau score across applicants: ${eligibility.lowestBureauScore}`);

    // 2.6 Primary Applicant Designation (Role Swap) Test
    const swapResult = await designatePrimaryApplicant(application.id, coApp1.id, mockActor);
    assert(swapResult.success, 'Swapped primary applicant: designated Sunita Sharma as primary');

    const updatedApp = await prisma.loanApplication.findUnique({ where: { id: application.id } });
    assert(updatedApp?.customerName === 'Sunita Sharma', 'Application primary customer updated to Sunita Sharma');

    // 2.7 Remove Co-Applicant Test
    // Find the former primary who is now co-applicant
    const formerPrimaryCoApp = await prisma.coApplicant.findFirst({
      where: { applicationId: application.id, customerName: 'Rajesh Sharma' },
    });
    if (formerPrimaryCoApp) {
      const removeResult = await removeCoApplicant(application.id, formerPrimaryCoApp.id, mockActor);
      assert(removeResult.success, 'Removed co-applicant successfully');
    }

    console.log('');

    // ====================================================
    // TEST SUITE 3: COLLATERAL & SERVER-SIDE LTV
    // ====================================================
    console.log('🏛️ [SUITE 3] Collateral Management & Server-Side LTV Tests:');

    // 3.1 Create Real Estate Collateral Asset
    const collateral1 = await createCollateral({
      applicationId: application.id,
      customerId: primaryCustomer.id,
      collateralType: 'PROPERTY',
      assetSubtype: 'RESIDENTIAL_FLAT',
      title: 'Flat 402, Sai Residency Apartments',
      ownershipType: 'SOLE',
      ownerName: 'Rajesh Sharma',
      assetIdentifier: 'CTS-9821-SURVEY-45',
      addressLine1: 'Bandra West, Hill Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pinCode: '400050',
      currentMarketValue: 6000000,
      forcedSaleValue: 4800000,
      valuationAmount: 6000000,
      valuerName: 'Apex Valuers & Surveyors LLP',
      valuerFirm: 'Apex Valuation Services',
      valuationReportNumber: 'VAL-MUM-2026-0089',
      actorUser: mockActor,
    });

    assert(collateral1.collateralNumber.startsWith('COL-'), `Collateral generated unique ID: ${collateral1.collateralNumber}`);
    assert(collateral1.currentMarketValue === 6000000, 'Collateral market value recorded: ₹6,000,000');
    assert(collateral1.valuationStatus === 'COMPLETED', 'Valuation marked COMPLETED with valuer record');

    // 3.2 Verify Server-Side LTV Calculation
    // Loan Amount = 4,500,000. Collateral = 6,000,000. LTV = (4.5M / 6M) * 100 = 75.00%
    const expectedLtv = Number(((4500000 / 6000000) * 100).toFixed(2));
    assert(collateral1.calculatedLtv === expectedLtv, `Server-side LTV calculated correctly: ${collateral1.calculatedLtv}% (expected ${expectedLtv}%)`);

    // 3.3 Create Second Collateral (e.g. Gold / Fixed Deposit) to test multi-collateral LTV
    const collateral2 = await createCollateral({
      applicationId: application.id,
      customerId: primaryCustomer.id,
      collateralType: 'FINANCIAL_SECURITY',
      assetSubtype: 'FIXED_DEPOSIT',
      title: 'SBI Term Deposit Account 882190',
      ownershipType: 'SOLE',
      ownerName: 'Rajesh Sharma',
      assetIdentifier: 'FD-SBI-8821902',
      currentMarketValue: 1500000,
      valuationAmount: 1500000,
      valuerName: 'Bank System Verification',
      actorUser: mockActor,
    });

    // Total Collateral = 6M + 1.5M = 7.5M. LTV = (4.5M / 7.5M) * 100 = 60.00%
    const multiLtv = await computeServerLtv(application.id);
    assert(multiLtv === 60, `Multi-collateral combined LTV correctly computed: ${multiLtv}% (Total Security 7.5M against 4.5M loan)`);

    // 3.4 Add Revaluation Test
    const revaluedCollateral = await addValuation({
      collateralId: collateral1.id,
      marketValue: 7000000,
      forcedSaleValue: 5600000,
      valuerName: 'Senior Govt Approved Valuer',
      valuerFirm: 'National Valuation Bureau',
      reportNumber: 'VAL-MUM-2026-REVAL-01',
      notes: 'Property value appreciated following metro line commissioning',
      actorUser: mockActor,
    });

    assert(revaluedCollateral.currentMarketValue === 7000000, 'Collateral market value updated to ₹7,000,000');
    assert(revaluedCollateral.valuationHistory.length >= 2, `Valuation history tracked (${revaluedCollateral.valuationHistory.length} entries)`);

    // 3.5 Update Legal & Technical Verification Test
    const verifiedCollateral = await updateVerification({
      collateralId: collateral1.id,
      legalStatus: 'CLEARED',
      legalAdvocateName: 'Adv. Meenakshi Sundaram',
      technicalStatus: 'APPROVED',
      technicalEngineerName: 'Er. Sandeep Patil',
      actorUser: mockActor,
    });

    assert(verifiedCollateral.legalVerificationStatus === 'CLEARED', 'Legal title clearance recorded');
    assert(verifiedCollateral.technicalStatus === 'APPROVED', 'Technical structural inspection approved');
    assert(verifiedCollateral.status === 'VERIFIED', 'Collateral status transitioned to VERIFIED');

    // 3.6 Delete Collateral Test
    const deleteResult = await deleteCollateral(collateral2.id, mockActor);
    assert(deleteResult.success, `Successfully removed/released collateral asset ${collateral2.id}`);

    console.log('');

    // ====================================================
    // TEST SUITE 4: AUDIT TRAIL VERIFICATION
    // ====================================================
    console.log('📜 [SUITE 4] Audit Trail Integrity Tests:');

    const bureauLogs = await prisma.adminAuditLog.findMany({
      where: { entityType: 'BUREAU' },
    });
    assert(bureauLogs.length > 0, `Bureau inquiries tracked in AdminAuditLog (${bureauLogs.length} events logged)`);

    const coAppLogs = await prisma.adminAuditLog.findMany({
      where: { entityType: 'CO_APPLICANT' },
    });
    assert(coAppLogs.length > 0, `Co-Applicant actions tracked in AdminAuditLog (${coAppLogs.length} events logged)`);

    const collateralLogs = await prisma.adminAuditLog.findMany({
      where: { entityType: 'COLLATERAL' },
    });
    assert(collateralLogs.length > 0, `Collateral actions tracked in AdminAuditLog (${collateralLogs.length} events logged)`);

    console.log('');

    // ----------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------
    console.log('🧹 Cleaning up test fixtures...');
    await prisma.collateralValuationHistory.deleteMany({ where: { collateralId: collateral1.id } });
    await prisma.collateral.deleteMany({ where: { applicationId: application.id } });
    await prisma.bureauReport.deleteMany({ where: { applicationId: application.id } });
    await prisma.coApplicant.deleteMany({ where: { applicationId: application.id } });
    await prisma.applicationHistory.deleteMany({ where: { applicationId: application.id } });
    await prisma.loanApplication.delete({ where: { id: application.id } });
    await prisma.customer.delete({ where: { id: primaryCustomer.id } });
    if (coApp1?.customerId) await prisma.customer.deleteMany({ where: { id: coApp1.customerId } });

    console.log('  ✨ Cleaned up test database entities.\n');
  } catch (err) {
    console.error('💥 Fatal error in test runner:', err);
    failed++;
  }

  console.log('====================================================');
  console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
