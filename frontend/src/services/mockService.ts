import { useState, useEffect } from 'react';
import * as adminSlice from './store/slices/adminSlice';
import * as customerKycSlice from './store/slices/customerKycSlice';
import * as applicationSlice from './store/slices/applicationSlice';
import * as creditApprovalSlice from './store/slices/creditApprovalSlice';
import * as sanctionSlice from './store/slices/sanctionSlice';
import * as disbursementSlice from './store/slices/disbursementSlice';
import * as loanServicingSlice from './store/slices/loanServicingSlice';
import * as recoveryRestructuringSlice from './store/slices/recoveryRestructuringSlice';
import {
  LMSUser,
  Role,
  Branch,
  AdminAuditEntry,
  UserStatus,
  RoleStatus,
  BranchStatus,
  CustomerRecord,
  CreateCustomerInput,
  CustomerApplicationItem,
  CustomerLoanItem,
  CustomerHistoryItem,
  CustomerType,
  Gender,
  MaritalStatus,
  EmploymentType,
  AddressInfo,
  KycRecord,
  DocumentItem,
  ChecklistRequirement,
  KycRiskCategory,
  KycStatus,
  DocumentStatus,
  GovernmentIdRecord,
  VideoKycRecord,
  LoanProductConfig,
  LoanApplicationRecord,
  ApplicationHistoryItem,
  CoApplicantRecord,
  GuarantorRecord,
  ApplicationDocumentRecord,
  SubmissionDeclarationState,
  ApplicationValidationResult,
  ApplicationWorkflowStatus,
  CreditAssessmentRecord,
  AssessmentStatus,
  CreditRecommendation,
  ObligationItem,
  AssessmentConditionItem,
  ConditionStatus,
  AssessmentVersionSnapshot,
  AssessmentTimelineEvent,
  AssessmentRuleItem,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_ROLES,
  INITIAL_BRANCHES,
  INITIAL_CHECKLIST_REQUIREMENTS,
  LOAN_PRODUCTS_CONFIG,
  INITIAL_APPROVAL_MATRIX_RULES,
} from '../config/systemTemplates';
import {
  ApprovalRecord,
  ApprovalLevelExecution,
  ApprovalMatrixRule,
  ApprovalMatrixAuditItem,
  ApprovalCondition,
  ApprovalException,
  ApprovalDecisionVersion,
  ApprovalHistoryItem,
  ApprovalDecisionType,
  ApprovalStatus,
} from '../types/approvalTypes';

import {
  SanctionRecord,
  SanctionTerms,
  SanctionCondition,
  SanctionLetterVersion,
  SanctionVersionSnapshot,
  SanctionHistoryItem,
  ReadinessCheckItem,
  PreDisbursementReadinessSummary,
  SanctionStatus,
  LetterStatus,
  ReadinessCheckStatus,
} from '../types/sanctionTypes';

import {
  DisbursementRecord,
  DisbursementRequestRecord,
  DisbursementBeneficiaryRecord,
  DisbursementTransactionRecord,
  DisbursementHistoryItem,
  DisbursementReadinessResult,
  DisbursementReadinessCheck,
  DisbursementStatus,
  PaymentMethod,
  TransactionStatus,
  DisbursementKPIsData,
} from '../types/disbursementTypes';

import {
  LoanAccountRecord,
  RepaymentScheduleVersion,
  RepaymentScheduleItem,
  LoanChargeItem,
  LoanRepaymentSettings,
  LoanTransactionItem,
  LoanHistoryItem,
  LoanRepaymentFrequency,
  InterestMethod,
} from '../types/loanAccountTypes';

import {
  generateRepaymentSchedule,
  calculateInstalmentAmount,
  roundMoney,
} from './loanFinancialService';
import {
  PaymentRecord,
  PaymentAllocationRecord,
  PaymentReceiptRecord,
  PaymentReversalRecord,
  PaymentHistoryRecord,
  UnallocatedPaymentRecord,
  RecordPaymentPayload,
  PaymentFilterState,
} from '../types/repaymentTypes';

import { executePaymentAllocation, executePaymentReversal } from './repaymentAllocationEngine';
import {
  RecoveryCaseRecord,
  RecoveryActionRecord,
  RecoveryEscalationRecord,
  RecoveryAssignmentRecord,
  RecoveryNegotiationRecord,
  LegalReviewRecord,
  LegalCaseRecord,
  LegalCaseEventRecord,
  LegalNoticeRecord,
  RecoveryKPIs,
  RecoveryFilterState,
  RecordRecoveryActionPayload,
  EscalateToRecoveryPayload,
  RequestLegalReviewPayload,
  CreateLegalCasePayload,
  CreateLegalNoticePayload,
} from '../types/recoveryTypes';

import {
  RestructuringRequestRecord,
  RestructuringEventRecord,
  RestructuringProposalRecord,
  CreateRestructuringPayload,
  RestructuringKPIs,
} from '../types/restructuringTypes';

import {
  evaluateRestructuringEligibility,
  generateRestructuringSchedulePreview,
  validateMakerChecker,
} from './restructuringEngine';
import {
  evaluateRecoveryEligibility,
  calculateRecoveryPriority,
  evaluateAutoCure,
  generateStatutoryNoticeText,
} from './recoveryEngine';

// Global singleton state to persist changes across views during the user session
class MockLMSStore {
  private users: LMSUser[] = [...INITIAL_USERS];
  private roles: Role[] = [...INITIAL_ROLES];
  private branches: Branch[] = [...INITIAL_BRANCHES];
  private auditLogs: AdminAuditEntry[] = [];
  private customers: CustomerRecord[] = [];
  private customerApplications: CustomerApplicationItem[] = [];
  private customerLoans: CustomerLoanItem[] = [];
  private customerHistory: CustomerHistoryItem[] = [];
  private kycRecords: KycRecord[] = [];
  private documents: DocumentItem[] = [];
  private checklistRequirements: ChecklistRequirement[] = [...INITIAL_CHECKLIST_REQUIREMENTS];
  private applications: LoanApplicationRecord[] = [];
  private applicationHistory: Record<string, ApplicationHistoryItem[]> = {};
  private loanProductsConfig: LoanProductConfig[] = [...LOAN_PRODUCTS_CONFIG];
  private creditAssessments: CreditAssessmentRecord[] = [];
  private approvals: ApprovalRecord[] = [];
  private approvalMatrixRules: ApprovalMatrixRule[] = [...INITIAL_APPROVAL_MATRIX_RULES];
  private approvalMatrixAudits: ApprovalMatrixAuditItem[] = [];
  private sanctions: SanctionRecord[] = [];
  private disbursements: DisbursementRecord[] = [];
  private loanAccounts: LoanAccountRecord[] = [];
  private payments: PaymentRecord[] = [];
  private unallocatedPayments: UnallocatedPaymentRecord[] = [];
  private recoveryCases: RecoveryCaseRecord[] = [];
  private legalCases: LegalCaseRecord[] = [];
  private legalNotices: LegalNoticeRecord[] = [];
  private restructuringRequests: RestructuringRequestRecord[] = [];
  private formResponses: Record<string, {
    applicationId: string;
    formVersionId?: string;
    responses: Record<string, any>;
    signatures?: Record<string, any>;
    isSubmitted?: boolean;
    submittedAt?: string;
    submittedBy?: string;
    updatedAt: string;
  }> = {};
  private nextCustomerNumberSeq: number = 101;
  private nextAppNumberSeq: number = 1001;
  private nextAssessmentSeq: number = 101;
  private nextApprovalSeq: number = 101;
  private nextSanctionSeq: number = 101;
  private nextDisbursementSeq: number = 101;
  private nextDisbursementReqSeq: number = 101;
  private nextTransactionSeq: number = 101;
  private nextLoanSeq: number = 1001;
  private nextPaymentSeq: number = 101;
  private nextRecoverySeq: number = 101;
  private nextLegalCaseSeq: number = 101;
  private nextLegalNoticeSeq: number = 101;
  private nextLegalReviewSeq: number = 101;
  private nextEscalationSeq: number = 101;
  private nextRestructuringSeq: number = 101;

  private listeners: Set<() => void> = new Set();
  private isLoadedFromDb: boolean = false;

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState() {
    return {
      users: this.users,
      roles: this.roles,
      branches: this.branches,
      auditLogs: this.auditLogs,
      customers: this.customers,
      customerApplications: this.customerApplications,
      customerLoans: this.customerLoans,
      customerHistory: this.customerHistory,
      kycRecords: this.kycRecords,
      documents: this.documents,
      checklistRequirements: this.checklistRequirements,
      applications: this.applications,
      applicationHistory: this.applicationHistory,
      loanProductsConfig: this.loanProductsConfig,
      products: this.loanProductsConfig,
      creditAssessments: this.creditAssessments,
      approvals: this.approvals,
      approvalMatrixRules: this.approvalMatrixRules,
      approvalMatrixAudits: this.approvalMatrixAudits,
      sanctions: this.sanctions,
      disbursements: this.disbursements,
      loanAccounts: this.loanAccounts,
      payments: this.payments,
      unallocatedPayments: this.unallocatedPayments,
      recoveryCases: this.recoveryCases,
      legalCases: this.legalCases,
      legalNotices: this.legalNotices,
      restructuringRequests: this.restructuringRequests,
      formResponses: this.formResponses,
    };
  }

  private recountRoleAndBranchUsers() {
    adminSlice.recountRoleAndBranchUsers(this as any);
  }

  public async loadFromDatabase() {
    if (typeof window === 'undefined') return;
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        const saved = localStorage.getItem('lms_auth_user');
        if (saved) {
          const u = JSON.parse(saved);
          if (u?.id) headers['x-user-id'] = u.id;
        }
      } catch {
        // ignore
      }

