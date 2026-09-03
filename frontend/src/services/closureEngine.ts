// Batch 16 — Core Settlement, Foreclosure, Loan Closure & NOC Calculation Engine
import { LoanAccountRecord } from '../types/loanAccountTypes';
import {
  LoanClosureRequestRecord,
  ForeclosureQuoteRecord,
  SettlementProposalRecord,
  ClosureType,
} from '../types/closureTypes';
import { roundMoney } from './loanFinancialService';

/**
 * Calculates authoritative foreclosure quote with GST tax and 7-day validity window.
 */
export function calculateForeclosureQuote(params: {
  loan: LoanAccountRecord;
  calculationDate?: string;
  foreclosureFeeRate?: number;
  taxPercentage?: number;
  waiversApplied?: number;
}): {
  principalOutstanding: number;
  accruedInterest: number;
  feesDue: number;
  penaltiesDue: number;
  foreclosureFeeRate: number;
  foreclosureFeeAmount: number;
  foreclosureFeeTax: number;
  totalForeclosureCharge: number;
  approvedWaivers: number;
  netPayableAmount: number;
  quoteDate: string;
  validUntil: string;
} {
  const {
    loan,
    calculationDate = new Date().toISOString().split('T')[0],
    foreclosureFeeRate = 2.0, // Standard 2% prepayment charge
    taxPercentage = 18.0, // 18% GST
    waiversApplied = 0,
  } = params;

  const principalOutstanding = roundMoney(Number(loan.outstandingPrincipal ?? loan.principalOutstanding ?? 0));
  const interestOutstanding = roundMoney(Number(loan.interestOutstanding || 0));
  const feesDue = roundMoney(Number(loan.feeOutstanding || 0));
  const penaltiesDue = roundMoney(Number(loan.penaltyOutstanding || 0));

  // Pro-rata accrued interest estimate (15 days daily interest if current, or full interestOutstanding)
  const annualRate = Number(loan.interestRate || 12.0);
  const dailyRate = annualRate / 100 / 365;
  const proRataDays = 15;
  const proRataAccrued = roundMoney(principalOutstanding * dailyRate * proRataDays);
  const accruedInterest = Math.max(interestOutstanding, proRataAccrued);

  // Foreclosure fee calculation
  const feeAmount = roundMoney((principalOutstanding * foreclosureFeeRate) / 100);
  const feeTax = roundMoney((feeAmount * taxPercentage) / 100);
  const totalForeclosureCharge = roundMoney(feeAmount + feeTax);

  // Net amount payable
  const netPayable = Math.max(
    0,
    roundMoney(
      principalOutstanding +
        accruedInterest +
        feesDue +
        penaltiesDue +
        totalForeclosureCharge -
        waiversApplied
    )
  );

  // Calculate 7-day validity
  const calcDateObj = new Date(calculationDate);
  const validUntilObj = new Date(calcDateObj.getTime() + 7 * 24 * 60 * 60 * 1000);
  const validUntil = validUntilObj.toISOString().split('T')[0];

  return {
    principalOutstanding,
    accruedInterest,
    feesDue,
    penaltiesDue,
    foreclosureFeeRate,
    foreclosureFeeAmount: feeAmount,
    foreclosureFeeTax: feeTax,
    totalForeclosureCharge,
    approvedWaivers: waiversApplied,
    netPayableAmount: netPayable,
    quoteDate: calculationDate,
    validUntil,
  };
}

/**
 * Calculates settlement concession and concession distribution across penalties, fees, interest, and principal.
 */
