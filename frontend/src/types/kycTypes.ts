export type KycStatus =
  | 'UNVERIFIED'
  | 'PENDING_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'ACTION_REQUIRED'
  | 'SUSPENDED';

export type KycLevel = 'TIER_1_BASIC' | 'TIER_2_STANDARD' | 'TIER_3_FULL_CKYC';

export type KycRiskCategory = 'LOW' | 'MEDIUM' | 'HIGH' | 'PEP' | 'AML_WATCHLIST';

export type KycVerificationMethod =
  | 'DIGILOCKER_XML'
  | 'UIDAI_OTP'
  | 'NSDL_PAN_API'
  | 'VIDEO_KYC'
  | 'IN_PERSON_BRANCH'
  | 'PHYSICAL_VERIFICATION';

export interface GovernmentIdRecord {
  idType: 'PAN' | 'AADHAAR' | 'PASSPORT' | 'VOTER_ID' | 'DRIVING_LICENSE' | 'GSTIN';
  idNumberMasked: string;
  nameOnId: string;
  nameMatchPercentage: number;
  dobOnId: string;
  issuedDate?: string;
  expiryDate?: string;
  verificationSource: string;
  verificationTimestamp: string;
  isVerified: boolean;
  status: 'VALID' | 'INVALID' | 'MISMATCH' | 'EXPIRED' | 'UNVERIFIED';
  apiReferenceId?: string;
  remarks?: string;
}

export interface VideoKycRecord {
  sessionId: string;
  completedAt: string;
  officerName: string;
  officerEmployeeId: string;
  durationSeconds: number;
  geoLatitude: number;
  geoLongitude: number;
  ipAddress: string;
  livenessConfidence: number; // 0-100
  faceMatchScore: number; // 0-100
  audioRecordingUrl?: string;
  snapshotUrl?: string;
  panCardSnapshotUrl?: string;
  signatureSnapshotUrl?: string;
  status: 'PASSED' | 'FAILED' | 'FLAGGED';
  notes: string;
}

export interface KycRecord {
  id: string;
  customerId: string;
  customerNumber: string;
  customerName: string;
  customerType: 'INDIVIDUAL' | 'BUSINESS';
  status: KycStatus;
  kycLevel: KycLevel;
  riskCategory: KycRiskCategory;
  cKycNumber?: string; // Central KYC Registry 14-digit number
  panRecord: GovernmentIdRecord;
  aadhaarRecord: GovernmentIdRecord;
  secondaryIdRecord?: GovernmentIdRecord;
  videoKycRecord?: VideoKycRecord;
  assignedOfficer?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  rejectionRemarks?: string;
  actionRequiredNotes?: string;
  lastReviewedAt: string;
  nextReviewDate?: string;
  createdDate: string;
  updatedDate: string;
  complianceNotes?: string;
  pepDeclared: boolean;
  fatcaCompliant: boolean;
  amlCheckStatus: 'CLEARED' | 'FLAGGED' | 'MANUAL_REVIEW_NEEDED';
}

export type DocumentCategory =
  | 'IDENTITY_PROOF'
  | 'ADDRESS_PROOF'
  | 'INCOME_PROOF'
  | 'BANKING_PROOF'
  | 'COLLATERAL_PROPERTY'
  | 'BUSINESS_INCORPORATION'
  | 'LOAN_CONTRACT'
  | 'PHOTOGRAPH_SIGNATURE';

export type DocumentStatus =
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'EXPIRING_SOON'
  | 'WAIVED'
  | 'ACTION_REQUIRED';

export interface DocumentItem {
  id: string;
  customerId: string;
  customerNumber: string;
  customerName: string;
  loanApplicationId?: string;
  loanAccountNumber?: string;
  category: DocumentCategory;
  documentType: string;
  documentTitle: string;
  documentNumberMasked?: string;
  fileName: string;
  fileFormat: 'PDF' | 'JPG' | 'PNG' | 'TIFF';
  fileSizeKb: number;
  uploadedAt: string;
  uploadedBy: string;
  uploadedByRole: string;
  version: number;
  status: DocumentStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  rejectionNotes?: string;
  issuedDate?: string;
  expiryDate?: string; // null if lifetime valid
  isLifetimeValid: boolean;
  ocrExtractedData?: {
    name?: string;
    documentNumber?: string;
    dob?: string;
    address?: string;
    issuedDate?: string;
    expiryDate?: string;
    incomeAmount?: number;
    accountNumber?: string;
    confidenceScore: number; // 0-100
  };
  tamperScore?: number; // 0-100 (0 = clean, >50 = suspicious)
  previewUrl?: string;
  downloadCount: number;
}

export interface ChecklistRequirement {
  id: string;
  category: DocumentCategory;
  documentType: string;
  title: string;
  description: string;
  isMandatory: boolean;
  applicableCustomerTypes: ('INDIVIDUAL' | 'BUSINESS')[];
  applicableLoanTypes?: string[];
  maxAgeDays?: number; // For salary slips (e.g. max 90 days old) or bank statements
}

export interface KycFilterState {
  search: string;
  status: string;
  riskCategory: string;
  kycLevel: string;
  branchId: string;
  amlStatus: string;
}

export const DEFAULT_KYC_FILTERS: KycFilterState = {
  search: '',
  status: 'ALL',
  riskCategory: 'ALL',
  kycLevel: 'ALL',
  branchId: 'ALL',
  amlStatus: 'ALL',
};

export interface DocumentFilterState {
  search: string;
  category: string;
  status: string;
  expiryRange: string;
  customerType: string;
}

export const DEFAULT_DOCUMENT_FILTERS: DocumentFilterState = {
  search: '',
  category: 'ALL',
  status: 'ALL',
  expiryRange: 'ALL',
  customerType: 'ALL',
};
