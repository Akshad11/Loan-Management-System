import prisma from '@/lib/prisma';
import { AuthContextUser, writeAuditLog } from '@/lib/serverAuth';
import { IBureauProvider, BureauPullRequest, NormalizedBureauReport } from './bureauProvider.interface';
import { CibilBureauProvider } from './cibilProvider';

const provider: IBureauProvider = new CibilBureauProvider();
const REPORT_VALIDITY_DAYS = 30;

export interface PullBureauReportParams {
  applicationId: string;
  applicantId: string;
  applicantType: 'PRIMARY' | 'CO_APPLICANT';
  actorUser: AuthContextUser;
  forceRefresh?: boolean;
  request?: Request;
}

/**
 * Retrieves all bureau reports associated with an application (for primary borrower & co-applicants).
 */
export async function getBureauReportsForApplication(applicationId: string) {
  const reports = await prisma.bureauReport.findMany({
    where: { applicationId },
    orderBy: { createdAt: 'desc' },
  });

  return reports.map(sanitizeBureauReport);
}

/**
 * Retrieves latest bureau report for a specific applicant.
 */
export async function getLatestBureauReport(applicationId: string, applicantId: string) {
  const report = await prisma.bureauReport.findFirst({
    where: { applicationId, applicantId },
    orderBy: { createdAt: 'desc' },
  });

  return report ? sanitizeBureauReport(report) : null;
}

/**
 * Pulls or refreshes a credit bureau report with idempotency check, provider call, and audit logging.
 */
