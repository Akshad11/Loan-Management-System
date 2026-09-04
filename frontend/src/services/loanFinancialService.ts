// Batch 10 — Deterministic Loan Financial & Schedule Calculation Service
import {
  InterestMethod,
  LoanRepaymentFrequency,
  RepaymentScheduleItem,
  RepaymentScheduleVersion,
} from '../types/loanAccountTypes';

/**
 * Decimal-safe rounding utility to 2 decimal places.
 * Eliminates binary floating-point representation quirks (e.g. 0.1 + 0.2 = 0.30000000000000004).
 */
export function roundMoney(value: number): number {
  if (value === undefined || value === null || isNaN(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Returns the annual frequency factor (number of instalments per year).
 */
export function getFrequencyFactor(frequency: LoanRepaymentFrequency): number {
  switch (frequency) {
    case 'WEEKLY':
      return 52;
    case 'BI_WEEKLY':
      return 26;
    case 'QUARTERLY':
      return 4;
    case 'MONTHLY':
    default:
      return 12;
  }
}

/**
 * Computes the total number of instalments for a given tenure in months and frequency.
 */
export function calculateTotalInstalments(
  tenureMonths: number,
  frequency: LoanRepaymentFrequency
): number {
  const safeTenure = Math.max(1, tenureMonths);
  switch (frequency) {
    case 'WEEKLY':
      return Math.round((safeTenure * 52) / 12);
    case 'BI_WEEKLY':
      return Math.round((safeTenure * 26) / 12);
    case 'QUARTERLY':
      return Math.max(1, Math.round(safeTenure / 3));
    case 'MONTHLY':
    default:
      return safeTenure;
  }
}

/**
 * Calculates deterministic periodic EMI / Instalment amount.
 */
export function calculateInstalmentAmount(params: {
  principal: number;
  annualRate: number; // e.g. 14.0 for 14% p.a.
  tenureMonths: number;
  frequency: LoanRepaymentFrequency;
  interestMethod: InterestMethod;
}): number {
  const { principal, annualRate, tenureMonths, frequency, interestMethod } = params;
  if (principal <= 0) return 0;

  const n = calculateTotalInstalments(tenureMonths, frequency);
  if (n <= 0) return principal;

  // Zero interest rate handling
  if (annualRate <= 0) {
    return roundMoney(principal / n);
  }

  const periodsPerYear = getFrequencyFactor(frequency);
  const r = annualRate / 100 / periodsPerYear;

  if (interestMethod === 'FLAT_RATE' || interestMethod === 'SIMPLE_INTEREST') {
    const tenureYears = tenureMonths / 12;
    const totalInterest = principal * (annualRate / 100) * tenureYears;
    const totalPayable = principal + totalInterest;
    return roundMoney(totalPayable / n);
  }

  // Standard Reducing Balance (Amortized EMI)
  // EMI = P * r * (1+r)^n / ((1+r)^n - 1)
  const compound = Math.pow(1 + r, n);
  const numerator = principal * r * compound;
  const denominator = compound - 1;

  if (denominator === 0 || isNaN(denominator)) {
    return roundMoney(principal / n);
  }

  return roundMoney(numerator / denominator);
}

/**
 * Calculates a specific due date given the start date and instalment number.
 */
export function computeInstalmentDueDate(
  firstDueDateStr: string,
  instalmentIndex: number, // 0-indexed: 0 is the 1st instalment
  frequency: LoanRepaymentFrequency
): string {
  const date = new Date(firstDueDateStr);
  if (isNaN(date.getTime())) {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 30 * (instalmentIndex + 1));
    return fallback.toISOString().split('T')[0];
  }

  if (instalmentIndex === 0) {
    return date.toISOString().split('T')[0];
  }

  const result = new Date(date);
  switch (frequency) {
    case 'WEEKLY':
      result.setDate(result.getDate() + instalmentIndex * 7);
      break;
    case 'BI_WEEKLY':
      result.setDate(result.getDate() + instalmentIndex * 14);
      break;
    case 'QUARTERLY':
      result.setMonth(result.getMonth() + instalmentIndex * 3);
      break;
    case 'MONTHLY':
    default: {
      const targetMonth = date.getMonth() + instalmentIndex;
      const originalDay = date.getDate();
      result.setMonth(targetMonth);
      // Handle month end clipping (e.g. 31st Jan -> 28th Feb)
      if (result.getDate() !== originalDay) {
        result.setDate(0); // Move to last day of previous month
      }
      break;
    }
  }

  return result.toISOString().split('T')[0];
}

export interface ScheduleGenerationResult {
  version: RepaymentScheduleVersion;
  schedules: RepaymentScheduleItem[];
  totalPrincipal: number;
  totalInterest: number;
  totalAmount: number;
  maturityDate: string;
  emiAmount: number;
  totalInstalments: number;
}

/**
 * Generates an entire deterministic repayment schedule version and items.
 * Guaranteed invariant: Sum(Principal Due) === Scheduled Principal exactly.
 */
export function generateRepaymentSchedule(params: {
  loanId: string;
  versionNumber: number;
  reason: string;
  principal: number;
  annualRate: number;
  tenureMonths: number;
  frequency: LoanRepaymentFrequency;
  interestMethod: InterestMethod;
  startDate: string;
  firstDueDate: string;
  feesPerInstalment?: number;
  repaymentMethod?: 'EMI' | 'PRINCIPAL_PLUS_INTEREST' | 'INTEREST_ONLY' | 'BULLET';
  moratoriumMonths?: number;
  gracePeriodDays?: number;
  createdBy: string;
}): ScheduleGenerationResult {
  const {
    loanId,
    versionNumber,
    reason,
    principal,
    annualRate,
    tenureMonths,
    frequency,
    interestMethod,
    firstDueDate,
    feesPerInstalment = 0,
    repaymentMethod = 'EMI',
    moratoriumMonths = 0,
    gracePeriodDays = 0,
    createdBy,
  } = params;

  const totalInstalments = calculateTotalInstalments(tenureMonths, frequency);
  const periodsPerYear = getFrequencyFactor(frequency);
  const periodicRate = annualRate > 0 ? annualRate / 100 / periodsPerYear : 0;
  const versionId = `rsv_${loanId}_v${versionNumber}_${Date.now()}`;

  // Moratorium instalments
  const moratoriumInstalments = moratoriumMonths > 0 ? calculateTotalInstalments(moratoriumMonths, frequency) : 0;
  const postMoratoriumInstalments = Math.max(1, totalInstalments - moratoriumInstalments);

  // Post-moratorium EMI
  const emiAmount = calculateInstalmentAmount({
    principal,
    annualRate,
    tenureMonths: Math.max(1, tenureMonths - moratoriumMonths),
    frequency,
    interestMethod,
  });

  const schedules: RepaymentScheduleItem[] = [];
  let currentPrincipal = roundMoney(principal);
  const flatInterestPerInstalment =
    interestMethod === 'FLAT_RATE' || interestMethod === 'SIMPLE_INTEREST'
      ? roundMoney((principal * (annualRate / 100) * (tenureMonths / 12)) / totalInstalments)
      : 0;

  const equalPrincipalPerInstalment = roundMoney(principal / postMoratoriumInstalments);

  for (let i = 0; i < totalInstalments; i++) {
    const instalmentNumber = i + 1;
    const dueDate = computeInstalmentDueDate(firstDueDate, i, frequency);
    const openingPrincipal = currentPrincipal;

    let interestDue = 0;
    let principalDue = 0;

    const inMoratorium = i < moratoriumInstalments;

    if (inMoratorium) {
      // In moratorium: only service interest, principal is zero
      interestDue = roundMoney(openingPrincipal * periodicRate);
      principalDue = 0;
    } else if (repaymentMethod === 'INTEREST_ONLY') {
      interestDue = roundMoney(openingPrincipal * periodicRate);
      principalDue = instalmentNumber === totalInstalments ? openingPrincipal : 0;
    } else if (repaymentMethod === 'BULLET') {
      interestDue = roundMoney(openingPrincipal * periodicRate);
      principalDue = instalmentNumber === totalInstalments ? openingPrincipal : 0;
    } else if (repaymentMethod === 'PRINCIPAL_PLUS_INTEREST') {
      principalDue = equalPrincipalPerInstalment;
      interestDue = roundMoney(openingPrincipal * periodicRate);
    } else if (interestMethod === 'FLAT_RATE' || interestMethod === 'SIMPLE_INTEREST') {
      interestDue = flatInterestPerInstalment;
      principalDue = roundMoney(principal / postMoratoriumInstalments);
    } else {
      // Standard reducing balance (Amortized EMI)
      interestDue = roundMoney(openingPrincipal * periodicRate);
      principalDue = roundMoney(emiAmount - interestDue);
    }

    // Guard against principal due exceeding remaining balance or going below zero
    if (principalDue > openingPrincipal || instalmentNumber === totalInstalments) {
      principalDue = openingPrincipal;
    }
    if (principalDue < 0) {
      principalDue = 0;
    }

    const instalmentTotal = roundMoney(principalDue + interestDue + feesPerInstalment);
    const closingPrincipal = Math.max(0, roundMoney(openingPrincipal - principalDue));
    currentPrincipal = closingPrincipal;

    schedules.push({
      id: `sch_${loanId}_v${versionNumber}_${instalmentNumber}`,
      loanId,
      versionId,
      versionNumber,
      instalmentNumber,
      dueDate,
      openingPrincipal,
      principalDue,
      interestDue,
      feesDue: roundMoney(feesPerInstalment),
      instalmentAmount: instalmentTotal,
      closingPrincipal,
      principalPaid: 0,
      interestPaid: 0,
      feesPaid: 0,
      totalPaid: 0,
      outstandingAmount: instalmentTotal,
      status: instalmentNumber === 1 ? 'DUE' : 'FUTURE',
      dpd: 0,
    });
  }

  // --- CRITICAL FINANCIAL RECONCILIATION ---
  // Ensure that Sum(Principal Due) === Scheduled Principal exactly.
  // Any residual rounding cents are adjusted on the final instalment.
  let sumPrincipalDue = roundMoney(
    schedules.reduce((sum, item) => sum + item.principalDue, 0)
  );
  const principalDiff = roundMoney(principal - sumPrincipalDue);

  if (principalDiff !== 0 && schedules.length > 0) {
    const lastItem = schedules[schedules.length - 1];
    lastItem.principalDue = roundMoney(lastItem.principalDue + principalDiff);
    lastItem.instalmentAmount = roundMoney(
      lastItem.principalDue + lastItem.interestDue + lastItem.feesDue
    );
    lastItem.outstandingAmount = lastItem.instalmentAmount;
    lastItem.closingPrincipal = 0;
  }

  const totalPrincipal = roundMoney(
    schedules.reduce((sum, item) => sum + item.principalDue, 0)
  );
  const totalInterest = roundMoney(
    schedules.reduce((sum, item) => sum + item.interestDue, 0)
  );
  const totalAmount = roundMoney(
    schedules.reduce((sum, item) => sum + item.instalmentAmount, 0)
  );
  const maturityDate =
    schedules.length > 0
      ? schedules[schedules.length - 1].dueDate
      : computeInstalmentDueDate(firstDueDate, totalInstalments - 1, frequency);

  const version: RepaymentScheduleVersion = {
    id: versionId,
    loanId,
    version: versionNumber,
    reason,
    effectiveDate: new Date().toISOString().split('T')[0],
    totalInstalments,
    totalPrincipal,
    totalInterest,
    totalAmount,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    createdBy,
    schedules,
  };

  return {
    version,
    schedules,
    totalPrincipal,
    totalInterest,
    totalAmount,
    maturityDate,
    emiAmount,
    totalInstalments,
  };
}
