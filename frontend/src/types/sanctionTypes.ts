// Batch 8 - Sanction Management, Sanction Letter & Pre-Disbursement Readiness Types

import { ConditionStatus, ConditionStage } from './approvalTypes';
export type { ConditionStatus, ConditionStage };

export type SanctionStatus =
  | 'DRAFT'
  | 'UNDER_REVIEW'
  | 'PENDING_CONFIRMATION'
  | 'SANCTIONED'
  | 'RETURNED'
  | 'CANCELLED';

export type LetterStatus =
  | 'DRAFT'
  | 'GENERATED'
  | 'ISSUED'
  | 'SUPERSEDED'
  | 'CANCELLED';

export type ReadinessCheckStatus = 'PASS' | 'PENDING' | 'BLOCKED' | 'NOT_APPLICABLE';

export type ReadinessCheckCategory =
  | 'CUSTOMER'
  | 'APPROVAL'
  | 'SANCTION'
  | 'DOCUMENTS'
  | 'CONDITIONS'
  | 'BANKING'
  | 'EXCEPTIONS';

export type SanctionConditionCategory =
  | 'DOCUMENTATION'
  | 'FINANCIAL'
  | 'OPERATIONAL'
  | 'LEGAL'
  | 'INSURANCE'
  | 'OTHER';

export type SanctionConditionSource = 'CREDIT_ASSESSMENT' | 'APPROVAL' | 'SANCTION';

export interface SanctionTerms {
  amount: number;
  tenureMonths: number;
  interestRate: number; // annual %
  repaymentFrequency: 'Monthly' | 'Quarterly' | 'Bi-Weekly';
  purpose: string;
  processingFee: number;
  processingFeeGst: number;
  documentationCharge: number;
  insuranceCharge: number;
  otherCharges: number;
  netDisbursementAmount: number;
  approxMonthlyEmi: number;
  gracePeriodDays?: number;
  paymentMethod: string;
  firstRepaymentDatePlaceholder?: string;
  interestMethodology: string;
  isDeviatedFromApproval?: boolean;
  deviationNotes?: string;
}

export interface SanctionCondition {
  id: string;
  sanctionId: string;
  category: SanctionConditionCategory;
  description: string;
  requiredBefore: ConditionStage;
  dueDate?: string;
  owner: string;
  status: ConditionStatus;
  source: SanctionConditionSource;
  addedBy: string;
  addedAt: string;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  waiverReason?: string;
  waivedBy?: string;
  waivedAt?: string;
}

export interface SanctionLetterContentSnapshot {
  institutionName: string;
  institutionAddress: string;
  cinNumber: string;
  rbiRegistrationNumber: string;
  date: string;
  sanctionNumber: string;
  applicationNumber: string;
  approvalNumber: string;
  customerName: string;
  customerNumber: string;
  customerAddress: string;
  customerMobile: string;
  customerEmail: string;
  productName: string;
  productCode: string;
  sanctionAmount: number;
  tenureMonths: number;
  interestRate: number;
  approxMonthlyEmi: number;
  repaymentFrequency: string;
  purpose: string;
  processingFee: number;
  documentationCharge: number;
  insuranceCharge: number;
  interestMethodology: string;
  firstRepaymentDate: string;
  validityDays: number;
  validUntil: string;
  conditions: {
    category: string;
    description: string;
    requiredBefore: string;
    status: string;
  }[];
  signatoryName: string;
  signatoryRole: string;
  signatoryBranch: string;
}

export interface SanctionLetterVersion {
  id: string;
  version: number;
  sanctionId: string;
  status: LetterStatus;
  generatedAt: string;
  generatedBy: string;
  generatedByRole: string;
  issuedAt?: string;
  issuedBy?: string;
  issuedByRole?: string;
  templateVersion: string;
  reasonForRegeneration?: string;
  customNotes?: string;
  contentSnapshot: SanctionLetterContentSnapshot;
}

export interface SanctionVersionSnapshot {
  version: number;
  snapshotDate: string;
  actor: string;
  actorRole: string;
  amount: number;
  tenureMonths: number;
  interestRate: number;
  processingFee: number;
  documentationCharge: number;
  conditionsCount: number;
  letterVersion: number;
  changeDescription: string;
  reason: string;
}

export interface SanctionHistoryItem {
  id: string;
  sanctionId: string;
  timestamp: string;
  event: string;
  actor: string;
  actorRole: string;
  previousState: string;
  newState: string;
  version: number;
  notes: string;
}

export interface ReadinessCheckItem {
  id: string;
  sanctionId: string;
  key: string;
  title: string;
  category: ReadinessCheckCategory;
  status: ReadinessCheckStatus;
  source: string;
  blocking: boolean;
  details: string;
  actionLabel?: string;
  actionTarget?: 'customer' | 'kyc' | 'approval' | 'sanction' | 'documents' | 'conditions' | 'banking';
}

export interface PreDisbursementReadinessSummary {
  sanctionId: string;
  overallStatus: 'READY' | 'NOT_READY' | 'BLOCKED';
  isDisbursementReady: boolean;
  passedCount: number;
  pendingCount: number;
  blockedCount: number;
  totalCount: number;
  checks: ReadinessCheckItem[];
  blockers: string[];
  blockerReasons: string[];
  verifiedAt: string;
}

export type PreDisbursementReadinessResult = PreDisbursementReadinessSummary;

export interface SanctionRecord {
  id: string;
  sanctionNumber: string; // e.g. SN-2026-000241
  applicationId: string;
  applicationNumber: string;
  approvalId: string;
  approvalNumber: string;
  customerId: string;
  customerNumber: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  customerAddress: string;
  branchId: string;
  branchName: string;
  productCode: string;
  productName: string;
  status: SanctionStatus;
  
  // Originating Approval Context
  requestedAmount: number;
  approvedAmount: number;
  approvedTenureMonths: number;
  approvedInterestRate: number;
  finalApproverName: string;
  finalApproverRole: string;
  approvedDate: string;

  // Active Sanction Terms
  terms: SanctionTerms;
  termDeviationReason?: string;

  // Conditions, Letters, and Audit
  conditions: SanctionCondition[];
  letters: SanctionLetterVersion[];
  activeLetterId?: string;
  
  createdDate: string;
  createdTime: string;
  createdBy: string;
  createdByRole: string;
  
  sanctionDate?: string;
  sanctionedBy?: string;
  sanctionedByRole?: string;
  
  confirmedBy?: string;
  confirmedDate?: string;
  expiryDate?: string;
  
  returnedReason?: string;
  returnedCorrection?: string;
  returnedBy?: string;
  returnedDate?: string;
  
  cancelledReason?: string;
  cancelledBy?: string;
  cancelledDate?: string;
  
  versions: SanctionVersionSnapshot[];
  history: SanctionHistoryItem[];
}

export interface SanctionFilterState {
  status: string;
  productCode: string;
  branchId: string;
  searchQuery: string;
  dateRange: { start: string; end: string };
  minAmount?: number;
  maxAmount?: number;
}

export interface SanctionSortState {
  column: keyof SanctionRecord | 'sanctionAmount' | 'tenure' | 'rate';
  direction: 'asc' | 'desc';
}
