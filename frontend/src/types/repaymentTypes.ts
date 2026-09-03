// Batch 11 — Real Repayments & Payment Posting Types

export type PaymentStatus =
  | 'RECEIVED'
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'POSTED'
  | 'PARTIALLY_ALLOCATED'
  | 'FULLY_ALLOCATED'
  | 'FAILED'
  | 'REVERSED'
  | 'CANCELLED';

export type PaymentMethodType =
  | 'NACH_EMANDATE'
  | 'BANK_TRANSFER'
  | 'UPI'
  | 'CHEQUE'
  | 'CASH'
  | 'CARD'
  | 'MANUAL_ADJUSTMENT';

export type PaymentAllocationType =
  | 'PENALTY'
  | 'FEE'
  | 'INTEREST'
  | 'PRINCIPAL'
  | 'ADVANCE_PRINCIPAL'
  | 'UNALLOCATED';

export type UnallocatedStatus =
  | 'UNALLOCATED'
  | 'PARTIALLY_ALLOCATED'
  | 'FULLY_ALLOCATED'
  | 'REFUNDED';

export interface PaymentAllocationRecord {
  id: string;
  paymentId: string;
  loanId: string;
  scheduleItemId?: string;
  instalmentNumber?: number;
  chargeId?: string;
  allocationType: PaymentAllocationType;
  amount: number;
  status: 'ACTIVE' | 'REVERSED';
  createdAt: string;
  createdBy: string;
}

export interface PaymentReceiptRecord {
  id: string;
  receiptNumber: string; // e.g. RCT-2026-000821
  paymentId: string;
  loanId: string;
  accountNumber: string;
  customerId: string;
  customerName: string;
  customerNumber?: string;
  amount: number;
  paymentDate: string;
  valueDate: string;
  paymentMethod: string;
  referenceNumber?: string;
  allocationSummary: {
    principal: number;
    interest: number;
    fees: number;
    penalty: number;
    advancePrincipal: number;
    unallocated: number;
  };
  postPaymentBalances?: {
    remainingPrincipal: number;
    totalOutstanding: number;
    nextDueDate: string;
  };
  generatedAt: string;
  generatedBy: string;
  pdfUrl?: string;
}

export interface PaymentReversalRecord {
  id: string;
  reversalNumber: string; // e.g. REV-2026-000104
  paymentId: string;
  loanId: string;
  amount: number;
  reason: string;
  notes?: string;
  reversedBy: string;
  reversedByName: string;
  reversedAt: string;
  compensatingTxnId?: string;
}

export interface PaymentHistoryRecord {
  id: string;
  paymentId: string;
  timestamp: string;
  event: string;
  actor: string;
  actorName: string;
  actorRole: string;
  previousState?: string;
  newState?: string;
  amount?: number;
  reference?: string;
  reason?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface UnallocatedPaymentRecord {
  id: string;
  paymentId: string;
  paymentNumber: string;
  loanId: string;
  accountNumber: string;
  customerId: string;
  customerName: string;
  totalAmount: number;
  allocatedAmount: number;
  remainingAmount: number;
  status: UnallocatedStatus;
  reason?: string;
  paymentDate: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  paymentNumber: string; // e.g. PAY-2026-000482
  loanId: string;
  accountNumber: string;
  customerId: string;
  customerNumber?: string;
  customerName: string;
  customerMobile?: string;
  branchId?: string;
  branchName?: string;

  amount: number;
  allocatedAmount: number;
  unallocatedAmount: number;

  paymentDate: string; // YYYY-MM-DD
  valueDate: string; // YYYY-MM-DD
  postingDate?: string;
  paymentMethod: PaymentMethodType;
  referenceNumber?: string; // external UTR / Cheque No / Ref
  bankName?: string;
  channel?: string;
  status: PaymentStatus;
  idempotencyKey?: string;

  notes?: string;
  supportingDocument?: {
    name: string;
    url: string;
    sizeBytes?: number;
    type?: string;
  };

  receivedBy: string;
  receivedByName: string;

  verifiedBy?: string;
  verifiedByName?: string;
  verifiedAt?: string;

  postedBy?: string;
  postedByName?: string;
  postedAt?: string;

  reversedBy?: string;
  reversedByName?: string;
  reversedAt?: string;
  reversalReason?: string;

  receiptNumber?: string;
  receipt?: PaymentReceiptRecord;
  reversal?: PaymentReversalRecord;
  allocations: PaymentAllocationRecord[];
  history: PaymentHistoryRecord[];

  createdAt: string;
  updatedAt: string;
}

export interface RecordPaymentPayload {
  loanId: string;
  amount: number;
  paymentDate: string;
  valueDate: string;
  paymentMethod: PaymentMethodType;
  referenceNumber?: string;
  bankName?: string;
  channel?: string;
  notes?: string;
  idempotencyKey?: string;
  supportingDocument?: {
    name: string;
    url: string;
    sizeBytes?: number;
    type?: string;
  };
  requireVerification?: boolean;
}

export interface PaymentFilterState {
  search: string;
  status: string;
  paymentMethod: string;
  branchId: string;
  dateFrom: string;
  dateTo: string;
  minAmount?: number;
  maxAmount?: number;
}
