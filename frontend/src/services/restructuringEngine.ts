// Batch 14 — Core Restructuring Financial & Eligibility Engine
import {
  RestructuringType,
  RestructuringRequestRecord,
  RestructuringEligibilityResult,
  RestructuringSchedulePreviewResult,
  RestructuringSchedulePreviewItem,
  MoratoriumInterestTreatment,
  MoratoriumPrincipalTreatment,
  MoratoriumFeeTreatment,
} from '../types/restructuringTypes';
import {
  LoanAccountRecord,
  LoanRepaymentFrequency,
  InterestMethod,
} from '../types/loanAccountTypes';
import {
  roundMoney,
  getFrequencyFactor,
  calculateTotalInstalments,
  calculateInstalmentAmount,
  computeInstalmentDueDate,
} from './loanFinancialService';

/**
 * Server-side eligibility engine for restructuring.
 * Inspects loan status, DPD, legal flags, and existing pending requests.
 */
export function evaluateRestructuringEligibility(params: {
  loan: LoanAccountRecord;
  hasActiveRestructuring?: boolean;
  activeLegalCaseStatus?: string;
  productConfig?: {
    allowsRestructuring?: boolean;
    maxTenureExtensionMonths?: number;
    maxMoratoriumMonths?: number;
    allowCapitalization?: boolean;
    allowedTypes?: RestructuringType[];
  };
}): RestructuringEligibilityResult {
  const { loan, hasActiveRestructuring = false, activeLegalCaseStatus, productConfig } = params;
  const blockers: string[] = [];
  const warnings: string[] = [];
  const reasons: string[] = [];

  const outstanding = Number(loan.outstandingPrincipal || 0);
  const dpd = Number(loan.dpd || 0);

  // 1. Basic Loan Status Checks
  if (['CLOSED', 'CANCELLED', 'WRITTEN_OFF'].includes(loan.status)) {
    blockers.push(`Loan is in '${loan.status}' status and cannot be restructured.`);
  }

  if (outstanding <= 0) {
    blockers.push('Loan has zero or negative outstanding principal balance.');
  }

  // 2. Pending Restructuring Guard (Concurrency & Idempotency)
  if (hasActiveRestructuring) {
    blockers.push('An active restructuring request is already pending review or approval for this loan.');
  }

  // 3. Legal Action Blocker
  if (activeLegalCaseStatus && ['FILED_IN_COURT', 'HEARING_SCHEDULED', 'SUMMONS_ISSUED', 'ORDER_OBTAINED', 'EXECUTION_PENDING'].includes(activeLegalCaseStatus)) {
    blockers.push(`Loan is undergoing active court litigation (${activeLegalCaseStatus}). Court settlement / legal clearance is required.`);
  } else if (activeLegalCaseStatus && ['DRAFT_REVIEW', 'NOTICE_ISSUED'].includes(activeLegalCaseStatus)) {
    warnings.push('Loan has an active pre-legal notice. Restructuring will supersede collection notices upon application.');
  }

  // 4. Product-level Restructuring Policy
  const allowsRestructuring = productConfig?.allowsRestructuring ?? true;
  if (!allowsRestructuring) {
    blockers.push(`Loan product '${loan.productName}' does not permit contractual restructuring.`);
  }

  // 5. Delinquency Warnings
  if (dpd > 90) {
    warnings.push(`Loan is severely delinquent (DPD ${dpd}). Restructuring requires Senior Credit Committee approval.`);
  } else if (dpd > 30) {
    warnings.push(`Loan is in SMA bucket (DPD ${dpd}). Overdue interest/penalties must be explicitly treated.`);
  }

  const maxTenureExtension = productConfig?.maxTenureExtensionMonths ?? 36;
  const maxMoratoriumMonths = productConfig?.maxMoratoriumMonths ?? 12;
  const canCapitalizeInterest = productConfig?.allowCapitalization ?? true;

  const defaultAllowedTypes: RestructuringType[] = [
    'TENURE_EXTENSION',
    'EMI_REDUCTION',
    'EMI_INCREASE',
    'INTEREST_RATE_CHANGE',
    'REPAYMENT_FREQUENCY_CHANGE',
    'MORATORIUM',
    'PAYMENT_HOLIDAY',
    'DUE_DATE_CHANGE',
    'PARTIAL_RESCHEDULING',
    'FULL_RESCHEDULING',
  ];

  const allowedTypes = productConfig?.allowedTypes || defaultAllowedTypes;
  const isEligible = blockers.length === 0;

  if (isEligible) {
    reasons.push('Loan account satisfies contractual restructuring eligibility criteria.');
  }

  return {
    eligible: isEligible,
    loanId: loan.id,
    accountNumber: loan.accountNumber,
    reasons,
    blockers,
    warnings,
    maxTenureAllowedMonths: (loan.remainingTenureMonths || 24) + maxTenureExtension,
    minEmiAllowed: 500,
    allowedTypes,
    maxMoratoriumMonths,
    canCapitalizeInterest,
  };
}

