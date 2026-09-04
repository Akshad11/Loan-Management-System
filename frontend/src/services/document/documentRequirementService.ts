import prisma from '@/lib/prisma';
import { AuthContextUser, writeAuditLog } from '@/lib/serverAuth';

export interface StandardDocRule {
  documentType: string;
  documentTitle: string;
  applicantType: 'PRIMARY' | 'CO_APPLICANT' | 'COLLATERAL';
  isMandatory: boolean;
  description: string;
}

export const BASE_PRIMARY_DOC_RULES: StandardDocRule[] = [
  { documentType: 'PAN_CARD', documentTitle: 'PAN Card Copy', applicantType: 'PRIMARY', isMandatory: true, description: 'Permanent Account Number proof' },
  { documentType: 'AADHAAR_CARD', documentTitle: 'Aadhaar / Proof of Identity', applicantType: 'PRIMARY', isMandatory: true, description: 'Government identity proof' },
  { documentType: 'ADDRESS_PROOF', documentTitle: 'Current Address Proof', applicantType: 'PRIMARY', isMandatory: true, description: 'Utility bill, passport, or rent agreement' },
  { documentType: 'INCOME_PROOF', documentTitle: 'Income Proof / Salary Slip / ITR', applicantType: 'PRIMARY', isMandatory: true, description: 'Latest 3 months payslips or 2 years ITR' },
  { documentType: 'BANK_STATEMENT', documentTitle: 'Bank Account Statements', applicantType: 'PRIMARY', isMandatory: true, description: 'Latest 6 months operative bank statements' },
];

export const BASE_COAPP_DOC_RULES: StandardDocRule[] = [
  { documentType: 'PAN_CARD', documentTitle: 'Co-Applicant PAN Card', applicantType: 'CO_APPLICANT', isMandatory: true, description: 'Co-borrower PAN verification' },
  { documentType: 'AADHAAR_CARD', documentTitle: 'Co-Applicant Aadhaar Card', applicantType: 'CO_APPLICANT', isMandatory: true, description: 'Co-borrower identity proof' },
  { documentType: 'INCOME_PROOF', documentTitle: 'Co-Applicant Income Proof', applicantType: 'CO_APPLICANT', isMandatory: false, description: 'Required if income is combined' },
];

export const BASE_COLLATERAL_DOC_RULES: StandardDocRule[] = [
  { documentType: 'PROPERTY_TITLE_DEED', documentTitle: 'Original Title Deed / Sale Agreement', applicantType: 'COLLATERAL', isMandatory: true, description: 'Chain of title documents' },
  { documentType: 'VALUATION_REPORT', documentTitle: 'Approved Valuer Inspection Report', applicantType: 'COLLATERAL', isMandatory: true, description: 'Certified property valuation report' },
  { documentType: 'LEGAL_SEARCH_REPORT', documentTitle: 'Advocate 30-Year Title Search Report', applicantType: 'COLLATERAL', isMandatory: true, description: 'Legal encumbrance clearance certificate' },
];

/**
 * Synchronizes and generates required document slots for an application.
 */
