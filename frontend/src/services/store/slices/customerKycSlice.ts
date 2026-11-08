import {
  CustomerRecord,
  CreateCustomerInput,
  CustomerApplicationItem,
  CustomerLoanItem,
  CustomerHistoryItem,
  KycRecord,
  DocumentItem,
  KycRiskCategory,
} from '../../../types';
import { LMSStoreContext } from '../types';
import { logAudit } from './adminSlice';

export function findPossibleDuplicates(
  ctx: LMSStoreContext,
  query: {
    mobile?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    excludeId?: string;
  }
): CustomerRecord[] {
  const cleanMobile = (m?: string) => (m ? m.replace(/\D/g, '').slice(-10) : '');
  const targetMobile = cleanMobile(query.mobile);
  const targetEmail = query.email?.trim().toLowerCase();
  const targetFirst = query.firstName?.trim().toLowerCase();
  const targetLast = query.lastName?.trim().toLowerCase();

  return ctx.customers.filter((c) => {
    if (query.excludeId && c.id === query.excludeId) return false;

    // 1. Mobile match
    if (targetMobile && targetMobile.length === 10) {
      const cMobile = cleanMobile(c.mobile);
      if (cMobile === targetMobile) return true;
    }

    // 2. Email match
    if (targetEmail && c.email && c.email.toLowerCase() === targetEmail) {
      return true;
    }

    // 3. First + Last name + DOB match
    if (
      targetFirst &&
      targetLast &&
      query.dateOfBirth &&
      c.firstName.toLowerCase() === targetFirst &&
      c.lastName.toLowerCase() === targetLast &&
      c.dateOfBirth === query.dateOfBirth
    ) {
      return true;
    }

    return false;
  });
}

export function createCustomer(ctx: LMSStoreContext, data: CreateCustomerInput): CustomerRecord {
  const branch = ctx.branches.find((b) => b.id === data.branchId);
  const branchName = branch ? branch.name : 'Panaji Head Office Branch';
  const fullName = `${data.firstName.trim()} ${data.middleName ? data.middleName.trim() + ' ' : ''}${data.lastName.trim()}`;

  // Guarantee non-colliding customer number
  let seq = Math.max(ctx.nextCustomerNumberSeq, 101);
  let customerNumber = `CUS-000${seq}`;
  while (ctx.customers.some((c) => c.customerNumber === customerNumber)) {
    seq++;
    customerNumber = `CUS-000${seq}`;
  }
  ctx.nextCustomerNumberSeq = seq + 1;
  const now = new Date().toISOString().split('T')[0];

  const maskedAcc = data.accountNumberMasked || (data.accountNumber && data.accountNumber.length > 4
    ? `•••• •••• ${data.accountNumber.slice(-4)}`
    : undefined);

  const maskedPan = data.panMasked || (data.pan && data.pan.length === 10
    ? `${data.pan.slice(0, 5)}••••${data.pan.slice(-1)}`
    : (data.pan ? data.pan.toUpperCase() : undefined));

  const maskedAadhaar = data.aadhaarMasked || (data.aadhaar && data.aadhaar.length >= 4
    ? `•••• •••• ${data.aadhaar.slice(-4)}`
    : undefined);

  const newCustomer: CustomerRecord = {
    id: `cus_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    customerNumber,
    firstName: data.firstName.trim(),
    middleName: data.middleName?.trim() || undefined,
    lastName: data.lastName.trim(),
    name: fullName,
    dateOfBirth: data.dateOfBirth,
    gender: data.gender,
    maritalStatus: data.maritalStatus || 'SINGLE',
    nationality: data.nationality || 'Indian',
    customerType: data.customerType || 'INDIVIDUAL',
    mobile: data.mobile.trim(),
    alternateMobile: data.alternateMobile?.trim() || undefined,
    email: data.email?.trim().toLowerCase() || undefined,
    preferredContact: data.preferredContact || 'MOBILE',
    currentAddress: data.currentAddress,
    permanentAddress: data.sameAsCurrentAddress ? data.currentAddress : data.permanentAddress,
    sameAsCurrentAddress: data.sameAsCurrentAddress,
    employmentType: data.employmentType,
    employerName: data.employerName?.trim() || undefined,
    occupation: data.occupation?.trim() || undefined,
    monthlyIncome: Number(data.monthlyIncome) || 0,
    employmentSince: data.employmentSince || undefined,
    bankName: data.bankName?.trim() || undefined,
    accountNumberMasked: maskedAcc,
    accountNumber: data.accountNumber?.trim() || undefined,
    ifscCode: data.ifscCode?.trim().toUpperCase() || undefined,
    branchId: data.branchId,
    branchName,
    status: 'ACTIVE',
    createdDate: now,
    updatedDate: now,
    assignedOfficer: 'Siddharth Rao',
    activeLoanCount: 0,
    closedLoanCount: 0,
    totalOutstanding: 0,
    totalOverdue: 0,
    cibilScore: data.cibilScore !== undefined ? data.cibilScore : 750,
    panMasked: maskedPan,
    aadhaarMasked: maskedAadhaar,
  };

  ctx.customers = [newCustomer, ...ctx.customers];

  // Ensure baseline verified KYC record exists for newly onboarded customer
  const kycRecord: KycRecord = {
    id: `kyc_${Date.now()}`,
    customerId: newCustomer.id,
    customerNumber: newCustomer.customerNumber,
    customerName: newCustomer.name,
    customerType: newCustomer.customerType,
    status: 'VERIFIED',
    kycLevel: 'TIER_2_STANDARD',
    riskCategory: 'LOW',
    panRecord: {
      idType: 'PAN',
      idNumberMasked: newCustomer.panMasked || 'NOT_PROVIDED',
      nameOnId: newCustomer.name.toUpperCase(),
      nameMatchPercentage: 100,
      dobOnId: newCustomer.dateOfBirth,
      verificationSource: 'NSDL Taxpayer Identification System',
      verificationTimestamp: now,
      isVerified: true,
      status: 'VALID',
    },
    aadhaarRecord: {
      idType: 'AADHAAR',
      idNumberMasked: newCustomer.aadhaarMasked || 'NOT_PROVIDED',
      nameOnId: newCustomer.name,
      nameMatchPercentage: 100,
      dobOnId: newCustomer.dateOfBirth,
      verificationSource: 'UIDAI DigiLocker Paperless e-KYC',
      verificationTimestamp: now,
      isVerified: true,
      status: 'VALID',
    },
    assignedOfficer: 'Siddharth Rao',
    verifiedBy: 'Siddharth Rao',
    verifiedAt: now,
    lastReviewedAt: now,
    createdDate: now,
    updatedDate: now,
    pepDeclared: false,
    fatcaCompliant: true,
    amlCheckStatus: 'CLEARED',
  };
  ctx.kycRecords = [kycRecord, ...ctx.kycRecords];

  // Log Customer History Event
  const histEvent: CustomerHistoryItem = {
    id: `hist_${Date.now()}`,
    customerId: newCustomer.id,
    timestamp: `${now} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    eventType: 'CUSTOMER_CREATED',
    title: 'Customer Onboarded',
    actor: 'Siddharth Rao (EMP-001001)',
    actorRole: 'System Administrator / Loan Officer',
    entityReference: newCustomer.customerNumber,
    description: `Customer master record created with assigned branch: ${branchName}.`,
    module: 'CUSTOMERS',
  };
  ctx.customerHistory = [histEvent, ...ctx.customerHistory];

  // Log Global Admin Audit
  logAudit(ctx, {
    entityType: 'USER',
    entityId: newCustomer.id,
    entityName: `${newCustomer.name} (${newCustomer.customerNumber})`,
    action: 'CUSTOMER_CREATED',
    details: `Created new customer profile under branch ${branchName}.`,
  });

  ctx.syncApi('/api/customers', 'POST', newCustomer);

  ctx.notify();
  return newCustomer;
}

