import {
  CreditAssessmentRecord,
  AssessmentTimelineEvent,
  ObligationItem,
  AssessmentRuleItem,
  AssessmentConditionItem,
  ConditionStatus,
  CreditRecommendation,
  AssessmentVersionSnapshot,
} from '../../../types';
import {
  ApprovalRecord,
  ApprovalMatrixRule,
  ApprovalMatrixAuditItem,
  ApprovalLevelExecution,
  ApprovalCondition,
  ApprovalException,
  ApprovalDecisionType,
} from '../../../types/approvalTypes';
import { LMSStoreContext } from '../types';
import { logAudit } from './adminSlice';
import { logApplicationHistory } from './applicationSlice';

export function calculateEMI(principal: number, annualRatePct: number, tenureMonths: number): number {
  if (tenureMonths <= 0 || principal <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return Math.round(principal / tenureMonths);
  const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
  return Math.round(emi);
}

export function recalculateCreditAssessment(assessment: CreditAssessmentRecord): CreditAssessmentRecord {
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

  assessment.proposedEmi = calculateEMI(calcPrincipal, calcRate, calcTenure);
  assessment.postApplicationObligationRatio = Number((((totalEmi + assessment.proposedEmi) / totalInc) * 100).toFixed(2));

  return assessment;
}

export function getCreditAssessmentById(ctx: LMSStoreContext, id: string): CreditAssessmentRecord | undefined {
  return ctx.creditAssessments.find((ca) => ca.id === id || ca.assessmentNumber === id);
}

export function getCreditAssessmentByAppId(ctx: LMSStoreContext, applicationId: string): CreditAssessmentRecord | undefined {
  return ctx.creditAssessments.find((ca) => ca.applicationId === applicationId || ca.applicationNumber === applicationId);
}

export function logCreditTimeline(
  ctx: LMSStoreContext,
  assessmentId: string,
  event: Omit<AssessmentTimelineEvent, 'id' | 'assessmentId' | 'timestamp'>
) {
  const assessment = ctx.creditAssessments.find((ca) => ca.id === assessmentId);
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

export function assignCreditAssessment(
  ctx: LMSStoreContext,
  assessmentId: string,
  officerId: string,
  officerName: string,
  notes: string = '',
  actor: string = 'Alex Morgan'
): CreditAssessmentRecord {
  const ca = ctx.creditAssessments.find((item) => item.id === assessmentId);
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

  logCreditTimeline(ctx, assessmentId, {
    eventType: 'ASSESSMENT_ASSIGNED',
    eventTitle: 'Assessment Assigned to Credit Officer',
    actor,
    actorRole: 'Operations Manager',
    previousState: prevStatus,
    newState: ca.status,
    notes: `Assigned to ${officerName}. Notes: ${notes || 'Standard allocation'}`,
  });

  logAudit(ctx, {
    entityType: 'USER',
    entityId: ca.customerId,
    entityName: ca.customerName,
    action: 'CREDIT_ASSESSMENT_ASSIGNED',
    details: `Credit assessment ${ca.assessmentNumber} assigned to ${officerName} by ${actor}.`,
  });

  ctx.notify();
  return ca;
}

export function startCreditAssessment(
  ctx: LMSStoreContext,
  assessmentId: string,
  actor: string = 'Sunita Patel'
): CreditAssessmentRecord {
  const ca = ctx.creditAssessments.find((item) => item.id === assessmentId);
  if (!ca) throw new Error('Credit assessment not found');

  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const prevStatus = ca.status;
  ca.status = 'IN_PROGRESS';
  ca.startedAt = `${today} ${nowTime}`;
  ca.startedBy = actor;
  ca.updatedDate = today;

  logCreditTimeline(ctx, assessmentId, {
    eventType: 'ASSESSMENT_STARTED',
    eventTitle: 'Credit Assessment Workspace Opened',
    actor,
    actorRole: 'Credit Officer',
    previousState: prevStatus,
    newState: 'IN_PROGRESS',
    notes: 'Underwriter initiated detailed financial and risk appraisal.',
  });

  ctx.notify();
  return ca;
}

export function updateCreditAssessment(
  ctx: LMSStoreContext,
  assessmentId: string,
  updates: Partial<CreditAssessmentRecord>,
  actor: string = 'Sunita Patel'
): CreditAssessmentRecord {
  const ca = ctx.creditAssessments.find((item) => item.id === assessmentId);
  if (!ca) throw new Error('Credit assessment not found');

  Object.assign(ca, updates);
  recalculateCreditAssessment(ca);
  ca.updatedDate = new Date().toISOString().split('T')[0];

  ctx.notify();
  return ca;
}

export function addCreditObligation(
  ctx: LMSStoreContext,
  assessmentId: string,
  obligationData: Omit<ObligationItem, 'id' | 'assessmentId'>,
  actor: string = 'Sunita Patel'
): ObligationItem {
  const ca = ctx.creditAssessments.find((item) => item.id === assessmentId);
  if (!ca) throw new Error('Credit assessment not found');

  const newObligation: ObligationItem = {
    id: `ob_${Date.now()}`,
    assessmentId,
    ...obligationData,
  };

  if (!ca.obligations) ca.obligations = [];
  ca.obligations.push(newObligation);
  recalculateCreditAssessment(ca);

  logCreditTimeline(ctx, assessmentId, {
    eventType: 'OBLIGATION_ADDED',
    eventTitle: 'Existing Obligation Added',
    actor,
    actorRole: 'Credit Officer',
    notes: `Added ${obligationData.loanType} from ${obligationData.lenderName} with EMI ₹${obligationData.monthlyEmi.toLocaleString('en-IN')}.`,
  });

  ctx.notify();
  return newObligation;
}

export function deleteCreditObligation(
  ctx: LMSStoreContext,
  assessmentId: string,
  obligationId: string,
  actor: string = 'Sunita Patel'
): boolean {
  const ca = ctx.creditAssessments.find((item) => item.id === assessmentId);
  if (!ca) throw new Error('Credit assessment not found');

  const existingIndex = (ca.obligations || []).findIndex((o) => o.id === obligationId);
  if (existingIndex === -1) return false;

  const removed = ca.obligations.splice(existingIndex, 1)[0];
  recalculateCreditAssessment(ca);

  logCreditTimeline(ctx, assessmentId, {
    eventType: 'OBLIGATION_REMOVED',
    eventTitle: 'Existing Obligation Removed',
    actor,
    actorRole: 'Credit Officer',
    notes: `Removed obligation from ${removed.lenderName} (EMI: ₹${removed.monthlyEmi.toLocaleString('en-IN')}).`,
  });

  ctx.notify();
  return true;
}

export function evaluateCreditRules(
  ctx: LMSStoreContext,
  assessmentId: string,
  actor: string = 'Sunita Patel'
): AssessmentRuleItem[] {
  const ca = ctx.creditAssessments.find((item) => item.id === assessmentId);
  if (!ca) throw new Error('Credit assessment not found');

  recalculateCreditAssessment(ca);

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

  logCreditTimeline(ctx, assessmentId, {
    eventType: 'RULES_EVALUATED',
    eventTitle: 'Credit Policy Rules Re-evaluated',
    actor,
    actorRole: 'Credit Officer',
    notes: `Automated rule engine evaluation: ${passedCount} Passed, ${warnCount} Warnings, ${failCount} Failed.`,
  });

  ctx.notify();
  return evaluatedRules;
}

export function addCreditCondition(
  ctx: LMSStoreContext,
  assessmentId: string,
  conditionData: Omit<AssessmentConditionItem, 'id' | 'assessmentId' | 'addedBy' | 'addedAt' | 'status'>,
  actor: string = 'Sunita Patel'
): AssessmentConditionItem {
  const ca = ctx.creditAssessments.find((item) => item.id === assessmentId);
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

  logCreditTimeline(ctx, assessmentId, {
    eventType: 'CONDITION_ADDED',
    eventTitle: 'Underwriting Condition Attached',
    actor,
    actorRole: 'Credit Officer',
    notes: `Condition [${conditionData.requiredBefore}]: ${conditionData.description}`,
  });

  ctx.notify();
  return newCondition;
}

export function updateCreditConditionStatus(
  ctx: LMSStoreContext,
  assessmentId: string,
  conditionId: string,
  status: ConditionStatus,
  resolutionNotes: string = '',
  actor: string = 'Sunita Patel'
): boolean {
  const ca = ctx.creditAssessments.find((item) => item.id === assessmentId);
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

  logCreditTimeline(ctx, assessmentId, {
    eventType: 'CONDITION_UPDATED',
    eventTitle: `Condition Status Changed to ${status}`,
    actor,
    actorRole: 'Credit Officer',
    notes: `Condition "${cond.description}" marked ${status}. Notes: ${resolutionNotes || 'None'}`,
  });

  ctx.notify();
  return true;
}

export function deleteCreditCondition(
  ctx: LMSStoreContext,
  assessmentId: string,
  conditionId: string,
  actor: string = 'Sunita Patel'
): boolean {
  const ca = ctx.creditAssessments.find((item) => item.id === assessmentId);
  if (!ca) throw new Error('Credit assessment not found');

  const idx = (ca.conditions || []).findIndex((c) => c.id === conditionId);
  if (idx === -1) return false;

  const removed = ca.conditions.splice(idx, 1)[0];

  logCreditTimeline(ctx, assessmentId, {
    eventType: 'CONDITION_REMOVED',
    eventTitle: 'Condition Removed',
    actor,
    actorRole: 'Credit Officer',
    notes: `Condition removed: ${removed.description}`,
  });

  ctx.notify();
  return true;
}

export function returnCreditAssessment(
  ctx: LMSStoreContext,
  assessmentId: string,
  returnReason: string,
  returnRequiredAction: string,
  actor: string = 'Sunita Patel'
): CreditAssessmentRecord {
  const ca = ctx.creditAssessments.find((item) => item.id === assessmentId);
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
  const app = ctx.applications.find((a) => a.id === ca.applicationId);
  if (app) {
    app.status = 'DOCUMENT_PENDING';
    app.notes = `Credit Assessment returned: ${returnReason}`;
    logApplicationHistory(ctx, app.id, {
      eventType: 'STATUS_CHANGED',
      actor,
      actorRole: 'Credit Officer',
      description: `Application returned from credit assessment to sourcing officer.`,
      details: `Reason: ${returnReason} | Action: ${returnRequiredAction}`,
    });
  }

  logCreditTimeline(ctx, assessmentId, {
    eventType: 'ASSESSMENT_RETURNED',
    eventTitle: 'Assessment Returned to Sourcing Branch',
    actor,
    actorRole: 'Credit Officer',
    previousState: prevStatus,
    newState: 'RETURNED',
    notes: `Return Reason: ${returnReason} | Required Action: ${returnRequiredAction}`,
  });

  logAudit(ctx, {
    entityType: 'USER',
    entityId: ca.customerId,
    entityName: ca.customerName,
    action: 'CREDIT_ASSESSMENT_RETURNED',
    details: `Credit assessment ${ca.assessmentNumber} returned to sourcing branch by ${actor}. Reason: ${returnReason}`,
  });

  ctx.notify();
  return ca;
}

export function submitCreditAssessmentRecommendation(
  ctx: LMSStoreContext,
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
  const ca = ctx.creditAssessments.find((item) => item.id === assessmentId);
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

  recalculateCreditAssessment(ca);

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
  const app = ctx.applications.find((a) => a.id === ca.applicationId);
  if (app) {
    app.status = 'UNDER_REVIEW';
    app.notes = `Credit Underwriter recommended: ${data.recommendation} (Amount: ₹${data.recommendedAmount.toLocaleString('en-IN')})`;
    logApplicationHistory(ctx, app.id, {
      eventType: 'STATUS_CHANGED',
      actor,
      actorRole: 'Credit Officer',
      description: `Credit assessment recommendation [${data.recommendation}] submitted for Sanction Committee approval.`,
      details: `Recommended Amount: ₹${data.recommendedAmount.toLocaleString('en-IN')} @ ${data.recommendedInterestRate}% for ${data.recommendedTenureMonths} mos.`,
    });
  }

  logCreditTimeline(ctx, assessmentId, {
    eventType: 'RECOMMENDATION_SUBMITTED',
    eventTitle: `Credit Decision Recommendation Submitted (v${nextVersionNum})`,
    actor,
    actorRole: 'Credit Officer',
    previousState: prevStatus,
    newState: 'SUBMITTED',
    notes: `Decision: ${data.recommendation} | Recommended: ₹${data.recommendedAmount.toLocaleString('en-IN')} @ ${data.recommendedInterestRate}% | Notes: ${data.recommendationNotes}`,
  });

  logAudit(ctx, {
    entityType: 'USER',
    entityId: ca.customerId,
    entityName: ca.customerName,
    action: 'CREDIT_DECISION_SUBMITTED',
    details: `Credit assessment ${ca.assessmentNumber} decision [${data.recommendation}] for ₹${data.recommendedAmount.toLocaleString('en-IN')} submitted by ${actor}.`,
  });

  if (data.recommendation === 'RECOMMEND_APPROVE') {
    try {
      createApprovalFromCreditAssessment(ctx, assessmentId, actor);
    } catch (err) {
      console.warn('Could not auto-create approval from credit assessment:', err);
    }
  }

  ctx.notify();
  return ca;
}

// ==========================================
// APPROVAL WORKFLOW & MATRIX METHODS
// ==========================================

export function evaluateApprovalMatrix(ctx: LMSStoreContext, productCode: string, amount: number, branchId?: string): ApprovalMatrixRule[] {
  const activeRules = ctx.approvalMatrixRules.filter((r) => {
    if (!r.isActive) return false;
    if (r.productCode !== productCode && r.productCode !== 'ALL') return false;
    if (branchId && r.branchId && r.branchId !== 'ALL' && r.branchId !== branchId) return false;
    return true;
  });

  const applicableRules = activeRules.filter((r) => {
    return (r.minAmount <= amount && r.maxAmount >= amount) || (r.level === 1 && amount > r.maxAmount);
  });

  const sorted = applicableRules.length > 0
    ? applicableRules.sort((a, b) => a.level - b.level)
    : activeRules.filter(r => r.level === 1).slice(0, 1);

  return sorted;
}

export function getApprovals(ctx: LMSStoreContext): ApprovalRecord[] {
  return ctx.approvals;
}

export function getApprovalById(ctx: LMSStoreContext, id: string): ApprovalRecord | undefined {
  return ctx.approvals.find((a) => a.id === id || a.approvalNumber === id);
}

export function getApprovalByAppId(ctx: LMSStoreContext, applicationId: string): ApprovalRecord | undefined {
  return ctx.approvals.find((a) => a.applicationId === applicationId || a.applicationNumber === applicationId);
}

export function getApprovalByCreditAssessmentId(ctx: LMSStoreContext, caId: string): ApprovalRecord | undefined {
  return ctx.approvals.find((a) => a.creditAssessmentId === caId || a.creditAssessmentNumber === caId);
}

export function createApprovalFromCreditAssessment(ctx: LMSStoreContext, caId: string, actorName: string = 'System Engine'): ApprovalRecord {
  const existing = getApprovalByCreditAssessmentId(ctx, caId);
  if (existing) return existing;

  const ca = ctx.creditAssessments.find((item) => item.id === caId || item.assessmentNumber === caId);
  if (!ca) throw new Error('Credit assessment not found');

  const app = ctx.applications.find((a) => a.id === ca.applicationId);
  const amountToSanction = ca.recommendedAmount > 0 ? ca.recommendedAmount : (ca.requestedAmount || 500000);

  const matchedRules = evaluateApprovalMatrix(ctx, ca.productCode, amountToSanction, ca.branchId);

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
  const approvalNum = `AP-2026-${String(ctx.nextApprovalSeq++).padStart(6, '0')}`;

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

  newApproval.conditions.forEach(c => c.approvalId = newApproval.id);
  newApproval.history.forEach(h => h.approvalId = newApproval.id);

  ctx.approvals.unshift(newApproval);

  if (app) {
    app.status = 'UNDER_REVIEW';
    logApplicationHistory(ctx, app.id, {
      eventType: 'STATUS_CHANGED',
      actor: actorName,
      actorRole: 'Workflow Automation',
      description: `Application routed to Approvals Queue (${approvalNum}).`,
      details: `Delegation Matrix evaluated ${levels.length} level(s) for recommended ₹${ca.recommendedAmount.toLocaleString('en-IN')}.`,
    });
  }

  logAudit(ctx, {
    entityType: 'USER',
    entityId: newApproval.customerId,
    entityName: newApproval.customerName,
    action: 'APPROVAL_CREATED',
    details: `Approval dossier ${newApproval.approvalNumber} created for application ${newApproval.applicationNumber} with ${levels.length} level(s).`,
  });

  ctx.notify();
  return newApproval;
}

export function assignApproval(
  ctx: LMSStoreContext,
  approvalId: string,
  approverId: string,
  approverName: string,
  notes?: string,
  actorName: string = 'Operations Head'
): ApprovalRecord {
  const approval = ctx.approvals.find((a) => a.id === approvalId);
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

  logAudit(ctx, {
    entityType: 'USER',
    entityId: approval.customerId,
    entityName: approval.customerName,
    action: isReassignment ? 'APPROVAL_REASSIGNED' : 'APPROVAL_ASSIGNED',
    details: `Approval ${approval.approvalNumber} assigned to ${approverName} by ${actorName}.`,
  });

  ctx.notify();
  return approval;
}

export function startApprovalReview(ctx: LMSStoreContext, approvalId: string, actorName: string = 'Approver'): ApprovalRecord {
  const approval = ctx.approvals.find((a) => a.id === approvalId);
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

  ctx.notify();
  return approval;
}

export function makeApprovalDecision(
  ctx: LMSStoreContext,
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
  const approval = ctx.approvals.find((a) => a.id === approvalId);
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
      const app = ctx.applications.find((a) => a.id === approval.applicationId);
      if (app) {
        app.status = 'APPROVED';
        app.notes = `Formal Sanction Approval Granted: ₹${approval.approvedAmount?.toLocaleString('en-IN')} @ ${approval.approvedInterestRate}% p.a. for ${approval.approvedTenureMonths} months.`;
        logApplicationHistory(ctx, app.id, {
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
    const app = ctx.applications.find((a) => a.id === approval.applicationId);
    if (app) {
      app.status = 'REJECTED';
      app.notes = `Application Rejected by Sanction Authority: ${decisionData.decisionNotes}`;
      logApplicationHistory(ctx, app.id, {
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
    const ca = ctx.creditAssessments.find((c) => c.id === approval.creditAssessmentId);
    if (ca) {
      ca.status = 'RETURNED';
    }

    // Update application
    const app = ctx.applications.find((a) => a.id === approval.applicationId);
    if (app) {
      app.notes = `Returned for clarification: ${decisionData.returnReason || decisionData.decisionNotes}`;
      logApplicationHistory(ctx, app.id, {
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

  logAudit(ctx, {
    entityType: 'USER',
    entityId: approval.customerId,
    entityName: approval.customerName,
    action: `APPROVAL_${decisionData.decision}`,
    details: `Approval ${approval.approvalNumber} ${decisionData.decision} by ${actorName} (${actorRole}). Notes: ${decisionData.decisionNotes}`,
  });

  ctx.notify();
  return { success: true, approval };
}

export function addApprovalCondition(
  ctx: LMSStoreContext,
  approvalId: string,
  condition: Omit<ApprovalCondition, 'id' | 'approvalId' | 'addedAt'>,
  actorName: string = 'Approver'
): ApprovalCondition {
  const approval = ctx.approvals.find((a) => a.id === approvalId);
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

  ctx.notify();
  return newCond;
}

export function updateApprovalConditionStatus(
  ctx: LMSStoreContext,
  approvalId: string,
  conditionId: string,
  status: ConditionStatus,
  resolutionNotes?: string,
  waiverReason?: string,
  actorName: string = 'Approver'
): ApprovalRecord {
  const approval = ctx.approvals.find((a) => a.id === approvalId);
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

  ctx.notify();
  return approval;
}

export function deleteApprovalCondition(ctx: LMSStoreContext, approvalId: string, conditionId: string, actorName: string = 'Approver'): ApprovalRecord {
  const approval = ctx.approvals.find((a) => a.id === approvalId);
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

  ctx.notify();
  return approval;
}

export function addApprovalException(
  ctx: LMSStoreContext,
  approvalId: string,
  exception: Omit<ApprovalException, 'id' | 'approvalId' | 'createdAt' | 'status'>,
  actorName: string = 'Approver'
): ApprovalException {
  const approval = ctx.approvals.find((a) => a.id === approvalId);
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

  ctx.notify();
  return newExc;
}

export function routeApprovalException(
  ctx: LMSStoreContext,
  approvalId: string,
  exceptionId: string,
  routedToRole: string,
  actorName: string = 'Approver'
): ApprovalRecord {
  const approval = ctx.approvals.find((a) => a.id === approvalId);
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

  ctx.notify();
  return approval;
}

export function resolveApprovalException(
  ctx: LMSStoreContext,
  approvalId: string,
  exceptionId: string,
  status: 'APPROVED' | 'REJECTED',
  decisionNotes: string,
  actorName: string = 'Regional Credit Manager'
): ApprovalRecord {
  const approval = ctx.approvals.find((a) => a.id === approvalId);
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

  ctx.notify();
  return approval;
}

export function addApprovalMatrixRule(
  ctx: LMSStoreContext,
  rule: Omit<ApprovalMatrixRule, 'id' | 'createdDate' | 'updatedDate'>,
  actorName: string = 'Siddharth Rao (EMP-001001)'
): { success: boolean; message?: string; rule?: ApprovalMatrixRule } {
  // Validate overlapping active rules for same product, branch, and level
  const overlap = ctx.approvalMatrixRules.find((r) => {
    if (!r.isActive) return false;
    if (r.productCode !== rule.productCode) return false;
    if (r.level !== rule.level) return false;
    if (r.branchId !== rule.branchId && r.branchId !== 'ALL' && rule.branchId !== 'ALL') return false;
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

  ctx.approvalMatrixRules.push(newRule);

  ctx.approvalMatrixAudits.unshift({
    id: `audit_mat_${Date.now()}`,
    ruleId: newId,
    ruleCode: newRule.ruleCode,
    timestamp: `${today} ${nowTime}`,
    actor: actorName,
    action: 'CREATED',
    details: `Created new matrix rule ${newRule.ruleCode} for ${newRule.productName} Level ${newRule.level} (Limit ₹${newRule.authorityLimit.toLocaleString('en-IN')}).`,
  });

  ctx.notify();
  return { success: true, rule: newRule };
}

export function updateApprovalMatrixRule(
  ctx: LMSStoreContext,
  ruleId: string,
  updates: Partial<ApprovalMatrixRule>,
  actorName: string = 'Siddharth Rao (EMP-001001)'
): { success: boolean; message?: string; rule?: ApprovalMatrixRule } {
  const rule = ctx.approvalMatrixRules.find((r) => r.id === ruleId);
  if (!rule) return { success: false, message: 'Approval matrix rule not found' };

  if (updates.minAmount !== undefined || updates.maxAmount !== undefined || updates.level !== undefined) {
    const minA = updates.minAmount !== undefined ? updates.minAmount : rule.minAmount;
    const maxA = updates.maxAmount !== undefined ? updates.maxAmount : rule.maxAmount;
    const lvl = updates.level !== undefined ? updates.level : rule.level;
    const prod = updates.productCode !== undefined ? updates.productCode : rule.productCode;

    const overlap = ctx.approvalMatrixRules.find((r) => {
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

  ctx.approvalMatrixAudits.unshift({
    id: `audit_mat_${Date.now()}`,
    ruleId: rule.id,
    ruleCode: rule.ruleCode,
    timestamp: `${today} ${nowTime}`,
    actor: actorName,
    action: 'UPDATED',
    details: `Updated parameters for matrix rule ${rule.ruleCode}.`,
  });

  ctx.notify();
  return { success: true, rule };
}

export function toggleApprovalMatrixRuleActive(
  ctx: LMSStoreContext,
  ruleId: string,
  isActive: boolean,
  actorName: string = 'Siddharth Rao (EMP-001001)'
): ApprovalMatrixRule {
  const rule = ctx.approvalMatrixRules.find((r) => r.id === ruleId);
  if (!rule) throw new Error('Rule not found');

  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  rule.isActive = isActive;
  rule.updatedDate = today;
  rule.updatedBy = actorName;

  ctx.approvalMatrixAudits.unshift({
    id: `audit_mat_${Date.now()}`,
    ruleId: rule.id,
    ruleCode: rule.ruleCode,
    timestamp: `${today} ${nowTime}`,
    actor: actorName,
    action: isActive ? 'ACTIVATED' : 'DEACTIVATED',
    details: `Matrix rule ${rule.ruleCode} was ${isActive ? 'activated' : 'deactivated'} by ${actorName}.`,
  });

  ctx.notify();
  return rule;
}

export function deleteApprovalMatrixRule(
  ctx: LMSStoreContext,
  ruleId: string,
  actorName: string = 'Siddharth Rao (EMP-001001)'
): { success: boolean; message?: string } {
  const index = ctx.approvalMatrixRules.findIndex((r) => r.id === ruleId);
  if (index === -1) return { success: false, message: 'Rule not found' };

  const rule = ctx.approvalMatrixRules[index];
  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  ctx.approvalMatrixRules.splice(index, 1);

  ctx.approvalMatrixAudits.unshift({
    id: `audit_mat_${Date.now()}`,
    ruleId,
    ruleCode: rule.ruleCode,
    timestamp: `${today} ${nowTime}`,
    actor: actorName,
    action: 'DEACTIVATED',
    details: `Matrix rule ${rule.ruleCode} deleted by ${actorName}.`,
  });

  ctx.notify();
  return { success: true };
}

