// Base Types & Auth Types
export type UserRole =
  | 'loan_officer'
  | 'credit_officer'
  | 'approver'
  | 'operations_officer'
  | 'collection_officer'
  | 'management'
  | 'system_admin';

export type Permission =
  | 'view_dashboard'
  | 'view_customers'
  | 'manage_customers'
  | 'view_applications'
  | 'create_application'
  | 'view_loans'
  | 'view_repayments'
  | 'manage_repayments'
  | 'view_collections'
  | 'manage_collections'
  | 'view_credit_assessment'
  | 'conduct_credit_assessment'
  | 'view_approvals'
  | 'action_approvals'
  | 'view_sanctions'
  | 'view_loan_products'
  | 'manage_loan_products'
  | 'view_system_config'
  | 'manage_users_roles'
  | 'view_reports'
  | 'view_audit'
  | string;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  branch: string;
  employeeId: string;
  department: string;
  avatarInitials: string;
  lastLogin: string;
  permissions: Permission[];
}

export type AuthState =
  | 'unauthenticated'
  | 'authenticating'
  | 'authenticated'
  | 'session_expired'
  | 'access_denied';

export type NavGroup = 'Operations' | 'Credit' | 'Configuration' | 'Reports';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  group: NavGroup;
  iconName: string;
  requiredPermission: Permission;
  badgeCount?: number;
}

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CREDIT_ASSESSED'
  | 'SANCTIONED'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISBURSED'
  | 'CANCELLED';

export type LoanStatus =
  | 'ACTIVE'
  | 'OVERDUE'
  | 'NPA'
  | 'CLOSED'
  | 'RESTRUCTURED';

export type CustomerStatus = 'ACTIVE' | 'PENDING_KYC' | 'SUSPENDED' | 'DORMANT';

export interface Customer {
  id: string;
  customerNumber: string;
  name: string;
  mobile: string;
  email: string;
  pan: string;
  aadhaarMasked: string;
  cibilScore: number;
  status: CustomerStatus;
  kycStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  city: string;
  state: string;
  createdDate: string;
  assignedOfficer: string;
  totalActiveLoans: number;
  totalExposure: number;
}

export interface LoanApplication {
  id: string;
  applicationNumber: string;
  customerId: string;
  customerNumber: string;
  customerName: string;
  product: string;
  productCode: string;
  requestedAmount: number;
  sanctionedAmount?: number;
  tenureMonths: number;
  interestRate: number;
  status: ApplicationStatus;
  assignedTo: string;
  assignedRole: UserRole;
  createdDate: string;
  updatedDate: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  cibilScore: number;
  monthlyIncome: number;
  branch: string;
}

export interface LoanAccount {
  id: string;
  loanAccountNumber: string;
  applicationNumber: string;
  customerId: string;
  customerNumber: string;
  customerName: string;
  product: string;
  productCode: string;
  principalAmount: number;
  outstandingPrincipal: number;
  interestRate: number;
  emiAmount: number;
  tenureMonths: number;
  remainingTenureMonths: number;
  disbursedDate: string;
  maturityDate: string;
  nextDueDate: string;
  dpd: number; // Days Past Due
  dpdBucket: 'CURRENT' | '1-30 DPD' | '31-60 DPD' | '61-90 DPD' | '90+ DPD';
  status: LoanStatus;
  overdueAmount: number;
  totalInterestPaid: number;
  totalPrincipalPaid: number;
  branch: string;
}

export interface WorkQueueItem {
  id: string;
  type: 'Application' | 'Credit Assessment' | 'Approval' | 'Sanction' | 'Disbursement' | 'Collection Follow-up';
  referenceNumber: string;
  customerName: string;
  amount: number;
  agingDays: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  stage: string;
  assignedTo: string;
  actionLabel: string;
  targetModule: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'approval' | 'disbursement' | 'credit' | 'system' | 'collection';
  timestamp: string;
  read: boolean;
  referenceId?: string;
  targetModule: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  category: 'AUTH' | 'CREDIT' | 'DISBURSEMENT' | 'APPROVAL' | 'SYSTEM' | 'REPAYMENT' | 'CUSTOMER';
  actorName: string;
  actorRole: string;
  targetResource: string;
  ipAddress: string;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
  timestamp: string;
  details: string;
}

