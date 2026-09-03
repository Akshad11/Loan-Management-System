import { ApplicationWorkflowStatus } from './applicationTypes';
import { LoanAccountStatus } from './loanAccountTypes';

export type { LoanAccountStatus };

// Customer Types for Batch 3 LMS

export type CustomerType = 'INDIVIDUAL' | 'BUSINESS';

export type CustomerRecordStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';

export type EmploymentType =
  | 'SALARIED'
  | 'SELF_EMPLOYED'
  | 'BUSINESS_OWNER'
  | 'PROFESSIONAL'
  | 'RETIRED'
  | 'OTHER';

export interface AddressInfo {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pinCode: string;
}

export interface CustomerRecord {
  id: string;
  customerNumber: string; // e.g. "CUS-000184"
  firstName: string;
  middleName?: string;
  lastName: string;
  name: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: Gender;
  maritalStatus?: MaritalStatus;
  nationality: string; // Default: "Indian"
  customerType: CustomerType;
  mobile: string;
  alternateMobile?: string;
  email?: string;
  preferredContact: 'MOBILE' | 'EMAIL';
  currentAddress: AddressInfo;
  permanentAddress: AddressInfo;
  sameAsCurrentAddress: boolean;
  employmentType: EmploymentType;
  employerName?: string;
  occupation?: string;
  monthlyIncome: number;
  employmentSince?: string;
  bankName?: string;
  accountNumberMasked?: string;
  accountNumber?: string;
  ifscCode?: string;
  branchId: string;
  branchName: string;
  status: CustomerRecordStatus;
  createdDate: string;
  updatedDate: string;
  assignedOfficer: string;
  activeLoanCount: number;
  closedLoanCount: number;
  totalOutstanding: number;
  totalOverdue: number;
  cibilScore?: number;
  panMasked?: string;
  aadhaarMasked?: string;
  archivedReason?: string;
  archivedDate?: string;
  archivedBy?: string;
}

export interface CustomerApplicationItem {
  id: string;
  applicationNumber: string; // e.g. "APP-2026-001842"
  customerId: string;
  customerName: string;
  productCode: string;
  productName: string;
  requestedAmount: number;
  tenureMonths: number;
  interestRate: number;
  applicationDate: string;
  appliedDate?: string;
  status: ApplicationWorkflowStatus;
  branchId: string;
  branchName: string;
  assignedOfficer: string;
  purpose: string;
  remarks?: string;
}

export interface CustomerLoanItem {
  id: string;
  accountNumber: string; // e.g. "LN-2026-000921"
  loanAccountNumber?: string;
  customerId: string;
  customerName: string;
  applicationNumber?: string;
  productCode: string;
  productName: string;
  originalPrincipal: number;
  sanctionedAmount?: number;
  outstandingPrincipal: number;
  interestRate: number;
  emiAmount: number;
  disbursementDate: string;
  disbursedDate?: string;
  nextDueDate: string;
  dpd: number; // Days past due
  overdueAmount: number;
  totalTenureMonths: number;
  remainingTenureMonths: number;
  status: LoanAccountStatus;
  branchName: string;
}

export type CustomerHistoryEventType =
  | 'CUSTOMER_CREATED'
  | 'CUSTOMER_UPDATED'
  | 'CUSTOMER_ARCHIVED'
  | 'CUSTOMER_RESTORED'
  | 'KYC_STATUS_CHANGED'
  | 'KYC_SUBMITTED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_VERIFIED'
  | 'DOCUMENT_REJECTED'
  | 'DOCUMENT_WAIVED'
  | 'APPLICATION_CREATED'
  | 'APPLICATION_SUBMITTED'
  | 'CREDIT_ASSESSMENT'
  | 'APPROVAL'
  | 'SANCTION'
  | 'LOAN_ACCOUNT_CREATED'
  | 'DISBURSEMENT'
  | 'REPAYMENT'
  | 'STATUS_CHANGE';

export interface CustomerHistoryItem {
  id: string;
  customerId: string;
  timestamp: string;
  eventType: CustomerHistoryEventType;
  title: string;
  actor: string;
  actorRole: string;
  entityReference?: string;
  description: string;
  module: string;
  metadata?: Record<string, string | number>;
}

export interface CustomerFilterState {
  search: string;
  status: string; // 'ALL' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  customerType: string; // 'ALL' | 'INDIVIDUAL' | 'BUSINESS'
  branchId: string;
  createdDateFrom: string;
  createdDateTo: string;
  hasExistingLoan: string; // 'ALL' | 'YES' | 'NO'
  loanStatus: string; // 'ALL' | 'ACTIVE' | 'CLOSED' | 'OVERDUE'
}

export const DEFAULT_CUSTOMER_FILTERS: CustomerFilterState = {
  search: '',
  status: 'ALL',
  customerType: 'ALL',
  branchId: 'ALL',
  createdDateFrom: '',
  createdDateTo: '',
  hasExistingLoan: 'ALL',
  loanStatus: 'ALL',
};