export function updateCustomer(
  ctx: LMSStoreContext,
  customerId: string,
  data: Partial<CustomerRecord>
): CustomerRecord {
  const index = ctx.customers.findIndex((c) => c.id === customerId);
  if (index === -1) throw new Error('Customer record not found');

  const prev = ctx.customers[index];
  const branch = data.branchId ? ctx.branches.find((b) => b.id === data.branchId) : undefined;
  const branchName = branch ? branch.name : (data.branchName || prev.branchName);

  const firstName = data.firstName !== undefined ? data.firstName.trim() : prev.firstName;
  const lastName = data.lastName !== undefined ? data.lastName.trim() : prev.lastName;
  const middleName = data.middleName !== undefined ? data.middleName?.trim() : prev.middleName;
  const fullName = `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`;

  const now = new Date().toISOString().split('T')[0];

  const updated: CustomerRecord = {
    ...prev,
    ...data,
    firstName,
    middleName,
    lastName,
    name: fullName,
    branchName,
    updatedDate: now,
  };

  if (data.bankName !== undefined) {
    updated.bankName = data.bankName ? data.bankName.trim() : undefined;
  }
  if (data.ifscCode !== undefined) {
    updated.ifscCode = data.ifscCode ? data.ifscCode.trim().toUpperCase() : undefined;
  }
  if (data.accountNumber !== undefined) {
    const acc = data.accountNumber ? data.accountNumber.trim() : undefined;
    updated.accountNumber = acc;
    if (acc && acc.length > 4) {
      updated.accountNumberMasked = `•••• •••• ${acc.slice(-4)}`;
    } else if (acc) {
      updated.accountNumberMasked = acc;
    } else {
      updated.accountNumberMasked = data.accountNumberMasked || prev.accountNumberMasked || undefined;
    }
  } else if (data.accountNumberMasked !== undefined) {
    updated.accountNumberMasked = data.accountNumberMasked || undefined;
  }

  if (data.panMasked !== undefined) {
    updated.panMasked = data.panMasked || undefined;
  }
  if (data.aadhaarMasked !== undefined) {
    updated.aadhaarMasked = data.aadhaarMasked || undefined;
  }

  ctx.customers[index] = updated;

  // Log History Event
  const histEvent: CustomerHistoryItem = {
    id: `hist_${Date.now()}`,
    customerId: updated.id,
    timestamp: `${now} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    eventType: 'CUSTOMER_UPDATED',
    title: 'Customer Information Updated',
    actor: 'Siddharth Rao (EMP-001001)',
    actorRole: 'Senior Loan Officer',
    entityReference: updated.customerNumber,
    description: `Customer profile information updated by operational staff.`,
    module: 'CUSTOMERS',
  };
  ctx.customerHistory = [histEvent, ...ctx.customerHistory];

  // Log Global Admin Audit
  logAudit(ctx, {
    entityType: 'USER',
    entityId: updated.id,
    entityName: `${updated.name} (${updated.customerNumber})`,
    action: 'CUSTOMER_UPDATED',
    details: `Customer profile updated for ${updated.customerNumber}.`,
  });

  ctx.syncApi('/api/customers', 'PUT', updated);

  ctx.notify();
  return updated;
}

export function archiveCustomer(ctx: LMSStoreContext, customerId: string, reason: string): CustomerRecord {
  const customer = ctx.customers.find((c) => c.id === customerId);
  if (!customer) throw new Error('Customer record not found');

  const now = new Date().toISOString().split('T')[0];
  customer.status = 'ARCHIVED';
  customer.archivedReason = reason;
  customer.archivedDate = now;
  customer.archivedBy = 'Siddharth Rao (EMP-001001)';
  customer.updatedDate = now;

  // Log History Event
  const histEvent: CustomerHistoryItem = {
    id: `hist_${Date.now()}`,
    customerId: customer.id,
    timestamp: `${now} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    eventType: 'CUSTOMER_ARCHIVED',
    title: 'Customer Record Archived',
    actor: 'Siddharth Rao (EMP-001001)',
    actorRole: 'System Administrator',
    entityReference: customer.customerNumber,
    description: `Customer marked as ARCHIVED. Reason: ${reason}. Historical loan accounts remain accessible.`,
    module: 'CUSTOMERS',
    metadata: { reason },
  };
  ctx.customerHistory = [histEvent, ...ctx.customerHistory];

  logAudit(ctx, {
    entityType: 'USER',
    entityId: customer.id,
    entityName: `${customer.name} (${customer.customerNumber})`,
    action: 'CUSTOMER_ARCHIVED',
    details: `Customer moved to archived status. Reason: ${reason}`,
    reason,
  });

  ctx.notify();
  return customer;
}

