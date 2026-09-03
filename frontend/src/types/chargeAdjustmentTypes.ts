// Batch 15 — Charges, Waivers & Financial Adjustments Domain Types

export type ChargeType =
  | 'LATE_PAYMENT_FEE'
  | 'BOUNCE_FEE'
  | 'COLLECTION_FEE'
  | 'LEGAL_FEE'
  | 'NOTICE_FEE'
  | 'PROCESSING_FEE'
  | 'DOCUMENTATION_FEE'
  | 'OTHER_FEE';

export type CalculationBasis =
  | 'FIXED_AMOUNT'
  | 'PERCENTAGE_OF_PRINCIPAL'
  | 'PERCENTAGE_OF_OVERDUE'
  | 'PER_INSTALMENT'
  | 'PER_EVENT'
  | 'PER_DAY';

export type ChargeStatus =
  | 'PENDING'
  | 'APPLIED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'WAIVED'
  | 'REVERSED'
  | 'CANCELLED';

export type WaiverType =
  | 'FULL_WAIVER'
  | 'PARTIAL_WAIVER'
  | 'FEE_WAIVER'
  | 'PENALTY_WAIVER'
  | 'INTEREST_WAIVER'
  | 'CHARGE_REVERSAL';

export type WaiverCategory = 'FEE' | 'PENALTY' | 'INTEREST';

export type WaiverStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'APPLIED'
  | 'CANCELLED';

export type AdjustmentType =
  | 'DEBIT_ADJUSTMENT'
  | 'CREDIT_ADJUSTMENT'
  | 'FEE_ADJUSTMENT'
  | 'INTEREST_ADJUSTMENT'
  | 'PENALTY_ADJUSTMENT'
  | 'REVERSAL_ADJUSTMENT';

export type AdjustmentStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'APPLIED'
  | 'CANCELLED'
  | 'REVERSED';

export interface ChargeConfigurationRecord {
  id: string;
  chargeCode: string;
  chargeName: string;
  chargeType: ChargeType;
  calculationBasis: CalculationBasis;
  rateOrValue: number;
  taxPercentage: number; // e.g. 18.0
  minAmount?: number;
  maxAmount?: number;
  applicableEvent?: string;
  isWaivable: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoanChargeRecord {
  id: string;
  chargeNumber: string;
  loanId: string;
  customerId?: string;
  accountNumber?: string;
  customerName?: string;
  chargeTypeId?: string;
  chargeCode: string;
  chargeName: string;
  chargeType: ChargeType;
  calculationType: string;
  rateOrValue?: number;
  sourceEvent?: string;
  eventReferenceId?: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  waivedAmount: number;
  outstandingAmount: number;
  chargeTiming: string;
  dueDate?: string;
  status: ChargeStatus;
  source: string;
  appliedAt: string;
  reversedAt?: string;
  reversedBy?: string;
  reversalReason?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
}

export interface WaiverRequestRecord {
  id: string;
  waiverNumber: string;
  loanId: string;
  customerId: string;
  accountNumber: string;
  customerName: string;
  chargeId?: string;
  waiverType: WaiverType;
  category: WaiverCategory;
  requestedAmount: number;
  approvedAmount?: number;
  eligibleOutstandingBefore: number;
  reason: string;
  status: WaiverStatus;
  requestedBy: string;
  requestedByName: string;
  requestedByRole: string;
  requestedAt: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedByRole?: string;
  approvedAt?: string;
  approvalNotes?: string;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  appliedAt?: string;
  appliedBy?: string;
  resultingTransactionRef?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialAdjustmentRequestRecord {
  id: string;
  adjustmentNumber: string;
  loanId: string;
  customerId: string;
  accountNumber: string;
  customerName: string;
  adjustmentType: AdjustmentType;
  amount: number;
  principalAdjustment: number;
  interestAdjustment: number;
  feeAdjustment: number;
  penaltyAdjustment: number;
  effectiveDate: string;
  reason: string;
  reference?: string;
  status: AdjustmentStatus;
  requestedBy: string;
  requestedByName: string;
  requestedByRole: string;
  requestedAt: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedByRole?: string;
  approvedAt?: string;
  approvalNotes?: string;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  appliedAt?: string;
  appliedBy?: string;
  resultingTransactionRef?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdjustmentReversalRecord {
  id: string;
  reversalNumber: string;
  targetType: 'CHARGE' | 'WAIVER' | 'ADJUSTMENT' | 'TRANSACTION';
  targetId: string;
  targetReference: string;
  loanId: string;
  amount: number;
  reason: string;
  status: string;
  requestedBy: string;
  requestedByName: string;
  approvedBy?: string;
  approvedByName?: string;
  reversedAt: string;
  compensatingTransactionRef: string;
  notes?: string;
  createdAt: string;
}

export interface ApplyChargePayload {
  loanId: string;
  chargeCode: string;
  chargeName?: string;
  chargeType?: ChargeType;
  customAmount?: number;
  taxPercentage?: number;
  dueDate?: string;
  sourceEvent?: string;
  eventReferenceId?: string;
  notes?: string;
  createdBy: string;
}

export interface RequestWaiverPayload {
  loanId: string;
  chargeId?: string;
  waiverType: WaiverType;
  category: WaiverCategory;
  requestedAmount: number;
  reason: string;
  requestedBy: string;
  requestedByName: string;
  requestedByRole: string;
}

export interface CreateFinancialAdjustmentPayload {
  loanId: string;
  adjustmentType: AdjustmentType;
  amount: number;
  principalAdjustment?: number;
  interestAdjustment?: number;
  feeAdjustment?: number;
  penaltyAdjustment?: number;
  effectiveDate?: string;
  reason: string;
  reference?: string;
  requestedBy: string;
  requestedByName: string;
  requestedByRole: string;
}

export interface FinancialKPIsData {
  totalChargesLevied: number;
  outstandingCharges: number;
  pendingWaiversCount: number;
  approvedWaiversCount: number;
  totalWaivedAmount: number;
  pendingAdjustmentsCount: number;
  appliedAdjustmentsCount: number;
  reversalsCount: number;
}
