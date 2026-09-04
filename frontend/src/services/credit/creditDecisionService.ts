import prisma from '@/lib/prisma';
import { AuthContextUser, writeAuditLog } from '@/lib/serverAuth';

export interface SubmitDecisionInput {
  applicationId: string;
  decision: 'APPROVE' | 'REJECT' | 'APPROVE_WITH_CONDITIONS' | 'RETURN';
  approvedAmount?: number;
  approvedTenureMonths?: number;
  approvedRoi?: number;
  conditions?: string[];
  remarks?: string;
  creditNotes?: string;
  actorUser: AuthContextUser;
  request?: Request;
}

export interface ReturnForCorrectionInput {
  applicationId: string;
  returnReason: string;
  comments: string;
  requiredCorrections: string[];
  actorUser: AuthContextUser;
  request?: Request;
}

/**
 * Validates authority limits for an approver role.
 */
export async function validateApprovalAuthority(
  amount: number,
  roleName: string,
  isSystemAdmin: boolean = false
) {
  if (isSystemAdmin) return { allowed: true, limit: 1000000000 };

  const matrixRule = await prisma.approvalMatrixRule.findFirst({
    where: {
      roleName: { equals: roleName, mode: 'insensitive' },
      isActive: true,
    },
  });

  if (!matrixRule) {
    // Default fallback limits by banking role hierarchy
    let defaultLimit = 1000000; // 10 Lakhs standard
    if (roleName.includes('Credit Committee') || roleName.includes('Director')) defaultLimit = 100000000; // 10 Cr
    else if (roleName.includes('Senior') || roleName.includes('Zonal')) defaultLimit = 25000000; // 2.5 Cr
    else if (roleName.includes('Regional') || roleName.includes('Branch Manager')) defaultLimit = 5000000; // 50 Lakhs
    else if (roleName.includes('Underwriter') || roleName.includes('Officer')) defaultLimit = 2500000; // 25 Lakhs

    if (amount > defaultLimit) {
      return {
        allowed: false,
        limit: defaultLimit,
        message: `Amount ₹${amount.toLocaleString('en-IN')} exceeds standard approval limit of ₹${defaultLimit.toLocaleString('en-IN')} for role ${roleName}. Higher authority or Credit Committee approval is required.`,
      };
    }
    return { allowed: true, limit: defaultLimit };
  }

  const limit = Number(matrixRule.maxApprovalLimit);
  if (amount > limit) {
    return {
      allowed: false,
      limit,
      message: `Amount ₹${amount.toLocaleString('en-IN')} exceeds configured matrix limit of ₹${limit.toLocaleString('en-IN')} for role ${roleName}. ${matrixRule.requiresCommittee ? 'Credit Committee approval required.' : ''}`,
    };
  }

  return { allowed: true, limit };
}

/**
 * Submits a formal credit decision with maker-checker segregation of duties.
 */
