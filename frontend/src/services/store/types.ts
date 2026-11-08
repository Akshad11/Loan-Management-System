import {
  LMSUser,
  Role,
  Branch,
  AdminAuditEntry,
  CustomerRecord,
  CustomerApplicationItem,
  CustomerLoanItem,
  CustomerHistoryItem,
  KycRecord,
  DocumentItem,
  ChecklistRequirement,
  LoanProductConfig,
  LoanApplicationRecord,
  ApplicationHistoryItem,
  CreditAssessmentRecord,
} from '../../types';
import {
  ApprovalRecord,
  ApprovalMatrixRule,
  ApprovalMatrixAuditItem,
} from '../../types/approvalTypes';
import { SanctionRecord } from '../../types/sanctionTypes';
import { DisbursementRecord } from '../../types/disbursementTypes';
import { LoanAccountRecord } from '../../types/loanAccountTypes';
import { PaymentRecord, UnallocatedPaymentRecord } from '../../types/repaymentTypes';
import {
  RecoveryCaseRecord,
  LegalCaseRecord,
  LegalNoticeRecord,
} from '../../types/recoveryTypes';
import { RestructuringRequestRecord } from '../../types/restructuringTypes';

export interface LMSStoreContext {
  users: LMSUser[];
  roles: Role[];
  branches: Branch[];
  auditLogs: AdminAuditEntry[];
  customers: CustomerRecord[];
  customerApplications: CustomerApplicationItem[];
  customerLoans: CustomerLoanItem[];
  customerHistory: CustomerHistoryItem[];
  kycRecords: KycRecord[];
  documents: DocumentItem[];
  checklistRequirements: ChecklistRequirement[];
  applications: LoanApplicationRecord[];
  applicationHistory: Record<string, ApplicationHistoryItem[]>;
  loanProductsConfig: LoanProductConfig[];
  creditAssessments: CreditAssessmentRecord[];
  approvals: ApprovalRecord[];
  approvalMatrixRules: ApprovalMatrixRule[];
  approvalMatrixAudits: ApprovalMatrixAuditItem[];
  sanctions: SanctionRecord[];
  disbursements: DisbursementRecord[];
  loanAccounts: LoanAccountRecord[];
  payments: PaymentRecord[];
  unallocatedPayments: UnallocatedPaymentRecord[];
  recoveryCases: RecoveryCaseRecord[];
  legalCases: LegalCaseRecord[];
  legalNotices: LegalNoticeRecord[];
  restructuringRequests: RestructuringRequestRecord[];
  formResponses: Record<string, any>;

  nextCustomerNumberSeq: number;
  nextAppNumberSeq: number;
  nextAssessmentSeq: number;
  nextApprovalSeq: number;
  nextSanctionSeq: number;
  nextDisbursementSeq: number;
  nextDisbursementReqSeq: number;
  nextTransactionSeq: number;
  nextLoanSeq: number;
  nextPaymentSeq: number;
  nextRecoverySeq: number;
  nextLegalCaseSeq: number;
  nextLegalNoticeSeq: number;
  nextLegalReviewSeq: number;
  nextEscalationSeq: number;
  nextRestructuringSeq: number;

  notify: () => void;
  syncApi: (url: string, method: string, data?: any) => void;
}

