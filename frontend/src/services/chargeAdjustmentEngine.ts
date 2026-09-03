// Batch 15 — Core Charges, Waivers & Financial Adjustment Calculation Engine
import {
  ChargeConfigurationRecord,
  LoanChargeRecord,
  WaiverRequestRecord,
  FinancialAdjustmentRequestRecord,
  WaiverCategory,
} from '../types/chargeAdjustmentTypes';
import { LoanAccountRecord } from '../types/loanAccountTypes';
import { roundMoney } from './loanFinancialService';

/**
 * Calculates base charge amount, tax (e.g. GST), and total payable charge.
 */
export function calculateChargeAmount(params: {
  config: Partial<ChargeConfigurationRecord>;
  loan: LoanAccountRecord;
  customAmount?: number;
}): { baseAmount: number; taxAmount: number; totalAmount: number } {
  const { config, loan, customAmount } = params;

  let baseAmount = 0;

  if (customAmount !== undefined && customAmount > 0) {
    baseAmount = customAmount;
  } else {
    switch (config.calculationBasis) {
      case 'PERCENTAGE_OF_PRINCIPAL': {
        const rate = Number(config.rateOrValue || 0);
        const principal = Number(loan.outstandingPrincipal || 0);
        baseAmount = roundMoney((principal * rate) / 100);
        break;
      }
      case 'PERCENTAGE_OF_OVERDUE': {
        const rate = Number(config.rateOrValue || 0);
        const overdue = Number(loan.overdueAmount || 0);
        baseAmount = roundMoney((overdue * rate) / 100);
        break;
      }
      case 'FIXED_AMOUNT':
      default:
        baseAmount = Number(config.rateOrValue || 0);
        break;
    }
  }

  // Apply min/max caps if defined
  if (config.minAmount !== undefined && baseAmount < config.minAmount) {
    baseAmount = config.minAmount;
  }
  if (config.maxAmount !== undefined && baseAmount > config.maxAmount) {
    baseAmount = config.maxAmount;
  }

  const taxPercentage = config.taxPercentage !== undefined ? Number(config.taxPercentage) : 18.0;
  const taxAmount = roundMoney((baseAmount * taxPercentage) / 100);
  const totalAmount = roundMoney(baseAmount + taxAmount);

  return {
    baseAmount: roundMoney(baseAmount),
    taxAmount,
    totalAmount,
  };
}

/**
 * Validates waiver eligibility against current authoritative outstanding dues.
 */
export function validateWaiverEligibility(params: {
  loan: LoanAccountRecord;
  category: WaiverCategory;
  requestedAmount: number;
  charge?: LoanChargeRecord | null;
}): { eligible: boolean; maxEligibleAmount: number; reason?: string } {
  const { loan, category, requestedAmount, charge } = params;

  if (requestedAmount <= 0) {
    return {
      eligible: false,
      maxEligibleAmount: 0,
      reason: 'Waiver requested amount must be strictly greater than zero.',
    };
  }

  let maxEligible = 0;

  if (charge) {
    maxEligible = Number(charge.outstandingAmount ?? charge.totalAmount ?? 0);
  } else {
    switch (category) {
      case 'PENALTY':
        maxEligible = Number(loan.penaltyOutstanding || 0);
        break;
      case 'FEE':
        maxEligible = Number(loan.feeOutstanding || 0);
        break;
      case 'INTEREST':
        maxEligible = Number(loan.interestOutstanding || 0);
        break;
    }
  }

  if (requestedAmount > maxEligible) {
    return {
      eligible: false,
      maxEligibleAmount: maxEligible,
      reason: `Requested waiver of ₹${requestedAmount.toLocaleString()} exceeds the maximum eligible outstanding ${category} balance of ₹${maxEligible.toLocaleString()}.`,
    };
  }

  return {
    eligible: true,
    maxEligibleAmount: maxEligible,
  };
}

/**
 * Recalculates loan balances after applying a charge, waiver, or adjustment.
 * Guaranteed invariant: totalOutstanding === principal + interest + fee + penalty.
 */
export function recalculateLoanBalances(loan: LoanAccountRecord, delta: {
  principalDelta?: number;
  interestDelta?: number;
  feeDelta?: number;
  penaltyDelta?: number;
}): {
  outstandingPrincipal: number;
  interestOutstanding: number;
  feeOutstanding: number;
  penaltyOutstanding: number;
  totalOutstanding: number;
} {
  const newPrincipal = Math.max(0, roundMoney(Number(loan.outstandingPrincipal || 0) + (delta.principalDelta || 0)));
  const newInterest = Math.max(0, roundMoney(Number(loan.interestOutstanding || 0) + (delta.interestDelta || 0)));
  const newFee = Math.max(0, roundMoney(Number(loan.feeOutstanding || 0) + (delta.feeDelta || 0)));
  const newPenalty = Math.max(0, roundMoney(Number(loan.penaltyOutstanding || 0) + (delta.penaltyDelta || 0)));

  const newTotal = roundMoney(newPrincipal + newInterest + newFee + newPenalty);

  return {
    outstandingPrincipal: newPrincipal,
    interestOutstanding: newInterest,
    feeOutstanding: newFee,
    penaltyOutstanding: newPenalty,
    totalOutstanding: newTotal,
  };
}

/**
 * Segregation of duties maker-checker validation for waivers and adjustments.
 */
export function validateAdjustmentMakerChecker(
  request: WaiverRequestRecord | FinancialAdjustmentRequestRecord,
  actor: { id: string; name: string; roleName: string }
): { allowed: boolean; reason?: string } {
  if (request.requestedBy === actor.id || request.requestedByName === actor.name) {
    return {
      allowed: false,
      reason: `Segregation of duties violation: The requester (${request.requestedByName}) cannot approve their own financial adjustment/waiver.`,
    };
  }

  return { allowed: true };
}
