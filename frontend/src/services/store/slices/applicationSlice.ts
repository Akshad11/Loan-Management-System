import {
  LoanApplicationRecord,
  ApplicationHistoryItem,
  CoApplicantRecord,
  GuarantorRecord,
  ApplicationDocumentRecord,
  SubmissionDeclarationState,
  ApplicationValidationResult,
  ApplicationWorkflowStatus,
  CustomerApplicationItem,
  LoanRepaymentFrequency,
  CreditAssessmentRecord,
} from '../../../types';
import { LMSStoreContext } from '../types';
import { logAudit } from './adminSlice';

export function calculateEMI(principal: number, annualRatePct: number, tenureMonths: number): number {
  if (tenureMonths <= 0 || principal <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r === 0) return Math.round(principal / tenureMonths);
  const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
  return Math.round(emi);
}

export function logApplicationHistory(
  ctx: LMSStoreContext,
  applicationId: string,
  entry: Omit<ApplicationHistoryItem, 'id' | 'applicationId' | 'timestamp'>
) {
  const now = new Date();
  const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const newHistory: ApplicationHistoryItem = {
    id: `apphist_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    applicationId,
    timestamp: formatted,
    ...entry,
  };

  if (!ctx.applicationHistory[applicationId]) {
    ctx.applicationHistory[applicationId] = [];
  }
  ctx.applicationHistory[applicationId] = [newHistory, ...ctx.applicationHistory[applicationId]];
}

export function getApplicationById(ctx: LMSStoreContext, id: string): LoanApplicationRecord | undefined {
  return ctx.applications.find((a) => a.id === id || a.applicationNumber === id);
}

export function createApplication(
  ctx: LMSStoreContext,
  payload: {
    customerId: string;
    productCode: string;
    requestedAmount: number;
    requestedTenureMonths: number;
    repaymentFrequency: string;
    preferredRepaymentDate?: number;
    purpose: string;
    purposeCategory: any;
    branchId: string;
    loanOfficer: string;
    notes?: string;
    createdBy?: string;
  }
): LoanApplicationRecord {
  const customer = ctx.customers.find((c) => c.id === payload.customerId || c.customerNumber === payload.customerId);
  if (!customer) throw new Error('Customer not found');

  const product = ctx.loanProductsConfig.find((p) => p.code === payload.productCode);
  if (!product) throw new Error('Loan product not found');

  const branch = ctx.branches.find((b) => b.id === payload.branchId) || { name: customer.branchName };
  const appSeq = ctx.nextAppNumberSeq++;
  const appNumber = `APP-2026-${String(appSeq).padStart(6, '0')}`;
  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const appId = `app_${Date.now()}`;
  const creator = payload.createdBy || 'Anita Deshmukh';

  // Prepare documents from product requirements template
  const customerDocs = ctx.documents.filter((d) => d.customerId === customer.id);
  const initialDocs: ApplicationDocumentRecord[] = product.requiredDocumentTypes.map((req, idx) => {
    let source: 'CUSTOMER_KYC' | 'APPLICATION_UPLOAD' = 'APPLICATION_UPLOAD';
    let docVaultId: string | undefined = undefined;
    let fileName: string | undefined = undefined;
    let status: any = 'MISSING';
    let verifiedAt: string | undefined = undefined;
    let verifiedBy: string | undefined = undefined;

    if (req.canUseCustomerKyc) {
      const matched = customerDocs.find((cd) => {
        if (req.type === 'IDENTITY_PROOF' && (cd.category === 'IDENTITY_PROOF' || cd.documentType === 'PAN' || cd.documentType === 'AADHAAR')) {
          return cd.status === 'VERIFIED';
        }
        if (req.type === 'ADDRESS_PROOF' && cd.category === 'ADDRESS_PROOF') {
          return cd.status === 'VERIFIED';
        }
        return false;
      });

      if (matched) {
        source = 'CUSTOMER_KYC';
        docVaultId = matched.id;
        fileName = matched.fileName;
        status = 'VERIFIED';
        verifiedAt = matched.verifiedAt || today;
        verifiedBy = matched.verifiedBy || creator;
      }
    }

    return {
      id: `appdoc_${Date.now()}_${idx}`,
      applicationId: appId,
      documentType: req.type,
      documentTitle: req.title,
      source,
      documentVaultId: docVaultId,
      fileName,
      fileFormat: 'PDF',
      fileSizeKb: 450,
      status,
      isMandatory: req.isMandatory,
      uploadedAt: status === 'VERIFIED' ? today : undefined,
      uploadedBy: status === 'VERIFIED' ? creator : undefined,
      verifiedAt,
      verifiedBy,
    };
  });

  const newApp: LoanApplicationRecord = {
    id: appId,
    applicationNumber: appNumber,
    customerId: customer.id,
    customerNumber: customer.customerNumber,
    customerName: customer.name,
    customerMobile: customer.mobile,
    customerKycStatus: ctx.kycRecords.find((k) => k.customerId === customer.id)?.status || 'PENDING_REVIEW',
    customerMonthlyIncome: customer.monthlyIncome,
    customerEmploymentType: customer.employmentType,
    customerExistingLoansCount: customer.activeLoanCount,
    customerTotalExposure: customer.totalOutstanding,
    productCode: product.code,
    productName: product.name,
    requestedAmount: payload.requestedAmount,
    requestedTenureMonths: payload.requestedTenureMonths,
    interestRate: product.baseInterestRate,
    repaymentFrequency: payload.repaymentFrequency as LoanRepaymentFrequency,
    preferredRepaymentDate: payload.preferredRepaymentDate || 5,
    purpose: payload.purpose,
    purposeCategory: payload.purposeCategory || 'PERSONAL',
    branchId: payload.branchId,
    branchName: branch.name,
    loanOfficer: payload.loanOfficer,
    assignedOfficerId: 'usr_001',
    applicationDate: today,
    status: 'DRAFT',
    priority: 'MEDIUM',
    coApplicants: [],
    guarantors: [],
    documents: initialDocs,
    notes: payload.notes || '',
    createdDate: today,
    createdBy: creator,
    updatedDate: today,
    lastSavedAt: `${today} ${nowTime}`,
  };

  ctx.applications = [newApp, ...ctx.applications];

  logApplicationHistory(ctx, appId, {
    eventType: 'APPLICATION_CREATED',
    actor: creator,
    actorRole: 'Loan Officer',
    description: `Draft Application ${appNumber} created for customer ${customer.name} (${customer.customerNumber}).`,
    details: `Product: ${product.name} | Requested Amount: ₹${payload.requestedAmount.toLocaleString('en-IN')} | Tenure: ${payload.requestedTenureMonths} mos.`,
  });

  const custAppSummary: CustomerApplicationItem = {
    id: appId,
    applicationNumber: appNumber,
    customerId: customer.id,
    customerName: customer.name,
    productCode: product.code,
    productName: product.name,
    requestedAmount: payload.requestedAmount,
    tenureMonths: payload.requestedTenureMonths,
    interestRate: product.baseInterestRate,
    applicationDate: today,
    status: 'DRAFT',
    branchId: payload.branchId,
    branchName: branch.name,
    assignedOfficer: payload.loanOfficer,
    purpose: payload.purpose,
  };
  ctx.customerApplications = [custAppSummary, ...ctx.customerApplications];

  ctx.syncApi('/api/applications', 'POST', newApp);

  ctx.notify();
  return newApp;
}

export function updateApplication(
  ctx: LMSStoreContext,
  appId: string,
  updates: Partial<Omit<LoanApplicationRecord, 'id' | 'applicationNumber' | 'customerId' | 'customerNumber' | 'customerName'>>
): LoanApplicationRecord {
  const appIndex = ctx.applications.findIndex((a) => a.id === appId);
  if (appIndex === -1) throw new Error('Application not found');

  const app = ctx.applications[appIndex];
  if (app.status !== 'DRAFT') {
    throw new Error('Only Draft applications can be directly modified.');
  }

  const updatedApp = {
    ...app,
    ...updates,
    updatedDate: new Date().toISOString().split('T')[0],
    lastSavedAt: `${new Date().toISOString().split('T')[0]} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
  };

  ctx.applications[appIndex] = updatedApp;

  logApplicationHistory(ctx, appId, {
    eventType: 'APPLICATION_UPDATED',
    actor: 'Anita Deshmukh',
    actorRole: 'Loan Officer',
    description: 'Application terms and details saved.',
  });

  ctx.syncApi('/api/applications', 'PUT', { id: appId, ...updates });

  ctx.notify();
  return updatedApp;
}