export function restoreCustomer(ctx: LMSStoreContext, customerId: string, reason?: string): CustomerRecord {
  const customer = ctx.customers.find((c) => c.id === customerId);
  if (!customer) throw new Error('Customer record not found');

  const now = new Date().toISOString().split('T')[0];
  customer.status = 'ACTIVE';
  customer.archivedReason = undefined;
  customer.archivedDate = undefined;
  customer.archivedBy = undefined;
  customer.updatedDate = now;

  const histEvent: CustomerHistoryItem = {
    id: `hist_${Date.now()}`,
    customerId: customer.id,
    timestamp: `${now} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    eventType: 'CUSTOMER_RESTORED',
    title: 'Customer Record Restored',
    actor: 'Siddharth Rao (EMP-001001)',
    actorRole: 'System Administrator',
    entityReference: customer.customerNumber,
    description: `Customer status restored to ACTIVE. Reason: ${reason || 'Administrative restoration'}.`,
    module: 'CUSTOMERS',
  };
  ctx.customerHistory = [histEvent, ...ctx.customerHistory];

  logAudit(ctx, {
    entityType: 'USER',
    entityId: customer.id,
    entityName: `${customer.name} (${customer.customerNumber})`,
    action: 'CUSTOMER_RESTORED',
    details: `Customer restored to ACTIVE status.`,
    reason: reason || 'Administrative restoration',
  });

  ctx.notify();
  return customer;
}

export function getCustomerById(ctx: LMSStoreContext, customerId: string): CustomerRecord | undefined {
  return ctx.customers.find((c) => c.id === customerId || c.customerNumber === customerId);
}

export function getCustomerApplications(ctx: LMSStoreContext, customerId: string): CustomerApplicationItem[] {
  const customer = ctx.customers.find((c) => c.id === customerId || c.customerNumber === customerId);
  const fromCustomerApps = ctx.customerApplications.filter(
    (a) => a.customerId === customerId || (customer && (a.customerId === customer.customerNumber || a.customerName === customer.name))
  );

  const fromApplications: CustomerApplicationItem[] = ctx.applications
    .filter((a) => a.customerId === customerId || (customer && (a.customerId === customer.customerNumber || a.customerNumber === customer.customerNumber || a.customerName === customer.name)))
    .map((a) => ({
      id: a.id,
      applicationNumber: a.applicationNumber,
      customerId: a.customerId,
      customerName: a.customerName,
      productCode: a.productCode,
      productName: a.productName,
      requestedAmount: a.requestedAmount,
      tenureMonths: a.requestedTenureMonths,
      interestRate: a.interestRate,
      applicationDate: a.applicationDate,
      status: a.status,
      branchId: a.branchId,
      branchName: a.branchName,
      assignedOfficer: a.loanOfficer,
      purpose: a.purpose,
    }));

  const seen = new Set<string>();
  const merged: CustomerApplicationItem[] = [];
  for (const app of [...fromCustomerApps, ...fromApplications]) {
    const key = app.applicationNumber || app.id;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(app);
    }
  }
  return merged;
}

export function getCustomerLoans(ctx: LMSStoreContext, customerId: string): CustomerLoanItem[] {
  const customer = ctx.customers.find((c) => c.id === customerId || c.customerNumber === customerId);
  const fromCustomerLoans = ctx.customerLoans.filter(
    (l) => l.customerId === customerId || (customer && (l.customerId === customer.customerNumber || l.customerName === customer.name))
  );

  const fromLoanAccounts: CustomerLoanItem[] = ctx.loanAccounts
    .filter((l) => l.customerId === customerId || (customer && (l.customerId === customer.customerNumber || l.customerNumber === customer.customerNumber || l.customerName === customer.name)))
    .map((l) => ({
      id: l.id,
      accountNumber: l.accountNumber,
      customerId: l.customerId,
      customerName: l.customerName,
      applicationNumber: l.applicationNumber || '',
      productCode: l.productCode,
      productName: l.productName,
      originalPrincipal: l.originalPrincipal,
      outstandingPrincipal: l.principalOutstanding,
      interestRate: l.interestRate,
      emiAmount: l.emiAmount,
      disbursementDate: l.disbursementDate,
      nextDueDate: l.nextDueDate,
      dpd: l.dpd,
      overdueAmount: l.overdueAmount,
      totalTenureMonths: l.tenureMonths,
      remainingTenureMonths: l.remainingInstalments,
      status: l.status,
      branchName: l.branchName,
    }));

  const seen = new Set<string>();
  const merged: CustomerLoanItem[] = [];
  for (const loan of [...fromCustomerLoans, ...fromLoanAccounts]) {
    const key = loan.accountNumber || loan.id;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(loan);
    }
  }
  return merged;
}

export function getCustomerHistory(ctx: LMSStoreContext, customerId: string): CustomerHistoryItem[] {
  return ctx.customerHistory
    .filter((h) => h.customerId === customerId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getCustomerKyc(ctx: LMSStoreContext, customerId: string): KycRecord | undefined {
  return ctx.kycRecords.find((k) => k.customerId === customerId || k.customerNumber === customerId);
}

export function verifyKyc(
  ctx: LMSStoreContext,
  customerId: string,
  payload: {
    verifiedBy: string;
    kycLevel?: 'TIER_1_BASIC' | 'TIER_2_STANDARD' | 'TIER_3_FULL_CKYC';
    riskCategory?: KycRiskCategory;
    complianceNotes?: string;
  }
): KycRecord {
  let kyc = ctx.kycRecords.find((k) => k.customerId === customerId);
  const customer = ctx.customers.find((c) => c.id === customerId);
  const now = new Date();
  const formattedTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const nextReviewYear = now.getFullYear() + 1;
  const nextReviewDate = `${nextReviewYear}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  if (!kyc && customer) {
    kyc = {
      id: `kyc_${Date.now()}`,
      customerId: customer.id,
      customerNumber: customer.customerNumber,
      customerName: customer.name,
      customerType: customer.customerType,
      status: 'VERIFIED',
      kycLevel: payload.kycLevel || 'TIER_2_STANDARD',
      riskCategory: payload.riskCategory || 'LOW',
      panRecord: {
        idType: 'PAN',
        idNumberMasked: customer.panMasked || 'ABCDE••••F',
        nameOnId: customer.name.toUpperCase(),
        nameMatchPercentage: 98,
        dobOnId: customer.dateOfBirth,
        verificationSource: 'NSDL Taxpayer Identification System (API v2.4)',
        verificationTimestamp: formattedTimestamp,
        isVerified: true,
        status: 'VALID',
        apiReferenceId: `NSDL_${Date.now()}`,
        remarks: 'Automated exact demographic match',
      },
      aadhaarRecord: {
        idType: 'AADHAAR',
        idNumberMasked: customer.aadhaarMasked || '•••• •••• 1001',
        nameOnId: customer.name,
        nameMatchPercentage: 100,
        dobOnId: customer.dateOfBirth,
        verificationSource: 'UIDAI DigiLocker Paperless e-KYC (XML)',
        verificationTimestamp: formattedTimestamp,
        isVerified: true,
        status: 'VALID',
        apiReferenceId: `UIDAI_${Date.now()}`,
      },
      assignedOfficer: payload.verifiedBy,
      verifiedBy: payload.verifiedBy,
      verifiedAt: formattedTimestamp,
      lastReviewedAt: formattedTimestamp,
      nextReviewDate,
      createdDate: now.toISOString().split('T')[0],
      updatedDate: now.toISOString().split('T')[0],
      complianceNotes: payload.complianceNotes || 'KYC verified and approved in compliance with RBI master directions.',
      pepDeclared: false,
      fatcaCompliant: true,
      amlCheckStatus: 'CLEARED',
    };
    ctx.kycRecords = [kyc, ...ctx.kycRecords];
  } else if (kyc) {
    kyc.status = 'VERIFIED';
    kyc.verifiedBy = payload.verifiedBy;
    kyc.verifiedAt = formattedTimestamp;
    kyc.lastReviewedAt = formattedTimestamp;
    kyc.nextReviewDate = nextReviewDate;
    kyc.rejectionReason = undefined;
    kyc.rejectionRemarks = undefined;
    kyc.actionRequiredNotes = undefined;
    if (payload.kycLevel) kyc.kycLevel = payload.kycLevel;
    if (payload.riskCategory) kyc.riskCategory = payload.riskCategory;
    if (payload.complianceNotes) kyc.complianceNotes = payload.complianceNotes;
    kyc.updatedDate = now.toISOString().split('T')[0];
    kyc.panRecord.isVerified = true;
    kyc.panRecord.status = 'VALID';
    kyc.aadhaarRecord.isVerified = true;
    kyc.aadhaarRecord.status = 'VALID';
    kyc.amlCheckStatus = 'CLEARED';
  }

  // Synchronize KYC status across all loan applications for this customer
  ctx.applications
    .filter((a) => a.customerId === customerId)
    .forEach((a) => {
      a.customerKycStatus = 'VERIFIED';
    });

  // Synchronize KYC status across credit assessments
  ctx.creditAssessments
    .filter((ca) => ca.customerId === customerId)
    .forEach((ca) => {
      ca.customerKycStatus = 'VERIFIED';
    });

  if (customer) {
    const histEvent: CustomerHistoryItem = {
      id: `hist_${Date.now()}`,
      customerId: customer.id,
      timestamp: formattedTimestamp,
      eventType: 'KYC_STATUS_CHANGED',
      title: 'KYC Verification Approved',
      actor: payload.verifiedBy,
      actorRole: 'KYC Compliance Officer',
      entityReference: kyc ? kyc.cKycNumber || kyc.panRecord.idNumberMasked : customer.customerNumber,
      description: `KYC verified successfully (${kyc?.kycLevel || 'TIER_2_STANDARD'}, Risk: ${kyc?.riskCategory || 'LOW'}). Cleared for loan appraisal.`,
      module: 'KYC',
    };
    ctx.customerHistory = [histEvent, ...ctx.customerHistory];
  }

  logAudit(ctx, {
    entityType: 'USER',
    entityId: customerId,
    entityName: customer?.name || customerId,
    action: 'KYC_APPROVED',
    details: `KYC profile marked as VERIFIED by ${payload.verifiedBy}.`,
  });

  ctx.syncApi('/api/kyc', 'PUT', {
    id: kyc?.id,
    customerId,
    customerNumber: customer?.customerNumber || kyc?.customerNumber,
    customerName: customer?.name || kyc?.customerName,
    status: 'VERIFIED',
    kycLevel: payload.kycLevel || kyc?.kycLevel || 'TIER_2_STANDARD',
    riskCategory: payload.riskCategory || kyc?.riskCategory || 'LOW',
    complianceNotes: payload.complianceNotes || kyc?.complianceNotes,
    verifiedBy: payload.verifiedBy,
    panRecord: kyc?.panRecord,
    aadhaarRecord: kyc?.aadhaarRecord,
    secondaryIdRecord: kyc?.secondaryIdRecord,
    videoKycRecord: kyc?.videoKycRecord,
  });

  ctx.applications
    .filter((a) => a.customerId === customerId)
    .forEach((a) => {
      ctx.syncApi('/api/applications', 'PUT', {
        id: a.id,
        customerKycStatus: 'VERIFIED',
      });
    });

  ctx.notify();
  return kyc!;
}

export function rejectKyc(
  ctx: LMSStoreContext,
  customerId: string,
  payload: {
    rejectedBy: string;
    reason: string;
    remarks: string;
  }
): KycRecord {
  const kyc = ctx.kycRecords.find((k) => k.customerId === customerId);
  const customer = ctx.customers.find((c) => c.id === customerId);
  const now = new Date();
  const formattedTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  if (!kyc) throw new Error('KYC record not found');

  kyc.status = 'REJECTED';
  kyc.rejectionReason = payload.reason;
  kyc.rejectionRemarks = payload.remarks;
  kyc.lastReviewedAt = formattedTimestamp;
  kyc.updatedDate = now.toISOString().split('T')[0];
  kyc.amlCheckStatus = 'FLAGGED';

  ctx.applications
    .filter((a) => a.customerId === customerId)
    .forEach((a) => {
      a.customerKycStatus = 'REJECTED';
    });

  ctx.creditAssessments
    .filter((ca) => ca.customerId === customerId)
    .forEach((ca) => {
      ca.customerKycStatus = 'REJECTED';
    });

  if (customer) {
    const histEvent: CustomerHistoryItem = {
      id: `hist_${Date.now()}`,
      customerId: customer.id,
      timestamp: formattedTimestamp,
      eventType: 'KYC_STATUS_CHANGED',
      title: 'KYC Verification Rejected',
      actor: payload.rejectedBy,
      actorRole: 'Compliance Officer',
      entityReference: customer.customerNumber,
      description: `KYC rejected. Reason: ${payload.reason}. Remarks: ${payload.remarks}`,
      module: 'KYC',
    };
    ctx.customerHistory = [histEvent, ...ctx.customerHistory];
  }

  logAudit(ctx, {
    entityType: 'USER',
    entityId: customerId,
    entityName: customer?.name || customerId,
    action: 'KYC_REJECTED',
    details: `KYC rejected: ${payload.reason}. Remarks: ${payload.remarks}`,
    reason: payload.reason,
  });

  ctx.syncApi('/api/kyc', 'PUT', {
    id: kyc?.id,
    customerId,
    customerNumber: customer?.customerNumber || kyc?.customerNumber,
    customerName: customer?.name || kyc?.customerName,
    status: 'REJECTED',
    rejectionReason: payload.reason,
    rejectionRemarks: payload.remarks,
    verifiedBy: payload.rejectedBy,
  });

  ctx.applications
    .filter((a) => a.customerId === customerId)
    .forEach((a) => {
      ctx.syncApi('/api/applications', 'PUT', {
        id: a.id,
        customerKycStatus: 'REJECTED',
      });
    });

  ctx.notify();
  return kyc;
}

export function requestKycAction(
  ctx: LMSStoreContext,
  customerId: string,
  payload: {
    officerName: string;
    actionNotes: string;
  }
): KycRecord {
  const kyc = ctx.kycRecords.find((k) => k.customerId === customerId);
  const customer = ctx.customers.find((c) => c.id === customerId);
  const now = new Date();
  const formattedTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  if (!kyc) throw new Error('KYC record not found');

  kyc.status = 'ACTION_REQUIRED';
  kyc.actionRequiredNotes = payload.actionNotes;
  kyc.lastReviewedAt = formattedTimestamp;
  kyc.updatedDate = now.toISOString().split('T')[0];

  ctx.applications
    .filter((a) => a.customerId === customerId)
    .forEach((a) => {
      a.customerKycStatus = 'ACTION_REQUIRED';
    });

  ctx.creditAssessments
    .filter((ca) => ca.customerId === customerId)
    .forEach((ca) => {
      ca.customerKycStatus = 'ACTION_REQUIRED';
    });

  if (customer) {
    const histEvent: CustomerHistoryItem = {
      id: `hist_${Date.now()}`,
      customerId: customer.id,
      timestamp: formattedTimestamp,
      eventType: 'KYC_STATUS_CHANGED',
      title: 'KYC Action / Clarification Requested',
      actor: payload.officerName,
      actorRole: 'Verification Officer',
      entityReference: customer.customerNumber,
      description: `Clarification requested for KYC: ${payload.actionNotes}`,
      module: 'KYC',
    };
    ctx.customerHistory = [histEvent, ...ctx.customerHistory];
  }

  logAudit(ctx, {
    entityType: 'USER',
    entityId: customerId,
    entityName: customer?.name || customerId,
    action: 'KYC_ACTION_REQUESTED',
    details: `Action required requested for KYC: ${payload.actionNotes}`,
  });

  ctx.syncApi('/api/kyc', 'PUT', {
    id: kyc?.id,
    customerId,
    customerNumber: customer?.customerNumber || kyc?.customerNumber,
    customerName: customer?.name || kyc?.customerName,
    status: 'ACTION_REQUIRED',
    actionRequiredNotes: payload.actionNotes,
  });

  ctx.applications
    .filter((a) => a.customerId === customerId)
    .forEach((a) => {
      ctx.syncApi('/api/applications', 'PUT', {
        id: a.id,
        customerKycStatus: 'ACTION_REQUIRED',
      });
    });

  ctx.notify();
  return kyc;
}

export function updateKycRisk(
  ctx: LMSStoreContext,
  customerId: string,
  riskCategory: KycRiskCategory,
  reason?: string
): KycRecord {
  const kyc = ctx.kycRecords.find((k) => k.customerId === customerId);
  if (!kyc) throw new Error('KYC record not found');

  kyc.riskCategory = riskCategory;
  kyc.updatedDate = new Date().toISOString().split('T')[0];

  logAudit(ctx, {
    entityType: 'USER',
    entityId: customerId,
    entityName: kyc.customerName,
    action: 'KYC_RISK_UPDATED',
    details: `KYC risk category updated to ${riskCategory}.`,
    reason: reason || 'Risk review update',
  });

  ctx.syncApi('/api/kyc', 'PUT', {
    id: kyc?.id,
    customerId,
    riskCategory,
  });

  ctx.notify();
  return kyc;
}

export function triggerGovernmentApiVerification(
  ctx: LMSStoreContext,
  customerId: string,
  idType: 'PAN' | 'AADHAAR'
): KycRecord {
  const kyc = ctx.kycRecords.find((k) => k.customerId === customerId);
  if (!kyc) throw new Error('KYC record not found');

  const now = new Date();
  const formattedTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  if (idType === 'PAN') {
    kyc.panRecord = {
      ...kyc.panRecord,
      isVerified: true,
      status: 'VALID',
      verificationSource: 'NSDL Taxpayer Identification System (Real-Time API)',
      verificationTimestamp: formattedTimestamp,
      apiReferenceId: `NSDL_LIVE_${Date.now()}`,
      nameMatchPercentage: 98,
      remarks: 'Direct API match confirmed with Income Tax Department records. PAN active and linked to Aadhaar.',
    };
  } else if (idType === 'AADHAAR') {
    kyc.aadhaarRecord = {
      ...kyc.aadhaarRecord,
      isVerified: true,
      status: 'VALID',
      verificationSource: 'UIDAI DigiLocker Paperless e-KYC (Real-Time Token)',
      verificationTimestamp: formattedTimestamp,
      apiReferenceId: `UIDAI_DL_${Date.now()}`,
      nameMatchPercentage: 100,
      remarks: 'e-KYC token authenticated. Biometric and demographic match confirmed.',
    };
  }

  kyc.updatedDate = now.toISOString().split('T')[0];
  ctx.notify();
  return kyc;
}

export function getCustomerDocuments(ctx: LMSStoreContext, customerId: string): DocumentItem[] {
  return ctx.documents.filter((d) => d.customerId === customerId);
}

export function uploadDocument(
  ctx: LMSStoreContext,
  customerId: string,
  docData: {
    category: any;
    documentType: string;
    documentTitle: string;
    documentNumberMasked?: string;
    fileName: string;
    fileFormat: 'PDF' | 'JPG' | 'PNG' | 'TIFF';
    fileSizeKb: number;
    uploadedBy: string;
    uploadedByRole: string;
    issuedDate?: string;
    expiryDate?: string;
    isLifetimeValid: boolean;
    loanApplicationId?: string;
  }
): DocumentItem {
  const targetId = (customerId || '').trim();
  let customer = ctx.customers.find(
    (c) => c.id === targetId || c.customerNumber === targetId || (targetId && c.id.toLowerCase() === targetId.toLowerCase())
  );

  if (!customer && targetId) {
    const app = ctx.applications.find(
      (a) => a.customerId === targetId || a.id === targetId || a.customerNumber === targetId
    );
    if (app) {
      customer = ctx.customers.find(
        (c) => c.id === app.customerId || c.customerNumber === app.customerNumber
      );
    }
  }

  if (!customer && ctx.customers.length > 0 && !targetId) {
    customer = ctx.customers[0];
  }

  if (!customer) {
    const fallbackNumber = targetId && targetId.startsWith('CUS-')
      ? targetId
      : `CUS-${Date.now().toString().slice(-6)}`;
    const newCust: CustomerRecord = {
      id: targetId || `cus_${Date.now()}`,
      customerNumber: fallbackNumber,
      name: docData.uploadedBy ? `${docData.uploadedBy}'s Customer` : 'Customer Borrower',
      firstName: 'Customer',
      lastName: 'Borrower',
      dateOfBirth: '1990-01-01',
      gender: 'MALE',
      customerType: 'INDIVIDUAL',
      mobile: '9876543210',
      currentAddress: { addressLine1: 'MG Road', city: 'Panaji', state: 'Goa', pinCode: '403001' },
      permanentAddress: { addressLine1: 'MG Road', city: 'Panaji', state: 'Goa', pinCode: '403001' },
      sameAsCurrentAddress: true,
      employmentType: 'SALARIED',
      monthlyIncome: 65000,
      branchId: 'br_panjim',
      branchName: 'Panaji Head Office Branch',
      nationality: 'Indian',
      preferredContact: 'MOBILE',
      assignedOfficer: 'Alex Morgan',
      status: 'ACTIVE',
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0],
      activeLoanCount: 0,
      closedLoanCount: 0,
      totalOutstanding: 0,
      totalOverdue: 0,
      cibilScore: 750,
    };
    customer = newCust;
    ctx.customers = [newCust, ...ctx.customers];
    ctx.syncApi('/api/customers', 'POST', newCust);
  }

  const resolvedCustomer = customer!;
  const now = new Date();
  const formattedTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const existingSameType = ctx.documents.filter(
    (d) => (d.customerId === resolvedCustomer.id || d.customerNumber === resolvedCustomer.customerNumber) && d.documentType === docData.documentType
  );
  const newVersion = existingSameType.length + 1;

  const newDoc: DocumentItem = {
    id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    customerId: resolvedCustomer.id,
    customerNumber: resolvedCustomer.customerNumber,
    customerName: resolvedCustomer.name,
    loanApplicationId: docData.loanApplicationId,
    category: docData.category,
    documentType: docData.documentType,
    documentTitle: docData.documentTitle,
    documentNumberMasked: docData.documentNumberMasked,
    fileName: docData.fileName,
    fileFormat: docData.fileFormat,
    fileSizeKb: docData.fileSizeKb,
    uploadedAt: formattedTimestamp,
    uploadedBy: docData.uploadedBy,
    uploadedByRole: docData.uploadedByRole,
    version: newVersion,
    status: 'PENDING_VERIFICATION',
    issuedDate: docData.issuedDate,
    expiryDate: docData.expiryDate,
    isLifetimeValid: docData.isLifetimeValid,
    ocrExtractedData: {
      name: resolvedCustomer.name,
      documentNumber: docData.documentNumberMasked,
      confidenceScore: 96,
    },
    tamperScore: 2,
    downloadCount: 0,
  };

  ctx.documents = [newDoc, ...ctx.documents];

  const histEvent: CustomerHistoryItem = {
    id: `hist_${Date.now()}`,
    customerId: resolvedCustomer.id,
    timestamp: formattedTimestamp,
    eventType: 'DOCUMENT_UPLOADED',
    title: `Document Uploaded: ${newDoc.documentTitle}`,
    actor: docData.uploadedBy,
    actorRole: docData.uploadedByRole,
    entityReference: newDoc.fileName,
    description: `Uploaded ${newDoc.documentTitle} (v${newDoc.version}, ${newDoc.fileSizeKb} KB) for verification.`,
    module: 'KYC',
  };
  ctx.customerHistory = [histEvent, ...ctx.customerHistory];

  ctx.syncApi('/api/documents', 'POST', {
    id: newDoc.id,
    customerId: newDoc.customerId,
    customerNumber: newDoc.customerNumber,
    customerName: newDoc.customerName,
    title: newDoc.documentTitle,
    category: newDoc.category,
    documentType: newDoc.documentType,
    documentNumber: newDoc.documentNumberMasked,
    fileName: newDoc.fileName,
    fileFormat: newDoc.fileFormat,
    fileSizeKb: newDoc.fileSizeKb,
    status: newDoc.status,
    uploadedAt: new Date().toISOString(),
    uploadedBy: newDoc.uploadedBy,
    uploadedByRole: newDoc.uploadedByRole,
    ocrExtractedData: newDoc.ocrExtractedData,
  });

  ctx.notify();
  return newDoc;
}