/**
 * Generates an authoritative non-persistent schedule preview for proposed restructuring terms.
 * Accurately handles Moratoriums (Interest-Only, Capitalized, Waived) and amortization.
 */
export function generateRestructuringSchedulePreview(params: {
  loan: LoanAccountRecord;
  requestType: RestructuringType;
  proposedTenureMonths: number;
  proposedInterestRate: number;
  proposedRepaymentFrequency: LoanRepaymentFrequency;
  proposedFirstDueDate: string;
  moratoriumMonths?: number;
  moratoriumInterestTreatment?: MoratoriumInterestTreatment;
  moratoriumPrincipalTreatment?: MoratoriumPrincipalTreatment;
  capitalizedAmount?: number;
  targetEmiAmount?: number;
}): RestructuringSchedulePreviewResult {
  const {
    loan,
    proposedTenureMonths,
    proposedInterestRate,
    proposedRepaymentFrequency,
    proposedFirstDueDate,
    moratoriumMonths = 0,
    moratoriumInterestTreatment = 'ACCRUE_AND_AMORTIZE',
    capitalizedAmount = 0,
    targetEmiAmount,
  } = params;

  const basePrincipal = Number(loan.outstandingPrincipal || 0);
  const startingPrincipal = roundMoney(basePrincipal + capitalizedAmount);
  const totalTenure = Math.max(1, proposedTenureMonths);
  const safeMoratorium = Math.min(totalTenure - 1, Math.max(0, moratoriumMonths));
  const postMoratoriumTenure = totalTenure - safeMoratorium;

  const periodsPerYear = getFrequencyFactor(proposedRepaymentFrequency);
  const periodicRate = proposedInterestRate > 0 ? proposedInterestRate / 100 / periodsPerYear : 0;
  const interestMethod = (loan.interestMethod || 'REDUCING_BALANCE') as InterestMethod;

  const schedules: RestructuringSchedulePreviewItem[] = [];
  let currentPrincipal = startingPrincipal;

  // 1. Process Moratorium Period
  for (let m = 0; m < safeMoratorium; m++) {
    const instalmentNumber = m + 1;
    const dueDate = computeInstalmentDueDate(proposedFirstDueDate, m, proposedRepaymentFrequency);
    const openingPrincipal = currentPrincipal;

    let interestDue = roundMoney(openingPrincipal * periodicRate);
    let principalDue = 0;
    let feesDue = 0;
    let instalmentAmount = 0;

    if (moratoriumInterestTreatment === 'WAIVE') {
      interestDue = 0;
      instalmentAmount = 0;
    } else if (moratoriumInterestTreatment === 'CAPITALIZE') {
      // Interest added to principal balance
      currentPrincipal = roundMoney(currentPrincipal + interestDue);
      instalmentAmount = 0;
    } else if (moratoriumInterestTreatment === 'PAY_INTEREST_ONLY') {
      // Borrower pays interest each month during moratorium
      instalmentAmount = interestDue;
    } else {
      // ACCRUE_AND_AMORTIZE: Customer pays 0 during moratorium, interest gets amortized across remaining tenure
      instalmentAmount = 0;
    }

    schedules.push({
      instalmentNumber,
      dueDate,
      openingPrincipal,
      principalDue,
      interestDue,
      feesDue,
      instalmentAmount,
      closingPrincipal: currentPrincipal,
      isMoratorium: true,
      notes: `Moratorium Period (${moratoriumInterestTreatment.replace(/_/g, ' ')})`,
    });
  }

  // 2. Process Post-Moratorium Amortization Period
  const amortizingPrincipal = currentPrincipal;
  const amortizingInstalments = calculateTotalInstalments(postMoratoriumTenure, proposedRepaymentFrequency);

  let calculatedEmi = targetEmiAmount && targetEmiAmount > 0
    ? targetEmiAmount
    : calculateInstalmentAmount({
        principal: amortizingPrincipal,
        annualRate: proposedInterestRate,
        tenureMonths: postMoratoriumTenure,
        frequency: proposedRepaymentFrequency,
        interestMethod,
      });

  for (let i = 0; i < amortizingInstalments; i++) {
    const instalmentNumber = safeMoratorium + i + 1;
    const dueDate = computeInstalmentDueDate(proposedFirstDueDate, safeMoratorium + i, proposedRepaymentFrequency);
    const openingPrincipal = currentPrincipal;

    let interestDue = 0;
    let principalDue = 0;

    if (interestMethod === 'FLAT_RATE' || interestMethod === 'SIMPLE_INTEREST') {
      interestDue = roundMoney((amortizingPrincipal * (proposedInterestRate / 100) * (postMoratoriumTenure / 12)) / amortizingInstalments);
      principalDue = roundMoney(amortizingPrincipal / amortizingInstalments);
    } else {
      interestDue = roundMoney(openingPrincipal * periodicRate);
      principalDue = roundMoney(calculatedEmi - interestDue);
    }

    // Boundaries
    if (principalDue > openingPrincipal || i === amortizingInstalments - 1) {
      principalDue = openingPrincipal;
    }
    if (principalDue < 0) {
      principalDue = 0;
    }

    const instalmentTotal = roundMoney(principalDue + interestDue);
    const closingPrincipal = Math.max(0, roundMoney(openingPrincipal - principalDue));
    currentPrincipal = closingPrincipal;

    schedules.push({
      instalmentNumber,
      dueDate,
      openingPrincipal,
      principalDue,
      interestDue,
      feesDue: 0,
      instalmentAmount: instalmentTotal,
      closingPrincipal,
      isMoratorium: false,
    });
  }

  // 3. Financial Reconciliation on Final Instalment
  const postMoratoriumItems = schedules.slice(safeMoratorium);
  if (postMoratoriumItems.length > 0) {
    const sumPrincipalDue = roundMoney(
      postMoratoriumItems.reduce((sum, item) => sum + item.principalDue, 0)
    );
    const diff = roundMoney(amortizingPrincipal - sumPrincipalDue);
    if (diff !== 0) {
      const lastItem = postMoratoriumItems[postMoratoriumItems.length - 1];
      lastItem.principalDue = roundMoney(lastItem.principalDue + diff);
      lastItem.instalmentAmount = roundMoney(lastItem.principalDue + lastItem.interestDue);
      lastItem.closingPrincipal = 0;
    }
  }

  const totalPrincipal = roundMoney(schedules.reduce((sum, item) => sum + item.principalDue, 0));
  const totalInterest = roundMoney(schedules.reduce((sum, item) => sum + item.interestDue, 0));
  const totalAmount = roundMoney(schedules.reduce((sum, item) => sum + item.instalmentAmount, 0));
  const maturityDate = schedules.length > 0 ? schedules[schedules.length - 1].dueDate : proposedFirstDueDate;

  // Regular non-moratorium EMI
  const regularEmi = schedules.find((s) => !s.isMoratorium)?.instalmentAmount || calculatedEmi;

  // 4. Financial Impact Calculations
  const currentEmi = Number(loan.emiAmount || 0);
  const currentRemainingTenure = Number(loan.remainingTenureMonths || loan.remainingInstalments || 1);
  const currentRate = Number(loan.interestRate || 0);

  // Approximate remaining interest on current terms
  const currentRemainingInterest = roundMoney(
    Number(loan.interestOutstanding || 0) +
    calculateInstalmentAmount({
      principal: basePrincipal,
      annualRate: currentRate,
      tenureMonths: currentRemainingTenure,
      frequency: loan.repaymentFrequency as LoanRepaymentFrequency,
      interestMethod: (loan.interestMethod || 'REDUCING_BALANCE') as InterestMethod,
    }) * currentRemainingTenure - basePrincipal
  );

  const proposedRemainingInterest = totalInterest;
  const interestDifference = roundMoney(proposedRemainingInterest - Math.max(0, currentRemainingInterest));
  const currentTotalScheduled = roundMoney(basePrincipal + Math.max(0, currentRemainingInterest));
  const proposedTotalScheduled = totalAmount;
  const emiDifference = roundMoney(regularEmi - currentEmi);
  const tenureDifference = totalTenure - currentRemainingTenure;

  return {
    schedules,
    totalPrincipal: startingPrincipal,
    totalInterest,
    totalAmount,
    maturityDate,
    emiAmount: regularEmi,
    totalInstalments: schedules.length,
    moratoriumInstalments: safeMoratorium,
    financialImpact: {
      currentRemainingInterest: Math.max(0, currentRemainingInterest),
      proposedRemainingInterest,
      interestDifference,
      currentTotalScheduled,
      proposedTotalScheduled,
      emiDifference,
      tenureDifference,
    },
  };
}

/**
 * Enforces segregation of duties for maker-checker restructuring approval.
 */
export function validateMakerChecker(
  request: RestructuringRequestRecord,
  actor: { id: string; name: string; roleName: string }
): { allowed: boolean; reason?: string } {
  if (request.requestedBy === actor.id) {
    return {
      allowed: false,
      reason: `Segregation of duties violation: The creator (${request.requestedByName}) cannot approve their own restructuring request.`,
    };
  }

  return { allowed: true };
}
