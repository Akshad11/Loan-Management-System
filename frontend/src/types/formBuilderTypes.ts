// Loan Product & Custom Multi-Page Form Builder Domain Types

export type ProductCategory =
  | 'HOUSING'
  | 'PERSONAL'
  | 'VEHICLE'
  | 'BUSINESS'
  | 'GOLD'
  | 'EDUCATION'
  | 'RETAIL'
  | 'SME';

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type FieldType =
  | 'TEXT'
  | 'TEXTAREA'
  | 'NUMBER'
  | 'CURRENCY'
  | 'PERCENTAGE'
  | 'DATE'
  | 'DATETIME'
  | 'SELECT'
  | 'RADIO'
  | 'CHECKBOX'
  | 'MULTI_SELECT'
  | 'FILE'
  | 'MULTI_FILE'
  | 'IMAGE'
  | 'SIGNATURE'
  | 'EMAIL'
  | 'PHONE'
  | 'ADDRESS'
  | 'YES_NO'
  | 'HEADING'
  | 'DESCRIPTION'
  | 'DIVIDER'
  | 'CALCULATED';

export type FormFieldLayout = '1_COL' | '2_COL' | '3_COL' | 'FULL_WIDTH';

export type ConditionOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'GREATER_THAN'
  | 'LESS_THAN'
  | 'IN'
  | 'NOT_IN'
  | 'IS_EMPTY'
  | 'IS_NOT_EMPTY';

export type ConditionAction = 'SHOW' | 'HIDE' | 'ENABLE' | 'DISABLE' | 'REQUIRE';

export interface FieldCondition {
  dependentFieldId: string;
  operator: ConditionOperator;
  triggerValue: any;
  action: ConditionAction;
}

export interface FormFieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  regexPattern?: string;
  customErrorMessage?: string;
  acceptedFileTypes?: string[];
  maxFileSizeMB?: number;
  maxFilesCount?: number;
}

export interface FormFieldDefinition {
  id: string; // Stable unique ID (e.g. "applicant_pan", "prop_valuation")
  type: FieldType;
  label: string;
  placeholder?: string;
  description?: string;
  defaultValue?: any;
  required?: boolean;
  readOnly?: boolean;
  hidden?: boolean;
  width: FormFieldLayout;
  options?: string[]; // For SELECT, RADIO, MULTI_SELECT
  validation?: FormFieldValidation;
  condition?: FieldCondition;
  calculationFormula?: string; // For CALCULATED fields (e.g. "{prop_value} * 0.8")
}

export interface FormPageSection {
  id: string;
  title?: string;
  description?: string;
  columns?: number; // 1, 2, or 3 column layout
  fields: FormFieldDefinition[];
}

export interface FormPageDefinition {
  id: string;
  pageNumber: number;
  title: string;
  description?: string;
  sections: FormPageSection[];
}

export interface FormSchemaDefinition {
  pages: FormPageDefinition[];
  metadata?: {
    productCode?: string;
    productName?: string;
    estimatedCompletionMinutes?: number;
  };
  settings?: {
    allowSaveDraft?: boolean;
    requireSignature?: boolean;
    autoAdvanceOnSelect?: boolean;
  };
}

export interface FormVersionRecord {
  id: string;
  formTemplateId: string;
  versionNumber: number;
  status: 'DRAFT' | 'PUBLISHED' | 'SUPERSEDED' | 'ARCHIVED';
  schemaJson: FormSchemaDefinition;
  publishedAt?: string;
  publishedBy?: string;
  changeSummary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FormTemplateRecord {
  id: string;
  productId: string;
  title: string;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  currentVersion: number;
  versions?: FormVersionRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface LoanProductRecord {
  id: string;
  code: string;
  name: string;
  category: ProductCategory;
  description?: string;
  minAmount: number;
  maxAmount: number;
  minTenureMonths: number;
  maxTenureMonths: number;
  baseInterestRate: number;
  maxInterestRate?: number;
  interestMethod: 'REDUCING_BALANCE' | 'FLAT_RATE' | 'SIMPLE_INTEREST';
  repaymentFrequency: 'MONTHLY' | 'WEEKLY' | 'BI_WEEKLY' | 'QUARTERLY';
  processingFeePercent: number;
  processingFeeFlat: number;
  documentationCharges: number;
  allowedFrequencies?: string[];
  requiredDocumentTypes?: string[];
  eligibilityCriteria?: {
    minAge?: number;
    maxAge?: number;
    minMonthlyIncome?: number;
    allowedEmploymentTypes?: string[];
  };
  minCreditScore?: number;
  status: ProductStatus;
  version: number;
  activeFormVersionId?: string;
  activeFormVersion?: FormVersionRecord;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SignatureCaptureData {
  signatureDataUrl: string; // Base64 data URL from canvas
  signedAt: string;
  signerName: string;
  signerRole?: string;
  ipAddress?: string;
}

export interface LoanApplicationFormResponseRecord {
  id: string;
  applicationId: string;
  formVersionId: string;
  productId: string;
  responses: Record<string, any>;
  signatures?: Record<string, SignatureCaptureData>;
  uploadedDocumentIds?: Record<string, any[]>;
  completionPercentage: number;
  currentPageIndex: number;
  isSubmitted: boolean;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}
