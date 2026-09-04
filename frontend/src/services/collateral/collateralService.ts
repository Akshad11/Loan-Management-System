import prisma from '@/lib/prisma';
import { AuthContextUser, writeAuditLog } from '@/lib/serverAuth';
import { CollateralType, ValuationStatus } from '@prisma/client';

export interface CreateCollateralInput {
  applicationId?: string;
  loanId?: string;
  customerId: string;
  collateralType: CollateralType;
  assetSubtype: string;
  title: string;
  description?: string;
  ownershipType?: string;
  ownerName: string;
  ownerRelationship?: string;
  assetIdentifier?: string;
  registrationNumber?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  purchaseValue?: number;
  currentMarketValue: number;
  forcedSaleValue?: number;
  valuationAmount: number;
  valuationDate?: string;
  valuerName?: string;
  valuerFirm?: string;
  valuationReportNumber?: string;
  insurancePolicyNumber?: string;
  insuranceCompany?: string;
  insuredAmount?: number;
  insuranceExpiryDate?: string;
  documentIds?: string[];
  notes?: string;
  actorUser: AuthContextUser;
  request?: Request;
}

export interface AddValuationInput {
  collateralId: string;
  marketValue: number;
  forcedSaleValue?: number;
  valuerName: string;
  valuerFirm?: string;
  reportNumber?: string;
  valuationDate?: string;
  notes?: string;
  actorUser: AuthContextUser;
  request?: Request;
}

export interface UpdateVerificationInput {
  collateralId: string;
  legalStatus?: 'PENDING' | 'CLEARED' | 'ISSUES_IDENTIFIED' | 'WAIVED';
  legalAdvocateName?: string;
  technicalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WAIVED';
  technicalEngineerName?: string;
  actorUser: AuthContextUser;
  request?: Request;
}

/**
 * Retrieves collaterals filtered by applicationId, loanId, or customerId.
 */