export async function syncApplicationDocumentRequirements(
  applicationId: string,
  actorUser?: AuthContextUser
) {
  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: {
      coApplicants: true,
      collaterals: true,
      documents: true,
    },
  });

  if (!app) {
    throw new Error(`Application ${applicationId} not found.`);
  }

  const existingDocs = app.documents;
  const docsToCreate: any[] = [];

  // 1. Primary Applicant Document Rules
  for (const rule of BASE_PRIMARY_DOC_RULES) {
    const exists = existingDocs.some(
      (d) => d.documentType === rule.documentType && (d.applicantType === 'PRIMARY' || !d.applicantType)
    );
    if (!exists) {
      docsToCreate.push({
        applicationId,
        documentType: rule.documentType,
        documentTitle: rule.documentTitle,
        applicantId: app.customerId,
        applicantType: 'PRIMARY',
        isMandatory: rule.isMandatory,
        status: 'REQUIRED',
        notes: rule.description,
      });
    }
  }

  // 2. Co-Applicant Document Rules
  for (const coApp of app.coApplicants) {
    for (const rule of BASE_COAPP_DOC_RULES) {
      const exists = existingDocs.some(
        (d) => d.documentType === rule.documentType && d.applicantId === coApp.id
      );
      if (!exists) {
        const isIncomeRequired = rule.documentType === 'INCOME_PROOF' ? Number(coApp.monthlyIncome || 0) > 0 : rule.isMandatory;
        docsToCreate.push({
          applicationId,
          documentType: rule.documentType,
          documentTitle: `${rule.documentTitle} (${coApp.customerName})`,
          applicantId: coApp.id,
          applicantType: 'CO_APPLICANT',
          isMandatory: isIncomeRequired,
          status: 'REQUIRED',
          notes: rule.description,
        });
      }
    }
  }

  // 3. Collateral Document Rules
  for (const col of app.collaterals) {
    if (col.collateralType === 'PROPERTY') {
      for (const rule of BASE_COLLATERAL_DOC_RULES) {
        const exists = existingDocs.some(
          (d) => d.documentType === rule.documentType && d.collateralId === col.id
        );
        if (!exists) {
          docsToCreate.push({
            applicationId,
            documentType: rule.documentType,
            documentTitle: `${rule.documentTitle} (${col.collateralNumber})`,
            collateralId: col.id,
            applicantType: 'COLLATERAL',
            isMandatory: rule.isMandatory,
            status: 'REQUIRED',
            notes: rule.description,
          });
        }
      }
    } else if (col.collateralType === 'VEHICLE') {
      const exists = existingDocs.some(
        (d) => d.documentType === 'VEHICLE_RC' && d.collateralId === col.id
      );
      if (!exists) {
        docsToCreate.push({
          applicationId,
          documentType: 'VEHICLE_RC',
          documentTitle: `Vehicle RC & Insurance (${col.title})`,
          collateralId: col.id,
          applicantType: 'COLLATERAL',
          isMandatory: true,
          status: 'REQUIRED',
          notes: 'Registration Certificate and Comprehensive Insurance Policy',
        });
      }
    }
  }

  if (docsToCreate.length > 0) {
    await prisma.applicationDocument.createMany({
      data: docsToCreate,
    });
  }

  return await prisma.applicationDocument.findMany({
    where: { applicationId },
    orderBy: { uploadedAt: 'desc' },
  });
}

/**
 * Marks a document as verified.
 */
export async function verifyDocument(params: {
  applicationId: string;
  documentId: string;
  actorUser: AuthContextUser;
  notes?: string;
  request?: Request;
}) {
  const { applicationId, documentId, actorUser, notes, request } = params;

  const doc = await prisma.applicationDocument.findUnique({
    where: { id: documentId },
    include: { application: true },
  });

  if (!doc || doc.applicationId !== applicationId) {
    throw new Error(`Document ${documentId} not found on application ${applicationId}.`);
  }

  const updated = await prisma.applicationDocument.update({
    where: { id: documentId },
    data: {
      status: 'VERIFIED',
      verifiedAt: new Date(),
      verifiedBy: actorUser.name,
      rejectionReason: null,
      notes: notes || doc.notes,
    },
  });

  await writeAuditLog({
    actorUser,
    entityType: 'APPLICATION',
    entityId: documentId,
    entityName: doc.documentTitle,
    action: 'VERIFY_DOCUMENT',
    details: `Verified document "${doc.documentTitle}" (${doc.documentType}) for app ${doc.application.applicationNumber}`,
    request,
  });

  return updated;
}

/**
 * Rejects a document with a mandatory reason.
 */
export async function rejectDocument(params: {
  applicationId: string;
  documentId: string;
  reason: string;
  actorUser: AuthContextUser;
  request?: Request;
}) {
  const { applicationId, documentId, reason, actorUser, request } = params;

  if (!reason || reason.trim().length < 3) {
    throw new Error('A specific rejection reason is required when rejecting a document.');
  }

  const doc = await prisma.applicationDocument.findUnique({
    where: { id: documentId },
    include: { application: true },
  });

  if (!doc || doc.applicationId !== applicationId) {
    throw new Error(`Document ${documentId} not found on application ${applicationId}.`);
  }

  const updated = await prisma.applicationDocument.update({
    where: { id: documentId },
    data: {
      status: 'REJECTED',
      rejectionReason: reason.trim(),
      verifiedAt: new Date(),
      verifiedBy: actorUser.name,
    },
  });

  await writeAuditLog({
    actorUser,
    entityType: 'APPLICATION',
    entityId: documentId,
    entityName: doc.documentTitle,
    action: 'REJECT_DOCUMENT',
    details: `Rejected document "${doc.documentTitle}" (${doc.documentType}) for app ${doc.application.applicationNumber}. Reason: ${reason}`,
    request,
  });

  return updated;
}
