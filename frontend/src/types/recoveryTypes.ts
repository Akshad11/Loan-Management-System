// Batch 13 — Recovery, Escalation & Legal Collections Domain Types

export type RecoveryStage =
  | 'EARLY_RECOVERY'
  | 'HARD_RECOVERY'
  | 'PRE_LEGAL'
  | 'LEGAL_ACTION'
  | 'RESOLVED'
  | 'TRANSFERRED_TO_RESTRUCTURING';

export type RecoveryStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'CUSTOMER_CONTACTED'
  | 'NEGOTIATION'
  | 'LEGAL_REVIEW'
  | 'LEGAL_ACTION'
  | 'CURED'
  | 'RESOLVED'
  | 'CLOSED'
  | 'CANCELLED';

export type RecoveryPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RecoveryActionType =
  | 'PHONE_CALL'
  | 'FIELD_VISIT'
  | 'DEMAND_NOTICE'
  | 'CUSTOMER_MEETING'
  | 'NEGOTIATION'
  | 'FOLLOW_UP'
  | 'ADDRESS_VERIFICATION'
  | 'REFERENCE_CONTACT';

export type RecoveryOutcome =
  | 'CONTACTED'
  | 'NO_ANSWER'
  | 'REFUSED_PAYMENT'
  | 'PTP_OBTAINED'
  | 'PARTIAL_PAYMENT_PROMISE'
  | 'FINANCIAL_HARDSHIP'
  | 'DISPUTE_RAISED'
  | 'ADDRESS_UNTRACEABLE'
  | 'LEGAL_RECOMMENDED';

export type LegalCaseType =
  | 'DEMAND_NOTICE_138'
  | 'CIVIL_RECOVERY_SUIT'
  | 'ARBITRATION_PROCEEDING'
  | 'SARFAESI_ACTION'
  | 'SECTION_25_PAYMENT_ACT'
  | 'INSOLVENCY_IBC';

export type LegalCaseStatus =
  | 'DRAFT_REVIEW'
  | 'APPROVED'
  | 'NOTICE_ISSUED'
  | 'FILED_IN_COURT'
  | 'HEARING_SCHEDULED'
  | 'SUMMONS_ISSUED'
  | 'ORDER_OBTAINED'
  | 'EXECUTION_PENDING'
  | 'SETTLED'
  | 'WITHDRAWN'
  | 'CLOSED';

export type LegalNoticeType =
  | 'SECTION_138_CHEQUE_BOUNCE'
  | 'LOAN_RECALL_DEMAND'
  | 'STATUTORY_DEMAND_NOTICE'
  | 'ARBITRATION_INVOCATION'
  | 'SARFAESI_13_2_NOTICE';

export type LegalNoticeStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'RETURNED_UNDELIVERED'
  | 'CANCELLED';

export interface RecoveryActionRecord {
  id: string;
  recoveryCaseId: string;
  loanId: string;
  actionType: RecoveryActionType;
  actionDate: string;
  officerId: string;
  officerName: string;
  officerRole: string;
  outcome: RecoveryOutcome;
  outcomeNotes?: string;
  promisedAmount?: number;
  promisedDate?: string;
  nextAction?: string;
  nextActionDate?: string;
  location?: string;
  geoCoordinates?: string;
  createdAt: string;
  createdBy: string;
}

export interface RecoveryEscalationRecord {
  id: string;
  escalationNumber: string;
  recoveryCaseId: string;
  loanId: string;
  previousStage: string;
  newStage: string;
  reason: string;
  triggeredBy: string;
  triggeredByName: string;
  triggeredByRole: string;
  triggeredAt: string;
  effectiveDate: string;
  assignedTeam?: string;
  assignedOfficer?: string;
  status: string;
  notes?: string;
}

export interface RecoveryAssignmentRecord {
  id: string;
  recoveryCaseId: string;
  loanId: string;
  officerId: string;
  officerName: string;
  teamName?: string;
  branchId?: string;
  branchName?: string;
  region?: string;
  assignedAt: string;
  assignedBy: string;
  assignedByName: string;
  reason?: string;
  status: 'ACTIVE' | 'PREVIOUS';
}

export interface RecoveryNegotiationRecord {
  id: string;
  recoveryCaseId: string;
  loanId: string;
  proposedAmount: number;
  proposedDate: string;
  frequency: string;
  reason: string;
  officerId: string;
  officerName: string;
  customerResponse?: string;
  status: 'PROPOSED' | 'ACCEPTED_BY_CUSTOMER' | 'REJECTED' | 'REFERRED_FOR_RESTRUCTURING';
  notes?: string;
  createdAt: string;
}

export interface LegalReviewRecord {
  id: string;
  reviewNumber: string;
  recoveryCaseId: string;
  loanId: string;
  customerId: string;
  requestedBy: string;
  requestedByName: string;
  requestedByRole: string;
  requestedAt: string;
  reviewReason: string;
  recommendedAction?: string;
  status: 'PENDING_REVIEW' | 'APPROVED_FOR_LEGAL' | 'RETURNED_TO_RECOVERY' | 'REJECTED';
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedByRole?: string;
  reviewedAt?: string;
  reviewerNotes?: string;
}

