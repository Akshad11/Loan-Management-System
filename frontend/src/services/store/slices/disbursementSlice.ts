import { LMSStoreContext } from '../types';
import {
  DisbursementRecord,
  DisbursementReadinessResult,
  DisbursementReadinessCheck,
  DisbursementBeneficiaryRecord,
  DisbursementRequestRecord,
  DisbursementTransactionRecord,
  DisbursementKPIsData,
  PaymentMethod,
} from '../../../types/disbursementTypes';

export function getDisbursements(ctx: LMSStoreContext): DisbursementRecord[] {
  return [...ctx.disbursements];
}

export function getDisbursementById(ctx: LMSStoreContext, id: string): DisbursementRecord | undefined {
  return ctx.disbursements.find((d) => d.id === id || d.disbursementNumber === id);
}

export function getDisbursementBySanctionId(ctx: LMSStoreContext, sanctionId: string): DisbursementRecord | undefined {
  return ctx.disbursements.find((d) => d.sanctionId === sanctionId);
}

export function getDisbursementByApplicationId(ctx: LMSStoreContext, applicationId: string): DisbursementRecord | undefined {
  return ctx.disbursements.find((d) => d.applicationId === applicationId);
}

export function evaluateDisbursementReadiness(ctx: LMSStoreContext, sanctionId: string): DisbursementReadinessResult {
  const sanction = ctx.sanctions.find((s) => s.id === sanctionId || s.sanctionNumber === sanctionId);
  if (!sanction) {
    return {
      isEligible: false,
      totalChecks: 0,
      passedChecks: 0,
      pendingChecks: 0,
      blockedChecks: 1,
      checks: [
        {
          id: 'chk_missing_sanction',
          category: 'SANCTION',
          title: 'Sanction Record Missing',
          description: 'Valid confirmed sanction must exist.',
          status: 'BLOCKED',
          source: 'Sanction Management',
          reason: 'Sanction not found.',
        },
      ],
    };
  }

  const application = ctx.applications.find((a) => a.id === sanction.applicationId || a.applicationNumber === sanction.applicationNumber);
  const customer = ctx.customers.find((c) => c.id === sanction.customerId || c.customerNumber === sanction.customerNumber);
  const kyc = ctx.kycRecords.find((k) => k.customerId === sanction.customerId || (customer && k.customerId === customer.id));
  const approval = ctx.approvals.find((ap) => ap.id === sanction.approvalId || ap.applicationId === sanction.applicationId);
  const conditions = sanction.conditions || [];
  const openConditions = conditions.filter((c) => c.requiredBefore === 'DISBURSEMENT' && c.status === 'OPEN');

  const checks: DisbursementReadinessCheck[] = [];

  // 1. Customer Active & KYC Check
  const isKycValid = !!(customer && (customer.status === 'ACTIVE' || kyc?.status === 'VERIFIED'));
  checks.push({
    id: 'chk_kyc',
    category: 'CUSTOMER',
    title: 'Customer Identity & KYC Verification',
    description: 'Borrower KYC must be fully verified (Aadhaar/PAN/Video KYC) with no AML flags.',
    status: isKycValid ? 'PASS' : 'BLOCKED',
    source: 'Customer / KYC Module',
    reason: isKycValid ? undefined : 'Customer KYC is unverified or customer is inactive.',
    verifiedAt: isKycValid ? new Date().toISOString() : undefined,
    verifiedBy: isKycValid ? 'Compliance Automation' : undefined,
  });

  // 2. Application Status Check
  const isAppEligible = sanction.status === 'SANCTIONED' || (application && (application.status === 'SANCTIONED' || application.status === 'APPROVED'));
  checks.push({
    id: 'chk_app',
    category: 'APPLICATION',
    title: 'Loan Application Eligibility & Workflow State',
    description: 'Application must be in approved/sanctioned status with valid terms.',
    status: isAppEligible ? 'PASS' : 'BLOCKED',
    source: 'Application Engine',
    reason: isAppEligible ? undefined : `Application status is ${application?.status || 'UNKNOWN'}.`,
  });

  // 3. Approval Record Check
  const isApprovalValid = sanction.status === 'SANCTIONED' || (approval && approval.status === 'APPROVED');
  checks.push({
    id: 'chk_approval',
    category: 'APPROVAL',
    title: 'Credit Committee Final Approval',
    description: 'Final multi-level approval must be in place and not cancelled or expired.',
    status: isApprovalValid ? 'PASS' : 'BLOCKED',
    source: 'Credit Governance',
    reason: isApprovalValid ? undefined : 'Final credit committee approval is missing or unapproved.',
  });

  // 4. Sanction Confirmation Check
  const isSanctionConfirmed = sanction.status === 'SANCTIONED';
  checks.push({
    id: 'chk_sanction',
    category: 'SANCTION',
    title: 'Sanction Confirmation & Acceptance',
    description: 'Sanction letter must be generated, issued, and confirmed by authority.',
    status: isSanctionConfirmed ? 'PASS' : (sanction.status === 'DRAFT' || sanction.status === 'UNDER_REVIEW' ? 'PENDING' : 'BLOCKED'),
    source: 'Sanction Management',
    reason: isSanctionConfirmed ? undefined : `Sanction is in ${sanction.status} status. Needs confirmation.`,
  });

  // 5. Pre-Disbursement Mandatory Conditions Check
  checks.push({
    id: 'chk_conditions',
    category: 'CONDITIONS',
    title: 'Pre-Disbursement Conditions Compliance',
    description: 'All mandatory conditions flagged for completion before disbursement must be satisfied.',
    status: openConditions.length === 0 ? 'PASS' : 'BLOCKED',
    source: 'Sanction Conditions Hub',
    reason: openConditions.length === 0 ? undefined : `${openConditions.length} pre-disbursement condition(s) pending compliance.`,
    blockingDetails: openConditions.length > 0 ? openConditions.map((c) => c.description).join('; ') : undefined,
  });

  // 6. Mandatory Documents Verification Check
  const appDocs = application?.documents || [];
  const unverifiedMandatoryDocs = appDocs.filter((d) => d.isMandatory && d.status !== 'VERIFIED');
  checks.push({
    id: 'chk_docs',
    category: 'DOCUMENTS',
    title: 'Mandatory Loan Documents Verification',
    description: 'All mandatory loan contract, income, and security documents must be verified.',
    status: unverifiedMandatoryDocs.length === 0 ? 'PASS' : 'BLOCKED',
    source: 'Document Hub',
    reason: unverifiedMandatoryDocs.length === 0 ? undefined : `${unverifiedMandatoryDocs.length} mandatory document(s) unverified.`,
  });

  // 7. Banking & Beneficiary Details Check
  const customerHasBank = !!(customer?.accountNumber || customer?.accountNumberMasked || customer?.ifscCode);
  checks.push({
    id: 'chk_bank',
    category: 'BANKING',
    title: 'Beneficiary Bank Account & Mandate Verification',
    description: 'Verified beneficiary bank account details and payment mandate must be present.',
    status: customerHasBank ? 'PASS' : 'PENDING',
    source: 'Core Banking / KYC',
    reason: customerHasBank ? undefined : 'Customer bank account or IFSC details missing.',
  });

  const passedChecks = checks.filter((c) => c.status === 'PASS').length;
  const pendingChecks = checks.filter((c) => c.status === 'PENDING').length;
  const blockedChecks = checks.filter((c) => c.status === 'BLOCKED').length;

  return {
    isEligible: blockedChecks === 0 && pendingChecks === 0,
    totalChecks: checks.length,
    passedChecks,
    pendingChecks,
    blockedChecks,
    checks,
  };
}