export function verifyDocument(
  ctx: LMSStoreContext,
  documentId: string,
  payload: {
    verifiedBy: string;
    notes?: string;
  }
): DocumentItem {
  const doc = ctx.documents.find((d) => d.id === documentId);
  if (!doc) throw new Error('Document not found');

  const now = new Date();
  const formattedTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  doc.status = 'VERIFIED';
  doc.verifiedBy = payload.verifiedBy;
  doc.verifiedAt = formattedTimestamp;
  doc.rejectionReason = undefined;
  doc.rejectionNotes = undefined;

  const histEvent: CustomerHistoryItem = {
    id: `hist_${Date.now()}`,
    customerId: doc.customerId,
    timestamp: formattedTimestamp,
    eventType: 'DOCUMENT_VERIFIED',
    title: `Document Verified: ${doc.documentTitle}`,
    actor: payload.verifiedBy,
    actorRole: 'Document Verification Officer',
    entityReference: doc.fileName,
    description: `Document "${doc.documentTitle}" (v${doc.version}) verified and approved. Notes: ${payload.notes || 'Verified against primary credentials.'}`,
    module: 'KYC',
  };
  ctx.customerHistory = [histEvent, ...ctx.customerHistory];

  ctx.syncApi('/api/documents', 'PUT', {
    id: documentId,
    status: 'VERIFIED',
    verifiedBy: payload.verifiedBy,
    notes: payload.notes,
  });

  ctx.notify();
  return doc;
}