export async function getCollaterals(filters: {
  applicationId?: string;
  loanId?: string;
  customerId?: string;
}) {
  const where: any = {};
  if (filters.applicationId) where.applicationId = filters.applicationId;
  if (filters.loanId) where.loanId = filters.loanId;
  if (filters.customerId) where.customerId = filters.customerId;

  const records = await prisma.collateral.findMany({
    where,
    include: {
      valuationHistory: { orderBy: { createdAt: 'desc' } },
      customer: { select: { id: true, name: true, customerNumber: true, mobile: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return records.map(formatCollateralRecord);
}

/**
 * Retrieves a single collateral by ID with full valuation history.
 */
export async function getCollateralById(id: string) {
  const record = await prisma.collateral.findUnique({
    where: { id },
    include: {
      valuationHistory: { orderBy: { createdAt: 'desc' } },
      customer: true,
      application: true,
      loan: true,
    },
  });

  return record ? formatCollateralRecord(record) : null;
}

/**
 * Creates a new collateral asset record with server-side LTV computation.
 */
export async function createCollateral(input: CreateCollateralInput) {
  const {
    applicationId,
    loanId,
    customerId,
    collateralType,
    assetSubtype,
    title,
    description,
    ownershipType = 'SOLE',
    ownerName,
    ownerRelationship,
    assetIdentifier,
    registrationNumber,
    addressLine1,
    city,
    state,
    pinCode,
    purchaseValue,
    currentMarketValue,
    forcedSaleValue,
    valuationAmount,
    valuationDate,
    valuerName,
    valuerFirm,
    valuationReportNumber,
    insurancePolicyNumber,
    insuranceCompany,
    insuredAmount,
    insuranceExpiryDate,
    documentIds = [],
    notes,
    actorUser,
    request,
  } = input;

  if (!title || !collateralType || !currentMarketValue || currentMarketValue <= 0) {
    throw new Error('Title, collateral type, and positive market value are mandatory.');
  }

  // 1. Generate unique collateral identifier
  const count = await prisma.collateral.count();
  const collateralNumber = `COL-${new Date().getFullYear()}-${(count + 1).toString().padStart(4, '0')}`;

  // 2. Compute server-side LTV
  const calculatedLtv = await computeServerLtv(
    applicationId,
    loanId,
    valuationAmount || currentMarketValue
  );

  const valStatus: ValuationStatus = valuerName ? 'COMPLETED' : 'PENDING';

  // 3. Create Collateral record
  const collateral = await prisma.collateral.create({
    data: {
      collateralNumber,
      applicationId: applicationId || null,
      loanId: loanId || null,
      customerId,
      collateralType,
      assetSubtype,
      title,
      description,
      ownershipType,
      ownerName,
      ownerRelationship,
      assetIdentifier,
      registrationNumber,
      addressLine1,
      city,
      state,
      pinCode,
      purchaseValue: purchaseValue || null,
      currentMarketValue,
      forcedSaleValue: forcedSaleValue || null,
      valuationAmount: valuationAmount || currentMarketValue,
      valuationDate: valuationDate ? new Date(valuationDate) : (valuerName ? new Date() : null),
      valuerName,
      valuerFirm,
      valuationStatus: valStatus,
      valuationReportNumber,
      calculatedLtv,
      insurancePolicyNumber,
      insuranceCompany,
      insuredAmount: insuredAmount || null,
      insuranceExpiryDate: insuranceExpiryDate ? new Date(insuranceExpiryDate) : null,
      documentIds,
      status: 'PLEDGED',
      notes,
      createdBy: actorUser.name,
    },
  });

  // 4. Record initial valuation in history if valuation details provided
  if (valuerName || valuationAmount > 0) {
    await prisma.collateralValuationHistory.create({
      data: {
        collateralId: collateral.id,
        valuationDate: valuationDate ? new Date(valuationDate) : new Date(),
        valuerName: valuerName || 'System / Inception Assessment',
        valuerFirm,
        marketValue: currentMarketValue,
        forcedSaleValue: forcedSaleValue || null,
        reportNumber: valuationReportNumber,
        notes: notes || 'Initial valuation at pledge creation',
        createdBy: actorUser.name,
      },
    });
  }

  // 5. Audit log
  await writeAuditLog({
    actorUser,
    entityType: 'COLLATERAL',
    entityId: collateral.id,
    entityName: `${collateralNumber} - ${title}`,
    action: 'CREATE_COLLATERAL',
    details: `Pledged ${collateralType} asset "${title}" with valuation ₹${currentMarketValue.toLocaleString('en-IN')}, calculated LTV: ${calculatedLtv}%`,
    request,
  });

  return formatCollateralRecord(collateral);
}

/**
 * Adds a new revaluation record, updating asset values and recalculating LTV.
 */
export async function addValuation(input: AddValuationInput) {
  const {
    collateralId,
    marketValue,
    forcedSaleValue,
    valuerName,
    valuerFirm,
    reportNumber,
    valuationDate,
    notes,
    actorUser,
    request,
  } = input;

  const collateral = await prisma.collateral.findUnique({
    where: { id: collateralId },
  });

  if (!collateral) {
    throw new Error(`Collateral record ${collateralId} not found.`);
  }

  // 1. Recompute LTV
  const calculatedLtv = await computeServerLtv(
    collateral.applicationId || undefined,
    collateral.loanId || undefined,
    marketValue,
    collateralId
  );

  const valDate = valuationDate ? new Date(valuationDate) : new Date();

  // 2. Append history
  await prisma.collateralValuationHistory.create({
    data: {
      collateralId,
      valuationDate: valDate,
      valuerName,
      valuerFirm,
      marketValue,
      forcedSaleValue: forcedSaleValue || null,
      reportNumber,
      notes,
      createdBy: actorUser.name,
    },
  });

  // 3. Update Collateral record with history included
  const updated = await prisma.collateral.update({
    where: { id: collateralId },
    data: {
      currentMarketValue: marketValue,
      valuationAmount: marketValue,
      forcedSaleValue: forcedSaleValue || null,
      valuationDate: valDate,
      valuerName,
      valuerFirm,
      valuationReportNumber: reportNumber,
      valuationStatus: 'COMPLETED',
      calculatedLtv,
      updatedBy: actorUser.name,
    },
    include: { valuationHistory: true },
  });

  await writeAuditLog({
    actorUser,
    entityType: 'COLLATERAL',
    entityId: collateralId,
    entityName: collateral.collateralNumber,
    action: 'RECORD_VALUATION',
    details: `Recorded valuation for ${collateral.collateralNumber} by ${valuerName}: ₹${marketValue.toLocaleString('en-IN')} (LTV: ${calculatedLtv}%)`,
    request,
  });

  return formatCollateralRecord(updated);
}

/**
 * Updates legal or technical verification status.
 */
export async function updateVerification(input: UpdateVerificationInput) {
  const {
    collateralId,
    legalStatus,
    legalAdvocateName,
    technicalStatus,
    technicalEngineerName,
    actorUser,
    request,
  } = input;

  const collateral = await prisma.collateral.findUnique({
    where: { id: collateralId },
  });

  if (!collateral) throw new Error('Collateral record not found');

  const updateData: any = { updatedBy: actorUser.name };
  if (legalStatus) updateData.legalVerificationStatus = legalStatus;
  if (legalAdvocateName) updateData.legalAdvocateName = legalAdvocateName;
  if (technicalStatus) updateData.technicalStatus = technicalStatus;
  if (technicalEngineerName) updateData.technicalEngineerName = technicalEngineerName;

  if (
    (legalStatus === 'CLEARED' || collateral.legalVerificationStatus === 'CLEARED') &&
    (technicalStatus === 'APPROVED' || collateral.technicalStatus === 'APPROVED')
  ) {
    updateData.status = 'VERIFIED';
  }

  const updated = await prisma.collateral.update({
    where: { id: collateralId },
    data: updateData,
  });

  await writeAuditLog({
    actorUser,
    entityType: 'COLLATERAL',
    entityId: collateralId,
    entityName: collateral.collateralNumber,
    action: 'VERIFY_COLLATERAL',
    details: `Updated verification for ${collateral.collateralNumber}: Legal=${legalStatus || collateral.legalVerificationStatus}, Technical=${technicalStatus || collateral.technicalStatus}`,
    request,
  });

  return formatCollateralRecord(updated);
}

/**
 * Deletes or unlinks a collateral record.
 */
export async function deleteCollateral(id: string, actorUser: AuthContextUser, request?: Request) {
  const collateral = await prisma.collateral.findUnique({
    where: { id },
    include: { loan: true },
  });

  if (!collateral) throw new Error('Collateral record not found.');

  if (collateral.loan && collateral.loan.status === 'ACTIVE') {
    throw new Error('Cannot delete collateral attached to an active disbursed loan account.');
  }

  await prisma.collateral.delete({ where: { id } });

  await writeAuditLog({
    actorUser,
    entityType: 'COLLATERAL',
    entityId: id,
    entityName: collateral.collateralNumber,
    action: 'DELETE_COLLATERAL',
    details: `Deleted collateral ${collateral.collateralNumber} (${collateral.title})`,
    request,
  });

  return { success: true, deletedId: id };
}

/**
 * Computes Loan-To-Value (LTV) server-side across all eligible collaterals.
 * Never trusts client LTV input.
 */
export async function computeServerLtv(
  applicationId?: string,
  loanId?: string,
  newAssetValuation: number = 0,
  excludeCollateralId?: string
): Promise<number> {
  let loanAmount = 0;

  if (applicationId) {
    const app = await prisma.loanApplication.findUnique({ where: { id: applicationId } });
    if (app) loanAmount = Number(app.requestedAmount);
  } else if (loanId) {
    const loan = await prisma.loanAccount.findUnique({ where: { id: loanId } });
    if (loan) loanAmount = Number(loan.sanctionedAmount || loan.originalPrincipal || loan.disbursedPrincipal || 0);
  }

  if (loanAmount <= 0) return 0;

  // Find other collaterals linked to the same application or loan
  const where: any = {};
  if (applicationId) where.applicationId = applicationId;
  if (loanId) where.loanId = loanId;
  if (excludeCollateralId) where.id = { not: excludeCollateralId };

  const siblingCollaterals = await prisma.collateral.findMany({
    where,
    select: { valuationAmount: true, currentMarketValue: true },
  });

  const totalOtherValuation = siblingCollaterals.reduce(
    (sum, c) => sum + Number(c.valuationAmount || c.currentMarketValue || 0),
    0
  );

  const totalEligibleCollateralValue = totalOtherValuation + newAssetValuation;

  if (totalEligibleCollateralValue <= 0) return 0;

  const ltv = (loanAmount / totalEligibleCollateralValue) * 100;
  return Number(ltv.toFixed(2));
}

function formatCollateralRecord(c: any) {
  return {
    ...c,
    purchaseValue: c.purchaseValue ? Number(c.purchaseValue) : null,
    currentMarketValue: Number(c.currentMarketValue || 0),
    forcedSaleValue: c.forcedSaleValue ? Number(c.forcedSaleValue) : null,
    valuationAmount: Number(c.valuationAmount || 0),
    calculatedLtv: c.calculatedLtv ? Number(c.calculatedLtv) : null,
    insuredAmount: c.insuredAmount ? Number(c.insuredAmount) : null,
    createdAt: c.createdAt?.toISOString?.() || c.createdAt,
    updatedAt: c.updatedAt?.toISOString?.() || c.updatedAt,
    valuationDate: c.valuationDate?.toISOString?.() || c.valuationDate,
    insuranceExpiryDate: c.insuranceExpiryDate?.toISOString?.() || c.insuranceExpiryDate,
    valuationHistory: (c.valuationHistory || []).map((v: any) => ({
      ...v,
      marketValue: Number(v.marketValue || 0),
      forcedSaleValue: v.forcedSaleValue ? Number(v.forcedSaleValue) : null,
      valuationDate: v.valuationDate?.toISOString?.() || v.valuationDate,
      createdAt: v.createdAt?.toISOString?.() || v.createdAt,
    })),
  };
}
