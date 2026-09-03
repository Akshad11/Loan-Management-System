// Batch 10 — Real Loan Account & Repayment Setup Types

export type LoanAccountStatus =
  | 'PENDING_ACTIVATION'
  | 'ACTIVE'
  | 'PARTIALLY_DISBURSED'
  | 'OVERDUE'
  | 'MATURED'
  | 'FORECLOSURE_PENDING'
  | 'CLOSED'
  | 'CANCELLED'
  | 'WRITTEN_OFF';

export type InterestMethod = 'REDUCING_BALANCE' | 'FLAT_RATE' | 'SIMPLE_INTEREST';

export type LoanRepaymentFrequency = 'MONTHLY' | 'WEEKLY' | 'BI_WEEKLY' | 'QUARTERLY';

export type ScheduleItemStatus =
  | 'FUTURE'
  | 'DUE'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'WAIVED'
  | 'CANCELLED';

export type ScheduleVersionStatus = 'ACTIVE' | 'SUPERSEDED' | 'DRAFT';

export type MandateStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'ACTIVE'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED';

export type LoanPaymentMethod =
  | 'NACH_EMANDATE'
  | 'BANK_TRANSFER'
  | 'UPI'
  | 'CHEQUE'
  | 'CASH'
  | 'MANUAL_POSTING';

export type LoanTransactionType =
  | 'DISBURSEMENT'
  | 'REPAYMENT'
  | 'REVERSAL'
  | 'CHARGE'
  | 'WAIVER'
  | 'ADJUSTMENT'
  | 'FORECLOSURE';

export type LoanChargeType =
  | 'PROCESSING_FEE'
  | 'DOCUMENTATION_CHARGES'
  | 'INSURANCE'
  | 'LATE_PAYMENT_FEE'
  | 'ADMINISTRATIVE_FEE'
  | 'PREPAYMENT_PENALTY'
  | 'LEGAL_FEE'
  | 'OTHER';

export type LoanChargeTiming =
  | 'ORIGINATION_DEDUCTED'
  | 'ORIGINATION_CAPITALIZED'
  | 'PER_INSTALMENT'
  | 'ON_EVENT'
  | 'POST_DISBURSEMENT';

export type LoanChargeStatus =
  | 'PENDING'
  | 'DEDUCTED_AT_DISBURSEMENT'
  | 'CAPITALIZED'
  | 'PAID'
  | 'WAIVED';

export interface RepaymentScheduleItem {
  id: string;
  loanId: string;
  versionId: string;
  versionNumber: number;
  instalmentNumber: number;
  dueDate: string;
  openingPrincipal: number;
  principalDue: number;
  interestDue: number;
  feesDue: number;
  instalmentAmount: number;
  closingPrincipal: number;
  principalPaid: number;
  interestPaid: number;
  feesPaid: number;
  totalPaid: number;
  outstandingAmount: number;
  status: ScheduleItemStatus;
  dpd: number;
  paidDate?: string;
  paymentReference?: string;
}

export interface RepaymentScheduleVersion {
  id: string;
  loanId: string;
  version: number;
  reason: string;
  effectiveDate: string;
  totalInstalments: number;
  totalPrincipal: number;
  totalInterest: number;
  totalAmount: number;
  status: ScheduleVersionStatus;
  createdAt: string;
  createdBy: string;
  schedules?: RepaymentScheduleItem[];
}

export interface LoanChargeItem {
  id: string;
  loanId: string;
  chargeTypeId: string;
  chargeCode: string;
  chargeName: string;
  chargeType: LoanChargeType;
  calculationType: 'FIXED' | 'PERCENTAGE_OF_PRINCIPAL' | 'PERCENTAGE_OF_SANCTION';
  rateOrValue: number;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  chargeTiming: LoanChargeTiming;
  dueDate?: string;
  status: LoanChargeStatus;
  source: string;
  createdAt: string;
  createdBy: string;
}

