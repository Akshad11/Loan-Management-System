// Automated Verification Test Suite for Loan Product & Custom Application Form Builder
import {
  evaluateFieldVisibility,
  validateFormResponses,
  calculateFormProgress,
  evaluateCalculatedField,
} from '../services/formEngine';
import {
  FormSchemaDefinition,
  FormFieldDefinition,
  SignatureCaptureData,
} from '../types/formBuilderTypes';
import { HOME_LOAN_FORM_SCHEMA } from '../config/systemTemplates';

function runTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 LOAN PRODUCT & CUSTOM FORM BUILDER TEST SUITE');
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

  // --- Test 1: Schema Structure & Multi-Page Validation ---
  console.log('--- Test 1: Multi-Page Schema Integrity ---');
  assert(HOME_LOAN_FORM_SCHEMA.pages.length === 5, `Home Loan schema has 5 multi-page steps (Got: ${HOME_LOAN_FORM_SCHEMA.pages.length})`);
  assert(HOME_LOAN_FORM_SCHEMA.pages[0].title === 'Personal & Identity Information', 'Page 1 is Personal Information');
  assert(HOME_LOAN_FORM_SCHEMA.pages[4].title === 'Declaration & Digital Signature', 'Page 5 is Declaration & Signature');

  // --- Test 2: Dynamic Conditional Visibility Engine ---
  console.log('\n--- Test 2: Dynamic Conditional Logic ---');
  const coapplicantField: FormFieldDefinition = {
    id: 'coapplicant_name',
    type: 'TEXT',
    label: 'Co-applicant Name',
    width: '1_COL',
    condition: {
      dependentFieldId: 'has_coapplicant',
      operator: 'EQUALS',
      triggerValue: 'Yes',
      action: 'SHOW',
    },
  };

  // Case A: has_coapplicant = 'No' -> field should be HIDDEN
  const isVisibleWhenNo = evaluateFieldVisibility(coapplicantField, { has_coapplicant: 'No' });
  assert(!isVisibleWhenNo, 'Co-applicant field is hidden when has_coapplicant === "No"');

  // Case B: has_coapplicant = 'Yes' -> field should be VISIBLE
  const isVisibleWhenYes = evaluateFieldVisibility(coapplicantField, { has_coapplicant: 'Yes' });
  assert(isVisibleWhenYes, 'Co-applicant field is visible when has_coapplicant === "Yes"');

  // Case C: Numerical Greater Than Condition
  const highIncomeAuditField: FormFieldDefinition = {
    id: 'tax_audit_report',
    type: 'FILE',
    label: 'Tax Audit Report',
    width: 'FULL_WIDTH',
    condition: {
      dependentFieldId: 'annual_revenue',
      operator: 'GREATER_THAN',
      triggerValue: 10000000, // 1 Crore
      action: 'SHOW',
    },
  };
  assert(!evaluateFieldVisibility(highIncomeAuditField, { annual_revenue: 5000000 }), 'Tax audit hidden for revenue <= 1 Cr');
  assert(evaluateFieldVisibility(highIncomeAuditField, { annual_revenue: 15000000 }), 'Tax audit visible for revenue > 1 Cr');

  // --- Test 3: Form Validation & Required Field Checks ---
  console.log('\n--- Test 3: Client & Server Field Validation ---');
  const testSchema: FormSchemaDefinition = {
    pages: [
      {
        id: 'p1',
        pageNumber: 1,
        title: 'Step 1',
        sections: [
          {
            id: 's1',
            fields: [
              { id: 'full_name', type: 'TEXT', label: 'Full Name', required: true, width: '1_COL', validation: { minLength: 3 } },
              { id: 'pan_num', type: 'TEXT', label: 'PAN', required: true, width: '1_COL', validation: { regexPattern: '^[A-Z]{5}[0-9]{4}[A-Z]{1}$' } },
              { id: 'loan_amount', type: 'CURRENCY', label: 'Loan Amount', required: true, width: '1_COL', validation: { minValue: 100000, maxValue: 5000000 } },
              { id: 'sig_main', type: 'SIGNATURE', label: 'Signature', required: true, width: 'FULL_WIDTH' },
            ],
          },
        ],
      },
    ],
  };

  // Case A: Empty responses
  const emptyValidation = validateFormResponses({
    schema: testSchema,
    responses: {},
    isFinalSubmit: true,
  });
  assert(!emptyValidation.isValid, 'Empty responses fail validation');
  assert(!!emptyValidation.errors.full_name, 'Full name required error generated');
  assert(!!emptyValidation.errors.pan_num, 'PAN required error generated');

  // Case B: Invalid PAN regex & below min amount
  const invalidValidation = validateFormResponses({
    schema: testSchema,
    responses: {
      full_name: 'Rajesh',
      pan_num: 'INVALID_PAN_123',
      loan_amount: 50000, // Below min 100,000
    },
    isFinalSubmit: true,
  });
  assert(!invalidValidation.isValid, 'Invalid PAN and under-limit amount fail validation');
  assert(invalidValidation.errors.pan_num?.includes('Invalid format'), 'PAN format validation regex triggered');
  assert(invalidValidation.errors.loan_amount?.includes('cannot be less than 100000'), 'Min value validation triggered');

  // Case C: Valid responses with valid signature
  const mockSignature: SignatureCaptureData = {
    signatureDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    signedAt: new Date().toISOString(),
    signerName: 'Rajesh Kumar',
    signerRole: 'Borrower',
  };

  const validValidation = validateFormResponses({
    schema: testSchema,
    responses: {
      full_name: 'Rajesh Kumar',
      pan_num: 'ABCDE1234F',
      loan_amount: 1500000,
    },
    signatures: {
      sig_main: mockSignature,
    },
    isFinalSubmit: true,
  });
  assert(validValidation.isValid, 'Valid inputs with digital signature pass validation completely');

  // --- Test 4: Dynamic Calculated Fields ---
  console.log('\n--- Test 4: Dynamic Calculated Field Arithmetic ---');
  const formula1 = '{property_cost} * 0.8';
  const calcLTV = evaluateCalculatedField(formula1, { property_cost: 5000000 });
  assert(calcLTV === 4000000, `80% LTV of 50 Lakhs correctly calculated as 40 Lakhs (Got: ${calcLTV})`);

  const formula2 = '({annual_income} / 12) * 0.5';
  const calcMaxEMI = evaluateCalculatedField(formula2, { annual_income: 1200000 });
  assert(calcMaxEMI === 50000, `50% FOIR max EMI on 12L annual income calculated as 50,000 (Got: ${calcMaxEMI})`);

  // --- Test 5: Form Progress Calculation ---
  console.log('\n--- Test 5: Completion Progress Tracking ---');
  const halfProgress = calculateFormProgress({
    schema: testSchema,
    responses: {
      full_name: 'Rajesh Kumar',
      pan_num: 'ABCDE1234F',
    },
    signatures: {},
  });
  assert(halfProgress.overallPercentage === 50, `2 of 4 required fields completed = 50% (Got: ${halfProgress.overallPercentage}%)`);

  console.log('\n======================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} FORM BUILDER VERIFICATION TESTS PASSED`);
  console.log('======================================================\n');
}

runTestSuite();