export function addCoApplicant(
  ctx: LMSStoreContext,
  appId: string,
  payload: {
    customerId: string;
    relationship: any;
    notes?: string;
    addedBy?: string;
  }
): CoApplicantRecord {
  const app = ctx.applications.find((a) => a.id === appId);
  if (!app) throw new Error('Application not found');

  if (app.customerId === payload.customerId) {
    throw new Error('The primary applicant cannot be linked as a co-applicant.');
  }

  if (app.coApplicants.some((c) => c.customerId === payload.customerId)) {
    throw new Error('This customer is already linked as a co-applicant on this application.');
  }

  if (app.guarantors.some((g) => g.customerId === payload.customerId)) {
    throw new Error('This customer is already linked as a guarantor for this application.');
  }

  const cust = ctx.customers.find((c) => c.id === payload.customerId);
  if (!cust) throw new Error('Customer record not found');

  if (cust.status === 'ARCHIVED') {
    throw new Error('Archived customer cannot be added as a co-applicant.');
  }

  const kycRec = ctx.kycRecords.find((k) => k.customerId === cust.id);
  const today = new Date().toISOString().split('T')[0];
  const actor = payload.addedBy || 'Anita Deshmukh';

  const coApp: CoApplicantRecord = {
    id: `coapp_${Date.now()}`,
    applicationId: appId,
    customerId: cust.id,
    customerNumber: cust.customerNumber,
    customerName: cust.name,
    mobile: cust.mobile,
    relationship: payload.relationship,
    kycStatus: kycRec?.status || 'PENDING_REVIEW',
    monthlyIncome: cust.monthlyIncome,
    panMasked: cust.panMasked,
    existingLoansCount: cust.activeLoanCount,
    totalOutstanding: cust.totalOutstanding,
    notes: payload.notes,
    addedAt: `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    addedBy: actor,
  };

  app.coApplicants.push(coApp);
  app.updatedDate = today;

  logApplicationHistory(ctx, appId, {
    eventType: 'CO_APPLICANT_ADDED',
    actor,
    actorRole: 'Loan Officer',
    description: `Co-applicant ${cust.name} (${cust.customerNumber}) added with relationship: ${payload.relationship}.`,
  });

  ctx.notify();
  return coApp;
}

export function removeCoApplicant(ctx: LMSStoreContext, appId: string, coAppId: string, actor: string = 'Anita Deshmukh') {
  const app = ctx.applications.find((a) => a.id === appId);
  if (!app) throw new Error('Application not found');

  const coApp = app.coApplicants.find((c) => c.id === coAppId);
  if (!coApp) return;

  app.coApplicants = app.coApplicants.filter((c) => c.id !== coAppId);
  app.updatedDate = new Date().toISOString().split('T')[0];

  logApplicationHistory(ctx, appId, {
    eventType: 'CO_APPLICANT_REMOVED',
    actor,
    actorRole: 'Loan Officer',
    description: `Co-applicant ${coApp.customerName} removed from application.`,
  });

  ctx.notify();
}

export function addGuarantor(
  ctx: LMSStoreContext,
  appId: string,
  payload: {
    customerId: string;
    relationship: any;
    guaranteeType: 'INDIVIDUAL' | 'BUSINESS';
    netWorthEstimated?: number;
    notes?: string;
    addedBy?: string;
  }
): GuarantorRecord {
  const app = ctx.applications.find((a) => a.id === appId);
  if (!app) throw new Error('Application not found');

  if (app.customerId === payload.customerId) {
    throw new Error('The primary applicant cannot be linked as a guarantor.');
  }

  if (app.guarantors.some((g) => g.customerId === payload.customerId)) {
    throw new Error('This customer is already linked as a guarantor on this application.');
  }

  if (app.coApplicants.some((c) => c.customerId === payload.customerId)) {
    throw new Error('This customer is already linked as a co-applicant on this application.');
  }

  const cust = ctx.customers.find((c) => c.id === payload.customerId);
  if (!cust) throw new Error('Customer record not found');

  if (cust.status === 'ARCHIVED') {
    throw new Error('Archived customer cannot be added as a guarantor.');
  }

  const kycRec = ctx.kycRecords.find((k) => k.customerId === cust.id);
  const today = new Date().toISOString().split('T')[0];
  const actor = payload.addedBy || 'Anita Deshmukh';

  const guarantor: GuarantorRecord = {
    id: `guar_${Date.now()}`,
    applicationId: appId,
    customerId: cust.id,
    customerNumber: cust.customerNumber,
    customerName: cust.name,
    mobile: cust.mobile,
    relationship: payload.relationship,
    guaranteeType: payload.guaranteeType,
    kycStatus: kycRec?.status || 'PENDING_REVIEW',
    netWorthEstimated: payload.netWorthEstimated,
    panMasked: cust.panMasked,
    notes: payload.notes,
    addedAt: `${today} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    addedBy: actor,
  };

  app.guarantors.push(guarantor);
  app.updatedDate = today;

  logApplicationHistory(ctx, appId, {
    eventType: 'GUARANTOR_ADDED',
    actor,
    actorRole: 'Loan Officer',
    description: `Guarantor ${cust.name} (${cust.customerNumber}) added with ${payload.guaranteeType} guarantee.`,
  });

  ctx.notify();
  return guarantor;
}

