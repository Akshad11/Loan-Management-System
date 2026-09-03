import { useState, useEffect } from 'react';
import {
  LMSUser,
  Role,
  Branch,
  AdminAuditEntry,
  UserStatus,
  RoleStatus,
  BranchStatus,
  CustomerRecord,
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
import { INITIAL_USERS } from '../data/users';
import { INITIAL_ROLES } from '../data/roles';
import { INITIAL_BRANCHES } from '../data/branches';
import { INITIAL_ADMIN_AUDIT_LOGS } from '../data/audit';
import { INITIAL_CUSTOMERS } from '../data/customers';
import { INITIAL_CUSTOMER_APPLICATIONS } from '../data/customerApplications';
import { INITIAL_CUSTOMER_LOANS } from '../data/customerLoans';
import { INITIAL_CUSTOMER_HISTORY } from '../data/customerHistory';
import { INITIAL_KYC_RECORDS } from '../data/kycData';
import { INITIAL_DOCUMENTS, INITIAL_CHECKLIST_REQUIREMENTS } from '../data/documentData';
import {
  LOAN_PRODUCTS_CONFIG,
  INITIAL_APPLICATIONS,
  INITIAL_APPLICATION_HISTORY,
} from '../data/applicationData';
import { INITIAL_CREDIT_ASSESSMENTS } from '../data/creditData';
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
import { INITIAL_APPROVALS } from '../data/approvalData';
import {
  INITIAL_APPROVAL_MATRIX_RULES,
  INITIAL_APPROVAL_MATRIX_AUDIT,
} from '../data/approvalMatrixData';
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
import { INITIAL_SANCTIONS } from '../data/sanctionData';
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
import { INITIAL_DISBURSEMENTS } from '../data/disbursementData';
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
import { INITIAL_LOAN_ACCOUNTS } from '../data/loanAccountData';
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
import { INITIAL_PAYMENTS, INITIAL_UNALLOCATED_PAYMENTS } from '../data/repaymentData';
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
  INITIAL_RECOVERY_CASES,
  INITIAL_LEGAL_CASES,
  INITIAL_LEGAL_NOTICES,
} from '../data/recoveryData';
import {
  RestructuringRequestRecord,
  RestructuringEventRecord,
  RestructuringProposalRecord,
  CreateRestructuringPayload,
  RestructuringKPIs,
} from '../types/restructuringTypes';
import { INITIAL_RESTRUCTURING_REQUESTS } from '../data/restructuringData';
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
    };
  }

  private recountRoleAndBranchUsers() {
    this.roles = this.roles.map((r) => {
      const count = this.users.filter((u) => u.roleId === r.id && u.status === 'ACTIVE').length;
      return { ...r, userCount: count };
    });

    this.branches = this.branches.map((b) => {
      const count = this.users.filter((u) => u.branchId === b.id && u.status === 'ACTIVE').length;
      return { ...b, userCount: count };
    });
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
      if (customersRes && Array.isArray(customersRes)) this.customers = customersRes;
      if (kycRes && Array.isArray(kycRes)) this.kycRecords = kycRes;
      if (docsRes && Array.isArray(docsRes)) this.documents = docsRes;
      
      const prodsList = productsRes?.products || (Array.isArray(productsRes) ? productsRes : null);
      if (prodsList && Array.isArray(prodsList)) this.loanProductsConfig = prodsList;

      const appsList = appsRes?.applications || (Array.isArray(appsRes) ? appsRes : null);
      if (appsList && Array.isArray(appsList)) {
        this.applications = appsList;
        this.customerApplications = appsList.map((a: any) => ({
          id: a.id,
          applicationNumber: a.applicationNumber,
          customerId: a.customerId,
          customerName: a.customerName,
          productCode: a.productCode,
          productName: a.productName,
          requestedAmount: a.requestedAmount,
          tenureMonths: a.requestedTenureMonths,
          interestRate: a.interestRate,
          applicationDate: a.applicationDate,
          status: a.status,
          branchId: a.branchId,
          branchName: a.branchName,
          assignedOfficer: a.loanOfficer,
          purpose: a.purpose,
        }));
      }

      if (assessmentsRes && Array.isArray(assessmentsRes)) this.creditAssessments = assessmentsRes;
      if (approvalsRes && Array.isArray(approvalsRes)) this.approvals = approvalsRes;
      if (matrixRes && Array.isArray(matrixRes)) this.approvalMatrixRules = matrixRes;
      if (sanctionsRes && Array.isArray(sanctionsRes)) this.sanctions = sanctionsRes;
      if (disbursementsRes && Array.isArray(disbursementsRes)) this.disbursements = disbursementsRes;

      const loansList = loansRes?.loans || (Array.isArray(loansRes) ? loansRes : null);
      if (loansList && Array.isArray(loansList)) {
        this.loanAccounts = loansList;
        this.customerLoans = loansList.map((l: any) => ({
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
      }

      if (repaymentsRes && Array.isArray(repaymentsRes)) this.payments = repaymentsRes;
      if (recoveryRes && Array.isArray(recoveryRes)) this.recoveryCases = recoveryRes;
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
    }).catch((err) => {
      console.warn(`API sync error on ${method} ${url}:`, err);
    });
  }

  public logAudit(entry: Omit<AdminAuditEntry, 'id' | 'timestamp' | 'actorId' | 'actorName' | 'actorRole' | 'ipAddress'>) {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newLog: AdminAuditEntry = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: formattedDate,
      actorId: 'usr_001',
      actorName: 'Siddharth Rao (EMP-001001)',
      actorRole: 'System Administrator',
      ipAddress: '10.14.22.102',
      ...entry,
    };

    this.auditLogs = [newLog, ...this.auditLogs];
    this.syncApi('/api/audit', 'POST', newLog);
  }

  // --- USER OPERATIONS ---
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
    const role = this.roles.find((r) => r.id === userData.roleId);
    const branch = this.branches.find((b) => b.id === userData.branchId);
    const fullName = `${userData.firstName.trim()} ${userData.lastName.trim()}`;
    const now = new Date().toISOString().split('T')[0];

    const newUser: LMSUser = {
      id: `usr_${Date.now()}`,
      firstName: userData.firstName.trim(),
      lastName: userData.lastName.trim(),
      name: fullName,
      employeeId: userData.employeeId.trim().toUpperCase(),
      username: userData.username.trim().toLowerCase(),
      email: userData.email.trim().toLowerCase(),
      mobile: userData.mobile.trim(),
      roleId: userData.roleId,
      roleName: role ? role.name : 'Unknown Role',
      branchId: userData.branchId,
      branchName: branch ? branch.name : 'Unknown Branch',
      department: userData.department?.trim() || 'General Operations',
      status: userData.status,
      createdDate: now,
      updatedDate: now,
      lastLogin: 'Never logged in',
      failedLoginAttempts: 0,
    };

    this.users = [newUser, ...this.users];
    this.recountRoleAndBranchUsers();

    this.logAudit({
      entityType: 'USER',
      entityId: newUser.id,
      entityName: `${newUser.name} (${newUser.employeeId})`,
      action: 'USER_CREATED',
      details: `Created new staff account with role "${newUser.roleName}" at "${newUser.branchName}".`,
    });

    this.notify();
    return newUser;
  }

  public updateUser(userId: string, updates: Partial<LMSUser>, reason?: string): LMSUser {
    const index = this.users.findIndex((u) => u.id === userId);
    if (index === -1) throw new Error('User not found');

    const prev = this.users[index];
    const role = updates.roleId ? this.roles.find((r) => r.id === updates.roleId) : undefined;
    const branch = updates.branchId ? this.branches.find((b) => b.id === updates.branchId) : undefined;

    const firstName = updates.firstName !== undefined ? updates.firstName.trim() : prev.firstName;
    const lastName = updates.lastName !== undefined ? updates.lastName.trim() : prev.lastName;
    const fullName = `${firstName} ${lastName}`.trim();

    const updatedUser: LMSUser = {
      ...prev,
      ...updates,
      firstName,
      lastName,
      name: fullName || prev.name,
      roleName: role ? role.name : (updates.roleName || prev.roleName),
      branchName: branch ? branch.name : (updates.branchName || prev.branchName),
      updatedDate: new Date().toISOString().split('T')[0],
    };

    this.users[index] = updatedUser;
    this.recountRoleAndBranchUsers();

    this.logAudit({
      entityType: 'USER',
      entityId: updatedUser.id,
      entityName: `${updatedUser.name} (${updatedUser.employeeId})`,
      action: 'USER_UPDATED',
      details: `Updated staff profile information and assignments.`,
      reason: reason || 'Administrative profile update',
    });

    this.notify();
    return updatedUser;
  }

  public deactivateUser(userId: string, reason: string) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    user.status = 'INACTIVE';
    user.updatedDate = new Date().toISOString().split('T')[0];
    this.recountRoleAndBranchUsers();

    this.logAudit({
      entityType: 'USER',
      entityId: user.id,
      entityName: `${user.name} (${user.employeeId})`,
      action: 'USER_DEACTIVATED',
      details: `Staff account marked as INACTIVE. Active sessions revoked.`,
      reason,
    });

    this.notify();
  }

  public reactivateUser(userId: string, reason?: string) {
    const user = this.users.find((u) => u.id === userId);
    if (!user) throw new Error('User not found');

    user.status = 'ACTIVE';
    user.updatedDate = new Date().toISOString().split('T')[0];
    this.recountRoleAndBranchUsers();

    this.logAudit({
      entityType: 'USER',
      entityId: user.id,
      entityName: `${user.name} (${user.employeeId})`,
      action: 'USER_REACTIVATED',
      details: `Staff account reactivated to ACTIVE status.`,
      reason: reason || 'Administrative reactivation',
    });

    this.notify();
  }

  // --- ROLE OPERATIONS ---
  public createRole(roleData: {
    name: string;
    description: string;
    permissionIds: string[];
    status: RoleStatus;
  }): Role {
    const now = new Date().toISOString().split('T')[0];
    const code = roleData.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');

    const newRole: Role = {
      id: `role_${Date.now()}`,
      code,
      name: roleData.name.trim(),
      description: roleData.description.trim(),
      status: roleData.status,
      userCount: 0,
      permissionIds: roleData.permissionIds,
      createdDate: now,
      updatedDate: now,
      updatedBy: 'Siddharth Rao (EMP-001001)',
    };

    this.roles = [...this.roles, newRole];

    this.logAudit({
      entityType: 'ROLE',
      entityId: newRole.id,
      entityName: newRole.name,
      action: 'ROLE_CREATED',
      details: `Created new RBAC role with ${newRole.permissionIds.length} granted permissions.`,
    });

    this.notify();
    return newRole;
  }

  public updateRole(roleId: string, updates: Partial<Role>, reason?: string): Role {
    const index = this.roles.findIndex((r) => r.id === roleId);
    if (index === -1) throw new Error('Role not found');

    const prev = this.roles[index];
    const updatedRole: Role = {
      ...prev,
      ...updates,
      updatedDate: new Date().toISOString().split('T')[0],
      updatedBy: 'Siddharth Rao (EMP-001001)',
    };

    this.roles[index] = updatedRole;

    this.logAudit({
      entityType: 'ROLE',
      entityId: updatedRole.id,
      entityName: updatedRole.name,
      action: 'ROLE_UPDATED',
      details: `Updated role configuration and permission grants (${updatedRole.permissionIds.length} total permissions).`,
      reason: reason || 'Policy update',
    });

    this.notify();
    return updatedRole;
  }

  public deactivateRole(roleId: string, reason: string) {
    const role = this.roles.find((r) => r.id === roleId);
    if (!role) throw new Error('Role not found');
    if (role.isSystemProtected) throw new Error('Cannot deactivate system protected role');

    role.status = 'INACTIVE';
    role.updatedDate = new Date().toISOString().split('T')[0];

    this.logAudit({
      entityType: 'ROLE',
      entityId: role.id,
      entityName: role.name,
      action: 'ROLE_DEACTIVATED',
      details: `Role marked as INACTIVE.`,
      reason,
    });

    this.notify();
  }

  public reactivateRole(roleId: string, reason?: string) {
    const role = this.roles.find((r) => r.id === roleId);
    if (!role) throw new Error('Role not found');

    role.status = 'ACTIVE';
    role.updatedDate = new Date().toISOString().split('T')[0];

    this.logAudit({
      entityType: 'ROLE',
      entityId: role.id,
      entityName: role.name,
      action: 'ROLE_REACTIVATED',
      details: `Role status restored to ACTIVE.`,
      reason: reason || 'Administrative reactivation',
    });

    this.notify();
  }

  // --- BRANCH OPERATIONS ---
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
    const now = new Date().toISOString().split('T')[0];
    const manager = branchData.managerId ? this.users.find((u) => u.id === branchData.managerId) : undefined;

    const newBranch: Branch = {
      id: `br_${Date.now()}`,
      code: branchData.code.trim().toUpperCase(),
      name: branchData.name.trim(),
      addressLine1: branchData.addressLine1.trim(),
      addressLine2: branchData.addressLine2?.trim(),
      city: branchData.city.trim(),
      state: branchData.state.trim(),
      pinCode: branchData.pinCode.trim(),
      phone: branchData.phone.trim(),
      email: branchData.email.trim().toLowerCase(),
      managerId: branchData.managerId,
      managerName: manager?.name,
      status: branchData.status,
      userCount: 0,
      activeLoanCount: 0,
      totalPortfolioValue: 0,
      createdDate: now,
      updatedDate: now,
    };

    this.branches = [...this.branches, newBranch];

    this.logAudit({
      entityType: 'BRANCH',
      entityId: newBranch.id,
      entityName: `${newBranch.name} (${newBranch.code})`,
      action: 'BRANCH_CREATED',
      details: `Created new branch office in ${newBranch.city}, ${newBranch.state}.`,
    });

    this.notify();
    return newBranch;
  }

  public updateBranch(branchId: string, updates: Partial<Branch>, reason?: string): Branch {
    const index = this.branches.findIndex((b) => b.id === branchId);
    if (index === -1) throw new Error('Branch not found');

    const prev = this.branches[index];
    const manager = updates.managerId ? this.users.find((u) => u.id === updates.managerId) : undefined;

    const updatedBranch: Branch = {
      ...prev,
      ...updates,
      managerName: manager ? manager.name : (updates.managerName !== undefined ? updates.managerName : prev.managerName),
      updatedDate: new Date().toISOString().split('T')[0],
    };

    this.branches[index] = updatedBranch;

    this.logAudit({
      entityType: 'BRANCH',
      entityId: updatedBranch.id,
      entityName: `${updatedBranch.name} (${updatedBranch.code})`,
      action: 'BRANCH_UPDATED',
      details: `Updated branch records, location, and operational parameters.`,
      reason: reason || 'Location/Contact update',
    });

    this.notify();
    return updatedBranch;
  }

  public deactivateBranch(branchId: string, reason: string) {
    const branch = this.branches.find((b) => b.id === branchId);
    if (!branch) throw new Error('Branch not found');

    branch.status = 'INACTIVE';
    branch.updatedDate = new Date().toISOString().split('T')[0];

    this.logAudit({
      entityType: 'BRANCH',
      entityId: branch.id,
      entityName: `${branch.name} (${branch.code})`,
      action: 'BRANCH_DEACTIVATED',
      details: `Branch marked as INACTIVE. Active loan portfolio remains monitored.`,
      reason,
    });

    this.notify();
  }

  public reactivateBranch(branchId: string, reason?: string) {
    const branch = this.branches.find((b) => b.id === branchId);
    if (!branch) throw new Error('Branch not found');

    branch.status = 'ACTIVE';
    branch.updatedDate = new Date().toISOString().split('T')[0];

    this.logAudit({
      entityType: 'BRANCH',
      entityId: branch.id,
      entityName: `${branch.name} (${branch.code})`,
      action: 'BRANCH_REACTIVATED',
      details: `Branch status restored to ACTIVE.`,
      reason: reason || 'Administrative reactivation',
    });

    this.notify();
  }

  // --- CUSTOMER OPERATIONS (BATCH 3) ---

  public findPossibleDuplicates(query: {
    mobile?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    excludeId?: string;
  }): CustomerRecord[] {
    const cleanMobile = (m?: string) => (m ? m.replace(/\D/g, '').slice(-10) : '');
    const targetMobile = cleanMobile(query.mobile);
    const targetEmail = query.email?.trim().toLowerCase();
    const targetFirst = query.firstName?.trim().toLowerCase();
    const targetLast = query.lastName?.trim().toLowerCase();

    return this.customers.filter((c) => {
      if (query.excludeId && c.id === query.excludeId) return false;

      // 1. Mobile match
      if (targetMobile && targetMobile.length === 10) {
        const cMobile = cleanMobile(c.mobile);
        if (cMobile === targetMobile) return true;
      }

      // 2. Email match
      if (targetEmail && c.email && c.email.toLowerCase() === targetEmail) {
        return true;
      }

      // 3. First + Last name + DOB match
      if (
        targetFirst &&
        targetLast &&
        query.dateOfBirth &&
        c.firstName.toLowerCase() === targetFirst &&
        c.lastName.toLowerCase() === targetLast &&
        c.dateOfBirth === query.dateOfBirth
      ) {
        return true;
      }

      return false;
    });
  }

  public createCustomer(data: {
    firstName: string;
    middleName?: string;
    lastName: string;
    dateOfBirth: string;
    gender: Gender;
    maritalStatus?: MaritalStatus;
    nationality?: string;
    customerType: CustomerType;
    mobile: string;
    alternateMobile?: string;
    email?: string;
    preferredContact?: 'MOBILE' | 'EMAIL';
    currentAddress: AddressInfo;
    permanentAddress: AddressInfo;
    sameAsCurrentAddress: boolean;
    employmentType: EmploymentType;
    employerName?: string;
    occupation?: string;
    monthlyIncome: number;
    employmentSince?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    branchId: string;
  }): CustomerRecord {
    const branch = this.branches.find((b) => b.id === data.branchId);
    const branchName = branch ? branch.name : 'Panaji Head Office Branch';
    const fullName = `${data.firstName.trim()} ${data.middleName ? data.middleName.trim() + ' ' : ''}${data.lastName.trim()}`;
    const seq = this.nextCustomerNumberSeq++;
    const customerNumber = `CUS-000${seq}`;
    const now = new Date().toISOString().split('T')[0];

    const maskedAcc = data.accountNumber && data.accountNumber.length > 4
      ? `•••• •••• ${data.accountNumber.slice(-4)}`
      : undefined;

    const newCustomer: CustomerRecord = {
      id: `cus_${Date.now()}`,
      customerNumber,
      firstName: data.firstName.trim(),
      middleName: data.middleName?.trim() || undefined,
      lastName: data.lastName.trim(),
      name: fullName,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      maritalStatus: data.maritalStatus || 'SINGLE',
      nationality: data.nationality || 'Indian',
      customerType: data.customerType || 'INDIVIDUAL',
      mobile: data.mobile.trim(),
      alternateMobile: data.alternateMobile?.trim() || undefined,
      email: data.email?.trim().toLowerCase() || undefined,
      preferredContact: data.preferredContact || 'MOBILE',
      currentAddress: data.currentAddress,
      permanentAddress: data.sameAsCurrentAddress ? data.currentAddress : data.permanentAddress,
      sameAsCurrentAddress: data.sameAsCurrentAddress,
      employmentType: data.employmentType,
      employerName: data.employerName?.trim() || undefined,
      occupation: data.occupation?.trim() || undefined,
      monthlyIncome: Number(data.monthlyIncome) || 0,
      employmentSince: data.employmentSince || undefined,
      bankName: data.bankName?.trim() || undefined,
      accountNumberMasked: maskedAcc,
      accountNumber: data.accountNumber?.trim() || undefined,
      ifscCode: data.ifscCode?.trim().toUpperCase() || undefined,
      branchId: data.branchId,
      branchName,
      status: 'ACTIVE',
      createdDate: now,
      updatedDate: now,
      assignedOfficer: 'Siddharth Rao',
      activeLoanCount: 0,
      closedLoanCount: 0,
      totalOutstanding: 0,
      totalOverdue: 0,
      cibilScore: 750, // Simulated baseline bureau score for new customer
      panMasked: 'ABCDE••••F',
      aadhaarMasked: '•••• •••• 1001',
    };

    this.customers = [newCustomer, ...this.customers];

    // Log Customer History Event
    const histEvent: CustomerHistoryItem = {
      id: `hist_${Date.now()}`,
      customerId: newCustomer.id,
      timestamp: `${now} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      eventType: 'CUSTOMER_CREATED',
      title: 'Customer Onboarded',
      actor: 'Siddharth Rao (EMP-001001)',
      actorRole: 'System Administrator / Loan Officer',
      entityReference: newCustomer.customerNumber,
      description: `Customer master record created with assigned branch: ${branchName}.`,
      module: 'CUSTOMERS',
    };
    this.customerHistory = [histEvent, ...this.customerHistory];

    // Log Global Admin Audit
    this.logAudit({
      entityType: 'USER',
      entityId: newCustomer.id,
      entityName: `${newCustomer.name} (${newCustomer.customerNumber})`,
      action: 'CUSTOMER_CREATED',
      details: `Created new customer profile under branch ${branchName}.`,
    });

    this.syncApi('/api/customers', 'POST', newCustomer);

    this.notify();
    return newCustomer;
  }

  public updateCustomer(
    customerId: string,
    data: Partial<CustomerRecord>
  ): CustomerRecord {
    const index = this.customers.findIndex((c) => c.id === customerId);
    if (index === -1) throw new Error('Customer record not found');

    const prev = this.customers[index];
    const branch = data.branchId ? this.branches.find((b) => b.id === data.branchId) : undefined;
    const branchName = branch ? branch.name : (data.branchName || prev.branchName);

    const firstName = data.firstName !== undefined ? data.firstName.trim() : prev.firstName;
    const lastName = data.lastName !== undefined ? data.lastName.trim() : prev.lastName;
    const middleName = data.middleName !== undefined ? data.middleName?.trim() : prev.middleName;
    const fullName = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`;

    const now = new Date().toISOString().split('T')[0];

    const updated: CustomerRecord = {
      ...prev,
      ...data,
      firstName,
      middleName,
      lastName,
      name: fullName,
      branchName,
      updatedDate: now,
    };

    if (data.accountNumber && data.accountNumber.length > 4) {
      updated.accountNumberMasked = `•••• •••• ${data.accountNumber.slice(-4)}`;
    }

    this.customers[index] = updated;

    // Log History Event
    const histEvent: CustomerHistoryItem = {
      id: `hist_${Date.now()}`,
      customerId: updated.id,
      timestamp: `${now} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      eventType: 'CUSTOMER_UPDATED',
      title: 'Customer Information Updated',
      actor: 'Siddharth Rao (EMP-001001)',
      actorRole: 'Senior Loan Officer',
      entityReference: updated.customerNumber,
      description: `Customer profile information updated by operational staff.`,
      module: 'CUSTOMERS',
    };
    this.customerHistory = [histEvent, ...this.customerHistory];

    // Log Global Admin Audit
    this.logAudit({
      entityType: 'USER',
      entityId: updated.id,
      entityName: `${updated.name} (${updated.customerNumber})`,
      action: 'CUSTOMER_UPDATED',
      details: `Customer profile updated for ${updated.customerNumber}.`,
    });

    this.syncApi('/api/customers', 'PUT', updated);

    this.notify();
    return updated;
  }

  public archiveCustomer(customerId: string, reason: string): CustomerRecord {
    const customer = this.customers.find((c) => c.id === customerId);
    if (!customer) throw new Error('Customer record not found');

    const now = new Date().toISOString().split('T')[0];
    customer.status = 'ARCHIVED';
    customer.archivedReason = reason;
    customer.archivedDate = now;
    customer.archivedBy = 'Siddharth Rao (EMP-001001)';
    customer.updatedDate = now;

    // Log History Event
    const histEvent: CustomerHistoryItem = {
      id: `hist_${Date.now()}`,
      customerId: customer.id,
      timestamp: `${now} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      eventType: 'CUSTOMER_ARCHIVED',
      title: 'Customer Record Archived',
      actor: 'Siddharth Rao (EMP-001001)',
      actorRole: 'System Administrator',
      entityReference: customer.customerNumber,
      description: `Customer marked as ARCHIVED. Reason: ${reason}. Historical loan accounts remain accessible.`,
      module: 'CUSTOMERS',
      metadata: { reason },
    };
    this.customerHistory = [histEvent, ...this.customerHistory];

    this.logAudit({
      entityType: 'USER',
      entityId: customer.id,
      entityName: `${customer.name} (${customer.customerNumber})`,
      action: 'CUSTOMER_ARCHIVED',
      details: `Customer moved to archived status. Reason: ${reason}`,
      reason,
    });

    this.notify();
    return customer;
  }

  public restoreCustomer(customerId: string, reason?: string): CustomerRecord {
    const customer = this.customers.find((c) => c.id === customerId);
    if (!customer) throw new Error('Customer record not found');

    const now = new Date().toISOString().split('T')[0];
    customer.status = 'ACTIVE';
    customer.archivedReason = undefined;
    customer.archivedDate = undefined;
    customer.archivedBy = undefined;
    customer.updatedDate = now;

    const histEvent: CustomerHistoryItem = {
      id: `hist_${Date.now()}`,
      customerId: customer.id,
      timestamp: `${now} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      eventType: 'CUSTOMER_RESTORED',
      title: 'Customer Record Restored',
      actor: 'Siddharth Rao (EMP-001001)',
      actorRole: 'System Administrator',
      entityReference: customer.customerNumber,
      description: `Customer status restored to ACTIVE. Reason: ${reason || 'Administrative restoration'}.`,
      module: 'CUSTOMERS',
    };
    this.customerHistory = [histEvent, ...this.customerHistory];

    this.logAudit({
      entityType: 'USER',
      entityId: customer.id,
      entityName: `${customer.name} (${customer.customerNumber})`,
      action: 'CUSTOMER_RESTORED',
      details: `Customer restored to ACTIVE status.`,
      reason: reason || 'Administrative restoration',
    });

    this.notify();
    return customer;
  }

  public getCustomerById(customerId: string): CustomerRecord | undefined {
    return this.customers.find((c) => c.id === customerId || c.customerNumber === customerId);
  }

  public getCustomerApplications(customerId: string): CustomerApplicationItem[] {
    const customer = this.customers.find((c) => c.id === customerId || c.customerNumber === customerId);
    const fromCustomerApps = this.customerApplications.filter(
      (a) => a.customerId === customerId || (customer && (a.customerId === customer.customerNumber || a.customerName === customer.name))
    );

    const fromApplications: CustomerApplicationItem[] = this.applications
      .filter((a) => a.customerId === customerId || (customer && (a.customerId === customer.customerNumber || a.customerNumber === customer.customerNumber || a.customerName === customer.name)))
      .map((a) => ({
        id: a.id,
        applicationNumber: a.applicationNumber,
        customerId: a.customerId,
        customerName: a.customerName,
        productCode: a.productCode,
        productName: a.productName,
        requestedAmount: a.requestedAmount,
        tenureMonths: a.requestedTenureMonths,
        interestRate: a.interestRate,
        applicationDate: a.applicationDate,
        status: a.status,
        branchId: a.branchId,
        branchName: a.branchName,
        assignedOfficer: a.loanOfficer,
        purpose: a.purpose,
      }));

    const seen = new Set<string>();
    const merged: CustomerApplicationItem[] = [];
    for (const app of [...fromCustomerApps, ...fromApplications]) {
      const key = app.applicationNumber || app.id;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(app);
      }
    }
    return merged;
  }

  public getCustomerLoans(customerId: string): CustomerLoanItem[] {
    const customer = this.customers.find((c) => c.id === customerId || c.customerNumber === customerId);
    const fromCustomerLoans = this.customerLoans.filter(
      (l) => l.customerId === customerId || (customer && (l.customerId === customer.customerNumber || l.customerName === customer.name))
    );

    const fromLoanAccounts: CustomerLoanItem[] = this.loanAccounts
      .filter((l) => l.customerId === customerId || (customer && (l.customerId === customer.customerNumber || l.customerNumber === customer.customerNumber || l.customerName === customer.name)))
      .map((l) => ({
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

    const seen = new Set<string>();
    const merged: CustomerLoanItem[] = [];
    for (const loan of [...fromCustomerLoans, ...fromLoanAccounts]) {
      const key = loan.accountNumber || loan.id;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(loan);
      }
    }
    return merged;
  }

  public getCustomerHistory(customerId: string): CustomerHistoryItem[] {
    return this.customerHistory
      .filter((h) => h.customerId === customerId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // --- KYC OPERATIONS (BATCH 4) ---

  public getCustomerKyc(customerId: string): KycRecord | undefined {
    return this.kycRecords.find((k) => k.customerId === customerId || k.customerNumber === customerId);
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
    let kyc = this.kycRecords.find((k) => k.customerId === customerId);
    const customer = this.customers.find((c) => c.id === customerId);
    const now = new Date();
    const formattedTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const nextReviewYear = now.getFullYear() + 1;
    const nextReviewDate = `${nextReviewYear}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    if (!kyc && customer) {
      // Create fresh verified record
      kyc = {
        id: `kyc_${Date.now()}`,
        customerId: customer.id,
        customerNumber: customer.customerNumber,
        customerName: customer.name,
        customerType: customer.customerType,
        status: 'VERIFIED',
        kycLevel: payload.kycLevel || 'TIER_2_STANDARD',
        riskCategory: payload.riskCategory || 'LOW',
        panRecord: {
          idType: 'PAN',
          idNumberMasked: customer.panMasked || 'ABCDE••••F',
          nameOnId: customer.name.toUpperCase(),
          nameMatchPercentage: 98,
          dobOnId: customer.dateOfBirth,
          verificationSource: 'NSDL Taxpayer Identification System (API v2.4)',
          verificationTimestamp: formattedTimestamp,
          isVerified: true,
          status: 'VALID',
          apiReferenceId: `NSDL_${Date.now()}`,
          remarks: 'Automated exact demographic match',
        },
        aadhaarRecord: {
          idType: 'AADHAAR',
          idNumberMasked: customer.aadhaarMasked || '•••• •••• 1001',
          nameOnId: customer.name,
          nameMatchPercentage: 100,
          dobOnId: customer.dateOfBirth,
          verificationSource: 'UIDAI DigiLocker Paperless e-KYC (XML)',
          verificationTimestamp: formattedTimestamp,
          isVerified: true,
          status: 'VALID',
          apiReferenceId: `UIDAI_${Date.now()}`,
        },
        assignedOfficer: payload.verifiedBy,
        verifiedBy: payload.verifiedBy,
        verifiedAt: formattedTimestamp,
        lastReviewedAt: formattedTimestamp,
        nextReviewDate,
        createdDate: now.toISOString().split('T')[0],
        updatedDate: now.toISOString().split('T')[0],
        complianceNotes: payload.complianceNotes || 'KYC verified and approved in compliance with RBI master directions.',
        pepDeclared: false,
        fatcaCompliant: true,
        amlCheckStatus: 'CLEARED',
      };
      this.kycRecords = [kyc, ...this.kycRecords];
    } else if (kyc) {
      kyc.status = 'VERIFIED';
      kyc.verifiedBy = payload.verifiedBy;
      kyc.verifiedAt = formattedTimestamp;
      kyc.lastReviewedAt = formattedTimestamp;
      kyc.nextReviewDate = nextReviewDate;
      kyc.rejectionReason = undefined;
      kyc.rejectionRemarks = undefined;
      kyc.actionRequiredNotes = undefined;
      if (payload.kycLevel) kyc.kycLevel = payload.kycLevel;
      if (payload.riskCategory) kyc.riskCategory = payload.riskCategory;
      if (payload.complianceNotes) kyc.complianceNotes = payload.complianceNotes;
      kyc.updatedDate = now.toISOString().split('T')[0];
      kyc.panRecord.isVerified = true;
      kyc.panRecord.status = 'VALID';
      kyc.aadhaarRecord.isVerified = true;
      kyc.aadhaarRecord.status = 'VALID';
      kyc.amlCheckStatus = 'CLEARED';
    }

    if (customer) {
      // Log to customer timeline
      const histEvent: CustomerHistoryItem = {
        id: `hist_${Date.now()}`,
        customerId: customer.id,
        timestamp: formattedTimestamp,
        eventType: 'KYC_STATUS_CHANGED',
        title: 'KYC Verification Approved',
        actor: payload.verifiedBy,
        actorRole: 'KYC Compliance Officer',
        entityReference: kyc ? kyc.cKycNumber || kyc.panRecord.idNumberMasked : customer.customerNumber,
        description: `KYC verified successfully (${kyc?.kycLevel || 'TIER_2_STANDARD'}, Risk: ${kyc?.riskCategory || 'LOW'}). Cleared for loan appraisal.`,
        module: 'KYC',
      };
      this.customerHistory = [histEvent, ...this.customerHistory];
    }

    this.logAudit({
      entityType: 'USER',
      entityId: customerId,
      entityName: customer?.name || customerId,
      action: 'KYC_APPROVED',
      details: `KYC profile marked as VERIFIED by ${payload.verifiedBy}.`,
    });

    this.notify();
    return kyc!;
  }

  public rejectKyc(
    customerId: string,
    payload: {
      rejectedBy: string;
      reason: string;
      remarks: string;
    }
  ): KycRecord {
    const kyc = this.kycRecords.find((k) => k.customerId === customerId);
    const customer = this.customers.find((c) => c.id === customerId);
    const now = new Date();
    const formattedTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    if (!kyc) throw new Error('KYC record not found');

    kyc.status = 'REJECTED';
    kyc.rejectionReason = payload.reason;
    kyc.rejectionRemarks = payload.remarks;
    kyc.lastReviewedAt = formattedTimestamp;
    kyc.updatedDate = now.toISOString().split('T')[0];
    kyc.amlCheckStatus = 'FLAGGED';

    if (customer) {
      const histEvent: CustomerHistoryItem = {
        id: `hist_${Date.now()}`,
        customerId: customer.id,
        timestamp: formattedTimestamp,
        eventType: 'KYC_STATUS_CHANGED',
        title: 'KYC Verification Rejected',
        actor: payload.rejectedBy,
        actorRole: 'Compliance Officer',
        entityReference: customer.customerNumber,
        description: `KYC rejected. Reason: ${payload.reason}. Remarks: ${payload.remarks}`,
        module: 'KYC',
      };
      this.customerHistory = [histEvent, ...this.customerHistory];
    }

    this.logAudit({
      entityType: 'USER',
      entityId: customerId,
      entityName: customer?.name || customerId,
      action: 'KYC_REJECTED',
      details: `KYC rejected: ${payload.reason}. Remarks: ${payload.remarks}`,
      reason: payload.reason,
    });

    this.notify();
    return kyc;
  }

  public requestKycAction(
    customerId: string,
    payload: {
      officerName: string;
      actionNotes: string;
    }
  ): KycRecord {
    const kyc = this.kycRecords.find((k) => k.customerId === customerId);
    const customer = this.customers.find((c) => c.id === customerId);
    const now = new Date();
    const formattedTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    if (!kyc) throw new Error('KYC record not found');

    kyc.status = 'ACTION_REQUIRED';
    kyc.actionRequiredNotes = payload.actionNotes;
    kyc.lastReviewedAt = formattedTimestamp;
    kyc.updatedDate = now.toISOString().split('T')[0];

    if (customer) {
      const histEvent: CustomerHistoryItem = {
        id: `hist_${Date.now()}`,
        customerId: customer.id,
        timestamp: formattedTimestamp,
        eventType: 'KYC_STATUS_CHANGED',
        title: 'KYC Action / Clarification Requested',
        actor: payload.officerName,
        actorRole: 'Verification Officer',
        entityReference: customer.customerNumber,
        description: `Clarification requested for KYC: ${payload.actionNotes}`,
        module: 'KYC',
      };
      this.customerHistory = [histEvent, ...this.customerHistory];
    }

    this.logAudit({
      entityType: 'USER',
      entityId: customerId,
      entityName: customer?.name || customerId,
      action: 'KYC_ACTION_REQUESTED',
      details: `Action required requested for KYC: ${payload.actionNotes}`,
    });

    this.notify();
    return kyc;
  }

  public updateKycRisk(
    customerId: string,
    riskCategory: KycRiskCategory,
    reason?: string
  ): KycRecord {
    const kyc = this.kycRecords.find((k) => k.customerId === customerId);
    if (!kyc) throw new Error('KYC record not found');

    kyc.riskCategory = riskCategory;
    kyc.updatedDate = new Date().toISOString().split('T')[0];

    this.logAudit({
      entityType: 'USER',
      entityId: customerId,
      entityName: kyc.customerName,
      action: 'KYC_RISK_UPDATED',
      details: `KYC risk category updated to ${riskCategory}.`,
      reason: reason || 'Risk review update',
    });

    this.notify();
    return kyc;
  }

  public triggerGovernmentApiVerification(
    customerId: string,
    idType: 'PAN' | 'AADHAAR'
  ): KycRecord {
    const kyc = this.kycRecords.find((k) => k.customerId === customerId);
    if (!kyc) throw new Error('KYC record not found');

    const now = new Date();
    const formattedTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    if (idType === 'PAN') {
      kyc.panRecord = {
        ...kyc.panRecord,
        isVerified: true,
        status: 'VALID',
        verificationSource: 'NSDL Taxpayer Identification System (Real-Time API)',
        verificationTimestamp: formattedTimestamp,
        apiReferenceId: `NSDL_LIVE_${Date.now()}`,
        nameMatchPercentage: 98,
        remarks: 'Direct API match confirmed with Income Tax Department records. PAN active and linked to Aadhaar.',
      };
    } else if (idType === 'AADHAAR') {
      kyc.aadhaarRecord = {
        ...kyc.aadhaarRecord,
        isVerified: true,
        status: 'VALID',
        verificationSource: 'UIDAI DigiLocker Paperless e-KYC (Real-Time Token)',
        verificationTimestamp: formattedTimestamp,
        apiReferenceId: `UIDAI_DL_${Date.now()}`,
        nameMatchPercentage: 100,
        remarks: 'e-KYC token authenticated. Biometric and demographic match confirmed.',
      };
    }

    kyc.updatedDate = now.toISOString().split('T')[0];
    this.notify();
    return kyc;
  }

  // --- DOCUMENT OPERATIONS (BATCH 4) ---

  public getCustomerDocuments(customerId: string): DocumentItem[] {
    return this.documents.filter((d) => d.customerId === customerId);
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
    const targetId = (customerId || '').trim();
    let customer = this.customers.find(
      (c) => c.id === targetId || c.customerNumber === targetId || (targetId && c.id.toLowerCase() === targetId.toLowerCase())
    );

    if (!customer && targetId) {
      const app = this.applications.find(
        (a) => a.customerId === targetId || a.id === targetId || a.customerNumber === targetId
      );
      if (app) {
        customer = this.customers.find(
          (c) => c.id === app.customerId || c.customerNumber === app.customerNumber
        );
      }
    }

    if (!customer && this.customers.length > 0 && !targetId) {
      customer = this.customers[0];
    }

    if (!customer) {
      const fallbackNumber = targetId && targetId.startsWith('CUS-')
        ? targetId
        : `CUS-${Date.now().toString().slice(-6)}`;
      const newCust: CustomerRecord = {
        id: targetId || `cus_${Date.now()}`,
        customerNumber: fallbackNumber,
        name: docData.uploadedBy ? `${docData.uploadedBy}'s Customer` : 'Customer Borrower',
        firstName: 'Customer',
        lastName: 'Borrower',
        dateOfBirth: '1990-01-01',
        gender: 'MALE',
        customerType: 'INDIVIDUAL',
        mobile: '9876543210',
        currentAddress: { addressLine1: 'MG Road', city: 'Panaji', state: 'Goa', pinCode: '403001' },
        permanentAddress: { addressLine1: 'MG Road', city: 'Panaji', state: 'Goa', pinCode: '403001' },
        sameAsCurrentAddress: true,
        employmentType: 'SALARIED',
        monthlyIncome: 65000,
        branchId: 'br_panjim',
        branchName: 'Panaji Head Office Branch',
        nationality: 'Indian',
        preferredContact: 'MOBILE',
        assignedOfficer: 'Alex Morgan',
        status: 'ACTIVE',
        createdDate: new Date().toISOString().split('T')[0],
        updatedDate: new Date().toISOString().split('T')[0],
        activeLoanCount: 0,
        closedLoanCount: 0,
        totalOutstanding: 0,
        totalOverdue: 0,
        cibilScore: 750,
      };
      customer = newCust;
      this.customers = [newCust, ...this.customers];
      this.syncApi('/api/customers', 'POST', newCust);
    }

    const resolvedCustomer = customer!;
    const now = new Date();
    const formattedTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    // Existing documents of this type get version increment
    const existingSameType = this.documents.filter(
      (d) => (d.customerId === resolvedCustomer.id || d.customerNumber === resolvedCustomer.customerNumber) && d.documentType === docData.documentType
    );
    const newVersion = existingSameType.length + 1;

    const newDoc: DocumentItem = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      customerId: resolvedCustomer.id,
      customerNumber: resolvedCustomer.customerNumber,
      customerName: resolvedCustomer.name,
      loanApplicationId: docData.loanApplicationId,
      category: docData.category,
      documentType: docData.documentType,
      documentTitle: docData.documentTitle,
      documentNumberMasked: docData.documentNumberMasked,
      fileName: docData.fileName,
      fileFormat: docData.fileFormat,
      fileSizeKb: docData.fileSizeKb,
      uploadedAt: formattedTimestamp,
      uploadedBy: docData.uploadedBy,
      uploadedByRole: docData.uploadedByRole,
      version: newVersion,
      status: 'PENDING_VERIFICATION',
      issuedDate: docData.issuedDate,
      expiryDate: docData.expiryDate,
      isLifetimeValid: docData.isLifetimeValid,
      ocrExtractedData: {
        name: resolvedCustomer.name,
        documentNumber: docData.documentNumberMasked,
        confidenceScore: 96,
      },
      tamperScore: 2,
      downloadCount: 0,
    };

    this.documents = [newDoc, ...this.documents];

    // Log history
    const histEvent: CustomerHistoryItem = {
      id: `hist_${Date.now()}`,
      customerId: resolvedCustomer.id,
      timestamp: formattedTimestamp,
      eventType: 'DOCUMENT_UPLOADED',
      title: `Document Uploaded: ${newDoc.documentTitle}`,
      actor: docData.uploadedBy,
      actorRole: docData.uploadedByRole,
      entityReference: newDoc.fileName,
      description: `Uploaded ${newDoc.documentTitle} (v${newDoc.version}, ${newDoc.fileSizeKb} KB) for verification.`,
      module: 'KYC',
    };
    this.customerHistory = [histEvent, ...this.customerHistory];

    this.syncApi('/api/documents', 'POST', {
      id: newDoc.id,
      customerId: newDoc.customerId,
      customerNumber: newDoc.customerNumber,
      customerName: newDoc.customerName,
      title: newDoc.documentTitle,
      category: newDoc.category,
      documentType: newDoc.documentType,
      documentNumber: newDoc.documentNumberMasked,
      fileName: newDoc.fileName,
      fileFormat: newDoc.fileFormat,
      fileSizeKb: newDoc.fileSizeKb,
      status: newDoc.status,
      uploadedAt: new Date().toISOString(),
      uploadedBy: newDoc.uploadedBy,
      uploadedByRole: newDoc.uploadedByRole,
      ocrExtractedData: newDoc.ocrExtractedData,
    });

    this.notify();
    return newDoc;
  }

  public verifyDocument(
    documentId: string,
    payload: {
      verifiedBy: string;
      notes?: string;
    }
  ): DocumentItem {
    const doc = this.documents.find((d) => d.id === documentId);
    if (!doc) throw new Error('Document not found');

    const now = new Date();
    const formattedTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    doc.status = 'VERIFIED';
    doc.verifiedBy = payload.verifiedBy;
    doc.verifiedAt = formattedTimestamp;
    doc.rejectionReason = undefined;
    doc.rejectionNotes = undefined;

    const histEvent: CustomerHistoryItem = {
      id: `hist_${Date.now()}`,
      customerId: doc.customerId,
      timestamp: formattedTimestamp,
      eventType: 'DOCUMENT_VERIFIED',
      title: `Document Verified: ${doc.documentTitle}`,
      actor: payload.verifiedBy,
      actorRole: 'Document Verification Officer',
      entityReference: doc.fileName,
      description: `Document "${doc.documentTitle}" (v${doc.version}) verified and approved. Notes: ${payload.notes || 'Verified against primary credentials.'}`,
      module: 'KYC',
    };
    this.customerHistory = [histEvent, ...this.customerHistory];

    this.syncApi('/api/documents', 'PUT', {
      id: documentId,
      status: 'VERIFIED',
      verifiedBy: payload.verifiedBy,
      notes: payload.notes,
    });

    this.notify();
    return doc;
  }

  public rejectDocument(
    documentId: string,
    payload: {
      rejectedBy: string;
      reason: string;
      notes: string;
    }
  ): DocumentItem {
    const doc = this.documents.find((d) => d.id === documentId);
    if (!doc) throw new Error('Document not found');

    const now = new Date();
    const formattedTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    doc.status = 'REJECTED';
    doc.rejectionReason = payload.reason;
    doc.rejectionNotes = payload.notes;
    doc.verifiedBy = payload.rejectedBy;
    doc.verifiedAt = formattedTimestamp;

    const histEvent: CustomerHistoryItem = {
      id: `hist_${Date.now()}`,
      customerId: doc.customerId,
      timestamp: formattedTimestamp,
      eventType: 'DOCUMENT_VERIFIED',
      title: `Document Rejected: ${doc.documentTitle}`,
      actor: payload.rejectedBy,
      actorRole: 'Document Verification Officer',
      entityReference: doc.fileName,
      description: `Document "${doc.documentTitle}" rejected. Reason: ${payload.reason}. Notes: ${payload.notes}`,
      module: 'KYC',
    };
    this.customerHistory = [histEvent, ...this.customerHistory];

    this.syncApi('/api/documents', 'PUT', {
      id: documentId,
      status: 'REJECTED',
      rejectionReason: payload.reason,
      rejectionNote: payload.notes,
      verifiedBy: payload.rejectedBy,
    });

    this.notify();
    return doc;
  }

  public waiveDocument(documentId: string, reason: string, waivedBy: string): DocumentItem {
    const doc = this.documents.find((d) => d.id === documentId);
    if (!doc) throw new Error('Document not found');

    doc.status = 'WAIVED';
    doc.rejectionNotes = `Waived by ${waivedBy}. Reason: ${reason}`;
    doc.verifiedBy = waivedBy;
    doc.verifiedAt = new Date().toISOString().split('T')[0];

    this.syncApi('/api/documents', 'PUT', {
      id: documentId,
      status: 'WAIVED',
      rejectionNote: `Waived by ${waivedBy}. Reason: ${reason}`,
      verifiedBy: waivedBy,
    });

    this.notify();
    return doc;
  }

  public deleteDocument(documentId: string, reason: string, deletedBy: string) {
    const index = this.documents.findIndex((d) => d.id === documentId);
    if (index === -1) throw new Error('Document not found');

    const doc = this.documents[index];
    this.documents.splice(index, 1);

    this.logAudit({
      entityType: 'USER',
      entityId: doc.customerId,
      entityName: doc.customerName,
      action: 'DOCUMENT_DELETED',
      details: `Document "${doc.documentTitle}" deleted. Reason: ${reason}`,
      reason,
    });

    this.syncApi(`/api/documents?id=${documentId}`, 'DELETE');

    this.notify();
  }

  public renewDocument(
    documentId: string,
    newExpiryDate: string,
    renewedBy: string
  ): DocumentItem {
    const doc = this.documents.find((d) => d.id === documentId);
    if (!doc) throw new Error('Document not found');

    doc.expiryDate = newExpiryDate;
    doc.status = 'VERIFIED';
    doc.verifiedBy = renewedBy;
    doc.verifiedAt = new Date().toISOString().split('T')[0];

    this.syncApi('/api/documents', 'PUT', {
      id: documentId,
      status: 'VERIFIED',
      verifiedBy: renewedBy,
    });

    this.notify();
    return doc;
  }

  public sendDocumentExpiryReminder(documentId: string): boolean {
    const doc = this.documents.find((d) => d.id === documentId);
    if (!doc) return false;

    this.logAudit({
      entityType: 'USER',
      entityId: doc.customerId,
      entityName: doc.customerName,
      action: 'DOCUMENT_EXPIRY_REMINDER_SENT',
      details: `Automated SMS/Email expiry reminder dispatched to customer for document "${doc.documentTitle}".`,
    });

    return true;
  }

  // --- APPLICATION OPERATIONS (Batch 5) ---
  public logApplicationHistory(
    applicationId: string,
    entry: Omit<ApplicationHistoryItem, 'id' | 'applicationId' | 'timestamp'>
  ) {
    const now = new Date();
    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    const newHistory: ApplicationHistoryItem = {
      id: `apphist_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      applicationId,
      timestamp: formatted,
      ...entry,
    };

    if (!this.applicationHistory[applicationId]) {
      this.applicationHistory[applicationId] = [];
    }
    this.applicationHistory[applicationId] = [newHistory, ...this.applicationHistory[applicationId]];
  }

  public getApplicationById(id: string): LoanApplicationRecord | undefined {
    return this.applications.find((a) => a.id === id || a.applicationNumber === id);
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
    const customer = this.customers.find((c) => c.id === payload.customerId || c.customerNumber === payload.customerId);
    if (!customer) throw new Error('Customer not found');

    const product = this.loanProductsConfig.find((p) => p.code === payload.productCode);
    if (!product) throw new Error('Loan product not found');

    const branch = this.branches.find((b) => b.id === payload.branchId) || { name: customer.branchName };
    const appSeq = this.nextAppNumberSeq++;
    const appNumber = `APP-2026-${String(appSeq).padStart(6, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const appId = `app_${Date.now()}`;
    const creator = payload.createdBy || 'Anita Deshmukh';

    // Prepare documents from product requirements template
    const customerDocs = this.documents.filter((d) => d.customerId === customer.id);
    const initialDocs: ApplicationDocumentRecord[] = product.requiredDocumentTypes.map((req, idx) => {
      let source: 'CUSTOMER_KYC' | 'APPLICATION_UPLOAD' = 'APPLICATION_UPLOAD';
      let docVaultId: string | undefined = undefined;
      let fileName: string | undefined = undefined;
      let status: any = 'MISSING';
      let verifiedAt: string | undefined = undefined;
      let verifiedBy: string | undefined = undefined;

      if (req.canUseCustomerKyc) {
        const matched = customerDocs.find((cd) => {
          if (req.type === 'IDENTITY_PROOF' && (cd.category === 'IDENTITY_PROOF' || cd.documentType === 'PAN' || cd.documentType === 'AADHAAR')) {
            return cd.status === 'VERIFIED';
          }
          if (req.type === 'ADDRESS_PROOF' && cd.category === 'ADDRESS_PROOF') {
            return cd.status === 'VERIFIED';
          }
          return false;
        });

        if (matched) {
          source = 'CUSTOMER_KYC';
          docVaultId = matched.id;
          fileName = matched.fileName;
          status = 'VERIFIED';
          verifiedAt = matched.verifiedAt || today;
          verifiedBy = matched.verifiedBy || creator;
        }
      }

      return {
        id: `appdoc_${Date.now()}_${idx}`,
        applicationId: appId,
        documentType: req.type,
        documentTitle: req.title,
        source,
        documentVaultId: docVaultId,
        fileName,
        fileFormat: 'PDF',
        fileSizeKb: 450,
        status,
        isMandatory: req.isMandatory,
        uploadedAt: status === 'VERIFIED' ? today : undefined,
        uploadedBy: status === 'VERIFIED' ? creator : undefined,
        verifiedAt,
        verifiedBy,
      };
    });

    const newApp: LoanApplicationRecord = {
      id: appId,
      applicationNumber: appNumber,
      customerId: customer.id,
      customerNumber: customer.customerNumber,
      customerName: customer.name,
      customerMobile: customer.mobile,
      customerKycStatus: this.kycRecords.find((k) => k.customerId === customer.id)?.status || 'PENDING_REVIEW',
      customerMonthlyIncome: customer.monthlyIncome,
      customerEmploymentType: customer.employmentType,
      customerExistingLoansCount: customer.activeLoanCount,
      customerTotalExposure: customer.totalOutstanding,
      productCode: product.code,
      productName: product.name,
      requestedAmount: payload.requestedAmount,
      requestedTenureMonths: payload.requestedTenureMonths,
      interestRate: product.baseInterestRate,
      repaymentFrequency: payload.repaymentFrequency as LoanRepaymentFrequency,
      preferredRepaymentDate: payload.preferredRepaymentDate || 5,
      purpose: payload.purpose,
      purposeCategory: payload.purposeCategory || 'PERSONAL',
      branchId: payload.branchId,
      branchName: branch.name,
      loanOfficer: payload.loanOfficer,
      assignedOfficerId: 'usr_001',
      applicationDate: today,
      status: 'DRAFT',
      priority: 'MEDIUM',
      coApplicants: [],
      guarantors: [],
      documents: initialDocs,
      notes: payload.notes || '',
      createdDate: today,
      createdBy: creator,
      updatedDate: today,
      lastSavedAt: `${today} ${nowTime}`,
    };

    this.applications = [newApp, ...this.applications];

    this.logApplicationHistory(appId, {
      eventType: 'APPLICATION_CREATED',
      actor: creator,
      actorRole: 'Loan Officer',
      description: `Draft Application ${appNumber} created for customer ${customer.name} (${customer.customerNumber}).`,
      details: `Product: ${product.name} | Requested Amount: ₹${payload.requestedAmount.toLocaleString('en-IN')} | Tenure: ${payload.requestedTenureMonths} mos.`,
    });

    const custAppSummary: CustomerApplicationItem = {
      id: appId,
      applicationNumber: appNumber,
      customerId: customer.id,
      customerName: customer.name,
      productCode: product.code,
      productName: product.name,
      requestedAmount: payload.requestedAmount,
      tenureMonths: payload.requestedTenureMonths,
      interestRate: product.baseInterestRate,
      applicationDate: today,
      status: 'DRAFT',
      branchId: payload.branchId,
      branchName: branch.name,
      assignedOfficer: payload.loanOfficer,
      purpose: payload.purpose,
    };
    this.customerApplications = [custAppSummary, ...this.customerApplications];

    this.syncApi('/api/applications', 'POST', newApp);

    this.notify();
    return newApp;
  }

  public updateApplication(
    appId: string,
    updates: Partial<Omit<LoanApplicationRecord, 'id' | 'applicationNumber' | 'customerId' | 'customerNumber' | 'customerName'>>
  ): LoanApplicationRecord {
    const appIndex = this.applications.findIndex((a) => a.id === appId);
    if (appIndex === -1) throw new Error('Application not found');

    const app = this.applications[appIndex];
    if (app.status !== 'DRAFT') {
      throw new Error('Only Draft applications can be directly modified.');
    }

    const updatedApp = {
      ...app,
      ...updates,
      updatedDate: new Date().toISOString().split('T')[0],
      lastSavedAt: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    };

    this.applications[appIndex] = updatedApp;

    this.logApplicationHistory(appId, {
      eventType: 'APPLICATION_UPDATED',
      actor: 'Anita Deshmukh',
      actorRole: 'Loan Officer',
      description: 'Application terms and details saved.',
    });

    this.syncApi('/api/applications', 'PUT', { id: appId, ...updates });

    this.notify();
    return updatedApp;
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
    const app = this.applications.find((a) => a.id === appId);
    if (!app) throw new Error('Application not found');

    if (app.customerId === payload.customerId) {
      throw new Error('The primary applicant cannot be linked as a co-applicant.');
    }

    if (app.coApplicants.some((c) => c.customerId === payload.customerId)) {
      throw new Error('This customer is already linked as a co-applicant on this application.');
    }

    if (app.guarantors.some((g) => g.customerId === payload.customerId)) {
      throw new Error('This customer is already linked as a guarantor for this application.');
    }

    const cust = this.customers.find((c) => c.id === payload.customerId);
    if (!cust) throw new Error('Customer record not found');

    if (cust.status === 'ARCHIVED') {
      throw new Error('Archived customer cannot be added as a co-applicant.');
    }

    const kycRec = this.kycRecords.find((k) => k.customerId === cust.id);
    const today = new Date().toISOString().split('T')[0];
    const actor = payload.addedBy || 'Anita Deshmukh';

    const coApp: CoApplicantRecord = {
      id: `coapp_${Date.now()}`,
      applicationId: appId,
      customerId: cust.id,
      customerNumber: cust.customerNumber,
      customerName: cust.name,
      mobile: cust.mobile,
      relationship: payload.relationship,
      kycStatus: kycRec?.status || 'PENDING_REVIEW',
      monthlyIncome: cust.monthlyIncome,
      panMasked: cust.panMasked,
      existingLoansCount: cust.activeLoanCount,
      totalOutstanding: cust.totalOutstanding,
      notes: payload.notes,
      addedAt: `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      addedBy: actor,
    };

    app.coApplicants.push(coApp);
    app.updatedDate = today;

    this.logApplicationHistory(appId, {
      eventType: 'CO_APPLICANT_ADDED',
      actor,
      actorRole: 'Loan Officer',
      description: `Co-applicant ${cust.name} (${cust.customerNumber}) added with relationship: ${payload.relationship}.`,
    });

    this.notify();
    return coApp;
  }

  public removeCoApplicant(appId: string, coAppId: string, actor: string = 'Anita Deshmukh') {
    const app = this.applications.find((a) => a.id === appId);
    if (!app) throw new Error('Application not found');

    const coApp = app.coApplicants.find((c) => c.id === coAppId);
    if (!coApp) return;

    app.coApplicants = app.coApplicants.filter((c) => c.id !== coAppId);
    app.updatedDate = new Date().toISOString().split('T')[0];

    this.logApplicationHistory(appId, {
      eventType: 'CO_APPLICANT_REMOVED',
      actor,
      actorRole: 'Loan Officer',
      description: `Co-applicant ${coApp.customerName} removed from application.`,
    });

    this.notify();
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
    const app = this.applications.find((a) => a.id === appId);
    if (!app) throw new Error('Application not found');

    if (app.customerId === payload.customerId) {
      throw new Error('The primary applicant cannot be linked as a guarantor.');
    }

    if (app.guarantors.some((g) => g.customerId === payload.customerId)) {
      throw new Error('This customer is already linked as a guarantor on this application.');
    }

    if (app.coApplicants.some((c) => c.customerId === payload.customerId)) {
      throw new Error('This customer is already linked as a co-applicant on this application.');
    }

    const cust = this.customers.find((c) => c.id === payload.customerId);
    if (!cust) throw new Error('Customer record not found');

    if (cust.status === 'ARCHIVED') {
      throw new Error('Archived customer cannot be added as a guarantor.');
    }

    const kycRec = this.kycRecords.find((k) => k.customerId === cust.id);
    const today = new Date().toISOString().split('T')[0];
    const actor = payload.addedBy || 'Anita Deshmukh';

    const guarantor: GuarantorRecord = {
      id: `guar_${Date.now()}`,
      applicationId: appId,
      customerId: cust.id,
      customerNumber: cust.customerNumber,
      customerName: cust.name,
      mobile: cust.mobile,
      relationship: payload.relationship,
      guaranteeType: payload.guaranteeType,
      kycStatus: kycRec?.status || 'PENDING_REVIEW',
      netWorthEstimated: payload.netWorthEstimated,
      panMasked: cust.panMasked,
      notes: payload.notes,
      addedAt: `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      addedBy: actor,
    };

    app.guarantors.push(guarantor);
    app.updatedDate = today;

    this.logApplicationHistory(appId, {
      eventType: 'GUARANTOR_ADDED',
      actor,
      actorRole: 'Loan Officer',
      description: `Guarantor ${cust.name} (${cust.customerNumber}) added with ${payload.guaranteeType} guarantee.`,
    });

    this.notify();
    return guarantor;
  }

  public removeGuarantor(appId: string, guarantorId: string, actor: string = 'Anita Deshmukh') {
    const app = this.applications.find((a) => a.id === appId);
    if (!app) throw new Error('Application not found');

    const guar = app.guarantors.find((g) => g.id === guarantorId);
    if (!guar) return;

    app.guarantors = app.guarantors.filter((g) => g.id !== guarantorId);
    app.updatedDate = new Date().toISOString().split('T')[0];

    this.logApplicationHistory(appId, {
      eventType: 'GUARANTOR_REMOVED',
      actor,
      actorRole: 'Loan Officer',
      description: `Guarantor ${guar.customerName} removed from application.`,
    });

    this.notify();
  }

  public linkCustomerKycDocument(
    appId: string,
    documentType: string,
    vaultDocId: string,
    actor: string = 'Anita Deshmukh'
  ) {
    const app = this.applications.find((a) => a.id === appId);
    if (!app) throw new Error('Application not found');

    const vaultDoc = this.documents.find((d) => d.id === vaultDocId);
    if (!vaultDoc) throw new Error('Vault document not found');

    let appDoc = app.documents.find((d) => d.documentType === documentType);
    const today = new Date().toISOString().split('T')[0];

    if (appDoc) {
      appDoc.source = 'CUSTOMER_KYC';
      appDoc.documentVaultId = vaultDoc.id;
      appDoc.fileName = vaultDoc.fileName;
      appDoc.status = (vaultDoc.status === 'VERIFIED' ? 'VERIFIED' : 'UNDER_REVIEW') as any;
      appDoc.verifiedAt = vaultDoc.verifiedAt || today;
      appDoc.verifiedBy = vaultDoc.verifiedBy || actor;
    } else {
      appDoc = {
        id: `appdoc_${Date.now()}`,
        applicationId: appId,
        documentType,
        documentTitle: vaultDoc.documentTitle,
        source: 'CUSTOMER_KYC',
        documentVaultId: vaultDoc.id,
        fileName: vaultDoc.fileName,
        fileFormat: vaultDoc.fileFormat,
        fileSizeKb: vaultDoc.fileSizeKb,
        status: (vaultDoc.status === 'VERIFIED' ? 'VERIFIED' : 'UNDER_REVIEW') as any,
        isMandatory: true,
        uploadedAt: today,
        uploadedBy: actor,
        verifiedAt: vaultDoc.verifiedAt,
        verifiedBy: vaultDoc.verifiedBy,
      };
      app.documents.push(appDoc);
    }

    app.updatedDate = today;

    this.logApplicationHistory(appId, {
      eventType: 'DOCUMENT_LINKED',
      actor,
      actorRole: 'Loan Officer',
      description: `Linked customer KYC document "${vaultDoc.documentTitle}" to application.`,
    });

    this.notify();
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
    const app = this.applications.find((a) => a.id === appId);
    if (!app) throw new Error('Application not found');

    const today = new Date().toISOString().split('T')[0];
    const actor = payload.uploadedBy || 'Anita Deshmukh';

    let existing = app.documents.find((d) => d.documentType === payload.documentType);
    if (existing) {
      existing.source = 'APPLICATION_UPLOAD';
      existing.fileName = payload.fileName;
      existing.fileFormat = payload.fileFormat;
      existing.fileSizeKb = payload.fileSizeKb;
      existing.status = 'UNDER_REVIEW';
      existing.uploadedAt = today;
      existing.uploadedBy = actor;
      existing.notes = payload.notes;
      existing.rejectionReason = undefined;
    } else {
      existing = {
        id: `appdoc_${Date.now()}`,
        applicationId: appId,
        documentType: payload.documentType,
        documentTitle: payload.documentTitle,
        source: 'APPLICATION_UPLOAD',
        fileName: payload.fileName,
        fileFormat: payload.fileFormat,
        fileSizeKb: payload.fileSizeKb,
        status: 'UNDER_REVIEW',
        isMandatory: payload.isMandatory ?? true,
        uploadedAt: today,
        uploadedBy: actor,
        notes: payload.notes,
      };
      app.documents.push(existing);
    }

    app.updatedDate = today;

    this.logApplicationHistory(appId, {
      eventType: 'DOCUMENT_UPLOADED',
      actor,
      actorRole: 'Loan Officer',
      description: `Uploaded application document: "${payload.documentTitle}".`,
    });

    this.notify();
    return existing;
  }

  public verifyApplicationDocument(
    appId: string,
    docId: string,
    verifiedBy: string,
    notes?: string
  ) {
    const app = this.applications.find((a) => a.id === appId);
    if (!app) throw new Error('Application not found');

    const doc = app.documents.find((d) => d.id === docId);
    if (!doc) throw new Error('Application document not found');

    const today = new Date().toISOString().split('T')[0];
    doc.status = 'VERIFIED';
    doc.verifiedAt = today;
    doc.verifiedBy = verifiedBy;
    if (notes) doc.notes = notes;
    doc.rejectionReason = undefined;
    app.updatedDate = today;

    this.logApplicationHistory(appId, {
      eventType: 'DOCUMENT_VERIFIED',
      actor: verifiedBy,
      actorRole: 'Operations Officer',
      description: `Document "${doc.documentTitle}" marked as VERIFIED.`,
      details: notes,
    });

    this.notify();
  }

  public rejectApplicationDocument(
    appId: string,
    docId: string,
    rejectedBy: string,
    reason: string,
    notes?: string
  ) {
    const app = this.applications.find((a) => a.id === appId);
    if (!app) throw new Error('Application not found');

    const doc = app.documents.find((d) => d.id === docId);
    if (!doc) throw new Error('Application document not found');

    const today = new Date().toISOString().split('T')[0];
    doc.status = 'REJECTED';
    doc.rejectionReason = reason;
    if (notes) doc.notes = notes;
    app.updatedDate = today;

    this.logApplicationHistory(appId, {
      eventType: 'DOCUMENT_REJECTED',
      actor: rejectedBy,
      actorRole: 'Operations Officer',
      description: `Document "${doc.documentTitle}" REJECTED: ${reason}`,
      details: notes,
    });

    this.notify();
  }

  public removeApplicationDocument(appId: string, docId: string, actor: string = 'Anita Deshmukh') {
    const app = this.applications.find((a) => a.id === appId);
    if (!app) throw new Error('Application not found');

    const doc = app.documents.find((d) => d.id === docId);
    if (!doc) return;

    if (doc.isMandatory && doc.source === 'CUSTOMER_KYC') {
      doc.status = 'MISSING';
      doc.documentVaultId = undefined;
      doc.fileName = undefined;
    } else {
      app.documents = app.documents.filter((d) => d.id !== docId);
    }

    app.updatedDate = new Date().toISOString().split('T')[0];

    this.logApplicationHistory(appId, {
      eventType: 'DOCUMENT_REMOVED',
      actor,
      actorRole: 'Loan Officer',
      description: `Document "${doc.documentTitle}" removed from application.`,
    });

    this.notify();
  }

  public validateApplicationForSubmission(appId: string): ApplicationValidationResult {
    const app = this.applications.find((a) => a.id === appId);
    if (!app) {
      return { isValid: false, blockers: ['Application record not found.'], warnings: [], passedChecks: [] };
    }

    const blockers: string[] = [];
    const warnings: string[] = [];
    const passedChecks: string[] = [];

    // 1. Customer Verification
    const customer = this.customers.find((c) => c.id === app.customerId);
    if (!customer) {
      blockers.push('Primary customer profile is missing.');
    } else if (customer.status !== 'ACTIVE') {
      blockers.push(`Customer account status is ${customer.status}. Must be ACTIVE to originate loan.`);
    } else {
      passedChecks.push(`Primary applicant ${customer.name} is active.`);
    }

    // 2. KYC Verification
    const kyc = this.kycRecords.find((k) => k.customerId === app.customerId);
    if (!kyc || kyc.status !== 'VERIFIED') {
      blockers.push(`Primary applicant KYC is ${kyc?.status || 'NOT_VERIFIED'}. Verified KYC is required for loan submission.`);
    } else {
      passedChecks.push('Primary applicant KYC is verified.');
    }

    // 3. Product Rules & Financials
    const product = this.loanProductsConfig.find((p) => p.code === app.productCode);
    if (!product) {
      blockers.push('Loan product configuration is invalid or missing.');
    } else {
      if (app.requestedAmount < product.minAmount || app.requestedAmount > product.maxAmount) {
        blockers.push(`Requested amount ₹${app.requestedAmount.toLocaleString('en-IN')} is outside product bounds (₹${product.minAmount.toLocaleString('en-IN')} - ₹${product.maxAmount.toLocaleString('en-IN')}).`);
      } else {
        passedChecks.push(`Requested amount ₹${app.requestedAmount.toLocaleString('en-IN')} is within product limits.`);
      }

      if (app.requestedTenureMonths < product.minTenureMonths || app.requestedTenureMonths > product.maxTenureMonths) {
        blockers.push(`Requested tenure ${app.requestedTenureMonths} months is outside allowable range (${product.minTenureMonths} - ${product.maxTenureMonths} mos).`);
      } else {
        passedChecks.push(`Requested tenure ${app.requestedTenureMonths} months is valid.`);
      }
    }

    // 4. Purpose
    if (!app.purpose || app.purpose.trim().length < 10) {
      blockers.push('Loan purpose explanation is required (minimum 10 characters).');
    } else {
      passedChecks.push('Loan purpose is detailed.');
    }

    // 5. Co-applicant checks
    app.coApplicants.forEach((coApp) => {
      if (coApp.kycStatus !== 'VERIFIED') {
        warnings.push(`Co-applicant ${coApp.customerName} KYC is ${coApp.kycStatus}. Verification recommended before committee review.`);
      } else {
        passedChecks.push(`Co-applicant ${coApp.customerName} KYC verified.`);
      }
    });

    // 6. Guarantor checks
    app.guarantors.forEach((guar) => {
      if (guar.kycStatus !== 'VERIFIED') {
        warnings.push(`Guarantor ${guar.customerName} KYC is ${guar.kycStatus}.`);
      } else {
        passedChecks.push(`Guarantor ${guar.customerName} KYC verified.`);
      }
    });

    // 7. Mandatory Documents Checklist
    const mandatoryDocs = app.documents.filter((d) => d.isMandatory);
    mandatoryDocs.forEach((doc) => {
      if (doc.status === 'MISSING') {
        blockers.push(`Mandatory document "${doc.documentTitle}" is missing.`);
      } else if (doc.status === 'REJECTED') {
        blockers.push(`Mandatory document "${doc.documentTitle}" was rejected (${doc.rejectionReason || 're-upload required'}).`);
      } else if (doc.status === 'UNDER_REVIEW' || doc.status === 'UPLOADED') {
        warnings.push(`Mandatory document "${doc.documentTitle}" is under review.`);
      } else if (doc.status === 'VERIFIED') {
        passedChecks.push(`Mandatory document "${doc.documentTitle}" verified.`);
      }
    });

    return {
      isValid: blockers.length === 0,
      blockers,
      warnings,
      passedChecks,
    };
  }

  public submitApplication(
    appId: string,
    declarations: SubmissionDeclarationState,
    submittedBy: string = 'Anita Deshmukh'
  ): LoanApplicationRecord {
    const app = this.applications.find((a) => a.id === appId);
    if (!app) throw new Error('Application not found');

    const validation = this.validateApplicationForSubmission(appId);
    if (!validation.isValid) {
      throw new Error(`Application cannot be submitted: ${validation.blockers.join(' ')}`);
    }

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    app.status = 'SUBMITTED';
    app.submissionDeclarations = {
      ...declarations,
      declaredBy: submittedBy,
      declaredAt: `${today} ${nowTime}`,
    };
    app.submittedAt = `${today} ${nowTime}`;
    app.submittedBy = submittedBy;
    app.updatedDate = today;

    const custApp = this.customerApplications.find((ca) => ca.id === appId || ca.applicationNumber === app.applicationNumber);
    if (custApp) {
      custApp.status = 'SUBMITTED';
    }

    this.logApplicationHistory(appId, {
      eventType: 'APPLICATION_SUBMITTED',
      actor: submittedBy,
      actorRole: 'Loan Officer',
      description: `Application ${app.applicationNumber} formally submitted for operations and credit review.`,
      details: 'All pre-submission validation gates passed. Declarations signed.',
    });

    this.logAudit({
      entityType: 'USER',
      entityId: app.customerId,
      entityName: app.customerName,
      action: 'LOAN_APPLICATION_SUBMITTED',
      details: `Application ${app.applicationNumber} for ₹${app.requestedAmount.toLocaleString('en-IN')} (${app.productName}) submitted by ${submittedBy}.`,
    });

    // Auto-create pending credit assessment if not present
    let existingAssessment = this.creditAssessments.find((ca) => ca.applicationId === appId);
    if (!existingAssessment) {
      const assessmentSeq = this.nextAssessmentSeq++;
      const caNumber = `CA-2026-000${assessmentSeq}`;
      const customer = this.customers.find((c) => c.id === app.customerId);
      const proposedEmi = this.calculateEMI(app.requestedAmount, app.interestRate || 12.0, app.requestedTenureMonths);
      const netInc = app.customerMonthlyIncome || ((customer as any)?.financialProfile?.monthlyIncome) || 50000;
      const foir = Number(((proposedEmi / netInc) * 100).toFixed(2));

      const newAssessment: CreditAssessmentRecord = {
        id: `ca_${Date.now()}`,
        assessmentNumber: caNumber,
        applicationId: app.id,
        applicationNumber: app.applicationNumber,
        customerId: app.customerId,
        customerNumber: app.customerNumber,
        customerName: app.customerName,
        customerMobile: app.customerMobile,
        customerKycStatus: app.customerKycStatus,
        branchId: app.branchId,
        branchName: app.branchName,
        productCode: app.productCode,
        productName: app.productName,
        applicationDate: app.applicationDate,
        requestedAmount: app.requestedAmount,
        requestedTenureMonths: app.requestedTenureMonths,
        requestedInterestRate: app.interestRate,
        requestedFrequency: app.repaymentFrequency,
        purpose: app.purpose,
        status: 'PENDING',
        ageDays: 0,
        priority: app.priority,
        incomeSourceType: (app.customerEmploymentType as any) || 'SALARIED',
        employerOrBusinessName: (customer as any)?.employment?.employerName || (customer as any)?.employment?.businessName || 'Declared Employment',
        employmentVintageYears: (customer as any)?.employment?.workExperienceYears || 3,
        employmentVintageMonths: 0,
        employmentStability: 'STABLE',
        monthlyGrossIncome: Math.round(netInc * 1.15),
        monthlyNetIncome: netInc,
        otherMonthlyIncome: 0,
        totalConsideredIncome: netInc,
        obligations: [],
        totalExistingOutstanding: app.customerTotalExposure || 0,
        totalExistingMonthlyEmi: 0,
        existingObligationRatio: 0,
        proposedEmi,
        postApplicationObligationRatio: foir,
        bankingIndicators: {
          primaryBank: 'Operating Bank Account',
          accountType: 'SAVINGS_SALARY',
          averageMonthlyBalance: Math.round(netInc * 0.75),
          salaryCreditsStatus: 'REGULAR',
          salaryCreditAverage: netInc,
          recentBounceCount: 0,
          overdraftUsage: 'NONE',
          monthlyCreditTransactionCount: 15,
          monthlyDebitTransactionCount: 35,
          recentTransactionTrend: 'STABLE',
          inwardChequeReturnCount: 0,
          outwardChequeReturnCount: 0,
          cashDepositPercentage: 2.0,
        },
        creditHistory: {
          bureauScore: ((customer as any)?.creditScore?.score) || 735,
          bureauName: 'TransUnion CIBIL (Mock Credit Bureau Data)',
          scoreDate: today,
          scoreBand: 'GOOD',
          activeAccountsCount: app.customerExistingLoansCount || 0,
          closedAccountsCount: 2,
          delinquenciesCount: 0,
          recentDpdDays: 0,
          writeOffsCount: 0,
          suitFiled: false,
          enquiriesLast6Months: 1,
          accounts: [],
          negativeIndicators: [],
        },
        riskIndicators: [],
        rules: [],
        conditions: [],
        recommendation: 'RECOMMEND_APPROVE',
        recommendedAmount: app.requestedAmount,
        recommendedTenureMonths: app.requestedTenureMonths,
        recommendedInterestRate: app.interestRate,
        recommendationNotes: '',
        underwriterNotes: '',
        currentVersion: 1,
        versions: [],
        history: [
          {
            id: `cahist_${Date.now()}`,
            assessmentId: `ca_${Date.now()}`,
            timestamp: `${today} ${nowTime}`,
            eventType: 'ASSESSMENT_CREATED',
            eventTitle: 'Credit Assessment Auto-Initiated upon Submission',
            actor: submittedBy,
            actorRole: 'Origination Engine',
            newState: 'PENDING',
            notes: `Auto-originated from submitted application ${app.applicationNumber}.`,
          },
        ],
        createdDate: today,
        updatedDate: today,
      };

      this.creditAssessments.unshift(newAssessment);
    }

    this.syncApi('/api/applications', 'PUT', {
      id: app.id,
      status: 'SUBMITTED',
      submittedAt: app.submittedAt,
      submittedBy: app.submittedBy,
      submissionDeclarations: app.submissionDeclarations,
    });

    this.notify();
    return app;
  }

  public cancelApplication(
    appId: string,
    reason: string,
    cancelledBy: string = 'Anita Deshmukh'
  ): LoanApplicationRecord {
    const app = this.applications.find((a) => a.id === appId);
    if (!app) throw new Error('Application not found');

    if (app.status === 'APPROVED' || app.status === 'SANCTIONED') {
      throw new Error('Approved/Sanctioned applications cannot be cancelled via standard workflow.');
    }

    const today = new Date().toISOString().split('T')[0];
    app.status = 'CANCELLED';
    app.cancellationReason = reason;
    app.updatedDate = today;

    const custApp = this.customerApplications.find((ca) => ca.id === appId || ca.applicationNumber === app.applicationNumber);
    if (custApp) {
      custApp.status = 'CANCELLED';
    }

    this.logApplicationHistory(appId, {
      eventType: 'APPLICATION_CANCELLED',
      actor: cancelledBy,
      actorRole: 'Loan Officer',
      description: `Application cancelled. Reason: ${reason}`,
    });

    this.syncApi('/api/applications', 'PUT', {
      id: appId,
      status: 'CANCELLED',
      cancellationReason: reason,
    });

    this.notify();
    return app;
  }

  public updateApplicationStatus(
    appId: string,
    newStatus: ApplicationWorkflowStatus,
    reason?: string,
    actor: string = 'Alex Morgan'
  ): LoanApplicationRecord {
    const app = this.applications.find((a) => a.id === appId);
    if (!app) throw new Error('Application not found');

    const prevStatus = app.status;
    app.status = newStatus;
    app.updatedDate = new Date().toISOString().split('T')[0];

    const custApp = this.customerApplications.find((ca) => ca.id === appId || ca.applicationNumber === app.applicationNumber);
    if (custApp) {
      custApp.status = newStatus;
    }

    this.logApplicationHistory(appId, {
      eventType: 'STATUS_CHANGED',
      actor,
      actorRole: 'Operations Officer',
      description: `Application status transitioned from ${prevStatus} to ${newStatus}.`,
      details: reason,
    });

    this.notify();
    return app;
  }

  // ==========================================
  // BATCH 6: CREDIT ASSESSMENT & DECISION
  // ==========================================

  public calculateEMI(principal: number, annualRatePct: number, tenureMonths: number): number {
    if (tenureMonths <= 0 || principal <= 0) return 0;
    const r = annualRatePct / 100 / 12;
    if (r === 0) return Math.round(principal / tenureMonths);
    const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
    return Math.round(emi);
  }

  public recalculateCreditAssessment(assessment: CreditAssessmentRecord): CreditAssessmentRecord {
    // Total income
    const net = Number(assessment.monthlyNetIncome) || 0;
    const other = Number(assessment.otherMonthlyIncome) || 0;
    const totalInc = (net + other) > 0 ? (net + other) : 1;
    assessment.totalConsideredIncome = totalInc;

    // Total existing obligations
    const activeObligations = (assessment.obligations || []).filter((o) => !o.isExcludedFromFoir);
    const totalOut = activeObligations.reduce((acc, o) => acc + (Number(o.outstandingAmount) || 0), 0);
    const totalEmi = activeObligations.reduce((acc, o) => acc + (Number(o.monthlyEmi) || 0), 0);
    assessment.totalExistingOutstanding = totalOut;
    assessment.totalExistingMonthlyEmi = totalEmi;
    assessment.existingObligationRatio = Number(((totalEmi / totalInc) * 100).toFixed(2));

    // Proposed EMI for requested or recommended
    const calcPrincipal = (assessment.recommendedAmount && assessment.recommendedAmount > 0) ? assessment.recommendedAmount : (assessment.requestedAmount || 0);
    const calcTenure = (assessment.recommendedTenureMonths && assessment.recommendedTenureMonths > 0) ? assessment.recommendedTenureMonths : (assessment.requestedTenureMonths || 12);
    const calcRate = (assessment.recommendedInterestRate && assessment.recommendedInterestRate > 0) ? assessment.recommendedInterestRate : (assessment.requestedInterestRate || 10);

    assessment.proposedEmi = this.calculateEMI(calcPrincipal, calcRate, calcTenure);
    assessment.postApplicationObligationRatio = Number((((totalEmi + assessment.proposedEmi) / totalInc) * 100).toFixed(2));

    return assessment;
  }

  public getCreditAssessmentById(id: string): CreditAssessmentRecord | undefined {
    return this.creditAssessments.find((ca) => ca.id === id || ca.assessmentNumber === id);
  }

  public getCreditAssessmentByAppId(applicationId: string): CreditAssessmentRecord | undefined {
    return this.creditAssessments.find((ca) => ca.applicationId === applicationId || ca.applicationNumber === applicationId);
  }

  public logCreditTimeline(
    assessmentId: string,
    event: Omit<AssessmentTimelineEvent, 'id' | 'assessmentId' | 'timestamp'>
  ) {
    const assessment = this.creditAssessments.find((ca) => ca.id === assessmentId);
    if (!assessment) return;

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newEvent: AssessmentTimelineEvent = {
      id: `cahist_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      assessmentId,
      timestamp: `${today} ${nowTime}`,
      ...event,
    };

    if (!assessment.history) {
      assessment.history = [];
    }
    assessment.history.push(newEvent);
  }

  public assignCreditAssessment(
    assessmentId: string,
    officerId: string,
    officerName: string,
    notes: string = '',
    actor: string = 'Alex Morgan'
  ): CreditAssessmentRecord {
    const ca = this.creditAssessments.find((item) => item.id === assessmentId);
    if (!ca) throw new Error('Credit assessment not found');

    const prevStatus = ca.status;
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    ca.assignedToId = officerId;
    ca.assignedToName = officerName;
    ca.assignedAt = `${today} ${nowTime}`;
    ca.assignedBy = actor;
    ca.assignmentNotes = notes;
    if (ca.status === 'PENDING') {
      ca.status = 'ASSIGNED';
    }
    ca.updatedDate = today;

    this.logCreditTimeline(assessmentId, {
      eventType: 'ASSESSMENT_ASSIGNED',
      eventTitle: 'Assessment Assigned to Credit Officer',
      actor,
      actorRole: 'Operations Manager',
      previousState: prevStatus,
      newState: ca.status,
      notes: `Assigned to ${officerName}. Notes: ${notes || 'Standard allocation'}`,
    });

    this.logAudit({
      entityType: 'USER',
      entityId: ca.customerId,
      entityName: ca.customerName,
      action: 'CREDIT_ASSESSMENT_ASSIGNED',
      details: `Credit assessment ${ca.assessmentNumber} assigned to ${officerName} by ${actor}.`,
    });

    this.notify();
    return ca;
  }

  public startCreditAssessment(
    assessmentId: string,
    actor: string = 'Sunita Patel'
  ): CreditAssessmentRecord {
    const ca = this.creditAssessments.find((item) => item.id === assessmentId);
    if (!ca) throw new Error('Credit assessment not found');

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const prevStatus = ca.status;
    ca.status = 'IN_PROGRESS';
    ca.startedAt = `${today} ${nowTime}`;
    ca.startedBy = actor;
    ca.updatedDate = today;

    this.logCreditTimeline(assessmentId, {
      eventType: 'ASSESSMENT_STARTED',
      eventTitle: 'Credit Assessment Workspace Opened',
      actor,
      actorRole: 'Credit Officer',
      previousState: prevStatus,
      newState: 'IN_PROGRESS',
      notes: 'Underwriter initiated detailed financial and risk appraisal.',
    });

    this.notify();
    return ca;
  }

  public updateCreditAssessment(
    assessmentId: string,
    updates: Partial<CreditAssessmentRecord>,
    actor: string = 'Sunita Patel'
  ): CreditAssessmentRecord {
    const ca = this.creditAssessments.find((item) => item.id === assessmentId);
    if (!ca) throw new Error('Credit assessment not found');

    Object.assign(ca, updates);
    this.recalculateCreditAssessment(ca);
    ca.updatedDate = new Date().toISOString().split('T')[0];

    this.notify();
    return ca;
  }

  public addCreditObligation(
    assessmentId: string,
    obligationData: Omit<ObligationItem, 'id' | 'assessmentId'>,
    actor: string = 'Sunita Patel'
  ): ObligationItem {
    const ca = this.creditAssessments.find((item) => item.id === assessmentId);
    if (!ca) throw new Error('Credit assessment not found');

    const newObligation: ObligationItem = {
      id: `ob_${Date.now()}`,
      assessmentId,
      ...obligationData,
    };

    if (!ca.obligations) ca.obligations = [];
    ca.obligations.push(newObligation);
    this.recalculateCreditAssessment(ca);

    this.logCreditTimeline(assessmentId, {
      eventType: 'OBLIGATION_ADDED',
      eventTitle: 'Existing Obligation Added',
      actor,
      actorRole: 'Credit Officer',
      notes: `Added ${obligationData.loanType} from ${obligationData.lenderName} with EMI ₹${obligationData.monthlyEmi.toLocaleString('en-IN')}.`,
    });

    this.notify();
    return newObligation;
  }

  public deleteCreditObligation(
    assessmentId: string,
    obligationId: string,
    actor: string = 'Sunita Patel'
  ): boolean {
    const ca = this.creditAssessments.find((item) => item.id === assessmentId);
    if (!ca) throw new Error('Credit assessment not found');

    const existingIndex = (ca.obligations || []).findIndex((o) => o.id === obligationId);
    if (existingIndex === -1) return false;

    const removed = ca.obligations.splice(existingIndex, 1)[0];
    this.recalculateCreditAssessment(ca);

    this.logCreditTimeline(assessmentId, {
      eventType: 'OBLIGATION_REMOVED',
      eventTitle: 'Existing Obligation Removed',
      actor,
      actorRole: 'Credit Officer',
      notes: `Removed obligation from ${removed.lenderName} (EMI: ₹${removed.monthlyEmi.toLocaleString('en-IN')}).`,
    });

    this.notify();
    return true;
  }

  public evaluateCreditRules(
    assessmentId: string,
    actor: string = 'Sunita Patel'
  ): AssessmentRuleItem[] {
    const ca = this.creditAssessments.find((item) => item.id === assessmentId);
    if (!ca) throw new Error('Credit assessment not found');

    this.recalculateCreditAssessment(ca);

    const foir = ca.postApplicationObligationRatio || 0;
    const bureauScore = ca.creditHistory?.bureauScore || 0;
    const netIncome = ca.monthlyNetIncome || 0;
    const dpd = ca.creditHistory?.recentDpdDays || 0;
    const kycVerified = ca.customerKycStatus === 'VERIFIED';

    const evaluatedRules: AssessmentRuleItem[] = [
      {
        id: `rule_kyc_${assessmentId}`,
        ruleCode: 'RULE-KYC-01',
        name: 'KYC Clearance & Verification',
        category: 'DOCUMENTATION',
        currentValueDisplay: kycVerified ? 'VERIFIED' : ca.customerKycStatus || 'PENDING',
        thresholdDisplay: 'Mandatory Complete (VERIFIED)',
        result: kycVerified ? 'PASS' : 'FAIL',
        source: 'Customer KYC Repository',
        description: 'Borrower KYC status must be verified with active non-expired government identity.',
        isBlockingApproval: true,
      },
      {
        id: `rule_inc_${assessmentId}`,
        name: 'Minimum Net Income Threshold',
        ruleCode: 'RULE-INC-03',
        category: 'ELIGIBILITY',
        currentValueDisplay: `₹${netIncome.toLocaleString('en-IN')} / mo`,
        thresholdDisplay: '≥ ₹35,000 / mo (Salaried) / ₹50,000 (Business)',
        result: netIncome >= 35000 ? 'PASS' : (netIncome >= 25000 ? 'WARNING' : 'FAIL'),
        source: 'Income Assessment',
        description: 'Net monthly earnings must satisfy institutional product eligibility floor.',
        isBlockingApproval: true,
      },
      {
        id: `rule_foir_${assessmentId}`,
        name: 'Post-Application Obligation Ratio (FOIR)',
        ruleCode: 'RULE-DTI-04',
        category: 'AFFORDABILITY',
        currentValueDisplay: `${foir.toFixed(2)}%`,
        thresholdDisplay: '≤ 50.00% (Strict Policy Ceiling)',
        result: foir <= 50 ? 'PASS' : (foir <= 60 ? 'WARNING' : 'FAIL'),
        source: 'Debt Service Calculations',
        description: 'Total monthly EMI debt burden inclusive of proposed loan must not exceed 50% of income.',
        isBlockingApproval: true,
      },
      {
        id: `rule_cibil_${assessmentId}`,
        name: 'Minimum Credit Bureau Score',
        ruleCode: 'RULE-CIBIL-05',
        category: 'CREDIT_POLICY',
        currentValueDisplay: `${bureauScore} Score`,
        thresholdDisplay: '≥ 700 Score (Cutoff: 650)',
        result: bureauScore >= 700 ? 'PASS' : (bureauScore >= 650 ? 'WARNING' : 'FAIL'),
        source: 'TransUnion CIBIL (Mock Credit Bureau Data)',
        description: 'Borrower score must satisfy prime or standard risk band criteria.',
        isBlockingApproval: true,
      },
      {
        id: `rule_dpd_${assessmentId}`,
        name: 'Recent Delinquency & DPD Severity',
        ruleCode: 'RULE-DPD-06',
        category: 'CREDIT_POLICY',
        currentValueDisplay: `${dpd} Days (Max)`,
        thresholdDisplay: '0 Days (30+ Days Prohibited)',
        result: dpd === 0 ? 'PASS' : (dpd < 30 ? 'WARNING' : 'FAIL'),
        source: 'Credit History Records',
        description: 'Active overdues or 30+ days delinquent accounts in past 12 months require scrutiny.',
        isBlockingApproval: dpd >= 30,
      },
    ];

    ca.rules = evaluatedRules;
    const passedCount = evaluatedRules.filter((r) => r.result === 'PASS').length;
    const warnCount = evaluatedRules.filter((r) => r.result === 'WARNING').length;
    const failCount = evaluatedRules.filter((r) => r.result === 'FAIL').length;

    this.logCreditTimeline(assessmentId, {
      eventType: 'RULES_EVALUATED',
      eventTitle: 'Credit Policy Rules Re-evaluated',
      actor,
      actorRole: 'Credit Officer',
      notes: `Automated rule engine evaluation: ${passedCount} Passed, ${warnCount} Warnings, ${failCount} Failed.`,
    });

    this.notify();
    return evaluatedRules;
  }

  public addCreditCondition(
    assessmentId: string,
    conditionData: Omit<AssessmentConditionItem, 'id' | 'assessmentId' | 'addedBy' | 'addedAt' | 'status'>,
    actor: string = 'Sunita Patel'
  ): AssessmentConditionItem {
    const ca = this.creditAssessments.find((item) => item.id === assessmentId);
    if (!ca) throw new Error('Credit assessment not found');

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newCondition: AssessmentConditionItem = {
      id: `cond_${Date.now()}`,
      assessmentId,
      ...conditionData,
      status: 'OPEN',
      addedBy: actor,
      addedAt: `${today} ${nowTime}`,
    };

    if (!ca.conditions) ca.conditions = [];
    ca.conditions.push(newCondition);

    this.logCreditTimeline(assessmentId, {
      eventType: 'CONDITION_ADDED',
      eventTitle: 'Underwriting Condition Attached',
      actor,
      actorRole: 'Credit Officer',
      notes: `Condition [${conditionData.requiredBefore}]: ${conditionData.description}`,
    });

    this.notify();
    return newCondition;
  }

  public updateCreditConditionStatus(
    assessmentId: string,
    conditionId: string,
    status: ConditionStatus,
    resolutionNotes: string = '',
    actor: string = 'Sunita Patel'
  ): boolean {
    const ca = this.creditAssessments.find((item) => item.id === assessmentId);
    if (!ca) throw new Error('Credit assessment not found');

    const cond = (ca.conditions || []).find((c) => c.id === conditionId);
    if (!cond) return false;

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    cond.status = status;
    if (status === 'COMPLETED' || status === 'WAIVED') {
      cond.resolvedBy = actor;
      cond.resolvedAt = `${today} ${nowTime}`;
      cond.resolutionNotes = resolutionNotes;
    }

    this.logCreditTimeline(assessmentId, {
      eventType: 'CONDITION_UPDATED',
      eventTitle: `Condition Status Changed to ${status}`,
      actor,
      actorRole: 'Credit Officer',
      notes: `Condition "${cond.description}" marked ${status}. Notes: ${resolutionNotes || 'None'}`,
    });

    this.notify();
    return true;
  }

  public deleteCreditCondition(
    assessmentId: string,
    conditionId: string,
    actor: string = 'Sunita Patel'
  ): boolean {
    const ca = this.creditAssessments.find((item) => item.id === assessmentId);
    if (!ca) throw new Error('Credit assessment not found');

    const idx = (ca.conditions || []).findIndex((c) => c.id === conditionId);
    if (idx === -1) return false;

    const removed = ca.conditions.splice(idx, 1)[0];

    this.logCreditTimeline(assessmentId, {
      eventType: 'CONDITION_REMOVED',
      eventTitle: 'Condition Removed',
      actor,
      actorRole: 'Credit Officer',
      notes: `Condition removed: ${removed.description}`,
    });

    this.notify();
    return true;
  }

  public returnCreditAssessment(
    assessmentId: string,
    returnReason: string,
    returnRequiredAction: string,
    actor: string = 'Sunita Patel'
  ): CreditAssessmentRecord {
    const ca = this.creditAssessments.find((item) => item.id === assessmentId);
    if (!ca) throw new Error('Credit assessment not found');

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const prevStatus = ca.status;
    ca.status = 'RETURNED';
    ca.returnedAt = `${today} ${nowTime}`;
    ca.returnedBy = actor;
    ca.returnReason = returnReason;
    ca.returnRequiredAction = returnRequiredAction;
    ca.recommendation = 'RETURN_FOR_MORE_INFO';
    ca.updatedDate = today;

    // Also update parent application status if present
    const app = this.applications.find((a) => a.id === ca.applicationId);
    if (app) {
      app.status = 'DOCUMENT_PENDING';
      app.notes = `Credit Assessment returned: ${returnReason}`;
      this.logApplicationHistory(app.id, {
        eventType: 'STATUS_CHANGED',
        actor,
        actorRole: 'Credit Officer',
        description: `Application returned from credit assessment to sourcing officer.`,
        details: `Reason: ${returnReason} | Action: ${returnRequiredAction}`,
      });
    }

    this.logCreditTimeline(assessmentId, {
      eventType: 'ASSESSMENT_RETURNED',
      eventTitle: 'Assessment Returned to Sourcing Branch',
      actor,
      actorRole: 'Credit Officer',
      previousState: prevStatus,
      newState: 'RETURNED',
      notes: `Return Reason: ${returnReason} | Required Action: ${returnRequiredAction}`,
    });

    this.logAudit({
      entityType: 'USER',
      entityId: ca.customerId,
      entityName: ca.customerName,
      action: 'CREDIT_ASSESSMENT_RETURNED',
      details: `Credit assessment ${ca.assessmentNumber} returned to sourcing branch by ${actor}. Reason: ${returnReason}`,
    });

    this.notify();
    return ca;
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
    const ca = this.creditAssessments.find((item) => item.id === assessmentId);
    if (!ca) throw new Error('Credit assessment not found');

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    ca.recommendation = data.recommendation;
    ca.recommendedAmount = data.recommendedAmount;
    ca.recommendedTenureMonths = data.recommendedTenureMonths;
    ca.recommendedInterestRate = data.recommendedInterestRate;
    ca.recommendationNotes = data.recommendationNotes;
    ca.underwriterNotes = data.underwriterNotes;
    ca.decisionChangeReason = data.changeReason;

    this.recalculateCreditAssessment(ca);

    // Create version snapshot
    if (!ca.versions) ca.versions = [];
    const nextVersionNum = (ca.currentVersion || 0) + 1;
    ca.currentVersion = nextVersionNum;

    const snapshot: AssessmentVersionSnapshot = {
      versionNumber: nextVersionNum,
      timestamp: `${today} ${nowTime}`,
      actor,
      actorRole: 'Credit Officer',
      recommendation: data.recommendation,
      recommendedAmount: data.recommendedAmount,
      recommendedTenureMonths: data.recommendedTenureMonths,
      recommendedInterestRate: data.recommendedInterestRate,
      consideredIncome: ca.totalConsideredIncome,
      existingObligationRatio: ca.existingObligationRatio,
      postApplicationObligationRatio: ca.postApplicationObligationRatio,
      decisionNotes: data.recommendationNotes,
      changeReason: data.changeReason,
    };
    ca.versions.push(snapshot);

    const prevStatus = ca.status;
    ca.status = 'SUBMITTED';
    ca.submittedAt = `${today} ${nowTime}`;
    ca.submittedBy = actor;
    ca.updatedDate = today;

    // Also update parent application
    const app = this.applications.find((a) => a.id === ca.applicationId);
    if (app) {
      app.status = 'UNDER_REVIEW';
      app.notes = `Credit Underwriter recommended: ${data.recommendation} (Amount: ₹${data.recommendedAmount.toLocaleString('en-IN')})`;
      this.logApplicationHistory(app.id, {
        eventType: 'STATUS_CHANGED',
        actor,
        actorRole: 'Credit Officer',
        description: `Credit assessment recommendation [${data.recommendation}] submitted for Sanction Committee approval.`,
        details: `Recommended Amount: ₹${data.recommendedAmount.toLocaleString('en-IN')} @ ${data.recommendedInterestRate}% for ${data.recommendedTenureMonths} mos.`,
      });
    }

    this.logCreditTimeline(assessmentId, {
      eventType: 'RECOMMENDATION_SUBMITTED',
      eventTitle: `Credit Decision Recommendation Submitted (v${nextVersionNum})`,
      actor,
      actorRole: 'Credit Officer',
      previousState: prevStatus,
      newState: 'SUBMITTED',
      notes: `Decision: ${data.recommendation} | Recommended: ₹${data.recommendedAmount.toLocaleString('en-IN')} @ ${data.recommendedInterestRate}% | Notes: ${data.recommendationNotes}`,
    });

    this.logAudit({
      entityType: 'USER',
      entityId: ca.customerId,
      entityName: ca.customerName,
      action: 'CREDIT_DECISION_SUBMITTED',
      details: `Credit assessment ${ca.assessmentNumber} decision [${data.recommendation}] for ₹${data.recommendedAmount.toLocaleString('en-IN')} submitted by ${actor}.`,
    });

    this.notify();
    return ca;
  }

  // ==========================================
  // BATCH 7: APPROVAL WORKFLOW & MATRIX METHODS
  // ==========================================

  public evaluateApprovalMatrix(productCode: string, amount: number, branchId?: string): ApprovalMatrixRule[] {
    const activeRules = this.approvalMatrixRules.filter((r) => {
      if (!r.isActive) return false;
      if (r.productCode !== productCode && r.productCode !== 'ALL') return false;
      if (branchId && r.branchId && r.branchId !== 'ALL' && r.branchId !== branchId) return false;
      return true;
    });

    // Find the rules for this amount tier
    // In multi-level matrix:
    // If amount is small (<= tier 1 max), returns tier 1 rule
    // If amount is higher (e.g. LAP or > tier 1 max), returns all tiers up to the tier covering this amount
    const applicableRules = activeRules.filter((r) => {
      return (r.minAmount <= amount && r.maxAmount >= amount) || (r.level === 1 && amount > r.maxAmount);
    });

    // If no exact match found, pick rules sorted by level
    const sorted = applicableRules.length > 0
      ? applicableRules.sort((a, b) => a.level - b.level)
      : activeRules.filter(r => r.level === 1).slice(0, 1);

    return sorted;
  }

  public getApprovals(): ApprovalRecord[] {
    return this.approvals;
  }

  public getApprovalById(id: string): ApprovalRecord | undefined {
    return this.approvals.find((a) => a.id === id || a.approvalNumber === id);
  }

  public getApprovalByAppId(applicationId: string): ApprovalRecord | undefined {
    return this.approvals.find((a) => a.applicationId === applicationId || a.applicationNumber === applicationId);
  }

  public getApprovalByCreditAssessmentId(caId: string): ApprovalRecord | undefined {
    return this.approvals.find((a) => a.creditAssessmentId === caId || a.creditAssessmentNumber === caId);
  }

  public createApprovalFromCreditAssessment(caId: string, actorName: string = 'System Engine'): ApprovalRecord {
    const existing = this.getApprovalByCreditAssessmentId(caId);
    if (existing) return existing;

    const ca = this.creditAssessments.find((item) => item.id === caId || item.assessmentNumber === caId);
    if (!ca) throw new Error('Credit assessment not found');

    const app = this.applications.find((a) => a.id === ca.applicationId);
    const amountToSanction = ca.recommendedAmount > 0 ? ca.recommendedAmount : (ca.requestedAmount || 500000);

    const matchedRules = this.evaluateApprovalMatrix(ca.productCode, amountToSanction, ca.branchId);

    const levels: ApprovalLevelExecution[] = matchedRules.map((rule) => ({
      level: rule.level,
      levelName: rule.levelName,
      requiredRoleId: rule.approverRoleId,
      requiredRoleName: rule.approverRoleName,
      authorityLimit: rule.authorityLimit,
      status: 'PENDING',
    }));

    if (levels.length === 0) {
      levels.push({
        level: 1,
        levelName: 'Level 1 — Branch Credit Review',
        requiredRoleId: 'role_approver',
        requiredRoleName: 'Branch Credit Manager',
        authorityLimit: 500000,
        status: 'PENDING',
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const approvalNum = `AP-2026-${String(this.nextApprovalSeq++).padStart(6, '0')}`;

    // Map credit assessment conditions to approval conditions
    const initialConditions: ApprovalCondition[] = (ca.conditions || []).map((c, idx) => ({
      id: `cond_appr_${Date.now()}_${idx}`,
      approvalId: `appr_${Date.now()}`,
      category: (c.conditionType as any) || 'DOCUMENTATION',
      description: c.description,
      requiredBefore: (c.requiredBefore as any) || 'SANCTION',
      dueDate: c.dueDate,
      owner: 'Credit Operations / Branch Manager',
      status: (c.status as any) || 'OPEN',
      addedBy: c.addedBy || ca.assignedToName || 'Credit Assessor',
      addedAt: `${today} ${nowTime}`,
      source: 'CREDIT_ASSESSMENT',
    }));

    const newApproval: ApprovalRecord = {
      id: `appr_${Date.now()}`,
      approvalNumber: approvalNum,
      applicationId: ca.applicationId,
      applicationNumber: ca.applicationNumber,
      creditAssessmentId: ca.id,
      creditAssessmentNumber: ca.assessmentNumber,
      customerId: ca.customerId,
      customerNumber: ca.customerNumber,
      customerName: ca.customerName,
      customerMobile: ca.customerMobile || '',
      branchId: ca.branchId,
      branchName: ca.branchName,
      productCode: ca.productCode,
      productName: ca.productName,
      requestedAmount: ca.requestedAmount,
      requestedTenureMonths: ca.requestedTenureMonths,
      requestedInterestRate: ca.requestedInterestRate,
      recommendedAmount: ca.recommendedAmount,
      recommendedTenureMonths: ca.recommendedTenureMonths,
      recommendedInterestRate: ca.recommendedInterestRate,
      creditScore: ca.creditHistory?.bureauScore || 750,
      riskRating: ca.riskIndicators?.some((r) => r.severity === 'HIGH' || r.severity === 'CRITICAL') ? 'HIGH' : 'LOW',
      creditAssessorName: ca.assignedToName || 'Sunita Patel',
      creditRecommendationNotes: ca.recommendationNotes || 'Credit Assessment verified and recommended for sanction.',
      status: 'PENDING',
      totalLevels: levels.length,
      currentLevelIndex: 0,
      levels,
      ageDays: 0,
      priority: ca.priority === 'HIGH' ? 'HIGH' : 'NORMAL',
      isSlaBreached: false,
      conditions: initialConditions,
      exceptions: [],
      versions: [],
      history: [
        {
          id: `hist_appr_${Date.now()}`,
          approvalId: `appr_${Date.now()}`,
          timestamp: `${today} ${nowTime}`,
          event: 'APPROVAL_CREATED',
          actor: actorName,
          actorRole: 'Workflow Automation',
          level: 1,
          previousState: 'CREDIT_SUBMITTED',
          newState: 'PENDING',
          notes: `Approval workflow ticket initialized with ${levels.length} approval tier(s).`,
        },
      ],
      createdAt: `${today} ${nowTime}`,
      updatedAt: `${today} ${nowTime}`,
    };

    // Update approvalId on conditions
    newApproval.conditions.forEach(c => c.approvalId = newApproval.id);
    newApproval.history.forEach(h => h.approvalId = newApproval.id);

    this.approvals.unshift(newApproval);

    if (app) {
      app.status = 'UNDER_REVIEW';
      this.logApplicationHistory(app.id, {
        eventType: 'STATUS_CHANGED',
        actor: actorName,
        actorRole: 'Workflow Automation',
        description: `Application routed to Approvals Queue (${approvalNum}).`,
        details: `Delegation Matrix evaluated ${levels.length} level(s) for recommended ₹${ca.recommendedAmount.toLocaleString('en-IN')}.`,
      });
    }

    this.logAudit({
      entityType: 'USER',
      entityId: newApproval.customerId,
      entityName: newApproval.customerName,
      action: 'APPROVAL_CREATED',
      details: `Approval dossier ${newApproval.approvalNumber} created for application ${newApproval.applicationNumber} with ${levels.length} level(s).`,
    });

    this.notify();
    return newApproval;
  }

  public assignApproval(
    approvalId: string,
    approverId: string,
    approverName: string,
    notes?: string,
    actorName: string = 'Operations Head'
  ): ApprovalRecord {
    const approval = this.approvals.find((a) => a.id === approvalId);
    if (!approval) throw new Error('Approval record not found');

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isReassignment = !!approval.assignedToId;

    approval.assignedToId = approverId;
    approval.assignedToName = approverName;
    approval.assignedAt = `${today} ${nowTime}`;
    approval.assignedBy = actorName;
    approval.assignmentNotes = notes;

    if (approval.currentLevelIndex < approval.levels.length) {
      const currentLevel = approval.levels[approval.currentLevelIndex];
      currentLevel.assignedToId = approverId;
      currentLevel.assignedToName = approverName;
      currentLevel.assignedAt = `${today} ${nowTime}`;
      currentLevel.assignedBy = actorName;
      currentLevel.assignmentNotes = notes;
      if (currentLevel.status === 'PENDING') {
        currentLevel.status = 'IN_PROGRESS';
      }
    }

    const prevStatus = approval.status;
    if (approval.status === 'PENDING') {
      approval.status = 'IN_REVIEW';
    }
    approval.updatedAt = `${today} ${nowTime}`;

    const histId = `hist_appr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    approval.history.push({
      id: histId,
      approvalId: approval.id,
      timestamp: `${today} ${nowTime}`,
      event: isReassignment ? 'APPROVAL_REASSIGNED' : 'APPROVAL_ASSIGNED',
      actor: actorName,
      actorRole: 'Operations Head',
      level: approval.levels[approval.currentLevelIndex]?.level || 1,
      previousState: prevStatus,
      newState: approval.status,
      notes: isReassignment
        ? `Reassigned to ${approverName}. Notes: ${notes || 'None'}`
        : `Assigned to ${approverName} for Level ${approval.levels[approval.currentLevelIndex]?.level} review. Notes: ${notes || 'None'}`,
    });

    this.logAudit({
      entityType: 'USER',
      entityId: approval.customerId,
      entityName: approval.customerName,
      action: isReassignment ? 'APPROVAL_REASSIGNED' : 'APPROVAL_ASSIGNED',
      details: `Approval ${approval.approvalNumber} assigned to ${approverName} by ${actorName}.`,
    });

    this.notify();
    return approval;
  }

  public startApprovalReview(approvalId: string, actorName: string = 'Approver'): ApprovalRecord {
    const approval = this.approvals.find((a) => a.id === approvalId);
    if (!approval) throw new Error('Approval record not found');

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (approval.status === 'PENDING' || approval.status === 'ASSIGNED') {
      approval.status = 'IN_REVIEW';
    }

    if (approval.currentLevelIndex < approval.levels.length) {
      if (approval.levels[approval.currentLevelIndex].status === 'PENDING') {
        approval.levels[approval.currentLevelIndex].status = 'IN_PROGRESS';
      }
    }

    approval.updatedAt = `${today} ${nowTime}`;

    approval.history.push({
      id: `hist_appr_${Date.now()}`,
      approvalId: approval.id,
      timestamp: `${today} ${nowTime}`,
      event: 'APPROVAL_STARTED',
      actor: actorName,
      actorRole: 'Approver',
      level: approval.levels[approval.currentLevelIndex]?.level || 1,
      previousState: 'ASSIGNED',
      newState: 'IN_REVIEW',
      notes: `${actorName} opened dossier and initiated verification review.`,
    });

    this.notify();
    return approval;
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
    const approval = this.approvals.find((a) => a.id === approvalId);
    if (!approval) return { success: false, message: 'Approval record not found' };

    // Segregation of Duties (SoD) Check
    if (
      actorName &&
      approval.creditAssessorName &&
      actorName.toLowerCase().trim() === approval.creditAssessorName.toLowerCase().trim() &&
      !actorRole.toLowerCase().includes('admin')
    ) {
      return {
        success: false,
        message: 'Segregation of Duties (SoD) Violation: The credit underwriter who assessed this file cannot act as the sanctioning approver.',
      };
    }

    const currentLevel = approval.levels[approval.currentLevelIndex];
    if (!currentLevel) {
      return { success: false, message: 'Current approval level execution step is invalid.' };
    }

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Authority Limit Check on Final or Individual Levels
    if (decisionData.decision === 'APPROVE' && decisionData.approvedAmount) {
      if (decisionData.approvedAmount > currentLevel.authorityLimit && approval.currentLevelIndex === approval.totalLevels - 1) {
        return {
          success: false,
          message: `Authority Limit Exceeded: Approved quantum ₹${decisionData.approvedAmount.toLocaleString('en-IN')} exceeds Level ${currentLevel.level} delegation authority (Limit: ₹${currentLevel.authorityLimit.toLocaleString('en-IN')}). Please route an Amount Exception or escalate to a higher governance tier.`,
        };
      }
    }

    const prevApprovalStatus = approval.status;
    const versionNum = (approval.versions?.length || 0) + 1;

    if (decisionData.decision === 'APPROVE') {
      currentLevel.status = 'APPROVED';
      currentLevel.decision = 'APPROVE';
      currentLevel.decidedAt = `${today} ${nowTime}`;
      currentLevel.decidedBy = actorName;
      currentLevel.approvedAmount = decisionData.approvedAmount || approval.recommendedAmount;
      currentLevel.approvedTenureMonths = decisionData.approvedTenureMonths || approval.recommendedTenureMonths;
      currentLevel.approvedInterestRate = decisionData.approvedInterestRate || approval.recommendedInterestRate;
      currentLevel.decisionNotes = decisionData.decisionNotes;

      // Version Snapshot
      if (!approval.versions) approval.versions = [];
      approval.versions.push({
        versionNumber: versionNum,
        level: currentLevel.level,
        decision: 'APPROVE',
        approvedAmount: currentLevel.approvedAmount,
        approvedTenureMonths: currentLevel.approvedTenureMonths,
        approvedInterestRate: currentLevel.approvedInterestRate,
        deviationReason: decisionData.deviationReason,
        decisionNotes: decisionData.decisionNotes,
        decidedBy: actorName,
        decidedAt: `${today} ${nowTime}`,
        approverRole: actorRole,
        conditionsSnapshot: approval.conditions.map((c) => ({ description: c.description, status: c.status })),
        exceptionsSnapshot: approval.exceptions.map((e) => ({ title: e.title, status: e.status })),
      });

      // Check if more levels remain
      if (approval.currentLevelIndex < approval.totalLevels - 1) {
        approval.currentLevelIndex += 1;
        approval.status = 'IN_REVIEW';
        approval.levels[approval.currentLevelIndex].status = 'PENDING';

        approval.history.push({
          id: `hist_appr_${Date.now()}`,
          approvalId: approval.id,
          timestamp: `${today} ${nowTime}`,
          event: 'APPROVAL_APPROVED',
          actor: actorName,
          actorRole,
          level: currentLevel.level,
          previousState: prevApprovalStatus,
          newState: 'IN_REVIEW',
          amount: currentLevel.approvedAmount,
          notes: `Level ${currentLevel.level} approved for ₹${currentLevel.approvedAmount?.toLocaleString('en-IN')}. Case advanced to Level ${approval.levels[approval.currentLevelIndex].level} (${approval.levels[approval.currentLevelIndex].levelName}). Notes: ${decisionData.decisionNotes}`,
        });
      } else {
        // Final Level Approval
        approval.status = 'APPROVED';
        approval.approvedAmount = currentLevel.approvedAmount;
        approval.approvedTenureMonths = currentLevel.approvedTenureMonths;
        approval.approvedInterestRate = currentLevel.approvedInterestRate;

        // Update application
        const app = this.applications.find((a) => a.id === approval.applicationId);
        if (app) {
          app.status = 'APPROVED';
          app.notes = `Formal Sanction Approval Granted: ₹${approval.approvedAmount?.toLocaleString('en-IN')} @ ${approval.approvedInterestRate}% p.a. for ${approval.approvedTenureMonths} months.`;
          this.logApplicationHistory(app.id, {
            eventType: 'STATUS_CHANGED',
            actor: actorName,
            actorRole,
            description: `Application Approved by ${actorRole}.`,
            details: `Sanctioned Amount: ₹${approval.approvedAmount?.toLocaleString('en-IN')} @ ${approval.approvedInterestRate}% for ${approval.approvedTenureMonths} mos.`,
          });
        }

        approval.history.push({
          id: `hist_appr_${Date.now()}`,
          approvalId: approval.id,
          timestamp: `${today} ${nowTime}`,
          event: 'APPROVAL_APPROVED',
          actor: actorName,
          actorRole,
          level: currentLevel.level,
          previousState: prevApprovalStatus,
          newState: 'APPROVED',
          amount: approval.approvedAmount,
          notes: `Final Sanction Approval granted for ₹${approval.approvedAmount?.toLocaleString('en-IN')} @ ${approval.approvedInterestRate}% for ${approval.approvedTenureMonths} months. Notes: ${decisionData.decisionNotes}`,
        });
      }
    } else if (decisionData.decision === 'REJECT') {
      currentLevel.status = 'REJECTED';
      currentLevel.decision = 'REJECT';
      currentLevel.decidedAt = `${today} ${nowTime}`;
      currentLevel.decidedBy = actorName;
      currentLevel.decisionNotes = decisionData.decisionNotes;

      approval.status = 'REJECTED';

      // Version Snapshot
      if (!approval.versions) approval.versions = [];
      approval.versions.push({
        versionNumber: versionNum,
        level: currentLevel.level,
        decision: 'REJECT',
        decisionNotes: decisionData.decisionNotes,
        decidedBy: actorName,
        decidedAt: `${today} ${nowTime}`,
        approverRole: actorRole,
        conditionsSnapshot: approval.conditions.map((c) => ({ description: c.description, status: c.status })),
        exceptionsSnapshot: approval.exceptions.map((e) => ({ title: e.title, status: e.status })),
      });

      // Update application
      const app = this.applications.find((a) => a.id === approval.applicationId);
      if (app) {
        app.status = 'REJECTED';
        app.notes = `Application Rejected by Sanction Authority: ${decisionData.decisionNotes}`;
        this.logApplicationHistory(app.id, {
          eventType: 'STATUS_CHANGED',
          actor: actorName,
          actorRole,
          description: `Application Rejected by Approver (${actorRole}).`,
          details: decisionData.decisionNotes,
        });
      }

      approval.history.push({
        id: `hist_appr_${Date.now()}`,
        approvalId: approval.id,
        timestamp: `${today} ${nowTime}`,
        event: 'APPROVAL_REJECTED',
        actor: actorName,
        actorRole,
        level: currentLevel.level,
        previousState: prevApprovalStatus,
        newState: 'REJECTED',
        notes: `Formal rejection decision issued by ${actorName}. Reason: ${decisionData.decisionNotes}`,
      });
    } else if (decisionData.decision === 'RETURN') {
      currentLevel.status = 'PENDING';
      currentLevel.decision = 'RETURN';
      currentLevel.decisionNotes = decisionData.decisionNotes;

      approval.status = 'RETURNED';

      // Version Snapshot
      if (!approval.versions) approval.versions = [];
      approval.versions.push({
        versionNumber: versionNum,
        level: currentLevel.level,
        decision: 'RETURN',
        decisionNotes: decisionData.decisionNotes,
        returnReason: decisionData.returnReason,
        requiredAction: decisionData.requiredAction,
        dueDate: decisionData.dueDate,
        decidedBy: actorName,
        decidedAt: `${today} ${nowTime}`,
        approverRole: actorRole,
        conditionsSnapshot: approval.conditions.map((c) => ({ description: c.description, status: c.status })),
        exceptionsSnapshot: approval.exceptions.map((e) => ({ title: e.title, status: e.status })),
      });

      // Update credit assessment
      const ca = this.creditAssessments.find((c) => c.id === approval.creditAssessmentId);
      if (ca) {
        ca.status = 'RETURNED';
      }

      // Update application
      const app = this.applications.find((a) => a.id === approval.applicationId);
      if (app) {
        app.notes = `Returned for clarification: ${decisionData.returnReason || decisionData.decisionNotes}`;
        this.logApplicationHistory(app.id, {
          eventType: 'STATUS_CHANGED',
          actor: actorName,
          actorRole,
          description: `Application returned to Credit Underwriting for clarifications.`,
          details: `Reason: ${decisionData.returnReason || 'None'} | Action: ${decisionData.requiredAction || 'None'}`,
        });
      }

      approval.history.push({
        id: `hist_appr_${Date.now()}`,
        approvalId: approval.id,
        timestamp: `${today} ${nowTime}`,
        event: 'APPROVAL_RETURNED',
        actor: actorName,
        actorRole,
        level: currentLevel.level,
        previousState: prevApprovalStatus,
        newState: 'RETURNED',
        notes: `Returned to underwriter/sourcing. Reason: ${decisionData.returnReason || decisionData.decisionNotes} | Action Required: ${decisionData.requiredAction || 'None'} | Due: ${decisionData.dueDate || 'Immediate'}`,
      });
    }

    approval.updatedAt = `${today} ${nowTime}`;

    this.logAudit({
      entityType: 'USER',
      entityId: approval.customerId,
      entityName: approval.customerName,
      action: `APPROVAL_${decisionData.decision}`,
      details: `Approval ${approval.approvalNumber} ${decisionData.decision} by ${actorName} (${actorRole}). Notes: ${decisionData.decisionNotes}`,
    });

    this.notify();
    return { success: true, approval };
  }

  public addApprovalCondition(
    approvalId: string,
    condition: Omit<ApprovalCondition, 'id' | 'approvalId' | 'addedAt'>,
    actorName: string = 'Approver'
  ): ApprovalCondition {
    const approval = this.approvals.find((a) => a.id === approvalId);
    if (!approval) throw new Error('Approval record not found');

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newCond: ApprovalCondition = {
      id: `cond_appr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      approvalId: approval.id,
      addedAt: `${today} ${nowTime}`,
      ...condition,
    };

    if (!approval.conditions) approval.conditions = [];
    approval.conditions.push(newCond);
    approval.updatedAt = `${today} ${nowTime}`;

    approval.history.push({
      id: `hist_appr_${Date.now()}`,
      approvalId: approval.id,
      timestamp: `${today} ${nowTime}`,
      event: 'CONDITION_ADDED',
      actor: actorName,
      actorRole: 'Sanction Authority',
      level: approval.levels[approval.currentLevelIndex]?.level || 1,
      previousState: approval.status,
      newState: approval.status,
      notes: `Added sanction covenant [${newCond.category} - Pre-${newCond.requiredBefore}]: ${newCond.description}`,
    });

    this.notify();
    return newCond;
  }

  public updateApprovalConditionStatus(
    approvalId: string,
    conditionId: string,
    status: ConditionStatus,
    resolutionNotes?: string,
    waiverReason?: string,
    actorName: string = 'Approver'
  ): ApprovalRecord {
    const approval = this.approvals.find((a) => a.id === approvalId);
    if (!approval) throw new Error('Approval record not found');

    const cond = approval.conditions.find((c) => c.id === conditionId);
    if (!cond) throw new Error('Condition item not found');

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const prevStatus = cond.status;
    cond.status = status;
    if (resolutionNotes) cond.resolutionNotes = resolutionNotes;
    if (waiverReason) {
      cond.waiverReason = waiverReason;
      cond.waivedBy = actorName;
      cond.waivedAt = `${today} ${nowTime}`;
    }

    approval.updatedAt = `${today} ${nowTime}`;

    approval.history.push({
      id: `hist_appr_${Date.now()}`,
      approvalId: approval.id,
      timestamp: `${today} ${nowTime}`,
      event: 'CONDITION_UPDATED',
      actor: actorName,
      actorRole: 'Sanction Authority',
      level: approval.levels[approval.currentLevelIndex]?.level || 1,
      previousState: prevStatus,
      newState: status,
      notes: `Condition "${cond.description}" updated from ${prevStatus} to ${status}. ${resolutionNotes ? `Notes: ${resolutionNotes}` : ''} ${waiverReason ? `Waiver reason: ${waiverReason}` : ''}`,
    });

    this.notify();
    return approval;
  }

  public deleteApprovalCondition(approvalId: string, conditionId: string, actorName: string = 'Approver'): ApprovalRecord {
    const approval = this.approvals.find((a) => a.id === approvalId);
    if (!approval) throw new Error('Approval record not found');

    const cond = approval.conditions.find((c) => c.id === conditionId);
    if (!cond) throw new Error('Condition item not found');

    approval.conditions = approval.conditions.filter((c) => c.id !== conditionId);
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    approval.updatedAt = `${today} ${nowTime}`;

    approval.history.push({
      id: `hist_appr_${Date.now()}`,
      approvalId: approval.id,
      timestamp: `${today} ${nowTime}`,
      event: 'CONDITION_UPDATED',
      actor: actorName,
      actorRole: 'Sanction Authority',
      level: approval.levels[approval.currentLevelIndex]?.level || 1,
      previousState: 'EXISTING',
      newState: 'DELETED',
      notes: `Removed condition covenant: "${cond.description}"`,
    });

    this.notify();
    return approval;
  }

  public addApprovalException(
    approvalId: string,
    exception: Omit<ApprovalException, 'id' | 'approvalId' | 'createdAt' | 'status'>,
    actorName: string = 'Approver'
  ): ApprovalException {
    const approval = this.approvals.find((a) => a.id === approvalId);
    if (!approval) throw new Error('Approval record not found');

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newExc: ApprovalException = {
      id: `exc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      approvalId: approval.id,
      status: 'PENDING',
      createdAt: `${today} ${nowTime}`,
      ...exception,
    };

    if (!approval.exceptions) approval.exceptions = [];
    approval.exceptions.push(newExc);
    approval.updatedAt = `${today} ${nowTime}`;

    approval.history.push({
      id: `hist_appr_${Date.now()}`,
      approvalId: approval.id,
      timestamp: `${today} ${nowTime}`,
      event: 'EXCEPTION_CREATED',
      actor: actorName,
      actorRole: 'Sanction Reviewer',
      level: approval.levels[approval.currentLevelIndex]?.level || 1,
      previousState: 'NONE',
      newState: 'PENDING',
      notes: `Created deviation exception: [${newExc.category}] ${newExc.title}. Reason: ${newExc.reason}. Requires: ${newExc.requiredAuthorityRole}`,
    });

    this.notify();
    return newExc;
  }

  public routeApprovalException(
    approvalId: string,
    exceptionId: string,
    routedToRole: string,
    actorName: string = 'Approver'
  ): ApprovalRecord {
    const approval = this.approvals.find((a) => a.id === approvalId);
    if (!approval) throw new Error('Approval record not found');

    const exc = approval.exceptions.find((e) => e.id === exceptionId);
    if (!exc) throw new Error('Exception item not found');

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    exc.status = 'SUBMITTED';
    exc.routedTo = routedToRole;
    exc.routedAt = `${today} ${nowTime}`;
    exc.routedBy = actorName;

    approval.updatedAt = `${today} ${nowTime}`;

    approval.history.push({
      id: `hist_appr_${Date.now()}`,
      approvalId: approval.id,
      timestamp: `${today} ${nowTime}`,
      event: 'EXCEPTION_ROUTED',
      actor: actorName,
      actorRole: 'Sanction Reviewer',
      level: approval.levels[approval.currentLevelIndex]?.level || 1,
      previousState: 'PENDING',
      newState: 'SUBMITTED',
      notes: `Exception "${exc.title}" routed to ${routedToRole} for delegation authorization.`,
    });

    this.notify();
    return approval;
  }

  public resolveApprovalException(
    approvalId: string,
    exceptionId: string,
    status: 'APPROVED' | 'REJECTED',
    decisionNotes: string,
    actorName: string = 'Regional Credit Manager'
  ): ApprovalRecord {
    const approval = this.approvals.find((a) => a.id === approvalId);
    if (!approval) throw new Error('Approval record not found');

    const exc = approval.exceptions.find((e) => e.id === exceptionId);
    if (!exc) throw new Error('Exception item not found');

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    exc.status = status;
    exc.decidedBy = actorName;
    exc.decidedAt = `${today} ${nowTime}`;
    exc.decisionNotes = decisionNotes;

    approval.updatedAt = `${today} ${nowTime}`;

    approval.history.push({
      id: `hist_appr_${Date.now()}`,
      approvalId: approval.id,
      timestamp: `${today} ${nowTime}`,
      event: 'EXCEPTION_RESOLVED',
      actor: actorName,
      actorRole: 'Authority',
      level: approval.levels[approval.currentLevelIndex]?.level || 1,
      previousState: 'SUBMITTED',
      newState: status,
      notes: `Exception "${exc.title}" was ${status} by ${actorName}. Notes: ${decisionNotes}`,
    });

    this.notify();
    return approval;
  }

  public addApprovalMatrixRule(
    rule: Omit<ApprovalMatrixRule, 'id' | 'createdDate' | 'updatedDate'>,
    actorName: string = 'Siddharth Rao (EMP-001001)'
  ): { success: boolean; message?: string; rule?: ApprovalMatrixRule } {
    // Validate overlapping active rules for same product, branch, and level
    const overlap = this.approvalMatrixRules.find((r) => {
      if (!r.isActive) return false;
      if (r.productCode !== rule.productCode) return false;
      if (r.level !== rule.level) return false;
      if (r.branchId !== rule.branchId && r.branchId !== 'ALL' && rule.branchId !== 'ALL') return false;
      // Overlap check
      return (
        (rule.minAmount >= r.minAmount && rule.minAmount <= r.maxAmount) ||
        (rule.maxAmount >= r.minAmount && rule.maxAmount <= r.maxAmount) ||
        (rule.minAmount <= r.minAmount && rule.maxAmount >= r.maxAmount)
      );
    });

    if (overlap) {
      return {
        success: false,
        message: `Validation Error: Range overlaps with active rule ${overlap.ruleCode} (₹${overlap.minAmount.toLocaleString('en-IN')} - ₹${overlap.maxAmount.toLocaleString('en-IN')}) for Level ${rule.level}.`,
      };
    }

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newId = `rule_mat_${Date.now()}`;

    const newRule: ApprovalMatrixRule = {
      id: newId,
      createdDate: today,
      updatedDate: today,
      ...rule,
    };

    this.approvalMatrixRules.push(newRule);

    this.approvalMatrixAudits.unshift({
      id: `audit_mat_${Date.now()}`,
      ruleId: newId,
      ruleCode: newRule.ruleCode,
      timestamp: `${today} ${nowTime}`,
      actor: actorName,
      action: 'CREATED',
      details: `Created new matrix rule ${newRule.ruleCode} for ${newRule.productName} Level ${newRule.level} (Limit ₹${newRule.authorityLimit.toLocaleString('en-IN')}).`,
    });

    this.notify();
    return { success: true, rule: newRule };
  }

  public updateApprovalMatrixRule(
    ruleId: string,
    updates: Partial<ApprovalMatrixRule>,
    actorName: string = 'Siddharth Rao (EMP-001001)'
  ): { success: boolean; message?: string; rule?: ApprovalMatrixRule } {
    const rule = this.approvalMatrixRules.find((r) => r.id === ruleId);
    if (!rule) return { success: false, message: 'Approval matrix rule not found' };

    // Check overlap if amount or level changed
    if (updates.minAmount !== undefined || updates.maxAmount !== undefined || updates.level !== undefined) {
      const minA = updates.minAmount !== undefined ? updates.minAmount : rule.minAmount;
      const maxA = updates.maxAmount !== undefined ? updates.maxAmount : rule.maxAmount;
      const lvl = updates.level !== undefined ? updates.level : rule.level;
      const prod = updates.productCode !== undefined ? updates.productCode : rule.productCode;

      const overlap = this.approvalMatrixRules.find((r) => {
        if (r.id === ruleId || !r.isActive) return false;
        if (r.productCode !== prod) return false;
        if (r.level !== lvl) return false;
        return (
          (minA >= r.minAmount && minA <= r.maxAmount) ||
          (maxA >= r.minAmount && maxA <= r.maxAmount) ||
          (minA <= r.minAmount && maxA >= r.maxAmount)
        );
      });

      if (overlap) {
        return {
          success: false,
          message: `Validation Error: Updated range overlaps with active rule ${overlap.ruleCode} for Level ${lvl}.`,
        };
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    Object.assign(rule, updates);
    rule.updatedDate = today;
    rule.updatedBy = actorName;

    this.approvalMatrixAudits.unshift({
      id: `audit_mat_${Date.now()}`,
      ruleId: rule.id,
      ruleCode: rule.ruleCode,
      timestamp: `${today} ${nowTime}`,
      actor: actorName,
      action: 'UPDATED',
      details: `Updated parameters for matrix rule ${rule.ruleCode}.`,
    });

    this.notify();
    return { success: true, rule };
  }

  public toggleApprovalMatrixRuleActive(
    ruleId: string,
    isActive: boolean,
    actorName: string = 'Siddharth Rao (EMP-001001)'
  ): ApprovalMatrixRule {
    const rule = this.approvalMatrixRules.find((r) => r.id === ruleId);
    if (!rule) throw new Error('Rule not found');

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    rule.isActive = isActive;
    rule.updatedDate = today;
    rule.updatedBy = actorName;

    this.approvalMatrixAudits.unshift({
      id: `audit_mat_${Date.now()}`,
      ruleId: rule.id,
      ruleCode: rule.ruleCode,
      timestamp: `${today} ${nowTime}`,
      actor: actorName,
      action: isActive ? 'ACTIVATED' : 'DEACTIVATED',
      details: `Matrix rule ${rule.ruleCode} was ${isActive ? 'activated' : 'deactivated'} by ${actorName}.`,
    });

    this.notify();
    return rule;
  }

  public deleteApprovalMatrixRule(ruleId: string, actorName: string = 'Siddharth Rao (EMP-001001)'): { success: boolean; message?: string } {
    const index = this.approvalMatrixRules.findIndex((r) => r.id === ruleId);
    if (index === -1) return { success: false, message: 'Rule not found' };

    const rule = this.approvalMatrixRules[index];
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.approvalMatrixRules.splice(index, 1);

    this.approvalMatrixAudits.unshift({
      id: `audit_mat_${Date.now()}`,
      ruleId,
      ruleCode: rule.ruleCode,
      timestamp: `${today} ${nowTime}`,
      actor: actorName,
      action: 'DEACTIVATED',
      details: `Matrix rule ${rule.ruleCode} deleted by ${actorName}.`,
    });

    this.notify();
    return { success: true };
  }

  // ==========================================
  // BATCH 8: SANCTION MANAGEMENT & PRE-DISBURSEMENT READINESS
  // ==========================================

  public getSanctions(): SanctionRecord[] {
    return [...this.sanctions];
  }

  public getSanctionById(id: string): SanctionRecord | undefined {
    return this.sanctions.find((s) => s.id === id);
  }

  public getSanctionByApplicationId(applicationId: string): SanctionRecord | undefined {
    return this.sanctions.find((s) => s.applicationId === applicationId);
  }

  public getSanctionByApprovalId(approvalId: string): SanctionRecord | undefined {
    return this.sanctions.find((s) => s.approvalId === approvalId);
  }

  public createSanction(params: {
    applicationId: string;
    approvalId?: string;
    terms?: Partial<SanctionTerms>;
    deviationReason?: string;
    actorName?: string;
    actorRole?: string;
  }): SanctionRecord {
    const app = this.applications.find((a) => a.id === params.applicationId);
    if (!app) throw new Error(`Application ${params.applicationId} not found`);

    // Verify application status
    if (app.status !== 'APPROVED' && app.status !== 'SANCTIONED') {
      throw new Error(`Sanction can only be created for APPROVED applications. Current status: ${app.status}`);
    }

    // Check if sanction already exists
    const existing = this.sanctions.find((s) => s.applicationId === params.applicationId);
    if (existing) return existing;

    // Find approval record
    const approval = params.approvalId
      ? this.approvals.find((a) => a.id === params.approvalId)
      : this.approvals.find((a) => a.applicationId === params.applicationId && a.status === 'APPROVED');

    if (!approval || approval.status !== 'APPROVED') {
      throw new Error('Approved Credit Committee record required before sanction drafting.');
    }

    const customer = this.customers.find((c) => c.id === app.customerId);
    const branch = this.branches.find((b) => b.id === app.branchId);
    const product = this.loanProductsConfig.find((p) => p.code === app.productCode);

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const actorName = params.actorName || 'Loan Officer';
    const actorRole = params.actorRole || 'Loan Officer';

    const sanctionNumber = `SN-2026-${String(this.nextSanctionSeq++).padStart(6, '0')}`;
    const approvedAmt = approval.approvedAmount || (app as any).approvedAmount || app.requestedAmount;
    const approvedTenure = approval.approvedTenureMonths || (app as any).approvedTenureMonths || app.requestedTenureMonths;
    const approvedRate = approval.approvedInterestRate || (app as any).approvedInterestRate || (app as any).requestedInterestRate || (app as any).interestRate || 10.5;

    // Calculate fees
    const procRate = (product as any)?.processingFeePercent || 1.0;
    const procFee = Math.round((approvedAmt * procRate) / 100);
    const procFeeGst = Math.round(procFee * 0.18);
    const docCharge = (product as any)?.documentationCharges || 500;
    const insCharge = Math.round(approvedAmt * 0.005);
    const netDisb = approvedAmt - (procFee + procFeeGst + docCharge + insCharge);
    const approxEmi = this.calculateEMI(approvedAmt, approvedRate, approvedTenure);

    // Inherit conditions from credit assessment + approval
    const initialConditions: SanctionCondition[] = [];

    // From approval
    if (approval.conditions && approval.conditions.length > 0) {
      approval.conditions.forEach((c, idx) => {
        initialConditions.push({
          id: `scond_${Date.now()}_${idx}`,
          sanctionId: `sanc_${Date.now()}`,
          category: c.category as any,
          description: c.description,
          requiredBefore: c.requiredBefore,
          dueDate: c.dueDate,
          owner: c.owner,
          status: c.status,
          source: c.source === 'CREDIT_ASSESSMENT' ? 'CREDIT_ASSESSMENT' : 'APPROVAL',
          addedBy: c.addedBy,
          addedAt: c.addedAt,
          resolutionNotes: c.resolutionNotes,
          resolvedBy: (c as any).resolvedBy || c.waivedBy,
          resolvedAt: (c as any).resolvedAt || c.waivedAt,
          waiverReason: c.waiverReason,
          waivedBy: c.waivedBy,
          waivedAt: c.waivedAt,
        });
      });
    }

    const defaultTerms: SanctionTerms = {
      amount: approvedAmt,
      tenureMonths: approvedTenure,
      interestRate: approvedRate,
      repaymentFrequency: 'Monthly',
      purpose: app.purpose || 'Retail Loan Facility',
      processingFee: procFee,
      processingFeeGst: procFeeGst,
      documentationCharge: docCharge,
      insuranceCharge: insCharge,
      otherCharges: 0,
      netDisbursementAmount: netDisb,
      approxMonthlyEmi: approxEmi,
      gracePeriodDays: 0,
      paymentMethod: 'NACH / e-Mandate',
      firstRepaymentDatePlaceholder: '2026-10-05',
      interestMethodology: 'Reducing Balance Method',
      isDeviatedFromApproval: false,
      ...params.terms,
    };

    if (params.deviationReason) {
      defaultTerms.isDeviatedFromApproval = true;
      defaultTerms.deviationNotes = params.deviationReason;
    }

    const finalApprover = approval.levels[approval.totalLevels - 1];

    const newSanction: SanctionRecord = {
      id: `sanc_${Date.now()}`,
      sanctionNumber,
      applicationId: app.id,
      applicationNumber: app.applicationNumber,
      approvalId: approval.id,
      approvalNumber: approval.approvalNumber,
      customerId: app.customerId,
      customerNumber: app.customerNumber,
      customerName: app.customerName,
      customerMobile: customer?.mobile || '+91 98765 43210',
      customerEmail: customer?.email || 'borrower@example.in',
      customerAddress: customer
        ? `${customer.currentAddress.addressLine1}, ${customer.currentAddress.city}, ${customer.currentAddress.state} ${customer.currentAddress.pinCode}`
        : 'Panaji, Goa',
      branchId: app.branchId,
      branchName: branch?.name || 'Panaji Head Office Branch',
      productCode: app.productCode,
      productName: app.productName,
      status: 'DRAFT',

      requestedAmount: app.requestedAmount,
      approvedAmount: approvedAmt,
      approvedTenureMonths: approvedTenure,
      approvedInterestRate: approvedRate,
      finalApproverName: finalApprover?.decidedBy || 'Priya Deshmukh',
      finalApproverRole: finalApprover?.requiredRoleName || 'Branch Credit Manager',
      approvedDate: finalApprover?.decidedAt?.split(' ')[0] || today,

      terms: defaultTerms,
      termDeviationReason: params.deviationReason,
      conditions: initialConditions,
      letters: [],
      
      createdDate: today,
      createdTime: nowTime,
      createdBy: actorName,
      createdByRole: actorRole,

      versions: [
        {
          version: 1,
          snapshotDate: `${today} ${nowTime}`,
          actor: actorName,
          actorRole: actorRole,
          amount: defaultTerms.amount,
          tenureMonths: defaultTerms.tenureMonths,
          interestRate: defaultTerms.interestRate,
          processingFee: defaultTerms.processingFee,
          documentationCharge: defaultTerms.documentationCharge,
          conditionsCount: initialConditions.length,
          letterVersion: 0,
          changeDescription: 'Initial Sanction Dossier created from final approval.',
          reason: 'Initial setup',
        },
      ],

      history: [
        {
          id: `shist_${Date.now()}`,
          sanctionId: `sanc_${Date.now()}`,
          timestamp: `${today} ${nowTime}`,
          event: 'SANCTION_CREATED',
          actor: actorName,
          actorRole: actorRole,
          previousState: 'N/A',
          newState: 'DRAFT',
          version: 1,
          notes: `Sanction draft created for ₹${defaultTerms.amount.toLocaleString('en-IN')}. Inherited ${initialConditions.length} condition(s) from credit dossier.`,
        },
      ],
    };

    // Correct condition sanctionIds
    newSanction.conditions.forEach((c) => {
      c.sanctionId = newSanction.id;
    });

    this.sanctions.unshift(newSanction);
    this.notify();
    return newSanction;
  }

  public updateSanctionTerms(
    sanctionId: string,
    terms: Partial<SanctionTerms>,
    deviationReason: string = '',
    actorName: string = 'Loan Officer',
    actorRole: string = 'Loan Officer'
  ): SanctionRecord {
    const sanction = this.sanctions.find((s) => s.id === sanctionId);
    if (!sanction) throw new Error('Sanction not found');

    if (sanction.status === 'SANCTIONED' || sanction.status === 'CANCELLED') {
      throw new Error(`Cannot modify terms when sanction is in ${sanction.status} state.`);
    }

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const prevTerms = { ...sanction.terms };
    const newAmount = terms.amount !== undefined ? terms.amount : sanction.terms.amount;
    const newRate = terms.interestRate !== undefined ? terms.interestRate : sanction.terms.interestRate;
    const newTenure = terms.tenureMonths !== undefined ? terms.tenureMonths : sanction.terms.tenureMonths;
    const newApproxEmi = this.calculateEMI(newAmount, newRate, newTenure);

    const procFee = terms.processingFee !== undefined ? terms.processingFee : sanction.terms.processingFee;
    const procFeeGst = Math.round(procFee * 0.18);
    const docCharge = terms.documentationCharge !== undefined ? terms.documentationCharge : sanction.terms.documentationCharge;
    const insCharge = terms.insuranceCharge !== undefined ? terms.insuranceCharge : sanction.terms.insuranceCharge;
    const netDisb = newAmount - (procFee + procFeeGst + docCharge + insCharge);

    const isDeviated =
      newAmount !== sanction.approvedAmount ||
      newTenure !== sanction.approvedTenureMonths ||
      newRate !== sanction.approvedInterestRate;

    sanction.terms = {
      ...sanction.terms,
      ...terms,
      amount: newAmount,
      tenureMonths: newTenure,
      interestRate: newRate,
      approxMonthlyEmi: newApproxEmi,
      processingFee: procFee,
      processingFeeGst: procFeeGst,
      documentationCharge: docCharge,
      insuranceCharge: insCharge,
      netDisbursementAmount: netDisb,
      isDeviatedFromApproval: isDeviated,
      deviationNotes: deviationReason || sanction.terms.deviationNotes,
    };

    if (deviationReason) {
      sanction.termDeviationReason = deviationReason;
    }

    const newVersionNum = sanction.versions.length + 1;
    sanction.versions.push({
      version: newVersionNum,
      snapshotDate: `${today} ${nowTime}`,
      actor: actorName,
      actorRole: actorRole,
      amount: sanction.terms.amount,
      tenureMonths: sanction.terms.tenureMonths,
      interestRate: sanction.terms.interestRate,
      processingFee: sanction.terms.processingFee,
      documentationCharge: sanction.terms.documentationCharge,
      conditionsCount: sanction.conditions.length,
      letterVersion: sanction.letters.length,
      changeDescription: `Terms updated: ₹${newAmount.toLocaleString('en-IN')} @ ${newRate}% for ${newTenure}m. ${deviationReason ? `Reason: ${deviationReason}` : ''}`,
      reason: deviationReason || 'Terms adjustment',
    });

    sanction.history.push({
      id: `shist_${Date.now()}`,
      sanctionId: sanction.id,
      timestamp: `${today} ${nowTime}`,
      event: 'TERMS_UPDATED',
      actor: actorName,
      actorRole: actorRole,
      previousState: `₹${prevTerms.amount.toLocaleString('en-IN')} @ ${prevTerms.interestRate}%`,
      newState: `₹${newAmount.toLocaleString('en-IN')} @ ${newRate}%`,
      version: newVersionNum,
      notes: `Terms updated. Net disb: ₹${netDisb.toLocaleString('en-IN')}, EMI: ₹${newApproxEmi.toLocaleString('en-IN')}. ${deviationReason ? `Deviation note: ${deviationReason}` : ''}`,
    });

    this.notify();
    return sanction;
  }

  public submitSanctionForReview(
    sanctionId: string,
    actorName: string = 'Loan Officer',
    actorRole: string = 'Loan Officer'
  ): SanctionRecord {
    const sanction = this.sanctions.find((s) => s.id === sanctionId);
    if (!sanction) throw new Error('Sanction not found');

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const prev = sanction.status;

    sanction.status = 'UNDER_REVIEW';

    sanction.history.push({
      id: `shist_${Date.now()}`,
      sanctionId: sanction.id,
      timestamp: `${today} ${nowTime}`,
      event: 'SANCTION_SUBMITTED_FOR_REVIEW',
      actor: actorName,
      actorRole: actorRole,
      previousState: prev,
      newState: 'UNDER_REVIEW',
      version: sanction.versions.length,
      notes: 'Sanction dossier submitted for review.',
    });

    this.notify();
    return sanction;
  }

  public submitSanctionForConfirmation(
    sanctionId: string,
    actorName: string = 'Loan Officer',
    actorRole: string = 'Loan Officer'
  ): SanctionRecord {
    const sanction = this.sanctions.find((s) => s.id === sanctionId);
    if (!sanction) throw new Error('Sanction not found');

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const prev = sanction.status;

    sanction.status = 'PENDING_CONFIRMATION';

    sanction.history.push({
      id: `shist_${Date.now()}`,
      sanctionId: sanction.id,
      timestamp: `${today} ${nowTime}`,
      event: 'SANCTION_SUBMITTED_FOR_CONFIRMATION',
      actor: actorName,
      actorRole: actorRole,
      previousState: prev,
      newState: 'PENDING_CONFIRMATION',
      version: sanction.versions.length,
      notes: 'Sanction dossier routed for final confirmation by an independent authority.',
    });

    this.notify();
    return sanction;
  }

  public addSanctionCondition(
    sanctionId: string,
    condition: Omit<SanctionCondition, 'id' | 'sanctionId' | 'addedAt' | 'status'>,
    actorName: string = 'Loan Officer',
    actorRole: string = 'Loan Officer'
  ): SanctionCondition {
    const sanction = this.sanctions.find((s) => s.id === sanctionId);
    if (!sanction) throw new Error('Sanction not found');

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newCond: SanctionCondition = {
      id: `scond_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      sanctionId: sanction.id,
      addedAt: `${today} ${nowTime}`,
      status: 'OPEN',
      ...condition,
    };

    sanction.conditions.push(newCond);

    sanction.history.push({
      id: `shist_${Date.now()}`,
      sanctionId: sanction.id,
      timestamp: `${today} ${nowTime}`,
      event: 'CONDITION_ADDED',
      actor: actorName,
      actorRole: actorRole,
      previousState: sanction.status,
      newState: sanction.status,
      version: sanction.versions.length,
      notes: `Added condition [${newCond.category} - Pre-${newCond.requiredBefore}]: ${newCond.description}`,
    });

    this.notify();
    return newCond;
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
    const sanction = this.sanctions.find((s) => s.id === sanctionId);
    if (!sanction) throw new Error('Sanction record not found');

    const cond = sanction.conditions.find((c) => c.id === conditionId);
    if (!cond) throw new Error('Condition not found');

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const prevStatus = cond.status;

    cond.status = status;
    if (resolutionNotes) {
      cond.resolutionNotes = resolutionNotes;
      cond.resolvedBy = actorName;
      cond.resolvedAt = `${today} ${nowTime}`;
    }
    if (waiverReason) {
      cond.waiverReason = waiverReason;
      cond.waivedBy = actorName;
      cond.waivedAt = `${today} ${nowTime}`;
    }

    sanction.history.push({
      id: `shist_${Date.now()}`,
      sanctionId: sanction.id,
      timestamp: `${today} ${nowTime}`,
      event: 'CONDITION_UPDATED',
      actor: actorName,
      actorRole: actorRole,
      previousState: prevStatus,
      newState: status,
      version: sanction.versions.length,
      notes: `Condition "${cond.description}" marked as ${status}. ${resolutionNotes ? `Notes: ${resolutionNotes}` : ''} ${waiverReason ? `Waiver: ${waiverReason}` : ''}`,
    });

    this.notify();
    return sanction;
  }

  public waiveSanctionCondition(
    sanctionId: string,
    conditionId: string,
    waiverReason: string,
    actorName: string = 'Sanction Officer',
    actorRole: string = 'Sanction Officer'
  ): SanctionRecord {
    if (!waiverReason || waiverReason.trim().length < 5) {
      throw new Error('Mandatory waiver reason (minimum 5 characters) required for audit compliance.');
    }
    return this.updateSanctionConditionStatus(
      sanctionId,
      conditionId,
      'WAIVED',
      undefined,
      waiverReason,
      actorName,
      actorRole
    );
  }

  public deleteSanctionCondition(
    sanctionId: string,
    conditionId: string,
    actorName: string = 'Sanction Officer',
    actorRole: string = 'Sanction Officer'
  ): SanctionRecord {
    const sanction = this.sanctions.find((s) => s.id === sanctionId);
    if (!sanction) throw new Error('Sanction not found');

    const cond = sanction.conditions.find((c) => c.id === conditionId);
    if (!cond) throw new Error('Condition not found');

    if (cond.source === 'APPROVAL' || cond.source === 'CREDIT_ASSESSMENT') {
      throw new Error('Conditions inherited from Credit Assessment or Approval Committee cannot be deleted. You may mark them as Waived with justification.');
    }

    sanction.conditions = sanction.conditions.filter((c) => c.id !== conditionId);

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    sanction.history.push({
      id: `shist_${Date.now()}`,
      sanctionId: sanction.id,
      timestamp: `${today} ${nowTime}`,
      event: 'CONDITION_DELETED',
      actor: actorName,
      actorRole: actorRole,
      previousState: sanction.status,
      newState: sanction.status,
      version: sanction.versions.length,
      notes: `Condition deleted: "${cond.description}"`,
    });

    this.notify();
    return sanction;
  }

  public generateSanctionLetter(
    sanctionId: string,
    optionsOrNotes?: string | { templateId?: string; customNotes?: string; reasonForRegeneration?: string },
    reasonForRegenerationOrActor?: string,
    actorName?: string,
    actorRole: string = 'Loan Officer'
  ): SanctionLetterVersion {
    const sanction = this.sanctions.find((s) => s.id === sanctionId);
    if (!sanction) throw new Error('Sanction not found');

    let customNotes: string | undefined;
    let reasonForRegeneration: string | undefined;
    let templateVersion = 'V2.4-ENTERPRISE-LMS';
    let finalActorName = 'Loan Officer';
    let finalActorRole = 'Loan Officer';

    if (typeof optionsOrNotes === 'object' && optionsOrNotes !== null) {
      customNotes = optionsOrNotes.customNotes;
      reasonForRegeneration = optionsOrNotes.reasonForRegeneration;
      if (optionsOrNotes.templateId) {
        templateVersion = optionsOrNotes.templateId;
      }
      finalActorName = reasonForRegenerationOrActor || 'Loan Officer';
      finalActorRole = actorName || 'Loan Officer';
    } else {
      customNotes = optionsOrNotes;
      reasonForRegeneration = reasonForRegenerationOrActor;
      finalActorName = actorName || 'Loan Officer';
      finalActorRole = actorRole || 'Loan Officer';
    }

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const versionNum = sanction.letters.length + 1;

    // Calculate validity 30 days ahead
    const valDate = new Date();
    valDate.setDate(valDate.getDate() + 30);
    const validUntilStr = valDate.toISOString().split('T')[0];

    const letter: SanctionLetterVersion = {
      id: `slet_${Date.now()}`,
      version: versionNum,
      sanctionId: sanction.id,
      status: 'GENERATED',
      generatedAt: `${today} ${nowTime}`,
      generatedBy: finalActorName,
      generatedByRole: finalActorRole,
      templateVersion,
      reasonForRegeneration,
      customNotes,
      contentSnapshot: {
        institutionName: 'Apex Bharat Financial Services Ltd.',
        institutionAddress: '14th Floor, Maker Chambers IV, Nariman Point, Mumbai, Maharashtra 400021',
        cinNumber: 'U65999MH2018PLC312456',
        rbiRegistrationNumber: 'N-13.02194',
        date: today,
        sanctionNumber: sanction.sanctionNumber,
        applicationNumber: sanction.applicationNumber,
        approvalNumber: sanction.approvalNumber,
        customerName: sanction.customerName,
        customerNumber: sanction.customerNumber,
        customerAddress: sanction.customerAddress,
        customerMobile: sanction.customerMobile,
        customerEmail: sanction.customerEmail,
        productName: sanction.productName,
        productCode: sanction.productCode,
        sanctionAmount: sanction.terms.amount,
        tenureMonths: sanction.terms.tenureMonths,
        interestRate: sanction.terms.interestRate,
        approxMonthlyEmi: sanction.terms.approxMonthlyEmi,
        repaymentFrequency: sanction.terms.repaymentFrequency,
        purpose: sanction.terms.purpose,
        processingFee: sanction.terms.processingFee + sanction.terms.processingFeeGst,
        documentationCharge: sanction.terms.documentationCharge,
        insuranceCharge: sanction.terms.insuranceCharge,
        interestMethodology: sanction.terms.interestMethodology,
        firstRepaymentDate: sanction.terms.firstRepaymentDatePlaceholder || '2026-10-05',
        validityDays: 30,
        validUntil: validUntilStr,
        conditions: sanction.conditions.map((c) => ({
          category: c.category,
          description: c.description,
          requiredBefore: c.requiredBefore,
          status: c.status,
        })),
        signatoryName: sanction.finalApproverName,
        signatoryRole: `${sanction.finalApproverRole} & Authorized Signatory`,
        signatoryBranch: sanction.branchName,
      },
    };

    // Mark previous letters as SUPERSEDED
    sanction.letters.forEach((l) => {
      if (l.status === 'GENERATED' || l.status === 'DRAFT') {
        l.status = 'SUPERSEDED';
      }
    });

    sanction.letters.unshift(letter);
    sanction.activeLetterId = letter.id;

    sanction.history.push({
      id: `shist_${Date.now()}`,
      sanctionId: sanction.id,
      timestamp: `${today} ${nowTime}`,
      event: 'LETTER_GENERATED',
      actor: finalActorName,
      actorRole: finalActorRole,
      previousState: sanction.status,
      newState: sanction.status,
      version: sanction.versions.length,
      notes: `Sanction Letter Version ${versionNum} generated.${reasonForRegeneration ? ` Regeneration Reason: ${reasonForRegeneration}` : ''}`,
    });

    this.notify();
    return letter;
  }

  public issueSanctionLetter(
    sanctionId: string,
    letterId: string,
    actorName: string = 'Loan Officer',
    actorRole: string = 'Loan Officer'
  ): SanctionRecord {
    const sanction = this.sanctions.find((s) => s.id === sanctionId);
    if (!sanction) throw new Error('Sanction not found');

    const letter = sanction.letters.find((l) => l.id === letterId);
    if (!letter) throw new Error('Sanction letter not found');

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    letter.status = 'ISSUED';
    letter.issuedAt = `${today} ${nowTime}`;
    letter.issuedBy = actorName;
    letter.issuedByRole = actorRole;

    sanction.history.push({
      id: `shist_${Date.now()}`,
      sanctionId: sanction.id,
      timestamp: `${today} ${nowTime}`,
      event: 'LETTER_ISSUED',
      actor: actorName,
      actorRole: actorRole,
      previousState: sanction.status,
      newState: sanction.status,
      version: sanction.versions.length,
      notes: `Sanction Letter Version ${letter.version} formally issued to borrower.`,
    });

    this.notify();
    return sanction;
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
    const sanction = this.sanctions.find((s) => s.id === sanctionId);
    if (!sanction) {
      return {
        valid: false,
        errors: ['Sanction record not found'],
        warnings: [],
        isSodRestricted: false,
        blockers: ['Sanction record not found'],
      };
    }

    const blockers: string[] = [];
    const warnings: string[] = [];

    // SoD Check
    const sodCheck = this.checkSanctionSegregationOfDuties(sanctionId, undefined, currentUserName);
    const isSodRestricted = !sodCheck.allowed;

    // 1. Approval Check
    const approval = this.approvals.find((a) => a.id === sanction.approvalId);
    if (!approval || approval.status !== 'APPROVED') {
      blockers.push('Final Credit Committee approval is not completed or is not in APPROVED state.');
    }

    // 2. Customer & KYC Check
    const customer = this.customers.find((c) => c.id === sanction.customerId);
    if (!customer || customer.status !== 'ACTIVE') {
      blockers.push('Borrower customer profile is inactive or missing.');
    }
    const kyc = this.kycRecords.find((k) => k.customerId === sanction.customerId);
    if (!kyc || kyc.status !== 'VERIFIED') {
      blockers.push(`Customer KYC status is not verified (Current: ${kyc ? kyc.status : 'MISSING'}).`);
    }

    // 3. Pre-Sanction Conditions Check
    const openPreSanction = sanction.conditions.filter(
      (c) => c.requiredBefore === 'SANCTION' && c.status === 'OPEN'
    );
    if (openPreSanction.length > 0) {
      blockers.push(`${openPreSanction.length} mandatory Pre-Sanction condition(s) are still OPEN.`);
    }

    // 4. Term Deviations Warning
    if (sanction.terms.isDeviatedFromApproval && !sanction.termDeviationReason) {
      blockers.push('Sanction terms differ from approved terms but no deviation justification was provided.');
    }

    // 5. Letter Warning
    if (sanction.letters.length === 0) {
      warnings.push('Sanction letter has not been generated yet. It is recommended to generate one.');
    }

    return {
      valid: blockers.length === 0 && !isSodRestricted,
      errors: blockers,
      warnings,
      isSodRestricted,
      blockers,
    };
  }

  public checkSanctionSegregationOfDuties(
    sanctionId: string,
    currentUserId?: string,
    currentUserName?: string
  ): { allowed: boolean; reason?: string } {
    const sanction = this.sanctions.find((s) => s.id === sanctionId);
    if (!sanction) return { allowed: false, reason: 'Sanction record not found' };

    // Segregation of duties: User who approved the loan application at final credit stage cannot confirm sanction
    const finalApprover = sanction.finalApproverName.toLowerCase();
    const currentUser = (currentUserName || '').toLowerCase();

    if (currentUser && finalApprover && (currentUser.includes(finalApprover) || finalApprover.includes(currentUser))) {
      return {
        allowed: false,
        reason: `Segregation of Duties (SoD) Conflict: ${sanction.finalApproverName} performed the final credit approval for this application and is legally barred from confirming the loan sanction. An independent authority must confirm this sanction.`,
      };
    }

    return { allowed: true };
  }

  public confirmSanction(
    sanctionId: string,
    actorName: string = 'Regional Credit Manager',
    actorRole: string = 'Regional Credit Manager',
    actorId?: string
  ): { success: boolean; message?: string; error?: string; sanction?: SanctionRecord } {
    const sanction = this.sanctions.find((s) => s.id === sanctionId);
    if (!sanction) return { success: false, error: 'Sanction record not found' };

    if (sanction.status === 'SANCTIONED') {
      return { success: false, error: 'Sanction is already confirmed and finalized.' };
    }

    // 1. SoD check
    const sodCheck = this.checkSanctionSegregationOfDuties(sanctionId, actorId, actorName);
    if (!sodCheck.allowed) {
      return { success: false, error: sodCheck.reason };
    }

    // 2. Prerequisites validation
    const validation = this.validateSanctionPrerequisites(sanctionId);
    if (!validation.valid) {
      return {
        success: false,
        error: `Cannot confirm sanction due to ${validation.blockers.length} blocker(s): ${validation.blockers.join(' | ')}`,
      };
    }

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const prev = sanction.status;

    sanction.status = 'SANCTIONED';
    sanction.sanctionDate = today;
    sanction.sanctionedBy = actorName;
    sanction.sanctionedByRole = actorRole;
    sanction.confirmedBy = actorName;
    sanction.confirmedDate = today;

    // Update application state
    const app = this.applications.find((a) => a.id === sanction.applicationId);
    if (app) {
      app.status = 'SANCTIONED';
      (app as any).sanctionedAmount = sanction.terms.amount;
      app.notes = `Sanction Confirmed: ₹${sanction.terms.amount.toLocaleString('en-IN')} @ ${sanction.terms.interestRate}% for ${sanction.terms.tenureMonths}m by ${actorName}.`;
      this.logApplicationHistory(app.id, {
        eventType: 'STATUS_CHANGED',
        actor: actorName,
        actorRole,
        description: 'Sanction Formally Confirmed',
        details: `Sanction Ref: ${sanction.sanctionNumber}, Amount: ₹${sanction.terms.amount.toLocaleString('en-IN')}`,
      });
    }

    const newVersionNum = sanction.versions.length + 1;
    sanction.versions.push({
      version: newVersionNum,
      snapshotDate: `${today} ${nowTime}`,
      actor: actorName,
      actorRole,
      amount: sanction.terms.amount,
      tenureMonths: sanction.terms.tenureMonths,
      interestRate: sanction.terms.interestRate,
      processingFee: sanction.terms.processingFee,
      documentationCharge: sanction.terms.documentationCharge,
      conditionsCount: sanction.conditions.length,
      letterVersion: sanction.letters.length,
      changeDescription: `Sanction confirmed by ${actorName} (${actorRole}).`,
      reason: 'Sanction Confirmation',
    });

    sanction.history.push({
      id: `shist_${Date.now()}`,
      sanctionId: sanction.id,
      timestamp: `${today} ${nowTime}`,
      event: 'SANCTION_CONFIRMED',
      actor: actorName,
      actorRole,
      previousState: prev,
      newState: 'SANCTIONED',
      version: newVersionNum,
      notes: `Sanction formally confirmed for ₹${sanction.terms.amount.toLocaleString('en-IN')} by ${actorName} (${actorRole}).`,
    });

    this.notify();
    return { success: true, message: `Sanction ${sanction.sanctionNumber} confirmed successfully.`, sanction };
  }

  public returnSanction(
    sanctionId: string,
    reason: string,
    corrections: string,
    actorName: string = 'Branch Credit Manager',
    actorRole: string = 'Branch Credit Manager'
  ): SanctionRecord {
    const sanction = this.sanctions.find((s) => s.id === sanctionId);
    if (!sanction) throw new Error('Sanction not found');

    if (sanction.status === 'SANCTIONED' || sanction.status === 'CANCELLED') {
      throw new Error(`Cannot return sanction in ${sanction.status} state.`);
    }

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const prev = sanction.status;

    sanction.status = 'RETURNED';
    sanction.returnedReason = reason;
    sanction.returnedCorrection = corrections;
    sanction.returnedBy = actorName;
    sanction.returnedDate = `${today} ${nowTime}`;

    sanction.history.push({
      id: `shist_${Date.now()}`,
      sanctionId: sanction.id,
      timestamp: `${today} ${nowTime}`,
      event: 'SANCTION_RETURNED',
      actor: actorName,
      actorRole,
      previousState: prev,
      newState: 'RETURNED',
      version: sanction.versions.length,
      notes: `Sanction returned: ${reason}. Required corrections: ${corrections}`,
    });

    this.notify();
    return sanction;
  }

  public cancelSanction(
    sanctionId: string,
    reason: string,
    actorName: string = 'Senior Credit Authority',
    actorRole: string = 'Senior Credit Authority'
  ): SanctionRecord {
    const sanction = this.sanctions.find((s) => s.id === sanctionId);
    if (!sanction) throw new Error('Sanction not found');

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const prev = sanction.status;

    sanction.status = 'CANCELLED';
    sanction.cancelledReason = reason;
    sanction.cancelledBy = actorName;
    sanction.cancelledDate = `${today} ${nowTime}`;

    sanction.history.push({
      id: `shist_${Date.now()}`,
      sanctionId: sanction.id,
      timestamp: `${today} ${nowTime}`,
      event: 'SANCTION_CANCELLED',
      actor: actorName,
      actorRole,
      previousState: prev,
      newState: 'CANCELLED',
      version: sanction.versions.length,
      notes: `Sanction cancelled. Audit justification: ${reason}`,
    });

    this.notify();
    return sanction;
  }

  public getPreDisbursementReadiness(sanctionId: string): PreDisbursementReadinessSummary {
    const sanction = this.sanctions.find((s) => s.id === sanctionId);
    if (!sanction) {
      return {
        sanctionId,
        overallStatus: 'BLOCKED',
        isDisbursementReady: false,
        passedCount: 0,
        pendingCount: 0,
        blockedCount: 1,
        totalCount: 1,
        checks: [
          {
            id: 'chk_missing',
            sanctionId,
            key: 'SANCTION_MISSING',
            title: 'Sanction Record Exists',
            category: 'SANCTION',
            status: 'BLOCKED',
            source: 'SYSTEM',
            blocking: true,
            details: 'Sanction record not found in LMS database.',
          },
        ],
        blockers: ['Sanction record not found in system.'],
        blockerReasons: ['Sanction record not found in system.'],
        verifiedAt: new Date().toISOString(),
      };
    }

    const checks: ReadinessCheckItem[] = [];
    const blockers: string[] = [];

    // 1. Borrower KYC Status Check
    const customer = this.customers.find((c) => c.id === sanction.customerId);
    const kyc = this.kycRecords.find((k) => k.customerId === sanction.customerId);

    if (kyc?.status === 'VERIFIED') {
      checks.push({
        id: `chk_kyc_${sanction.id}`,
        sanctionId,
        key: 'KYC_STATUS_VERIFIED',
        title: 'Borrower KYC Verification',
        category: 'CUSTOMER',
        status: 'PASS',
        source: 'KYC Compliance Engine',
        blocking: true,
        details: `KYC verified at ${kyc.kycLevel} level. C-KYC: ${kyc.cKycNumber || 'Available'}.`,
        actionLabel: 'View KYC',
        actionTarget: 'kyc',
      });
    } else {
      const isBlocked = kyc?.status === 'REJECTED' || kyc?.status === 'SUSPENDED';
      checks.push({
        id: `chk_kyc_${sanction.id}`,
        sanctionId,
        key: 'KYC_STATUS_VERIFIED',
        title: 'Borrower KYC Verification',
        category: 'CUSTOMER',
        status: isBlocked ? 'BLOCKED' : 'PENDING',
        source: 'KYC Compliance Engine',
        blocking: true,
        details: `Borrower KYC status is ${kyc?.status || 'UNVERIFIED'}. Full verification required prior to disbursement.`,
        actionLabel: 'Complete KYC',
        actionTarget: 'kyc',
      });
      blockers.push(`Borrower KYC is ${kyc?.status || 'UNVERIFIED'}.`);
    }

    // 2. Approval Validation
    const approval = this.approvals.find((a) => a.id === sanction.approvalId);
    if (approval?.status === 'APPROVED') {
      checks.push({
        id: `chk_appr_${sanction.id}`,
        sanctionId,
        key: 'APPROVAL_RECORD_VALIDATED',
        title: 'Credit Approval Sign-off',
        category: 'APPROVAL',
        status: 'PASS',
        source: 'Approval Workflow',
        blocking: true,
        details: `Approved by ${approval.levels?.[0]?.assignedToName || 'Authority'} for ₹${(approval.approvedAmount || sanction.approvedAmount).toLocaleString('en-IN')}.`,
        actionLabel: 'View Approval',
        actionTarget: 'approval',
      });
    } else {
      checks.push({
        id: `chk_appr_${sanction.id}`,
        sanctionId,
        key: 'APPROVAL_RECORD_VALIDATED',
        title: 'Credit Approval Sign-off',
        category: 'APPROVAL',
        status: 'BLOCKED',
        source: 'Approval Workflow',
        blocking: true,
        details: 'Originating approval record is not in APPROVED state.',
        actionLabel: 'Check Approval',
        actionTarget: 'approval',
      });
      blockers.push('Credit approval sign-off is missing or invalid.');
    }

    // 3. Sanction Confirmation Check
    if (sanction.status === 'SANCTIONED') {
      checks.push({
        id: `chk_sanc_${sanction.id}`,
        sanctionId,
        key: 'SANCTION_CONFIRMED',
        title: 'Sanction Confirmation Status',
        category: 'SANCTION',
        status: 'PASS',
        source: 'Sanction Management',
        blocking: true,
        details: `Sanction formally confirmed by ${sanction.confirmedBy || sanction.sanctionedBy || sanction.finalApproverName}.`,
        actionLabel: 'View Sanction',
        actionTarget: 'sanction',
      });
    } else {
      checks.push({
        id: `chk_sanc_${sanction.id}`,
        sanctionId,
        key: 'SANCTION_CONFIRMED',
        title: 'Sanction Confirmation Status',
        category: 'SANCTION',
        status: 'BLOCKED',
        source: 'Sanction Management',
        blocking: true,
        details: `Sanction is currently in ${sanction.status} status. Confirmation required before disbursement booking.`,
        actionLabel: 'Confirm Sanction',
        actionTarget: 'sanction',
      });
      blockers.push('Sanction confirmation is pending.');
    }

    // 4. Documents Check
    const app = this.applications.find((a) => a.id === sanction.applicationId);
    const appDocs = app?.documents || [];
    const rejectedDocs = appDocs.filter((d: any) => d.status === 'REJECTED');
    const pendingDocs = appDocs.filter((d: any) => d.status === 'PENDING' || d.status === 'UPLOADED' || d.status === 'PENDING_VERIFICATION');

    if (rejectedDocs.length > 0) {
      checks.push({
        id: `chk_docs_${sanction.id}`,
        sanctionId,
        key: 'MANDATORY_DOCUMENTS_VERIFIED',
        title: 'Application Documents & Agreements',
        category: 'DOCUMENTS',
        status: 'BLOCKED',
        source: 'Documents Module',
        blocking: true,
        details: `${rejectedDocs.length} mandatory document(s) were REJECTED during audit: ${rejectedDocs.map((d: any) => d.documentTitle || d.documentName || d.documentType).join(', ')}.`,
        actionLabel: 'Review Documents',
        actionTarget: 'documents',
      });
      blockers.push(`${rejectedDocs.length} application document(s) are in REJECTED state.`);
    } else if (pendingDocs.length > 0) {
      checks.push({
        id: `chk_docs_${sanction.id}`,
        sanctionId,
        key: 'MANDATORY_DOCUMENTS_VERIFIED',
        title: 'Application Documents & Agreements',
        category: 'DOCUMENTS',
        status: 'PENDING',
        source: 'Documents Module',
        blocking: true,
        details: `${pendingDocs.length} document(s) pending verification: ${pendingDocs.map((d: any) => d.documentTitle || d.documentName || d.documentType).join(', ')}.`,
        actionLabel: 'Verify Documents',
        actionTarget: 'documents',
      });
      blockers.push(`${pendingDocs.length} loan document(s) pending verification.`);
    } else {
      checks.push({
        id: `chk_docs_${sanction.id}`,
        sanctionId,
        key: 'MANDATORY_DOCUMENTS_VERIFIED',
        title: 'Application Documents & Agreements',
        category: 'DOCUMENTS',
        status: 'PASS',
        source: 'Documents Module',
        blocking: true,
        details: 'All required application documents and legal agreements verified.',
        actionLabel: 'View Documents',
        actionTarget: 'documents',
      });
    }

    // 5. Pre-Disbursement Conditions Check
    const openPreDisbConditions = sanction.conditions.filter(
      (c) => c.requiredBefore === 'DISBURSEMENT' && c.status === 'OPEN'
    );
    const completedPreDisbConditions = sanction.conditions.filter(
      (c) => c.requiredBefore === 'DISBURSEMENT' && (c.status === 'COMPLETED' || c.status === 'WAIVED')
    );

    if (openPreDisbConditions.length > 0) {
      checks.push({
        id: `chk_cond_${sanction.id}`,
        sanctionId,
        key: 'PRE_DISBURSEMENT_CONDITIONS',
        title: 'Pre-Disbursement Covenants & Conditions',
        category: 'CONDITIONS',
        status: 'PENDING',
        source: 'Sanction Conditions',
        blocking: true,
        details: `${openPreDisbConditions.length} mandatory Pre-Disbursement condition(s) open: ${openPreDisbConditions.map((c) => c.description).slice(0, 2).join('; ')}...`,
        actionLabel: 'Manage Conditions',
        actionTarget: 'conditions',
      });
      blockers.push(`${openPreDisbConditions.length} pre-disbursement condition(s) unresolved.`);
    } else {
      checks.push({
        id: `chk_cond_${sanction.id}`,
        sanctionId,
        key: 'PRE_DISBURSEMENT_CONDITIONS',
        title: 'Pre-Disbursement Covenants & Conditions',
        category: 'CONDITIONS',
        status: 'PASS',
        source: 'Sanction Conditions',
        blocking: true,
        details: `All ${completedPreDisbConditions.length} pre-disbursement covenants and conditions completed or waived.`,
        actionLabel: 'View Conditions',
        actionTarget: 'conditions',
      });
    }

    // 6. Bank Account & Penny Drop Check
    if (customer && customer.accountNumber && customer.ifscCode) {
      checks.push({
        id: `chk_bank_${sanction.id}`,
        sanctionId,
        key: 'BANK_ACCOUNT_PENNY_DROP',
        title: 'Disbursement Bank Account & Penny-Drop',
        category: 'BANKING',
        status: 'PASS',
        source: 'Core Banking Integration',
        blocking: true,
        details: `Bank: ${customer.bankName || 'Verified Primary Bank'}, A/C: ${customer.accountNumberMasked || customer.accountNumber}, IFSC: ${customer.ifscCode}. Name match score 99%.`,
        actionLabel: 'View Bank Details',
        actionTarget: 'customer',
      });
    } else {
      checks.push({
        id: `chk_bank_${sanction.id}`,
        sanctionId,
        key: 'BANK_ACCOUNT_PENNY_DROP',
        title: 'Disbursement Bank Account & Penny-Drop',
        category: 'BANKING',
        status: 'PENDING',
        source: 'Core Banking Integration',
        blocking: true,
        details: 'Borrower bank account and penny-drop verification missing.',
        actionLabel: 'Update Bank Details',
        actionTarget: 'customer',
      });
      blockers.push('Disbursement bank account not configured.');
    }

    // 7. Policy Exceptions Check
    const approvalExceptions = approval?.exceptions || [];
    const openExceptions = approvalExceptions.filter((e) => e.status === 'PENDING' || (e.status as any) === 'ROUTED');

    if (openExceptions.length > 0) {
      checks.push({
        id: `chk_exc_${sanction.id}`,
        sanctionId,
        key: 'POLICY_EXCEPTIONS_CLEARED',
        title: 'Credit Policy Exceptions & Deviations',
        category: 'EXCEPTIONS',
        status: 'BLOCKED',
        source: 'Credit Governance',
        blocking: true,
        details: `${openExceptions.length} credit policy exception(s) pending higher authority resolution.`,
        actionLabel: 'Review Exceptions',
        actionTarget: 'approval',
      });
      blockers.push(`${openExceptions.length} unresolved credit exceptions.`);
    } else {
      checks.push({
        id: `chk_exc_${sanction.id}`,
        sanctionId,
        key: 'POLICY_EXCEPTIONS_CLEARED',
        title: 'Credit Policy Exceptions & Deviations',
        category: 'EXCEPTIONS',
        status: 'PASS',
        source: 'Credit Governance',
        blocking: true,
        details: 'Zero blocking credit deviations or policy exceptions.',
        actionLabel: 'View Governance',
        actionTarget: 'approval',
      });
    }

    const passedCount = checks.filter((c) => c.status === 'PASS').length;
    const pendingCount = checks.filter((c) => c.status === 'PENDING').length;
    const blockedCount = checks.filter((c) => c.status === 'BLOCKED').length;

    let overallStatus: 'READY' | 'NOT_READY' | 'BLOCKED' = 'READY';
    if (blockedCount > 0) {
      overallStatus = 'BLOCKED';
    } else if (pendingCount > 0) {
      overallStatus = 'NOT_READY';
    }

    return {
      sanctionId,
      overallStatus,
      isDisbursementReady: overallStatus === 'READY',
      passedCount,
      pendingCount,
      blockedCount,
      totalCount: checks.length,
      checks,
      blockers,
      blockerReasons: blockers,
      verifiedAt: new Date().toISOString(),
    };
  }

  // ----------------------------------------------------
  // Batch 9 - Disbursement Management, Maker-Checker & Transactions
  // ----------------------------------------------------

  public getDisbursements(): DisbursementRecord[] {
    return [...this.disbursements];
  }

  public getDisbursementById(id: string): DisbursementRecord | undefined {
    return this.disbursements.find((d) => d.id === id || d.disbursementNumber === id);
  }

  public getDisbursementBySanctionId(sanctionId: string): DisbursementRecord | undefined {
    return this.disbursements.find((d) => d.sanctionId === sanctionId);
  }

  public getDisbursementByApplicationId(applicationId: string): DisbursementRecord | undefined {
    return this.disbursements.find((d) => d.applicationId === applicationId);
  }

  public evaluateDisbursementReadiness(sanctionId: string): DisbursementReadinessResult {
    const sanction = this.sanctions.find((s) => s.id === sanctionId || s.sanctionNumber === sanctionId);
    if (!sanction) {
      return {
        isEligible: false,
        totalChecks: 0,
        passedChecks: 0,
        pendingChecks: 0,
        blockedChecks: 1,
        checks: [
          {
            id: 'chk_missing_sanction',
            category: 'SANCTION',
            title: 'Sanction Record Missing',
            description: 'Valid confirmed sanction must exist.',
            status: 'BLOCKED',
            source: 'Sanction Management',
            reason: 'Sanction not found.',
          },
        ],
      };
    }

    const application = this.applications.find((a) => a.id === sanction.applicationId || a.applicationNumber === sanction.applicationNumber);
    const customer = this.customers.find((c) => c.id === sanction.customerId || c.customerNumber === sanction.customerNumber);
    const kyc = this.kycRecords.find((k) => k.customerId === sanction.customerId || (customer && k.customerId === customer.id));
    const approval = this.approvals.find((ap) => ap.id === sanction.approvalId || ap.applicationId === sanction.applicationId);
    const conditions = sanction.conditions || [];
    const openConditions = conditions.filter((c) => c.requiredBefore === 'DISBURSEMENT' && c.status === 'OPEN');

    const checks: DisbursementReadinessCheck[] = [];

    // 1. Customer Active & KYC Check
    const isKycValid = !!(customer && (customer.status === 'ACTIVE' || kyc?.status === 'VERIFIED'));
    checks.push({
      id: 'chk_kyc',
      category: 'CUSTOMER',
      title: 'Customer Identity & KYC Verification',
      description: 'Borrower KYC must be fully verified (Aadhaar/PAN/Video KYC) with no AML flags.',
      status: isKycValid ? 'PASS' : 'BLOCKED',
      source: 'Customer / KYC Module',
      reason: isKycValid ? undefined : 'Customer KYC is unverified or customer is inactive.',
      verifiedAt: isKycValid ? new Date().toISOString() : undefined,
      verifiedBy: isKycValid ? 'Compliance Automation' : undefined,
    });

    // 2. Application Status Check
    const isAppEligible = sanction.status === 'SANCTIONED' || (application && (application.status === 'SANCTIONED' || application.status === 'APPROVED'));
    checks.push({
      id: 'chk_app',
      category: 'APPLICATION',
      title: 'Loan Application Eligibility & Workflow State',
      description: 'Application must be in approved/sanctioned status with valid terms.',
      status: isAppEligible ? 'PASS' : 'BLOCKED',
      source: 'Application Engine',
      reason: isAppEligible ? undefined : `Application status is ${application?.status || 'UNKNOWN'}.`,
    });

    // 3. Approval Record Check
    const isApprovalValid = sanction.status === 'SANCTIONED' || (approval && approval.status === 'APPROVED');
    checks.push({
      id: 'chk_approval',
      category: 'APPROVAL',
      title: 'Credit Committee Final Approval',
      description: 'Final multi-level approval must be in place and not cancelled or expired.',
      status: isApprovalValid ? 'PASS' : 'BLOCKED',
      source: 'Credit Governance',
      reason: isApprovalValid ? undefined : 'Final credit committee approval is missing or unapproved.',
    });

    // 4. Sanction Confirmation Check
    const isSanctionConfirmed = sanction.status === 'SANCTIONED';
    checks.push({
      id: 'chk_sanction',
      category: 'SANCTION',
      title: 'Sanction Confirmation & Acceptance',
      description: 'Sanction letter must be generated, issued, and confirmed by authority.',
      status: isSanctionConfirmed ? 'PASS' : (sanction.status === 'DRAFT' || sanction.status === 'UNDER_REVIEW' ? 'PENDING' : 'BLOCKED'),
      source: 'Sanction Management',
      reason: isSanctionConfirmed ? undefined : `Sanction is in ${sanction.status} status. Needs confirmation.`,
    });

    // 5. Pre-Disbursement Mandatory Conditions Check
    checks.push({
      id: 'chk_conditions',
      category: 'CONDITIONS',
      title: 'Pre-Disbursement Conditions Compliance',
      description: 'All mandatory conditions flagged for completion before disbursement must be satisfied.',
      status: openConditions.length === 0 ? 'PASS' : 'BLOCKED',
      source: 'Sanction Conditions Hub',
      reason: openConditions.length === 0 ? undefined : `${openConditions.length} pre-disbursement condition(s) pending compliance.`,
      blockingDetails: openConditions.length > 0 ? openConditions.map((c) => c.description).join('; ') : undefined,
    });

    // 6. Mandatory Documents Verification Check
    const appDocs = application?.documents || [];
    const unverifiedMandatoryDocs = appDocs.filter((d) => d.isMandatory && d.status !== 'VERIFIED');
    checks.push({
      id: 'chk_docs',
      category: 'DOCUMENTS',
      title: 'Mandatory Loan Documents Verification',
      description: 'All mandatory loan contract, income, and security documents must be verified.',
      status: unverifiedMandatoryDocs.length === 0 ? 'PASS' : 'BLOCKED',
      source: 'Document Hub',
      reason: unverifiedMandatoryDocs.length === 0 ? undefined : `${unverifiedMandatoryDocs.length} mandatory document(s) unverified.`,
    });

    // 7. Banking & Beneficiary Details Check
    const customerHasBank = !!(customer?.accountNumber || customer?.accountNumberMasked || customer?.ifscCode);
    checks.push({
      id: 'chk_bank',
      category: 'BANKING',
      title: 'Beneficiary Bank Account & Mandate Verification',
      description: 'Verified beneficiary bank account details and payment mandate must be present.',
      status: customerHasBank ? 'PASS' : 'PENDING',
      source: 'Core Banking / KYC',
      reason: customerHasBank ? undefined : 'Customer bank account or IFSC details missing.',
    });

    const passedChecks = checks.filter((c) => c.status === 'PASS').length;
    const pendingChecks = checks.filter((c) => c.status === 'PENDING').length;
    const blockedChecks = checks.filter((c) => c.status === 'BLOCKED').length;

    return {
      isEligible: blockedChecks === 0 && pendingChecks === 0,
      totalChecks: checks.length,
      passedChecks,
      pendingChecks,
      blockedChecks,
      checks,
    };
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
    const sanction = this.sanctions.find((s) => s.id === params.sanctionId || s.sanctionNumber === params.sanctionId);
    if (!sanction) {
      throw new Error('Sanction record not found.');
    }

    if (sanction.status !== 'SANCTIONED') {
      throw new Error(`Cannot create disbursement request for sanction in status "${sanction.status}". Sanction must be confirmed first.`);
    }

    if (params.requestedAmount <= 0) {
      throw new Error('Requested disbursement amount must be greater than zero.');
    }

    let disbursement = this.disbursements.find((d) => d.sanctionId === sanction.id);

    if (!disbursement) {
      // Create new top-level disbursement record
      const dsbNumber = `DSB-2026-${String(this.nextDisbursementSeq++).padStart(6, '0')}`;
      const defaultBeneficiary: DisbursementBeneficiaryRecord = {
        id: `ben_${Date.now()}`,
        disbursementId: `dsb_${Date.now()}`,
        beneficiaryType: 'PRIMARY_BORROWER',
        beneficiaryName: sanction.customerName,
        bankName: 'HDFC Bank Ltd',
        accountNumber: '50200084920192',
        accountNumberMasked: '•••• •••• •••• 0192',
        ifscCode: 'HDFC0000120',
        accountType: 'SAVINGS',
        verificationStatus: 'VERIFIED',
        verificationSource: 'Aadhaar e-KYC Penny Drop',
        createdAt: new Date().toISOString(),
      };

      disbursement = {
        id: `dsb_${Date.now()}`,
        disbursementNumber: dsbNumber,
        applicationId: sanction.applicationId,
        applicationNumber: sanction.applicationNumber,
        sanctionId: sanction.id,
        sanctionNumber: sanction.sanctionNumber,
        customerId: sanction.customerId,
        customerNumber: sanction.customerNumber,
        customerName: sanction.customerName,
        customerMobile: sanction.customerMobile,
        productCode: sanction.productCode,
        productName: sanction.productName,
        branchId: sanction.branchId,
        branchName: sanction.branchName,
        sanctionAmount: sanction.approvedAmount,
        totalDisbursedAmount: 0,
        remainingAmount: sanction.approvedAmount,
        status: 'DRAFT',
        beneficiaries: [defaultBeneficiary],
        requests: [],
        transactions: [],
        history: [
          {
            id: `dh_${Date.now()}`,
            disbursementId: `dsb_${Date.now()}`,
            timestamp: new Date().toISOString(),
            event: 'DISBURSEMENT_CREATED',
            actor: params.actorId,
            actorName: params.actorName,
            actorRole: params.actorRole,
            newState: 'DRAFT',
            amount: sanction.approvedAmount,
            notes: `Disbursement file initialized for Sanction ${sanction.sanctionNumber}.`,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.disbursements.unshift(disbursement);
    }

    // Critical Invariant: Check remaining amount
    if (params.requestedAmount > disbursement.remainingAmount) {
      throw new Error(
        `Requested amount (₹${params.requestedAmount.toLocaleString('en-IN')}) exceeds the remaining sanction amount (₹${disbursement.remainingAmount.toLocaleString('en-IN')}).`
      );
    }

    // Handle beneficiary
    let selectedBeneficiaryId = params.beneficiaryId;
    if (params.newBeneficiary) {
      const maskedAcct = params.newBeneficiary.accountNumber.length > 4
        ? `•••• •••• •••• ${params.newBeneficiary.accountNumber.slice(-4)}`
        : params.newBeneficiary.accountNumber;
      
      const newBen: DisbursementBeneficiaryRecord = {
        id: `ben_${Date.now()}`,
        disbursementId: disbursement.id,
        beneficiaryType: params.newBeneficiary.beneficiaryType,
        beneficiaryName: params.newBeneficiary.beneficiaryName,
        bankName: params.newBeneficiary.bankName,
        accountNumber: params.newBeneficiary.accountNumber,
        accountNumberMasked: maskedAcct,
        ifscCode: params.newBeneficiary.ifscCode,
        accountType: params.newBeneficiary.accountType,
        verificationStatus: 'VERIFIED',
        verificationSource: 'Direct Bank Mandate',
        createdAt: new Date().toISOString(),
      };
      disbursement.beneficiaries.push(newBen);
      selectedBeneficiaryId = newBen.id;
    } else if (!selectedBeneficiaryId && disbursement.beneficiaries.length > 0) {
      selectedBeneficiaryId = disbursement.beneficiaries[0].id;
    }

    const readiness = this.evaluateDisbursementReadiness(sanction.id);
    const reqNumber = `DREQ-2026-${String(this.nextDisbursementReqSeq++).padStart(6, '0')}`;

    const newRequest: DisbursementRequestRecord = {
      id: `dreq_${Date.now()}`,
      requestNumber: reqNumber,
      disbursementId: disbursement.id,
      applicationId: sanction.applicationId,
      sanctionId: sanction.id,
      requestedAmount: params.requestedAmount,
      disbursementType: params.disbursementType,
      beneficiaryId: selectedBeneficiaryId,
      beneficiary: disbursement.beneficiaries.find((b) => b.id === selectedBeneficiaryId),
      paymentMethod: params.paymentMethod,
      purpose: params.purpose || `${params.disbursementType === 'FULL' ? 'Full' : 'Partial'} payout against sanction ${sanction.sanctionNumber}`,
      notes: params.notes,
      status: 'PENDING_APPROVAL',
      readinessChecks: readiness,
      requestedBy: params.actorId,
      requestedByName: params.actorName,
      requestedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    disbursement.requests.unshift(newRequest);
    disbursement.status = 'PENDING_APPROVAL';
    disbursement.updatedAt = new Date().toISOString();

    disbursement.history.unshift({
      id: `dh_${Date.now()}`,
      disbursementId: disbursement.id,
      requestId: newRequest.id,
      timestamp: new Date().toISOString(),
      event: 'REQUEST_CREATED',
      actor: params.actorId,
      actorName: params.actorName,
      actorRole: params.actorRole,
      newState: 'PENDING_APPROVAL',
      amount: params.requestedAmount,
      notes: `${params.disbursementType} disbursement request ${reqNumber} submitted for ₹${params.requestedAmount.toLocaleString('en-IN')}.`,
    });

    this.notify();
    return disbursement;
  }

  public assignDisbursement(disbursementId: string, requestId: string, assignedToId: string, assignedToName: string, actor: string) {
    const dsb = this.disbursements.find((d) => d.id === disbursementId);
    if (!dsb) throw new Error('Disbursement not found.');

    const req = dsb.requests.find((r) => r.id === requestId);
    if (!req) throw new Error('Disbursement request not found.');

    req.assignedTo = assignedToId;
    req.assignedToName = assignedToName;
    req.assignedAt = new Date().toISOString();
    req.updatedAt = new Date().toISOString();

    dsb.history.unshift({
      id: `dh_${Date.now()}`,
      disbursementId: dsb.id,
      requestId: req.id,
      timestamp: new Date().toISOString(),
      event: 'ASSIGNED',
      actor,
      actorName: actor,
      actorRole: 'Operations Officer',
      notes: `Request assigned to ${assignedToName} for checker review.`,
    });

    this.notify();
    return dsb;
  }

  public approveDisbursement(
    disbursementId: string,
    requestId: string,
    approverName: string,
    approverRole: string,
    notes?: string
  ): DisbursementRecord {
    const dsb = this.disbursements.find((d) => d.id === disbursementId);
    if (!dsb) throw new Error('Disbursement not found.');

    const req = dsb.requests.find((r) => r.id === requestId);
    if (!req) throw new Error('Disbursement request not found.');

    if (req.status !== 'PENDING_APPROVAL') {
      throw new Error(`Cannot approve request in status "${req.status}". Must be in PENDING_APPROVAL.`);
    }

    // Segregation of Duties Enforcement (Maker != Checker)
    if (req.requestedByName && req.requestedByName.trim().toLowerCase() === approverName.trim().toLowerCase()) {
      throw new Error(
        'Segregation of Duties Violation: You cannot approve a disbursement request created by yourself. A separate checker/approver is required.'
      );
    }

    // Server-side readiness check
    const readiness = this.evaluateDisbursementReadiness(dsb.sanctionId);
    if (!readiness.isEligible) {
      throw new Error(
        `Disbursement cannot be approved: ${readiness.blockedChecks} blocking check(s) and ${readiness.pendingChecks} pending check(s) must be resolved first.`
      );
    }

    req.status = 'APPROVED';
    req.approvedBy = approverName;
    req.approvedByName = approverName;
    req.approvedAt = new Date().toISOString();
    req.approvalNotes = notes || 'Approved for transaction processing.';
    req.updatedAt = new Date().toISOString();

    dsb.status = 'APPROVED';
    dsb.updatedAt = new Date().toISOString();

    dsb.history.unshift({
      id: `dh_${Date.now()}`,
      disbursementId: dsb.id,
      requestId: req.id,
      timestamp: new Date().toISOString(),
      event: 'APPROVED',
      actor: approverName,
      actorName: approverName,
      actorRole: approverRole,
      previousState: 'PENDING_APPROVAL',
      newState: 'APPROVED',
      amount: req.requestedAmount,
      notes: `Disbursement request ${req.requestNumber} approved by ${approverName} (${approverRole}). Ready for transaction.`,
    });

    this.notify();
    return dsb;
  }

  public rejectDisbursement(
    disbursementId: string,
    requestId: string,
    rejectorName: string,
    rejectorRole: string,
    reason: string
  ): DisbursementRecord {
    const dsb = this.disbursements.find((d) => d.id === disbursementId);
    if (!dsb) throw new Error('Disbursement not found.');

    const req = dsb.requests.find((r) => r.id === requestId);
    if (!req) throw new Error('Disbursement request not found.');

    req.status = 'REJECTED';
    req.rejectedBy = rejectorName;
    req.rejectedByName = rejectorName;
    req.rejectedAt = new Date().toISOString();
    req.rejectionReason = reason;
    req.updatedAt = new Date().toISOString();

    dsb.status = dsb.totalDisbursedAmount > 0 ? 'PARTIAL' as any : 'REJECTED';
    dsb.updatedAt = new Date().toISOString();

    dsb.history.unshift({
      id: `dh_${Date.now()}`,
      disbursementId: dsb.id,
      requestId: req.id,
      timestamp: new Date().toISOString(),
      event: 'REJECTED',
      actor: rejectorName,
      actorName: rejectorName,
      actorRole: rejectorRole,
      previousState: 'PENDING_APPROVAL',
      newState: 'REJECTED',
      amount: req.requestedAmount,
      notes: `Request ${req.requestNumber} rejected: ${reason}`,
    });

    this.notify();
    return dsb;
  }

  public returnDisbursement(
    disbursementId: string,
    requestId: string,
    actorName: string,
    actorRole: string,
    reason: string
  ): DisbursementRecord {
    const dsb = this.disbursements.find((d) => d.id === disbursementId);
    if (!dsb) throw new Error('Disbursement not found.');

    const req = dsb.requests.find((r) => r.id === requestId);
    if (!req) throw new Error('Disbursement request not found.');

    req.status = 'RETURNED';
    req.returnedBy = actorName;
    req.returnedByName = actorName;
    req.returnedAt = new Date().toISOString();
    req.returnReason = reason;
    req.updatedAt = new Date().toISOString();

    dsb.status = 'RETURNED';
    dsb.updatedAt = new Date().toISOString();

    dsb.history.unshift({
      id: `dh_${Date.now()}`,
      disbursementId: dsb.id,
      requestId: req.id,
      timestamp: new Date().toISOString(),
      event: 'RETURNED',
      actor: actorName,
      actorName: actorName,
      actorRole: actorRole,
      previousState: 'PENDING_APPROVAL',
      newState: 'RETURNED',
      amount: req.requestedAmount,
      notes: `Request returned for modification: ${reason}`,
    });

    this.notify();
    return dsb;
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
    const dsb = this.disbursements.find((d) => d.id === disbursementId);
    if (!dsb) throw new Error('Disbursement not found.');

    const req = dsb.requests.find((r) => r.id === requestId);
    if (!req) throw new Error('Disbursement request not found.');

    if (req.status !== 'APPROVED' && req.status !== 'FAILED') {
      throw new Error(`Cannot execute transaction for request in status "${req.status}". Request must be APPROVED.`);
    }

    const beneficiary = dsb.beneficiaries.find((b) => b.id === req.beneficiaryId) || dsb.beneficiaries[0];
    const txnRef = `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(this.nextTransactionSeq++).padStart(5, '0')}`;
    const generatedUtr = params.utrNumber || `${params.paymentMethod.slice(0, 4)}R${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Math.floor(100000 + Math.random() * 900000)}`;

    if (params.simulateFailure) {
      // Failed transaction
      const failedTxn: DisbursementTransactionRecord = {
        id: `txn_${Date.now()}`,
        transactionReference: txnRef,
        disbursementId: dsb.id,
        requestId: req.id,
        amount: req.requestedAmount,
        paymentMethod: params.paymentMethod,
        status: 'FAILED',
        beneficiaryName: beneficiary?.beneficiaryName || dsb.customerName,
        beneficiaryAccountNumberMasked: beneficiary?.accountNumberMasked || '•••• •••• •••• 0000',
        beneficiaryIfsc: beneficiary?.ifscCode || 'HDFC0000120',
        bankName: beneficiary?.bankName || 'HDFC Bank Ltd',
        externalReference: params.externalReference || 'BANK-ERR-502',
        failureReason: params.failureReason || 'Beneficiary bank network rejected the transaction / Account invalid.',
        processingStartedAt: new Date().toISOString(),
        failedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dsb.transactions.unshift(failedTxn);
      req.status = 'FAILED';
      dsb.status = 'FAILED';
      dsb.updatedAt = new Date().toISOString();

      dsb.history.unshift({
        id: `dh_${Date.now()}`,
        disbursementId: dsb.id,
        requestId: req.id,
        timestamp: new Date().toISOString(),
        event: 'TRANSACTION_FAILED',
        actor: actorName,
        actorName: actorName,
        actorRole: actorRole,
        previousState: 'PROCESSING',
        newState: 'FAILED',
        amount: req.requestedAmount,
        reference: failedTxn.transactionReference,
        notes: `Transaction payout failed: ${failedTxn.failureReason}`,
      });

      this.notify();
      return dsb;
    }

    // Successful transaction execution
    const newTxn: DisbursementTransactionRecord = {
      id: `txn_${Date.now()}`,
      transactionReference: txnRef,
      disbursementId: dsb.id,
      requestId: req.id,
      amount: req.requestedAmount,
      paymentMethod: params.paymentMethod,
      status: 'SUCCESSFUL',
      beneficiaryName: beneficiary?.beneficiaryName || dsb.customerName,
      beneficiaryAccountNumberMasked: beneficiary?.accountNumberMasked || '•••• •••• •••• 0000',
      beneficiaryIfsc: beneficiary?.ifscCode || 'HDFC0000120',
      bankName: beneficiary?.bankName || 'HDFC Bank Ltd',
      externalReference: params.externalReference || `EXT-${params.paymentMethod}-${Date.now()}`,
      utrNumber: generatedUtr,
      processingStartedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dsb.transactions.unshift(newTxn);
    req.status = 'SUCCESSFUL';
    req.updatedAt = new Date().toISOString();

    // Critical Invariant calculation
    dsb.totalDisbursedAmount += req.requestedAmount;
    dsb.remainingAmount = Math.max(0, dsb.sanctionAmount - dsb.totalDisbursedAmount);

    if (dsb.remainingAmount === 0) {
      dsb.status = 'SUCCESSFUL';
    } else {
      dsb.status = 'SUCCESSFUL'; // active successful tranche, can draft more
    }

    if (!dsb.firstDisbursedAt) {
      dsb.firstDisbursedAt = new Date().toISOString();
    }
    dsb.lastDisbursedAt = new Date().toISOString();
    dsb.updatedAt = new Date().toISOString();

    // Also update application status if full disbursement reached
    const app = this.applications.find((a) => a.id === dsb.applicationId);
    if (app && dsb.remainingAmount === 0) {
      app.status = 'DISBURSED';
    }

    dsb.history.unshift({
      id: `dh_${Date.now()}`,
      disbursementId: dsb.id,
      requestId: req.id,
      timestamp: new Date().toISOString(),
      event: 'TRANSACTION_SUCCESSFUL',
      actor: actorName,
      actorName: actorName,
      actorRole: actorRole,
      previousState: 'APPROVED',
      newState: 'SUCCESSFUL',
      amount: req.requestedAmount,
      reference: generatedUtr,
      notes: `Payout of ₹${req.requestedAmount.toLocaleString('en-IN')} successfully settled via ${params.paymentMethod}. UTR: ${generatedUtr}. Remaining Sanction: ₹${dsb.remainingAmount.toLocaleString('en-IN')}.`,
    });

    try {
      this.processLoanAccountOnDisbursement(dsb, req, newTxn, actorName, actorRole);
    } catch (loanErr) {
      console.warn('Could not auto-process loan account on disbursement:', loanErr);
    }

    this.notify();
    return dsb;
  }

  public reverseDisbursementTransaction(
    disbursementId: string,
    transactionId: string,
    reason: string,
    actorName: string,
    actorRole: string
  ): DisbursementRecord {
    const dsb = this.disbursements.find((d) => d.id === disbursementId);
    if (!dsb) throw new Error('Disbursement not found.');

    const txn = dsb.transactions.find((t) => t.id === transactionId);
    if (!txn) throw new Error('Transaction not found.');

    if (txn.status !== 'SUCCESSFUL') {
      throw new Error('Only successful transactions can be reversed.');
    }

    txn.status = 'REVERSED';
    txn.reversedAt = new Date().toISOString();
    txn.reversedBy = actorName;
    txn.reversalReason = reason;
    txn.updatedAt = new Date().toISOString();

    // Revert financial calculation
    dsb.totalDisbursedAmount = Math.max(0, dsb.totalDisbursedAmount - txn.amount);
    dsb.remainingAmount = dsb.sanctionAmount - dsb.totalDisbursedAmount;
    dsb.status = 'REVERSED';
    dsb.updatedAt = new Date().toISOString();

    if (txn.requestId) {
      const req = dsb.requests.find((r) => r.id === txn.requestId);
      if (req) {
        req.status = 'REVERSED';
        req.updatedAt = new Date().toISOString();
      }
    }

    dsb.history.unshift({
      id: `dh_${Date.now()}`,
      disbursementId: dsb.id,
      requestId: txn.requestId,
      timestamp: new Date().toISOString(),
      event: 'TRANSACTION_REVERSED',
      actor: actorName,
      actorName: actorName,
      actorRole: actorRole,
      previousState: 'SUCCESSFUL',
      newState: 'REVERSED',
      amount: txn.amount,
      reference: txn.transactionReference,
      notes: `Transaction ${txn.transactionReference} of ₹${txn.amount.toLocaleString('en-IN')} reversed. Reason: ${reason}. Restored Remaining Balance: ₹${dsb.remainingAmount.toLocaleString('en-IN')}.`,
    });

    this.notify();
    return dsb;
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
    const dsb = this.disbursements.find((d) => d.id === disbursementId);
    if (!dsb) throw new Error('Disbursement not found.');

    const maskedAcct = beneficiary.accountNumber.length > 4
      ? `•••• •••• •••• ${beneficiary.accountNumber.slice(-4)}`
      : beneficiary.accountNumber;

    const newBen: DisbursementBeneficiaryRecord = {
      id: `ben_${Date.now()}`,
      disbursementId,
      beneficiaryType: beneficiary.beneficiaryType,
      beneficiaryName: beneficiary.beneficiaryName,
      bankName: beneficiary.bankName,
      accountNumber: beneficiary.accountNumber,
      accountNumberMasked: maskedAcct,
      ifscCode: beneficiary.ifscCode,
      accountType: beneficiary.accountType,
      verificationStatus: 'VERIFIED',
      verificationSource: beneficiary.verificationSource || 'Manual Entry & Verification',
      createdAt: new Date().toISOString(),
    };

    dsb.beneficiaries.push(newBen);
    dsb.updatedAt = new Date().toISOString();
    this.notify();
    return newBen;
  }

  public getDisbursementKPIs(): DisbursementKPIsData {
    let totalSanctionedAmount = 0;
    let totalDisbursedAmount = 0;
    let totalRemainingAmount = 0;
    let pendingApprovalCount = 0;
    let pendingApprovalAmount = 0;
    let readyForPayoutCount = 0;
    let readyForPayoutAmount = 0;
    let successfulDisbursementCount = 0;
    let failedDisbursementCount = 0;

    this.disbursements.forEach((d) => {
      totalSanctionedAmount += d.sanctionAmount || 0;
      totalDisbursedAmount += d.totalDisbursedAmount || 0;
      totalRemainingAmount += d.remainingAmount || 0;

      if (d.status === 'PENDING_APPROVAL') {
        pendingApprovalCount++;
        pendingApprovalAmount += d.sanctionAmount || 0;
      } else if (d.status === 'APPROVED' || d.status === 'READY') {
        readyForPayoutCount++;
        readyForPayoutAmount += d.remainingAmount || 0;
      } else if (d.status === 'SUCCESSFUL') {
        successfulDisbursementCount++;
      } else if (d.status === 'FAILED') {
        failedDisbursementCount++;
      }
    });

    return {
      totalSanctionedAmount,
      totalDisbursedAmount,
      totalRemainingAmount,
      pendingApprovalCount,
      pendingApprovalAmount,
      readyForPayoutCount,
      readyForPayoutAmount,
      successfulDisbursementCount,
      failedDisbursementCount,
    };
  }

  // --- BATCH 10: LOAN ACCOUNT & REPAYMENT SETUP ACTIONS ---

  public processLoanAccountOnDisbursement(
    dsb: DisbursementRecord,
    req: DisbursementRequestRecord,
    txn: DisbursementTransactionRecord,
    actorName: string,
    actorRole: string
  ): LoanAccountRecord {
    // Check if loan already exists for this sanction/application
    let existingLoan = this.loanAccounts.find(
      (l) =>
        (dsb.sanctionId && l.sanctionId === dsb.sanctionId) ||
        (dsb.applicationId && l.applicationId === dsb.applicationId)
    );

    if (existingLoan) {
      // Update existing loan account for subsequent tranche
      existingLoan.disbursedPrincipal = roundMoney(
        existingLoan.disbursedPrincipal + req.requestedAmount
      );
      existingLoan.principalOutstanding = roundMoney(
        existingLoan.principalOutstanding + req.requestedAmount
      );
      existingLoan.totalOutstanding = roundMoney(
        existingLoan.principalOutstanding +
          existingLoan.interestOutstanding +
          existingLoan.feeOutstanding +
          existingLoan.penaltyOutstanding
      );
      existingLoan.status =
        dsb.remainingAmount === 0 ? 'ACTIVE' : 'PARTIALLY_DISBURSED';
      existingLoan.updatedAt = new Date().toISOString();
      existingLoan.updatedBy = actorName;

      // Add transaction to ledger
      const newTxn: LoanTransactionItem = {
        id: `ltxn_${Date.now()}`,
        loanId: existingLoan.id,
        accountNumber: existingLoan.accountNumber,
        transactionReference: txn.transactionReference,
        transactionType: 'DISBURSEMENT',
        amount: req.requestedAmount,
        principalPortion: req.requestedAmount,
        interestPortion: 0,
        feePortion: 0,
        penaltyPortion: 0,
        status: 'SUCCESSFUL',
        referenceId: dsb.disbursementNumber,
        utrNumber: txn.utrNumber,
        paymentMethod: txn.paymentMethod,
        notes: `Tranche payout of ₹${req.requestedAmount.toLocaleString('en-IN')} settled. Remaining Sanction: ₹${dsb.remainingAmount.toLocaleString('en-IN')}.`,
        transactionDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        createdBy: actorName,
      };
      existingLoan.transactions = [newTxn, ...(existingLoan.transactions || [])];

      // Add audit history
      const historyEntry: LoanHistoryItem = {
        id: `lh_${Date.now()}`,
        loanId: existingLoan.id,
        timestamp: new Date().toISOString(),
        action: 'DISBURSEMENT_TRANCHE_POSTED',
        actor: actorName,
        actorName,
        actorRole,
        previousState: 'PARTIALLY_DISBURSED',
        newState: existingLoan.status,
        amount: req.requestedAmount,
        reference: txn.transactionReference,
        notes: `Disbursement tranche of ₹${req.requestedAmount.toLocaleString('en-IN')} processed. UTR: ${txn.utrNumber}.`,
      };
      existingLoan.history = [historyEntry, ...(existingLoan.history || [])];

      this.syncApi(`/api/loans/${existingLoan.id}`, 'PATCH', existingLoan);
      return existingLoan;
    }

    // Create a new Loan Account
    const sanction = this.sanctions.find(
      (s) => s.id === dsb.sanctionId || s.sanctionNumber === dsb.sanctionNumber
    );
    const app = this.applications.find(
      (a) => a.id === dsb.applicationId || a.applicationNumber === dsb.applicationNumber
    );
    const customer = this.customers.find(
      (c) => c.id === dsb.customerId || c.customerNumber === dsb.customerNumber
    );
    const beneficiary = dsb.beneficiaries.find((b) => b.id === req.beneficiaryId) || dsb.beneficiaries[0];

    const loanId = `ln_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const accountNumber = `LN-2026-${String(this.nextLoanSeq++).padStart(6, '0')}`;
    const rate = sanction ? Number(sanction.approvedInterestRate) : (app?.interestRate || 14.0);
    const tenure = sanction ? sanction.approvedTenureMonths : (app?.requestedTenureMonths || 36);
    const frequency = (app?.repaymentFrequency || 'MONTHLY') as LoanRepaymentFrequency;
    const interestMethod: InterestMethod = 'REDUCING_BALANCE';
    const originalPrincipal = sanction ? Number(sanction.approvedAmount) : req.requestedAmount;
    const disbursedPrincipal = req.requestedAmount;
    const isFull = dsb.remainingAmount === 0;

    const startDate = new Date().toISOString().split('T')[0];
    const firstDueDateObj = new Date();
    firstDueDateObj.setDate(firstDueDateObj.getDate() + 35);
    const firstDueDate = firstDueDateObj.toISOString().split('T')[0];

    // Generate schedule version 1
    const scheduleResult = generateRepaymentSchedule({
      loanId,
      versionNumber: 1,
      reason: 'Initial schedule generated on loan activation after qualifying disbursement.',
      principal: disbursedPrincipal,
      annualRate: rate,
      tenureMonths: tenure,
      frequency,
      interestMethod,
      startDate,
      firstDueDate,
      createdBy: actorName,
    });

    // Generate product charges
    const charges: LoanChargeItem[] = [
      {
        id: `lc_${loanId}_1`,
        loanId,
        chargeTypeId: 'CHG_PROC_AUTO',
        chargeCode: 'PROCESSING_FEE',
        chargeName: 'Loan Processing Fee',
        chargeType: 'PROCESSING_FEE',
        calculationType: 'PERCENTAGE_OF_SANCTION',
        rateOrValue: 1.0,
        amount: roundMoney(originalPrincipal * 0.01),
        taxAmount: roundMoney(originalPrincipal * 0.01 * 0.18),
        totalAmount: roundMoney(originalPrincipal * 0.01 * 1.18),
        chargeTiming: 'ORIGINATION_DEDUCTED',
        status: 'DEDUCTED_AT_DISBURSEMENT',
        source: 'PRODUCT_CONFIG',
        createdAt: new Date().toISOString(),
        createdBy: 'System / Sanction Engine',
      },
      {
        id: `lc_${loanId}_2`,
        loanId,
        chargeTypeId: 'CHG_DOC_AUTO',
        chargeCode: 'DOCUMENTATION_CHARGES',
        chargeName: 'Documentation & Stamp Charges',
        chargeType: 'DOCUMENTATION_CHARGES',
        calculationType: 'FIXED',
        rateOrValue: 750,
        amount: 750,
        taxAmount: 135,
        totalAmount: 885,
        chargeTiming: 'ORIGINATION_DEDUCTED',
        status: 'DEDUCTED_AT_DISBURSEMENT',
        source: 'PRODUCT_CONFIG',
        createdAt: new Date().toISOString(),
        createdBy: 'System / Sanction Engine',
      },
    ];

    // Repayment settings
    const repaymentSettings: LoanRepaymentSettings = {
      id: `lrs_${loanId}`,
      loanId,
      repaymentFrequency: frequency,
      paymentMethod: 'NACH_EMANDATE',
      mandateStatus: 'ACTIVE',
      mandateReference: `UMRN-${beneficiary?.bankName?.slice(0, 4) || 'HDFC'}-${Date.now().toString().slice(-6)}`,
      bankAccountMasked: beneficiary?.accountNumberMasked || '•••• •••• •••• 0000',
      bankName: beneficiary?.bankName || 'HDFC Bank Ltd',
      ifscCode: beneficiary?.ifscCode || 'HDFC0000120',
      accountHolderName: beneficiary?.beneficiaryName || dsb.customerName,
      preferredDebitDate: 5,
      gracePeriodDays: 3,
      updatedAt: new Date().toISOString(),
      updatedBy: actorName,
    };

    // Opening transaction
    const openingTxn: LoanTransactionItem = {
      id: `ltxn_${Date.now()}`,
      loanId,
      accountNumber,
      transactionReference: txn.transactionReference,
      transactionType: 'DISBURSEMENT',
      amount: req.requestedAmount,
      principalPortion: req.requestedAmount,
      interestPortion: 0,
      feePortion: 0,
      penaltyPortion: 0,
      status: 'SUCCESSFUL',
      referenceId: dsb.disbursementNumber,
      utrNumber: txn.utrNumber,
      paymentMethod: txn.paymentMethod,
      notes: `Initial opening disbursement payout of ₹${req.requestedAmount.toLocaleString('en-IN')} settled.`,
      transactionDate: startDate,
      createdAt: new Date().toISOString(),
      createdBy: actorName,
    };

    // Audit history
    const openingHistory: LoanHistoryItem = {
      id: `lh_${Date.now()}`,
      loanId,
      timestamp: new Date().toISOString(),
      action: 'LOAN_ACCOUNT_CREATED',
      actor: actorName,
      actorName,
      actorRole,
      previousState: 'DISBURSED',
      newState: isFull ? 'ACTIVE' : 'PARTIALLY_DISBURSED',
      amount: req.requestedAmount,
      reference: accountNumber,
      reason: `Successful payout against Sanction ${dsb.sanctionNumber}.`,
      notes: `Loan Account created with Schedule Version 1 (${scheduleResult.totalInstalments} instalments).`,
    };

    const newLoan: LoanAccountRecord = {
      id: loanId,
      accountNumber,
      customerId: dsb.customerId,
      customerNumber: dsb.customerNumber,
      customerName: dsb.customerName,
      customerMobile: dsb.customerMobile || customer?.mobile,
      customerEmail: customer?.email || undefined,
      customerAddress: customer ? `${customer.currentAddress?.addressLine1 || ''}, ${customer.currentAddress?.city || ''}, ${customer.currentAddress?.state || ''}` : undefined,
      applicationId: dsb.applicationId,
      applicationNumber: dsb.applicationNumber,
      productCode: dsb.productCode,
      productName: dsb.productName,
      approvalId: sanction?.approvalId || undefined,
      approvalNumber: sanction?.approvalNumber || undefined,
      sanctionId: dsb.sanctionId,
      sanctionNumber: dsb.sanctionNumber,
      primaryDisbursementId: dsb.id,
      primaryDisbursementNumber: dsb.disbursementNumber,
      branchId: dsb.branchId || 'br_panjim',
      branchName: dsb.branchName || 'Panaji Head Office Branch',
      assignedOfficer: app?.loanOfficer || 'Alex Morgan',
      assignedOfficerId: app?.assignedOfficerId || 'usr_officer_01',

      originalPrincipal,
      disbursedPrincipal,
      principalOutstanding: disbursedPrincipal,
      interestOutstanding: 0,
      feeOutstanding: 0,
      penaltyOutstanding: 0,
      totalOutstanding: disbursedPrincipal,

      totalPaidAmount: 0,
      totalPrincipalPaid: 0,
      totalInterestPaid: 0,
      totalFeesPaid: 0,

      overdueAmount: 0,
      dpd: 0,
      dpdBucket: 'CURRENT',
      status: isFull ? 'ACTIVE' : 'PARTIALLY_DISBURSED',

      interestRate: rate,
      interestMethod,
      repaymentFrequency: frequency,
      tenureMonths: tenure,
      totalInstalments: scheduleResult.totalInstalments,
      remainingInstalments: scheduleResult.totalInstalments,
      emiAmount: scheduleResult.emiAmount,

      disbursementDate: startDate,
      loanStartDate: startDate,
      firstDueDate,
      maturityDate: scheduleResult.maturityDate,
      nextDueDate: firstDueDate,

      repaymentSettings,
      currentScheduleVersion: 1,
      scheduleVersions: [scheduleResult.version],
      schedules: scheduleResult.schedules,
      charges,
      transactions: [openingTxn],
      history: [openingHistory],

      createdAt: new Date().toISOString(),
      createdBy: actorName,
      updatedAt: new Date().toISOString(),
    };

    this.loanAccounts.unshift(newLoan);

    // Also update CustomerLoans list for instant UI synchronization in Customer 360
    const customerLoanEntry: CustomerLoanItem = {
      id: newLoan.id,
      accountNumber: newLoan.accountNumber,
      customerId: newLoan.customerId,
      customerName: newLoan.customerName,
      applicationNumber: newLoan.applicationNumber || '',
      productCode: newLoan.productCode,
      productName: newLoan.productName,
      originalPrincipal: newLoan.originalPrincipal,
      outstandingPrincipal: newLoan.principalOutstanding,
      interestRate: newLoan.interestRate,
      emiAmount: newLoan.emiAmount,
      disbursementDate: newLoan.disbursementDate,
      nextDueDate: newLoan.nextDueDate,
      dpd: newLoan.dpd,
      overdueAmount: newLoan.overdueAmount,
      totalTenureMonths: newLoan.tenureMonths,
      remainingTenureMonths: newLoan.remainingInstalments,
      status: newLoan.status,
      branchName: newLoan.branchName,
    };
    this.customerLoans.unshift(customerLoanEntry);

    this.syncApi('/api/loans', 'POST', newLoan);
    this.notify();
    return newLoan;
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
    let customer = this.customers.find(
      (c) => c.id === payload.customerId || c.customerNumber === payload.customerId
    );
    if (!customer) {
      if (this.customers.length > 0) {
        customer = this.customers[0];
      } else {
        const newCust: CustomerRecord = {
          id: payload.customerId || `cus_${Date.now()}`,
          customerNumber: `CUS-${Date.now().toString().slice(-6)}`,
          name: 'Borrower Customer',
          firstName: 'Borrower',
          lastName: 'Customer',
          dateOfBirth: '1990-01-01',
          gender: 'MALE',
          customerType: 'INDIVIDUAL',
          mobile: '9876543210',
          currentAddress: { addressLine1: 'Main Road', city: 'Panaji', state: 'Goa', pinCode: '403001' },
          permanentAddress: { addressLine1: 'Main Road', city: 'Panaji', state: 'Goa', pinCode: '403001' },
          sameAsCurrentAddress: true,
          employmentType: 'SALARIED',
          monthlyIncome: 65000,
          branchId: 'br_panjim',
          branchName: 'Panaji Head Office Branch',
          nationality: 'Indian',
          preferredContact: 'MOBILE',
          assignedOfficer: 'Alex Morgan',
          status: 'ACTIVE',
          createdDate: new Date().toISOString().split('T')[0],
          updatedDate: new Date().toISOString().split('T')[0],
          activeLoanCount: 1,
          closedLoanCount: 0,
          totalOutstanding: payload.amount,
          totalOverdue: 0,
          cibilScore: 750,
        };
        customer = newCust;
        this.customers = [newCust, ...this.customers];
        this.syncApi('/api/customers', 'POST', newCust);
      }
    }

    const resolvedCustomer = customer!;
    const product = this.loanProductsConfig.find((p) => p.code === payload.productCode) || this.loanProductsConfig[0] || {
      code: 'PERS_LOAN',
      name: 'Personal Loan',
      baseInterestRate: 14.5,
    };

    const branch = this.branches.find((b) => b.id === (payload.branchId || resolvedCustomer.branchId)) || {
      id: 'br_panjim',
      name: resolvedCustomer.branchName || 'Panaji Head Office Branch',
    };

    const loanSeq = this.nextLoanSeq++;
    const accountNumber = `LN-2026-${String(loanSeq).padStart(6, '0')}`;
    const loanId = `ln_${Date.now()}`;
    const rate = payload.interestRate || product.baseInterestRate || 14.0;
    const tenure = payload.tenureMonths || 36;
    const frequency = (payload.repaymentFrequency as LoanRepaymentFrequency) || 'MONTHLY';
    const interestMethod: InterestMethod = payload.interestMethod || 'REDUCING_BALANCE';
    const startDate = payload.startDate || new Date().toISOString().split('T')[0];
    const firstDueDate = payload.firstDueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const scheduleResult = generateRepaymentSchedule({
      loanId,
      versionNumber: 1,
      reason: 'Direct Loan origination and account booking.',
      principal: payload.amount,
      annualRate: rate,
      tenureMonths: tenure,
      frequency,
      interestMethod,
      startDate,
      firstDueDate,
      createdBy: payload.assignedOfficer || 'Operations Officer',
    });

    const repaymentSettings: LoanRepaymentSettings = {
      id: `lrs_${loanId}`,
      loanId,
      repaymentFrequency: frequency,
      paymentMethod: 'NACH_EMANDATE',
      mandateStatus: 'ACTIVE',
      mandateReference: `UMRN-HDFC-${Date.now().toString().slice(-6)}`,
      bankAccountMasked: '•••• •••• •••• 1001',
      bankName: 'HDFC Bank Ltd',
      ifscCode: 'HDFC0000120',
      accountHolderName: resolvedCustomer.name,
      preferredDebitDate: 5,
      gracePeriodDays: 3,
      updatedAt: new Date().toISOString(),
      updatedBy: payload.assignedOfficer || 'Operations Officer',
    };

    const newLoan: LoanAccountRecord = {
      id: loanId,
      accountNumber,
      customerId: resolvedCustomer.id,
      customerNumber: resolvedCustomer.customerNumber,
      customerName: resolvedCustomer.name,
      customerMobile: resolvedCustomer.mobile,
      customerEmail: resolvedCustomer.email,
      customerAddress: `${resolvedCustomer.currentAddress?.addressLine1 || ''}, ${resolvedCustomer.currentAddress?.city || ''}`,
      productCode: product.code,
      productName: product.name,
      branchId: branch.id,
      branchName: branch.name,
      assignedOfficer: payload.assignedOfficer || 'Operations Officer',
      assignedOfficerId: 'usr_officer_01',

      originalPrincipal: payload.amount,
      sanctionedAmount: payload.amount,
      disbursedPrincipal: payload.amount,
      principalOutstanding: payload.amount,
      interestOutstanding: 0,
      feeOutstanding: 0,
      penaltyOutstanding: 0,
      totalOutstanding: payload.amount,

      totalPaidAmount: 0,
      totalPrincipalPaid: 0,
      totalInterestPaid: 0,
      totalFeesPaid: 0,

      overdueAmount: 0,
      dpd: 0,
      dpdBucket: 'CURRENT',
      status: 'ACTIVE',

      interestRate: rate,
      interestMethod,
      repaymentFrequency: frequency,
      tenureMonths: tenure,
      totalInstalments: scheduleResult.totalInstalments,
      remainingInstalments: scheduleResult.totalInstalments,
      emiAmount: scheduleResult.emiAmount,

      disbursementDate: startDate,
      loanStartDate: startDate,
      firstDueDate,
      maturityDate: scheduleResult.maturityDate,
      nextDueDate: firstDueDate,

      currentScheduleVersion: 1,
      scheduleVersions: [scheduleResult.version],
      schedules: scheduleResult.schedules,
      repaymentSettings,
      charges: [],
      transactions: [{
        id: `txn_${Date.now()}`,
        loanId,
        accountNumber,
        transactionReference: `DISB-${loanSeq}`,
        transactionType: 'DISBURSEMENT',
        amount: payload.amount,
        principalPortion: payload.amount,
        interestPortion: 0,
        feePortion: 0,
        penaltyPortion: 0,
        status: 'SUCCESSFUL',
        transactionDate: startDate,
        paymentMethod: 'NEFT',
        notes: payload.notes || 'Initial loan disbursement and booking.',
        createdAt: new Date().toISOString(),
        createdBy: payload.assignedOfficer || 'Operations Officer',
      }],
      history: [{
        id: `lh_${Date.now()}`,
        loanId,
        timestamp: new Date().toISOString(),
        action: 'LOAN_BOOKED',
        actor: payload.assignedOfficer || 'Operations Officer',
        actorName: payload.assignedOfficer || 'Operations Officer',
        actorRole: 'Operations Officer',
        newState: 'ACTIVE',
        amount: payload.amount,
        reference: accountNumber,
        reason: 'Direct loan origination and activation.',
        notes: `Loan Account ${accountNumber} booked for ₹${payload.amount.toLocaleString('en-IN')}.`,
      }],

      createdAt: new Date().toISOString(),
      createdBy: payload.assignedOfficer || 'Operations Officer',
      updatedAt: new Date().toISOString(),
    };

    this.loanAccounts.unshift(newLoan);

    const customerLoanEntry: CustomerLoanItem = {
      id: newLoan.id,
      accountNumber: newLoan.accountNumber,
      customerId: newLoan.customerId,
      customerName: newLoan.customerName,
      applicationNumber: newLoan.applicationNumber || '',
      productCode: newLoan.productCode,
      productName: newLoan.productName,
      originalPrincipal: newLoan.originalPrincipal,
      outstandingPrincipal: newLoan.principalOutstanding,
      interestRate: newLoan.interestRate,
      emiAmount: newLoan.emiAmount,
      disbursementDate: newLoan.disbursementDate,
      nextDueDate: newLoan.nextDueDate,
      dpd: newLoan.dpd,
      overdueAmount: newLoan.overdueAmount,
      totalTenureMonths: newLoan.tenureMonths,
      remainingTenureMonths: newLoan.remainingInstalments,
      status: newLoan.status,
      branchName: newLoan.branchName,
    };
    this.customerLoans.unshift(customerLoanEntry);

    this.syncApi('/api/loans', 'POST', newLoan);
    this.notify();
    return newLoan;
  }

  public getLoanAccounts(): LoanAccountRecord[] {
    return this.loanAccounts;
  }

  public getLoanAccountById(id: string): LoanAccountRecord | undefined {
    return this.loanAccounts.find((l) => l.id === id || l.accountNumber === id);
  }

  public getLoanAccountByApplicationId(appId: string): LoanAccountRecord | undefined {
    return this.loanAccounts.find(
      (l) => l.applicationId === appId || l.applicationNumber === appId
    );
  }

  public getLoanAccountBySanctionId(sanctionId: string): LoanAccountRecord | undefined {
    return this.loanAccounts.find(
      (l) => l.sanctionId === sanctionId || l.sanctionNumber === sanctionId
    );
  }

  public getLoanAccountByDisbursementId(disbId: string): LoanAccountRecord | undefined {
    return this.loanAccounts.find(
      (l) => l.primaryDisbursementId === disbId || l.primaryDisbursementNumber === disbId
    );
  }

  public getLoanAccountsByCustomerId(customerId: string): LoanAccountRecord[] {
    return this.loanAccounts.filter(
      (l) => l.customerId === customerId || l.customerNumber === customerId
    );
  }

  public generateScheduleVersion(
    loanId: string,
    reason: string,
    customTerms?: { annualRate?: number; tenureMonths?: number; frequency?: LoanRepaymentFrequency },
    actorName: string = 'Operations Officer',
    actorRole: string = 'Operations Manager'
  ): RepaymentScheduleVersion {
    const loan = this.loanAccounts.find((l) => l.id === loanId);
    if (!loan) throw new Error('Loan account not found.');

    const newVersionNumber = (loan.currentScheduleVersion || 1) + 1;
    const rate = customTerms?.annualRate !== undefined ? customTerms.annualRate : loan.interestRate;
    const tenure = customTerms?.tenureMonths !== undefined ? customTerms.tenureMonths : loan.remainingInstalments;
    const frequency = customTerms?.frequency || loan.repaymentFrequency;

    // Mark previous active versions as SUPERSEDED
    if (loan.scheduleVersions) {
      loan.scheduleVersions.forEach((v) => {
        if (v.status === 'ACTIVE') v.status = 'SUPERSEDED';
      });
    }

    const startDate = new Date().toISOString().split('T')[0];
    const firstDueDateObj = new Date();
    firstDueDateObj.setDate(firstDueDateObj.getDate() + 30);
    const firstDueDate = firstDueDateObj.toISOString().split('T')[0];

    const result = generateRepaymentSchedule({
      loanId: loan.id,
      versionNumber: newVersionNumber,
      reason,
      principal: loan.principalOutstanding,
      annualRate: rate,
      tenureMonths: tenure,
      frequency,
      interestMethod: loan.interestMethod,
      startDate,
      firstDueDate,
      createdBy: actorName,
    });

    loan.currentScheduleVersion = newVersionNumber;
    loan.scheduleVersions = [result.version, ...(loan.scheduleVersions || [])];
    loan.schedules = result.schedules;
    loan.emiAmount = result.emiAmount;
    loan.interestRate = rate;
    loan.repaymentFrequency = frequency;
    loan.remainingInstalments = result.totalInstalments;
    loan.maturityDate = result.maturityDate;
    loan.updatedAt = new Date().toISOString();
    loan.updatedBy = actorName;

    // Audit log
    const historyEntry: LoanHistoryItem = {
      id: `lh_${Date.now()}`,
      loanId: loan.id,
      timestamp: new Date().toISOString(),
      action: 'SCHEDULE_VERSION_GENERATED',
      actor: actorName,
      actorName,
      actorRole,
      previousState: `Version ${newVersionNumber - 1}`,
      newState: `Version ${newVersionNumber}`,
      reason,
      notes: `New Repayment Schedule Version ${newVersionNumber} generated and activated. Reason: ${reason}`,
    };
    loan.history = [historyEntry, ...(loan.history || [])];

    this.notify();
    this.syncApi(`/api/loans/${loan.id}/schedule`, 'POST', { version: result.version, reason });
    return result.version;
  }

  public updateRepaymentSettings(
    loanId: string,
    updates: Partial<LoanRepaymentSettings>,
    actorName: string = 'Operations Officer',
    actorRole: string = 'Operations Officer'
  ): LoanRepaymentSettings {
    const loan = this.loanAccounts.find((l) => l.id === loanId);
    if (!loan) throw new Error('Loan account not found.');

    loan.repaymentSettings = {
      ...loan.repaymentSettings,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: actorName,
    };
    loan.updatedAt = new Date().toISOString();

    const historyEntry: LoanHistoryItem = {
      id: `lh_${Date.now()}`,
      loanId: loan.id,
      timestamp: new Date().toISOString(),
      action: 'REPAYMENT_SETTINGS_UPDATED',
      actor: actorName,
      actorName,
      actorRole,
      notes: `Repayment settings updated: Method: ${loan.repaymentSettings.paymentMethod}, Debit Day: ${loan.repaymentSettings.preferredDebitDate}, Mandate: ${loan.repaymentSettings.mandateStatus}`,
    };
    loan.history = [historyEntry, ...(loan.history || [])];

    this.notify();
    this.syncApi(`/api/loans/${loan.id}/repayment-setup`, 'PUT', loan.repaymentSettings);
    return loan.repaymentSettings;
  }

  public addLoanCharge(
    loanId: string,
    charge: Omit<LoanChargeItem, 'id' | 'loanId' | 'createdAt' | 'createdBy'>,
    actorName: string = 'Operations Officer',
    actorRole: string = 'Operations Officer'
  ): LoanChargeItem {
    const loan = this.loanAccounts.find((l) => l.id === loanId);
    if (!loan) throw new Error('Loan account not found.');

    const newCharge: LoanChargeItem = {
      ...charge,
      id: `lc_${Date.now()}`,
      loanId: loan.id,
      createdAt: new Date().toISOString(),
      createdBy: actorName,
    };

    loan.charges = [newCharge, ...(loan.charges || [])];
    if (newCharge.chargeTiming === 'ORIGINATION_CAPITALIZED') {
      loan.principalOutstanding = roundMoney(loan.principalOutstanding + newCharge.totalAmount);
      loan.totalOutstanding = roundMoney(loan.totalOutstanding + newCharge.totalAmount);
    } else if (newCharge.status === 'PENDING') {
      loan.feeOutstanding = roundMoney(loan.feeOutstanding + newCharge.totalAmount);
      loan.totalOutstanding = roundMoney(loan.totalOutstanding + newCharge.totalAmount);
    }
    loan.updatedAt = new Date().toISOString();

    const historyEntry: LoanHistoryItem = {
      id: `lh_${Date.now()}`,
      loanId: loan.id,
      timestamp: new Date().toISOString(),
      action: 'CHARGE_LEVIED',
      actor: actorName,
      actorName,
      actorRole,
      amount: newCharge.totalAmount,
      reference: newCharge.chargeCode,
      notes: `Charge "${newCharge.chargeName}" of ₹${newCharge.totalAmount.toLocaleString('en-IN')} levied to account.`,
    };
    loan.history = [historyEntry, ...(loan.history || [])];

    this.notify();
    this.syncApi(`/api/loans/${loan.id}/charges`, 'POST', newCharge);
    return newCharge;
  }

  // --- BATCH 11: REPAYMENT & PAYMENT POSTING ACTIONS ---

  public getPayments(filters?: PaymentFilterState): PaymentRecord[] {
    let result = [...this.payments];
    if (!filters) return result;

    if (filters.status && filters.status !== 'ALL') {
      result = result.filter((p) => p.status === filters.status);
    }
    if (filters.paymentMethod && filters.paymentMethod !== 'ALL') {
      result = result.filter((p) => p.paymentMethod === filters.paymentMethod);
    }
    if (filters.branchId && filters.branchId !== 'ALL') {
      result = result.filter((p) => p.branchId === filters.branchId);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.paymentNumber.toLowerCase().includes(q) ||
          p.accountNumber.toLowerCase().includes(q) ||
          p.customerName.toLowerCase().includes(q) ||
          (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q)) ||
          (p.receiptNumber && p.receiptNumber.toLowerCase().includes(q))
      );
    }
    if (filters.dateFrom) {
      result = result.filter((p) => p.paymentDate >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      result = result.filter((p) => p.paymentDate <= filters.dateTo!);
    }
    if (filters.minAmount !== undefined) {
      result = result.filter((p) => p.amount >= filters.minAmount!);
    }
    if (filters.maxAmount !== undefined) {
      result = result.filter((p) => p.amount <= filters.maxAmount!);
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getPaymentById(id: string): PaymentRecord | undefined {
    return this.payments.find((p) => p.id === id || p.paymentNumber === id);
  }

  public getPaymentsByLoanId(loanId: string): PaymentRecord[] {
    return this.payments
      .filter((p) => p.loanId === loanId || p.accountNumber === loanId)
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
  }

  public getUnallocatedPayments(): UnallocatedPaymentRecord[] {
    return this.unallocatedPayments.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public recordPayment(
    payload: RecordPaymentPayload,
    actorName: string = 'Operations Officer',
    actorRole: string = 'Operations Officer'
  ): PaymentRecord {
    const loan = this.loanAccounts.find((l) => l.id === payload.loanId || l.accountNumber === payload.loanId);
    if (!loan) {
      throw new Error(`Loan account (${payload.loanId}) not found.`);
    }

    if (loan.status === 'CANCELLED') {
      throw new Error('Cannot record payment for a cancelled loan account.');
    }

    if (payload.amount <= 0) {
      throw new Error('Payment amount must be strictly greater than zero.');
    }

    // Idempotency / Duplicate Reference check
    if (payload.idempotencyKey) {
      const existing = this.payments.find((p) => p.idempotencyKey === payload.idempotencyKey);
      if (existing) {
        return existing;
      }
    }

    if (payload.referenceNumber && payload.referenceNumber.trim() !== '') {
      const duplicateRef = this.payments.find(
        (p) =>
          p.referenceNumber === payload.referenceNumber &&
          p.paymentMethod === payload.paymentMethod &&
          p.status !== 'CANCELLED' &&
          p.status !== 'FAILED' &&
          p.status !== 'REVERSED'
      );
      if (duplicateRef) {
        throw new Error(
          `A payment with reference number "${payload.referenceNumber}" already exists (${duplicateRef.paymentNumber}).`
        );
      }
    }

    const paymentSeq = this.nextPaymentSeq++;
    const paymentNumber = `PAY-${new Date().getFullYear()}-${String(paymentSeq).padStart(6, '0')}`;
    const paymentId = `pay_${Date.now()}`;

    const newPayment: PaymentRecord = {
      id: paymentId,
      paymentNumber,
      loanId: loan.id,
      accountNumber: loan.accountNumber,
      customerId: loan.customerId,
      customerNumber: loan.customerNumber,
      customerName: loan.customerName,
      customerMobile: loan.customerMobile,
      branchId: loan.branchId,
      branchName: loan.branchName,
      amount: roundMoney(payload.amount),
      allocatedAmount: 0,
      unallocatedAmount: 0,
      paymentDate: payload.paymentDate || new Date().toISOString().split('T')[0],
      valueDate: payload.valueDate || payload.paymentDate || new Date().toISOString().split('T')[0],
      paymentMethod: payload.paymentMethod,
      referenceNumber: payload.referenceNumber,
      bankName: payload.bankName,
      channel: payload.channel,
      status: payload.requireVerification ? 'PENDING_VERIFICATION' : 'RECEIVED',
      idempotencyKey: payload.idempotencyKey,
      notes: payload.notes,
      supportingDocument: payload.supportingDocument,
      receivedBy: actorName,
      receivedByName: actorName,
      allocations: [],
      history: [
        {
          id: `ph_rec_${paymentId}`,
          paymentId,
          timestamp: new Date().toISOString(),
          event: 'RECEIVED',
          actor: actorName,
          actorName,
          actorRole,
          previousState: 'NONE',
          newState: payload.requireVerification ? 'PENDING_VERIFICATION' : 'RECEIVED',
          amount: payload.amount,
          reference: payload.referenceNumber,
          notes: `Payment of ₹${payload.amount.toLocaleString('en-IN')} recorded via ${payload.paymentMethod}.`,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.payments = [newPayment, ...this.payments];

    // If verification is not required, immediately post & allocate
    if (!payload.requireVerification) {
      return this.postPayment(newPayment.id, actorName, actorRole);
    }

    this.notify();
    this.syncApi('/api/repayments', 'POST', newPayment);
    return newPayment;
  }

  public verifyPayment(
    paymentId: string,
    actorName: string = 'Branch Manager',
    actorRole: string = 'Branch Manager'
  ): PaymentRecord {
    const payment = this.payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error('Payment record not found.');

    if (payment.status !== 'PENDING_VERIFICATION' && payment.status !== 'RECEIVED') {
      throw new Error(`Payment is in ${payment.status} status and cannot be verified.`);
    }

    // Maker-checker rule: Creator cannot verify
    if (payment.receivedBy === actorName) {
      throw new Error(
        'Segregation of Duties Violation: The user who created/received the payment cannot verify it.'
      );
    }

    payment.status = 'VERIFIED';
    payment.verifiedBy = actorName;
    payment.verifiedByName = actorName;
    payment.verifiedAt = new Date().toISOString();
    payment.updatedAt = new Date().toISOString();

    const historyEntry: PaymentHistoryRecord = {
      id: `ph_ver_${payment.id}_${Date.now()}`,
      paymentId: payment.id,
      timestamp: new Date().toISOString(),
      event: 'VERIFIED',
      actor: actorName,
      actorName,
      actorRole,
      previousState: 'PENDING_VERIFICATION',
      newState: 'VERIFIED',
      amount: payment.amount,
      notes: `Payment verified by ${actorName} (${actorRole}).`,
    };
    payment.history = [historyEntry, ...payment.history];

    this.notify();
    this.syncApi(`/api/repayments/${payment.id}/verify`, 'POST', { actorName, actorRole });
    return payment;
  }

  public postPayment(
    paymentId: string,
    actorName: string = 'Operations Officer',
    actorRole: string = 'Operations Officer'
  ): PaymentRecord {
    const payment = this.payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error('Payment record not found.');

    if (payment.status === 'POSTED' || payment.status === 'FULLY_ALLOCATED' || payment.status === 'PARTIALLY_ALLOCATED') {
      throw new Error('This payment has already been posted.');
    }

    if (payment.status === 'REVERSED' || payment.status === 'CANCELLED') {
      throw new Error(`Cannot post payment with status ${payment.status}.`);
    }

    const loan = this.loanAccounts.find((l) => l.id === payment.loanId);
    if (!loan) throw new Error('Associated loan account not found.');

    // Execute core financial allocation engine
    const allocResult = executePaymentAllocation({
      loan,
      payment,
      actorName,
      actorRole,
    });

    // Update loan account in store
    Object.assign(loan, allocResult.updatedLoan);
    loan.schedules = allocResult.updatedSchedules;
    loan.charges = allocResult.updatedCharges;
    loan.transactions = [allocResult.repaymentTransaction, ...(loan.transactions || [])];
    loan.history = [allocResult.loanHistoryEntry, ...(loan.history || [])];

    // Generate Official Receipt
    const receiptNumber = `RCT-${new Date().getFullYear()}-${String(payment.paymentNumber.split('-')[2] || Math.floor(100000 + Math.random() * 900000))}`;
    const receipt: PaymentReceiptRecord = {
      id: `rct_${payment.id}`,
      receiptNumber,
      paymentId: payment.id,
      loanId: loan.id,
      accountNumber: loan.accountNumber,
      customerId: loan.customerId,
      customerName: loan.customerName,
      customerNumber: loan.customerNumber,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      valueDate: payment.valueDate,
      paymentMethod: payment.paymentMethod,
      referenceNumber: payment.referenceNumber,
      allocationSummary: allocResult.receiptSummary,
      postPaymentBalances: {
        remainingPrincipal: loan.principalOutstanding,
        totalOutstanding: loan.totalOutstanding,
        nextDueDate: loan.nextDueDate,
      },
      generatedAt: new Date().toISOString(),
      generatedBy: actorName,
    };

    // Update Payment
    payment.status = allocResult.unallocatedAmount > 0 && allocResult.allocatedAmount > 0 ? 'PARTIALLY_ALLOCATED' : 'POSTED';
    payment.allocatedAmount = allocResult.allocatedAmount;
    payment.unallocatedAmount = allocResult.unallocatedAmount;
    payment.postingDate = new Date().toISOString();
    payment.postedBy = actorName;
    payment.postedByName = actorName;
    payment.postedAt = new Date().toISOString();
    payment.receiptNumber = receiptNumber;
    payment.receipt = receipt;
    payment.allocations = allocResult.allocations;
    payment.history = [allocResult.paymentHistoryEntry, ...payment.history];
    payment.updatedAt = new Date().toISOString();

    if (allocResult.unallocatedRecord) {
      this.unallocatedPayments = [allocResult.unallocatedRecord, ...this.unallocatedPayments];
    }

    this.notify();
    this.syncApi(`/api/repayments/${payment.id}/post`, 'POST', {
      payment,
      allocations: allocResult.allocations,
      receipt,
      unallocated: allocResult.unallocatedRecord,
      loanUpdates: allocResult.updatedLoan,
    });

    return payment;
  }

  public reversePayment(
    paymentId: string,
    reason: string,
    notes?: string,
    actorName: string = 'Branch Manager',
    actorRole: string = 'Branch Manager'
  ): PaymentRecord {
    const payment = this.payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error('Payment record not found.');

    const loan = this.loanAccounts.find((l) => l.id === payment.loanId);
    if (!loan) throw new Error('Associated loan account not found.');

    const reversalResult = executePaymentReversal({
      payment,
      loan,
      reason,
      notes,
      actorName,
      actorRole,
    });

    // Update loan
    Object.assign(loan, reversalResult.updatedLoan);
    loan.schedules = reversalResult.updatedSchedules;
    loan.charges = reversalResult.updatedCharges;
    loan.transactions = [reversalResult.compensatingTransaction, ...(loan.transactions || [])];
    loan.history = [reversalResult.loanHistoryEntry, ...(loan.history || [])];

    // Update payment
    payment.status = 'REVERSED';
    payment.reversedBy = actorName;
    payment.reversedByName = actorName;
    payment.reversedAt = new Date().toISOString();
    payment.reversalReason = reason;
    payment.reversal = reversalResult.reversalRecord;
    payment.allocations = reversalResult.updatedAllocations;
    payment.history = [reversalResult.paymentHistoryEntry, ...payment.history];
    payment.updatedAt = new Date().toISOString();

    this.notify();
    this.syncApi(`/api/repayments/${payment.id}/reverse`, 'POST', {
      reversal: reversalResult.reversalRecord,
      reason,
      notes,
      actorName,
      actorRole,
    });

    return payment;
  }

  public getReceiptByPaymentId(paymentId: string): PaymentReceiptRecord | undefined {
    const payment = this.payments.find((p) => p.id === paymentId || p.paymentNumber === paymentId);
    return payment?.receipt;
  }

  public resolveUnallocatedPayment(
    unallocId: string,
    action: 'REFUND' | 'ALLOCATE_ADVANCE',
    actorName: string = 'Operations Officer',
    actorRole: string = 'Operations Officer'
  ): UnallocatedPaymentRecord {
    const unalloc = this.unallocatedPayments.find((u) => u.id === unallocId);
    if (!unalloc) throw new Error('Unallocated payment record not found.');

    if (unalloc.status !== 'UNALLOCATED' && unalloc.status !== 'PARTIALLY_ALLOCATED') {
      throw new Error(`Record already in ${unalloc.status} status.`);
    }

    if (action === 'REFUND') {
      unalloc.status = 'REFUNDED';
      unalloc.resolvedAt = new Date().toISOString();
      unalloc.resolvedBy = actorName;
      unalloc.updatedAt = new Date().toISOString();
    } else {
      unalloc.status = 'FULLY_ALLOCATED';
      unalloc.allocatedAmount = unalloc.totalAmount;
      unalloc.remainingAmount = 0;
      unalloc.resolvedAt = new Date().toISOString();
      unalloc.resolvedBy = actorName;
      unalloc.updatedAt = new Date().toISOString();
    }

    this.notify();
    this.syncApi('/api/repayments/unallocated', 'POST', { unallocId, action, actorName, actorRole });
    return unalloc;
  }

  public getRepaymentKPIs() {
    let totalCollected = 0;
    let totalAllocated = 0;
    let totalUnallocated = 0;
    let postedCount = 0;
    let pendingVerificationCount = 0;
    let pendingVerificationAmount = 0;
    let reversedCount = 0;
    let reversedAmount = 0;

    this.payments.forEach((p) => {
      if (p.status === 'POSTED' || p.status === 'FULLY_ALLOCATED' || p.status === 'PARTIALLY_ALLOCATED') {
        totalCollected = roundMoney(totalCollected + p.amount);
        totalAllocated = roundMoney(totalAllocated + p.allocatedAmount);
        totalUnallocated = roundMoney(totalUnallocated + p.unallocatedAmount);
        postedCount++;
      } else if (p.status === 'PENDING_VERIFICATION' || p.status === 'RECEIVED') {
        pendingVerificationCount++;
        pendingVerificationAmount = roundMoney(pendingVerificationAmount + p.amount);
      } else if (p.status === 'REVERSED') {
        reversedCount++;
        reversedAmount = roundMoney(reversedAmount + p.amount);
      }
    });

    return {
      totalCollected,
      totalAllocated,
      totalUnallocated,
      postedCount,
      pendingVerificationCount,
      pendingVerificationAmount,
      reversedCount,
      reversedAmount,
    };
  }

  // =========================================================================
  // Recovery, Escalations & Legal Collections (Batch 13)
  // =========================================================================

  public getRecoveryCases(filter?: RecoveryFilterState): RecoveryCaseRecord[] {
    let result = [...this.recoveryCases];
    if (!filter) return result;

    if (filter.stage && filter.stage !== 'ALL') {
      result = result.filter((r) => r.recoveryStage === filter.stage);
    }
    if (filter.status && filter.status !== 'ALL') {
      result = result.filter((r) => r.status === filter.status);
    }
    if (filter.priority && filter.priority !== 'ALL') {
      result = result.filter((r) => r.priority === filter.priority);
    }
    if (filter.dpdBucket && filter.dpdBucket !== 'ALL') {
      result = result.filter((r) => r.dpdBucket === filter.dpdBucket);
    }
    if (filter.branchId && filter.branchId !== 'ALL') {
      result = result.filter((r) => r.branchId === filter.branchId);
    }
    if (filter.assignedOfficerId && filter.assignedOfficerId !== 'ALL') {
      result = result.filter((r) => r.assignedOfficerId === filter.assignedOfficerId);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (r) =>
          r.recoveryCaseNumber.toLowerCase().includes(q) ||
          r.accountNumber.toLowerCase().includes(q) ||
          r.customerName.toLowerCase().includes(q) ||
          r.customerNumber?.toLowerCase().includes(q)
      );
    }
    return result;
  }

  public getRecoveryCaseById(id: string): RecoveryCaseRecord | undefined {
    return this.recoveryCases.find((r) => r.id === id || r.recoveryCaseNumber === id);
  }

  public getRecoveryByLoanId(loanId: string): RecoveryCaseRecord | undefined {
    return this.recoveryCases.find((r) => r.loanId === loanId);
  }

  public getLegalCases(): LegalCaseRecord[] {
    return [...this.legalCases];
  }

  public getLegalCaseById(id: string): LegalCaseRecord | undefined {
    return this.legalCases.find((l) => l.id === id || l.legalCaseNumber === id);
  }

  public getLegalNotices(): LegalNoticeRecord[] {
    return [...this.legalNotices];
  }

  public getLegalNoticeById(id: string): LegalNoticeRecord | undefined {
    return this.legalNotices.find((n) => n.id === id || n.noticeNumber === id);
  }

  public evaluateLoanRecoveryEligibility(loanId: string) {
    const loan = this.loanAccounts.find((l) => l.id === loanId);
    if (!loan) throw new Error('Loan account not found.');
    return evaluateRecoveryEligibility(loan, 0, 0);
  }

  public escalateToRecovery(
    payload: EscalateToRecoveryPayload,
    actorName: string = 'Collection Officer',
    actorRole: string = 'Collection Officer'
  ): RecoveryCaseRecord {
    const loan = this.loanAccounts.find((l) => l.id === payload.loanId);
    if (!loan) throw new Error('Loan account not found.');

    const existing = this.recoveryCases.find(
      (r) => r.loanId === payload.loanId && r.status !== 'CLOSED' && r.status !== 'CANCELLED'
    );
    if (existing) {
      throw new Error(`Active recovery case ${existing.recoveryCaseNumber} already exists for this loan.`);
    }

    const caseSeq = this.nextRecoverySeq++;
    const recoveryCaseNumber = `RC-${new Date().getFullYear()}-${String(caseSeq).padStart(6, '0')}`;
    const escSeq = this.nextEscalationSeq++;
    const escalationNumber = `ESC-${new Date().getFullYear()}-${String(escSeq).padStart(6, '0')}`;

    const priority = payload.priority || calculateRecoveryPriority(loan.dpd, loan.overdueAmount);

    const newEscalation: RecoveryEscalationRecord = {
      id: `esc_${Date.now()}`,
      escalationNumber,
      recoveryCaseId: `rc_${Date.now()}`,
      loanId: loan.id,
      previousStage: 'COLLECTION',
      newStage: payload.targetStage || 'EARLY_RECOVERY',
      reason: payload.reason,
      triggeredBy: actorName,
      triggeredByName: actorName,
      triggeredByRole: actorRole,
      triggeredAt: new Date().toISOString(),
      effectiveDate: new Date().toISOString().split('T')[0],
      assignedTeam: payload.assignedTeam || 'Field Recovery Team 1',
      assignedOfficer: payload.assignedOfficerName || 'Rajesh Naik',
      status: 'COMPLETED',
      notes: payload.reason,
    };

    const newAssignment: RecoveryAssignmentRecord = {
      id: `asgn_${Date.now()}`,
      recoveryCaseId: `rc_${Date.now()}`,
      loanId: loan.id,
      officerId: payload.assignedOfficerId || 'usr_rec_01',
      officerName: payload.assignedOfficerName || 'Rajesh Naik',
      teamName: payload.assignedTeam || 'Field Recovery Team 1',
      branchId: loan.branchId,
      branchName: loan.branchName,
      assignedAt: new Date().toISOString(),
      assignedBy: actorName,
      assignedByName: actorName,
      reason: 'Initial assignment upon escalation',
      status: 'ACTIVE',
    };

    const newCase: RecoveryCaseRecord = {
      id: `rc_${Date.now()}`,
      recoveryCaseNumber,
      loanId: loan.id,
      accountNumber: loan.accountNumber,
      customerId: loan.customerId,
      customerNumber: loan.customerNumber,
      customerName: loan.customerName,
      dpd: loan.dpd,
      dpdBucket: loan.dpdBucket,
      overdueAmount: loan.overdueAmount,
      totalOutstanding: loan.totalOutstanding,
      targetAmount: payload.targetAmount || loan.overdueAmount,
      collectedAmount: 0,
      recoveryStage: payload.targetStage || 'EARLY_RECOVERY',
      status: 'OPEN',
      priority,
      assignedOfficerId: payload.assignedOfficerId || 'usr_rec_01',
      assignedOfficerName: payload.assignedOfficerName || 'Rajesh Naik',
      assignedTeam: payload.assignedTeam || 'Field Recovery Team 1',
      branchId: loan.branchId,
      branchName: loan.branchName,
      openedDate: new Date().toISOString().split('T')[0],
      lastActionDate: new Date().toISOString().split('T')[0],
      notes: payload.reason,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      actions: [],
      escalations: [newEscalation],
      assignments: [newAssignment],
      negotiations: [],
      legalReviews: [],
      legalCases: [],
      legalNotices: [],
    };

    this.recoveryCases.unshift(newCase);
    this.notify();
    this.syncApi('/api/recovery', 'POST', { payload, actorName, actorRole });
    return newCase;
  }

  public assignRecoveryOfficer(
    caseId: string,
    officerId: string,
    officerName: string,
    reason?: string,
    actorName: string = 'Recovery Manager'
  ): RecoveryCaseRecord {
    const rc = this.recoveryCases.find((r) => r.id === caseId);
    if (!rc) throw new Error('Recovery case not found.');

    rc.assignedOfficerId = officerId;
    rc.assignedOfficerName = officerName;
    rc.status = 'ASSIGNED';
    rc.updatedAt = new Date().toISOString();

    const assignment: RecoveryAssignmentRecord = {
      id: `asgn_${Date.now()}`,
      recoveryCaseId: rc.id,
      loanId: rc.loanId,
      officerId,
      officerName,
      branchId: rc.branchId,
      branchName: rc.branchName,
      assignedAt: new Date().toISOString(),
      assignedBy: actorName,
      assignedByName: actorName,
      reason: reason || 'Officer reassignment',
      status: 'ACTIVE',
    };

    rc.assignments = [assignment, ...(rc.assignments || [])];
    this.notify();
    this.syncApi(`/api/recovery/${caseId}/assign`, 'POST', { officerId, officerName, reason, actorName });
    return rc;
  }

  public logRecoveryAction(
    payload: RecordRecoveryActionPayload,
    officerName: string = 'Rajesh Naik',
    officerRole: string = 'Senior Recovery Officer'
  ): RecoveryActionRecord {
    const rc = this.recoveryCases.find((r) => r.id === payload.recoveryCaseId);
    if (!rc) throw new Error('Recovery case not found.');

    const action: RecoveryActionRecord = {
      id: `act_${Date.now()}`,
      recoveryCaseId: rc.id,
      loanId: rc.loanId,
      actionType: payload.actionType,
      actionDate: payload.actionDate || new Date().toISOString().split('T')[0],
      officerId: rc.assignedOfficerId || 'usr_rec_01',
      officerName: officerName || rc.assignedOfficerName || 'Recovery Officer',
      officerRole: officerRole || 'Senior Recovery Officer',
      outcome: payload.outcome,
      outcomeNotes: payload.outcomeNotes,
      promisedAmount: payload.promisedAmount,
      promisedDate: payload.promisedDate,
      nextAction: payload.nextAction,
      nextActionDate: payload.nextActionDate,
      location: payload.location,
      createdAt: new Date().toISOString(),
      createdBy: officerName,
    };

    rc.actions = [action, ...(rc.actions || [])];
    rc.lastActionDate = action.actionDate;
    if (payload.nextAction) rc.nextAction = payload.nextAction;
    if (payload.nextActionDate) rc.nextActionDate = payload.nextActionDate;
    rc.status = 'IN_PROGRESS';
    rc.updatedAt = new Date().toISOString();

    this.notify();
    this.syncApi(`/api/recovery/${rc.id}/action`, 'POST', { payload, officerName, officerRole });
    return action;
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
    const rc = this.recoveryCases.find((r) => r.id === caseId);
    if (!rc) throw new Error('Recovery case not found.');

    const neg: RecoveryNegotiationRecord = {
      id: `neg_${Date.now()}`,
      recoveryCaseId: rc.id,
      loanId: rc.loanId,
      proposedAmount,
      proposedDate,
      frequency,
      reason,
      officerId: rc.assignedOfficerId || 'usr_rec_01',
      officerName,
      customerResponse,
      status: 'PROPOSED',
      createdAt: new Date().toISOString(),
    };

    rc.negotiations = [neg, ...(rc.negotiations || [])];
    rc.status = 'NEGOTIATION';
    rc.updatedAt = new Date().toISOString();

    this.notify();
    this.syncApi(`/api/recovery/${caseId}/negotiation`, 'POST', { proposedAmount, proposedDate, frequency, reason, customerResponse, officerName });
    return neg;
  }

  public requestLegalReview(
    payload: RequestLegalReviewPayload,
    actorName: string = 'Senior Recovery Officer',
    actorRole: string = 'Senior Recovery Officer'
  ): LegalReviewRecord {
    const rc = this.recoveryCases.find((r) => r.id === payload.recoveryCaseId);
    if (!rc) throw new Error('Recovery case not found.');

    const revSeq = this.nextLegalReviewSeq++;
    const reviewNumber = `LRV-${new Date().getFullYear()}-${String(revSeq).padStart(6, '0')}`;

    const review: LegalReviewRecord = {
      id: `lrv_${Date.now()}`,
      reviewNumber,
      recoveryCaseId: rc.id,
      loanId: rc.loanId,
      customerId: rc.customerId,
      requestedBy: actorName,
      requestedByName: actorName,
      requestedByRole: actorRole,
      requestedAt: new Date().toISOString(),
      reviewReason: payload.reason,
      recommendedAction: payload.recommendedAction,
      status: 'PENDING_REVIEW',
    };

    rc.legalReviews = [review, ...(rc.legalReviews || [])];
    rc.status = 'LEGAL_REVIEW';
    rc.updatedAt = new Date().toISOString();

    this.notify();
    this.syncApi(`/api/recovery/${rc.id}/legal-review`, 'POST', { payload, actorName, actorRole });
    return review;
  }

  public approveLegalReview(
    reviewId: string,
    approved: boolean,
    notes?: string,
    reviewerName: string = 'Vikram Mehta',
    reviewerRole: string = 'Head of Credit & Remedial'
  ): LegalReviewRecord {
    let targetReview: LegalReviewRecord | undefined;
    let targetCase: RecoveryCaseRecord | undefined;

    for (const rc of this.recoveryCases) {
      const rev = (rc.legalReviews || []).find((r) => r.id === reviewId);
      if (rev) {
        targetReview = rev;
        targetCase = rc;
        break;
      }
    }

    if (!targetReview || !targetCase) throw new Error('Legal review record not found.');

    // Maker-checker rule: requester cannot approve
    if (targetReview.requestedBy === reviewerName || targetReview.requestedByName === reviewerName) {
      throw new Error('Segregation of Duties Violation: Requester cannot approve their own legal review.');
    }

    targetReview.status = approved ? 'APPROVED_FOR_LEGAL' : 'RETURNED_TO_RECOVERY';
    targetReview.reviewedBy = reviewerName;
    targetReview.reviewedByName = reviewerName;
    targetReview.reviewedByRole = reviewerRole;
    targetReview.reviewedAt = new Date().toISOString();
    targetReview.reviewerNotes = notes;

    if (approved) {
      targetCase.recoveryStage = 'LEGAL_ACTION';
      targetCase.status = 'LEGAL_ACTION';
    } else {
      targetCase.status = 'IN_PROGRESS';
    }
    targetCase.updatedAt = new Date().toISOString();

    this.notify();
    return targetReview;
  }

  public createLegalCase(
    payload: CreateLegalCasePayload,
    actorName: string = 'Sanjay Deshmukh',
    actorRole: string = 'Legal Officer'
  ): LegalCaseRecord {
    const rc = this.recoveryCases.find((r) => r.id === payload.recoveryCaseId);
    if (!rc) throw new Error('Recovery case not found.');

    const caseSeq = this.nextLegalCaseSeq++;
    const legalCaseNumber = `LC-${new Date().getFullYear()}-${String(caseSeq).padStart(6, '0')}`;

    const newLegalCase: LegalCaseRecord = {
      id: `lc_${Date.now()}`,
      legalCaseNumber,
      recoveryCaseId: rc.id,
      loanId: rc.loanId,
      customerId: rc.customerId,
      accountNumber: rc.accountNumber,
      customerName: rc.customerName,
      caseType: payload.caseType,
      jurisdiction: payload.jurisdiction,
      courtOrForum: payload.courtOrForum,
      courtCaseNumber: payload.courtCaseNumber,
      filingDate: payload.filingDate || new Date().toISOString().split('T')[0],
      nextHearingDate: payload.nextHearingDate,
      advocateName: payload.advocateName,
      advocateContact: payload.advocateContact,
      externalCounsel: payload.externalCounsel,
      assignedLegalOfficer: actorName,
      claimAmount: payload.claimAmount || rc.totalOutstanding,
      recoveredAmount: 0,
      status: 'FILED_IN_COURT',
      notes: payload.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      events: [
        {
          id: `lce_${Date.now()}`,
          legalCaseId: `lc_${Date.now()}`,
          eventType: 'CASE_FILED',
          eventDate: payload.filingDate || new Date().toISOString().split('T')[0],
          actorName,
          actorRole,
          notes: `Legal case instituted before ${payload.courtOrForum}. Case Type: ${payload.caseType}.`,
          referenceNumber: payload.courtCaseNumber || legalCaseNumber,
          nextHearingDate: payload.nextHearingDate,
          createdAt: new Date().toISOString(),
        },
      ],
      notices: [],
    };

    rc.legalCases = [newLegalCase, ...(rc.legalCases || [])];
    this.legalCases.unshift(newLegalCase);
    rc.recoveryStage = 'LEGAL_ACTION';
    rc.status = 'LEGAL_ACTION';
    rc.updatedAt = new Date().toISOString();

    this.notify();
    this.syncApi('/api/legal-cases', 'POST', { payload, actorName, actorRole });
    return newLegalCase;
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
    const lc = this.legalCases.find((l) => l.id === legalCaseId);
    if (!lc) throw new Error('Legal case not found.');

    const event: LegalCaseEventRecord = {
      id: `lce_${Date.now()}`,
      legalCaseId: lc.id,
      eventType: eventType as any,
      eventDate: new Date().toISOString().split('T')[0],
      actorName,
      actorRole,
      notes,
      referenceNumber,
      nextHearingDate,
      createdAt: new Date().toISOString(),
    };

    lc.events = [event, ...(lc.events || [])];
    if (nextHearingDate) lc.nextHearingDate = nextHearingDate;
    lc.lastHearingDate = event.eventDate;
    lc.updatedAt = new Date().toISOString();

    this.notify();
    this.syncApi(`/api/legal-cases/${legalCaseId}/events`, 'POST', { eventType, notes, referenceNumber, nextHearingDate, actorName, actorRole });
    return event;
  }

  public createLegalNotice(
    payload: CreateLegalNoticePayload,
    preparerName: string = 'Sanjay Deshmukh'
  ): LegalNoticeRecord {
    const rc = this.recoveryCases.find((r) => r.id === payload.recoveryCaseId);
    if (!rc) throw new Error('Recovery case not found.');
    const loan = this.loanAccounts.find((l) => l.id === rc.loanId);
    if (!loan) throw new Error('Loan account not found.');

    const notSeq = this.nextLegalNoticeSeq++;
    const noticeNumber = `NOT-${new Date().getFullYear()}-${String(notSeq).padStart(6, '0')}`;

    const curePeriodDays = payload.curePeriodDays || 15;
    const noticeDate = new Date().toISOString().split('T')[0];
    const d = new Date();
    d.setDate(d.getDate() + curePeriodDays);
    const dueDate = d.toISOString().split('T')[0];

    const draftContent = generateStatutoryNoticeText({
      noticeType: payload.noticeType,
      customerName: payload.recipientName || rc.customerName,
      customerAddress: payload.recipientAddress || 'Customer Address on Record',
      accountNumber: rc.accountNumber,
      disbursementDate: loan.disbursementDate,
      originalPrincipal: loan.originalPrincipal,
      overdueAmount: rc.overdueAmount,
      principalOutstanding: loan.principalOutstanding,
      interestOutstanding: loan.interestOutstanding,
      feeOutstanding: loan.feeOutstanding,
      penaltyOutstanding: loan.penaltyOutstanding,
      totalOutstanding: loan.totalOutstanding,
      curePeriodDays,
      noticeDate,
      dueDate,
      customClauses: payload.customClauses,
    });

    const notice: LegalNoticeRecord = {
      id: `not_${Date.now()}`,
      noticeNumber,
      loanId: rc.loanId,
      recoveryCaseId: rc.id,
      legalCaseId: payload.legalCaseId,
      customerId: rc.customerId,
      noticeType: payload.noticeType,
      status: 'DRAFT',
      demandAmount: rc.overdueAmount > 0 ? rc.overdueAmount : rc.totalOutstanding,
      noticeDate,
      curePeriodDays,
      dueDate,
      recipientName: payload.recipientName || rc.customerName,
      recipientAddress: payload.recipientAddress || 'Customer Address on Record',
      dispatchMode: payload.dispatchMode || 'REGISTERED_POST_AD',
      draftContent,
      preparedBy: preparerName,
      preparedByName: preparerName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    rc.legalNotices = [notice, ...(rc.legalNotices || [])];
    this.legalNotices.unshift(notice);
    this.notify();
    this.syncApi('/api/legal-notices', 'POST', { payload, preparerName });
    return notice;
  }

  public approveLegalNotice(
    noticeId: string,
    approverName: string = 'Vikram Mehta'
  ): LegalNoticeRecord {
    const notice = this.legalNotices.find((n) => n.id === noticeId);
    if (!notice) throw new Error('Legal notice not found.');

    if (notice.preparedByName === approverName || notice.preparedBy === approverName) {
      throw new Error('Segregation of Duties Violation: The user who drafted the legal notice cannot approve it.');
    }

    notice.status = 'APPROVED';
    notice.approvedBy = approverName;
    notice.approvedByName = approverName;
    notice.approvedAt = new Date().toISOString();
    notice.updatedAt = new Date().toISOString();

    this.notify();
    return notice;
  }

  public dispatchLegalNotice(
    noticeId: string,
    trackingNumber?: string,
    dispatchMode?: string,
    dispatcherName: string = 'Sanjay Deshmukh'
  ): LegalNoticeRecord {
    const notice = this.legalNotices.find((n) => n.id === noticeId);
    if (!notice) throw new Error('Legal notice not found.');

    if (notice.status !== 'APPROVED') {
      throw new Error(`Notice must be in APPROVED status before dispatch. Current status: ${notice.status}`);
    }

    notice.status = 'DISPATCHED';
    notice.trackingNumber = trackingNumber || `ED${Math.floor(100000000 + Math.random() * 900000000)}IN`;
    if (dispatchMode) notice.dispatchMode = dispatchMode as any;
    notice.dispatchedDate = new Date().toISOString().split('T')[0];
    notice.dispatchedBy = dispatcherName;
    notice.updatedAt = new Date().toISOString();

    this.notify();
    return notice;
  }

  public resolveRecoveryCase(
    caseId: string,
    resolutionOutcome: string,
    notes?: string,
    actorName: string = 'Recovery Manager'
  ): RecoveryCaseRecord {
    const rc = this.recoveryCases.find((r) => r.id === caseId);
    if (!rc) throw new Error('Recovery case not found.');

    rc.status = 'RESOLVED';
    rc.recoveryStage = 'RESOLVED';
    rc.resolutionOutcome = resolutionOutcome;
    rc.resolutionNotes = notes;
    rc.updatedAt = new Date().toISOString();

    this.notify();
    return rc;
  }

  public getRecoveryKPIs(): RecoveryKPIs {
    let totalRecoveryExposure = 0;
    let totalRecoveredAmount = 0;
    let openCasesCount = 0;
    let criticalPriorityCount = 0;
    let pendingLegalReviewCount = 0;
    let activeLegalCasesCount = 0;
    let curedThisPeriodCount = 0;

    this.recoveryCases.forEach((rc) => {
      if (rc.status !== 'CLOSED' && rc.status !== 'CANCELLED' && rc.status !== 'CURED') {
        openCasesCount++;
        totalRecoveryExposure = roundMoney(totalRecoveryExposure + rc.totalOutstanding);
        totalRecoveredAmount = roundMoney(totalRecoveredAmount + rc.collectedAmount);
      }
      if (rc.priority === 'CRITICAL') criticalPriorityCount++;
      if (rc.status === 'LEGAL_REVIEW') pendingLegalReviewCount++;
      if (rc.status === 'LEGAL_ACTION' || rc.recoveryStage === 'LEGAL_ACTION') activeLegalCasesCount++;
      if (rc.status === 'CURED') curedThisPeriodCount++;
    });

    const recoveryRatePercent =
      totalRecoveryExposure > 0
        ? roundMoney((totalRecoveredAmount / (totalRecoveryExposure + totalRecoveredAmount)) * 100)
        : 0;

    return {
      openCasesCount,
      totalRecoveryExposure,
      totalRecoveredAmount,
      recoveryRatePercent,
      criticalPriorityCount,
      pendingLegalReviewCount,
      activeLegalCasesCount,
      curedThisPeriodCount,
    };
  }

  // Restructuring, Rescheduling & Moratoriums actions (Batch 14)
  public getRestructuringRequests(): RestructuringRequestRecord[] {
    return this.restructuringRequests;
  }

  public getRestructuringById(id: string): RestructuringRequestRecord | undefined {
    return this.restructuringRequests.find((r) => r.id === id || r.requestNumber === id);
  }

  public createRestructuringRequest(payload: CreateRestructuringPayload): RestructuringRequestRecord {
    const loan = this.loanAccounts.find((l) => l.id === payload.loanId || l.accountNumber === payload.loanId);
    if (!loan) throw new Error('Loan Account not found.');

    const preview = generateRestructuringSchedulePreview({
      loan,
      requestType: payload.requestType,
      proposedTenureMonths: payload.proposedTenureMonths,
      proposedInterestRate: payload.proposedInterestRate,
      proposedRepaymentFrequency: payload.proposedRepaymentFrequency || loan.repaymentFrequency,
      proposedFirstDueDate: payload.proposedFirstDueDate || payload.effectiveDate,
      moratoriumMonths: payload.moratoriumMonths || 0,
      moratoriumInterestTreatment: payload.moratoriumInterestTreatment,
      moratoriumPrincipalTreatment: payload.moratoriumPrincipalTreatment,
    });

    const seq = this.nextRestructuringSeq++;
    const requestNumber = `REQ-2026-${String(seq).padStart(6, '0')}`;
    const newReq: RestructuringRequestRecord = {
      id: `req_restruct_${seq}`,
      requestNumber,
      loanId: loan.id,
      accountNumber: loan.accountNumber,
      customerId: loan.customerId,
      customerNumber: loan.customerNumber,
      customerName: loan.customerName,
      requestType: payload.requestType,
      reason: payload.reason,
      requestedBy: payload.requestedBy,
      requestedByName: payload.requestedByName,
      requestedByRole: payload.requestedByRole,
      requestedAt: new Date().toISOString(),
      effectiveDate: payload.effectiveDate,
      status: payload.status || 'SUBMITTED',
      assignedOfficer: payload.assignedOfficer || 'Senior Credit Underwriter',
      assignedOfficerId: payload.assignedOfficerId || 'usr_credit_01',
      branchId: loan.branchId || 'br_panjim',
      branchName: loan.branchName || 'Panjim Main Branch',

      currentPrincipalOutstanding: loan.outstandingPrincipal || 0,
      currentInterestRate: loan.interestRate || 10,
      currentRemainingTenureMonths: loan.remainingTenureMonths || loan.tenureMonths || 36,
      currentEmiAmount: loan.emiAmount || 0,
      currentRepaymentFrequency: loan.repaymentFrequency || 'MONTHLY',
      currentNextDueDate: loan.nextDueDate || '2026-10-05',
      currentMaturityDate: loan.maturityDate || '2030-01-01',
      currentDpd: loan.dpd || 0,
      currentOverdueAmount: loan.overdueAmount || 0,
      currentScheduleVersion: loan.currentScheduleVersion || 1,

      proposedPrincipal: preview.totalPrincipal,
      proposedInterestRate: payload.proposedInterestRate,
      proposedTenureMonths: payload.proposedTenureMonths || loan.tenureMonths || 36,
      proposedEmiAmount: preview.emiAmount,
      proposedRepaymentFrequency: payload.proposedRepaymentFrequency || loan.repaymentFrequency,
      proposedFirstDueDate: payload.proposedFirstDueDate || payload.effectiveDate,
      proposedMaturityDate: preview.maturityDate,

      moratoriumMonths: payload.moratoriumMonths || 0,
      moratoriumInterestTreatment: payload.moratoriumInterestTreatment,
      moratoriumPrincipalTreatment: payload.moratoriumPrincipalTreatment,
      moratoriumFeeTreatment: payload.moratoriumFeeTreatment,
      capitalizedAmount: 0,
      feeTreatment: payload.feeTreatment || 'REMAIN_DUE',
      penaltyTreatment: payload.penaltyTreatment || 'REMAIN_DUE',

      currentRemainingInterest: preview.financialImpact.currentRemainingInterest,
      proposedRemainingInterest: preview.financialImpact.proposedRemainingInterest,
      interestDifference: preview.financialImpact.interestDifference,
      currentTotalScheduled: preview.financialImpact.currentTotalScheduled,
      proposedTotalScheduled: preview.financialImpact.proposedTotalScheduled,
      emiDifference: preview.financialImpact.emiDifference,
      tenureDifference: preview.financialImpact.tenureDifference,

      consentRequired: true,
      consentReceived: payload.consentReceived || false,
      consentDate: payload.consentReceived ? new Date().toISOString().split('T')[0] : undefined,
      consentMethod: payload.consentMethod,
      consentDocumentRef: payload.consentDocumentRef,

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      events: [
        {
          id: `revt_${seq}_1`,
          requestId: `req_restruct_${seq}`,
          eventType: 'CREATED',
          timestamp: new Date().toISOString(),
          actor: payload.requestedBy,
          actorName: payload.requestedByName,
          actorRole: payload.requestedByRole,
          title: `Restructuring Request ${requestNumber} Initiated`,
          description: payload.reason,
        },
      ],
    };

    this.restructuringRequests.unshift(newReq);
    this.notify();
    return newReq;
  }

  public startRestructuringReview(
    requestId: string,
    reviewerName: string = 'Senior Credit Underwriter'
  ): RestructuringRequestRecord {
    const req = this.restructuringRequests.find((r) => r.id === requestId);
    if (!req) throw new Error('Restructuring request not found.');

    req.status = 'UNDER_REVIEW';
    req.reviewedByName = reviewerName;
    req.reviewedAt = new Date().toISOString();
    req.updatedAt = new Date().toISOString();

    req.events = req.events || [];
    req.events.unshift({
      id: `revt_${Date.now()}`,
      requestId: req.id,
      eventType: 'UNDER_REVIEW',
      timestamp: new Date().toISOString(),
      actor: 'usr_credit_01',
      actorName: reviewerName,
      actorRole: 'Credit Underwriter',
      title: 'Underwriting Review In Progress',
      description: `Assessment initiated by ${reviewerName}.`,
    });

    this.notify();
    return req;
  }

  public approveRestructuringRequest(
    requestId: string,
    approverName: string = 'Branch Credit Committee Head',
    notes?: string
  ): RestructuringRequestRecord {
    const req = this.restructuringRequests.find((r) => r.id === requestId);
    if (!req) throw new Error('Restructuring request not found.');

    if (req.requestedByName === approverName) {
      throw new Error('Segregation of Duties Violation: Requester cannot approve their own restructuring request.');
    }

    req.status = 'APPROVED';
    req.approvedByName = approverName;
    req.approvedAt = new Date().toISOString();
    req.approvalNotes = notes || 'Approved by Committee.';
    req.updatedAt = new Date().toISOString();

    req.events = req.events || [];
    req.events.unshift({
      id: `revt_${Date.now()}`,
      requestId: req.id,
      eventType: 'APPROVED',
      timestamp: new Date().toISOString(),
      actor: 'usr_mgr_01',
      actorName: approverName,
      actorRole: 'Branch Manager / Approver',
      title: 'Restructuring Approved',
      description: notes || `Terms signed off by ${approverName}. Ready for execution on effective date.`,
    });

    this.notify();
    return req;
  }

  public rejectRestructuringRequest(
    requestId: string,
    reason: string,
    rejectorName: string = 'Credit Committee'
  ): RestructuringRequestRecord {
    const req = this.restructuringRequests.find((r) => r.id === requestId);
    if (!req) throw new Error('Restructuring request not found.');

    req.status = 'REJECTED';
    req.rejectedByName = rejectorName;
    req.rejectedAt = new Date().toISOString();
    req.rejectionReason = reason;
    req.updatedAt = new Date().toISOString();

    req.events = req.events || [];
    req.events.unshift({
      id: `revt_${Date.now()}`,
      requestId: req.id,
      eventType: 'REJECTED',
      timestamp: new Date().toISOString(),
      actor: 'usr_mgr_01',
      actorName: rejectorName,
      actorRole: 'Approver',
      title: 'Restructuring Request Rejected',
      description: reason,
    });

    this.notify();
    return req;
  }

  public applyRestructuringRequest(
    requestId: string,
    actorName: string = 'Operations Officer'
  ): RestructuringRequestRecord {
    const req = this.restructuringRequests.find((r) => r.id === requestId);
    if (!req) throw new Error('Restructuring request not found.');

    if (req.status !== 'APPROVED') {
      throw new Error(`Cannot apply restructuring with status '${req.status}'. Must be APPROVED first.`);
    }

    const loan = this.loanAccounts.find((l) => l.id === req.loanId);
    if (!loan) throw new Error('Associated Loan Account not found.');

    const newVersionNumber = (loan.currentScheduleVersion || 1) + 1;

    // Update loan terms
    loan.currentScheduleVersion = newVersionNumber;
    loan.interestRate = req.proposedInterestRate;
    loan.remainingTenureMonths = req.proposedTenureMonths;
    loan.emiAmount = req.proposedEmiAmount;
    loan.nextDueDate = req.proposedFirstDueDate;
    loan.maturityDate = req.proposedMaturityDate;
    loan.updatedAt = new Date().toISOString();

    req.status = 'EFFECTIVE';
    req.appliedAt = new Date().toISOString();
    req.appliedByName = actorName;
    req.resultingScheduleVersionNumber = newVersionNumber;
    req.updatedAt = new Date().toISOString();

    req.events = req.events || [];
    req.events.unshift({
      id: `revt_${Date.now()}`,
      requestId: req.id,
      eventType: 'APPLIED_EFFECTIVE',
      timestamp: new Date().toISOString(),
      actor: 'usr_ops_01',
      actorName,
      actorRole: 'Operations Officer',
      title: `Schedule Version ${newVersionNumber} Activated`,
      description: `Contractual restructuring successfully applied. New terms active from ${req.effectiveDate}.`,
    });

    this.notify();
    return req;
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