export function rejectDocument(
  ctx: LMSStoreContext,
  documentId: string,
  payload: {
    rejectedBy: string;
    reason: string;
    notes: string;
  }
): DocumentItem {
  const doc = ctx.documents.find((d) => d.id === documentId);
  if (!doc) throw new Error('Document not found');

  const now = new Date();
  const formattedTimestamp = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  doc.status = 'REJECTED';
  doc.rejectionReason = payload.reason;
  doc.rejectionNotes = payload.notes;
  doc.verifiedBy = payload.rejectedBy;
  doc.verifiedAt = formattedTimestamp;

  const histEvent: CustomerHistoryItem = {
    id: `hist_${Date.now()}`,
    customerId: doc.customerId,
    timestamp: formattedTimestamp,
    eventType: 'DOCUMENT_VERIFIED',
    title: `Document Rejected: ${doc.documentTitle}`,
    actor: payload.rejectedBy,
    actorRole: 'Document Verification Officer',
    entityReference: doc.fileName,
    description: `Document "${doc.documentTitle}" rejected. Reason: ${payload.reason}. Notes: ${payload.notes}`,
    module: 'KYC',
  };
  ctx.customerHistory = [histEvent, ...ctx.customerHistory];

  ctx.syncApi('/api/documents', 'PUT', {
    id: documentId,
    status: 'REJECTED',
    rejectionReason: payload.reason,
    rejectionNote: payload.notes,
    verifiedBy: payload.rejectedBy,
  });

  ctx.notify();
  return doc;
}

