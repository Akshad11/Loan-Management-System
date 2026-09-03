// Batch 14 — Restructuring, Rescheduling & Moratoriums Domain Types
import { LoanRepaymentFrequency, InterestMethod } from './loanAccountTypes';

export type RestructuringType =
  | 'TENURE_EXTENSION'
  | 'EMI_REDUCTION'
  | 'EMI_INCREASE'
  | 'INTEREST_RATE_CHANGE'
  | 'REPAYMENT_FREQUENCY_CHANGE'
  | 'MORATORIUM'
  | 'PAYMENT_HOLIDAY'
  | 'DUE_DATE_CHANGE'
  | 'PARTIAL_RESCHEDULING'
  | 'FULL_RESCHEDULING';

export type RestructuringStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EFFECTIVE'
  | 'SUPERSEDED';

export type MoratoriumInterestTreatment =
  | 'ACCRUE_AND_AMORTIZE'
  | 'CAPITALIZE'
  | 'PAY_INTEREST_ONLY'
  | 'WAIVE';

export type MoratoriumPrincipalTreatment = 'DEFER' | 'REDUCE_AMORTIZATION';
export type MoratoriumFeeTreatment = 'REMAIN_DUE' | 'WAIVED' | 'CAPITALIZED';
export type RestructuringFeeTreatment = 'REMAIN_DUE' | 'CAPITALIZED' | 'WAIVED' | 'DEFERRED';

export interface RestructuringEventRecord {
  id: string;
  requestId: string;
  eventType: string; // CREATED, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, CONSENT_RECORDED, APPLIED_EFFECTIVE, CANCELLED
  timestamp: string;
  actor: string;
  actorName: string;
  actorRole: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface RestructuringProposalRecord {
  id: string;
  requestId: string;
  proposalOptionName: string;
  tenureMonths: number;
  interestRate: number;
  emiAmount: number;
  frequency: string;
  moratoriumMonths: number;
  totalInterest: number;
  totalAmount: number;
  isRecommended: boolean;
  isSelected: boolean;
  schedulePreview?: any[];
  createdAt: string;
}

export interface RestructuringRequestRecord {
  id: string;
  requestNumber: string;
  loanId: string;
  accountNumber: string;
  customerId: string;
  customerNumber?: string;
  customerName: string;
  requestType: RestructuringType;
  reason: string;
  requestedBy: string;
  requestedByName: string;
  requestedByRole: string;
  requestedAt: string;
  effectiveDate: string; // YYYY-MM-DD
  status: RestructuringStatus;
  assignedOfficer?: string;
  assignedOfficerId?: string;
  branchId: string;
  branchName?: string;

  // Current Terms Snapshot
  currentPrincipalOutstanding: number;
  currentInterestRate: number;
  currentRemainingTenureMonths: number;
  currentEmiAmount: number;
  currentRepaymentFrequency: LoanRepaymentFrequency;
  currentNextDueDate?: string;
  currentMaturityDate?: string;
  currentDpd: number;
  currentOverdueAmount: number;
  currentScheduleVersion: number;

  // Proposed Terms
  proposedPrincipal: number;
  proposedInterestRate: number;
  proposedTenureMonths: number;
  proposedEmiAmount: number;
  proposedRepaymentFrequency: LoanRepaymentFrequency;
  proposedFirstDueDate: string;
  proposedMaturityDate: string;

  // Specific Moratorium & Treatment Terms
  moratoriumMonths?: number;
  moratoriumInterestTreatment?: MoratoriumInterestTreatment;
  moratoriumPrincipalTreatment?: MoratoriumPrincipalTreatment;
  moratoriumFeeTreatment?: MoratoriumFeeTreatment;
  capitalizedAmount?: number;
  feeTreatment?: RestructuringFeeTreatment;
  penaltyTreatment?: RestructuringFeeTreatment;