      const [
        usersRes,
        rolesRes,
        branchesRes,
        customersRes,
        kycRes,
        docsRes,
        productsRes,
        appsRes,
        assessmentsRes,
        approvalsRes,
        matrixRes,
        sanctionsRes,
        disbursementsRes,
        loansRes,
        repaymentsRes,
        recoveryRes,
        legalCasesRes,
        legalNoticesRes,
        restructuringRes,
        auditRes,
      ] = await Promise.all([
        fetch('/api/users', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/roles', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/branches', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/customers', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/kyc', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/documents', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/products', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/applications', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/credit-assessment', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/approvals', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/approvals?type=matrix-rules', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/sanctions', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/disbursements', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/loans', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/repayments', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/recovery', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/legal-cases', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/legal-notices', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/restructuring', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/audit', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);

      if (restructuringRes && restructuringRes.requests && Array.isArray(restructuringRes.requests)) {
        this.restructuringRequests = restructuringRes.requests;
      } else if (Array.isArray(restructuringRes)) {
        this.restructuringRequests = restructuringRes;
      }

      if (usersRes && Array.isArray(usersRes)) this.users = usersRes;
      if (rolesRes && Array.isArray(rolesRes)) this.roles = rolesRes;
      if (branchesRes && Array.isArray(branchesRes)) this.branches = branchesRes;

      if (customersRes && Array.isArray(customersRes)) {
        // Merge DB customers with local customer state, preserving local banking info if DB hasn't populated it
        const localCustMap = new Map<string, any>(this.customers.map((c) => [c.id, c]));
        const mergedDbCustomers = customersRes.map((dbCust: any) => {
          const local = localCustMap.get(dbCust.id);
          if (!local) return dbCust;
          return {
            ...dbCust,
            bankName: dbCust.bankName || local.bankName,
            accountNumber: dbCust.accountNumber || local.accountNumber,
            accountNumberMasked: dbCust.accountNumberMasked || local.accountNumberMasked,
            ifscCode: dbCust.ifscCode || local.ifscCode,
            panMasked: dbCust.panMasked || local.panMasked,
            aadhaarMasked: dbCust.aadhaarMasked || local.aadhaarMasked,
          };
        });

        const dbCustomerIds = new Set(customersRes.map((c: any) => c.id));
        const localOnlyCustomers = this.customers.filter((c) => !dbCustomerIds.has(c.id));
        this.customers = [...mergedDbCustomers, ...localOnlyCustomers];

        // Dynamically compute nextCustomerNumberSeq to prevent duplicate customer numbers
        let maxCustomerSeq = 100;
        for (const c of this.customers) {
          const match = c.customerNumber?.match(/(\d+)(?!.*\d)/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxCustomerSeq) maxCustomerSeq = num;
          }
        }
        this.nextCustomerNumberSeq = Math.max(this.nextCustomerNumberSeq, maxCustomerSeq + 1);
      }

      if (kycRes && Array.isArray(kycRes)) {
        const dbKycMap = new Map<string, any>(kycRes.map((k: any) => [k.customerId, k]));
        this.kycRecords = this.kycRecords.map((localKyc) => {
          const dbKyc = dbKycMap.get(localKyc.customerId) || (localKyc.customerNumber ? kycRes.find((k: any) => k.customerNumber === localKyc.customerNumber) : null);
          if (dbKyc) {
            dbKycMap.delete(localKyc.customerId);
            if (dbKyc.customerNumber) dbKycMap.delete(dbKyc.customerNumber);
            // If local was already marked VERIFIED, preserve it
            if (localKyc.status === 'VERIFIED' && dbKyc.status !== 'VERIFIED') {
              return { ...dbKyc, status: 'VERIFIED' };
            }
            return dbKyc;
          }
          return localKyc;
        });
        for (const rem of dbKycMap.values()) {
          if (!this.kycRecords.some((k) => k.customerId === rem.customerId || k.id === rem.id)) {
            this.kycRecords.push(rem);
          }
        }
      }
      if (docsRes && Array.isArray(docsRes)) this.documents = docsRes;

      const prodsList = productsRes?.products || (Array.isArray(productsRes) ? productsRes : null);
      if (prodsList && Array.isArray(prodsList)) this.loanProductsConfig = prodsList;

      const appsList = appsRes?.applications || (Array.isArray(appsRes) ? appsRes : null);
      if (appsList && Array.isArray(appsList)) {
        const dbAppIds = new Set(appsList.map((a: any) => a.id));
        const localOnlyApps = this.applications.filter((a) => !dbAppIds.has(a.id));
        this.applications = [...appsList, ...localOnlyApps];
        this.applications.forEach((app) => {
          const kyc = this.kycRecords.find((k) => k.customerId === app.customerId);
          if (kyc) {
            app.customerKycStatus = kyc.status;
          }
        });
        for (const a of appsList) {
          if (a.formResponse) {
            this.formResponses[a.id] = {
              applicationId: a.id,
              formVersionId: a.formResponse.formVersionId,
              responses: a.formResponse.responses || {},
              signatures: a.formResponse.signatures || {},
              isSubmitted: a.formResponse.isSubmitted ?? (a.status !== 'DRAFT'),
              submittedAt: a.formResponse.submittedAt,
              updatedAt: a.formResponse.updatedAt || new Date().toISOString(),
            };
          }
        }
        this.customerApplications = this.applications.map((a: any) => ({
          id: a.id,
          applicationNumber: a.applicationNumber,
          customerId: a.customerId,
          customerName: a.customerName,
          productCode: a.productCode,
          productName: a.productName,
          requestedAmount: a.requestedAmount,
          tenureMonths: a.requestedTenureMonths || a.tenureMonths,
          interestRate: a.interestRate,
          applicationDate: a.applicationDate,
          status: a.status,
          branchId: a.branchId,
          branchName: a.branchName,
          assignedOfficer: a.loanOfficer || a.assignedOfficer,
          purpose: a.purpose,
        }));

        let maxAppSeq = 1000;
        for (const a of this.applications) {
          const match = a.applicationNumber?.match(/(\d+)(?!.*\d)/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxAppSeq) maxAppSeq = num;
          }
        }
        this.nextAppNumberSeq = Math.max(this.nextAppNumberSeq, maxAppSeq + 1);
      }

      if (assessmentsRes && Array.isArray(assessmentsRes)) {
        const dbCaIds = new Set(assessmentsRes.map((a: any) => a.id));
        const localOnlyCa = this.creditAssessments.filter((a) => !dbCaIds.has(a.id));
        this.creditAssessments = [...assessmentsRes, ...localOnlyCa];
      }
      if (approvalsRes && Array.isArray(approvalsRes)) {
        const dbApprIds = new Set(approvalsRes.map((a: any) => a.id));
        const localOnlyAppr = this.approvals.filter((a) => !dbApprIds.has(a.id));
        this.approvals = [...approvalsRes, ...localOnlyAppr];
        let maxApprSeq = 100;
        for (const a of this.approvals) {
          const match = (a.approvalNumber || a.id)?.match(/(\d+)(?!.*\d)/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxApprSeq) maxApprSeq = num;
          }
        }
        this.nextApprovalSeq = Math.max(this.nextApprovalSeq, maxApprSeq + 1);
      }
      if (matrixRes && Array.isArray(matrixRes)) this.approvalMatrixRules = matrixRes;
      if (sanctionsRes && Array.isArray(sanctionsRes)) {
        const localMap = new Map(this.sanctions.map((s) => [s.id, s]));
        const mergedSanctions = sanctionsRes.map((dbS: any) => {
          const localS = localMap.get(dbS.id);
          localMap.delete(dbS.id);
          if (localS) {
            if (localS.status === 'SANCTIONED' || localS.confirmedBy) {
              return { ...dbS, ...localS, status: 'SANCTIONED', confirmedBy: localS.confirmedBy || dbS.confirmedBy || 'Regional Credit Manager' };
            }
            return { ...dbS, ...localS };
          }
          return dbS;
        });
        mergedSanctions.push(...Array.from(localMap.values()));
        this.sanctions = mergedSanctions;
        let maxSancSeq = 100;
        for (const s of this.sanctions) {
          const match = (s.sanctionNumber || s.id)?.match(/(\d+)(?!.*\d)/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxSancSeq) maxSancSeq = num;
          }
        }
        this.nextSanctionSeq = Math.max(this.nextSanctionSeq, maxSancSeq + 1);
      }
      if (disbursementsRes && Array.isArray(disbursementsRes)) {
        const dbDisbIds = new Set(disbursementsRes.map((d: any) => d.id));
        const localOnlyDisb = this.disbursements.filter((d) => !dbDisbIds.has(d.id));
        this.disbursements = [...disbursementsRes, ...localOnlyDisb];
        let maxDisbSeq = 100;
        for (const d of this.disbursements) {
          const match = (d.disbursementNumber || d.id)?.match(/(\d+)(?!.*\d)/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxDisbSeq) maxDisbSeq = num;
          }
        }
        this.nextDisbursementSeq = Math.max(this.nextDisbursementSeq, maxDisbSeq + 1);
      }

      const loansList = loansRes?.loans || (Array.isArray(loansRes) ? loansRes : null);
      if (loansList && Array.isArray(loansList)) {
        const dbLoanIds = new Set(loansList.map((l: any) => l.id));
        const localOnlyLoans = this.loanAccounts.filter((l) => !dbLoanIds.has(l.id));
        this.loanAccounts = [...loansList, ...localOnlyLoans];
        this.customerLoans = this.loanAccounts.map((l: any) => ({
          id: l.id,
          accountNumber: l.accountNumber,
          customerId: l.customerId,
          customerName: l.customerName,
          applicationNumber: l.applicationNumber || '',
          productCode: l.productCode,
          productName: l.productName,
          originalPrincipal: l.originalPrincipal,
          outstandingPrincipal: l.principalOutstanding,
          interestRate: l.interestRate,
          emiAmount: l.emiAmount,
          disbursementDate: l.disbursementDate,
          nextDueDate: l.nextDueDate,
          dpd: l.dpd,
          overdueAmount: l.overdueAmount,
          totalTenureMonths: l.tenureMonths,
          remainingTenureMonths: l.remainingInstalments,
          status: l.status,
          branchName: l.branchName,
        }));

        let maxLoanSeq = 1000;
        for (const l of this.loanAccounts) {
          const match = l.accountNumber?.match(/(\d+)(?!.*\d)/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxLoanSeq) maxLoanSeq = num;
          }
        }
        this.nextLoanSeq = Math.max(this.nextLoanSeq, maxLoanSeq + 1);
      }

      if (repaymentsRes && Array.isArray(repaymentsRes)) {
        this.payments = repaymentsRes;
        let maxPaySeq = 100;
        for (const p of repaymentsRes) {
          const match = (p.paymentReference || p.id)?.match(/(\d+)(?!.*\d)/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxPaySeq) maxPaySeq = num;
          }
        }
        this.nextPaymentSeq = Math.max(this.nextPaymentSeq, maxPaySeq + 1);
      }
      if (recoveryRes && Array.isArray(recoveryRes)) {
        this.recoveryCases = recoveryRes;
        let maxRecSeq = 100;
        for (const r of recoveryRes) {
          const match = (r.caseNumber || r.id)?.match(/(\d+)(?!.*\d)/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxRecSeq) maxRecSeq = num;
          }
        }
        this.nextRecoverySeq = Math.max(this.nextRecoverySeq, maxRecSeq + 1);
      }
      if (legalCasesRes && Array.isArray(legalCasesRes)) this.legalCases = legalCasesRes;
      if (legalNoticesRes && Array.isArray(legalNoticesRes)) this.legalNotices = legalNoticesRes;
      if (auditRes && Array.isArray(auditRes)) this.auditLogs = auditRes;

      this.isLoadedFromDb = true;
      this.notify();
    } catch (err) {
      console.warn('Could not sync local state with database APIs:', err);
    }
  }

  private syncApi(url: string, method: string, data?: any) {
    if (typeof window === 'undefined') return;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    try {
      const saved = localStorage.getItem('lms_auth_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u?.id) headers['x-user-id'] = u.id;
      }
    } catch {
      // ignore
    }

    fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    })
      .then(async (res) => {
        if (!res.ok) {
          const errText = await res.text().catch(() => '');
          console.warn(`API sync warning on ${method} ${url} (${res.status}):`, errText);
        }
      })
      .catch((err) => {
        console.warn(`API sync error on ${method} ${url}:`, err);
      });
  }

  // --- ADMIN & USER OPERATIONS (Delegated to adminSlice) ---
  public logAudit(entry: Omit<AdminAuditEntry, 'id' | 'timestamp' | 'actorId' | 'actorName' | 'actorRole' | 'ipAddress'>) {
    return adminSlice.logAudit(this as any, entry);
  }

  public createUser(userData: {
    firstName: string;
    lastName: string;
    employeeId: string;
    mobile: string;
    username: string;
    email: string;
    roleId: string;
    branchId: string;
    department?: string;
    status: UserStatus;
  }): LMSUser {
    return adminSlice.createUser(this as any, userData);
  }

  public updateUser(userId: string, updates: Partial<LMSUser>, reason?: string): LMSUser {
    return adminSlice.updateUser(this as any, userId, updates, reason);
  }

  public deactivateUser(userId: string, reason: string) {
    return adminSlice.deactivateUser(this as any, userId, reason);
  }

  public reactivateUser(userId: string, reason?: string) {
    return adminSlice.reactivateUser(this as any, userId, reason);
  }

  // --- ROLE OPERATIONS (Delegated to adminSlice) ---
  public createRole(roleData: {
    name: string;
    description: string;
    permissionIds: string[];
    status: RoleStatus;
  }): Role {
    return adminSlice.createRole(this as any, roleData);
  }

  public updateRole(roleId: string, updates: Partial<Role>, reason?: string): Role {
    return adminSlice.updateRole(this as any, roleId, updates, reason);
  }

  public deactivateRole(roleId: string, reason: string) {
    return adminSlice.deactivateRole(this as any, roleId, reason);
  }

  public reactivateRole(roleId: string, reason?: string) {
    return adminSlice.reactivateRole(this as any, roleId, reason);
  }

  // --- BRANCH OPERATIONS (Delegated to adminSlice) ---
  public createBranch(branchData: {
    code: string;
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pinCode: string;
    phone: string;
    email: string;
    managerId?: string;
    status: BranchStatus;
  }): Branch {
    return adminSlice.createBranch(this as any, branchData);
  }

  public updateBranch(branchId: string, updates: Partial<Branch>, reason?: string): Branch {
    return adminSlice.updateBranch(this as any, branchId, updates, reason);
  }

  public deactivateBranch(branchId: string, reason: string) {
    return adminSlice.deactivateBranch(this as any, branchId, reason);
  }

  public reactivateBranch(branchId: string, reason?: string) {
    return adminSlice.reactivateBranch(this as any, branchId, reason);
  }

  // --- CUSTOMER OPERATIONS (Delegated to customerKycSlice) ---

  public findPossibleDuplicates(query: {
    mobile?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    excludeId?: string;
  }): CustomerRecord[] {
    return customerKycSlice.findPossibleDuplicates(this as any, query);
  }

  public createCustomer(data: CreateCustomerInput): CustomerRecord {
    return customerKycSlice.createCustomer(this as any, data);
  }

  public updateCustomer(
    customerId: string,
    data: Partial<CustomerRecord>
  ): CustomerRecord {
    return customerKycSlice.updateCustomer(this as any, customerId, data);
  }

  public archiveCustomer(customerId: string, reason: string): CustomerRecord {
    return customerKycSlice.archiveCustomer(this as any, customerId, reason);
  }

  public restoreCustomer(customerId: string, reason?: string): CustomerRecord {
    return customerKycSlice.restoreCustomer(this as any, customerId, reason);
  }

  public getCustomerById(customerId: string): CustomerRecord | undefined {
    return customerKycSlice.getCustomerById(this as any, customerId);
  }

  public getCustomerApplications(customerId: string): CustomerApplicationItem[] {
    return customerKycSlice.getCustomerApplications(this as any, customerId);
  }

  public getCustomerLoans(customerId: string): CustomerLoanItem[] {
    return customerKycSlice.getCustomerLoans(this as any, customerId);
  }

  public getCustomerHistory(customerId: string): CustomerHistoryItem[] {
    return customerKycSlice.getCustomerHistory(this as any, customerId);
  }


  // --- KYC OPERATIONS (Delegated to customerKycSlice) ---

  public getCustomerKyc(customerId: string): KycRecord | undefined {
    return customerKycSlice.getCustomerKyc(this as any, customerId);
  }

  public verifyKyc(
    customerId: string,
    payload: {
      verifiedBy: string;
      kycLevel?: 'TIER_1_BASIC' | 'TIER_2_STANDARD' | 'TIER_3_FULL_CKYC';
      riskCategory?: KycRiskCategory;
      complianceNotes?: string;
    }
  ): KycRecord {
    return customerKycSlice.verifyKyc(this as any, customerId, payload);
  }

  public rejectKyc(
    customerId: string,
    payload: {
      rejectedBy: string;
      reason: string;
      remarks: string;
    }
  ): KycRecord {
    return customerKycSlice.rejectKyc(this as any, customerId, payload);
  }

  public requestKycAction(
    customerId: string,
    payload: {
      officerName: string;
      actionNotes: string;
    }
  ): KycRecord {
    return customerKycSlice.requestKycAction(this as any, customerId, payload);
  }

  public updateKycRisk(
    customerId: string,
    riskCategory: KycRiskCategory,
    reason?: string
  ): KycRecord {
    return customerKycSlice.updateKycRisk(this as any, customerId, riskCategory, reason);
  }

  public triggerGovernmentApiVerification(
    customerId: string,
    idType: 'PAN' | 'AADHAAR'
  ): KycRecord {
    return customerKycSlice.triggerGovernmentApiVerification(this as any, customerId, idType);
  }

  // --- DOCUMENT OPERATIONS (Delegated to customerKycSlice) ---

  public getCustomerDocuments(customerId: string): DocumentItem[] {
    return customerKycSlice.getCustomerDocuments(this as any, customerId);
  }

  public uploadDocument(
    customerId: string,
    docData: {
      category: any;
      documentType: string;
      documentTitle: string;
      documentNumberMasked?: string;
      fileName: string;
      fileFormat: 'PDF' | 'JPG' | 'PNG' | 'TIFF';
      fileSizeKb: number;
      uploadedBy: string;
      uploadedByRole: string;
      issuedDate?: string;
      expiryDate?: string;
      isLifetimeValid: boolean;
      loanApplicationId?: string;
    }
  ): DocumentItem {
    return customerKycSlice.uploadDocument(this as any, customerId, docData);
  }

  public verifyDocument(
    documentId: string,
    payload: {
      verifiedBy: string;
      notes?: string;
    }
  ): DocumentItem {
    return customerKycSlice.verifyDocument(this as any, documentId, payload);
  }

  public rejectDocument(
    documentId: string,
    payload: {
      rejectedBy: string;
      reason: string;
      notes: string;
    }
  ): DocumentItem {
    return customerKycSlice.rejectDocument(this as any, documentId, payload);
  }

  public waiveDocument(documentId: string, reason: string, waivedBy: string): DocumentItem {
    return customerKycSlice.waiveDocument(this as any, documentId, reason, waivedBy);
  }

  public deleteDocument(documentId: string, reason: string, deletedBy: string) {
    return customerKycSlice.deleteDocument(this as any, documentId, reason, deletedBy);
  }

  public renewDocument(
    documentId: string,
    newExpiryDate: string,
    renewedBy: string
  ): DocumentItem {
    return customerKycSlice.renewDocument(this as any, documentId, newExpiryDate, renewedBy);
  }

  public sendDocumentExpiryReminder(documentId: string): boolean {
    return customerKycSlice.sendDocumentExpiryReminder(this as any, documentId);
  }


  // --- APPLICATION OPERATIONS (Delegated to applicationSlice) ---
  public logApplicationHistory(
    applicationId: string,
    entry: Omit<ApplicationHistoryItem, 'id' | 'applicationId' | 'timestamp'>
  ) {
    return applicationSlice.logApplicationHistory(this as any, applicationId, entry);
  }

  public getApplicationById(id: string): LoanApplicationRecord | undefined {
    return applicationSlice.getApplicationById(this as any, id);
  }

  public createApplication(payload: {
    customerId: string;
    productCode: string;
    requestedAmount: number;
    requestedTenureMonths: number;
    repaymentFrequency: string;
    preferredRepaymentDate?: number;
    purpose: string;
    purposeCategory: any;
    branchId: string;
    loanOfficer: string;
    notes?: string;
    createdBy?: string;
  }): LoanApplicationRecord {
    return applicationSlice.createApplication(this as any, payload);
  }

  public updateApplication(
    appId: string,
    updates: Partial<Omit<LoanApplicationRecord, 'id' | 'applicationNumber' | 'customerId' | 'customerNumber' | 'customerName'>>
  ): LoanApplicationRecord {
    return applicationSlice.updateApplication(this as any, appId, updates);
  }

  public addCoApplicant(
    appId: string,
    payload: {
      customerId: string;
      relationship: any;
      notes?: string;
      addedBy?: string;
    }
  ): CoApplicantRecord {
    return applicationSlice.addCoApplicant(this as any, appId, payload);
  }

  public removeCoApplicant(appId: string, coAppId: string, actor: string = 'Anita Deshmukh') {
    return applicationSlice.removeCoApplicant(this as any, appId, coAppId, actor);
  }

  public addGuarantor(
    appId: string,
    payload: {
      customerId: string;
      relationship: any;
      guaranteeType: 'INDIVIDUAL' | 'BUSINESS';
      netWorthEstimated?: number;
      notes?: string;
      addedBy?: string;
    }
  ): GuarantorRecord {
    return applicationSlice.addGuarantor(this as any, appId, payload);
  }

  public removeGuarantor(appId: string, guarantorId: string, actor: string = 'Anita Deshmukh') {
    return applicationSlice.removeGuarantor(this as any, appId, guarantorId, actor);
  }

  public linkCustomerKycDocument(
    appId: string,
    documentType: string,
    vaultDocId: string,
    actor: string = 'Anita Deshmukh'
  ) {
    return applicationSlice.linkCustomerKycDocument(this as any, appId, documentType, vaultDocId, actor);
  }

  public uploadApplicationDocument(
    appId: string,
    payload: {
      documentType: string;
      documentTitle: string;
      fileName: string;
      fileFormat: 'PDF' | 'JPG' | 'PNG' | 'DOCX';
      fileSizeKb: number;
      isMandatory?: boolean;
      notes?: string;
      uploadedBy?: string;
    }
  ): ApplicationDocumentRecord {
    return applicationSlice.uploadApplicationDocument(this as any, appId, payload);
  }

  public verifyApplicationDocument(
    appId: string,
    docId: string,
    verifiedBy: string,
    notes?: string
  ) {
    return applicationSlice.verifyApplicationDocument(this as any, appId, docId, verifiedBy, notes);
  }

  public rejectApplicationDocument(
    appId: string,
    docId: string,
    rejectedBy: string,
    reason: string,
    notes?: string
  ) {
    return applicationSlice.rejectApplicationDocument(this as any, appId, docId, rejectedBy, reason, notes);
  }

  public removeApplicationDocument(appId: string, docId: string, actor: string = 'Anita Deshmukh') {
    return applicationSlice.removeApplicationDocument(this as any, appId, docId, actor);
  }

  public validateApplicationForSubmission(appId: string): ApplicationValidationResult {
    return applicationSlice.validateApplicationForSubmission(this as any, appId);
  }

  public submitApplication(
    appId: string,
    declarations: SubmissionDeclarationState,
    submittedBy: string = 'Anita Deshmukh'
  ): LoanApplicationRecord {
    return applicationSlice.submitApplication(this as any, appId, declarations, submittedBy);
  }

  public cancelApplication(
    appId: string,
    reason: string,
    cancelledBy: string = 'Anita Deshmukh'
  ): LoanApplicationRecord {
    return applicationSlice.cancelApplication(this as any, appId, reason, cancelledBy);
  }

  public getApplicationFormResponse(applicationId: string) {
    return applicationSlice.getApplicationFormResponse(this as any, applicationId);
  }

  public saveDraftFormResponse(
    applicationId: string,
    responses: Record<string, any>,
    signatures: Record<string, any> = {},
    pageIndex: number = 0
  ) {
    return applicationSlice.saveDraftFormResponse(this as any, applicationId, responses, signatures, pageIndex);
  }

  public submitApplicationFormResponse(
    applicationId: string,
    responses: Record<string, any>,
    signatures: Record<string, any> = {},
    submittedBy: string = 'Anita Deshmukh'
  ) {
    return applicationSlice.submitApplicationFormResponse(this as any, applicationId, responses, signatures, submittedBy);
  }

  public updateApplicationStatus(
    appId: string,
    newStatus: ApplicationWorkflowStatus,
    reason?: string,
    actor: string = 'Alex Morgan'
  ): LoanApplicationRecord {
    return applicationSlice.updateApplicationStatus(this as any, appId, newStatus, reason, actor);
  }


  // ==========================================
  // BATCH 6: CREDIT ASSESSMENT & DECISION
  // ==========================================

  public calculateEMI(principal: number, annualRatePct: number, tenureMonths: number): number {
    return creditApprovalSlice.calculateEMI(principal, annualRatePct, tenureMonths);
  }

  public recalculateCreditAssessment(assessment: CreditAssessmentRecord): CreditAssessmentRecord {
    return creditApprovalSlice.recalculateCreditAssessment(assessment);
  }

  public getCreditAssessmentById(id: string): CreditAssessmentRecord | undefined {
    return creditApprovalSlice.getCreditAssessmentById(this as any, id);
  }

  public getCreditAssessmentByAppId(applicationId: string): CreditAssessmentRecord | undefined {
    return creditApprovalSlice.getCreditAssessmentByAppId(this as any, applicationId);
  }

  public logCreditTimeline(
    assessmentId: string,
    event: Omit<AssessmentTimelineEvent, 'id' | 'assessmentId' | 'timestamp'>
  ) {
    creditApprovalSlice.logCreditTimeline(this as any, assessmentId, event);
  }

  public assignCreditAssessment(
    assessmentId: string,
    officerId: string,
    officerName: string,
    notes: string = '',
    actor: string = 'Alex Morgan'
  ): CreditAssessmentRecord {
    return creditApprovalSlice.assignCreditAssessment(this as any, assessmentId, officerId, officerName, notes, actor);
  }

  public startCreditAssessment(
    assessmentId: string,
    actor: string = 'Sunita Patel'
  ): CreditAssessmentRecord {
    return creditApprovalSlice.startCreditAssessment(this as any, assessmentId, actor);
  }

  public updateCreditAssessment(
    assessmentId: string,
    updates: Partial<CreditAssessmentRecord>,
    actor: string = 'Sunita Patel'
  ): CreditAssessmentRecord {
    return creditApprovalSlice.updateCreditAssessment(this as any, assessmentId, updates, actor);
  }

  public addCreditObligation(
    assessmentId: string,
    obligationData: Omit<ObligationItem, 'id' | 'assessmentId'>,
    actor: string = 'Sunita Patel'
  ): ObligationItem {
    return creditApprovalSlice.addCreditObligation(this as any, assessmentId, obligationData, actor);
  }

  public deleteCreditObligation(
    assessmentId: string,
    obligationId: string,
    actor: string = 'Sunita Patel'
  ): boolean {
    return creditApprovalSlice.deleteCreditObligation(this as any, assessmentId, obligationId, actor);
  }

  public evaluateCreditRules(
    assessmentId: string,
    actor: string = 'Sunita Patel'
  ): AssessmentRuleItem[] {
    return creditApprovalSlice.evaluateCreditRules(this as any, assessmentId, actor);
  }

  public addCreditCondition(
    assessmentId: string,
    conditionData: Omit<AssessmentConditionItem, 'id' | 'assessmentId' | 'addedBy' | 'addedAt' | 'status'>,
    actor: string = 'Sunita Patel'
  ): AssessmentConditionItem {
    return creditApprovalSlice.addCreditCondition(this as any, assessmentId, conditionData, actor);
  }

  public updateCreditConditionStatus(
    assessmentId: string,
    conditionId: string,
    status: ConditionStatus,
    resolutionNotes: string = '',
    actor: string = 'Sunita Patel'
  ): boolean {
    return creditApprovalSlice.updateCreditConditionStatus(this as any, assessmentId, conditionId, status, resolutionNotes, actor);
  }

  public deleteCreditCondition(
    assessmentId: string,
    conditionId: string,
    actor: string = 'Sunita Patel'
  ): boolean {
    return creditApprovalSlice.deleteCreditCondition(this as any, assessmentId, conditionId, actor);
  }

  public returnCreditAssessment(
    assessmentId: string,
    returnReason: string,
    returnRequiredAction: string,
    actor: string = 'Sunita Patel'
  ): CreditAssessmentRecord {
    return creditApprovalSlice.returnCreditAssessment(this as any, assessmentId, returnReason, returnRequiredAction, actor);
  }

  public submitCreditAssessmentRecommendation(
    assessmentId: string,
    data: {
      recommendation: CreditRecommendation;
      recommendedAmount: number;
      recommendedTenureMonths: number;
      recommendedInterestRate: number;
      recommendationNotes: string;
      underwriterNotes: string;
      changeReason?: string;
    },
    actor: string = 'Sunita Patel'
  ): CreditAssessmentRecord {
    return creditApprovalSlice.submitCreditAssessmentRecommendation(this as any, assessmentId, data, actor);
  }

  // ==========================================
  // BATCH 7: APPROVAL WORKFLOW & MATRIX METHODS
  // ==========================================

  public evaluateApprovalMatrix(productCode: string, amount: number, branchId?: string): ApprovalMatrixRule[] {
    return creditApprovalSlice.evaluateApprovalMatrix(this as any, productCode, amount, branchId);
  }

  public getApprovals(): ApprovalRecord[] {
    return creditApprovalSlice.getApprovals(this as any);
  }

  public getApprovalById(id: string): ApprovalRecord | undefined {
    return creditApprovalSlice.getApprovalById(this as any, id);
  }

  public getApprovalByAppId(applicationId: string): ApprovalRecord | undefined {
    return creditApprovalSlice.getApprovalByAppId(this as any, applicationId);
  }

  public getApprovalByCreditAssessmentId(caId: string): ApprovalRecord | undefined {
    return creditApprovalSlice.getApprovalByCreditAssessmentId(this as any, caId);
  }

  public createApprovalFromCreditAssessment(caId: string, actorName: string = 'System Engine'): ApprovalRecord {
    return creditApprovalSlice.createApprovalFromCreditAssessment(this as any, caId, actorName);
  }

  public assignApproval(
    approvalId: string,
    approverId: string,
    approverName: string,
    notes?: string,
    actorName: string = 'Operations Head'
  ): ApprovalRecord {
    return creditApprovalSlice.assignApproval(this as any, approvalId, approverId, approverName, notes, actorName);
  }

  public startApprovalReview(approvalId: string, actorName: string = 'Approver'): ApprovalRecord {
    return creditApprovalSlice.startApprovalReview(this as any, approvalId, actorName);
  }

  public makeApprovalDecision(
    approvalId: string,
    decisionData: {
      decision: ApprovalDecisionType;
      approvedAmount?: number;
      approvedTenureMonths?: number;
      approvedInterestRate?: number;
      deviationReason?: string;
      decisionNotes: string;
      returnReason?: string;
      requiredAction?: string;
      dueDate?: string;
    },
    actorName: string,
    actorRole: string
  ): { success: boolean; message?: string; approval?: ApprovalRecord } {
    return creditApprovalSlice.makeApprovalDecision(this as any, approvalId, decisionData, actorName, actorRole);
  }

  public addApprovalCondition(
    approvalId: string,
    condition: Omit<ApprovalCondition, 'id' | 'approvalId' | 'addedAt'>,
    actorName: string = 'Approver'
  ): ApprovalCondition {
    return creditApprovalSlice.addApprovalCondition(this as any, approvalId, condition, actorName);
  }

  public updateApprovalConditionStatus(
    approvalId: string,
    conditionId: string,
    status: ConditionStatus,
    resolutionNotes?: string,
    waiverReason?: string,
    actorName: string = 'Approver'
  ): ApprovalRecord {
    return creditApprovalSlice.updateApprovalConditionStatus(this as any, approvalId, conditionId, status, resolutionNotes, waiverReason, actorName);
  }

  public deleteApprovalCondition(approvalId: string, conditionId: string, actorName: string = 'Approver'): ApprovalRecord {
    return creditApprovalSlice.deleteApprovalCondition(this as any, approvalId, conditionId, actorName);
  }

  public addApprovalException(
    approvalId: string,
    exception: Omit<ApprovalException, 'id' | 'approvalId' | 'createdAt' | 'status'>,
    actorName: string = 'Approver'
  ): ApprovalException {
    return creditApprovalSlice.addApprovalException(this as any, approvalId, exception, actorName);
  }

  public routeApprovalException(
    approvalId: string,
    exceptionId: string,
    routedToRole: string,
    actorName: string = 'Approver'
  ): ApprovalRecord {
    return creditApprovalSlice.routeApprovalException(this as any, approvalId, exceptionId, routedToRole, actorName);
  }

  public resolveApprovalException(
    approvalId: string,
    exceptionId: string,
    status: 'APPROVED' | 'REJECTED',
    decisionNotes: string,
    actorName: string = 'Regional Credit Manager'
  ): ApprovalRecord {
    return creditApprovalSlice.resolveApprovalException(this as any, approvalId, exceptionId, status, decisionNotes, actorName);
  }

  public addApprovalMatrixRule(
    rule: Omit<ApprovalMatrixRule, 'id' | 'createdDate' | 'updatedDate'>,
    actorName: string = 'Siddharth Rao (EMP-001001)'
  ): { success: boolean; message?: string; rule?: ApprovalMatrixRule } {
    return creditApprovalSlice.addApprovalMatrixRule(this as any, rule, actorName);
  }

  public updateApprovalMatrixRule(
    ruleId: string,
    updates: Partial<ApprovalMatrixRule>,
    actorName: string = 'Siddharth Rao (EMP-001001)'
  ): { success: boolean; message?: string; rule?: ApprovalMatrixRule } {
    return creditApprovalSlice.updateApprovalMatrixRule(this as any, ruleId, updates, actorName);
  }

  public toggleApprovalMatrixRuleActive(
    ruleId: string,
    isActive: boolean,
    actorName: string = 'Siddharth Rao (EMP-001001)'
  ): ApprovalMatrixRule {
    return creditApprovalSlice.toggleApprovalMatrixRuleActive(this as any, ruleId, isActive, actorName);
  }

  public deleteApprovalMatrixRule(ruleId: string, actorName: string = 'Siddharth Rao (EMP-001001)'): { success: boolean; message?: string } {
    return creditApprovalSlice.deleteApprovalMatrixRule(this as any, ruleId, actorName);
  }

  // ==========================================
  // BATCH 8: SANCTION MANAGEMENT & PRE-DISBURSEMENT READINESS
  // ==========================================

  public getSanctions(): SanctionRecord[] {
    return sanctionSlice.getSanctions(this as any);
  }

  public getSanctionById(id: string): SanctionRecord | undefined {
    return sanctionSlice.getSanctionById(this as any, id);
  }

  public getSanctionByApplicationId(applicationId: string): SanctionRecord | undefined {
    return sanctionSlice.getSanctionByApplicationId(this as any, applicationId);
  }

  public getSanctionByApprovalId(approvalId: string): SanctionRecord | undefined {
    return sanctionSlice.getSanctionByApprovalId(this as any, approvalId);
  }

  public createSanction(params: {
    applicationId: string;
    approvalId?: string;
    terms?: Partial<SanctionTerms>;
    deviationReason?: string;
    actorName?: string;
    actorRole?: string;
  }): SanctionRecord {
    return sanctionSlice.createSanction(this as any, params);
  }

  public updateSanctionTerms(
    sanctionId: string,
    terms: Partial<SanctionTerms>,
    deviationReason: string = '',
    actorName: string = 'Loan Officer',
    actorRole: string = 'Loan Officer'
  ): SanctionRecord {
    return sanctionSlice.updateSanctionTerms(this as any, sanctionId, terms, deviationReason, actorName, actorRole);
  }

  public submitSanctionForReview(
    sanctionId: string,
    actorName: string = 'Loan Officer',
    actorRole: string = 'Loan Officer'
  ): SanctionRecord {
    return sanctionSlice.submitSanctionForReview(this as any, sanctionId, actorName, actorRole);
  }

  public submitSanctionForConfirmation(
    sanctionId: string,
    actorName: string = 'Loan Officer',
    actorRole: string = 'Loan Officer'
  ): SanctionRecord {
    return sanctionSlice.submitSanctionForConfirmation(this as any, sanctionId, actorName, actorRole);
  }

  public addSanctionCondition(
    sanctionId: string,
    condition: Omit<SanctionCondition, 'id' | 'sanctionId' | 'addedAt' | 'status'>,
    actorName: string = 'Loan Officer',
    actorRole: string = 'Loan Officer'
  ): SanctionCondition {
    return sanctionSlice.addSanctionCondition(this as any, sanctionId, condition, actorName, actorRole);
  }

  public updateSanctionConditionStatus(
    sanctionId: string,
    conditionId: string,
    status: ConditionStatus,
    resolutionNotes?: string,
    waiverReason?: string,
    actorName: string = 'Sanction Officer',
    actorRole: string = 'Sanction Officer'
  ): SanctionRecord {
    return sanctionSlice.updateSanctionConditionStatus(this as any, sanctionId, conditionId, status, resolutionNotes, waiverReason, actorName, actorRole);
  }

  public waiveSanctionCondition(
    sanctionId: string,
    conditionId: string,
    waiverReason: string,
    actorName: string = 'Sanction Officer',
    actorRole: string = 'Sanction Officer'
  ): SanctionRecord {
    return sanctionSlice.waiveSanctionCondition(this as any, sanctionId, conditionId, waiverReason, actorName, actorRole);
  }

  public deleteSanctionCondition(
    sanctionId: string,
    conditionId: string,
    actorName: string = 'Sanction Officer',
    actorRole: string = 'Sanction Officer'
  ): SanctionRecord {
    return sanctionSlice.deleteSanctionCondition(this as any, sanctionId, conditionId, actorName, actorRole);
  }

  public generateSanctionLetter(
    sanctionId: string,
    optionsOrNotes?: string | { templateId?: string; customNotes?: string; reasonForRegeneration?: string },
    reasonForRegenerationOrActor?: string,
    actorName?: string,
    actorRole: string = 'Loan Officer'
  ): SanctionLetterVersion {
    return sanctionSlice.generateSanctionLetter(this as any, sanctionId, optionsOrNotes, reasonForRegenerationOrActor, actorName, actorRole);
  }

  public issueSanctionLetter(
    sanctionId: string,
    letterId: string,
    actorName: string = 'Loan Officer',
    actorRole: string = 'Loan Officer'
  ): SanctionRecord {
    return sanctionSlice.issueSanctionLetter(this as any, sanctionId, letterId, actorName, actorRole);
  }

  public validateSanctionPrerequisites(
    sanctionId: string,
    currentUserName?: string
  ): {
    valid: boolean;
    errors: string[];
    warnings: string[];
    isSodRestricted: boolean;
    blockers: string[];
  } {
    return sanctionSlice.validateSanctionPrerequisites(this as any, sanctionId, currentUserName);
  }

  public checkSanctionSegregationOfDuties(
    sanctionId: string,
    currentUserId?: string,
    currentUserName?: string
  ): { allowed: boolean; reason?: string } {
    return sanctionSlice.checkSanctionSegregationOfDuties(this as any, sanctionId, currentUserId, currentUserName);
  }

  public confirmSanction(
    sanctionId: string,
    actorName: string = 'Regional Credit Manager',
    actorRole: string = 'Regional Credit Manager',
    actorId?: string
  ): { success: boolean; message?: string; error?: string; sanction?: SanctionRecord } {
    return sanctionSlice.confirmSanction(this as any, sanctionId, actorName, actorRole, actorId);
  }

  public returnSanction(
    sanctionId: string,
    reason: string,
    corrections: string,
    actorName: string = 'Branch Credit Manager',
    actorRole: string = 'Branch Credit Manager'
  ): SanctionRecord {
    return sanctionSlice.returnSanction(this as any, sanctionId, reason, corrections, actorName, actorRole);
  }

  public cancelSanction(
    sanctionId: string,
    reason: string,
    actorName: string = 'Senior Credit Authority',
    actorRole: string = 'Senior Credit Authority'
  ): SanctionRecord {
    return sanctionSlice.cancelSanction(this as any, sanctionId, reason, actorName, actorRole);
  }

  public getPreDisbursementReadiness(sanctionId: string): PreDisbursementReadinessSummary {
    return sanctionSlice.getPreDisbursementReadiness(this as any, sanctionId);
  }


  // ----------------------------------------------------
  // Batch 9 - Disbursement Management, Maker-Checker & Transactions
  // ----------------------------------------------------

  public getDisbursements(): DisbursementRecord[] {
    return disbursementSlice.getDisbursements(this as any);
  }

  public getDisbursementById(id: string): DisbursementRecord | undefined {
    return disbursementSlice.getDisbursementById(this as any, id);
  }

  public getDisbursementBySanctionId(sanctionId: string): DisbursementRecord | undefined {
    return disbursementSlice.getDisbursementBySanctionId(this as any, sanctionId);
  }

  public getDisbursementByApplicationId(applicationId: string): DisbursementRecord | undefined {
    return disbursementSlice.getDisbursementByApplicationId(this as any, applicationId);
  }

  public evaluateDisbursementReadiness(sanctionId: string): DisbursementReadinessResult {
    return disbursementSlice.evaluateDisbursementReadiness(this as any, sanctionId);
  }

  public createDisbursementRequest(params: {
    sanctionId: string;
    requestedAmount: number;
    disbursementType: 'FULL' | 'PARTIAL';
    beneficiaryId?: string;
    newBeneficiary?: {
      beneficiaryType: 'PRIMARY_BORROWER' | 'CO_APPLICANT' | 'SELLER_BUILDER' | 'VENDOR' | 'INSTITUTION';
      beneficiaryName: string;
      bankName: string;
      accountNumber: string;
      ifscCode: string;
      accountType: 'SAVINGS' | 'CURRENT';
    };
    paymentMethod: PaymentMethod;
    purpose?: string;
    notes?: string;
    actorName: string;
    actorRole: string;
    actorId: string;
  }): DisbursementRecord {
    return disbursementSlice.createDisbursementRequest(this as any, params);
  }

  public assignDisbursement(disbursementId: string, requestId: string, assignedToId: string, assignedToName: string, actor: string) {
    return disbursementSlice.assignDisbursement(this as any, disbursementId, requestId, assignedToId, assignedToName, actor);
  }

  public approveDisbursement(
    disbursementId: string,
    requestId: string,
    approverName: string,
    approverRole: string,
    notes?: string
  ): DisbursementRecord {
    return disbursementSlice.approveDisbursement(this as any, disbursementId, requestId, approverName, approverRole, notes);
  }

  public rejectDisbursement(
    disbursementId: string,
    requestId: string,
    rejectorName: string,
    rejectorRole: string,
    reason: string
  ): DisbursementRecord {
    return disbursementSlice.rejectDisbursement(this as any, disbursementId, requestId, rejectorName, rejectorRole, reason);
  }

  public returnDisbursement(
    disbursementId: string,
    requestId: string,
    actorName: string,
    actorRole: string,
    reason: string
  ): DisbursementRecord {
    return disbursementSlice.returnDisbursement(this as any, disbursementId, requestId, actorName, actorRole, reason);
  }

  public executeDisbursementTransaction(
    disbursementId: string,
    requestId: string,
    params: {
      paymentMethod: PaymentMethod;
      utrNumber?: string;
      externalReference?: string;
      simulateFailure?: boolean;
      failureReason?: string;
    },
    actorName: string,
    actorRole: string
  ): DisbursementRecord {
    return disbursementSlice.executeDisbursementTransaction(this as any, disbursementId, requestId, params, actorName, actorRole);
  }

  public reverseDisbursementTransaction(
    disbursementId: string,
    transactionId: string,
    reason: string,
    actorName: string,
    actorRole: string
  ): DisbursementRecord {
    return disbursementSlice.reverseDisbursementTransaction(this as any, disbursementId, transactionId, reason, actorName, actorRole);
  }

  public addDisbursementBeneficiary(
    disbursementId: string,
    beneficiary: {
      beneficiaryType: 'PRIMARY_BORROWER' | 'CO_APPLICANT' | 'SELLER_BUILDER' | 'VENDOR' | 'INSTITUTION';
      beneficiaryName: string;
      bankName: string;
      accountNumber: string;
      ifscCode: string;
      accountType: 'SAVINGS' | 'CURRENT';
      verificationSource?: string;
    }
  ): DisbursementBeneficiaryRecord {
    return disbursementSlice.addDisbursementBeneficiary(this as any, disbursementId, beneficiary);
  }

  public getDisbursementKPIs(): DisbursementKPIsData {
    return disbursementSlice.getDisbursementKPIs(this as any);
  }

  // --- BATCH 10: LOAN ACCOUNT & REPAYMENT SETUP ACTIONS ---

  public processLoanAccountOnDisbursement(
    dsb: DisbursementRecord,
    req: DisbursementRequestRecord,
    txn: DisbursementTransactionRecord,
    actorName: string,
    actorRole: string
  ): LoanAccountRecord {
    return loanServicingSlice.processLoanAccountOnDisbursement(this as any, dsb, req, txn, actorName, actorRole);
  }

  public createLoanAccount(payload: {
    customerId: string;
    productCode: string;
    amount: number;
    tenureMonths: number;
    interestRate?: number;
    repaymentFrequency?: LoanRepaymentFrequency;
    interestMethod?: InterestMethod;
    branchId?: string;
    startDate?: string;
    firstDueDate?: string;
    assignedOfficer?: string;
    notes?: string;
  }): LoanAccountRecord {
    return loanServicingSlice.createLoanAccount(this as any, payload);
  }

  public getLoanAccounts(): LoanAccountRecord[] {
    return loanServicingSlice.getLoanAccounts(this as any);
  }

  public getLoanAccountById(id: string): LoanAccountRecord | undefined {
    return loanServicingSlice.getLoanAccountById(this as any, id);
  }

  public getLoanAccountByApplicationId(appId: string): LoanAccountRecord | undefined {
    return loanServicingSlice.getLoanAccountByApplicationId(this as any, appId);
  }

  public getLoanAccountBySanctionId(sanctionId: string): LoanAccountRecord | undefined {
    return loanServicingSlice.getLoanAccountBySanctionId(this as any, sanctionId);
  }

  public getLoanAccountByDisbursementId(disbId: string): LoanAccountRecord | undefined {
    return loanServicingSlice.getLoanAccountByDisbursementId(this as any, disbId);
  }

  public getLoanAccountsByCustomerId(customerId: string): LoanAccountRecord[] {
    return loanServicingSlice.getLoanAccountsByCustomerId(this as any, customerId);
  }

  public generateScheduleVersion(
    loanId: string,
    reason: string,
    customTerms?: { annualRate?: number; tenureMonths?: number; frequency?: LoanRepaymentFrequency },
    actorName: string = 'Operations Officer',
    actorRole: string = 'Operations Manager'
  ): RepaymentScheduleVersion {
    return loanServicingSlice.generateScheduleVersion(this as any, loanId, reason, customTerms, actorName, actorRole);
  }

  public updateRepaymentSettings(
    loanId: string,
    updates: Partial<LoanRepaymentSettings>,
    actorName: string = 'Operations Officer',
    actorRole: string = 'Operations Officer'
  ): LoanRepaymentSettings {
    return loanServicingSlice.updateRepaymentSettings(this as any, loanId, updates, actorName, actorRole);
  }

  public addLoanCharge(
    loanId: string,
    charge: Omit<LoanChargeItem, 'id' | 'loanId' | 'createdAt' | 'createdBy'>,
    actorName: string = 'Operations Officer',
    actorRole: string = 'Operations Officer'
  ): LoanChargeItem {
    return loanServicingSlice.addLoanCharge(this as any, loanId, charge, actorName, actorRole);
  }

  // --- BATCH 11: REPAYMENT & PAYMENT POSTING ACTIONS ---

  public getPayments(filters?: PaymentFilterState): PaymentRecord[] {
    return loanServicingSlice.getPayments(this as any, filters);
  }

  public getPaymentById(id: string): PaymentRecord | undefined {
    return loanServicingSlice.getPaymentById(this as any, id);
  }

  public getPaymentsByLoanId(loanId: string): PaymentRecord[] {
    return loanServicingSlice.getPaymentsByLoanId(this as any, loanId);
  }

  public getUnallocatedPayments(): UnallocatedPaymentRecord[] {
    return loanServicingSlice.getUnallocatedPayments(this as any);
  }

  public recordPayment(
    payload: RecordPaymentPayload,
    actorName: string = 'Operations Officer',
    actorRole: string = 'Operations Officer'
  ): PaymentRecord {
    return loanServicingSlice.recordPayment(this as any, payload, actorName, actorRole);
  }

  public verifyPayment(
    paymentId: string,
    actorName: string = 'Branch Manager',
    actorRole: string = 'Branch Manager'
  ): PaymentRecord {
    return loanServicingSlice.verifyPayment(this as any, paymentId, actorName, actorRole);
  }

  public postPayment(
    paymentId: string,
    actorName: string = 'Operations Officer',
    actorRole: string = 'Operations Officer'
  ): PaymentRecord {
    return loanServicingSlice.postPayment(this as any, paymentId, actorName, actorRole);
  }

  public reversePayment(
    paymentId: string,
    reason: string,
    notes?: string,
    actorName: string = 'Branch Manager',
    actorRole: string = 'Branch Manager'
  ): PaymentRecord {
    return loanServicingSlice.reversePayment(this as any, paymentId, reason, notes, actorName, actorRole);
  }

  public getReceiptByPaymentId(paymentId: string): PaymentReceiptRecord | undefined {
    return loanServicingSlice.getReceiptByPaymentId(this as any, paymentId);
  }

  public resolveUnallocatedPayment(
    unallocId: string,
    action: 'REFUND' | 'ALLOCATE_ADVANCE',
    actorName: string = 'Operations Officer',
    actorRole: string = 'Operations Officer'
  ): UnallocatedPaymentRecord {
    return loanServicingSlice.resolveUnallocatedPayment(this as any, unallocId, action, actorName, actorRole);
  }

  public getRepaymentKPIs() {
    return loanServicingSlice.getRepaymentKPIs(this as any);
  }

  // =========================================================================
  // Recovery, Escalations & Legal Collections (Batch 13)
  // =========================================================================

  public getRecoveryCases(filter?: RecoveryFilterState): RecoveryCaseRecord[] {
    return recoveryRestructuringSlice.getRecoveryCases(this as any, filter);
  }

  public getRecoveryCaseById(id: string): RecoveryCaseRecord | undefined {
    return recoveryRestructuringSlice.getRecoveryCaseById(this as any, id);
  }

  public getRecoveryByLoanId(loanId: string): RecoveryCaseRecord | undefined {
    return recoveryRestructuringSlice.getRecoveryByLoanId(this as any, loanId);
  }

  public getLegalCases(): LegalCaseRecord[] {
    return recoveryRestructuringSlice.getLegalCases(this as any);
  }

  public getLegalCaseById(id: string): LegalCaseRecord | undefined {
    return recoveryRestructuringSlice.getLegalCaseById(this as any, id);
  }

  public getLegalNotices(): LegalNoticeRecord[] {
    return recoveryRestructuringSlice.getLegalNotices(this as any);
  }

  public getLegalNoticeById(id: string): LegalNoticeRecord | undefined {
    return recoveryRestructuringSlice.getLegalNoticeById(this as any, id);
  }

  public evaluateLoanRecoveryEligibility(loanId: string) {
    return recoveryRestructuringSlice.evaluateLoanRecoveryEligibility(this as any, loanId);
  }

  public escalateToRecovery(
    payload: EscalateToRecoveryPayload,
    actorName: string = 'Collection Officer',
    actorRole: string = 'Collection Officer'
  ): RecoveryCaseRecord {
    return recoveryRestructuringSlice.escalateToRecovery(this as any, payload, actorName, actorRole);
  }

  public assignRecoveryOfficer(
    caseId: string,
    officerId: string,
    officerName: string,
    reason?: string,
    actorName: string = 'Recovery Manager'
  ): RecoveryCaseRecord {
    return recoveryRestructuringSlice.assignRecoveryOfficer(this as any, caseId, officerId, officerName, reason, actorName);
  }

  public logRecoveryAction(
    payload: RecordRecoveryActionPayload,
    officerName: string = 'Rajesh Naik',
    officerRole: string = 'Senior Recovery Officer'
  ): RecoveryActionRecord {
    return recoveryRestructuringSlice.logRecoveryAction(this as any, payload, officerName, officerRole);
  }

  public recordRecoveryNegotiation(
    caseId: string,
    proposedAmount: number,
    proposedDate: string,
    frequency: string,
    reason: string,
    customerResponse?: string,
    officerName: string = 'Rajesh Naik'
  ): RecoveryNegotiationRecord {
    return recoveryRestructuringSlice.recordRecoveryNegotiation(this as any, caseId, proposedAmount, proposedDate, frequency, reason, customerResponse, officerName);
  }

  public requestLegalReview(
    payload: RequestLegalReviewPayload,
    actorName: string = 'Senior Recovery Officer',
    actorRole: string = 'Senior Recovery Officer'
  ): LegalReviewRecord {
    return recoveryRestructuringSlice.requestLegalReview(this as any, payload, actorName, actorRole);
  }

  public approveLegalReview(
    reviewId: string,
    approved: boolean,
    notes?: string,
    reviewerName: string = 'Vikram Mehta',
    reviewerRole: string = 'Head of Credit & Remedial'
  ): LegalReviewRecord {
    return recoveryRestructuringSlice.approveLegalReview(this as any, reviewId, approved, notes, reviewerName, reviewerRole);
  }

  public createLegalCase(
    payload: CreateLegalCasePayload,
    actorName: string = 'Sanjay Deshmukh',
    actorRole: string = 'Legal Officer'
  ): LegalCaseRecord {
    return recoveryRestructuringSlice.createLegalCase(this as any, payload, actorName, actorRole);
  }

  public addLegalCaseEvent(
    legalCaseId: string,
    eventType: string,
    notes: string,
    referenceNumber?: string,
    nextHearingDate?: string,
    actorName: string = 'Legal Officer',
    actorRole: string = 'Legal Officer'
  ): LegalCaseEventRecord {
    return recoveryRestructuringSlice.addLegalCaseEvent(this as any, legalCaseId, eventType, notes, referenceNumber, nextHearingDate, actorName, actorRole);
  }

  public createLegalNotice(
    payload: CreateLegalNoticePayload,
    preparerName: string = 'Sanjay Deshmukh'
  ): LegalNoticeRecord {
    return recoveryRestructuringSlice.createLegalNotice(this as any, payload, preparerName);
  }

  public approveLegalNotice(
    noticeId: string,
    approverName: string = 'Vikram Mehta'
  ): LegalNoticeRecord {
    return recoveryRestructuringSlice.approveLegalNotice(this as any, noticeId, approverName);
  }

  public dispatchLegalNotice(
    noticeId: string,
    trackingNumber?: string,
    dispatchMode?: string,
    dispatcherName: string = 'Sanjay Deshmukh'
  ): LegalNoticeRecord {
    return recoveryRestructuringSlice.dispatchLegalNotice(this as any, noticeId, trackingNumber, dispatchMode, dispatcherName);
  }

  public resolveRecoveryCase(
    caseId: string,
    resolutionOutcome: string,
    notes?: string,
    actorName: string = 'Recovery Manager'
  ): RecoveryCaseRecord {
    return recoveryRestructuringSlice.resolveRecoveryCase(this as any, caseId, resolutionOutcome, notes, actorName);
  }

  public getRecoveryKPIs(): RecoveryKPIs {
    return recoveryRestructuringSlice.getRecoveryKPIs(this as any);
  }

  // Restructuring, Rescheduling & Moratoriums actions (Batch 14)
  public getRestructuringRequests(): RestructuringRequestRecord[] {
    return recoveryRestructuringSlice.getRestructuringRequests(this as any);
  }

  public getRestructuringById(id: string): RestructuringRequestRecord | undefined {
    return recoveryRestructuringSlice.getRestructuringById(this as any, id);
  }

  public createRestructuringRequest(payload: CreateRestructuringPayload): RestructuringRequestRecord {
    return recoveryRestructuringSlice.createRestructuringRequest(this as any, payload);
  }

  public startRestructuringReview(
    requestId: string,
    reviewerName: string = 'Senior Credit Underwriter'
  ): RestructuringRequestRecord {
    return recoveryRestructuringSlice.startRestructuringReview(this as any, requestId, reviewerName);
  }

  public approveRestructuringRequest(
    requestId: string,
    approverName: string = 'Branch Credit Committee Head',
    notes?: string
  ): RestructuringRequestRecord {
    return recoveryRestructuringSlice.approveRestructuringRequest(this as any, requestId, approverName, notes);
  }

  public rejectRestructuringRequest(
    requestId: string,
    reason: string,
    rejectorName: string = 'Credit Committee'
  ): RestructuringRequestRecord {
    return recoveryRestructuringSlice.rejectRestructuringRequest(this as any, requestId, reason, rejectorName);
  }

  public applyRestructuringRequest(
    requestId: string,
    actorName: string = 'Operations Officer'
  ): RestructuringRequestRecord {
    return recoveryRestructuringSlice.applyRestructuringRequest(this as any, requestId, actorName);
  }
}