export async function submitCreditDecision(input: SubmitDecisionInput) {
  const {
    applicationId,
    decision,
    approvedAmount,
    approvedTenureMonths,
    approvedRoi,
    conditions = [],
    remarks,
    creditNotes,
    actorUser,
    request,
  } = input;

  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: {
      creditAssessments: { orderBy: { createdAt: 'desc' }, take: 1 },
      decisions: true,
      deviations: true,
    },
  });

  if (!app) {
    throw new Error(`Application ${applicationId} not found.`);
  }

  const latestAssessment = app.creditAssessments[0];
  const makerId = latestAssessment?.assignedOfficer || app.assignedOfficerId || app.submittedBy;
  const makerName = latestAssessment?.assignedOfficer || app.loanOfficer || app.submittedBy;

  // 1. MAKER-CHECKER ENFORCEMENT
  // A maker who recommended or created the proposal cannot approve it
  if (decision === 'APPROVE' || decision === 'APPROVE_WITH_CONDITIONS') {
    const isSelfApproval =
      (makerId && makerId === actorUser.id) ||
      (makerName && makerName.trim().toLowerCase() === actorUser.name.trim().toLowerCase());

    if (isSelfApproval && !actorUser.isSystemAdmin) {
      throw new Error(
        'Segregation of Duties Violation: You cannot approve a loan application that you recommended or assessed. A separate checker/approver is required.'
      );
    }

    // 2. AUTHORITY MATRIX ENFORCEMENT
    const evalAmount = approvedAmount || Number(app.requestedAmount);
    const authCheck = await validateApprovalAuthority(evalAmount, actorUser.roleName, actorUser.isSystemAdmin);
    if (!authCheck.allowed) {
      throw new Error(authCheck.message);
    }
  }

  // 3. PERSIST IMMUTABLE DECISION RECORD
  const count = await prisma.creditDecisionRecord.count();
  const decisionNumber = `DEC-${app.applicationNumber.replace('APP-', '')}-${String(count + 1).padStart(4, '0')}`;
  const cycleNumber = app.decisions.length + 1;

  const record = await prisma.creditDecisionRecord.create({
    data: {
      decisionNumber,
      applicationId,
      decision,
      decisionMakerId: actorUser.id,
      decisionMakerName: actorUser.name,
      decisionMakerRole: actorUser.roleName,
      authorityLevel: actorUser.roleName,
      approvedAmount: approvedAmount ? approvedAmount : null,
      approvedTenureMonths: approvedTenureMonths || null,
      approvedRoi: approvedRoi ? approvedRoi : null,
      conditions: conditions.length > 0 ? conditions : undefined,
      deviationsConsidered: app.deviations.length > 0 ? app.deviations.map((d) => ({
        number: d.deviationNumber,
        title: d.title,
        status: d.status,
      })) : undefined,
      remarks: remarks || null,
      creditNotes: creditNotes || null,
      makerId: makerId || null,
      makerName: makerName || null,
      cycleNumber,
    },
  });

  // 4. TRANSITION APPLICATION STAGE
  let newStatus: any = app.status;
  if (decision === 'APPROVE' || decision === 'APPROVE_WITH_CONDITIONS') {
    newStatus = 'APPROVED';
  } else if (decision === 'REJECT') {
    newStatus = 'REJECTED';
  }

  await prisma.loanApplication.update({
    where: { id: applicationId },
    data: {
      status: newStatus,
      approvedAmount: approvedAmount || app.approvedAmount,
      interestRate: approvedRoi || app.interestRate,
      rejectionReason: decision === 'REJECT' ? remarks : null,
    },
  });

  // 5. APPLICATION HISTORY & AUDIT LOG
  await prisma.applicationHistory.create({
    data: {
      applicationId,
      eventType: 'CREDIT_DECISION',
      action: `DECISION_${decision}`,
      actor: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleName,
      description: `Formal credit decision recorded: ${decision} by ${actorUser.name} (${actorUser.roleName})`,
      details: remarks || `Decision: ${decision}`,
      metadata: {
        decisionNumber,
        approvedAmount,
        approvedTenureMonths,
        approvedRoi,
        conditions,
      },
    },
  });

  await writeAuditLog({
    actorUser,
    entityType: 'CREDIT_DECISION',
    entityId: record.id,
    entityName: decisionNumber,
    action: `CREDIT_${decision}`,
    details: `Recorded credit decision ${decision} on app ${app.applicationNumber}. Amount: ₹${approvedAmount || 'N/A'}. Conditions: ${conditions.length}`,
    request,
  });

  return record;
}

/**
 * Returns an application for correction with structured correction requirements.
 */
export async function returnForCorrection(input: ReturnForCorrectionInput) {
  const {
    applicationId,
    returnReason,
    comments,
    requiredCorrections = [],
    actorUser,
    request,
  } = input;

  if (!returnReason || !comments) {
    throw new Error('Return reason and detailed comments are mandatory.');
  }

  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: { returnHistory: true },
  });

  if (!app) {
    throw new Error(`Application ${applicationId} not found.`);
  }

  const cycleNumber = app.returnHistory.length + 1;
  const returnStage = app.status;

  // 1. Create Return History record
  const returnRecord = await prisma.applicationReturnHistory.create({
    data: {
      applicationId,
      cycleNumber,
      returnStage,
      returnReason,
      comments,
      requiredCorrections,
      returnedById: actorUser.id,
      returnedByName: actorUser.name,
      returnedByRole: actorUser.roleName,
    },
  });

  // 2. Transition Application to RETURNED_FOR_CORRECTION
  await prisma.loanApplication.update({
    where: { id: applicationId },
    data: {
      status: 'RETURNED_FOR_CORRECTION',
      notes: `Returned for correction (Cycle ${cycleNumber}): ${returnReason}`,
    },
  });

  // 3. Application History
  await prisma.applicationHistory.create({
    data: {
      applicationId,
      eventType: 'RETURN_FOR_CORRECTION',
      action: 'RETURN_APPLICATION',
      actor: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleName,
      description: `Application returned for correction by ${actorUser.name} (${actorUser.roleName})`,
      details: `${returnReason} — Required: ${requiredCorrections.join(', ')}`,
      metadata: {
        cycleNumber,
        returnStage,
        returnReason,
        requiredCorrections,
      },
    },
  });

  await writeAuditLog({
    actorUser,
    entityType: 'RETURN_CORRECTION',
    entityId: returnRecord.id,
    entityName: `Cycle-${cycleNumber}`,
    action: 'RETURN_FOR_CORRECTION',
    details: `Returned app ${app.applicationNumber} for correction. Reason: ${returnReason}`,
    request,
  });

  return returnRecord;
}