  // Financial Impact (Calculated server-side)
  currentRemainingInterest: number;
  proposedRemainingInterest: number;
  interestDifference: number; // positive = customer pays more interest overall, negative = savings
  currentTotalScheduled: number;
  proposedTotalScheduled: number;
  emiDifference: number; // proposed - current
  tenureDifference: number; // proposed - current in months

  // Review & Approval Workflow
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedByRole?: string;
  reviewedAt?: string;
  reviewNotes?: string;

  approvedBy?: string;
  approvedByName?: string;
  approvedByRole?: string;
  approvedAt?: string;
  approvalNotes?: string;

  rejectedBy?: string;
  rejectedByName?: string;
  rejectedByRole?: string;
  rejectedAt?: string;
  rejectionReason?: string;

  appliedAt?: string;
  appliedBy?: string;
  appliedByName?: string;
  resultingScheduleVersionId?: string;
  resultingScheduleVersionNumber?: number;

  // Customer Consent
  consentRequired: boolean;
  consentReceived: boolean;
  consentDate?: string;
  consentMethod?: 'DIGITAL_OTP' | 'PHYSICAL_SIGNATURE' | 'E_SIGN' | 'IN_PERSON';
  consentDocumentRef?: string;

  createdAt: string;
  updatedAt: string;

  // Nested relations
  events?: RestructuringEventRecord[];
  proposals?: RestructuringProposalRecord[];
}

export interface RestructuringEligibilityResult {
  eligible: boolean;
  loanId: string;
  accountNumber: string;
  reasons: string[];
  blockers: string[];
  warnings: string[];
  maxTenureAllowedMonths: number;
  minEmiAllowed: number;
  allowedTypes: RestructuringType[];
  maxMoratoriumMonths: number;
  canCapitalizeInterest: boolean;
}

export interface RestructuringSchedulePreviewItem {
  instalmentNumber: number;
  dueDate: string;
  openingPrincipal: number;
  principalDue: number;
  interestDue: number;
  feesDue: number;
  instalmentAmount: number;
  closingPrincipal: number;
  isMoratorium?: boolean;
  notes?: string;
}

export interface RestructuringSchedulePreviewResult {
  schedules: RestructuringSchedulePreviewItem[];
  totalPrincipal: number;
  totalInterest: number;
  totalAmount: number;
  maturityDate: string;
  emiAmount: number;
  totalInstalments: number;
  moratoriumInstalments: number;
  financialImpact: {
    currentRemainingInterest: number;
    proposedRemainingInterest: number;
    interestDifference: number;
    currentTotalScheduled: number;
    proposedTotalScheduled: number;
    emiDifference: number;
    tenureDifference: number;
  };
}

export interface CreateRestructuringPayload {
  loanId: string;
  requestType: RestructuringType;
  reason: string;
  effectiveDate: string;
  proposedTenureMonths: number;
  proposedInterestRate: number;
  proposedEmiAmount?: number;
  proposedRepaymentFrequency?: LoanRepaymentFrequency;
  proposedFirstDueDate?: string;
  moratoriumMonths?: number;
  moratoriumInterestTreatment?: MoratoriumInterestTreatment;
  moratoriumPrincipalTreatment?: MoratoriumPrincipalTreatment;
  moratoriumFeeTreatment?: MoratoriumFeeTreatment;
  feeTreatment?: RestructuringFeeTreatment;
  penaltyTreatment?: RestructuringFeeTreatment;
  consentReceived?: boolean;
  consentMethod?: 'DIGITAL_OTP' | 'PHYSICAL_SIGNATURE' | 'E_SIGN' | 'IN_PERSON';
  consentDocumentRef?: string;
  requestedBy: string;
  requestedByName: string;
  requestedByRole: string;
  assignedOfficer?: string;
  assignedOfficerId?: string;
  status?: 'DRAFT' | 'SUBMITTED';
}

export interface RestructuringKPIs {
  totalRequests: number;
  pendingRequests: number;
  underReview: number;
  approved: number;
  rejected: number;
  effectiveThisMonth: number;
  totalRestructuredExposure: number;
  avgEmiDelta: number;
  avgTenureDeltaMonths: number;
}