export function removeGuarantor(ctx: LMSStoreContext, appId: string, guarantorId: string, actor: string = 'Anita Deshmukh') {
  const app = ctx.applications.find((a) => a.id === appId);
  if (!app) throw new Error('Application not found');

  const guar = app.guarantors.find((g) => g.id === guarantorId);
  if (!guar) return;

  app.guarantors = app.guarantors.filter((g) => g.id !== guarantorId);
  app.updatedDate = new Date().toISOString().split('T')[0];

  logApplicationHistory(ctx, appId, {
    eventType: 'GUARANTOR_REMOVED',
    actor,
    actorRole: 'Loan Officer',
    description: `Guarantor ${guar.customerName} removed from application.`,
  });

  ctx.notify();
}

export function linkCustomerKycDocument(
  ctx: LMSStoreContext,
  appId: string,
  documentType: string,
  vaultDocId: string,
  actor: string = 'Anita Deshmukh'
) {
  const app = ctx.applications.find((a) => a.id === appId);
  if (!app) throw new Error('Application not found');

  const vaultDoc = ctx.documents.find((d) => d.id === vaultDocId);
  if (!vaultDoc) throw new Error('Vault document not found');

  let appDoc = app.documents.find((d) => d.documentType === documentType);
  const today = new Date().toISOString().split('T')[0];

  if (appDoc) {
    appDoc.source = 'CUSTOMER_KYC';
    appDoc.documentVaultId = vaultDoc.id;
    appDoc.fileName = vaultDoc.fileName;
    appDoc.status = (vaultDoc.status === 'VERIFIED' ? 'VERIFIED' : 'UNDER_REVIEW') as any;
    appDoc.verifiedAt = vaultDoc.verifiedAt || today;
    appDoc.verifiedBy = vaultDoc.verifiedBy || actor;
  } else {
    appDoc = {
      id: `appdoc_${Date.now()}`,
      applicationId: appId,
      documentType,
      documentTitle: vaultDoc.documentTitle,
      source: 'CUSTOMER_KYC',
      documentVaultId: vaultDoc.id,
      fileName: vaultDoc.fileName,
      fileFormat: vaultDoc.fileFormat,
      fileSizeKb: vaultDoc.fileSizeKb,
      status: (vaultDoc.status === 'VERIFIED' ? 'VERIFIED' : 'UNDER_REVIEW') as any,
      isMandatory: true,
      uploadedAt: today,
      uploadedBy: actor,
      verifiedAt: vaultDoc.verifiedAt,
      verifiedBy: vaultDoc.verifiedBy,
    };
    app.documents.push(appDoc);
  }

  app.updatedDate = today;

  logApplicationHistory(ctx, appId, {
    eventType: 'DOCUMENT_LINKED',
    actor,
    actorRole: 'Loan Officer',
    description: `Linked customer KYC document "${vaultDoc.documentTitle}" to application.`,
  });

  ctx.notify();
}

