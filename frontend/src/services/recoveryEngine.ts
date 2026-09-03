// Batch 13 — Core Server-Side Recovery & Legal Engine
import { LoanAccountRecord } from '../types/loanAccountTypes';
import {
  RecoveryCaseRecord,
  RecoveryPriority,
  RecoveryStage,
  RecoveryStatus,
  LegalNoticeType,
} from '../types/recoveryTypes';
import { roundMoney } from './loanFinancialService';
import { formatCurrencyINR, formatDate } from '../utils/formatters';

export interface EligibilityResult {
  isEligible: boolean;
  score: number;
  priority: RecoveryPriority;
  recommendedStage: RecoveryStage;
  triggers: string[];
  blockers: string[];
}

/**
 * Server-side evaluation of whether a loan is eligible for Recovery escalation
 */
export function evaluateRecoveryEligibility(
  loan: LoanAccountRecord,
  failedPtpCount: number = 0,
  previousCollectionAttempts: number = 0
): EligibilityResult {
  const triggers: string[] = [];
  const blockers: string[] = [];

  if (loan.status === 'CLOSED' || loan.status === 'CANCELLED') {
    blockers.push(`Loan is ${loan.status} and cannot be escalated to Recovery.`);
    return {
      isEligible: false,
      score: 0,
      priority: 'LOW',
      recommendedStage: 'EARLY_RECOVERY',
      triggers,
      blockers,
    };
  }

  if (loan.totalOutstanding <= 0) {
    blockers.push('Loan has zero outstanding balance.');
    return {
      isEligible: false,
      score: 0,
      priority: 'LOW',
      recommendedStage: 'EARLY_RECOVERY',
      triggers,
      blockers,
    };
  }

  if (loan.overdueAmount <= 0 && loan.dpd <= 0) {
    blockers.push('Loan is currently up-to-date with no overdue installments.');
    return {
      isEligible: false,
      score: 0,
      priority: 'LOW',
      recommendedStage: 'EARLY_RECOVERY',
      triggers,
      blockers,
    };
  }

  let score = 0;

  // DPD Evaluation
  if (loan.dpd >= 90) {
    score += 50;
    triggers.push(`Severe Delinquency: ${loan.dpd} DPD (NPA classification)`);
  } else if (loan.dpd >= 60) {
    score += 35;
    triggers.push(`High Delinquency: ${loan.dpd} DPD (SMA-2 classification)`);
  } else if (loan.dpd >= 30) {
    score += 20;
    triggers.push(`Moderate Delinquency: ${loan.dpd} DPD (SMA-1 classification)`);
  }

  // Failed PTPs
  if (failedPtpCount >= 2) {
    score += 25;
    triggers.push(`Repeated Broken Promises: ${failedPtpCount} failed PTPs recorded`);
  } else if (failedPtpCount === 1) {
    score += 10;
    triggers.push('Broken Promise: 1 failed PTP on record');
  }

  // Overdue volume
  if (loan.overdueAmount >= 50000) {
    score += 20;
    triggers.push(`Significant Overdue Amount: ₹${loan.overdueAmount.toLocaleString('en-IN')}`);
  } else if (loan.overdueAmount >= 15000) {
    score += 10;
    triggers.push(`Moderate Overdue Amount: ₹${loan.overdueAmount.toLocaleString('en-IN')}`);
  }

  // Previous unresponsiveness
  if (previousCollectionAttempts >= 4) {
    score += 15;
    triggers.push(`Multiple Unresponsive Attempts: ${previousCollectionAttempts} tele/field contacts`);
  }

  const isEligible = score >= 30 || loan.dpd >= 60 || failedPtpCount >= 2;

  // Determine Priority
  let priority: RecoveryPriority = 'LOW';
  if (score >= 65 || loan.dpd >= 90) {
    priority = 'CRITICAL';
  } else if (score >= 45 || loan.dpd >= 60) {
    priority = 'HIGH';
  } else if (score >= 25 || loan.dpd >= 30) {
    priority = 'MEDIUM';
  }

  // Determine Recommended Stage
  let recommendedStage: RecoveryStage = 'EARLY_RECOVERY';
  if (loan.dpd >= 90 || (loan.dpd >= 60 && failedPtpCount >= 2)) {
    recommendedStage = 'PRE_LEGAL';
  } else if (loan.dpd >= 60) {
    recommendedStage = 'HARD_RECOVERY';
  }

  return {
    isEligible,
    score,
    priority,
    recommendedStage,
    triggers,
    blockers,
  };
}

/**
 * Calculates recovery priority deterministically
 */
export function calculateRecoveryPriority(
  dpd: number,
  overdueAmount: number,
  failedPtpCount: number = 0
): RecoveryPriority {
  if (dpd >= 90 || overdueAmount >= 75000 || (dpd >= 60 && failedPtpCount >= 2)) {
    return 'CRITICAL';
  }
  if (dpd >= 60 || overdueAmount >= 30000 || failedPtpCount >= 1) {
    return 'HIGH';
  }
  if (dpd >= 30 || overdueAmount >= 10000) {
    return 'MEDIUM';
  }
  return 'LOW';
}

/**
 * Checks if a recovery case is cured following repayment posting
 */
export function evaluateAutoCure(
  recoveryCase: RecoveryCaseRecord,
  loan: LoanAccountRecord
): { isCured: boolean; newStatus?: RecoveryStatus; newStage?: RecoveryStage; reason?: string } {
  if (
    recoveryCase.status === 'CURED' ||
    recoveryCase.status === 'RESOLVED' ||
    recoveryCase.status === 'CLOSED'
  ) {
    return { isCured: false };
  }

  // Account is cured if overdue is 0 and DPD is 0
  if (loan.overdueAmount <= 0 && loan.dpd <= 0) {
    return {
      isCured: true,
      newStatus: 'CURED',
      newStage: 'RESOLVED',
      reason: `Account cured. Total overdue cleared by payments. Returning to normal portfolio servicing.`,
    };
  }

  return { isCured: false };
}

