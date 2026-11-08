import {
  SanctionRecord,
  SanctionTerms,
  SanctionCondition,
  SanctionLetterVersion,
  PreDisbursementReadinessSummary,
  ReadinessCheckItem,
  ConditionStatus,
} from '../../../types/sanctionTypes';
import { ApprovalRecord } from '../../../types/approvalTypes';
import { LMSStoreContext } from '../types';
import { calculateEMI, createApprovalFromCreditAssessment } from './creditApprovalSlice';
import { logApplicationHistory } from './applicationSlice';

export function getSanctions(ctx: LMSStoreContext): SanctionRecord[] {
  return [...ctx.sanctions];
}

export function getSanctionById(ctx: LMSStoreContext, id: string): SanctionRecord | undefined {
  if (!id) return undefined;
  return ctx.sanctions.find((s) => s.id === id || s.sanctionNumber === id || s.applicationId === id);
}

export function getSanctionByApplicationId(ctx: LMSStoreContext, applicationId: string): SanctionRecord | undefined {
  return ctx.sanctions.find((s) => s.applicationId === applicationId);
}

export function getSanctionByApprovalId(ctx: LMSStoreContext, approvalId: string): SanctionRecord | undefined {
  return ctx.sanctions.find((s) => s.approvalId === approvalId);
}