export function uploadApplicationDocument(
  ctx: LMSStoreContext,
  appId: string,
  payload: {
    documentType: string;
    documentTitle: string;
    fileName: string;
    fileFormat: 'PDF' | 'JPG' | 'PNG' | 'DOCX';
    fileSizeKb: number;
    isMandatory?: boolean;
    notes?: string;
    uploadedBy?: string;
  }
): ApplicationDocumentRecord {
  const app = ctx.applications.find((a) => a.id === appId);
  if (!app) throw new Error('Application not found');

  const today = new Date().toISOString().split('T')[0];
  const actor = payload.uploadedBy || 'Anita Deshmukh';

  let existing = app.documents.find((d) => d.documentType === payload.documentType);
  if (existing) {
    existing.source = 'APPLICATION_UPLOAD';
    existing.fileName = payload.fileName;
    existing.fileFormat = payload.fileFormat;
    existing.fileSizeKb = payload.fileSizeKb;
    existing.status = 'UNDER_REVIEW';
    existing.uploadedAt = today;
    existing.uploadedBy = actor;
    existing.notes = payload.notes;
    existing.rejectionReason = undefined;
  } else {
    existing = {
      id: `appdoc_${Date.now()}`,
      applicationId: appId,
      documentType: payload.documentType,
      documentTitle: payload.documentTitle,
      source: 'APPLICATION_UPLOAD',
      fileName: payload.fileName,
      fileFormat: payload.fileFormat,
      fileSizeKb: payload.fileSizeKb,
      status: 'UNDER_REVIEW',
      isMandatory: payload.isMandatory ?? true,
      uploadedAt: today,
      uploadedBy: actor,
      notes: payload.notes,
    };
    app.documents.push(existing);
  }

  app.updatedDate = today;

  logApplicationHistory(ctx, appId, {
    eventType: 'DOCUMENT_UPLOADED',
    actor,
    actorRole: 'Loan Officer',
    description: `Uploaded application document: "${payload.documentTitle}".`,
  });

  ctx.notify();
  return existing;
}