export interface LoanProduct {
  id: string;
  code: string;
  name: string;
  category: 'RETAIL' | 'SME' | 'HOUSING' | 'VEHICLE';
  minAmount: number;
  maxAmount: number;
  minTenureMonths: number;
  maxTenureMonths: number;
  baseInterestRate: number;
  processingFeePercent: number;
  status: 'ACTIVE' | 'INACTIVE';
}

// Enterprise RBAC & Configuration Types
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type RoleStatus = 'ACTIVE' | 'INACTIVE';
export type BranchStatus = 'ACTIVE' | 'INACTIVE';

export type PermissionAction =
  | 'VIEW'
  | 'CREATE'
  | 'EDIT'
  | 'SUBMIT'
  | 'APPROVE'
  | 'REJECT'
  | 'DISBURSE'
  | 'POST_PAYMENT'
  | 'REVERSE_PAYMENT'
  | 'WAIVE_CHARGE'
  | 'FORECLOSE'
  | 'CLOSE_LOAN'
  | 'DELETE'
  | 'ARCHIVE'
  | 'EXPORT'
  | 'MANAGE';

export type ModuleCategory =
  | 'CUSTOMERS'
  | 'KYC'
  | 'APPLICATIONS'
  | 'CREDIT_ASSESSMENT'
  | 'APPROVALS'
  | 'SANCTIONS'
  | 'LOANS'
  | 'DISBURSEMENT'
  | 'REPAYMENTS'
  | 'COLLECTIONS'
  | 'REPORTS'
  | 'AUDIT'
  | 'USERS'
  | 'ROLES'
  | 'BRANCHES'
  | 'SYSTEM_CONFIG'
  | 'LOAN_PRODUCTS';

export interface PermissionDefinition {
  id: string;
  code: string;
  name: string;
  description: string;
  module: ModuleCategory;
  moduleLabel: string;
  action: PermissionAction;
  isHighRiskFinancial?: boolean;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string;
  status: RoleStatus;
  userCount: number;
  permissionIds: string[];
  isSystemProtected?: boolean;
  createdDate: string;
  updatedDate: string;
  updatedBy: string;
}

export interface LMSUser {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  name: string;
  username: string;
  email: string;
  mobile: string;
  roleId: string;
  roleName: string;
  branchId: string;
  branchName: string;
  status: UserStatus;
  department: string;
  createdDate: string;
  updatedDate: string;
  lastLogin: string;
  failedLoginAttempts: number;
}

export interface Branch {
  id: string;
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
  managerName?: string;
  status: BranchStatus;
  userCount: number;
  activeLoanCount: number;
  totalPortfolioValue: number;
  createdDate: string;
  updatedDate: string;
}

export interface AdminAuditEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  entityType: 'USER' | 'ROLE' | 'BRANCH' | 'PERMISSION';
  entityId: string;
  entityName: string;
  action: string;
  details: string;
  reason?: string;
  changes?: {
    field: string;
    oldValue: string;
    newValue: string;
  }[];
  ipAddress: string;
}

export interface UserFilterState {
  search: string;
  status: string;
  roleId: string;
  branchId: string;
  lastLoginRange: string;
  createdDateRange: string;
}

export interface BranchFilterState {
  search: string;
  status: string;
  state: string;
  city: string;
}

export interface RoleFilterState {
  search: string;
  status: string;
}

// Module specific types
export * from './customerTypes';
export * from './kycTypes';
export * from './applicationTypes';
export * from './creditTypes';
export * from './approvalTypes';
export * from './sanctionTypes';
export * from './disbursementTypes';
export * from './loanAccountTypes';
