import prisma from '@/lib/prisma';
import { AuthContextUser, writeAuditLog } from '@/lib/serverAuth';
import { ApplicationStatus } from '@prisma/client';

export type WorkflowStage =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'DOCUMENT_REVIEW'
  | 'BUREAU_REVIEW'
  | 'ELIGIBILITY_REVIEW'
  | 'CREDIT_REVIEW'
  | 'DEVIATION_REVIEW'
  | 'APPROVAL'
  | 'APPROVED'
  | 'SANCTIONED'
  | 'DISBURSED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'CANCELLED'
  | 'RETURNED_FOR_CORRECTION';

export const STANDARD_WORKFLOW_STAGES: WorkflowStage[] = [
  'DRAFT',
  'SUBMITTED',
  'DOCUMENT_REVIEW',
  'BUREAU_REVIEW',
  'ELIGIBILITY_REVIEW',
  'CREDIT_REVIEW',
  'DEVIATION_REVIEW',
  'APPROVAL',
  'APPROVED',
  'SANCTIONED',
  'DISBURSED',
];

/**
 * Returns permissible workflow stages for a loan product.
 */
export async function getProductWorkflowStages(productCode: string): Promise<WorkflowStage[]> {
  const product = await prisma.loanProduct.findFirst({
    where: { code: productCode },
  });

  if (product && (product as any).workflowStages && Array.isArray((product as any).workflowStages)) {
    return (product as any).workflowStages;
  }

  // Fast-track / Unsecured Personal Loan express pipeline
  if (productCode.startsWith('PL_') || productCode.includes('EXPRESS') || productCode.includes('PERSONAL')) {
    return [
      'DRAFT',
      'SUBMITTED',
      'DOCUMENT_REVIEW',
      'BUREAU_REVIEW',
      'ELIGIBILITY_REVIEW',
      'CREDIT_REVIEW',
      'APPROVAL',
      'APPROVED',
      'SANCTIONED',
      'DISBURSED',
    ];
  }

  return STANDARD_WORKFLOW_STAGES;
}

export interface TransitionStageInput {
  applicationId: string;
  targetStage: WorkflowStage;
  actorUser: AuthContextUser;
  remarks?: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  request?: Request;
}

/**
 * Transitions an application to a target workflow stage with guard validations.
 */
