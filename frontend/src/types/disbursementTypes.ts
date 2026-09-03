// Batch 9 - Real Disbursement Management, Multi-Disbursement Accounting, Pre-Disbursement Verification & Payment Transaction Types

export type DisbursementStatus =
  | 'DRAFT'
  | 'VERIFICATION_PENDING'
  | 'READY'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PROCESSING'
  | 'SUCCESSFUL'
  | 'RETURNED'
  | 'REJECTED'
  | 'FAILED'
  | 'REVERSED'
  | 'CANCELLED';

export type DisbursementType = 'FULL' | 'PARTIAL';

export type TransactionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCESSFUL'
  | 'FAILED'
  | 'REVERSED'
  | 'CANCELLED';

export type PaymentMethod = 'NEFT' | 'RTGS' | 'IMPS' | 'DIRECT_TRANSFER' | 'ACH';

export type DisbursementReadinessCheckStatus = 'PASS' | 'PENDING' | 'BLOCKED' | 'NOT_APPLICABLE';

export type DisbursementReadinessCheckCategory =
  | 'CUSTOMER'
  | 'APPLICATION'
  | 'APPROVAL'
  | 'SANCTION'
  | 'DOCUMENTS'
  | 'CONDITIONS'
  | 'BANKING'
  | 'EXCEPTIONS';

export interface DisbursementReadinessCheck {
  id: string;
  category: DisbursementReadinessCheckCategory;
  title: string;
  description: string;
  status: DisbursementReadinessCheckStatus;
  source: string;
  reason?: string;
  blockingDetails?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface DisbursementReadinessResult {
  isEligible: boolean;
  totalChecks: number;
  passedChecks: number;
  pendingChecks: number;
  blockedChecks: number;
  checks: DisbursementReadinessCheck[];
}

export interface DisbursementBeneficiaryRecord {
  id: string;
  disbursementId: string;
  beneficiaryType: 'PRIMARY_BORROWER' | 'CO_APPLICANT' | 'SELLER_BUILDER' | 'VENDOR' | 'INSTITUTION';
  beneficiaryName: string;
  bankName: string;
  accountNumber: string;
  accountNumberMasked: string;
  ifscCode: string;
  accountType: 'SAVINGS' | 'CURRENT';
  verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  verificationSource?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DisbursementTransactionRecord {
  id: string;
  transactionReference: string; // e.g. TXN-20260901-00042
  disbursementId: string;
  requestId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  beneficiaryName: string;
  beneficiaryAccountNumberMasked: string;
  beneficiaryIfsc: string;
  bankName: string;
  externalReference?: string;
  utrNumber?: string;
  processingStartedAt?: string;
  completedAt?: string;
  failedAt?: string;
  failureReason?: string;
  reversedAt?: string;
  reversedBy?: string;
  reversalReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DisbursementHistoryItem {
  id: string;
  disbursementId: string;
  requestId?: string;
  timestamp: string;
  event:
    | 'DISBURSEMENT_CREATED'
    | 'REQUEST_CREATED'
    | 'REQUEST_UPDATED'
    | 'ASSIGNED'
    | 'VERIFICATION_PASSED'
    | 'VERIFICATION_BLOCKED'
    | 'SUBMITTED_FOR_APPROVAL'
    | 'APPROVED'
    | 'REJECTED'
    | 'RETURNED'
    | 'TRANSACTION_INITIATED'
    | 'PROCESSING_STARTED'
    | 'TRANSACTION_SUCCESSFUL'
    | 'TRANSACTION_FAILED'
    | 'TRANSACTION_REVERSED'
    | 'CANCELLED';
  actor: string;
  actorName: string;
  actorRole: string;
  previousState?: string;
  newState?: string;
  amount?: number;
  notes?: string;
  reference?: string;
  metadata?: Record<string, any>;
}

export interface DisbursementRequestRecord {
  id: string;
  requestNumber: string; // e.g. DREQ-2026-000412
  disbursementId: string;
  applicationId: string;
  sanctionId: string;
  requestedAmount: number;
  disbursementType: DisbursementType;
  beneficiaryId?: string;
  beneficiary?: DisbursementBeneficiaryRecord;
  paymentMethod: PaymentMethod;
  purpose?: string;
  supportingDocuments?: { id: string; name: string; url?: string; type: string }[];
  notes?: string;
  status: DisbursementStatus;
  readinessChecks?: DisbursementReadinessResult;
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  assignedTo?: string;
  assignedToName?: string;
  assignedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  approvalNotes?: string;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  returnedBy?: string;
  returnedByName?: string;
  returnedAt?: string;
  returnReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DisbursementRecord {
  id: string;
  disbursementNumber: string; // e.g. DSB-2026-000104
  applicationId: string;
  applicationNumber: string;
  sanctionId: string;
  sanctionNumber: string;
  customerId: string;
  customerNumber: string;
  customerName: string;
  customerMobile?: string;
  productCode: string;
  productName: string;
  branchId: string;
  branchName?: string;
  sanctionAmount: number;
  totalDisbursedAmount: number; // Sum of successful transactions
  remainingAmount: number; // sanctionAmount - totalDisbursedAmount
  status: DisbursementStatus;
  requests: DisbursementRequestRecord[];
  beneficiaries: DisbursementBeneficiaryRecord[];
  transactions: DisbursementTransactionRecord[];
  history: DisbursementHistoryItem[];
  firstDisbursedAt?: string;
  lastDisbursedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DisbursementFilterState {
  search: string;
  status: string;
  productCode: string;
  branchId: string;
  dateFrom: string;
  dateTo: string;
  minAmount?: number;
  maxAmount?: number;
  assignedTo?: string;
}

export const DEFAULT_DISBURSEMENT_FILTERS: DisbursementFilterState = {
  search: '',
  status: 'ALL',
  productCode: 'ALL',
  branchId: 'ALL',
  dateFrom: '',
  dateTo: '',
  minAmount: undefined,
  maxAmount: undefined,
  assignedTo: 'ALL',
};

export interface DisbursementKPIsData {
  totalSanctionedAmount: number;
  totalDisbursedAmount: number;
  totalRemainingAmount: number;
  pendingApprovalCount: number;
  pendingApprovalAmount: number;
  readyForPayoutCount: number;
  readyForPayoutAmount: number;
  successfulDisbursementCount: number;
  failedDisbursementCount: number;
}