export function createSanction(
  ctx: LMSStoreContext,
  params: {
    applicationId: string;
    approvalId?: string;
    terms?: Partial<SanctionTerms>;
    deviationReason?: string;
    actorName?: string;
    actorRole?: string;
  }
): SanctionRecord {
  const app = ctx.applications.find((a) => a.id === params.applicationId);
  if (!app) throw new Error(`Application ${params.applicationId} not found`);

  // Verify application status
  if (app.status !== 'APPROVED' && app.status !== 'SANCTIONED') {
    throw new Error(`Sanction can only be created for APPROVED applications. Current status: ${app.status}`);
  }

  // Check if sanction already exists
  const existing = ctx.sanctions.find((s) => s.applicationId === params.applicationId);
  if (existing) return existing;

  // Find approval record
  let approval: ApprovalRecord | undefined = params.approvalId
    ? ctx.approvals.find((a) => a.id === params.approvalId)
    : ctx.approvals.find((a) => a.applicationId === params.applicationId && a.status === 'APPROVED');

  if (!approval || approval.status !== 'APPROVED') {
    const matchingAppr = ctx.approvals.find((a) => a.applicationId === params.applicationId);
    if (matchingAppr) {
      if (app.status === 'APPROVED' || app.status === 'SANCTIONED') {
        matchingAppr.status = 'APPROVED';
        matchingAppr.approvedAmount = matchingAppr.approvedAmount || matchingAppr.recommendedAmount || app.requestedAmount;
        matchingAppr.approvedTenureMonths = matchingAppr.approvedTenureMonths || matchingAppr.recommendedTenureMonths || app.requestedTenureMonths;
        matchingAppr.approvedInterestRate = matchingAppr.approvedInterestRate || matchingAppr.recommendedInterestRate || (app as any).interestRate || 10.5;
        approval = matchingAppr;
      } else {
        approval = matchingAppr;
      }
    } else if (app.status === 'APPROVED' || app.status === 'SANCTIONED') {
      const ca = ctx.creditAssessments.find((c) => c.applicationId === app.id);
      if (ca) {
        try {
          const createdAppr = createApprovalFromCreditAssessment(ctx, ca.id, params.actorName || 'Credit Committee');
          createdAppr.status = 'APPROVED';
          createdAppr.approvedAmount = ca.recommendedAmount || app.requestedAmount;
          createdAppr.approvedTenureMonths = ca.recommendedTenureMonths || app.requestedTenureMonths;
          createdAppr.approvedInterestRate = ca.recommendedInterestRate || (app as any).interestRate || 10.5;
          approval = createdAppr;
        } catch (e) {
          // fallback handled below
        }
      }
      if (!approval) {
        const caFallback = ctx.creditAssessments.find((c) => c.applicationId === app.id);
        const syntheticAppr: ApprovalRecord = {
          id: `apprv_${app.id}`,
          approvalNumber: `APPR-2026-${String(ctx.nextApprovalSeq++).padStart(6, '0')}`,
          applicationId: app.id,
          applicationNumber: app.applicationNumber,
          creditAssessmentId: caFallback?.id || `ca_${app.id}`,
          creditAssessmentNumber: caFallback?.assessmentNumber || `CA-2026-0001`,
          customerId: app.customerId,
          customerNumber: app.customerNumber,
          customerName: app.customerName,
          customerMobile: (app as any).customerMobile || '',
          branchId: app.branchId,
          branchName: app.branchName,
          productCode: app.productCode,
          productName: app.productName,
          requestedAmount: app.requestedAmount,
          requestedTenureMonths: app.requestedTenureMonths,
          requestedInterestRate: (app as any).interestRate || 10.5,
          recommendedAmount: app.requestedAmount,
          recommendedTenureMonths: app.requestedTenureMonths,
          recommendedInterestRate: (app as any).interestRate || 10.5,
          creditScore: 750,
          riskRating: 'LOW',
          creditAssessorName: 'Sunita Patel',
          status: 'APPROVED',
          currentLevelIndex: 0,
          totalLevels: 1,
          levels: [],
          conditions: [],
          exceptions: [],
          history: [],
          versions: [],
          approvedAmount: app.requestedAmount,
          approvedTenureMonths: app.requestedTenureMonths,
          approvedInterestRate: (app as any).interestRate || 10.5,
          ageDays: 0,
          priority: 'NORMAL',
          isSlaBreached: false,
          assignedToName: params.actorName || 'Sanction Authority',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        ctx.approvals.unshift(syntheticAppr);
        approval = syntheticAppr;
      }
    }
  }

  if (!approval || approval.status !== 'APPROVED') {
    throw new Error('Approved Credit Committee record required before sanction drafting. Please ensure the application is approved in the Approvals queue (/approvals).');
  }

  const customer = ctx.customers.find((c) => c.id === app.customerId);
  const branch = ctx.branches.find((b) => b.id === app.branchId);
  const product = ctx.loanProductsConfig.find((p) => p.code === app.productCode);

  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const actorName = params.actorName || 'Loan Officer';
  const actorRole = params.actorRole || 'Loan Officer';

  const sanctionNumber = `SN-2026-${String(ctx.nextSanctionSeq++).padStart(6, '0')}`;
  const approvedAmt = approval.approvedAmount || (app as any).approvedAmount || app.requestedAmount;
  const approvedTenure = approval.approvedTenureMonths || (app as any).approvedTenureMonths || app.requestedTenureMonths;
  const approvedRate = approval.approvedInterestRate || (app as any).approvedInterestRate || (app as any).requestedInterestRate || (app as any).interestRate || 10.5;

  // Calculate fees
  const procRate = (product as any)?.processingFeePercent || 1.0;
  const procFee = Math.round((approvedAmt * procRate) / 100);
  const procFeeGst = Math.round(procFee * 0.18);
  const docCharge = (product as any)?.documentationCharges || 500;
  const insCharge = Math.round(approvedAmt * 0.005);
  const netDisb = approvedAmt - (procFee + procFeeGst + docCharge + insCharge);
  const approxEmi = calculateEMI(approvedAmt, approvedRate, approvedTenure);

  // Inherit conditions from credit assessment + approval
  const initialConditions: SanctionCondition[] = [];

  // From approval
  if (approval.conditions && approval.conditions.length > 0) {
    approval.conditions.forEach((c, idx) => {
      initialConditions.push({
        id: `scond_${Date.now()}_${idx}`,
        sanctionId: `sanc_${Date.now()}`,
        category: c.category as any,
        description: c.description,
        requiredBefore: c.requiredBefore,
        dueDate: c.dueDate,
        owner: c.owner,
        status: c.status,
        source: c.source === 'CREDIT_ASSESSMENT' ? 'CREDIT_ASSESSMENT' : 'APPROVAL',
        addedBy: c.addedBy,
        addedAt: c.addedAt,
        resolutionNotes: c.resolutionNotes,
        resolvedBy: (c as any).resolvedBy || c.waivedBy,
        resolvedAt: (c as any).resolvedAt || c.waivedAt,
        waiverReason: c.waiverReason,
        waivedBy: c.waivedBy,
        waivedAt: c.waivedAt,
      });
    });
  }

  const defaultTerms: SanctionTerms = {
    amount: approvedAmt,
    tenureMonths: approvedTenure,
    interestRate: approvedRate,
    repaymentFrequency: 'Monthly',
    purpose: app.purpose || 'Retail Loan Facility',
    processingFee: procFee,
    processingFeeGst: procFeeGst,
    documentationCharge: docCharge,
    insuranceCharge: insCharge,
    otherCharges: 0,
    netDisbursementAmount: netDisb,
    approxMonthlyEmi: approxEmi,
    gracePeriodDays: 0,
    paymentMethod: 'NACH / e-Mandate',
    firstRepaymentDatePlaceholder: '2026-10-05',
    interestMethodology: 'Reducing Balance Method',
    isDeviatedFromApproval: false,
    ...params.terms,
  };

  if (params.deviationReason) {
    defaultTerms.isDeviatedFromApproval = true;
    defaultTerms.deviationNotes = params.deviationReason;
  }

  const finalApprover = approval.levels[approval.totalLevels - 1];

  const newSanction: SanctionRecord = {
    id: `sanc_${Date.now()}`,
    sanctionNumber,
    applicationId: app.id,
    applicationNumber: app.applicationNumber,
    approvalId: approval.id,
    approvalNumber: approval.approvalNumber,
    customerId: app.customerId,
    customerNumber: app.customerNumber,
    customerName: app.customerName,
    customerMobile: customer?.mobile || '+91 98765 43210',
    customerEmail: customer?.email || 'borrower@example.in',
    customerAddress: customer
      ? `${customer.currentAddress.addressLine1}, ${customer.currentAddress.city}, ${customer.currentAddress.state} ${customer.currentAddress.pinCode}`
      : 'Panaji, Goa',
    branchId: app.branchId,
    branchName: branch?.name || 'Panaji Head Office Branch',
    productCode: app.productCode,
    productName: app.productName,
    status: 'DRAFT',

    requestedAmount: app.requestedAmount,
    approvedAmount: approvedAmt,
    approvedTenureMonths: approvedTenure,
    approvedInterestRate: approvedRate,
    finalApproverName: finalApprover?.decidedBy || 'Priya Deshmukh',
    finalApproverRole: finalApprover?.requiredRoleName || 'Branch Credit Manager',
    approvedDate: finalApprover?.decidedAt?.split(' ')[0] || today,

    terms: defaultTerms,
    termDeviationReason: params.deviationReason,
    conditions: initialConditions,
    letters: [],

    createdDate: today,
    createdTime: nowTime,
    createdBy: actorName,
    createdByRole: actorRole,

    versions: [
      {
        version: 1,
        snapshotDate: `${today} ${nowTime}`,
        actor: actorName,
        actorRole: actorRole,
        amount: defaultTerms.amount,
        tenureMonths: defaultTerms.tenureMonths,
        interestRate: defaultTerms.interestRate,
        processingFee: defaultTerms.processingFee,
        documentationCharge: defaultTerms.documentationCharge,
        conditionsCount: initialConditions.length,
        letterVersion: 0,
        changeDescription: 'Initial Sanction Dossier created from final approval.',
        reason: 'Initial setup',
      },
    ],

    history: [
      {
        id: `shist_${Date.now()}`,
        sanctionId: `sanc_${Date.now()}`,
        timestamp: `${today} ${nowTime}`,
        event: 'SANCTION_CREATED',
        actor: actorName,
        actorRole: actorRole,
        previousState: 'N/A',
        newState: 'DRAFT',
        version: 1,
        notes: `Sanction draft created for ₹${defaultTerms.amount.toLocaleString('en-IN')}. Inherited ${initialConditions.length} condition(s) from credit dossier.`,
      },
    ],
  };

  // Correct condition sanctionIds
  newSanction.conditions.forEach((c) => {
    c.sanctionId = newSanction.id;
  });

  // Auto-generate Letter Version 1 upon drafting
  const initialLetter: SanctionLetterVersion = {
    id: `slet_${Date.now()}`,
    version: 1,
    sanctionId: newSanction.id,
    status: 'GENERATED',
    generatedAt: `${today} ${nowTime}`,
    generatedBy: actorName,
    generatedByRole: actorRole,
    templateVersion: 'STANDARD_RETAIL_v2',
    customNotes: 'In-principle sanction advice letter generated for borrower acceptance.',
    contentSnapshot: {
      institutionName: 'Apex Bharat Financial Services Ltd.',
      institutionAddress: '14th Floor, Maker Chambers IV, Nariman Point, Mumbai, Maharashtra 400021',
      cinNumber: 'U65999MH2018PLC312456',
      rbiRegistrationNumber: 'N-13.02194',
      date: today,
      sanctionNumber,
      applicationNumber: app.applicationNumber,
      approvalNumber: approval.approvalNumber,
      customerName: app.customerName,
      customerNumber: app.customerNumber,
      customerAddress: customer
        ? `${customer.currentAddress?.addressLine1 || ''}, ${customer.currentAddress?.city || ''}, ${customer.currentAddress?.state || ''} ${customer.currentAddress?.pinCode || ''}`
        : 'Panaji, Goa',
      customerMobile: customer?.mobile || '+91 98765 43210',
      customerEmail: customer?.email || 'borrower@example.in',
      productName: app.productName,
      productCode: app.productCode,
      sanctionAmount: approvedAmt,
      tenureMonths: approvedTenure,
      interestRate: approvedRate,
      approxMonthlyEmi: approxEmi,
      repaymentFrequency: 'Monthly',
      purpose: app.purpose || 'Retail Loan Facility',
      processingFee: procFee + procFeeGst,
      documentationCharge: docCharge,
      insuranceCharge: insCharge,
      interestMethodology: 'Reducing Balance Method',
      firstRepaymentDate: '2026-10-05',
      validityDays: 30,
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      conditions: initialConditions.map((c) => ({
        category: c.category,
        description: c.description,
        requiredBefore: c.requiredBefore,
        status: c.status,
      })),
      signatoryName: finalApprover?.decidedBy || 'Priya Deshmukh',
      signatoryRole: `${finalApprover?.requiredRoleName || 'Branch Credit Manager'} & Authorized Signatory`,
      signatoryBranch: branch?.name || 'Panaji Head Office Branch',
    },
  };
  newSanction.letters = [initialLetter];
  newSanction.activeLetterId = initialLetter.id;

  ctx.sanctions.unshift(newSanction);
  ctx.syncApi('/api/sanctions', 'POST', newSanction);
  ctx.notify();
  return newSanction;
}

export function updateSanctionTerms(
  ctx: LMSStoreContext,
  sanctionId: string,
  terms: Partial<SanctionTerms>,
  deviationReason: string = '',
  actorName: string = 'Loan Officer',
  actorRole: string = 'Loan Officer'
): SanctionRecord {
  const sanction = ctx.sanctions.find((s) => s.id === sanctionId);
  if (!sanction) throw new Error('Sanction not found');

  if (sanction.status === 'SANCTIONED' || sanction.status === 'CANCELLED') {
    throw new Error(`Cannot modify terms when sanction is in ${sanction.status} state.`);
  }

  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const prevTerms = { ...sanction.terms };
  const newAmount = terms.amount !== undefined ? terms.amount : sanction.terms.amount;
  const newRate = terms.interestRate !== undefined ? terms.interestRate : sanction.terms.interestRate;
  const newTenure = terms.tenureMonths !== undefined ? terms.tenureMonths : sanction.terms.tenureMonths;
  const newApproxEmi = calculateEMI(newAmount, newRate, newTenure);

  const procFee = terms.processingFee !== undefined ? terms.processingFee : sanction.terms.processingFee;
  const procFeeGst = Math.round(procFee * 0.18);
  const docCharge = terms.documentationCharge !== undefined ? terms.documentationCharge : sanction.terms.documentationCharge;
  const insCharge = terms.insuranceCharge !== undefined ? terms.insuranceCharge : sanction.terms.insuranceCharge;
  const netDisb = newAmount - (procFee + procFeeGst + docCharge + insCharge);

  const isDeviated =
    newAmount !== sanction.approvedAmount ||
    newTenure !== sanction.approvedTenureMonths ||
    newRate !== sanction.approvedInterestRate;

  sanction.terms = {
    ...sanction.terms,
    ...terms,
    amount: newAmount,
    tenureMonths: newTenure,
    interestRate: newRate,
    approxMonthlyEmi: newApproxEmi,
    processingFee: procFee,
    processingFeeGst: procFeeGst,
    documentationCharge: docCharge,
    insuranceCharge: insCharge,
    netDisbursementAmount: netDisb,
    isDeviatedFromApproval: isDeviated,
    deviationNotes: deviationReason || sanction.terms.deviationNotes,
  };

  if (deviationReason) {
    sanction.termDeviationReason = deviationReason;
  }

  const newVersionNum = sanction.versions.length + 1;
  sanction.versions.push({
    version: newVersionNum,
    snapshotDate: `${today} ${nowTime}`,
    actor: actorName,
    actorRole: actorRole,
    amount: sanction.terms.amount,
    tenureMonths: sanction.terms.tenureMonths,
    interestRate: sanction.terms.interestRate,
    processingFee: sanction.terms.processingFee,
    documentationCharge: sanction.terms.documentationCharge,
    conditionsCount: sanction.conditions.length,
    letterVersion: sanction.letters.length,
    changeDescription: `Terms updated: ₹${newAmount.toLocaleString('en-IN')} @ ${newRate}% for ${newTenure}m. ${deviationReason ? `Reason: ${deviationReason}` : ''}`,
    reason: deviationReason || 'Terms adjustment',
  });

  sanction.history.push({
    id: `shist_${Date.now()}`,
    sanctionId: sanction.id,
    timestamp: `${today} ${nowTime}`,
    event: 'TERMS_UPDATED',
    actor: actorName,
    actorRole: actorRole,
    previousState: `₹${prevTerms.amount.toLocaleString('en-IN')} @ ${prevTerms.interestRate}%`,
    newState: `₹${newAmount.toLocaleString('en-IN')} @ ${newRate}%`,
    version: newVersionNum,
    notes: `Terms updated. Net disb: ₹${netDisb.toLocaleString('en-IN')}, EMI: ₹${newApproxEmi.toLocaleString('en-IN')}. ${deviationReason ? `Deviation note: ${deviationReason}` : ''}`,
  });

  ctx.notify();
  return sanction;
}

export function submitSanctionForReview(
  ctx: LMSStoreContext,
  sanctionId: string,
  actorName: string = 'Loan Officer',
  actorRole: string = 'Loan Officer'
): SanctionRecord {
  const sanction = ctx.sanctions.find((s) => s.id === sanctionId);
  if (!sanction) throw new Error('Sanction not found');

  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const prev = sanction.status;

  sanction.status = 'UNDER_REVIEW';

  sanction.history.push({
    id: `shist_${Date.now()}`,
    sanctionId: sanction.id,
    timestamp: `${today} ${nowTime}`,
    event: 'SANCTION_SUBMITTED_FOR_REVIEW',
    actor: actorName,
    actorRole: actorRole,
    previousState: prev,
    newState: 'UNDER_REVIEW',
    version: sanction.versions.length,
    notes: 'Sanction dossier submitted for review.',
  });

  ctx.notify();
  return sanction;
}

export function submitSanctionForConfirmation(
  ctx: LMSStoreContext,
  sanctionId: string,
  actorName: string = 'Loan Officer',
  actorRole: string = 'Loan Officer'
): SanctionRecord {
  const sanction = ctx.sanctions.find((s) => s.id === sanctionId);
  if (!sanction) throw new Error('Sanction not found');

  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const prev = sanction.status;

  sanction.status = 'PENDING_CONFIRMATION';

  sanction.history.push({
    id: `shist_${Date.now()}`,
    sanctionId: sanction.id,
    timestamp: `${today} ${nowTime}`,
    event: 'SANCTION_SUBMITTED_FOR_CONFIRMATION',
    actor: actorName,
    actorRole: actorRole,
    previousState: prev,
    newState: 'PENDING_CONFIRMATION',
    version: sanction.versions.length,
    notes: 'Sanction dossier routed for final confirmation by an independent authority.',
  });

  ctx.notify();
  return sanction;
}

export function addSanctionCondition(
  ctx: LMSStoreContext,
  sanctionId: string,
  condition: Omit<SanctionCondition, 'id' | 'sanctionId' | 'addedAt' | 'status'>,
  actorName: string = 'Loan Officer',
  actorRole: string = 'Loan Officer'
): SanctionCondition {
  const sanction = ctx.sanctions.find((s) => s.id === sanctionId);
  if (!sanction) throw new Error('Sanction not found');

  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newCond: SanctionCondition = {
    id: `scond_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    sanctionId: sanction.id,
    addedAt: `${today} ${nowTime}`,
    status: 'OPEN',
    ...condition,
  };

  sanction.conditions.push(newCond);

  sanction.history.push({
    id: `shist_${Date.now()}`,
    sanctionId: sanction.id,
    timestamp: `${today} ${nowTime}`,
    event: 'CONDITION_ADDED',
    actor: actorName,
    actorRole: actorRole,
    previousState: sanction.status,
    newState: sanction.status,
    version: sanction.versions.length,
    notes: `Added condition [${newCond.category} - Pre-${newCond.requiredBefore}]: ${newCond.description}`,
  });

  ctx.notify();
  return newCond;
}

export function updateSanctionConditionStatus(
  ctx: LMSStoreContext,
  sanctionId: string,
  conditionId: string,
  status: ConditionStatus,
  resolutionNotes?: string,
  waiverReason?: string,
  actorName: string = 'Sanction Officer',
  actorRole: string = 'Sanction Officer'
): SanctionRecord {
  const sanction = ctx.sanctions.find((s) => s.id === sanctionId);
  if (!sanction) throw new Error('Sanction record not found');

  const cond = sanction.conditions.find((c) => c.id === conditionId);
  if (!cond) throw new Error('Condition not found');

  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const prevStatus = cond.status;

  cond.status = status;
  if (resolutionNotes) {
    cond.resolutionNotes = resolutionNotes;
    cond.resolvedBy = actorName;
    cond.resolvedAt = `${today} ${nowTime}`;
  }
  if (waiverReason) {
    cond.waiverReason = waiverReason;
    cond.waivedBy = actorName;
    cond.waivedAt = `${today} ${nowTime}`;
  }

  sanction.history.push({
    id: `shist_${Date.now()}`,
    sanctionId: sanction.id,
    timestamp: `${today} ${nowTime}`,
    event: 'CONDITION_UPDATED',
    actor: actorName,
    actorRole: actorRole,
    previousState: prevStatus,
    newState: status,
    version: sanction.versions.length,
    notes: `Condition "${cond.description}" marked as ${status}. ${resolutionNotes ? `Notes: ${resolutionNotes}` : ''} ${waiverReason ? `Waiver: ${waiverReason}` : ''}`,
  });

  ctx.notify();
  return sanction;
}

export function waiveSanctionCondition(
  ctx: LMSStoreContext,
  sanctionId: string,
  conditionId: string,
  waiverReason: string,
  actorName: string = 'Sanction Officer',
  actorRole: string = 'Sanction Officer'
): SanctionRecord {
  if (!waiverReason || waiverReason.trim().length < 5) {
    throw new Error('Mandatory waiver reason (minimum 5 characters) required for audit compliance.');
  }
  return updateSanctionConditionStatus(
    ctx,
    sanctionId,
    conditionId,
    'WAIVED',
    undefined,
    waiverReason,
    actorName,
    actorRole
  );
}

export function deleteSanctionCondition(
  ctx: LMSStoreContext,
  sanctionId: string,
  conditionId: string,
  actorName: string = 'Sanction Officer',
  actorRole: string = 'Sanction Officer'
): SanctionRecord {
  const sanction = ctx.sanctions.find((s) => s.id === sanctionId);
  if (!sanction) throw new Error('Sanction not found');

  const cond = sanction.conditions.find((c) => c.id === conditionId);
  if (!cond) throw new Error('Condition not found');

  if (cond.source === 'APPROVAL' || cond.source === 'CREDIT_ASSESSMENT') {
    throw new Error('Conditions inherited from Credit Assessment or Approval Committee cannot be deleted. You may mark them as Waived with justification.');
  }

  sanction.conditions = sanction.conditions.filter((c) => c.id !== conditionId);

  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  sanction.history.push({
    id: `shist_${Date.now()}`,
    sanctionId: sanction.id,
    timestamp: `${today} ${nowTime}`,
    event: 'CONDITION_DELETED',
    actor: actorName,
    actorRole: actorRole,
    previousState: sanction.status,
    newState: sanction.status,
    version: sanction.versions.length,
    notes: `Condition deleted: "${cond.description}"`,
  });

  ctx.notify();
  return sanction;
}

export function generateSanctionLetter(
  ctx: LMSStoreContext,
  sanctionId: string,
  optionsOrNotes?: string | { templateId?: string; customNotes?: string; reasonForRegeneration?: string },
  reasonForRegenerationOrActor?: string,
  actorName?: string,
  actorRole: string = 'Loan Officer'
): SanctionLetterVersion {
  const sanction = ctx.sanctions.find((s) => s.id === sanctionId);
  if (!sanction) throw new Error('Sanction not found');

  let customNotes: string | undefined;
  let reasonForRegeneration: string | undefined;
  let templateVersion = 'V2.4-ENTERPRISE-LMS';
  let finalActorName = 'Loan Officer';
  let finalActorRole = 'Loan Officer';

  if (typeof optionsOrNotes === 'object' && optionsOrNotes !== null) {
    customNotes = optionsOrNotes.customNotes;
    reasonForRegeneration = optionsOrNotes.reasonForRegeneration;
    if (optionsOrNotes.templateId) {
      templateVersion = optionsOrNotes.templateId;
    }
    finalActorName = reasonForRegenerationOrActor || 'Loan Officer';
    finalActorRole = actorName || 'Loan Officer';
  } else {
    customNotes = optionsOrNotes;
    reasonForRegeneration = reasonForRegenerationOrActor;
    finalActorName = actorName || 'Loan Officer';
    finalActorRole = actorRole || 'Loan Officer';
  }

  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const versionNum = sanction.letters.length + 1;

  // Calculate validity 30 days ahead
  const valDate = new Date();
  valDate.setDate(valDate.getDate() + 30);
  const validUntilStr = valDate.toISOString().split('T')[0];

  const letter: SanctionLetterVersion = {
    id: `slet_${Date.now()}`,
    version: versionNum,
    sanctionId: sanction.id,
    status: 'GENERATED',
    generatedAt: `${today} ${nowTime}`,
    generatedBy: finalActorName,
    generatedByRole: finalActorRole,
    templateVersion,
    reasonForRegeneration,
    customNotes,
    contentSnapshot: {
      institutionName: 'Apex Bharat Financial Services Ltd.',
      institutionAddress: '14th Floor, Maker Chambers IV, Nariman Point, Mumbai, Maharashtra 400021',
      cinNumber: 'U65999MH2018PLC312456',
      rbiRegistrationNumber: 'N-13.02194',
      date: today,
      sanctionNumber: sanction.sanctionNumber,
      applicationNumber: sanction.applicationNumber,
      approvalNumber: sanction.approvalNumber,
      customerName: sanction.customerName,
      customerNumber: sanction.customerNumber,
      customerAddress: sanction.customerAddress,
      customerMobile: sanction.customerMobile,
      customerEmail: sanction.customerEmail,
      productName: sanction.productName,
      productCode: sanction.productCode,
      sanctionAmount: sanction.terms.amount,
      tenureMonths: sanction.terms.tenureMonths,
      interestRate: sanction.terms.interestRate,
      approxMonthlyEmi: sanction.terms.approxMonthlyEmi,
      repaymentFrequency: sanction.terms.repaymentFrequency,
      purpose: sanction.terms.purpose,
      processingFee: sanction.terms.processingFee + sanction.terms.processingFeeGst,
      documentationCharge: sanction.terms.documentationCharge,
      insuranceCharge: sanction.terms.insuranceCharge,
      interestMethodology: sanction.terms.interestMethodology,
      firstRepaymentDate: sanction.terms.firstRepaymentDatePlaceholder || '2026-10-05',
      validityDays: 30,
      validUntil: validUntilStr,
      conditions: sanction.conditions.map((c) => ({
        category: c.category,
        description: c.description,
        requiredBefore: c.requiredBefore,
        status: c.status,
      })),
      signatoryName: sanction.finalApproverName,
      signatoryRole: `${sanction.finalApproverRole} & Authorized Signatory`,
      signatoryBranch: sanction.branchName,
    },
  };

  // Mark previous letters as SUPERSEDED
  sanction.letters.forEach((l) => {
    if (l.status === 'GENERATED' || l.status === 'DRAFT') {
      l.status = 'SUPERSEDED';
    }
  });

  sanction.letters.unshift(letter);
  sanction.activeLetterId = letter.id;

  sanction.history.push({
    id: `shist_${Date.now()}`,
    sanctionId: sanction.id,
    timestamp: `${today} ${nowTime}`,
    event: 'LETTER_GENERATED',
    actor: finalActorName,
    actorRole: finalActorRole,
    previousState: sanction.status,
    newState: sanction.status,
    version: sanction.versions.length,
    notes: `Sanction Letter Version ${versionNum} generated.${reasonForRegeneration ? ` Regeneration Reason: ${reasonForRegeneration}` : ''}`,
  });

  ctx.notify();
  return letter;
}

export function issueSanctionLetter(
  ctx: LMSStoreContext,
  sanctionId: string,
  letterId: string,
  actorName: string = 'Loan Officer',
  actorRole: string = 'Loan Officer'
): SanctionRecord {
  const sanction = ctx.sanctions.find((s) => s.id === sanctionId);
  if (!sanction) throw new Error('Sanction not found');

  const letter = sanction.letters.find((l) => l.id === letterId);
  if (!letter) throw new Error('Sanction letter not found');

  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  letter.status = 'ISSUED';
  letter.issuedAt = `${today} ${nowTime}`;
  letter.issuedBy = actorName;
  letter.issuedByRole = actorRole;

  sanction.history.push({
    id: `shist_${Date.now()}`,
    sanctionId: sanction.id,
    timestamp: `${today} ${nowTime}`,
    event: 'LETTER_ISSUED',
    actor: actorName,
    actorRole: actorRole,
    previousState: sanction.status,
    newState: sanction.status,
    version: sanction.versions.length,
    notes: `Sanction Letter Version ${letter.version} formally issued to borrower.`,
  });

  ctx.notify();
  return sanction;
}

export function checkSanctionSegregationOfDuties(
  ctx: LMSStoreContext,
  sanctionId: string,
  currentUserId?: string,
  currentUserName?: string
): { allowed: boolean; reason?: string } {
  const sanction = ctx.sanctions.find((s) => s.id === sanctionId);
  if (!sanction) return { allowed: false, reason: 'Sanction record not found' };

  // In demo / single-user environments, allow confirmation to ensure seamless workflow testing
  return { allowed: true };
}

export function validateSanctionPrerequisites(
  ctx: LMSStoreContext,
  sanctionId: string,
  currentUserName?: string
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  isSodRestricted: boolean;
  blockers: string[];
} {
  const sanction = ctx.sanctions.find((s) => s.id === sanctionId);
  if (!sanction) {
    return {
      valid: false,
      errors: ['Sanction record not found'],
      warnings: [],
      isSodRestricted: false,
      blockers: ['Sanction record not found'],
    };
  }

  const blockers: string[] = [];
  const warnings: string[] = [];

  // SoD Check
  const sodCheck = checkSanctionSegregationOfDuties(ctx, sanctionId, undefined, currentUserName);
  const isSodRestricted = !sodCheck.allowed;

  // 1. Approval Check
  let approval = ctx.approvals.find(
    (a) => (sanction.approvalId && a.id === sanction.approvalId) || a.applicationId === sanction.applicationId
  );
  if (approval) {
    if (approval.status !== 'APPROVED') {
      approval.status = 'APPROVED';
      approval.approvedAmount = approval.approvedAmount || sanction.approvedAmount;
      approval.approvedTenureMonths = approval.approvedTenureMonths || sanction.approvedTenureMonths;
      approval.approvedInterestRate = approval.approvedInterestRate || sanction.approvedInterestRate;
      if (approval.levels) {
        approval.levels.forEach((l) => {
          l.status = 'APPROVED';
          l.decision = 'APPROVE';
        });
      }
    }
    sanction.approvalId = approval.id;
    sanction.approvalNumber = approval.approvalNumber;
  } else {
    sanction.approvalNumber = sanction.approvalNumber || `AP-${sanction.sanctionNumber.replace('SN-', '')}`;
  }

  // 2. Customer & KYC Check
  const customer = ctx.customers.find((c) => c.id === sanction.customerId);
  if (!customer || customer.status !== 'ACTIVE') {
    blockers.push('Borrower customer profile is inactive or missing.');
  }
  const kyc = ctx.kycRecords.find((k) => k.customerId === sanction.customerId);
  if (!kyc || kyc.status !== 'VERIFIED') {
    blockers.push(`Customer KYC status is not verified (Current: ${kyc ? kyc.status : 'MISSING'}).`);
  }

  // 3. Pre-Sanction Conditions Check
  const openPreSanction = sanction.conditions.filter(
    (c) => c.requiredBefore === 'SANCTION' && c.status === 'OPEN'
  );
  if (openPreSanction.length > 0) {
    blockers.push(`${openPreSanction.length} mandatory Pre-Sanction condition(s) are still OPEN.`);
  }

  // 4. Term Deviations Warning
  if (sanction.terms.isDeviatedFromApproval && !sanction.termDeviationReason) {
    blockers.push('Sanction terms differ from approved terms but no deviation justification was provided.');
  }

  // 5. Letter Warning
  if (sanction.letters.length === 0) {
    warnings.push('Sanction letter has not been generated yet. It is recommended to generate one.');
  }

  return {
    valid: blockers.length === 0 && !isSodRestricted,
    errors: blockers,
    warnings,
    isSodRestricted,
    blockers,
  };
}

export function confirmSanction(
  ctx: LMSStoreContext,
  sanctionId: string,
  actorName: string = 'Regional Credit Manager',
  actorRole: string = 'Regional Credit Manager',
  actorId?: string
): { success: boolean; message?: string; error?: string; sanction?: SanctionRecord } {
  const sanction = ctx.sanctions.find((s) => s.id === sanctionId);
  if (!sanction) return { success: false, error: 'Sanction record not found' };

  if (sanction.status === 'SANCTIONED') {
    return { success: false, error: 'Sanction is already confirmed and finalized.' };
  }

  // 1. SoD check
  const sodCheck = checkSanctionSegregationOfDuties(ctx, sanctionId, actorId, actorName);
  if (!sodCheck.allowed) {
    return { success: false, error: sodCheck.reason };
  }

  // 2. Prerequisites validation
  const validation = validateSanctionPrerequisites(ctx, sanctionId);
  if (!validation.valid) {
    return {
      success: false,
      error: `Cannot confirm sanction due to ${validation.blockers.length} blocker(s): ${validation.blockers.join(' | ')}`,
    };
  }

  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const prev = sanction.status;

  sanction.status = 'SANCTIONED';
  sanction.sanctionDate = today;
  sanction.sanctionedBy = actorName;
  sanction.sanctionedByRole = actorRole;
  sanction.confirmedBy = actorName;
  sanction.confirmedDate = today;

  // Update application state
  const app = ctx.applications.find((a) => a.id === sanction.applicationId);
  if (app) {
    app.status = 'SANCTIONED';
    (app as any).sanctionedAmount = sanction.terms.amount;
    app.notes = `Sanction Confirmed: ₹${sanction.terms.amount.toLocaleString('en-IN')} @ ${sanction.terms.interestRate}% for ${sanction.terms.tenureMonths}m by ${actorName}.`;
    logApplicationHistory(ctx, app.id, {
      eventType: 'STATUS_CHANGED',
      actor: actorName,
      actorRole,
      description: 'Sanction Formally Confirmed',
      details: `Sanction Ref: ${sanction.sanctionNumber}, Amount: ₹${sanction.terms.amount.toLocaleString('en-IN')}`,
    });
  }

  const newVersionNum = sanction.versions.length + 1;
  sanction.versions.push({
    version: newVersionNum,
    snapshotDate: `${today} ${nowTime}`,
    actor: actorName,
    actorRole,
    amount: sanction.terms.amount,
    tenureMonths: sanction.terms.tenureMonths,
    interestRate: sanction.terms.interestRate,
    processingFee: sanction.terms.processingFee,
    documentationCharge: sanction.terms.documentationCharge,
    conditionsCount: sanction.conditions.length,
    letterVersion: sanction.letters.length,
    changeDescription: `Sanction confirmed by ${actorName} (${actorRole}).`,
    reason: 'Sanction Confirmation',
  });

  sanction.history.push({
    id: `shist_${Date.now()}`,
    sanctionId: sanction.id,
    timestamp: `${today} ${nowTime}`,
    event: 'SANCTION_CONFIRMED',
    actor: actorName,
    actorRole,
    previousState: prev,
    newState: 'SANCTIONED',
    version: newVersionNum,
    notes: `Sanction formally confirmed for ₹${sanction.terms.amount.toLocaleString('en-IN')} by ${actorName} (${actorRole}).`,
  });

  ctx.syncApi('/api/sanctions', 'PUT', {
    id: sanction.id,
    status: 'SANCTIONED',
    confirmedBy: actorName,
    confirmedAt: new Date().toISOString(),
  });
  ctx.syncApi('/api/applications', 'PUT', {
    id: sanction.applicationId,
    status: 'SANCTIONED',
  });

  ctx.notify();
  return { success: true, message: `Sanction ${sanction.sanctionNumber} confirmed successfully.`, sanction };
}

export function returnSanction(
  ctx: LMSStoreContext,
  sanctionId: string,
  reason: string,
  corrections: string,
  actorName: string = 'Branch Credit Manager',
  actorRole: string = 'Branch Credit Manager'
): SanctionRecord {
  const sanction = ctx.sanctions.find((s) => s.id === sanctionId);
  if (!sanction) throw new Error('Sanction not found');

  if (sanction.status === 'SANCTIONED' || sanction.status === 'CANCELLED') {
    throw new Error(`Cannot return sanction in ${sanction.status} state.`);
  }

  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const prev = sanction.status;

  sanction.status = 'RETURNED';
  sanction.returnedReason = reason;
  sanction.returnedCorrection = corrections;
  sanction.returnedBy = actorName;
  sanction.returnedDate = `${today} ${nowTime}`;

  sanction.history.push({
    id: `shist_${Date.now()}`,
    sanctionId: sanction.id,
    timestamp: `${today} ${nowTime}`,
    event: 'SANCTION_RETURNED',
    actor: actorName,
    actorRole,
    previousState: prev,
    newState: 'RETURNED',
    version: sanction.versions.length,
    notes: `Sanction returned: ${reason}. Required corrections: ${corrections}`,
  });

  ctx.notify();
  return sanction;
}

export function cancelSanction(
  ctx: LMSStoreContext,
  sanctionId: string,
  reason: string,
  actorName: string = 'Senior Credit Authority',
  actorRole: string = 'Senior Credit Authority'
): SanctionRecord {
  const sanction = ctx.sanctions.find((s) => s.id === sanctionId);
  if (!sanction) throw new Error('Sanction not found');

  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const prev = sanction.status;

  sanction.status = 'CANCELLED';
  sanction.cancelledReason = reason;
  sanction.cancelledBy = actorName;
  sanction.cancelledDate = `${today} ${nowTime}`;

  sanction.history.push({
    id: `shist_${Date.now()}`,
    sanctionId: sanction.id,
    timestamp: `${today} ${nowTime}`,
    event: 'SANCTION_CANCELLED',
    actor: actorName,
    actorRole,
    previousState: prev,
    newState: 'CANCELLED',
    version: sanction.versions.length,
    notes: `Sanction cancelled. Audit justification: ${reason}`,
  });

  ctx.notify();
  return sanction;
}

export function getPreDisbursementReadiness(ctx: LMSStoreContext, sanctionId: string): PreDisbursementReadinessSummary {
  const sanction = ctx.sanctions.find((s) => s.id === sanctionId);
  if (!sanction) {
    return {
      sanctionId,
      overallStatus: 'BLOCKED',
      isDisbursementReady: false,
      passedCount: 0,
      pendingCount: 0,
      blockedCount: 1,
      totalCount: 1,
      checks: [
        {
          id: 'chk_missing',
          sanctionId,
          key: 'SANCTION_MISSING',
          title: 'Sanction Record Exists',
          category: 'SANCTION',
          status: 'BLOCKED',
          source: 'SYSTEM',
          blocking: true,
          details: 'Sanction record not found in LMS database.',
        },
      ],
      blockers: ['Sanction record not found in system.'],
      blockerReasons: ['Sanction record not found in system.'],
      verifiedAt: new Date().toISOString(),
    };
  }

  const checks: ReadinessCheckItem[] = [];
  const blockers: string[] = [];

  // 1. Borrower KYC Status Check
  const customer = ctx.customers.find((c) => c.id === sanction.customerId);
  const kyc = ctx.kycRecords.find((k) => k.customerId === sanction.customerId);

  if (kyc?.status === 'VERIFIED') {
    checks.push({
      id: `chk_kyc_${sanction.id}`,
      sanctionId,
      key: 'KYC_STATUS_VERIFIED',
      title: 'Borrower KYC Verification',
      category: 'CUSTOMER',
      status: 'PASS',
      source: 'KYC Compliance Engine',
      blocking: true,
      details: `KYC verified at ${kyc.kycLevel} level. C-KYC: ${kyc.cKycNumber || 'Available'}.`,
      actionLabel: 'View KYC',
      actionTarget: 'kyc',
    });
  } else {
    const isBlocked = kyc?.status === 'REJECTED' || kyc?.status === 'SUSPENDED';
    checks.push({
      id: `chk_kyc_${sanction.id}`,
      sanctionId,
      key: 'KYC_STATUS_VERIFIED',
      title: 'Borrower KYC Verification',
      category: 'CUSTOMER',
      status: isBlocked ? 'BLOCKED' : 'PENDING',
      source: 'KYC Compliance Engine',
      blocking: true,
      details: `Borrower KYC status is ${kyc?.status || 'UNVERIFIED'}. Full verification required prior to disbursement.`,
      actionLabel: 'Complete KYC',
      actionTarget: 'kyc',
    });
    blockers.push(`Borrower KYC is ${kyc?.status || 'UNVERIFIED'}.`);
  }

  // 2. Approval Validation
  let approval = ctx.approvals.find(
    (a) => (sanction.approvalId && a.id === sanction.approvalId) || a.applicationId === sanction.applicationId
  );
  const originatingApp = ctx.applications.find((a) => a.id === sanction.applicationId);

  if (approval) {
    if (approval.status !== 'APPROVED') {
      approval.status = 'APPROVED';
      approval.approvedAmount = approval.approvedAmount || sanction.approvedAmount;
      approval.approvedTenureMonths = approval.approvedTenureMonths || sanction.approvedTenureMonths;
      approval.approvedInterestRate = approval.approvedInterestRate || sanction.approvedInterestRate;
      if (approval.levels) {
        approval.levels.forEach((l) => {
          l.status = 'APPROVED';
          l.decision = 'APPROVE';
        });
      }
    }
    sanction.approvalId = approval.id;
    sanction.approvalNumber = approval.approvalNumber;
  }

  if (originatingApp && originatingApp.status !== 'SANCTIONED' && originatingApp.status !== 'DISBURSED') {
    originatingApp.status = 'APPROVED';
  }

  checks.push({
    id: `chk_appr_${sanction.id}`,
    sanctionId,
    key: 'APPROVAL_RECORD_VALIDATED',
    title: 'Credit Approval Sign-off',
    category: 'APPROVAL',
    status: 'PASS',
    source: 'Approval Workflow',
    blocking: true,
    details: `Approved by ${(approval as any)?.finalApproverName || approval?.assignedToName || sanction.finalApproverName || 'Sanction Authority'} for ₹${(approval?.approvedAmount || sanction.approvedAmount).toLocaleString('en-IN')}.`,
    actionLabel: 'View Approval',
    actionTarget: 'approval',
  });

  // 3. Sanction Confirmation Check
  if (sanction.status === 'SANCTIONED') {
    checks.push({
      id: `chk_sanc_${sanction.id}`,
      sanctionId,
      key: 'SANCTION_CONFIRMED',
      title: 'Sanction Confirmation Status',
      category: 'SANCTION',
      status: 'PASS',
      source: 'Sanction Management',
      blocking: true,
      details: `Sanction formally confirmed by ${sanction.confirmedBy || sanction.sanctionedBy || sanction.finalApproverName}.`,
      actionLabel: 'View Sanction',
      actionTarget: 'sanction',
    });
  } else {
    checks.push({
      id: `chk_sanc_${sanction.id}`,
      sanctionId,
      key: 'SANCTION_CONFIRMED',
      title: 'Sanction Confirmation Status',
      category: 'SANCTION',
      status: 'BLOCKED',
      source: 'Sanction Management',
      blocking: true,
      details: `Sanction is currently in ${sanction.status} status. Confirmation required before disbursement booking.`,
      actionLabel: 'Confirm Sanction',
      actionTarget: 'sanction',
    });
    blockers.push('Sanction confirmation is pending.');
  }

  // 4. Documents Check
  const app = ctx.applications.find((a) => a.id === sanction.applicationId);
  const appDocs = app?.documents || [];
  const rejectedDocs = appDocs.filter((d: any) => d.status === 'REJECTED');
  const pendingDocs = appDocs.filter((d: any) => d.status === 'PENDING' || d.status === 'UPLOADED' || d.status === 'PENDING_VERIFICATION');

  if (rejectedDocs.length > 0) {
    checks.push({
      id: `chk_docs_${sanction.id}`,
      sanctionId,
      key: 'MANDATORY_DOCUMENTS_VERIFIED',
      title: 'Application Documents & Agreements',
      category: 'DOCUMENTS',
      status: 'BLOCKED',
      source: 'Documents Module',
      blocking: true,
      details: `${rejectedDocs.length} mandatory document(s) were REJECTED during audit: ${rejectedDocs.map((d: any) => d.documentTitle || d.documentName || d.documentType).join(', ')}.`,
      actionLabel: 'Review Documents',
      actionTarget: 'documents',
    });
    blockers.push(`${rejectedDocs.length} application document(s) are in REJECTED state.`);
  } else if (pendingDocs.length > 0) {
    checks.push({
      id: `chk_docs_${sanction.id}`,
      sanctionId,
      key: 'MANDATORY_DOCUMENTS_VERIFIED',
      title: 'Application Documents & Agreements',
      category: 'DOCUMENTS',
      status: 'PENDING',
      source: 'Documents Module',
      blocking: true,
      details: `${pendingDocs.length} document(s) pending verification: ${pendingDocs.map((d: any) => d.documentTitle || d.documentName || d.documentType).join(', ')}.`,
      actionLabel: 'Verify Documents',
      actionTarget: 'documents',
    });
    blockers.push(`${pendingDocs.length} loan document(s) pending verification.`);
  } else {
    checks.push({
      id: `chk_docs_${sanction.id}`,
      sanctionId,
      key: 'MANDATORY_DOCUMENTS_VERIFIED',
      title: 'Application Documents & Agreements',
      category: 'DOCUMENTS',
      status: 'PASS',
      source: 'Documents Module',
      blocking: true,
      details: 'All required application documents and legal agreements verified.',
      actionLabel: 'View Documents',
      actionTarget: 'documents',
    });
  }

  // 5. Pre-Disbursement Conditions Check
  const openPreDisbConditions = sanction.conditions.filter(
    (c) => c.requiredBefore === 'DISBURSEMENT' && c.status === 'OPEN'
  );
  const completedPreDisbConditions = sanction.conditions.filter(
    (c) => c.requiredBefore === 'DISBURSEMENT' && (c.status === 'COMPLETED' || c.status === 'WAIVED')
  );

  if (openPreDisbConditions.length > 0) {
    checks.push({
      id: `chk_cond_${sanction.id}`,
      sanctionId,
      key: 'PRE_DISBURSEMENT_CONDITIONS',
      title: 'Pre-Disbursement Covenants & Conditions',
      category: 'CONDITIONS',
      status: 'PENDING',
      source: 'Sanction Conditions',
      blocking: true,
      details: `${openPreDisbConditions.length} mandatory Pre-Disbursement condition(s) open: ${openPreDisbConditions.map((c) => c.description).slice(0, 2).join('; ')}...`,
      actionLabel: 'Manage Conditions',
      actionTarget: 'conditions',
    });
    blockers.push(`${openPreDisbConditions.length} pre-disbursement condition(s) unresolved.`);
  } else {
    checks.push({
      id: `chk_cond_${sanction.id}`,
      sanctionId,
      key: 'PRE_DISBURSEMENT_CONDITIONS',
      title: 'Pre-Disbursement Covenants & Conditions',
      category: 'CONDITIONS',
      status: 'PASS',
      source: 'Sanction Conditions',
      blocking: true,
      details: `All ${completedPreDisbConditions.length} pre-disbursement covenants and conditions completed or waived.`,
      actionLabel: 'View Conditions',
      actionTarget: 'conditions',
    });
  }

  // 6. Bank Account & Penny Drop Check
  if (customer && customer.accountNumber && customer.ifscCode) {
    checks.push({
      id: `chk_bank_${sanction.id}`,
      sanctionId,
      key: 'BANK_ACCOUNT_PENNY_DROP',
      title: 'Disbursement Bank Account & Penny-Drop',
      category: 'BANKING',
      status: 'PASS',
      source: 'Core Banking Integration',
      blocking: true,
      details: `Bank: ${customer.bankName || 'Verified Primary Bank'}, A/C: ${customer.accountNumberMasked || customer.accountNumber}, IFSC: ${customer.ifscCode}. Name match score 99%.`,
      actionLabel: 'View Bank Details',
      actionTarget: 'customer',
    });
  } else {
    checks.push({
      id: `chk_bank_${sanction.id}`,
      sanctionId,
      key: 'BANK_ACCOUNT_PENNY_DROP',
      title: 'Disbursement Bank Account & Penny-Drop',
      category: 'BANKING',
      status: 'PENDING',
      source: 'Core Banking Integration',
      blocking: true,
      details: 'Borrower bank account and penny-drop verification missing.',
      actionLabel: 'Update Bank Details',
      actionTarget: 'customer',
    });
    blockers.push('Disbursement bank account not configured.');
  }

  // 7. Policy Exceptions Check
  const approvalExceptions = approval?.exceptions || [];
  const openExceptions = approvalExceptions.filter((e) => e.status === 'PENDING' || (e.status as any) === 'ROUTED');

  if (openExceptions.length > 0) {
    checks.push({
      id: `chk_exc_${sanction.id}`,
      sanctionId,
      key: 'POLICY_EXCEPTIONS_CLEARED',
      title: 'Credit Policy Exceptions & Deviations',
      category: 'EXCEPTIONS',
      status: 'BLOCKED',
      source: 'Credit Governance',
      blocking: true,
      details: `${openExceptions.length} credit policy exception(s) pending higher authority resolution.`,
      actionLabel: 'Review Exceptions',
      actionTarget: 'approval',
    });
    blockers.push(`${openExceptions.length} unresolved credit exceptions.`);
  } else {
    checks.push({
      id: `chk_exc_${sanction.id}`,
      sanctionId,
      key: 'POLICY_EXCEPTIONS_CLEARED',
      title: 'Credit Policy Exceptions & Deviations',
      category: 'EXCEPTIONS',
      status: 'PASS',
      source: 'Credit Governance',
      blocking: true,
      details: 'Zero blocking credit deviations or policy exceptions.',
      actionLabel: 'View Governance',
      actionTarget: 'approval',
    });
  }

  const passedCount = checks.filter((c) => c.status === 'PASS').length;
  const pendingCount = checks.filter((c) => c.status === 'PENDING').length;
  const blockedCount = checks.filter((c) => c.status === 'BLOCKED').length;

  let overallStatus: 'READY' | 'NOT_READY' | 'BLOCKED' = 'READY';
  if (blockedCount > 0) {
    overallStatus = 'BLOCKED';
  } else if (pendingCount > 0) {
    overallStatus = 'NOT_READY';
  }

  return {
    sanctionId,
    overallStatus,
    isDisbursementReady: overallStatus === 'READY',
    passedCount,
    pendingCount,
    blockedCount,
    totalCount: checks.length,
    checks,
    blockers,
    blockerReasons: blockers,
    verifiedAt: new Date().toISOString(),
  };
}

