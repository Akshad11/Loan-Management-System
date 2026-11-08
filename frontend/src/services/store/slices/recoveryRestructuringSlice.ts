import { LMSStoreContext } from '../types';
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
} from '../../../types/recoveryTypes';
import {
  RestructuringRequestRecord,
  CreateRestructuringPayload,
} from '../../../types/restructuringTypes';
import { generateRestructuringSchedulePreview } from '../../restructuringEngine';
import {
  evaluateRecoveryEligibility,
  calculateRecoveryPriority,
  generateStatutoryNoticeText,
} from '../../recoveryEngine';
import { roundMoney } from '../../loanFinancialService';

// =========================================================================
// Recovery, Escalations & Legal Collections (Batch 13)
// =========================================================================

export function getRecoveryCases(ctx: LMSStoreContext, filter?: RecoveryFilterState): RecoveryCaseRecord[] {
  let result = [...ctx.recoveryCases];
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

export function getRecoveryCaseById(ctx: LMSStoreContext, id: string): RecoveryCaseRecord | undefined {
  return ctx.recoveryCases.find((r) => r.id === id || r.recoveryCaseNumber === id);
}

export function getRecoveryByLoanId(ctx: LMSStoreContext, loanId: string): RecoveryCaseRecord | undefined {
  return ctx.recoveryCases.find((r) => r.loanId === loanId);
}

export function getLegalCases(ctx: LMSStoreContext): LegalCaseRecord[] {
  return [...ctx.legalCases];
}

export function getLegalCaseById(ctx: LMSStoreContext, id: string): LegalCaseRecord | undefined {
  return ctx.legalCases.find((l) => l.id === id || l.legalCaseNumber === id);
}

export function getLegalNotices(ctx: LMSStoreContext): LegalNoticeRecord[] {
  return [...ctx.legalNotices];
}

export function getLegalNoticeById(ctx: LMSStoreContext, id: string): LegalNoticeRecord | undefined {
  return ctx.legalNotices.find((n) => n.id === id || n.noticeNumber === id);
}

export function evaluateLoanRecoveryEligibility(ctx: LMSStoreContext, loanId: string) {
  const loan = ctx.loanAccounts.find((l) => l.id === loanId);
  if (!loan) throw new Error('Loan account not found.');
  return evaluateRecoveryEligibility(loan, 0, 0);
}

export function escalateToRecovery(
  ctx: LMSStoreContext,
  payload: EscalateToRecoveryPayload,
  actorName: string = 'Collection Officer',
  actorRole: string = 'Collection Officer'
): RecoveryCaseRecord {
  const loan = ctx.loanAccounts.find((l) => l.id === payload.loanId);
  if (!loan) throw new Error('Loan account not found.');

  const existing = ctx.recoveryCases.find(
    (r) => r.loanId === payload.loanId && r.status !== 'CLOSED' && r.status !== 'CANCELLED'
  );
  if (existing) {
    throw new Error(`Active recovery case ${existing.recoveryCaseNumber} already exists for this loan.`);
  }

  const caseSeq = ctx.nextRecoverySeq++;
  const recoveryCaseNumber = `RC-${new Date().getFullYear()}-${String(caseSeq).padStart(6, '0')}`;
  const escSeq = ctx.nextEscalationSeq++;
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

  ctx.recoveryCases.unshift(newCase);
  ctx.notify();
  ctx.syncApi('/api/recovery', 'POST', { payload, actorName, actorRole });
  return newCase;
}

export function assignRecoveryOfficer(
  ctx: LMSStoreContext,
  caseId: string,
  officerId: string,
  officerName: string,
  reason?: string,
  actorName: string = 'Recovery Manager'
): RecoveryCaseRecord {
  const rc = ctx.recoveryCases.find((r) => r.id === caseId);
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
  ctx.notify();
  ctx.syncApi(`/api/recovery/${caseId}/assign`, 'POST', { officerId, officerName, reason, actorName });
  return rc;
}

export function logRecoveryAction(
  ctx: LMSStoreContext,
  payload: RecordRecoveryActionPayload,
  officerName: string = 'Rajesh Naik',
  officerRole: string = 'Senior Recovery Officer'
): RecoveryActionRecord {
  const rc = ctx.recoveryCases.find((r) => r.id === payload.recoveryCaseId);
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

  ctx.notify();
  ctx.syncApi(`/api/recovery/${rc.id}/action`, 'POST', { payload, officerName, officerRole });
  return action;
}

export function recordRecoveryNegotiation(
  ctx: LMSStoreContext,
  caseId: string,
  proposedAmount: number,
  proposedDate: string,
  frequency: string,
  reason: string,
  customerResponse?: string,
  officerName: string = 'Rajesh Naik'
): RecoveryNegotiationRecord {
  const rc = ctx.recoveryCases.find((r) => r.id === caseId);
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

  ctx.notify();
  ctx.syncApi(`/api/recovery/${caseId}/negotiation`, 'POST', { proposedAmount, proposedDate, frequency, reason, customerResponse, officerName });
  return neg;
}

export function requestLegalReview(
  ctx: LMSStoreContext,
  payload: RequestLegalReviewPayload,
  actorName: string = 'Senior Recovery Officer',
  actorRole: string = 'Senior Recovery Officer'
): LegalReviewRecord {
  const rc = ctx.recoveryCases.find((r) => r.id === payload.recoveryCaseId);
  if (!rc) throw new Error('Recovery case not found.');

  const revSeq = ctx.nextLegalReviewSeq++;
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

  ctx.notify();
  ctx.syncApi(`/api/recovery/${rc.id}/legal-review`, 'POST', { payload, actorName, actorRole });
  return review;
}

export function approveLegalReview(
  ctx: LMSStoreContext,
  reviewId: string,
  approved: boolean,
  notes?: string,
  reviewerName: string = 'Vikram Mehta',
  reviewerRole: string = 'Head of Credit & Remedial'
): LegalReviewRecord {
  let targetReview: LegalReviewRecord | undefined;
  let targetCase: RecoveryCaseRecord | undefined;

  for (const rc of ctx.recoveryCases) {
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

  ctx.notify();
  return targetReview;
}

export function createLegalCase(
  ctx: LMSStoreContext,
  payload: CreateLegalCasePayload,
  actorName: string = 'Sanjay Deshmukh',
  actorRole: string = 'Legal Officer'
): LegalCaseRecord {
  const rc = ctx.recoveryCases.find((r) => r.id === payload.recoveryCaseId);
  if (!rc) throw new Error('Recovery case not found.');

  const caseSeq = ctx.nextLegalCaseSeq++;
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
  ctx.legalCases.unshift(newLegalCase);
  rc.recoveryStage = 'LEGAL_ACTION';
  rc.status = 'LEGAL_ACTION';
  rc.updatedAt = new Date().toISOString();

  ctx.notify();
  ctx.syncApi('/api/legal-cases', 'POST', { payload, actorName, actorRole });
  return newLegalCase;
}

export function addLegalCaseEvent(
  ctx: LMSStoreContext,
  legalCaseId: string,
  eventType: string,
  notes: string,
  referenceNumber?: string,
  nextHearingDate?: string,
  actorName: string = 'Legal Officer',
  actorRole: string = 'Legal Officer'
): LegalCaseEventRecord {
  const lc = ctx.legalCases.find((l) => l.id === legalCaseId);
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

  ctx.notify();
  ctx.syncApi(`/api/legal-cases/${legalCaseId}/events`, 'POST', { eventType, notes, referenceNumber, nextHearingDate, actorName, actorRole });
  return event;
}

export function createLegalNotice(
  ctx: LMSStoreContext,
  payload: CreateLegalNoticePayload,
  preparerName: string = 'Sanjay Deshmukh'
): LegalNoticeRecord {
  const rc = ctx.recoveryCases.find((r) => r.id === payload.recoveryCaseId);
  if (!rc) throw new Error('Recovery case not found.');
  const loan = ctx.loanAccounts.find((l) => l.id === rc.loanId);
  if (!loan) throw new Error('Loan account not found.');

  const notSeq = ctx.nextLegalNoticeSeq++;
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
  ctx.legalNotices.unshift(notice);
  ctx.notify();
  ctx.syncApi('/api/legal-notices', 'POST', { payload, preparerName });
  return notice;
}

export function approveLegalNotice(
  ctx: LMSStoreContext,
  noticeId: string,
  approverName: string = 'Vikram Mehta'
): LegalNoticeRecord {
  const notice = ctx.legalNotices.find((n) => n.id === noticeId);
  if (!notice) throw new Error('Legal notice not found.');

  if (notice.preparedByName === approverName || notice.preparedBy === approverName) {
    throw new Error('Segregation of Duties Violation: The user who drafted the legal notice cannot approve it.');
  }

  notice.status = 'APPROVED';
  notice.approvedBy = approverName;
  notice.approvedByName = approverName;
  notice.approvedAt = new Date().toISOString();
  notice.updatedAt = new Date().toISOString();

  ctx.notify();
  return notice;
}

export function dispatchLegalNotice(
  ctx: LMSStoreContext,
  noticeId: string,
  trackingNumber?: string,
  dispatchMode?: string,
  dispatcherName: string = 'Sanjay Deshmukh'
): LegalNoticeRecord {
  const notice = ctx.legalNotices.find((n) => n.id === noticeId);
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

  ctx.notify();
  return notice;
}

export function resolveRecoveryCase(
  ctx: LMSStoreContext,
  caseId: string,
  resolutionOutcome: string,
  notes?: string,
  actorName: string = 'Recovery Manager'
): RecoveryCaseRecord {
  const rc = ctx.recoveryCases.find((r) => r.id === caseId);
  if (!rc) throw new Error('Recovery case not found.');

  rc.status = 'RESOLVED';
  rc.recoveryStage = 'RESOLVED';
  rc.resolutionOutcome = resolutionOutcome;
  rc.resolutionNotes = notes;
  rc.updatedAt = new Date().toISOString();

  ctx.notify();
  return rc;
}

export function getRecoveryKPIs(ctx: LMSStoreContext): RecoveryKPIs {
  let totalRecoveryExposure = 0;
  let totalRecoveredAmount = 0;
  let openCasesCount = 0;
  let criticalPriorityCount = 0;
  let pendingLegalReviewCount = 0;
  let activeLegalCasesCount = 0;
  let curedThisPeriodCount = 0;

  ctx.recoveryCases.forEach((rc) => {
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

// =========================================================================
// Restructuring, Rescheduling & Moratoriums actions (Batch 14)
// =========================================================================

export function getRestructuringRequests(ctx: LMSStoreContext): RestructuringRequestRecord[] {
  return ctx.restructuringRequests;
}

export function getRestructuringById(ctx: LMSStoreContext, id: string): RestructuringRequestRecord | undefined {
  return ctx.restructuringRequests.find((r) => r.id === id || r.requestNumber === id);
}

export function createRestructuringRequest(ctx: LMSStoreContext, payload: CreateRestructuringPayload): RestructuringRequestRecord {
  const loan = ctx.loanAccounts.find((l) => l.id === payload.loanId || l.accountNumber === payload.loanId);
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

  const seq = ctx.nextRestructuringSeq++;
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

    currentPrincipalOutstanding: (loan as any).outstandingPrincipal || loan.principalOutstanding || 0,
    currentInterestRate: loan.interestRate || 10,
    currentRemainingTenureMonths: (loan as any).remainingTenureMonths || loan.tenureMonths || 36,
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

  ctx.restructuringRequests.unshift(newReq);
  ctx.notify();
  return newReq;
}

export function startRestructuringReview(
  ctx: LMSStoreContext,
  requestId: string,
  reviewerName: string = 'Senior Credit Underwriter'
): RestructuringRequestRecord {
  const req = ctx.restructuringRequests.find((r) => r.id === requestId);
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

  ctx.notify();
  return req;
}

export function approveRestructuringRequest(
  ctx: LMSStoreContext,
  requestId: string,
  approverName: string = 'Branch Credit Committee Head',
  notes?: string
): RestructuringRequestRecord {
  const req = ctx.restructuringRequests.find((r) => r.id === requestId);
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

  ctx.notify();
  return req;
}

export function rejectRestructuringRequest(
  ctx: LMSStoreContext,
  requestId: string,
  reason: string,
  rejectorName: string = 'Credit Committee'
): RestructuringRequestRecord {
  const req = ctx.restructuringRequests.find((r) => r.id === requestId);
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

  ctx.notify();
  return req;
}

export function applyRestructuringRequest(
  ctx: LMSStoreContext,
  requestId: string,
  actorName: string = 'Operations Officer'
): RestructuringRequestRecord {
  const req = ctx.restructuringRequests.find((r) => r.id === requestId);
  if (!req) throw new Error('Restructuring request not found.');

  if (req.status !== 'APPROVED') {
    throw new Error(`Cannot apply restructuring with status '${req.status}'. Must be APPROVED first.`);
  }

  const loan = ctx.loanAccounts.find((l) => l.id === req.loanId);
  if (!loan) throw new Error('Associated Loan Account not found.');

  const newVersionNumber = (loan.currentScheduleVersion || 1) + 1;

  // Update loan terms
  loan.currentScheduleVersion = newVersionNumber;
  loan.interestRate = req.proposedInterestRate;
  (loan as any).remainingTenureMonths = req.proposedTenureMonths;
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

  ctx.notify();
  return req;
}