export function calculateSettlementConcession(params: {
  loan: LoanAccountRecord;
  proposedSettlementAmount: number;
  paymentDeadline?: string;
}): {
  totalExposure: number;
  proposedSettlementAmount: number;
  concessionAmount: number;
  concessionPercentage: number;
  principalConcession: number;
  interestConcession: number;
  feePenaltyConcession: number;
  paymentDeadline: string;
} {
  const { loan, proposedSettlementAmount, paymentDeadline } = params;

  const principal = roundMoney(Number(loan.outstandingPrincipal ?? loan.principalOutstanding ?? 0));
  const interest = roundMoney(Number(loan.interestOutstanding || 0));
  const fee = roundMoney(Number(loan.feeOutstanding || 0));
  const penalty = roundMoney(Number(loan.penaltyOutstanding || 0));

  const totalExposure = roundMoney(principal + interest + fee + penalty);
  const concessionAmount = Math.max(0, roundMoney(totalExposure - proposedSettlementAmount));
  const concessionPercentage =
    totalExposure > 0 ? roundMoney((concessionAmount / totalExposure) * 100) : 0;

  // Water-fall concession allocation: Penalties + Fees first, then Interest, then Principal
  let remainingConcession = concessionAmount;

  // 1. Fee & Penalty concession
  const feePenaltyDues = roundMoney(fee + penalty);
  const feePenaltyConcession = Math.min(feePenaltyDues, remainingConcession);
  remainingConcession = roundMoney(remainingConcession - feePenaltyConcession);

  // 2. Interest concession
  const interestConcession = Math.min(interest, remainingConcession);
  remainingConcession = roundMoney(remainingConcession - interestConcession);

  // 3. Principal concession
  const principalConcession = Math.min(principal, remainingConcession);

  const defaultDeadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return {
    totalExposure,
    proposedSettlementAmount: roundMoney(proposedSettlementAmount),
    concessionAmount,
    concessionPercentage,
    principalConcession: roundMoney(principalConcession),
    interestConcession: roundMoney(interestConcession),
    feePenaltyConcession: roundMoney(feePenaltyConcession),
    paymentDeadline: paymentDeadline || defaultDeadline,
  };
}

/**
 * Validates eligibility for foreclosure or settlement.
 */
export function validateClosureEligibility(
  loan: LoanAccountRecord,
  closureType: ClosureType
): { eligible: boolean; reason?: string } {
  if (loan.status === 'CLOSED') {
    return { eligible: false, reason: 'Loan is already closed and archived.' };
  }

  if (loan.status === 'CANCELLED') {
    return { eligible: false, reason: 'Loan account is cancelled and cannot be closed.' };
  }

  const totalPrincipal = Number(loan.outstandingPrincipal ?? loan.principalOutstanding ?? 0);
  if (totalPrincipal <= 0 && Number(loan.totalOutstanding || 0) <= 0) {
    return { eligible: false, reason: 'Loan has zero outstanding dues. Use normal closure reconciliation.' };
  }

  return { eligible: true };
}

/**
 * Validates that received payment and approved concessions fully satisfy the required closure balance.
 */
export function validateFinancialReconciliation(params: {
  loan: LoanAccountRecord;
  request: LoanClosureRequestRecord;
  receivedPaymentAmount: number;
}): { reconciled: boolean; shortFallAmount: number; reason?: string } {
  const { request, receivedPaymentAmount } = params;

  const requiredPayable = Number(request.finalPayableAmount || 0);
  const shortFall = roundMoney(requiredPayable - receivedPaymentAmount);

  if (shortFall > 0.05) {
    // 5 paise tolerance for penny rounding
    return {
      reconciled: false,
      shortFallAmount: shortFall,
      reason: `Closure payment shortfall: Received ₹${receivedPaymentAmount.toLocaleString()} but required ₹${requiredPayable.toLocaleString()} (Shortfall: ₹${shortFall.toLocaleString()}). Loan remains open.`,
    };
  }

  return {
    reconciled: true,
    shortFallAmount: 0,
  };
}

/**
 * Segregation of duties maker-checker validation for loan closures and settlements.
 */
export function validateClosureMakerChecker(
  request: LoanClosureRequestRecord,
  actor: { id: string; name: string; roleName: string }
): { allowed: boolean; reason?: string } {
  if (request.requestedBy === actor.id || request.requestedByName === actor.name) {
    return {
      allowed: false,
      reason: `Maker-Checker Violation: Requester (${request.requestedByName}) cannot approve their own foreclosure/settlement request.`,
    };
  }

  return { allowed: true };
}