export function verifyApplicationDocument(
  ctx: LMSStoreContext,
  appId: string,
  docId: string,
  verifiedBy: string,
  notes?: string
) {
  const app = ctx.applications.find((a) => a.id === appId);
  if (!app) throw new Error('Application not found');

  const doc = app.documents.find((d) => d.id === docId);
  if (!doc) throw new Error('Application document not found');

  const today = new Date().toISOString().split('T')[0];
  doc.status = 'VERIFIED';
  doc.verifiedAt = today;
  doc.verifiedBy = verifiedBy;
  if (notes) doc.notes = notes;
  doc.rejectionReason = undefined;
  app.updatedDate = today;

  logApplicationHistory(ctx, appId, {
    eventType: 'DOCUMENT_VERIFIED',
    actor: verifiedBy,
    actorRole: 'Operations Officer',
    description: `Document "${doc.documentTitle}" marked as VERIFIED.`,
    details: notes,
  });

  ctx.notify();
}

export function rejectApplicationDocument(
  ctx: LMSStoreContext,
  appId: string,
  docId: string,
  rejectedBy: string,
  reason: string,
  notes?: string
) {
  const app = ctx.applications.find((a) => a.id === appId);
  if (!app) throw new Error('Application not found');

  const doc = app.documents.find((d) => d.id === docId);
  if (!doc) throw new Error('Application document not found');

  const today = new Date().toISOString().split('T')[0];
  doc.status = 'REJECTED';
  doc.rejectionReason = reason;
  if (notes) doc.notes = notes;
  app.updatedDate = today;

  logApplicationHistory(ctx, appId, {
    eventType: 'DOCUMENT_REJECTED',
    actor: rejectedBy,
    actorRole: 'Operations Officer',
    description: `Document "${doc.documentTitle}" REJECTED: ${reason}`,
    details: notes,
  });

  ctx.notify();
}

export function removeApplicationDocument(ctx: LMSStoreContext, appId: string, docId: string, actor: string = 'Anita Deshmukh') {
  const app = ctx.applications.find((a) => a.id === appId);
  if (!app) throw new Error('Application not found');

  const doc = app.documents.find((d) => d.id === docId);
  if (!doc) return;

  if (doc.isMandatory && doc.source === 'CUSTOMER_KYC') {
    doc.status = 'MISSING';
    doc.documentVaultId = undefined;
    doc.fileName = undefined;
  } else {
    app.documents = app.documents.filter((d) => d.id !== docId);
  }

  app.updatedDate = new Date().toISOString().split('T')[0];

  logApplicationHistory(ctx, appId, {
    eventType: 'DOCUMENT_REMOVED',
    actor,
    actorRole: 'Loan Officer',
    description: `Document "${doc.documentTitle}" removed from application.`,
  });

  ctx.notify();
}