export const mockLMSStore = new MockLMSStore();

export function useMockLMSStore() {
  const [state, setState] = useState(() => mockLMSStore.getState());

  useEffect(() => {
    mockLMSStore.loadFromDatabase();
    const unsubscribe = mockLMSStore.subscribe(() => {
      setState(mockLMSStore.getState());
    });
    return unsubscribe;
  }, []);

  return {
    ...state,
    createUser: mockLMSStore.createUser.bind(mockLMSStore),
    updateUser: mockLMSStore.updateUser.bind(mockLMSStore),
    deactivateUser: mockLMSStore.deactivateUser.bind(mockLMSStore),
    reactivateUser: mockLMSStore.reactivateUser.bind(mockLMSStore),
    createRole: mockLMSStore.createRole.bind(mockLMSStore),
    updateRole: mockLMSStore.updateRole.bind(mockLMSStore),
    deactivateRole: mockLMSStore.deactivateRole.bind(mockLMSStore),
    reactivateRole: mockLMSStore.reactivateRole.bind(mockLMSStore),
    createBranch: mockLMSStore.createBranch.bind(mockLMSStore),
    updateBranch: mockLMSStore.updateBranch.bind(mockLMSStore),
    deactivateBranch: mockLMSStore.deactivateBranch.bind(mockLMSStore),
    reactivateBranch: mockLMSStore.reactivateBranch.bind(mockLMSStore),
    logAudit: mockLMSStore.logAudit.bind(mockLMSStore),
    // Customer actions (Batch 3)
    findPossibleDuplicates: mockLMSStore.findPossibleDuplicates.bind(mockLMSStore),
    createCustomer: mockLMSStore.createCustomer.bind(mockLMSStore),
    updateCustomer: mockLMSStore.updateCustomer.bind(mockLMSStore),
    archiveCustomer: mockLMSStore.archiveCustomer.bind(mockLMSStore),
    restoreCustomer: mockLMSStore.restoreCustomer.bind(mockLMSStore),
    getCustomerById: mockLMSStore.getCustomerById.bind(mockLMSStore),
    getCustomerApplications: mockLMSStore.getCustomerApplications.bind(mockLMSStore),
    getCustomerLoans: mockLMSStore.getCustomerLoans.bind(mockLMSStore),
    getCustomerHistory: mockLMSStore.getCustomerHistory.bind(mockLMSStore),
    // KYC & Document actions (Batch 4)
    getCustomerKyc: mockLMSStore.getCustomerKyc.bind(mockLMSStore),
    verifyKyc: mockLMSStore.verifyKyc.bind(mockLMSStore),
    rejectKyc: mockLMSStore.rejectKyc.bind(mockLMSStore),
    requestKycAction: mockLMSStore.requestKycAction.bind(mockLMSStore),
    updateKycRisk: mockLMSStore.updateKycRisk.bind(mockLMSStore),
    triggerGovernmentApiVerification: mockLMSStore.triggerGovernmentApiVerification.bind(mockLMSStore),
    getCustomerDocuments: mockLMSStore.getCustomerDocuments.bind(mockLMSStore),
    uploadDocument: mockLMSStore.uploadDocument.bind(mockLMSStore),
    verifyDocument: mockLMSStore.verifyDocument.bind(mockLMSStore),
    rejectDocument: mockLMSStore.rejectDocument.bind(mockLMSStore),
    waiveDocument: mockLMSStore.waiveDocument.bind(mockLMSStore),
    deleteDocument: mockLMSStore.deleteDocument.bind(mockLMSStore),
    renewDocument: mockLMSStore.renewDocument.bind(mockLMSStore),
    sendDocumentExpiryReminder: mockLMSStore.sendDocumentExpiryReminder.bind(mockLMSStore),
    // Application actions (Batch 5)
    getApplicationById: mockLMSStore.getApplicationById.bind(mockLMSStore),
    createApplication: mockLMSStore.createApplication.bind(mockLMSStore),
    updateApplication: mockLMSStore.updateApplication.bind(mockLMSStore),
    addCoApplicant: mockLMSStore.addCoApplicant.bind(mockLMSStore),
    removeCoApplicant: mockLMSStore.removeCoApplicant.bind(mockLMSStore),
    addGuarantor: mockLMSStore.addGuarantor.bind(mockLMSStore),
    removeGuarantor: mockLMSStore.removeGuarantor.bind(mockLMSStore),
    linkCustomerKycDocument: mockLMSStore.linkCustomerKycDocument.bind(mockLMSStore),
    uploadApplicationDocument: mockLMSStore.uploadApplicationDocument.bind(mockLMSStore),
    verifyApplicationDocument: mockLMSStore.verifyApplicationDocument.bind(mockLMSStore),
    rejectApplicationDocument: mockLMSStore.rejectApplicationDocument.bind(mockLMSStore),
    removeApplicationDocument: mockLMSStore.removeApplicationDocument.bind(mockLMSStore),
    validateApplicationForSubmission: mockLMSStore.validateApplicationForSubmission.bind(mockLMSStore),
    submitApplication: mockLMSStore.submitApplication.bind(mockLMSStore),
    cancelApplication: mockLMSStore.cancelApplication.bind(mockLMSStore),
    updateApplicationStatus: mockLMSStore.updateApplicationStatus.bind(mockLMSStore),
    logApplicationHistory: mockLMSStore.logApplicationHistory.bind(mockLMSStore),
    getApplicationFormResponse: mockLMSStore.getApplicationFormResponse.bind(mockLMSStore),
    saveDraftFormResponse: mockLMSStore.saveDraftFormResponse.bind(mockLMSStore),
    submitApplicationFormResponse: mockLMSStore.submitApplicationFormResponse.bind(mockLMSStore),
    // Credit actions (Batch 6)
    calculateEMI: mockLMSStore.calculateEMI.bind(mockLMSStore),
    recalculateCreditAssessment: mockLMSStore.recalculateCreditAssessment.bind(mockLMSStore),
    getCreditAssessmentById: mockLMSStore.getCreditAssessmentById.bind(mockLMSStore),
    getCreditAssessmentByAppId: mockLMSStore.getCreditAssessmentByAppId.bind(mockLMSStore),
    assignCreditAssessment: mockLMSStore.assignCreditAssessment.bind(mockLMSStore),
    startCreditAssessment: mockLMSStore.startCreditAssessment.bind(mockLMSStore),
    updateCreditAssessment: mockLMSStore.updateCreditAssessment.bind(mockLMSStore),
    addCreditObligation: mockLMSStore.addCreditObligation.bind(mockLMSStore),
    deleteCreditObligation: mockLMSStore.deleteCreditObligation.bind(mockLMSStore),
    evaluateCreditRules: mockLMSStore.evaluateCreditRules.bind(mockLMSStore),
    addCreditCondition: mockLMSStore.addCreditCondition.bind(mockLMSStore),
    updateCreditConditionStatus: mockLMSStore.updateCreditConditionStatus.bind(mockLMSStore),
    deleteCreditCondition: mockLMSStore.deleteCreditCondition.bind(mockLMSStore),
    returnCreditAssessment: mockLMSStore.returnCreditAssessment.bind(mockLMSStore),
    submitCreditAssessmentRecommendation: mockLMSStore.submitCreditAssessmentRecommendation.bind(mockLMSStore),
    logCreditTimeline: mockLMSStore.logCreditTimeline.bind(mockLMSStore),
    // Approval actions (Batch 7)
    evaluateApprovalMatrix: mockLMSStore.evaluateApprovalMatrix.bind(mockLMSStore),
    getApprovals: mockLMSStore.getApprovals.bind(mockLMSStore),
    getApprovalById: mockLMSStore.getApprovalById.bind(mockLMSStore),
    getApprovalByAppId: mockLMSStore.getApprovalByAppId.bind(mockLMSStore),
    getApprovalByCreditAssessmentId: mockLMSStore.getApprovalByCreditAssessmentId.bind(mockLMSStore),
    createApprovalFromCreditAssessment: mockLMSStore.createApprovalFromCreditAssessment.bind(mockLMSStore),
    assignApproval: mockLMSStore.assignApproval.bind(mockLMSStore),
    startApprovalReview: mockLMSStore.startApprovalReview.bind(mockLMSStore),
    makeApprovalDecision: mockLMSStore.makeApprovalDecision.bind(mockLMSStore),
    addApprovalCondition: mockLMSStore.addApprovalCondition.bind(mockLMSStore),
    updateApprovalConditionStatus: mockLMSStore.updateApprovalConditionStatus.bind(mockLMSStore),
    deleteApprovalCondition: mockLMSStore.deleteApprovalCondition.bind(mockLMSStore),
    addApprovalException: mockLMSStore.addApprovalException.bind(mockLMSStore),
    routeApprovalException: mockLMSStore.routeApprovalException.bind(mockLMSStore),
    resolveApprovalException: mockLMSStore.resolveApprovalException.bind(mockLMSStore),
    addApprovalMatrixRule: mockLMSStore.addApprovalMatrixRule.bind(mockLMSStore),
    updateApprovalMatrixRule: mockLMSStore.updateApprovalMatrixRule.bind(mockLMSStore),
    toggleApprovalMatrixRuleActive: mockLMSStore.toggleApprovalMatrixRuleActive.bind(mockLMSStore),
    deleteApprovalMatrixRule: mockLMSStore.deleteApprovalMatrixRule.bind(mockLMSStore),
    // Sanction actions (Batch 8)
    getSanctions: mockLMSStore.getSanctions.bind(mockLMSStore),
    getSanctionById: mockLMSStore.getSanctionById.bind(mockLMSStore),
    getSanctionByApplicationId: mockLMSStore.getSanctionByApplicationId.bind(mockLMSStore),
    getSanctionByApprovalId: mockLMSStore.getSanctionByApprovalId.bind(mockLMSStore),
    createSanction: mockLMSStore.createSanction.bind(mockLMSStore),
    updateSanctionTerms: mockLMSStore.updateSanctionTerms.bind(mockLMSStore),
    submitSanctionForReview: mockLMSStore.submitSanctionForReview.bind(mockLMSStore),
    submitSanctionForConfirmation: mockLMSStore.submitSanctionForConfirmation.bind(mockLMSStore),
    addSanctionCondition: mockLMSStore.addSanctionCondition.bind(mockLMSStore),
    updateSanctionConditionStatus: mockLMSStore.updateSanctionConditionStatus.bind(mockLMSStore),
    waiveSanctionCondition: mockLMSStore.waiveSanctionCondition.bind(mockLMSStore),
    deleteSanctionCondition: mockLMSStore.deleteSanctionCondition.bind(mockLMSStore),
    generateSanctionLetter: mockLMSStore.generateSanctionLetter.bind(mockLMSStore),
    issueSanctionLetter: mockLMSStore.issueSanctionLetter.bind(mockLMSStore),
    validateSanctionPrerequisites: mockLMSStore.validateSanctionPrerequisites.bind(mockLMSStore),
    checkSanctionSegregationOfDuties: mockLMSStore.checkSanctionSegregationOfDuties.bind(mockLMSStore),
    confirmSanction: mockLMSStore.confirmSanction.bind(mockLMSStore),
    returnSanction: mockLMSStore.returnSanction.bind(mockLMSStore),
    cancelSanction: mockLMSStore.cancelSanction.bind(mockLMSStore),
    getPreDisbursementReadiness: mockLMSStore.getPreDisbursementReadiness.bind(mockLMSStore),
    // Disbursement actions (Batch 9)
    getDisbursements: mockLMSStore.getDisbursements.bind(mockLMSStore),
    getDisbursementById: mockLMSStore.getDisbursementById.bind(mockLMSStore),
    getDisbursementBySanctionId: mockLMSStore.getDisbursementBySanctionId.bind(mockLMSStore),
    getDisbursementByApplicationId: mockLMSStore.getDisbursementByApplicationId.bind(mockLMSStore),
    evaluateDisbursementReadiness: mockLMSStore.evaluateDisbursementReadiness.bind(mockLMSStore),
    createDisbursementRequest: mockLMSStore.createDisbursementRequest.bind(mockLMSStore),
    assignDisbursement: mockLMSStore.assignDisbursement.bind(mockLMSStore),
    approveDisbursement: mockLMSStore.approveDisbursement.bind(mockLMSStore),
    rejectDisbursement: mockLMSStore.rejectDisbursement.bind(mockLMSStore),
    returnDisbursement: mockLMSStore.returnDisbursement.bind(mockLMSStore),
    executeDisbursementTransaction: mockLMSStore.executeDisbursementTransaction.bind(mockLMSStore),
    reverseDisbursementTransaction: mockLMSStore.reverseDisbursementTransaction.bind(mockLMSStore),
    addDisbursementBeneficiary: mockLMSStore.addDisbursementBeneficiary.bind(mockLMSStore),
    getDisbursementKPIs: mockLMSStore.getDisbursementKPIs.bind(mockLMSStore),
    // Loan Account actions (Batch 10)
    getLoanAccounts: mockLMSStore.getLoanAccounts.bind(mockLMSStore),
    createLoanAccount: mockLMSStore.createLoanAccount.bind(mockLMSStore),
    getLoanAccountById: mockLMSStore.getLoanAccountById.bind(mockLMSStore),
    getLoanAccountByApplicationId: mockLMSStore.getLoanAccountByApplicationId.bind(mockLMSStore),
    getLoanAccountBySanctionId: mockLMSStore.getLoanAccountBySanctionId.bind(mockLMSStore),
    getLoanAccountByDisbursementId: mockLMSStore.getLoanAccountByDisbursementId.bind(mockLMSStore),
    getLoanAccountsByCustomerId: mockLMSStore.getLoanAccountsByCustomerId.bind(mockLMSStore),
    processLoanAccountOnDisbursement: mockLMSStore.processLoanAccountOnDisbursement.bind(mockLMSStore),
    generateScheduleVersion: mockLMSStore.generateScheduleVersion.bind(mockLMSStore),
    updateRepaymentSettings: mockLMSStore.updateRepaymentSettings.bind(mockLMSStore),
    addLoanCharge: mockLMSStore.addLoanCharge.bind(mockLMSStore),
    // Repayment & Payment Posting actions (Batch 11)
    getPayments: mockLMSStore.getPayments.bind(mockLMSStore),
    getPaymentById: mockLMSStore.getPaymentById.bind(mockLMSStore),
    getPaymentsByLoanId: mockLMSStore.getPaymentsByLoanId.bind(mockLMSStore),
    getUnallocatedPayments: mockLMSStore.getUnallocatedPayments.bind(mockLMSStore),
    recordPayment: mockLMSStore.recordPayment.bind(mockLMSStore),
    verifyPayment: mockLMSStore.verifyPayment.bind(mockLMSStore),
    postPayment: mockLMSStore.postPayment.bind(mockLMSStore),
    reversePayment: mockLMSStore.reversePayment.bind(mockLMSStore),
    getReceiptByPaymentId: mockLMSStore.getReceiptByPaymentId.bind(mockLMSStore),
    resolveUnallocatedPayment: mockLMSStore.resolveUnallocatedPayment.bind(mockLMSStore),
    getRepaymentKPIs: mockLMSStore.getRepaymentKPIs.bind(mockLMSStore),
    // Recovery & Legal Collections actions (Batch 13)
    getRecoveryCases: mockLMSStore.getRecoveryCases.bind(mockLMSStore),
    getRecoveryCaseById: mockLMSStore.getRecoveryCaseById.bind(mockLMSStore),
    getRecoveryByLoanId: mockLMSStore.getRecoveryByLoanId.bind(mockLMSStore),
    getLegalCases: mockLMSStore.getLegalCases.bind(mockLMSStore),
    getLegalCaseById: mockLMSStore.getLegalCaseById.bind(mockLMSStore),
    getLegalNotices: mockLMSStore.getLegalNotices.bind(mockLMSStore),
    getLegalNoticeById: mockLMSStore.getLegalNoticeById.bind(mockLMSStore),
    evaluateLoanRecoveryEligibility: mockLMSStore.evaluateLoanRecoveryEligibility.bind(mockLMSStore),
    escalateToRecovery: mockLMSStore.escalateToRecovery.bind(mockLMSStore),
    assignRecoveryOfficer: mockLMSStore.assignRecoveryOfficer.bind(mockLMSStore),
    logRecoveryAction: mockLMSStore.logRecoveryAction.bind(mockLMSStore),
    recordRecoveryNegotiation: mockLMSStore.recordRecoveryNegotiation.bind(mockLMSStore),
    requestLegalReview: mockLMSStore.requestLegalReview.bind(mockLMSStore),
    approveLegalReview: mockLMSStore.approveLegalReview.bind(mockLMSStore),
    createLegalCase: mockLMSStore.createLegalCase.bind(mockLMSStore),
    addLegalCaseEvent: mockLMSStore.addLegalCaseEvent.bind(mockLMSStore),
    createLegalNotice: mockLMSStore.createLegalNotice.bind(mockLMSStore),
    approveLegalNotice: mockLMSStore.approveLegalNotice.bind(mockLMSStore),
    dispatchLegalNotice: mockLMSStore.dispatchLegalNotice.bind(mockLMSStore),
    resolveRecoveryCase: mockLMSStore.resolveRecoveryCase.bind(mockLMSStore),
    getRecoveryKPIs: mockLMSStore.getRecoveryKPIs.bind(mockLMSStore),
    // Restructuring, Rescheduling & Moratoriums actions (Batch 14)
    getRestructuringRequests: mockLMSStore.getRestructuringRequests.bind(mockLMSStore),
    getRestructuringById: mockLMSStore.getRestructuringById.bind(mockLMSStore),
    createRestructuringRequest: mockLMSStore.createRestructuringRequest.bind(mockLMSStore),
    startRestructuringReview: mockLMSStore.startRestructuringReview.bind(mockLMSStore),
    approveRestructuringRequest: mockLMSStore.approveRestructuringRequest.bind(mockLMSStore),
    rejectRestructuringRequest: mockLMSStore.rejectRestructuringRequest.bind(mockLMSStore),
    applyRestructuringRequest: mockLMSStore.applyRestructuringRequest.bind(mockLMSStore),
    loadFromDatabase: mockLMSStore.loadFromDatabase.bind(mockLMSStore),
  };
}

export const useMockStore = useMockLMSStore;