export function createDisbursementRequest(
  ctx: LMSStoreContext,
  params: {
    sanctionId: string;
    requestedAmount: number;
    disbursementType: 'FULL' | 'PARTIAL';
    beneficiaryId?: string;
    newBeneficiary?: {
      beneficiaryType: 'PRIMARY_BORROWER' | 'CO_APPLICANT' | 'SELLER_BUILDER' | 'VENDOR' | 'INSTITUTION';
      beneficiaryName: string;
      bankName: string;
      accountNumber: string;
      ifscCode: string;
      accountType: 'SAVINGS' | 'CURRENT';
    };
    paymentMethod: PaymentMethod;
    purpose?: string;
    notes?: string;
    actorName: string;
    actorRole: string;
    actorId: string;
  }
): DisbursementRecord {
  const sanction = ctx.sanctions.find((s) => s.id === params.sanctionId || s.sanctionNumber === params.sanctionId);
  if (!sanction) {
    throw new Error('Sanction record not found.');
  }

  if (sanction.status !== 'SANCTIONED') {
    sanction.status = 'SANCTIONED';
    sanction.confirmedBy = params.actorName;
    sanction.confirmedDate = new Date().toISOString().split('T')[0];
  }

  if (params.requestedAmount <= 0) {
    throw new Error('Requested disbursement amount must be greater than zero.');
  }

  let disbursement = ctx.disbursements.find((d) => d.sanctionId === sanction.id);

  if (!disbursement) {
    // Create new top-level disbursement record
    const dsbNumber = `DSB-2026-${String(ctx.nextDisbursementSeq++).padStart(6, '0')}`;
    const cust = ctx.customers.find((c) => c.id === sanction.customerId || c.customerNumber === sanction.customerNumber);
    const defaultBeneficiary: DisbursementBeneficiaryRecord = {
      id: `ben_${Date.now()}`,
      disbursementId: `dsb_${Date.now()}`,
      beneficiaryType: 'PRIMARY_BORROWER',
      beneficiaryName: sanction.customerName,
      bankName: cust?.bankName || 'Primary Customer Account',
      accountNumber: cust?.accountNumber || 'Pending Registration',
      accountNumberMasked: cust?.accountNumberMasked || (cust?.accountNumber ? `•••• •••• ${cust.accountNumber.slice(-4)}` : '•••• •••• 0000'),
      ifscCode: cust?.ifscCode || 'Pending IFSC',
      accountType: 'SAVINGS',
      verificationStatus: cust?.bankName ? 'VERIFIED' : 'PENDING',
      verificationSource: cust?.bankName ? 'Primary Customer Account' : 'Verification Required',
      createdAt: new Date().toISOString(),
    };

    disbursement = {
      id: `dsb_${Date.now()}`,
      disbursementNumber: dsbNumber,
      applicationId: sanction.applicationId,
      applicationNumber: sanction.applicationNumber,
      sanctionId: sanction.id,
      sanctionNumber: sanction.sanctionNumber,
      customerId: sanction.customerId,
      customerNumber: sanction.customerNumber,
      customerName: sanction.customerName,
      customerMobile: sanction.customerMobile,
      productCode: sanction.productCode,
      productName: sanction.productName,
      branchId: sanction.branchId,
      branchName: sanction.branchName,
      sanctionAmount: sanction.approvedAmount,
      totalDisbursedAmount: 0,
      remainingAmount: sanction.approvedAmount,
      status: 'DRAFT',
      beneficiaries: [defaultBeneficiary],
      requests: [],
      transactions: [],
      history: [
        {
          id: `dh_${Date.now()}`,
          disbursementId: `dsb_${Date.now()}`,
          timestamp: new Date().toISOString(),
          event: 'DISBURSEMENT_CREATED',
          actor: params.actorId,
          actorName: params.actorName,
          actorRole: params.actorRole,
          newState: 'DRAFT',
          amount: sanction.approvedAmount,
          notes: `Disbursement file initialized for Sanction ${sanction.sanctionNumber}.`,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    ctx.disbursements.unshift(disbursement);
  }

  // Critical Invariant: Check remaining amount
  if (params.requestedAmount > disbursement.remainingAmount) {
    throw new Error(
      `Requested amount (₹${params.requestedAmount.toLocaleString('en-IN')}) exceeds the remaining sanction amount (₹${disbursement.remainingAmount.toLocaleString('en-IN')}).`
    );
  }

  // Handle beneficiary
  let selectedBeneficiaryId = params.beneficiaryId;
  if (params.newBeneficiary) {
    const maskedAcct = params.newBeneficiary.accountNumber.length > 4
      ? `•••• •••• •••• ${params.newBeneficiary.accountNumber.slice(-4)}`
      : params.newBeneficiary.accountNumber;

    const newBen: DisbursementBeneficiaryRecord = {
      id: `ben_${Date.now()}`,
      disbursementId: disbursement.id,
      beneficiaryType: params.newBeneficiary.beneficiaryType,
      beneficiaryName: params.newBeneficiary.beneficiaryName,
      bankName: params.newBeneficiary.bankName,
      accountNumber: params.newBeneficiary.accountNumber,
      accountNumberMasked: maskedAcct,
      ifscCode: params.newBeneficiary.ifscCode,
      accountType: params.newBeneficiary.accountType,
      verificationStatus: 'VERIFIED',
      verificationSource: 'Direct Bank Mandate',
      createdAt: new Date().toISOString(),
    };
    disbursement.beneficiaries.push(newBen);
    selectedBeneficiaryId = newBen.id;
  } else if (!selectedBeneficiaryId && disbursement.beneficiaries.length > 0) {
    selectedBeneficiaryId = disbursement.beneficiaries[0].id;
  }

  const readiness = evaluateDisbursementReadiness(ctx, sanction.id);
  const reqNumber = `DREQ-2026-${String(ctx.nextDisbursementReqSeq++).padStart(6, '0')}`;

  const newRequest: DisbursementRequestRecord = {
    id: `dreq_${Date.now()}`,
    requestNumber: reqNumber,
    disbursementId: disbursement.id,
    applicationId: sanction.applicationId,
    sanctionId: sanction.id,
    requestedAmount: params.requestedAmount,
    disbursementType: params.disbursementType,
    beneficiaryId: selectedBeneficiaryId,
    beneficiary: disbursement.beneficiaries.find((b) => b.id === selectedBeneficiaryId),
    paymentMethod: params.paymentMethod,
    purpose: params.purpose || `${params.disbursementType === 'FULL' ? 'Full' : 'Partial'} payout against sanction ${sanction.sanctionNumber}`,
    notes: params.notes,
    status: 'PENDING_APPROVAL',
    readinessChecks: readiness,
    requestedBy: params.actorId,
    requestedByName: params.actorName,
    requestedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  disbursement.requests.unshift(newRequest);
  disbursement.status = 'PENDING_APPROVAL';
  disbursement.updatedAt = new Date().toISOString();

  disbursement.history.unshift({
    id: `dh_${Date.now()}`,
    disbursementId: disbursement.id,
    requestId: newRequest.id,
    timestamp: new Date().toISOString(),
    event: 'REQUEST_CREATED',
    actor: params.actorId,
    actorName: params.actorName,
    actorRole: params.actorRole,
    newState: 'PENDING_APPROVAL',
    amount: params.requestedAmount,
    notes: `${params.disbursementType} disbursement request ${reqNumber} submitted for ₹${params.requestedAmount.toLocaleString('en-IN')}.`,
  });

  ctx.syncApi('/api/disbursements', 'POST', {
    sanctionId: sanction.id,
    disbursementType: params.disbursementType,
    requestedAmount: params.requestedAmount,
    paymentMethod: params.paymentMethod,
    purpose: params.purpose,
    notes: params.notes,
    beneficiaryId: selectedBeneficiaryId,
    newBeneficiary: params.newBeneficiary,
    actorName: params.actorName,
    actorRole: params.actorRole,
    actorId: params.actorId,
  });

  ctx.notify();
  return disbursement;
}

export function assignDisbursement(
  ctx: LMSStoreContext,
  disbursementId: string,
  requestId: string,
  assignedToId: string,
  assignedToName: string,
  actor: string
): DisbursementRecord {
  const dsb = ctx.disbursements.find((d) => d.id === disbursementId);
  if (!dsb) throw new Error('Disbursement not found.');

  const req = dsb.requests.find((r) => r.id === requestId);
  if (!req) throw new Error('Disbursement request not found.');

  req.assignedTo = assignedToId;
  req.assignedToName = assignedToName;
  req.assignedAt = new Date().toISOString();
  req.updatedAt = new Date().toISOString();

  dsb.history.unshift({
    id: `dh_${Date.now()}`,
    disbursementId: dsb.id,
    requestId: req.id,
    timestamp: new Date().toISOString(),
    event: 'ASSIGNED',
    actor,
    actorName: actor,
    actorRole: 'Operations Officer',
    notes: `Request assigned to ${assignedToName} for checker review.`,
  });

  ctx.syncApi(`/api/disbursements/${disbursementId}/actions`, 'POST', {
    action: 'ASSIGN',
    requestId,
    assignedToId,
    assignedToName,
    actorName: actor,
    actorRole: 'Operations Officer',
  });

  ctx.notify();
  return dsb;
}

export function approveDisbursement(
  ctx: LMSStoreContext,
  disbursementId: string,
  requestId: string,
  approverName: string,
  approverRole: string,
  notes?: string
): DisbursementRecord {
  const dsb = ctx.disbursements.find((d) => d.id === disbursementId);
  if (!dsb) throw new Error('Disbursement not found.');

  const req = dsb.requests.find((r) => r.id === requestId);
  if (!req) throw new Error('Disbursement request not found.');

  if (req.status !== 'PENDING_APPROVAL') {
    throw new Error(`Cannot approve request in status "${req.status}". Must be in PENDING_APPROVAL.`);
  }

  // Segregation of Duties Enforcement (Maker != Checker with Admin Override)
  const isAdmin = approverRole === 'System Administrator' || approverRole.toLowerCase().includes('admin');
  if (!isAdmin && req.requestedByName && req.requestedByName.trim().toLowerCase() === approverName.trim().toLowerCase()) {
    throw new Error(
      'Segregation of Duties Violation: You cannot approve a disbursement request created by yourself. A separate checker/approver is required.'
    );
  }

  // Server-side readiness check
  const readiness = evaluateDisbursementReadiness(ctx, dsb.sanctionId);
  if (!readiness.isEligible) {
    throw new Error(
      `Disbursement cannot be approved: ${readiness.blockedChecks} blocking check(s) and ${readiness.pendingChecks} pending check(s) must be resolved first.`
    );
  }

  req.status = 'APPROVED';
  req.approvedBy = approverName;
  req.approvedByName = approverName;
  req.approvedAt = new Date().toISOString();
  req.approvalNotes = notes || (isAdmin && req.requestedByName?.trim().toLowerCase() === approverName?.trim().toLowerCase() ? '[Admin Override] Approved for transaction processing.' : 'Approved for transaction processing.');
  req.updatedAt = new Date().toISOString();

  dsb.status = 'APPROVED';
  dsb.updatedAt = new Date().toISOString();

  dsb.history.unshift({
    id: `dh_${Date.now()}`,
    disbursementId: dsb.id,
    requestId: req.id,
    timestamp: new Date().toISOString(),
    event: 'APPROVED',
    actor: approverName,
    actorName: approverName,
    actorRole: approverRole,
    previousState: 'PENDING_APPROVAL',
    newState: 'APPROVED',
    amount: req.requestedAmount,
    notes: `Disbursement request ${req.requestNumber} approved by ${approverName} (${approverRole}). Ready for transaction.`,
  });

  ctx.syncApi(`/api/disbursements/${disbursementId}/actions`, 'POST', {
    action: 'APPROVE',
    requestId,
    actorName: approverName,
    actorRole: approverRole,
    notes: req.approvalNotes,
  });

  ctx.notify();
  return dsb;
}

export function rejectDisbursement(
  ctx: LMSStoreContext,
  disbursementId: string,
  requestId: string,
  rejectorName: string,
  rejectorRole: string,
  reason: string
): DisbursementRecord {
  const dsb = ctx.disbursements.find((d) => d.id === disbursementId);
  if (!dsb) throw new Error('Disbursement not found.');

  const req = dsb.requests.find((r) => r.id === requestId);
  if (!req) throw new Error('Disbursement request not found.');

  req.status = 'REJECTED';
  req.rejectedBy = rejectorName;
  req.rejectedByName = rejectorName;
  req.rejectedAt = new Date().toISOString();
  req.rejectionReason = reason;
  req.updatedAt = new Date().toISOString();

  dsb.status = dsb.totalDisbursedAmount > 0 ? ('PARTIAL' as any) : 'REJECTED';
  dsb.updatedAt = new Date().toISOString();

  dsb.history.unshift({
    id: `dh_${Date.now()}`,
    disbursementId: dsb.id,
    requestId: req.id,
    timestamp: new Date().toISOString(),
    event: 'REJECTED',
    actor: rejectorName,
    actorName: rejectorName,
    actorRole: rejectorRole,
    previousState: 'PENDING_APPROVAL',
    newState: 'REJECTED',
    amount: req.requestedAmount,
    notes: `Request ${req.requestNumber} rejected: ${reason}`,
  });

  ctx.syncApi(`/api/disbursements/${disbursementId}/actions`, 'POST', {
    action: 'REJECT',
    requestId,
    actorName: rejectorName,
    actorRole: rejectorRole,
    reason,
  });

  ctx.notify();
  return dsb;
}

export function returnDisbursement(
  ctx: LMSStoreContext,
  disbursementId: string,
  requestId: string,
  actorName: string,
  actorRole: string,
  reason: string
): DisbursementRecord {
  const dsb = ctx.disbursements.find((d) => d.id === disbursementId);
  if (!dsb) throw new Error('Disbursement not found.');

  const req = dsb.requests.find((r) => r.id === requestId);
  if (!req) throw new Error('Disbursement request not found.');

  req.status = 'RETURNED';
  req.returnedBy = actorName;
  req.returnedByName = actorName;
  req.returnedAt = new Date().toISOString();
  req.returnReason = reason;
  req.updatedAt = new Date().toISOString();

  dsb.status = 'RETURNED';
  dsb.updatedAt = new Date().toISOString();

  dsb.history.unshift({
    id: `dh_${Date.now()}`,
    disbursementId: dsb.id,
    requestId: req.id,
    timestamp: new Date().toISOString(),
    event: 'RETURNED',
    actor: actorName,
    actorName: actorName,
    actorRole: actorRole,
    previousState: 'PENDING_APPROVAL',
    newState: 'RETURNED',
    amount: req.requestedAmount,
    notes: `Request returned for modification: ${reason}`,
  });

  ctx.syncApi(`/api/disbursements/${disbursementId}/actions`, 'POST', {
    action: 'RETURN',
    requestId,
    actorName,
    actorRole,
    reason,
  });

  ctx.notify();
  return dsb;
}

export function executeDisbursementTransaction(
  ctx: LMSStoreContext,
  disbursementId: string,
  requestId: string,
  params: {
    paymentMethod: PaymentMethod;
    utrNumber?: string;
    externalReference?: string;
    simulateFailure?: boolean;
    failureReason?: string;
  },
  actorName: string,
  actorRole: string
): DisbursementRecord {
  const dsb = ctx.disbursements.find((d) => d.id === disbursementId);
  if (!dsb) throw new Error('Disbursement not found.');

  const req = dsb.requests.find((r) => r.id === requestId);
  if (!req) throw new Error('Disbursement request not found.');

  if (req.status !== 'APPROVED' && req.status !== 'FAILED') {
    throw new Error(`Cannot execute transaction for request in status "${req.status}". Request must be APPROVED.`);
  }

  const beneficiary = dsb.beneficiaries.find((b) => b.id === req.beneficiaryId) || dsb.beneficiaries[0];
  const txnRef = `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(ctx.nextTransactionSeq++).padStart(5, '0')}`;
  const generatedUtr = params.utrNumber || `${params.paymentMethod.slice(0, 4)}R${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Math.floor(100000 + Math.random() * 900000)}`;

  if (params.simulateFailure) {
    // Failed transaction
    const failedTxn: DisbursementTransactionRecord = {
      id: `txn_${Date.now()}`,
      transactionReference: txnRef,
      disbursementId: dsb.id,
      requestId: req.id,
      amount: req.requestedAmount,
      paymentMethod: params.paymentMethod,
      status: 'FAILED',
      beneficiaryName: beneficiary?.beneficiaryName || dsb.customerName,
      beneficiaryAccountNumberMasked: beneficiary?.accountNumberMasked || '•••• •••• •••• 0000',
      beneficiaryIfsc: beneficiary?.ifscCode || 'HDFC0000120',
      bankName: beneficiary?.bankName || 'HDFC Bank Ltd',
      externalReference: params.externalReference || 'BANK-ERR-502',
      failureReason: params.failureReason || 'Beneficiary bank network rejected the transaction / Account invalid.',
      processingStartedAt: new Date().toISOString(),
      failedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dsb.transactions.unshift(failedTxn);
    req.status = 'FAILED';
    dsb.status = 'FAILED';
    dsb.updatedAt = new Date().toISOString();

    dsb.history.unshift({
      id: `dh_${Date.now()}`,
      disbursementId: dsb.id,
      requestId: req.id,
      timestamp: new Date().toISOString(),
      event: 'TRANSACTION_FAILED',
      actor: actorName,
      actorName: actorName,
      actorRole: actorRole,
      previousState: 'PROCESSING',
      newState: 'FAILED',
      amount: req.requestedAmount,
      reference: failedTxn.transactionReference,
      notes: `Transaction payout failed: ${failedTxn.failureReason}`,
    });

    ctx.syncApi(`/api/disbursements/${disbursementId}/transactions`, 'POST', {
      requestId,
      paymentMethod: params.paymentMethod,
      simulateFailure: true,
      failureReason: params.failureReason,
      externalReference: params.externalReference,
      actorName,
      actorRole,
    });

    ctx.notify();
    return dsb;
  }

  // Successful transaction execution
  const newTxn: DisbursementTransactionRecord = {
    id: `txn_${Date.now()}`,
    transactionReference: txnRef,
    disbursementId: dsb.id,
    requestId: req.id,
    amount: req.requestedAmount,
    paymentMethod: params.paymentMethod,
    status: 'SUCCESSFUL',
    beneficiaryName: beneficiary?.beneficiaryName || dsb.customerName,
    beneficiaryAccountNumberMasked: beneficiary?.accountNumberMasked || '•••• •••• •••• 0000',
    beneficiaryIfsc: beneficiary?.ifscCode || 'HDFC0000120',
    bankName: beneficiary?.bankName || 'HDFC Bank Ltd',
    externalReference: params.externalReference || `EXT-${params.paymentMethod}-${Date.now()}`,
    utrNumber: generatedUtr,
    processingStartedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  dsb.transactions.unshift(newTxn);
  req.status = 'SUCCESSFUL';
  req.updatedAt = new Date().toISOString();

  // Critical Invariant calculation
  dsb.totalDisbursedAmount += req.requestedAmount;
  dsb.remainingAmount = Math.max(0, dsb.sanctionAmount - dsb.totalDisbursedAmount);

  if (dsb.remainingAmount === 0) {
    dsb.status = 'SUCCESSFUL';
  } else {
    dsb.status = 'SUCCESSFUL'; // active successful tranche, can draft more
  }

  if (!dsb.firstDisbursedAt) {
    dsb.firstDisbursedAt = new Date().toISOString();
  }
  dsb.lastDisbursedAt = new Date().toISOString();
  dsb.updatedAt = new Date().toISOString();

  // Also update application status if full disbursement reached
  const app = ctx.applications.find((a) => a.id === dsb.applicationId);
  if (app && dsb.remainingAmount === 0) {
    app.status = 'DISBURSED';
  }

  dsb.history.unshift({
    id: `dh_${Date.now()}`,
    disbursementId: dsb.id,
    requestId: req.id,
    timestamp: new Date().toISOString(),
    event: 'TRANSACTION_SUCCESSFUL',
    actor: actorName,
    actorName: actorName,
    actorRole: actorRole,
    previousState: 'APPROVED',
    newState: 'SUCCESSFUL',
    amount: req.requestedAmount,
    reference: generatedUtr,
    notes: `Payout of ₹${req.requestedAmount.toLocaleString('en-IN')} successfully settled via ${params.paymentMethod}. UTR: ${generatedUtr}. Remaining Sanction: ₹${dsb.remainingAmount.toLocaleString('en-IN')}.`,
  });

  try {
    if ((ctx as any).processLoanAccountOnDisbursement) {
      (ctx as any).processLoanAccountOnDisbursement(dsb, req, newTxn, actorName, actorRole);
    }
  } catch (loanErr) {
    console.warn('Could not auto-process loan account on disbursement:', loanErr);
  }

  ctx.syncApi(`/api/disbursements/${disbursementId}/transactions`, 'POST', {
    requestId,
    paymentMethod: params.paymentMethod,
    utrNumber: generatedUtr,
    externalReference: params.externalReference,
    simulateFailure: false,
    actorName,
    actorRole,
  });

  ctx.notify();
  return dsb;
}

export function reverseDisbursementTransaction(
  ctx: LMSStoreContext,
  disbursementId: string,
  transactionId: string,
  reason: string,
  actorName: string,
  actorRole: string
): DisbursementRecord {
  const dsb = ctx.disbursements.find((d) => d.id === disbursementId);
  if (!dsb) throw new Error('Disbursement not found.');

  const txn = dsb.transactions.find((t) => t.id === transactionId);
  if (!txn) throw new Error('Transaction not found.');

  if (txn.status !== 'SUCCESSFUL') {
    throw new Error('Only successful transactions can be reversed.');
  }

  txn.status = 'REVERSED';
  txn.reversedAt = new Date().toISOString();
  txn.reversedBy = actorName;
  txn.reversalReason = reason;
  txn.updatedAt = new Date().toISOString();

  // Revert financial calculation
  dsb.totalDisbursedAmount = Math.max(0, dsb.totalDisbursedAmount - txn.amount);
  dsb.remainingAmount = dsb.sanctionAmount - dsb.totalDisbursedAmount;
  dsb.status = 'REVERSED';
  dsb.updatedAt = new Date().toISOString();

  if (txn.requestId) {
    const req = dsb.requests.find((r) => r.id === txn.requestId);
    if (req) {
      req.status = 'REVERSED';
      req.updatedAt = new Date().toISOString();
    }
  }

  dsb.history.unshift({
    id: `dh_${Date.now()}`,
    disbursementId: dsb.id,
    requestId: txn.requestId,
    timestamp: new Date().toISOString(),
    event: 'TRANSACTION_REVERSED',
    actor: actorName,
    actorName: actorName,
    actorRole: actorRole,
    previousState: 'SUCCESSFUL',
    newState: 'REVERSED',
    amount: txn.amount,
    reference: txn.transactionReference,
    notes: `Transaction ${txn.transactionReference} of ₹${txn.amount.toLocaleString('en-IN')} reversed. Reason: ${reason}. Restored Remaining Balance: ₹${dsb.remainingAmount.toLocaleString('en-IN')}.`,
  });

  ctx.syncApi(`/api/disbursements/${disbursementId}/transactions`, 'PUT', {
    transactionId,
    reason,
    actorName,
    actorRole,
  });

  ctx.notify();
  return dsb;
}

export function addDisbursementBeneficiary(
  ctx: LMSStoreContext,
  disbursementId: string,
  beneficiary: {
    beneficiaryType: 'PRIMARY_BORROWER' | 'CO_APPLICANT' | 'SELLER_BUILDER' | 'VENDOR' | 'INSTITUTION';
    beneficiaryName: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    accountType: 'SAVINGS' | 'CURRENT';
    verificationSource?: string;
  }
): DisbursementBeneficiaryRecord {
  const dsb = ctx.disbursements.find((d) => d.id === disbursementId);
  if (!dsb) throw new Error('Disbursement not found.');

  const maskedAcct = beneficiary.accountNumber.length > 4
    ? `•••• •••• •••• ${beneficiary.accountNumber.slice(-4)}`
    : beneficiary.accountNumber;

  const newBen: DisbursementBeneficiaryRecord = {
    id: `ben_${Date.now()}`,
    disbursementId,
    beneficiaryType: beneficiary.beneficiaryType,
    beneficiaryName: beneficiary.beneficiaryName,
    bankName: beneficiary.bankName,
    accountNumber: beneficiary.accountNumber,
    accountNumberMasked: maskedAcct,
    ifscCode: beneficiary.ifscCode,
    accountType: beneficiary.accountType,
    verificationStatus: 'VERIFIED',
    verificationSource: beneficiary.verificationSource || 'Manual Entry & Verification',
    createdAt: new Date().toISOString(),
  };

  dsb.beneficiaries.push(newBen);
  dsb.updatedAt = new Date().toISOString();
  ctx.notify();
  return newBen;
}

export function getDisbursementKPIs(ctx: LMSStoreContext): DisbursementKPIsData {
  let totalSanctionedAmount = 0;
  let totalDisbursedAmount = 0;
  let totalRemainingAmount = 0;
  let pendingApprovalCount = 0;
  let pendingApprovalAmount = 0;
  let readyForPayoutCount = 0;
  let readyForPayoutAmount = 0;
  let successfulDisbursementCount = 0;
  let failedDisbursementCount = 0;

  ctx.disbursements.forEach((d) => {
    totalSanctionedAmount += d.sanctionAmount || 0;
    totalDisbursedAmount += d.totalDisbursedAmount || 0;
    totalRemainingAmount += d.remainingAmount || 0;

    if (d.status === 'PENDING_APPROVAL') {
      pendingApprovalCount++;
      pendingApprovalAmount += d.sanctionAmount || 0;
    } else if (d.status === 'APPROVED' || d.status === 'READY') {
      readyForPayoutCount++;
      readyForPayoutAmount += d.remainingAmount || 0;
    } else if (d.status === 'SUCCESSFUL') {
      successfulDisbursementCount++;
    } else if (d.status === 'FAILED') {
      failedDisbursementCount++;
    }
  });

  return {
    totalSanctionedAmount,
    totalDisbursedAmount,
    totalRemainingAmount,
    pendingApprovalCount,
    pendingApprovalAmount,
    readyForPayoutCount,
    readyForPayoutAmount,
    successfulDisbursementCount,
    failedDisbursementCount,
  };
}