export function validateApplicationForSubmission(ctx: LMSStoreContext, appId: string): ApplicationValidationResult {
  const app = ctx.applications.find((a) => a.id === appId);
  if (!app) {
    return { isValid: false, blockers: ['Application record not found.'], warnings: [], passedChecks: [] };
  }

  const blockers: string[] = [];
  const warnings: string[] = [];
  const passedChecks: string[] = [];

  // 1. Customer Verification
  const customer = ctx.customers.find((c) => c.id === app.customerId);
  if (!customer) {
    blockers.push('Primary customer profile is missing.');
  } else if (customer.status !== 'ACTIVE') {
    blockers.push(`Customer account status is ${customer.status}. Must be ACTIVE to originate loan.`);
  } else {
    passedChecks.push(`Primary applicant ${customer.name} is active.`);
  }

  // 2. KYC Verification
  const kyc = ctx.kycRecords.find((k) => k.customerId === app.customerId);
  if (kyc && kyc.status !== 'VERIFIED') {
    blockers.push(`Primary applicant KYC is ${kyc.status}. Verified KYC is required for loan submission.`);
  } else {
    passedChecks.push('Primary applicant KYC is verified.');
  }

  // 3. Product Rules & Financials
  const product = ctx.loanProductsConfig.find((p) => p.code === app.productCode);
  if (!product) {
    blockers.push('Loan product configuration is invalid or missing.');
  } else {
    if (app.requestedAmount < product.minAmount || app.requestedAmount > product.maxAmount) {
      blockers.push(`Requested amount ₹${app.requestedAmount.toLocaleString('en-IN')} is outside product bounds (₹${product.minAmount.toLocaleString('en-IN')} - ₹${product.maxAmount.toLocaleString('en-IN')}).`);
    } else {
      passedChecks.push(`Requested amount ₹${app.requestedAmount.toLocaleString('en-IN')} is within product limits.`);
    }

    if (app.requestedTenureMonths < product.minTenureMonths || app.requestedTenureMonths > product.maxTenureMonths) {
      blockers.push(`Requested tenure ${app.requestedTenureMonths} months is outside allowable range (${product.minTenureMonths} - ${product.maxTenureMonths} mos).`);
    } else {
      passedChecks.push(`Requested tenure ${app.requestedTenureMonths} months is valid.`);
    }
  }

  // 4. Purpose
  if (!app.purpose || app.purpose.trim().length < 10) {
    blockers.push('Loan purpose explanation is required (minimum 10 characters).');
  } else {
    passedChecks.push('Loan purpose is detailed.');
  }

  // 5. Co-applicant checks
  app.coApplicants.forEach((coApp) => {
    if (coApp.kycStatus !== 'VERIFIED') {
      warnings.push(`Co-applicant ${coApp.customerName} KYC is ${coApp.kycStatus}. Verification recommended before committee review.`);
    } else {
      passedChecks.push(`Co-applicant ${coApp.customerName} KYC verified.`);
    }
  });

  // 6. Guarantor checks
  app.guarantors.forEach((guar) => {
    if (guar.kycStatus !== 'VERIFIED') {
      warnings.push(`Guarantor ${guar.customerName} KYC is ${guar.kycStatus}.`);
    } else {
      passedChecks.push(`Guarantor ${guar.customerName} KYC verified.`);
    }
  });

  // 7. Mandatory Documents Checklist
  const mandatoryDocs = app.documents.filter((d) => d.isMandatory);
  mandatoryDocs.forEach((doc) => {
    if (doc.status === 'MISSING') {
      blockers.push(`Mandatory document "${doc.documentTitle}" is missing.`);
    } else if (doc.status === 'REJECTED') {
      blockers.push(`Mandatory document "${doc.documentTitle}" was rejected (${doc.rejectionReason || 're-upload required'}).`);
    } else if (doc.status === 'UNDER_REVIEW' || doc.status === 'UPLOADED') {
      warnings.push(`Mandatory document "${doc.documentTitle}" is under review.`);
    } else if (doc.status === 'VERIFIED') {
      passedChecks.push(`Mandatory document "${doc.documentTitle}" verified.`);
    }
  });

  return {
    isValid: blockers.length === 0,
    blockers,
    warnings,
    passedChecks,
  };
}

