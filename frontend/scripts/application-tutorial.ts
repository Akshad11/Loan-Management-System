/**
 * Application Tutorial Script
 *
 * An interactive, step-by-step tutorial script that walks through the complete
 * Loan Application Lifecycle in Indian Retail Banking / Fintech LMS:
 *
 *   Step 1: Customer Selection & Regulatory KYC Verification
 *   Step 2: Loan Product Selection & Amortization Financial Modeling
 *   Step 3: Loan Application Initiation & Document Checklist Generation
 *   Step 4: Credit Bureau (CIBIL) Score Evaluation & Debt-to-Income (FOIR) Check
 *   Step 5: Credit Underwriting Assessment & Policy Recommendation
 *   Step 6: Workflow State Transition & Audit Trail Logging
 *
 * Usage:
 *   npx tsx scripts/application-tutorial.ts
 *   npx tsx scripts/application-tutorial.ts --customerId <id>
 *   npx tsx scripts/application-tutorial.ts --productCode PROD-HL-002 --amount 3500000 --tenure 180
 */

import 'dotenv/config';
import prisma from '../src/lib/prisma';
import { createTestCustomer } from './create-customer';

// Helper to delay for animated console pacing
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function calculateEmi(principal: number, annualRatePercent: number, tenureMonths: number): number {
  const monthlyRate = annualRatePercent / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  return Math.round(emi);
}