export async function transitionWorkflowStage(input: TransitionStageInput) {
  const {
    applicationId,
    targetStage,
    actorUser,
    remarks,
    assignedOfficerId,
    assignedOfficerName,
    request,
  } = input;

  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: {
      checklistItems: true,
      deviations: true,
      documents: true,
    },
  });

  if (!app) {
    throw new Error(`Loan application ${applicationId} not found.`);
  }

  const currentStage = app.status as WorkflowStage;
  if (currentStage === targetStage) {
    return { success: true, application: app, message: `Application is already in stage ${targetStage}` };
  }

  // Guard 1: Terminal stages cannot be moved arbitrarily
  if (['DISBURSED', 'CANCELLED', 'WITHDRAWN'].includes(currentStage)) {
    throw new Error(`Cannot transition application from terminal stage: ${currentStage}`);
  }

  // Guard 2: Approval Gate Requirements
  if (targetStage === 'APPROVAL' || targetStage === 'APPROVED') {
    // Check mandatory checklist items
    if (app.checklistItems.length === 0) {
      throw new Error(
        `Cannot transition to ${targetStage}: Credit review checklist has not been completed.`
      );
    }

    const failedChecklists = app.checklistItems.filter(
      (c) => c.isRequired && (c.status === 'PENDING' || c.status === 'FAILED')
    );
    if (failedChecklists.length > 0) {
      throw new Error(
        `Cannot transition to ${targetStage}: ${failedChecklists.length} mandatory checklist item(s) are incomplete (${failedChecklists.map((f) => f.title).join(', ')}).`
      );
    }

    // Check mandatory documents
    const unverifiedDocs = app.documents.filter((d) => d.isMandatory && d.status !== 'VERIFIED');
    if (app.documents.length === 0 || unverifiedDocs.length > 0) {
      throw new Error(
        `Cannot transition to ${targetStage}: Mandatory documents are incomplete or unverified.`
      );
    }

    // Check open deviations
    const pendingDeviations = app.deviations.filter((d) => d.status === 'PENDING');
    if (pendingDeviations.length > 0) {
      throw new Error(
        `Cannot transition to ${targetStage}: ${pendingDeviations.length} deviation(s) are pending approval.`
      );
    }
  }

  // Update application
  const updateData: any = {
    status: targetStage as ApplicationStatus,
  };

  if (assignedOfficerId) {
    updateData.assignedOfficerId = assignedOfficerId;
    updateData.loanOfficer = assignedOfficerName || assignedOfficerId;
  }

  if (targetStage === 'SUBMITTED' && !app.submittedAt) {
    updateData.submittedAt = new Date();
    updateData.submittedBy = actorUser.name;
  }

  const updatedApp = await prisma.loanApplication.update({
    where: { id: applicationId },
    data: updateData,
  });

  // Log Application History
  await prisma.applicationHistory.create({
    data: {
      applicationId,
      eventType: 'WORKFLOW_STAGE_CHANGE',
      action: `TRANSITION_TO_${targetStage}`,
      actor: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleName,
      description: `Application transitioned from ${currentStage} to ${targetStage}`,
      details: remarks || `Status moved to ${targetStage}`,
      metadata: {
        fromStage: currentStage,
        toStage: targetStage,
        remarks,
        assignedOfficerId,
        assignedOfficerName,
      },
    },
  });

  // Log Audit Trail
  await writeAuditLog({
    actorUser,
    entityType: 'APPLICATION',
    entityId: applicationId,
    entityName: app.applicationNumber,
    action: `STAGE_CHANGE_${targetStage}`,
    details: `Application stage changed from ${currentStage} to ${targetStage}. Notes: ${remarks || 'None'}`,
    changes: { previousStage: currentStage, newStage: targetStage },
    request,
  });

  return {
    success: true,
    application: updatedApp,
    previousStage: currentStage,
    currentStage: targetStage,
  };
}

/**
 * Assigns an application to a credit underwriter / maker or committee checker.
 */
export async function assignWorkflowApplication(params: {
  applicationId: string;
  officerId: string;
  officerName: string;
  roleName: string;
  actorUser: AuthContextUser;
  remarks?: string;
  request?: Request;
}) {
  const { applicationId, officerId, officerName, roleName, actorUser, remarks, request } = params;

  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
  });

  if (!app) {
    throw new Error(`Application ${applicationId} not found.`);
  }

  const previousOfficer = app.loanOfficer || 'Unassigned';

  const updated = await prisma.loanApplication.update({
    where: { id: applicationId },
    data: {
      assignedOfficerId: officerId,
      loanOfficer: officerName,
    },
  });

  await prisma.applicationHistory.create({
    data: {
      applicationId,
      eventType: 'OFFICER_ASSIGNMENT',
      action: 'ASSIGN_APPLICATION',
      actor: actorUser.id,
      actorName: actorUser.name,
      actorRole: actorUser.roleName,
      description: `Application assigned to ${officerName} (${roleName})`,
      details: remarks || `Reassigned from ${previousOfficer}`,
      metadata: {
        assignedOfficerId: officerId,
        assignedOfficerName: officerName,
        previousOfficer,
        roleName,
      },
    },
  });

  await writeAuditLog({
    actorUser,
    entityType: 'APPLICATION',
    entityId: applicationId,
    entityName: app.applicationNumber,
    action: 'ASSIGN_OFFICER',
    details: `Assigned application to ${officerName} (${roleName}). Previous: ${previousOfficer}`,
    request,
  });

  return { success: true, application: updated };
}