export interface LoanRepaymentSettings {
  id: string;
  loanId: string;
  repaymentFrequency: LoanRepaymentFrequency;
  paymentMethod: LoanPaymentMethod;
  mandateStatus: MandateStatus;
  mandateReference?: string;
  bankAccountMasked?: string;
  bankName?: string;
  ifscCode?: string;
  accountHolderName?: string;
  preferredDebitDate: number; // e.g. 5 for 5th of every month
  gracePeriodDays: number;
  updatedAt: string;
  updatedBy: string;
}

export interface LoanTransactionItem {
  id: string;
  loanId: string;
  accountNumber: string;
  transactionReference: string;
  transactionType: LoanTransactionType;
  amount: number;
  principalPortion: number;
  interestPortion: number;
  feePortion: number;
  penaltyPortion: number;
  status: 'SUCCESSFUL' | 'PENDING' | 'FAILED' | 'REVERSED';
  referenceId?: string;
  utrNumber?: string;
  paymentMethod?: string;
  notes?: string;
  transactionDate: string;
  createdAt: string;
  createdBy: string;
}

export interface LoanHistoryItem {
  id: string;
  loanId: string;
  timestamp: string;
  action: string;
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

export interface LoanAccountRecord {
  id: string;
  accountNumber: string; // e.g. LN-2026-000921
  customerId: string;
  customerNumber: string;
  customerName: string;
  customerMobile?: string;
  customerEmail?: string;
  customerAddress?: string;

  applicationId?: string;
  applicationNumber?: string;
  productCode: string;
  productName: string;
  approvalId?: string;
  approvalNumber?: string;
  sanctionId?: string;
  sanctionNumber?: string;
  primaryDisbursementId?: string;
  primaryDisbursementNumber?: string;
  branchId: string;
  branchName: string;
  assignedOfficer: string;
  assignedOfficerId: string;

  // Financial Balances & Balances
  originalPrincipal: number;
  disbursedPrincipal: number;
  principalOutstanding: number;
  outstandingPrincipal?: number; // Compatibility alias for principalOutstanding
  interestOutstanding: number;
  feeOutstanding: number;
  penaltyOutstanding: number;
  totalOutstanding: number;

  totalPaidAmount: number;
  totalPrincipalPaid: number;
  totalInterestPaid: number;
  totalFeesPaid: number;
  principalPaid?: number;
  interestPaid?: number;
  feePaid?: number;
  penaltyPaid?: number;
  totalPaid?: number;

  overdueAmount: number;
  dpd: number; // Days Past Due
  dpdBucket: 'CURRENT' | '1-30 DPD' | '31-60 DPD' | '61-90 DPD' | '90+ DPD';
  status: LoanAccountStatus;

  // Loan Terms
  interestRate: number; // e.g. 14.0 (% per annum)
  interestMethod: InterestMethod;
  repaymentFrequency: LoanRepaymentFrequency;
  tenureMonths: number;
  remainingTenureMonths?: number; // Compatibility alias
  totalInstalments: number;
  remainingInstalments: number;
  emiAmount: number;
  productId?: string;
  loanType?: string;
  sanctionedAmount?: number;
  disbursedAmount?: number;

  // Key Dates
  disbursementDate: string;
  firstDisbursementDate?: string;
  loanStartDate: string;
  firstDueDate: string;
  maturityDate: string;
  nextDueDate: string;

  // Repayment Settings & Schedule
  repaymentSettings: LoanRepaymentSettings;
  currentScheduleVersion: number;
  scheduleVersions?: RepaymentScheduleVersion[];
  schedules?: RepaymentScheduleItem[];
  charges?: LoanChargeItem[];
  transactions?: LoanTransactionItem[];
  history?: LoanHistoryItem[];

  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface LoanFilterState {
  search: string;
  status: string;
  productCode: string;
  branchId: string;
  assignedOfficer: string;
  dpdBucket: string;
  minOutstanding?: number;
  maxOutstanding?: number;
  disbursementDateFrom: string;
  disbursementDateTo: string;
  maturityDateFrom: string;
  maturityDateTo: string;
}