export async function pullBureauReport({
  applicationId,
  applicantId,
  applicantType,
  actorUser,
  forceRefresh = false,
  request,
}: PullBureauReportParams) {
  // 1. Verify application existence
  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: {
      customer: true,
      coApplicants: true,
    },
  });

  if (!app) {
    throw new Error(`Application with ID ${applicationId} not found.`);
  }

  // 2. Identify applicant details
  let applicantName = '';
  let pan = '';
  let mobile = '';
  let dob: string | undefined;
  let panMasked = '';

  if (applicantType === 'PRIMARY') {
    applicantName = app.customer.name;
    pan = (app.customer as any).panNumber || (app.customer as any).pan || app.customer.panMasked || 'ABCDE1234F';
    mobile = app.customer.mobile;
    panMasked = app.customer.panMasked || `XXXXXX${pan.slice(-4)}`;
    dob = (app.customer as any).dateOfBirth ? new Date((app.customer as any).dateOfBirth).toISOString().split('T')[0] : undefined;
  } else {
    const coApp = app.coApplicants.find((ca) => ca.id === applicantId || ca.customerId === applicantId);
    if (!coApp) {
      throw new Error(`Co-Applicant with ID ${applicantId} not found in application.`);
    }
    applicantName = coApp.customerName;
    pan = coApp.pan || coApp.panMasked || 'ABCDE1234F';
    mobile = coApp.mobile;
    panMasked = coApp.panMasked || `XXXXXX${pan.slice(-4)}`;
    dob = coApp.dob ? new Date(coApp.dob).toISOString().split('T')[0] : undefined;
  }

  // Ensure PAN conforms to 10 chars format for bureau inquiry
  if (!pan || pan.includes('X') || pan.length < 10) {
    pan = 'ABCDE1234F'; // fallback safe identifier for inquiry normalization
  }

  // 3. Idempotency & Validity check
  const now = new Date();
  if (!forceRefresh) {
    const existing = await prisma.bureauReport.findFirst({
      where: {
        applicationId,
        applicantId,
        status: 'RECEIVED',
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      return sanitizeBureauReport(existing);
    }
  }

  // 4. Create pending report tracking record
  let bureauRecord = await prisma.bureauReport.create({
    data: {
      applicationId,
      applicantId,
      applicantType,
      applicantName,
      panMasked,
      provider: provider.name,
      status: 'PROCESSING',
      pulledBy: actorUser.name,
      pulledAt: now,
      expiresAt: new Date(now.getTime() + REPORT_VALIDITY_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  try {
    // 5. Invoke Bureau Provider
    const pullReq: BureauPullRequest = {
      applicantId,
      applicantType,
      name: applicantName,
      pan,
      mobile,
      dob,
      referenceNumber: `REQ-${bureauRecord.id.slice(0, 8).toUpperCase()}`,
    };

    const normalized = await provider.pullReport(pullReq);

    // 6. Persist completed report
    bureauRecord = await prisma.bureauReport.update({
      where: { id: bureauRecord.id },
      data: {
        status: 'RECEIVED',
        referenceNumber: normalized.referenceNumber,
        score: normalized.score,
        scoreDate: new Date(normalized.scoreDate),
        scoreBand: normalized.scoreBand,
        totalAccounts: normalized.totalAccounts,
        activeAccounts: normalized.activeAccounts,
        closedAccounts: normalized.closedAccounts,
        creditCardAccounts: normalized.creditCardAccounts,
        totalOutstanding: normalized.totalOutstanding,
        totalOverdue: normalized.totalOverdue,
        securedExposure: normalized.securedExposure,
        unsecuredExposure: normalized.unsecuredExposure,
        dpd30PlusCount: normalized.dpd30PlusCount,
        dpd90PlusCount: normalized.dpd90PlusCount,
        defaultsCount: normalized.defaultsCount,
        settlementsCount: normalized.settlementsCount,
        recentEnquiriesCount: normalized.recentEnquiriesCount,
        creditAccounts: normalized.accounts as any,
        enquiries: normalized.enquiries as any,
        riskIndicators: normalized.riskIndicators as any,
        scoreHistory: normalized.scoreHistory as any,
        rawResponse: normalized.rawPayload as any,
        failureReason: null,
      },
    });

    // 7. Synchronize score on Customer or CoApplicant
    if (applicantType === 'PRIMARY') {
      await prisma.customer.update({
        where: { id: app.customerId },
        data: {
          cibilScore: normalized.score,
          totalOutstanding: normalized.totalOutstanding,
          totalOverdue: normalized.totalOverdue,
        },
      });
    } else {
      await prisma.coApplicant.updateMany({
        where: { applicationId, id: applicantId },
        data: {
          cibilScore: normalized.score,
          totalOutstanding: normalized.totalOutstanding,
        },
      });
    }

    // 8. Audit logging
    await writeAuditLog({
      actorUser,
      entityType: 'BUREAU',
      entityId: bureauRecord.id,
      entityName: `${provider.name} - ${applicantName}`,
      action: forceRefresh ? 'REFRESH_REPORT' : 'PULL_REPORT',
      details: `Retrieved ${provider.name} CIR score ${normalized.score} (${normalized.scoreBand}) for ${applicantType} applicant ${applicantName}`,
      request,
    });

    return sanitizeBureauReport(bureauRecord);
  } catch (error: any) {
    // 9. Handle provider failure
    const failedRecord = await prisma.bureauReport.update({
      where: { id: bureauRecord.id },
      data: {
        status: 'FAILED',
        failureReason: error.message || 'Bureau gateway communication failed',
        retryCount: { increment: 1 },
      },
    });

    await writeAuditLog({
      actorUser,
      entityType: 'BUREAU',
      entityId: bureauRecord.id,
      entityName: `${provider.name} - ${applicantName}`,
      action: 'PULL_FAILED',
      details: `Failed to pull bureau report: ${error.message}`,
      request,
    });

    throw error;
  }
}

/**
 * Strips confidential raw credentials and safely casts decimals for client consumption.
 */
function sanitizeBureauReport(report: any) {
  const { rawResponse, ...rest } = report;
  return {
    ...rest,
    totalOutstanding: Number(report.totalOutstanding || 0),
    totalOverdue: Number(report.totalOverdue || 0),
    securedExposure: Number(report.securedExposure || 0),
    unsecuredExposure: Number(report.unsecuredExposure || 0),
    createdAt: report.createdAt?.toISOString?.() || report.createdAt,
    updatedAt: report.updatedAt?.toISOString?.() || report.updatedAt,
    pulledAt: report.pulledAt?.toISOString?.() || report.pulledAt,
    expiresAt: report.expiresAt?.toISOString?.() || report.expiresAt,
    scoreDate: report.scoreDate?.toISOString?.() || report.scoreDate,
  };
}
