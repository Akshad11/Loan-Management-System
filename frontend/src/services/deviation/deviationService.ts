import prisma from '@/lib/prisma';
import { AuthContextUser, writeAuditLog } from '@/lib/serverAuth';

export interface CreateDeviationInput {
  applicationId: string;
  category?: 'POLICY' | 'FOIR' | 'LTV' | 'CIBIL' | 'ROI' | 'DOCUMENT' | 'TENURE';
  title: string;
  deviationReason: string;
  mitigantNotes?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  requestedRoi?: number;
  actorUser: AuthContextUser;
  request?: Request;
}

/**
 * Creates a formal deviation or rate negotiation request.
 */
export async function createDeviation(input: CreateDeviationInput) {
  const {
    applicationId,
    category = 'POLICY',
    title,
    deviationReason,
    mitigantNotes,
    severity = 'MEDIUM',
    requestedRoi,
    actorUser,
    request,
  } = input;

  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
  });

  if (!app) {
    throw new Error(`Application ${applicationId} not found.`);
  }

  const count = await prisma.applicationDeviation.count({
    where: { applicationId },
  });
  const deviationNumber = `DEV-${app.applicationNumber.replace('APP-', '')}-${String(count + 1).padStart(2, '0')}`;

  const deviation = await prisma.applicationDeviation.create({
    data: {
      deviationNumber,
      applicationId,
      category,
      title: title.trim(),
      deviationReason: deviationReason.trim(),
      mitigantNotes: mitigantNotes?.trim() || null,
      severity,
      requestedRoi: requestedRoi !== undefined ? requestedRoi : null,
      status: 'PENDING',
      requestedBy: actorUser.id,
      requestedByName: actorUser.name,
    },
  });

  await writeAuditLog({
    actorUser,
    entityType: 'DEVIATION',
    entityId: deviation.id,
    entityName: deviationNumber,
    action: 'CREATE_DEVIATION',
    details: `Created ${severity} severity ${category} deviation "${title}" for app ${app.applicationNumber}`,
    request,
  });

  return deviation;
}

/**
 * Approves a policy or pricing deviation.
 */
export async function approveDeviation(params: {
  applicationId: string;
  deviationId: string;
  approvedRoi?: number;
  actorUser: AuthContextUser;
  request?: Request;
}) {
  const { applicationId, deviationId, approvedRoi, actorUser, request } = params;

  const dev = await prisma.applicationDeviation.findUnique({
    where: { id: deviationId },
    include: { application: true },
  });

  if (!dev || dev.applicationId !== applicationId) {
    throw new Error(`Deviation ${deviationId} not found for application ${applicationId}.`);
  }

  const updated = await prisma.applicationDeviation.update({
    where: { id: deviationId },
    data: {
      status: 'APPROVED',
      approvedRoi: approvedRoi !== undefined ? approvedRoi : dev.requestedRoi,
      approvedBy: actorUser.id,
      approvedByName: actorUser.name,
      approvedAt: new Date(),
      rejectionReason: null,
    },
  });

  await writeAuditLog({
    actorUser,
    entityType: 'DEVIATION',
    entityId: dev.id,
    entityName: dev.deviationNumber,
    action: 'APPROVE_DEVIATION',
    details: `Approved deviation ${dev.deviationNumber} (${dev.title}) by ${actorUser.name}`,
    request,
  });

  return updated;
}

/**
 * Rejects a policy or pricing deviation.
 */
export async function rejectDeviation(params: {
  applicationId: string;
  deviationId: string;
  reason: string;
  actorUser: AuthContextUser;
  request?: Request;
}) {
  const { applicationId, deviationId, reason, actorUser, request } = params;

  if (!reason || reason.trim().length < 3) {
    throw new Error('A valid reason is required to reject a deviation.');
  }

  const dev = await prisma.applicationDeviation.findUnique({
    where: { id: deviationId },
    include: { application: true },
  });

  if (!dev || dev.applicationId !== applicationId) {
    throw new Error(`Deviation ${deviationId} not found for application ${applicationId}.`);
  }

  const updated = await prisma.applicationDeviation.update({
    where: { id: deviationId },
    data: {
      status: 'REJECTED',
      rejectionReason: reason.trim(),
      approvedBy: actorUser.id,
      approvedByName: actorUser.name,
      approvedAt: new Date(),
    },
  });

  await writeAuditLog({
    actorUser,
    entityType: 'DEVIATION',
    entityId: dev.id,
    entityName: dev.deviationNumber,
    action: 'REJECT_DEVIATION',
    details: `Rejected deviation ${dev.deviationNumber} (${dev.title}) by ${actorUser.name}. Reason: ${reason}`,
    request,
  });

  return updated;
}

/**
 * Gets all deviations for an application with summary status.
 */
export async function getApplicationDeviations(applicationId: string) {
  const deviations = await prisma.applicationDeviation.findMany({
    where: { applicationId },
    orderBy: { requestedAt: 'desc' },
  });

  const total = deviations.length;
  const pending = deviations.filter((d) => d.status === 'PENDING').length;
  const approved = deviations.filter((d) => d.status === 'APPROVED').length;
  const rejected = deviations.filter((d) => d.status === 'REJECTED').length;

  return {
    applicationId,
    total,
    pending,
    approved,
    rejected,
    isCompliant: pending === 0,
    deviations,
  };
}