export type LegalCaseEventType =
  | 'NOTICE_ISSUED'
  | 'CASE_FILED'
  | 'SUMMONS_SERVED'
  | 'SUMMONS_ISSUED'
  | 'HEARING_HELD'
  | 'EVIDENCE_FILED'
  | 'INTERIM_ORDER'
  | 'FINAL_DECREE'
  | 'WARRANT_ISSUED'
  | 'BAILABLE_WARRANT'
  | 'NBW_ISSUED'
  | 'ATTACHMENT_ORDER'
  | 'EXECUTION_FILED'
  | 'PAYMENT_RECORDED'
  | 'SETTLEMENT_REACHED'
  | 'CASE_CLOSED';

export interface LegalCaseEventRecord {
  id: string;
  legalCaseId: string;
  eventType: LegalCaseEventType;
  eventDate: string;
  actorName: string;
  actorRole: string;
  notes: string;
  referenceNumber?: string;
  documentUrl?: string;
  nextAction?: string;
  nextHearingDate?: string;
  createdAt: string;
}

export interface LegalCaseRecord {
  id: string;
  legalCaseNumber: string;
  recoveryCaseId: string;
  loanId: string;
  customerId: string;
  accountNumber: string;
  customerName: string;
  caseType: LegalCaseType;
  jurisdiction: string;
  courtOrForum: string;
  courtCaseNumber?: string;
  filingDate?: string;
  nextHearingDate?: string;
  lastHearingDate?: string;
  advocateName?: string;
  advocateContact?: string;
  externalCounsel?: string;
  assignedLegalOfficer?: string;
  assignedLegalOfficerId?: string;
  claimAmount: number;
  recoveredAmount: number;
  status: LegalCaseStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  events?: LegalCaseEventRecord[];
  notices?: LegalNoticeRecord[];
}

export interface LegalNoticeRecord {
  id: string;
  noticeNumber: string;
  loanId: string;
  recoveryCaseId: string;
  legalCaseId?: string;
  customerId: string;
  noticeType: LegalNoticeType;
  status: LegalNoticeStatus;
  demandAmount: number;
  noticeDate: string;
  curePeriodDays: number;
  dueDate: string;
  recipientName: string;
  recipientAddress: string;
  dispatchMode?: 'REGISTERED_POST_AD' | 'SPEED_POST' | 'COURIER' | 'EMAIL' | 'HAND_DELIVERY';
  trackingNumber?: string;
  dispatchedDate?: string;
  deliveryDate?: string;
  draftContent: string;
  preparedBy: string;
  preparedByName: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  dispatchedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecoveryCaseRecord {
  id: string;
  recoveryCaseNumber: string;
  loanId: string;
  accountNumber: string;
  customerId: string;
  customerNumber?: string;
  customerName: string;
  dpd: number;
  dpdBucket: string;
  overdueAmount: number;
  totalOutstanding: number;
  targetAmount?: number;
  collectedAmount: number;
  recoveryStage: RecoveryStage;
  status: RecoveryStatus;
  priority: RecoveryPriority;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  assignedTeam?: string;
  branchId: string;
  branchName?: string;
  openedDate: string;
  lastActionDate?: string;
  nextAction?: string;
  nextActionDate?: string;
  curedDate?: string;
  resolutionOutcome?: string;
  resolutionNotes?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  actions?: RecoveryActionRecord[];
  escalations?: RecoveryEscalationRecord[];
  assignments?: RecoveryAssignmentRecord[];
  negotiations?: RecoveryNegotiationRecord[];
  legalReviews?: LegalReviewRecord[];
  legalCases?: LegalCaseRecord[];
  legalNotices?: LegalNoticeRecord[];
}

export interface RecoveryKPIs {
  openCasesCount: number;
  totalRecoveryExposure: number;
  totalRecoveredAmount: number;
  recoveryRatePercent: number;
  criticalPriorityCount: number;
  pendingLegalReviewCount: number;
  activeLegalCasesCount: number;
  curedThisPeriodCount: number;
}

export interface RecoveryFilterState {
  search?: string;
  stage?: string;
  status?: string;
  priority?: string;
  dpdBucket?: string;
  branchId?: string;
  assignedOfficerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface RecordRecoveryActionPayload {
  recoveryCaseId: string;
  actionType: RecoveryActionType;
  actionDate: string;
  outcome: RecoveryOutcome;
  outcomeNotes?: string;
  promisedAmount?: number;
  promisedDate?: string;
  nextAction?: string;
  nextActionDate?: string;
  location?: string;
}

export interface EscalateToRecoveryPayload {
  loanId: string;
  targetStage: RecoveryStage;
  reason: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  assignedTeam?: string;
  targetAmount?: number;
  priority?: RecoveryPriority;
}

export interface RequestLegalReviewPayload {
  recoveryCaseId: string;
  reason: string;
  recommendedAction?: string;
}

export interface CreateLegalCasePayload {
  recoveryCaseId: string;
  caseType: LegalCaseType;
  jurisdiction: string;
  courtOrForum: string;
  courtCaseNumber?: string;
  filingDate?: string;
  nextHearingDate?: string;
  advocateName?: string;
  advocateContact?: string;
  externalCounsel?: string;
  claimAmount?: number;
  notes?: string;
}

export interface CreateLegalNoticePayload {
  recoveryCaseId: string;
  legalCaseId?: string;
  noticeType: LegalNoticeType;
  curePeriodDays?: number;
  recipientName: string;
  recipientAddress: string;
  dispatchMode?: 'REGISTERED_POST_AD' | 'SPEED_POST' | 'COURIER' | 'EMAIL' | 'HAND_DELIVERY';
  customClauses?: string;
}