export function submitApplication(
  ctx: LMSStoreContext,
  appId: string,
  declarations: SubmissionDeclarationState,
  submittedBy: string = 'Anita Deshmukh'
): LoanApplicationRecord {
  const app = ctx.applications.find((a) => a.id === appId);
  if (!app) throw new Error('Application not found');

  const validation = validateApplicationForSubmission(ctx, appId);
  if (!validation.isValid) {
    throw new Error(`Application cannot be submitted: ${validation.blockers.join(' ')}`);
  }

  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  app.status = 'SUBMITTED';
  app.submissionDeclarations = {
    ...declarations,
    declaredBy: submittedBy,
    declaredAt: `${today} ${nowTime}`,
  };
  app.submittedAt = `${today} ${nowTime}`;
  app.submittedBy = submittedBy;
  app.updatedDate = today;

  const custApp = ctx.customerApplications.find((ca) => ca.id === appId || ca.applicationNumber === app.applicationNumber);
  if (custApp) {
    custApp.status = 'SUBMITTED';
  }

  logApplicationHistory(ctx, appId, {
    eventType: 'APPLICATION_SUBMITTED',
    actor: submittedBy,
    actorRole: 'Loan Officer',
    description: `Application ${app.applicationNumber} formally submitted for operations and credit review.`,
    details: 'All pre-submission validation gates passed. Declarations signed.',
  });

  logAudit(ctx, {
    entityType: 'USER',
    entityId: app.customerId,
    entityName: app.customerName,
    action: 'LOAN_APPLICATION_SUBMITTED',
    details: `Application ${app.applicationNumber} for ₹${app.requestedAmount.toLocaleString('en-IN')} (${app.productName}) submitted by ${submittedBy}.`,
  });

  // Auto-create pending credit assessment if not present
  let existingAssessment = ctx.creditAssessments.find((ca) => ca.applicationId === appId);
  if (!existingAssessment) {
    const assessmentSeq = ctx.nextAssessmentSeq++;
    const caNumber = `CA-2026-000${assessmentSeq}`;
    const customer = ctx.customers.find((c) => c.id === app.customerId);
    const proposedEmi = calculateEMI(app.requestedAmount, app.interestRate || 12.0, app.requestedTenureMonths);
    const netInc = app.customerMonthlyIncome || ((customer as any)?.financialProfile?.monthlyIncome) || 50000;
    const foir = Number(((proposedEmi / netInc) * 100).toFixed(2));

    const newAssessment: CreditAssessmentRecord = {
      id: `ca_${Date.now()}`,
      assessmentNumber: caNumber,
      applicationId: app.id,
      applicationNumber: app.applicationNumber,
      customerId: app.customerId,
      customerNumber: app.customerNumber,
      customerName: app.customerName,
      customerMobile: app.customerMobile,
      customerKycStatus: app.customerKycStatus,
      branchId: app.branchId,
      branchName: app.branchName,
      productCode: app.productCode,
      productName: app.productName,
      applicationDate: app.applicationDate,
      requestedAmount: app.requestedAmount,
      requestedTenureMonths: app.requestedTenureMonths,
      requestedInterestRate: app.interestRate,
      requestedFrequency: app.repaymentFrequency,
      purpose: app.purpose,
      status: 'PENDING',
      ageDays: 0,
      priority: app.priority,
      incomeSourceType: (app.customerEmploymentType as any) || 'SALARIED',
      employerOrBusinessName: (customer as any)?.employment?.employerName || (customer as any)?.employment?.businessName || 'Declared Employment',
      employmentVintageYears: (customer as any)?.employment?.workExperienceYears || 3,
      employmentVintageMonths: 0,
      employmentStability: 'STABLE',
      monthlyGrossIncome: Math.round(netInc * 1.15),
      monthlyNetIncome: netInc,
      otherMonthlyIncome: 0,
      totalConsideredIncome: netInc,
      obligations: [],
      totalExistingOutstanding: app.customerTotalExposure || 0,
      totalExistingMonthlyEmi: 0,
      existingObligationRatio: 0,
      proposedEmi,
      postApplicationObligationRatio: foir,
      bankingIndicators: {
        primaryBank: 'Operating Bank Account',
        accountType: 'SAVINGS_SALARY',
        averageMonthlyBalance: Math.round(netInc * 0.75),
        salaryCreditsStatus: 'REGULAR',
        salaryCreditAverage: netInc,
        recentBounceCount: 0,
        overdraftUsage: 'NONE',
        monthlyCreditTransactionCount: 15,
        monthlyDebitTransactionCount: 35,
        recentTransactionTrend: 'STABLE',
        inwardChequeReturnCount: 0,
        outwardChequeReturnCount: 0,
        cashDepositPercentage: 2.0,
      },
      creditHistory: {
        bureauScore: ((customer as any)?.creditScore?.score) || 735,
        bureauName: 'TransUnion CIBIL (Mock Credit Bureau Data)',
        scoreDate: today,
        scoreBand: 'GOOD',
        activeAccountsCount: app.customerExistingLoansCount || 0,
        closedAccountsCount: 2,
        delinquenciesCount: 0,
        recentDpdDays: 0,
        writeOffsCount: 0,
        suitFiled: false,
        enquiriesLast6Months: 1,
        accounts: [],
        negativeIndicators: [],
      },
      riskIndicators: [],
      rules: [],
      conditions: [],
      recommendation: 'RECOMMEND_APPROVE',
      recommendedAmount: app.requestedAmount,
      recommendedTenureMonths: app.requestedTenureMonths,
      recommendedInterestRate: app.interestRate,
      recommendationNotes: '',
      underwriterNotes: '',
      currentVersion: 1,
      versions: [],
      history: [
        {
          id: `cahist_${Date.now()}`,
          assessmentId: `ca_${Date.now()}`,
          timestamp: `${today} ${nowTime}`,
          eventType: 'ASSESSMENT_CREATED',
          eventTitle: 'Credit Assessment Auto-Initiated upon Submission',
          actor: submittedBy,
          actorRole: 'Origination Engine',
          newState: 'PENDING',
          notes: `Auto-originated from submitted application ${app.applicationNumber}.`,
        },
      ],
      createdDate: today,
      updatedDate: today,
    };

    ctx.creditAssessments.unshift(newAssessment);
  }

  ctx.syncApi('/api/applications', 'PUT', {
    id: app.id,
    status: 'SUBMITTED',
    submittedAt: app.submittedAt,
    submittedBy: app.submittedBy,
    submissionDeclarations: app.submissionDeclarations,
  });

  ctx.notify();
  return app;
}

