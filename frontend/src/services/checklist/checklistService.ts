import prisma from '@/lib/prisma';
import { AuthContextUser, writeAuditLog } from '@/lib/serverAuth';

export interface DefaultChecklistTemplate {
  itemCode: string;
  title: string;
  category: string;
  isRequired: boolean;
}

export const STANDARD_CHECKLIST_TEMPLATES: DefaultChecklistTemplate[] = [
  { itemCode: 'KYC_VERIFIED', title: 'KYC & Identity Verification', category: 'APPLICANT', isRequired: true },
  { itemCode: 'APPLICANT_INFO_VERIFIED', title: 'Applicant Contact & Address Verification', category: 'APPLICANT', isRequired: true },
  { itemCode: 'CO_APPLICANT_VERIFIED', title: 'Co-Applicant Liability & Consent Verification', category: 'APPLICANT', isRequired: false },
  { itemCode: 'BUREAU_REVIEWED', title: 'CIBIL / Credit Bureau Scrub & DPD Review', category: 'BUREAU', isRequired: true },
  { itemCode: 'INCOME_VERIFIED', title: 'Income & Cashflow Proof Verification', category: 'FINANCIAL', isRequired: true },
  { itemCode: 'EMPLOYMENT_VERIFIED', title: 'Employment / Business Vintage Verification', category: 'FINANCIAL', isRequired: true },
  { itemCode: 'BANKING_REVIEWED', title: 'Bank Statement Analysis & Inward Cheque Returns', category: 'FINANCIAL', isRequired: true },
  { itemCode: 'COLLATERAL_VERIFIED', title: 'Collateral Valuation & LTV Compliance', category: 'COLLATERAL', isRequired: false },
  { itemCode: 'LEGAL_CLEARED', title: 'Legal Title Search & Encumbrance Clearance', category: 'COLLATERAL', isRequired: false },
  { itemCode: 'TECHNICAL_CLEARED', title: 'Technical Site Inspection & Valuation Report', category: 'COLLATERAL', isRequired: false },
  { itemCode: 'ELIGIBILITY_PASSED', title: 'Eligibility Policy & Dynamic FOIR Ceiling', category: 'COMPLIANCE', isRequired: true },
  { itemCode: 'DEVIATIONS_RESOLVED', title: 'Policy Deviations & Underwriter Mitigants', category: 'COMPLIANCE', isRequired: true },
  { itemCode: 'ROI_APPROVED', title: 'Interest Rate & ROI Pricing Approval', category: 'COMPLIANCE', isRequired: true },
  { itemCode: 'DOCUMENTS_COMPLETED', title: 'Required Product Documents Verification', category: 'COMPLIANCE', isRequired: true },
];

/**
 * Initializes checklist items for an application if not already created.
 */
export async function initializeChecklistForApplication(
  applicationId: string,
  actorUser?: AuthContextUser
) {
  const app = await prisma.loanApplication.findUnique({
    where: { id: applicationId },
    include: {
      checklistItems: true,
      collaterals: true,
      coApplicants: true,
    },
  });

  if (!app) {
    throw new Error(`Application ${applicationId} not found.`);
  }

  if (app.checklistItems.length > 0) {
    return app.checklistItems;
  }

  const hasCollateral = app.collaterals.length > 0;
  const hasCoApplicants = app.coApplicants.length > 0;

  // Build tailored checklist items
  const itemsToCreate = STANDARD_CHECKLIST_TEMPLATES.map((tpl) => {
    let isRequired = tpl.isRequired;
    if (tpl.itemCode === 'COLLATERAL_VERIFIED' || tpl.itemCode === 'LEGAL_CLEARED' || tpl.itemCode === 'TECHNICAL_CLEARED') {
      isRequired = hasCollateral;
    }
    if (tpl.itemCode === 'CO_APPLICANT_VERIFIED') {
      isRequired = hasCoApplicants;
    }

    return {
      applicationId,
      itemCode: tpl.itemCode,
      title: tpl.title,
      category: tpl.category,
      isRequired,
      status: 'PENDING',
    };
  });

  await prisma.creditChecklistItem.createMany({
    data: itemsToCreate,
  });

  const created = await prisma.creditChecklistItem.findMany({
    where: { applicationId },
    orderBy: { createdAt: 'asc' },
  });

  if (actorUser) {
    await writeAuditLog({
      actorUser,
      entityType: 'CHECKLIST',
      entityId: applicationId,
      entityName: app.applicationNumber,
      action: 'INITIALIZE_CHECKLIST',
      details: `Initialized ${created.length} checklist items for application ${app.applicationNumber}`,
    });
  }

  return created;
}

/**
 * Fetches all checklist items for an application with aggregate metrics.
 */
export async function getChecklist(applicationId: string) {
  let items = await prisma.creditChecklistItem.findMany({
    where: { applicationId },
    orderBy: { createdAt: 'asc' },
  });

  if (items.length === 0) {
    items = await initializeChecklistForApplication(applicationId);
  }

  const total = items.length;
  const passed = items.filter((i) => i.status === 'PASSED').length;
  const waived = items.filter((i) => i.status === 'WAIVED').length;
  const failed = items.filter((i) => i.status === 'FAILED').length;
  const pending = items.filter((i) => i.status === 'PENDING').length;

  const mandatoryTotal = items.filter((i) => i.isRequired).length;
  const mandatoryCompliant = items.filter((i) => i.isRequired && (i.status === 'PASSED' || i.status === 'WAIVED')).length;

  const isCompliant = mandatoryTotal > 0 && mandatoryTotal === mandatoryCompliant;
  const completionPercentage = total > 0 ? Math.round(((passed + waived) / total) * 100) : 0;

  return {
    applicationId,
    total,
    passed,
    waived,
    failed,
    pending,
    isCompliant,
    completionPercentage,
    items,
  };
}

/**
 * Updates a checklist item status, reviewer remarks, and evidence reference.
 */
export async function updateChecklistItem(params: {
  applicationId: string;
  itemId: string;
  status: 'PASSED' | 'FAILED' | 'WAIVED' | 'PENDING';
  remarks?: string;
  evidenceRef?: string;
  actorUser: AuthContextUser;
  request?: Request;
}) {
  const { applicationId, itemId, status, remarks, evidenceRef, actorUser, request } = params;

  const item = await prisma.creditChecklistItem.findUnique({
    where: { id: itemId },
    include: { application: true },
  });

  if (!item || item.applicationId !== applicationId) {
    throw new Error(`Checklist item ${itemId} not found for application ${applicationId}.`);
  }

  const updated = await prisma.creditChecklistItem.update({
    where: { id: itemId },
    data: {
      status,
      remarks: remarks || item.remarks,
      evidenceRef: evidenceRef || item.evidenceRef,
      reviewerId: actorUser.id,
      reviewerName: actorUser.name,
      reviewedAt: new Date(),
    },
  });

  await writeAuditLog({
    actorUser,
    entityType: 'CHECKLIST',
    entityId: itemId,
    entityName: item.title,
    action: `CHECKLIST_${status}`,
    details: `Updated checklist item "${item.title}" to ${status}. Remarks: ${remarks || 'None'}`,
    changes: { previousStatus: item.status, newStatus: status, remarks, evidenceRef },
    request,
  });

  return updated;
}
