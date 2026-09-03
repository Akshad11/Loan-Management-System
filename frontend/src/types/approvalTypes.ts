// Batch 7 - Approval Workflow, Multi-Level Decision & Governance Type Definitions

import { ConditionStatus } from './creditTypes';
export type { ConditionStatus };

export type ApprovalStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'IN_REVIEW'
  | 'RETURNED'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export type ApprovalDecisionType = 'APPROVE' | 'REJECT' | 'RETURN';

export type ConditionCategory =
  | 'DOCUMENTATION'
  | 'VERIFICATION'
  | 'FINANCIAL'
  | 'OPERATIONAL'
  | 'LEGAL'
  | 'INSURANCE'
  | 'OTHER';

export type ConditionStage =
  | 'SANCTION'
  | 'DISBURSEMENT'
  | 'POST_DISBURSEMENT';

export type ApprovalPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface ApprovalFilterState {
  status: string;
  level: string;
  assignedToId: string;
  productCode: string;
  branchId: string;
  priority: string;
  slaStatus: string;
  searchQuery: string;
  search?: string;
  isSlaBreached?: string;
  dateRange: { start: string; end: string };
  minAmount?: number;
  maxAmount?: number;
}

export interface ApprovalSortState {
  column: keyof ApprovalRecord;
  direction: 'asc' | 'desc';
}

export type ExceptionCategory =
  | 'AMOUNT_EXCEPTION'
  | 'RATE_EXCEPTION'
  | 'TENURE_EXCEPTION'
  | 'POLICY_EXCEPTION'
  | 'DOCUMENTATION_EXCEPTION'
  | 'OTHER';

export type ExceptionStatus =
  | 'PENDING'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface ApprovalCondition {
  id: string;
  approvalId: string;
  category: ConditionCategory;
  description: string;
  requiredBefore: ConditionStage;
  dueDate?: string;
  owner: string;
  status: ConditionStatus;
  addedBy: string;
  addedAt: string;
  source: 'CREDIT_ASSESSMENT' | 'APPROVAL_STAGE';
  waivedBy?: string;
  waivedAt?: string;
  waiverReason?: string;
  resolutionNotes?: string;
}

export interface ApprovalException {
  id: string;
  approvalId: string;
  category: ExceptionCategory;
  title: string;
  description: string;
  recommendedValue: string | number;
  requestedValue: string | number;
  deviationDetails: string;
  reason: string;
  requiredAuthorityRole: string;
  status: ExceptionStatus;
  createdBy: string;
  createdAt: string;
  routedTo?: string;
  routedAt?: string;
  routedBy?: string;
  decidedBy?: string;
  decidedAt?: string;
  decisionNotes?: string;
}

export interface ApprovalMatrixRule {
  id: string;
  ruleCode: string;
  ruleDescription?: string;
  productCode: string;
  productName: string;
  minAmount: number;
  maxAmount: number;
  branchId?: string; // 'ALL' or specific branch
  branchName?: string;
  region?: string;
  level: number; // 1, 2, 3
  levelName: string;
  approverRoleId: string;
  approverRoleName: string;
  authorityLimit: number;
  canApproveExceptions: boolean;
  exceptionAuthorityRole?: string;
  exceptionApproverRoleId?: string;
  exceptionApproverRoleName?: string;
  isActive: boolean;
  createdDate: string;
  updatedDate: string;
  updatedBy: string;
}

export interface ApprovalLevelExecution {
  level: number;
  levelName: string;
  requiredRoleId: string;
  requiredRoleName: string;
  authorityLimit: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
  assignedToId?: string;
  assignedToName?: string;
  assignedAt?: string;
  assignedBy?: string;
  assignmentNotes?: string;
  decidedAt?: string;
  decidedBy?: string;
  decision?: ApprovalDecisionType;
  approvedAmount?: number;
  approvedTenureMonths?: number;
  approvedInterestRate?: number;
  decisionNotes?: string;
}

export interface ApprovalDecisionVersion {
  versionNumber: number;
  level: number;
  decision: ApprovalDecisionType;
  approvedAmount?: number;
  approvedTenureMonths?: number;
  approvedInterestRate?: number;
  deviationReason?: string;
  decisionNotes: string;
  returnReason?: string;
  requiredAction?: string;
  dueDate?: string;
  decidedBy: string;
  decidedAt: string;
  approverRole: string;
  conditionsSnapshot: { description: string; status: ConditionStatus }[];
  exceptionsSnapshot: { title: string; status: ExceptionStatus }[];
}

export interface ApprovalHistoryItem {
  id: string;
  approvalId: string;
  timestamp: string;
  event:
    | 'APPROVAL_CREATED'
    | 'APPROVAL_ASSIGNED'
    | 'APPROVAL_REASSIGNED'
    | 'APPROVAL_STARTED'
    | 'APPROVAL_RETURNED'
    | 'CONDITION_ADDED'
    | 'CONDITION_UPDATED'
    | 'EXCEPTION_CREATED'
    | 'EXCEPTION_ROUTED'
    | 'EXCEPTION_RESOLVED'
    | 'APPROVAL_APPROVED'
    | 'APPROVAL_REJECTED';
  actor: string;
  actorRole: string;
  level: number;
  previousState: string;
  newState: string;
  amount?: number;
  notes: string;
}

export interface ApprovalRecord {
  id: string;
  approvalNumber: string;
  applicationId: string;
  applicationNumber: string;
  creditAssessmentId: string;
  creditAssessmentNumber: string;
  customerId: string;
  customerNumber: string;
  customerName: string;
  customerMobile: string;
  branchId: string;
  branchName: string;
  productCode: string;
  productName: string;
  requestedAmount: number;
  requestedTenureMonths: number;
  requestedInterestRate: number;
  recommendedAmount: number;
  recommendedTenureMonths: number;
  recommendedInterestRate: number;
  creditScore: number;
  riskRating: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  creditAssessorName: string;
  creditRecommendationNotes?: string;
  status: ApprovalStatus;
  totalLevels: number;
  currentLevelIndex: number; // 0-based index
  levels: ApprovalLevelExecution[];
  assignedToId?: string;
  assignedToName?: string;
  assignedAt?: string;
  assignedBy?: string;
  assignmentNotes?: string;
  ageDays: number;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  isSlaBreached: boolean;
  approvedAmount?: number;
  approvedTenureMonths?: number;
  approvedInterestRate?: number;
  conditions: ApprovalCondition[];
  exceptions: ApprovalException[];
  versions: ApprovalDecisionVersion[];
  history: ApprovalHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalFilterOptions {
  searchQuery: string;
  status: string;
  level: string;
  product: string;
  branch: string;
  assignedTo: string;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  sortBy: 'age' | 'amount' | 'number' | 'created';
  sortOrder: 'asc' | 'desc';
}

export interface ApprovalMatrixAuditItem {
  id: string;
  ruleId: string;
  ruleCode: string;
  timestamp: string;
  actor: string;
  action: 'CREATED' | 'UPDATED' | 'ACTIVATED' | 'DEACTIVATED';
  details: string;
}

export type ApprovalVersionSnapshot = ApprovalDecisionVersion;
export type ApprovalHistoryEvent = ApprovalHistoryItem;
export type ApprovalMatrixAudit = ApprovalMatrixAuditItem;