export function cancelApplication(
  ctx: LMSStoreContext,
  appId: string,
  reason: string,
  cancelledBy: string = 'Anita Deshmukh'
): LoanApplicationRecord {
  const app = ctx.applications.find((a) => a.id === appId);
  if (!app) throw new Error('Application not found');

  if (app.status === 'APPROVED' || app.status === 'SANCTIONED') {
    throw new Error('Approved/Sanctioned applications cannot be cancelled via standard workflow.');
  }

  const today = new Date().toISOString().split('T')[0];
  app.status = 'CANCELLED';
  app.cancellationReason = reason;
  app.updatedDate = today;

  const custApp = ctx.customerApplications.find((ca) => ca.id === appId || ca.applicationNumber === app.applicationNumber);
  if (custApp) {
    custApp.status = 'CANCELLED';
  }

  logApplicationHistory(ctx, appId, {
    eventType: 'APPLICATION_CANCELLED',
    actor: cancelledBy,
    actorRole: 'Loan Officer',
    description: `Application cancelled. Reason: ${reason}`,
  });

  ctx.syncApi('/api/applications', 'PUT', {
    id: appId,
    status: 'CANCELLED',
    cancellationReason: reason,
  });

  ctx.notify();
  return app;
}

export function getApplicationFormResponse(ctx: LMSStoreContext, applicationId: string) {
  return ctx.formResponses[applicationId] || null;
}

export function saveDraftFormResponse(
  ctx: LMSStoreContext,
  applicationId: string,
  responses: Record<string, any>,
  signatures: Record<string, any> = {},
  pageIndex: number = 0
) {
  const existing = ctx.formResponses[applicationId] || { responses: {}, signatures: {} };
  const mergedResponses = { ...existing.responses, ...responses };
  const mergedSignatures = { ...existing.signatures, ...signatures };

  ctx.formResponses[applicationId] = {
    applicationId,
    responses: mergedResponses,
    signatures: mergedSignatures,
    isSubmitted: existing.isSubmitted || false,
    updatedAt: new Date().toISOString(),
  };

  if (responses.requested_loan_amount) {
    const app = ctx.applications.find((a) => a.id === applicationId);
    if (app && app.status === 'DRAFT') {
      const amt = Number(responses.requested_loan_amount);
      if (!isNaN(amt) && amt > 0) app.requestedAmount = amt;
    }
  }

  ctx.syncApi(`/api/applications/${applicationId}/form-response`, 'PUT', {
    responses: mergedResponses,
    signatures: mergedSignatures,
    currentPageIndex: pageIndex,
  });

  ctx.notify();
  return ctx.formResponses[applicationId];
}

export function submitApplicationFormResponse(
  ctx: LMSStoreContext,
  applicationId: string,
  responses: Record<string, any>,
  signatures: Record<string, any> = {},
  submittedBy: string = 'Anita Deshmukh'
) {
  const app = ctx.applications.find((a) => a.id === applicationId);
  if (!app) throw new Error('Application not found');

  const now = new Date().toISOString();
  const today = now.split('T')[0];
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  ctx.formResponses[applicationId] = {
    applicationId,
    responses,
    signatures,
    isSubmitted: true,
    submittedAt: now,
    submittedBy,
    updatedAt: now,
  };

  if (responses.requested_loan_amount) {
    const amt = Number(responses.requested_loan_amount);
    if (!isNaN(amt) && amt > 0) app.requestedAmount = amt;
  }
  app.status = 'SUBMITTED';
  app.submittedAt = `${today} ${nowTime}`;
  app.submittedBy = submittedBy;
  app.updatedDate = today;

  const custApp = ctx.customerApplications.find((ca) => ca.id === applicationId || ca.applicationNumber === app.applicationNumber);
  if (custApp) {
    custApp.status = 'SUBMITTED';
  }

  logApplicationHistory(ctx, applicationId, {
    eventType: 'APPLICATION_SUBMITTED',
    actor: submittedBy,
    actorRole: 'Applicant / Loan Officer',
    description: `Structured Product Application Form submitted for ${app.applicationNumber}.`,
    details: 'All 5 pages completed with legal declarations and digital signature.',
  });

  ctx.syncApi(`/api/applications/${applicationId}/form-response`, 'POST', {
    responses,
    signatures,
    submittedBy,
  });

  ctx.notify();
  return ctx.formResponses[applicationId];
}

export function updateApplicationStatus(
  ctx: LMSStoreContext,
  appId: string,
  newStatus: ApplicationWorkflowStatus,
  reason?: string,
  actor: string = 'Alex Morgan'
): LoanApplicationRecord {
  const app = ctx.applications.find((a) => a.id === appId);
  if (!app) throw new Error('Application not found');

  const prevStatus = app.status;
  app.status = newStatus;
  app.updatedDate = new Date().toISOString().split('T')[0];

  const custApp = ctx.customerApplications.find((ca) => ca.id === appId || ca.applicationNumber === app.applicationNumber);
  if (custApp) {
    custApp.status = newStatus;
  }

  logApplicationHistory(ctx, appId, {
    eventType: 'STATUS_CHANGED',
    actor,
    actorRole: 'Operations Officer',
    description: `Application status transitioned from ${prevStatus} to ${newStatus}.`,
    details: reason,
  });

  ctx.notify();
  return app;
}

