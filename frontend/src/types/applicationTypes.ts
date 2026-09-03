import { LoanRepaymentFrequency } from './loanAccountTypes';
export type { LoanRepaymentFrequency };

export type ApplicationWorkflowStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'DOCUMENT_PENDING'
  | 'CREDIT_ASSESSMENT'
  | 'CREDIT_ASSESSED'
  | 'APPROVED'
  | 'SANCTIONED'
  | 'DISBURSED'
  | 'REJECTED'
  | 'CANCELLED';

export type LoanPurposeCategory =
  | 'PERSONAL'
  | 'HOME_PURCHASE'
  | 'HOME_IMPROVEMENT'
  | 'EDUCATION'
  | 'MEDICAL_EMERGENCY'
  | 'BUSINESS_EXPANSION'
  | 'WORKING_CAPITAL'
  | 'VEHICLE_PURCHASE'
  | 'DEBT_CONSOLIDATION'
  | 'OTHER';

export type CoApplicantRelationship =
  | 'SPOUSE'
  | 'PARENT'
  | 'CHILD'
  | 'SIBLING'
  | 'BUSINESS_PARTNER'
  | 'OTHER';

export type GuarantorRelationship =
  | 'PARENT'
  | 'SPOUSE'
  | 'SIBLING'
  | 'RELATIVE'
  | 'BUSINESS_PARTNER'
  | 'OTHER';

export type GuaranteeType = 'INDIVIDUAL' | 'BUSINESS';

export type ApplicationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ApplicationDocumentTypeConfig {
  type: string;
  title: string;
  description: string;
  isMandatory: boolean;
  canUseCustomerKyc: boolean;
}

export type ApplicationDocumentStatus =
  | 'MISSING'
  | 'UPLOADED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'NOT_REQUIRED';

export type ApplicationDocumentSource = 'CUSTOMER_KYC' | 'APPLICATION_UPLOAD';

export interface LoanProductConfig {
  code: string;
  name: string;
  category: 'PERSONAL' | 'HOME' | 'BUSINESS' | 'AUTO' | 'LAP';
  description: string;
  minAmount: number;
  maxAmount: number;
  minTenureMonths: number;
  maxTenureMonths: number;
  baseInterestRate: number;
  allowedFrequencies: LoanRepaymentFrequency[];
  requiredDocumentTypes: {
    type: string;
    title: string;
    description: string;
    isMandatory: boolean;
    canUseCustomerKyc: boolean;
  }[];
}

export interface CoApplicantRecord {
  id: string;
  applicationId: string;
  customerId: string;
  customerNumber: string;
  customerName: string;
  mobile: string;
  relationship: CoApplicantRelationship;
  kycStatus: string;
  monthlyIncome?: number;
  panMasked?: string;
  existingLoansCount?: number;
  totalOutstanding?: number;
  notes?: string;
  addedAt: string;
  addedBy: string;
}

export interface GuarantorRecord {
  id: string;
  applicationId: string;
  customerId: string;
  customerNumber: string;
  customerName: string;
  mobile: string;
  relationship: GuarantorRelationship;
  guaranteeType: GuaranteeType;
  kycStatus: string;
  netWorthEstimated?: number;
  panMasked?: string;
  notes?: string;
  addedAt: string;
  addedBy: string;
}

export interface ApplicationDocumentRecord {
  id: string;
  applicationId: string;
  documentType: string;
  documentTitle: string;
  source: ApplicationDocumentSource;
  documentVaultId?: string; // Link to vault DocumentItem if sourced from KYC
  fileName?: string;
  fileFormat?: 'PDF' | 'JPG' | 'PNG' | 'DOCX' | 'TIFF' | string;
  fileSizeKb?: number;
  status: ApplicationDocumentStatus;
  isMandatory: boolean;
  uploadedAt?: string;
  uploadedBy?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  notes?: string;
}

export type ApplicationEventType =
  | 'APPLICATION_CREATED'
  | 'APPLICATION_UPDATED'
  | 'CO_APPLICANT_ADDED'
  | 'CO_APPLICANT_REMOVED'
  | 'GUARANTOR_ADDED'
  | 'GUARANTOR_REMOVED'
  | 'DOCUMENT_LINKED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_VERIFIED'
  | 'DOCUMENT_REJECTED'
  | 'DOCUMENT_REMOVED'
  | 'APPLICATION_SUBMITTED'
  | 'STATUS_CHANGED'
  | 'APPLICATION_CANCELLED';

export interface ApplicationHistoryItem {
  id: string;
  applicationId: string;
  eventType?: ApplicationEventType;
  action?: string;
  actor?: string;
  actorName?: string;
  actorRole: string;
  timestamp: string;
  description?: string;
  details?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface SubmissionDeclarationState {
  accurateInfoConfirmed: boolean;
  supportingDocsConfirmed: boolean;
  termsAgreed: boolean;
  declaredBy: string;
  declaredAt: string;
}

export interface LoanApplicationRecord {
  id: string;
  applicationNumber: string; // e.g. APP-2026-001842
  customerId: string;
  customerNumber: string;
  customerName: string;
  customerMobile: string;
  customerKycStatus: string;
  customerMonthlyIncome: number;
  customerEmploymentType: string;
  customerExistingLoansCount: number;
  customerTotalExposure: number;
  productCode: string;
  productName: string;
  requestedAmount: number; // Strictly Requested Amount in Batch 5
  sanctionedAmount?: number;
  requestedTenureMonths: number;
  interestRate: number;
  repaymentFrequency: LoanRepaymentFrequency;
  preferredRepaymentDate?: number;
  purpose: string;
  purposeCategory: LoanPurposeCategory;
  branchId: string;
  branchName: string;
  loanOfficer: string;
  assignedOfficerId: string;
  applicationDate: string;
  status: ApplicationWorkflowStatus;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  coApplicants: CoApplicantRecord[];
  guarantors: GuarantorRecord[];
  documents: ApplicationDocumentRecord[];
  history?: ApplicationHistoryItem[];
  notes?: string;
  submissionDeclarations?: SubmissionDeclarationState;
  submittedAt?: string;
  submittedBy?: string;
  createdDate: string;
  createdBy: string;
  updatedDate: string;
  lastSavedAt?: string;
  rejectionReason?: string;
  cancellationReason?: string;
}

export interface ApplicationFilterState {
  search: string;
  status: string;
  productCode: string;
  branchId: string;
  loanOfficer: string;
  dateFrom: string;
  dateTo: string;
  minAmount?: number;
  maxAmount?: number;
}

export const DEFAULT_APPLICATION_FILTERS: ApplicationFilterState = {
  search: '',
  status: 'ALL',
  productCode: 'ALL',
  branchId: 'ALL',
  loanOfficer: 'ALL',
  dateFrom: '',
  dateTo: '',
  minAmount: undefined,
  maxAmount: undefined,
};

export interface ApplicationValidationResult {
  isValid: boolean;
  blockers: string[];
  warnings: string[];
  passedChecks: string[];
}