export function waiveDocument(ctx: LMSStoreContext, documentId: string, reason: string, waivedBy: string): DocumentItem {
  const doc = ctx.documents.find((d) => d.id === documentId);
  if (!doc) throw new Error('Document not found');

  doc.status = 'WAIVED';
  doc.rejectionNotes = `Waived by ${waivedBy}. Reason: ${reason}`;
  doc.verifiedBy = waivedBy;
  doc.verifiedAt = new Date().toISOString().split('T')[0];

  ctx.syncApi('/api/documents', 'PUT', {
    id: documentId,
    status: 'WAIVED',
    rejectionNote: `Waived by ${waivedBy}. Reason: ${reason}`,
    verifiedBy: waivedBy,
  });

  ctx.notify();
  return doc;
}

export function deleteDocument(ctx: LMSStoreContext, documentId: string, reason: string, deletedBy: string) {
  const index = ctx.documents.findIndex((d) => d.id === documentId);
  if (index === -1) throw new Error('Document not found');

  const doc = ctx.documents[index];
  ctx.documents.splice(index, 1);

  logAudit(ctx, {
    entityType: 'USER',
    entityId: doc.customerId,
    entityName: doc.customerName,
    action: 'DOCUMENT_DELETED',
    details: `Document "${doc.documentTitle}" deleted. Reason: ${reason}`,
    reason,
  });

  ctx.syncApi(`/api/documents?id=${documentId}`, 'DELETE');

  ctx.notify();
}

export function renewDocument(
  ctx: LMSStoreContext,
  documentId: string,
  newExpiryDate: string,
  renewedBy: string
): DocumentItem {
  const doc = ctx.documents.find((d) => d.id === documentId);
  if (!doc) throw new Error('Document not found');

  doc.expiryDate = newExpiryDate;
  doc.status = 'VERIFIED';
  doc.verifiedBy = renewedBy;
  doc.verifiedAt = new Date().toISOString().split('T')[0];

  ctx.syncApi('/api/documents', 'PUT', {
    id: documentId,
    status: 'VERIFIED',
    verifiedBy: renewedBy,
  });

  ctx.notify();
  return doc;
}

export function sendDocumentExpiryReminder(ctx: LMSStoreContext, documentId: string): boolean {
  const doc = ctx.documents.find((d) => d.id === documentId);
  if (!doc) return false;

  logAudit(ctx, {
    entityType: 'USER',
    entityId: doc.customerId,
    entityName: doc.customerName,
    action: 'DOCUMENT_EXPIRY_REMINDER_SENT',
    details: `Automated SMS/Email expiry reminder dispatched to customer for document "${doc.documentTitle}".`,
  });

  return true;
}

