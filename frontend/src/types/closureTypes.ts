// Batch 16 — Settlement, Foreclosure, Loan Closure & NOC Domain Types

export type ClosureType =
  | 'FORECLOSURE'
  | 'SETTLEMENT'
  | 'NORMAL_CLOSURE'
  | 'VOLUNTARY_CLOSURE';

export type ClosureStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PAYMENT_PENDING'
  | 'RECONCILED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'EXPIRED';

export type NocStatus =
  | 'PENDING_ELIGIBILITY'
  | 'READY'
  | 'GENERATED'
  | 'APPROVED'
  | 'ISSUED'
  | 'CANCELLED';

export interface ForeclosureQuoteRecord {
  id: string;
  quoteNumber: string;
  closureRequestId: string;
  loanId: string;
  quoteDate: string;
  validUntil: string;
  principalOutstanding: number;
  accruedInterest: number;
  feesDue: number;
  penaltiesDue: number;
  foreclosureFeeRate: number; // e.g. 2.0%
  foreclosureFeeAmount: number;
  foreclosureFeeTax: number; // e.g. 18% GST
  totalForeclosureCharge: number;
  approvedWaivers: number;
  netPayableAmount: number;
  status: 'ACTIVE' | 'EXPIRED' | 'ACCEPTED' | 'SUPERSEDED';
  generatedBy: string;
  createdAt: string;
}

export interface SettlementProposalRecord {
  id: string;
  proposalNumber: string;
  closureRequestId: string;
  loanId: string;
  totalExposure: number;
  proposedSettlementAmount: number;
  concessionAmount: number;
  concessionPercentage: number;
  principalConcession: number;
  interestConcession: number;
  feePenaltyConcession: number;
  paymentDeadline: string;
  settlementReason: string;
  hardshipCategory?: string;
  status: 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'PAID' | 'DEFAULTED';
  createdAt: string;
}

export interface ClosureEventRecord {
  id: string;
  closureRequestId: string;
  eventType: string;
  timestamp: string;
  actor: string;
  actorName: string;
  actorRole: string;
  title: string;
  description: string;
  amount?: number;
}

export interface NocRecordType {
  id: string;
  nocNumber: string;
  loanId: string;
  customerId: string;
  accountNumber: string;
  customerName: string;
  closureRequestId: string;
  closureType: string;
  closureDate: string;
  sanctionedAmount: number;
  disbursedAmount: number;
  totalRecoveredAmount: number;
  status: NocStatus;
  documentReference?: string;
  generatedAt?: string;
  generatedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  issuedAt?: string;
  issuedBy?: string;
  deliveryMethod?: string;
  dispatchAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoanClosureRequestRecord {
  id: string;
  requestNumber: string;
  loanId: string;
  customerId: string;
  accountNumber: string;
  customerName: string;
  closureType: ClosureType;
  status: ClosureStatus;
  calculationDate: string;
  effectiveDate: string;
  requestedBy: string;
  requestedByName: string;
  requestedByRole: string;
  requestedAt: string;
  reason: string;
  assignedOfficer?: string;
  assignedOfficerId?: string;
  branchId?: string;
  branchName?: string;

  // Financial Exposure Snapshot
  principalOutstanding: number;
  interestOutstanding: number;
  feeOutstanding: number;
  penaltyOutstanding: number;
  totalExposure: number;

  // Calculation & Output
  foreclosureChargeAmount: number;
  foreclosureChargeTax: number;
  waiverAmount: number;
  concessionAmount: number;
  finalPayableAmount: number;
  paidAmount: number;
  quoteValidUntil?: string;

  // Approvals & Maker-Checker
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
  closedAt?: string;
  closedBy?: string;
  closureNotes?: string;

  // References
  reconciliationTransactionRef?: string;
  concessionAdjustmentRef?: string;

  foreclosureQuote?: ForeclosureQuoteRecord;
  settlementProposal?: SettlementProposalRecord;
  nocRecord?: NocRecordType;
  events?: ClosureEventRecord[];

  createdAt: string;
  updatedAt: string;
}

export interface CreateForeclosurePayload {
  loanId: string;
  calculationDate?: string;
  foreclosureFeeRate?: number;
  taxPercentage?: number;
  reason: string;
  requestedBy: string;
  requestedByName: string;
  requestedByRole: string;
}

export interface ProposeSettlementPayload {
  loanId: string;
  proposedSettlementAmount: number;
  paymentDeadline: string;
  settlementReason: string;
  hardshipCategory?: string;
  requestedBy: string;
  requestedByName: string;
  requestedByRole: string;
}

export interface ReconcileClosePayload {
  closureRequestId: string;
  receivedPaymentAmount: number;
  paymentReference?: string;
  closureNotes?: string;
  actorId: string;
  actorName: string;
  actorRole: string;
}

export interface ClosureKPIsData {
  activeQuotesCount: number;
  pendingSettlementsCount: number;
  pendingApprovalCount: number;
  closedLoansCount: number;
  totalSettlementVolume: number;
  totalConcessionsGranted: number;
  pendingNocsCount: number;
  issuedNocsCount: number;
}