async function runTutorial() {
  console.clear?.();
  console.log('╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║        LOAN MANAGEMENT SYSTEM (LMS) — LOAN APPLICATION TUTORIAL          ║');
  console.log('║        Interactive End-to-End Origination, Bureau & Underwriting Flow    ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

  await sleep(400);

  // Parse CLI arguments
  const args = process.argv.slice(2);
  let targetCustomerId: string | null = null;
  let chosenProductCode = 'PROD-HL-002'; // Default: Housing Loan
  let requestedAmount = 2500000;         // ₹25,00,000
  let requestedTenureMonths = 240;       // 20 Years

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--customerId' && args[i + 1]) {
      targetCustomerId = args[i + 1].trim();
      i++;
    } else if (args[i] === '--productCode' && args[i + 1]) {
      chosenProductCode = args[i + 1].trim();
      i++;
    } else if (args[i] === '--amount' && args[i + 1]) {
      requestedAmount = parseFloat(args[i + 1]);
      i++;
    } else if (args[i] === '--tenure' && args[i + 1]) {
      requestedTenureMonths = parseInt(args[i + 1], 10);
      i++;
    }
  }

  // ==========================================================================
  // STEP 1: CUSTOMER SELECTION & KYC PRE-FLIGHT
  // ==========================================================================
  console.log('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
  console.log('\x1b[1m\x1b[33m[STEP 1 / 6] CUSTOMER IDENTIFICATION & REGULATORY KYC VERIFICATION\x1b[0m');
  console.log('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');

  let customer: any = null;
  if (targetCustomerId) {
    customer = await prisma.customer.findFirst({
      where: { OR: [{ id: targetCustomerId }, { customerNumber: targetCustomerId }] },
      include: { kycRecords: true, bankAccounts: true },
    });
  }

  if (!customer) {
    // Pick latest active customer or create one on the fly
    customer = await prisma.customer.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
      include: { kycRecords: true, bankAccounts: true },
    });
  }

  if (!customer) {
    console.log('ℹ️  No existing customer found in database. Auto-creating a verified test customer...');
    const created = await createTestCustomer();
    customer = await prisma.customer.findUnique({
      where: { id: created.id },
      include: { kycRecords: true, bankAccounts: true },
    });
  }

  const kyc = customer.kycRecords?.[0];
  console.log(`\n👤 Primary Applicant  : \x1b[1m${customer.name}\x1b[0m (${customer.customerNumber})`);
  console.log(`📱 Contact Particulars: ${customer.mobile} | ${customer.email || 'N/A'}`);
  console.log(`🏢 Assigned Branch    : ${customer.branchName}`);
  console.log(`💼 Employment Profile : ${customer.occupation} @ ${customer.employerName}`);
  console.log(`💰 Verified Net Income: ₹${Number(customer.monthlyIncome).toLocaleString('en-IN')} / month`);
  console.log(`🪪 Government IDs     : PAN: ${customer.panMasked || 'N/A'} | Aadhaar: ${customer.aadhaarMasked || 'N/A'}`);
  console.log(`🛡️ KYC Verification   : \x1b[32m${kyc?.status || 'VERIFIED'} (${kyc?.kycLevel || 'TIER_3_FULL_CKYC'})\x1b[0m`);

  console.log('\n\x1b[90m📖 Banking Logic Note:\x1b[0m In compliance with RBI KYC Master Direction, loan origination');
  console.log('\x1b[90mcan only proceed for customers with valid PAN and verified identity/address proof.\x1b[0m\n');

  await sleep(600);

  // ==========================================================================
  // STEP 2: LOAN PRODUCT DISCOVERY & FINANCIAL MODELING
  // ==========================================================================
  console.log('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
  console.log('\x1b[1m\x1b[33m[STEP 2 / 6] LOAN PRODUCT DISCOVERY & AMORTIZATION FINANCIAL MODELING\x1b[0m');
  console.log('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');

  let product = await prisma.loanProduct.findFirst({
    where: { code: chosenProductCode },
  });

  if (!product) {
    product = await prisma.loanProduct.findFirst();
  }

  if (!product) {
    throw new Error('No loan products configured. Please run database seed first.');
  }

  // Adjust parameters to fit product boundaries if necessary
  const minAmt = Number(product.minAmount);
  const maxAmt = Number(product.maxAmount);
  if (requestedAmount < minAmt) requestedAmount = minAmt;
  if (requestedAmount > maxAmt) requestedAmount = maxAmt;
  if (requestedTenureMonths < product.minTenureMonths) requestedTenureMonths = product.minTenureMonths;
  if (requestedTenureMonths > product.maxTenureMonths) requestedTenureMonths = product.maxTenureMonths;

  const annualInterestRate = Number(product.baseInterestRate);
  const emi = calculateEmi(requestedAmount, annualInterestRate, requestedTenureMonths);
  const totalRepayment = emi * requestedTenureMonths;
  const totalInterest = totalRepayment - requestedAmount;

  console.log(`\n📦 Selected Product   : \x1b[1m${product.name}\x1b[0m (Code: ${product.code})`);
  console.log(`🏷️ Category           : ${product.category}`);
  console.log(`💵 Requested Loan     : \x1b[1m₹${requestedAmount.toLocaleString('en-IN')}\x1b[0m (Min: ₹${minAmt.toLocaleString('en-IN')} - Max: ₹${maxAmt.toLocaleString('en-IN')})`);
  console.log(`📅 Tenure             : \x1b[1m${requestedTenureMonths} Months (${(requestedTenureMonths / 12).toFixed(1)} Years)\x1b[0m`);
  console.log(`📊 Base Interest Rate : \x1b[32m${annualInterestRate}% p.a. (Reducing Balance)\x1b[0m`);
  console.log(`💳 Calculated EMI     : \x1b[32m\x1b[1m₹${emi.toLocaleString('en-IN')} / month\x1b[0m`);
  console.log(`📈 Total Interest     : ₹${totalInterest.toLocaleString('en-IN')}`);
  console.log(`🏦 Total Outflow      : ₹${totalRepayment.toLocaleString('en-IN')} across tenure`);

  console.log('\n\x1b[90m📖 Banking Logic Note:\x1b[0m Standard Equated Monthly Installment (EMI) reducing balance formula');
  console.log('\x1b[90mEMI = [P × r × (1 + r)^n] / [(1 + r)^n - 1] applies monthly amortization.\x1b[0m\n');

  await sleep(600);

  // ==========================================================================
  // STEP 3: APPLICATION INITIATION & DOCUMENT VAULT CHECKLIST
  // ==========================================================================
  console.log('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
  console.log('\x1b[1m\x1b[33m[STEP 3 / 6] APPLICATION DRAFT INITIATION & DOCUMENT CHECKLIST\x1b[0m');
  console.log('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');

  // Generate unique Application Number
  const allApps = await prisma.loanApplication.findMany({ select: { applicationNumber: true } });
  let maxAppSeq = 100;
  for (const a of allApps) {
    const match = a.applicationNumber?.match(/(\d+)(?!.*\d)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxAppSeq) maxAppSeq = num;
    }
  }
  const appSeq = maxAppSeq + 1;
  const applicationNumber = `APP-2026-${String(appSeq).padStart(6, '0')}`;

  const application = await prisma.loanApplication.create({
    data: {
      applicationNumber,
      customerId: customer.id,
      customerNumber: customer.customerNumber,
      customerName: customer.name,
      customerMobile: customer.mobile,
      customerEmail: customer.email,
      customerKycStatus: kyc?.status || 'VERIFIED',
      customerMonthlyIncome: customer.monthlyIncome,
      customerEmploymentType: customer.employmentType,
      customerExistingLoansCount: 0,
      customerTotalExposure: 0,
      productCode: product.code,
      productName: product.name,
      productId: product.id,
      requestedAmount,
      approvedAmount: requestedAmount,
      requestedTenureMonths,
      interestRate: annualInterestRate,
      repaymentFrequency: 'MONTHLY',
      preferredRepaymentDate: 5,
      purpose: product.category === 'HOME' ? 'Ready-to-move apartment purchase in Miramar' : 'Home renovation & interior refurbishment',
      purposeCategory: product.category,
      branchId: customer.branchId,
      branchName: customer.branchName,
      loanOfficer: 'Siddharth Rao',
      assignedOfficerId: 'usr_siddharth_rao',
      status: 'DRAFT',
      priority: 'HIGH',
      notes: 'Customer initiated application via Branch assisted portal.',
      submissionDeclarations: {
        incomeVerified: true,
        addressVerified: true,
        bureauConsentObtained: true,
        applicantDeclarationSigned: true,
      },
    },
  });

  console.log(`\n📝 Application Created: \x1b[32m\x1b[1m${application.applicationNumber}\x1b[0m (ID: ${application.id})`);
  console.log(`🔖 Initial Status     : \x1b[33mDRAFT\x1b[0m`);
  console.log(`🎯 Assigned Officer   : Siddharth Rao (Loan Officer)`);

  // Populate Document Checklist Requirements
  const sampleDocs = [
    { type: 'IDENTITY_PROOF', title: 'PAN & Aadhaar Identity Document', isMandatory: true, status: 'VERIFIED', fileName: `${customer.name.replace(/\s+/g, '_')}_PAN_KYC.pdf` },
    { type: 'ADDRESS_PROOF', title: 'Miramar Residential Electricity Bill', isMandatory: true, status: 'VERIFIED', fileName: 'EB_Bill_Current_Residence.pdf' },
    { type: 'INCOME_PROOF', title: 'Latest 3 Months Salary Slips & Form 16', isMandatory: true, status: 'VERIFIED', fileName: 'TCS_Salary_Slips_Q1_2026.pdf' },
    { type: 'BANK_STATEMENT', title: 'HDFC Salary Account Statement (6 Months)', isMandatory: true, status: 'VERIFIED', fileName: 'HDFC_Bank_Statement_6M.pdf' },
    { type: 'PROPERTY_DEED', title: 'Agreement for Sale / Builder NOC', isMandatory: product.category === 'HOME', status: 'VERIFIED', fileName: 'Sale_Deed_Sunshine_Residency.pdf' },
  ];

  for (const doc of sampleDocs) {
    await prisma.applicationDocument.create({
      data: {
        applicationId: application.id,
        documentType: doc.type,
        documentTitle: doc.title,
        source: 'CUSTOMER_KYC',
        isMandatory: doc.isMandatory,
        status: doc.status,
        fileName: doc.fileName,
        fileFormat: 'PDF',
        fileSizeKb: 1450,
        uploadedAt: new Date(),
        uploadedBy: 'Customer (DigiLocker / Portal)',
        verifiedAt: new Date(),
        verifiedBy: 'Siddharth Rao',
      },
    });
  }

  console.log('📎 Document Vault     : 5 Mandatory compliance documents initialized and pre-verified.');

  console.log('\n\x1b[90m📖 Banking Logic Note:\x1b[0m Core retail banking products mandate 100% document vault');
  console.log('\x1b[90mclearing before advancing to formal Underwriter evaluation.\x1b[0m\n');

  await sleep(600);

  // ==========================================================================
  // STEP 4: CREDIT BUREAU (CIBIL) & FOIR EVALUATION
  // ==========================================================================
  console.log('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
  console.log('\x1b[1m\x1b[33m[STEP 4 / 6] CREDIT BUREAU (CIBIL) REPORT PULL & FOIR ANALYSIS\x1b[0m');
  console.log('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');

  const bureauScore = customer.cibilScore || 780;
  const monthlyIncomeVal = Number(customer.monthlyIncome);
  const existingEmis = 5000; // Simulated minor existing credit obligation
  const proposedEmi = emi;
  const foirPercent = ((existingEmis + proposedEmi) / monthlyIncomeVal) * 100;

  console.log(`\n📡 Bureau Agency      : TransUnion CIBIL (Direct API Simulator)`);
  console.log(`⭐ Credit Score       : \x1b[32m\x1b[1m${bureauScore} / 900 (EXCELLENT)\x1b[0m`);
  console.log(`📊 DPD 30+ in 24 Mths : 0 Days (Clean payment track record)`);
  console.log(`📈 Active Accounts    : 1 (Credit Card, 0% overdue)`);
  console.log(`📉 Closed Accounts    : 2 (Auto Loan & Two Wheeler Loan closed with NOC)`);
  console.log(`🧮 Monthly Income     : ₹${monthlyIncomeVal.toLocaleString('en-IN')}`);
  console.log(`💳 Existing EMIs      : ₹${existingEmis.toLocaleString('en-IN')}`);
  console.log(`💳 Proposed Loan EMI  : ₹${proposedEmi.toLocaleString('en-IN')}`);
  console.log(`⚖️ Net FOIR / DTI     : \x1b[32m\x1b[1m${foirPercent.toFixed(1)}%\x1b[0m (Policy Limit: Max 55.0%)`);

  console.log('\n\x1b[90m📖 Banking Logic Note:\x1b[0m Fixed Obligation to Income Ratio (FOIR) ensures the borrower');
  console.log('\x1b[90mretains sufficient disposable income to avoid repayment delinquency.\x1b[0m\n');

  await sleep(600);

  // ==========================================================================
  // STEP 5: CREDIT UNDERWRITING ASSESSMENT & RECOMMENDATION
  // ==========================================================================
  console.log('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
  console.log('\x1b[1m\x1b[33m[STEP 5 / 6] UNDERWRITING ASSESSMENT & CREDIT DECISION\x1b[0m');
  console.log('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');

  const assessmentNumber = `ASM-2026-${String(appSeq).padStart(6, '0')}`;
  const assessment = await prisma.creditAssessment.create({
    data: {
      assessmentNumber,
      applicationId: application.id,
      applicationNumber: application.applicationNumber,
      customerId: customer.id,
      customerNumber: customer.customerNumber,
      customerName: customer.name,
      status: 'COMPLETED',
      riskCategory: 'LOW',
      creditScore: bureauScore,
      monthlyIncome: customer.monthlyIncome,
      existingObligations: existingEmis,
      proposedEmi,
      foirPercent: parseFloat(foirPercent.toFixed(2)),
      maxEligibleAmount: requestedAmount * 1.25,
      recommendedAmount: requestedAmount,
      recommendedTenure: requestedTenureMonths,
      recommendedRate: annualInterestRate,
      recommendationStatus: 'RECOMMEND_APPROVAL',
      rationale: `Applicant shows prime credit bureau score of ${bureauScore} with 0 DPD delinquencies. Clean banking transactions verified. Net FOIR at ${foirPercent.toFixed(1)}% is well below the 55% ceiling. Unanimously recommended for standard sanction.`,
      assignedOfficer: 'Siddharth Rao',
      completedAt: new Date(),
    },
  });

  console.log(`\n📋 Credit Assessment  : Completed (Assessment ID: ${assessment.id})`);
  console.log(`🎯 Recommendation     : \x1b[32m\x1b[1mRECOMMEND_APPROVE\x1b[0m`);
  console.log(`💵 Approved Amount    : \x1b[1m₹${requestedAmount.toLocaleString('en-IN')}\x1b[0m`);
  console.log(`📅 Approved Tenure    : \x1b[1m${requestedTenureMonths} Months\x1b[0m`);
  console.log(`📊 Approved Interest  : \x1b[32m${annualInterestRate}% p.a.\x1b[0m`);

  await sleep(600);

  // ==========================================================================
  // STEP 6: WORKFLOW STAGE ADVANCEMENT & AUDIT LOGGING
  // ==========================================================================
  console.log('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');
  console.log('\x1b[1m\x1b[33m[STEP 6 / 6] WORKFLOW ADVANCEMENT & COMPLIANCE AUDIT TRAIL\x1b[0m');
  console.log('\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m');

  // Advance application to APPROVED
  const updatedApp = await prisma.loanApplication.update({
    where: { id: application.id },
    data: {
      status: 'APPROVED',
      approvedAmount: requestedAmount,
      submittedAt: new Date(),
      submittedBy: 'Siddharth Rao (Loan Officer)',
    },
  });

  // Create Application History
  await prisma.applicationHistory.create({
    data: {
      applicationId: application.id,
      eventType: 'APPLICATION_APPROVED',
      action: 'APPLICATION_APPROVED',
      details: 'Credit Approval Sanctioned',
      description: `Loan application for ₹${requestedAmount.toLocaleString('en-IN')} approved by Underwriting. Ready for Sanction Letter issuance.`,
      actorName: 'Siddharth Rao',
      actorRole: 'Credit Officer / Underwriter',
    },
  });

  // Admin Audit Log
  const adminActor = await prisma.user.findFirst({ where: { role: { isSystem: true } } });
  if (adminActor) {
    await prisma.adminAuditLog.create({
      data: {
        actorId: adminActor.id,
        actorName: `${adminActor.firstName} ${adminActor.lastName}`,
        actorRole: 'System Administrator',
        entityType: 'APPLICATION',
        entityId: updatedApp.id,
        entityName: `${updatedApp.customerName} - ${updatedApp.applicationNumber}`,
        action: 'APPLICATION_APPROVED',
        details: `Approved loan of ₹${requestedAmount} at ${annualInterestRate}% for ${requestedTenureMonths} months.`,
        ipAddress: '127.0.0.1',
      },
    });
  }

  console.log(`\n🚀 Final Status       : \x1b[32m\x1b[1mAPPROVED\x1b[0m`);
  console.log(`📜 Application History: Timeline updated with approval milestone.`);
  console.log(`🔒 Regulatory Audit   : Admin compliance audit log recorded.`);

  await sleep(400);

  // ==========================================================================
  // TUTORIAL SUMMARY & NEXT STEPS
  // ==========================================================================
  console.log('\n\x1b[32m════════════════════════════════════════════════════════════════════════════\x1b[0m');
  console.log('\x1b[1m\x1b[32m🎉 TUTORIAL COMPLETE: LOAN APPLICATION READY FOR SANCTION & DISBURSEMENT\x1b[0m');
  console.log('\x1b[32m════════════════════════════════════════════════════════════════════════════\x1b[0m\n');

  console.log('┌──────────────────────────────────────────────────────────────────────────┐');
  console.log(`│ Application No : \x1b[32m${updatedApp.applicationNumber.padEnd(54)}\x1b[0m │`);
  console.log(`│ Applicant Name : ${customer.name.padEnd(54)} │`);
  console.log(`│ Product        : ${product.name.padEnd(54)} │`);
  console.log(`│ Sanction Amount: \x1b[1m₹${requestedAmount.toLocaleString('en-IN').padEnd(53)}\x1b[0m │`);
  console.log(`│ Tenure Months  : ${`${requestedTenureMonths} Months (${(requestedTenureMonths / 12).toFixed(1)} Years)`.padEnd(54)} │`);
  console.log(`│ Interest Rate  : \x1b[32m${`${annualInterestRate}% p.a. Reducing Balance`.padEnd(54)}\x1b[0m │`);
  console.log(`│ Equated EMI    : \x1b[32m\x1b[1m₹${emi.toLocaleString('en-IN')} / month`.padEnd(63) + '\x1b[0m │');
  console.log(`│ Status         : \x1b[32m\x1b[1mAPPROVED`.padEnd(63) + '\x1b[0m │');
  console.log('└──────────────────────────────────────────────────────────────────────────┘\n');

  console.log('📌 Next Downstream Banking Stages in LMS:');
  console.log('   1. Sanction Letter Generation (PDF with Key Fact Statement - KFS)');
  console.log('   2. Borrower Digital Acceptance & OTP / Aadhaar e-Sign');
  console.log('   3. NACH / e-Mandate Registration on Borrower Salary Account');
  console.log('   4. Pre-Disbursement Checklist Gatekeeper Validation');
  console.log('   5. Core Banking NEFT / RTGS Disbursal to Customer Account\n');
}

// Execute
if (require.main === module || process.argv[1]?.endsWith('application-tutorial.ts')) {
  runTutorial()
    .catch((err) => {
      console.error('\n❌ Tutorial failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