/**
 * Generates official statutory notice legal text from real borrower and loan records
 */
export function generateStatutoryNoticeText(params: {
  noticeType: LegalNoticeType;
  customerName: string;
  customerAddress: string;
  accountNumber: string;
  disbursementDate: string;
  originalPrincipal: number;
  overdueAmount: number;
  principalOutstanding: number;
  interestOutstanding: number;
  feeOutstanding: number;
  penaltyOutstanding: number;
  totalOutstanding: number;
  curePeriodDays: number;
  noticeDate: string;
  dueDate: string;
  lenderName?: string;
  customClauses?: string;
}): string {
  const lender = params.lenderName || 'APEX COMMERCIAL FINANCE LIMITED';

  if (params.noticeType === 'SECTION_138_CHEQUE_BOUNCE') {
    return `
STATUTORY LEGAL NOTICE UNDER SECTION 138 OF THE NEGOTIABLE INSTRUMENTS ACT, 1881
--------------------------------------------------------------------------------
Date: ${formatDate(params.noticeDate)}
Registered Post A.D. / Speed Post

TO:
${params.customerName}
${params.customerAddress}

SUBJECT: STATUTORY DEMAND NOTICE FOR DISHONOUR OF CHEQUE / ELECTRONIC NACH MANDATE TOWARDS LOAN ACCOUNT NO. ${params.accountNumber}

Sir/Madam,

Under instructions and on behalf of our client, ${lender}, having its corporate office at Panaji, Goa, we hereby serve upon you this Statutory Legal Notice:

1. That you, the Noticee, availed credit facilities under Loan Account Number ${params.accountNumber} disbursed on ${formatDate(params.disbursementDate)} for an amount of ${formatCurrencyINR(params.originalPrincipal)}.

2. That towards the discharge of your legally enforceable debt and monthly installment obligations, an auto-debit / negotiable instrument for the payment of overdue dues was presented for clearance.

3. That the said instrument was returned dishonoured and unpaid by your drawee bank with the endorsement "INSUFFICIENT FUNDS / ACCOUNT FROZEN".

4. That as of ${formatDate(params.noticeDate)}, the total overdue amount in default stands at ${formatCurrencyINR(params.overdueAmount)} (Total Exposure: ${formatCurrencyINR(params.totalOutstanding)} comprising Principal: ${formatCurrencyINR(params.principalOutstanding)}, Interest: ${formatCurrencyINR(params.interestOutstanding)}, Charges: ${formatCurrencyINR(params.feeOutstanding + params.penaltyOutstanding)}).

5. We therefore call upon you to pay the aforesaid sum of ${formatCurrencyINR(params.overdueAmount)} within FIFTEEN (15) DAYS from the date of receipt of this notice, failing which our client shall initiate criminal prosecution against you under Section 138 of the Negotiable Instruments Act, 1881, and Section 25 of the Payment and Settlement Systems Act, 2007, at your sole risk, cost, and consequences.

${params.customClauses ? `\nSPECIAL CLAUSE:\n${params.customClauses}\n` : ''}

Yours faithfully,
For and on behalf of ${lender}
Legal & Remedial Services Department
    `.trim();
  }

  // Standard Loan Recall & Demand Notice
  return `
FORMAL LOAN RECALL AND STATUTORY DEMAND NOTICE
--------------------------------------------------------------------------------
Date: ${formatDate(params.noticeDate)}

TO:
${params.customerName}
${params.customerAddress}

SUBJECT: RECALL OF LOAN FACILITY & DEMAND FOR IMMEDIATE PAYMENT — LOAN ACCOUNT NO. ${params.accountNumber}

Dear Sir/Madam,

We write on behalf of ${lender} in connection with the Loan Facility availed by you under Loan Agreement No. ${params.accountNumber}:

1. DEFAULT OF REPAYMENT:
You have consistently committed repeated material defaults in the repayment of scheduled monthly installments. Despite multiple tele-calling reminders and field visits by our recovery officers, you have neglected and failed to regularize your loan account.

2. STATEMENT OF OUTSTANDING DUES AS OF ${formatDate(params.noticeDate)}:
- Principal Outstanding: ${formatCurrencyINR(params.principalOutstanding)}
- Interest Overdue: ${formatCurrencyINR(params.interestOutstanding)}
- Penal Charges & Overdue Interest: ${formatCurrencyINR(params.penaltyOutstanding)}
- Administrative / Legal Charges: ${formatCurrencyINR(params.feeOutstanding)}
--------------------------------------------------------------------------------
TOTAL AMOUNT DUE AND PAYABLE: ${formatCurrencyINR(params.totalOutstanding)}
--------------------------------------------------------------------------------

3. LOAN RECALL & DEMAND:
In terms of the Loan Agreement, our client hereby RECALLS the entire loan facility with immediate effect and demands payment of ${formatCurrencyINR(params.totalOutstanding)} within ${params.curePeriodDays} days (i.e. on or before ${formatDate(params.dueDate)}).

4. CONSEQUENCES OF NON-COMPLIANCE:
Please take note that in the event of your failure to make payment as demanded, our client shall be constrained to institute appropriate civil, arbitral, and statutory legal recovery proceedings before the competent Court of Law for recovery of the entire debt along with pendente lite and future interest at contractual rates, entirely at your risk as to costs and consequences.

${params.customClauses ? `\nADDITIONAL INSTRUCTIONS:\n${params.customClauses}\n` : ''}

Yours faithfully,
Authorized Signatory / Legal Department
${lender}
  `.trim();
}
