import { LMSStoreContext } from '../types';
import { CustomerRecord, CustomerLoanItem } from '../../../types';
import {
  DisbursementRecord,
  DisbursementRequestRecord,
  DisbursementTransactionRecord,
} from '../../../types/disbursementTypes';
import {
  LoanAccountRecord,
  RepaymentScheduleVersion,
  LoanChargeItem,
  LoanRepaymentSettings,
  LoanTransactionItem,
  LoanHistoryItem,
  LoanRepaymentFrequency,
  InterestMethod,
} from '../../../types/loanAccountTypes';
import { generateRepaymentSchedule, roundMoney } from '../../loanFinancialService';
import {
  PaymentRecord,
  PaymentReceiptRecord,
  PaymentHistoryRecord,
  UnallocatedPaymentRecord,
  RecordPaymentPayload,
  PaymentFilterState,
} from '../../../types/repaymentTypes';
import { executePaymentAllocation, executePaymentReversal } from '../../repaymentAllocationEngine';

export function processLoanAccountOnDisbursement(
  ctx: LMSStoreContext,
  dsb: DisbursementRecord,
  req: DisbursementRequestRecord,
  txn: DisbursementTransactionRecord,
  actorName: string,
  actorRole: string
): LoanAccountRecord {
  // Check if loan already exists for this sanction/application
  let existingLoan = ctx.loanAccounts.find(
    (l) =>
      (dsb.sanctionId && l.sanctionId === dsb.sanctionId) ||
      (dsb.applicationId && l.applicationId === dsb.applicationId)
  );

  if (existingLoan) {
    // Update existing loan account for subsequent tranche
    existingLoan.disbursedPrincipal = roundMoney(
      existingLoan.disbursedPrincipal + req.requestedAmount
    );
    existingLoan.principalOutstanding = roundMoney(
      existingLoan.principalOutstanding + req.requestedAmount
    );
    existingLoan.totalOutstanding = roundMoney(
      existingLoan.principalOutstanding +
      existingLoan.interestOutstanding +
      existingLoan.feeOutstanding +
      existingLoan.penaltyOutstanding
    );
    existingLoan.status =
      dsb.remainingAmount === 0 ? 'ACTIVE' : 'PARTIALLY_DISBURSED';
    existingLoan.updatedAt = new Date().toISOString();
    existingLoan.updatedBy = actorName;

    // Add transaction to ledger
    const newTxn: LoanTransactionItem = {
      id: `ltxn_${Date.now()}`,
      loanId: existingLoan.id,
      accountNumber: existingLoan.accountNumber,
      transactionReference: txn.transactionReference,
      transactionType: 'DISBURSEMENT',
      amount: req.requestedAmount,
      principalPortion: req.requestedAmount,
      interestPortion: 0,
      feePortion: 0,
      penaltyPortion: 0,
      status: 'SUCCESSFUL',
      referenceId: dsb.disbursementNumber,
      utrNumber: txn.utrNumber,
      paymentMethod: txn.paymentMethod,
      notes: `Tranche payout of ₹${req.requestedAmount.toLocaleString('en-IN')} settled. Remaining Sanction: ₹${dsb.remainingAmount.toLocaleString('en-IN')}.`,
      transactionDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      createdBy: actorName,
    };
    existingLoan.transactions = [newTxn, ...(existingLoan.transactions || [])];

    // Add audit history
    const historyEntry: LoanHistoryItem = {
      id: `lh_${Date.now()}`,
      loanId: existingLoan.id,
      timestamp: new Date().toISOString(),
      action: 'DISBURSEMENT_TRANCHE_POSTED',
      actor: actorName,
      actorName,
      actorRole,
      previousState: 'PARTIALLY_DISBURSED',
      newState: existingLoan.status,
      amount: req.requestedAmount,
      reference: txn.transactionReference,
      notes: `Disbursement tranche of ₹${req.requestedAmount.toLocaleString('en-IN')} processed. UTR: ${txn.utrNumber}.`,
    };
    existingLoan.history = [historyEntry, ...(existingLoan.history || [])];

    ctx.syncApi(`/api/loans/${existingLoan.id}`, 'PATCH', existingLoan);
    return existingLoan;
  }

  // Create a new Loan Account
  const sanction = ctx.sanctions.find(
    (s) => s.id === dsb.sanctionId || s.sanctionNumber === dsb.sanctionNumber
  );
  const app = ctx.applications.find(
    (a) => a.id === dsb.applicationId || a.applicationNumber === dsb.applicationNumber
  );
  const customer = ctx.customers.find(
    (c) => c.id === dsb.customerId || c.customerNumber === dsb.customerNumber
  );
  const beneficiary = dsb.beneficiaries.find((b: any) => b.id === req.beneficiaryId) || dsb.beneficiaries[0];

  const loanId = `ln_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const accountNumber = `LN-2026-${String(ctx.nextLoanSeq++).padStart(6, '0')}`;
  const rate = sanction ? Number(sanction.approvedInterestRate) : (app?.interestRate || 14.0);
  const tenure = sanction ? sanction.approvedTenureMonths : (app?.requestedTenureMonths || 36);
  const frequency = (app?.repaymentFrequency || 'MONTHLY') as LoanRepaymentFrequency;
  const interestMethod: InterestMethod = 'REDUCING_BALANCE';
  const originalPrincipal = sanction ? Number(sanction.approvedAmount) : req.requestedAmount;
  const disbursedPrincipal = req.requestedAmount;
  const isFull = dsb.remainingAmount === 0;

  const startDate = new Date().toISOString().split('T')[0];
  const firstDueDateObj = new Date();
  firstDueDateObj.setDate(firstDueDateObj.getDate() + 35);
  const firstDueDate = firstDueDateObj.toISOString().split('T')[0];

  // Generate schedule version 1
  const scheduleResult = generateRepaymentSchedule({
    loanId,
    versionNumber: 1,
    reason: 'Initial schedule generated on loan activation after qualifying disbursement.',
    principal: disbursedPrincipal,
    annualRate: rate,
    tenureMonths: tenure,
    frequency,
    interestMethod,
    startDate,
    firstDueDate,
    createdBy: actorName,
  });

  // Generate product charges
  const charges: LoanChargeItem[] = [
    {
      id: `lc_${loanId}_1`,
      loanId,
      chargeTypeId: 'CHG_PROC_AUTO',
      chargeCode: 'PROCESSING_FEE',
      chargeName: 'Loan Processing Fee',
      chargeType: 'PROCESSING_FEE',
      calculationType: 'PERCENTAGE_OF_SANCTION',
      rateOrValue: 1.0,
      amount: roundMoney(originalPrincipal * 0.01),
      taxAmount: roundMoney(originalPrincipal * 0.01 * 0.18),
      totalAmount: roundMoney(originalPrincipal * 0.01 * 1.18),
      chargeTiming: 'ORIGINATION_DEDUCTED',
      status: 'DEDUCTED_AT_DISBURSEMENT',
      source: 'PRODUCT_CONFIG',
      createdAt: new Date().toISOString(),
      createdBy: 'System / Sanction Engine',
    },
    {
      id: `lc_${loanId}_2`,
      loanId,
      chargeTypeId: 'CHG_DOC_AUTO',
      chargeCode: 'DOCUMENTATION_CHARGES',
      chargeName: 'Documentation & Stamp Charges',
      chargeType: 'DOCUMENTATION_CHARGES',
      calculationType: 'FIXED',
      rateOrValue: 750,
      amount: 750,
      taxAmount: 135,
      totalAmount: 885,
      chargeTiming: 'ORIGINATION_DEDUCTED',
      status: 'DEDUCTED_AT_DISBURSEMENT',
      source: 'PRODUCT_CONFIG',
      createdAt: new Date().toISOString(),
      createdBy: 'System / Sanction Engine',
    },
  ];

  // Repayment settings
  const repaymentSettings: LoanRepaymentSettings = {
    id: `lrs_${loanId}`,
    loanId,
    repaymentFrequency: frequency,
    paymentMethod: 'NACH_EMANDATE',
    mandateStatus: 'ACTIVE',
    mandateReference: `UMRN-${beneficiary?.bankName?.slice(0, 4) || 'HDFC'}-${Date.now().toString().slice(-6)}`,
    bankAccountMasked: beneficiary?.accountNumberMasked || '•••• •••• •••• 0000',
    bankName: beneficiary?.bankName || 'HDFC Bank Ltd',
    ifscCode: beneficiary?.ifscCode || 'HDFC0000120',
    accountHolderName: beneficiary?.beneficiaryName || dsb.customerName,
    preferredDebitDate: 5,
    gracePeriodDays: 3,
    updatedAt: new Date().toISOString(),
    updatedBy: actorName,
  };

  // Opening transaction
  const openingTxn: LoanTransactionItem = {
    id: `ltxn_${Date.now()}`,
    loanId,
    accountNumber,
    transactionReference: txn.transactionReference,
    transactionType: 'DISBURSEMENT',
    amount: req.requestedAmount,
    principalPortion: req.requestedAmount,
    interestPortion: 0,
    feePortion: 0,
    penaltyPortion: 0,
    status: 'SUCCESSFUL',
    referenceId: dsb.disbursementNumber,
    utrNumber: txn.utrNumber,
    paymentMethod: txn.paymentMethod,
    notes: `Initial opening disbursement payout of ₹${req.requestedAmount.toLocaleString('en-IN')} settled.`,
    transactionDate: startDate,
    createdAt: new Date().toISOString(),
    createdBy: actorName,
  };

  // Audit history
  const openingHistory: LoanHistoryItem = {
    id: `lh_${Date.now()}`,
    loanId,
    timestamp: new Date().toISOString(),
    action: 'LOAN_ACCOUNT_CREATED',
    actor: actorName,
    actorName,
    actorRole,
    previousState: 'DISBURSED',
    newState: isFull ? 'ACTIVE' : 'PARTIALLY_DISBURSED',
    amount: req.requestedAmount,
    reference: accountNumber,
    reason: `Successful payout against Sanction ${dsb.sanctionNumber}.`,
    notes: `Loan Account created with Schedule Version 1 (${scheduleResult.totalInstalments} instalments).`,
  };

  const newLoan: LoanAccountRecord = {
    id: loanId,
    accountNumber,
    customerId: dsb.customerId,
    customerNumber: dsb.customerNumber,
    customerName: dsb.customerName,
    customerMobile: dsb.customerMobile || customer?.mobile,
    customerEmail: customer?.email || undefined,
    customerAddress: customer ? `${customer.currentAddress?.addressLine1 || ''}, ${customer.currentAddress?.city || ''}, ${customer.currentAddress?.state || ''}` : undefined,
    applicationId: dsb.applicationId,
    applicationNumber: dsb.applicationNumber,
    productCode: dsb.productCode,
    productName: dsb.productName,
    approvalId: sanction?.approvalId || undefined,
    approvalNumber: sanction?.approvalNumber || undefined,
    sanctionId: dsb.sanctionId,
    sanctionNumber: dsb.sanctionNumber,
    primaryDisbursementId: dsb.id,
    primaryDisbursementNumber: dsb.disbursementNumber,
    branchId: dsb.branchId || 'br_panjim',
    branchName: dsb.branchName || 'Panaji Head Office Branch',
    assignedOfficer: app?.loanOfficer || 'Alex Morgan',
    assignedOfficerId: app?.assignedOfficerId || 'usr_officer_01',

    originalPrincipal,
    disbursedPrincipal,
    principalOutstanding: disbursedPrincipal,
    interestOutstanding: 0,
    feeOutstanding: 0,
    penaltyOutstanding: 0,
    totalOutstanding: disbursedPrincipal,

    totalPaidAmount: 0,
    totalPrincipalPaid: 0,
    totalInterestPaid: 0,
    totalFeesPaid: 0,

    overdueAmount: 0,
    dpd: 0,
    dpdBucket: 'CURRENT',
    status: isFull ? 'ACTIVE' : 'PARTIALLY_DISBURSED',

    interestRate: rate,
    interestMethod,
    repaymentFrequency: frequency,
    tenureMonths: tenure,
    totalInstalments: scheduleResult.totalInstalments,
    remainingInstalments: scheduleResult.totalInstalments,
    emiAmount: scheduleResult.emiAmount,

    disbursementDate: startDate,
    loanStartDate: startDate,
    firstDueDate,
    maturityDate: scheduleResult.maturityDate,
    nextDueDate: firstDueDate,

    repaymentSettings,
    currentScheduleVersion: 1,
    scheduleVersions: [scheduleResult.version],
    schedules: scheduleResult.schedules,
    charges,
    transactions: [openingTxn],
    history: [openingHistory],

    createdAt: new Date().toISOString(),
    createdBy: actorName,
    updatedAt: new Date().toISOString(),
  };

  ctx.loanAccounts.unshift(newLoan);

  // Also update CustomerLoans list for instant UI synchronization in Customer 360
  const customerLoanEntry: CustomerLoanItem = {
    id: newLoan.id,
    accountNumber: newLoan.accountNumber,
    customerId: newLoan.customerId,
    customerName: newLoan.customerName,
    applicationNumber: newLoan.applicationNumber || '',
    productCode: newLoan.productCode,
    productName: newLoan.productName,
    originalPrincipal: newLoan.originalPrincipal,
    outstandingPrincipal: newLoan.principalOutstanding,
    interestRate: newLoan.interestRate,
    emiAmount: newLoan.emiAmount,
    disbursementDate: newLoan.disbursementDate,
    nextDueDate: newLoan.nextDueDate,
    dpd: newLoan.dpd,
    overdueAmount: newLoan.overdueAmount,
    totalTenureMonths: newLoan.tenureMonths,
    remainingTenureMonths: newLoan.remainingInstalments,
    status: newLoan.status,
    branchName: newLoan.branchName,
  };
  ctx.customerLoans.unshift(customerLoanEntry);

  ctx.syncApi('/api/loans', 'POST', newLoan);
  ctx.notify();
  return newLoan;
}

export function createLoanAccount(
  ctx: LMSStoreContext,
  payload: {
    customerId: string;
    productCode: string;
    amount: number;
    tenureMonths: number;
    interestRate?: number;
    repaymentFrequency?: LoanRepaymentFrequency;
    interestMethod?: InterestMethod;
    branchId?: string;
    startDate?: string;
    firstDueDate?: string;
    assignedOfficer?: string;
    notes?: string;
  }
): LoanAccountRecord {
  let customer = ctx.customers.find(
    (c) => c.id === payload.customerId || c.customerNumber === payload.customerId
  );
  if (!customer) {
    if (ctx.customers.length > 0) {
      customer = ctx.customers[0];
    } else {
      const newCust: CustomerRecord = {
        id: payload.customerId || `cus_${Date.now()}`,
        customerNumber: `CUS-${Date.now().toString().slice(-6)}`,
        name: 'Borrower Customer',
        firstName: 'Borrower',
        lastName: 'Customer',
        dateOfBirth: '1990-01-01',
        gender: 'MALE',
        customerType: 'INDIVIDUAL',
        mobile: '9876543210',
        currentAddress: { addressLine1: 'Main Road', city: 'Panaji', state: 'Goa', pinCode: '403001' },
        permanentAddress: { addressLine1: 'Main Road', city: 'Panaji', state: 'Goa', pinCode: '403001' },
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
        activeLoanCount: 1,
        closedLoanCount: 0,
        totalOutstanding: payload.amount,
        totalOverdue: 0,
        cibilScore: 750,
      };
      customer = newCust;
      ctx.customers = [newCust, ...ctx.customers];
      ctx.syncApi('/api/customers', 'POST', newCust);
    }
  }

  const resolvedCustomer = customer!;
  const product = ctx.loanProductsConfig.find((p) => p.code === payload.productCode) || ctx.loanProductsConfig[0] || {
    code: 'PERS_LOAN',
    name: 'Personal Loan',
    baseInterestRate: 14.5,
  };

  const branch = ctx.branches.find((b) => b.id === (payload.branchId || resolvedCustomer.branchId)) || {
    id: 'br_panjim',
    name: resolvedCustomer.branchName || 'Panaji Head Office Branch',
  };

  const loanSeq = ctx.nextLoanSeq++;
  const accountNumber = `LN-2026-${String(loanSeq).padStart(6, '0')}`;
  const loanId = `ln_${Date.now()}`;
  const rate = payload.interestRate || product.baseInterestRate || 14.0;
  const tenure = payload.tenureMonths || 36;
  const frequency = (payload.repaymentFrequency as LoanRepaymentFrequency) || 'MONTHLY';
  const interestMethod: InterestMethod = payload.interestMethod || 'REDUCING_BALANCE';
  const startDate = payload.startDate || new Date().toISOString().split('T')[0];
  const firstDueDate = payload.firstDueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const scheduleResult = generateRepaymentSchedule({
    loanId,
    versionNumber: 1,
    reason: 'Direct Loan origination and account booking.',
    principal: payload.amount,
    annualRate: rate,
    tenureMonths: tenure,
    frequency,
    interestMethod,
    startDate,
    firstDueDate,
    createdBy: payload.assignedOfficer || 'Operations Officer',
  });

  const repaymentSettings: LoanRepaymentSettings = {
    id: `lrs_${loanId}`,
    loanId,
    repaymentFrequency: frequency,
    paymentMethod: 'NACH_EMANDATE',
    mandateStatus: resolvedCustomer.bankName ? 'ACTIVE' : 'PENDING',
    mandateReference: resolvedCustomer.bankName ? `UMRN-${resolvedCustomer.bankName.slice(0, 4).toUpperCase()}-${Date.now().toString().slice(-6)}` : `UMRN-NACH-${Date.now().toString().slice(-6)}`,
    bankAccountMasked: resolvedCustomer.accountNumberMasked || (resolvedCustomer.accountNumber ? `•••• •••• ${resolvedCustomer.accountNumber.slice(-4)}` : 'Not configured'),
    bankName: resolvedCustomer.bankName || 'Not configured',
    ifscCode: resolvedCustomer.ifscCode || 'Not configured',
    accountHolderName: resolvedCustomer.name,
    preferredDebitDate: 5,
    gracePeriodDays: 3,
    updatedAt: new Date().toISOString(),
    updatedBy: payload.assignedOfficer || 'Operations Officer',
  };

  const newLoan: LoanAccountRecord = {
    id: loanId,
    accountNumber,
    customerId: resolvedCustomer.id,
    customerNumber: resolvedCustomer.customerNumber,
    customerName: resolvedCustomer.name,
    customerMobile: resolvedCustomer.mobile,
    customerEmail: resolvedCustomer.email,
    customerAddress: `${resolvedCustomer.currentAddress?.addressLine1 || ''}, ${resolvedCustomer.currentAddress?.city || ''}`,
    productCode: product.code,
    productName: product.name,
    branchId: branch.id,
    branchName: branch.name,
    assignedOfficer: payload.assignedOfficer || 'Operations Officer',
    assignedOfficerId: 'usr_officer_01',

    originalPrincipal: payload.amount,
    sanctionedAmount: payload.amount,
    disbursedPrincipal: payload.amount,
    principalOutstanding: payload.amount,
    interestOutstanding: 0,
    feeOutstanding: 0,
    penaltyOutstanding: 0,
    totalOutstanding: payload.amount,

    totalPaidAmount: 0,
    totalPrincipalPaid: 0,
    totalInterestPaid: 0,
    totalFeesPaid: 0,

    overdueAmount: 0,
    dpd: 0,
    dpdBucket: 'CURRENT',
    status: 'ACTIVE',

    interestRate: rate,
    interestMethod,
    repaymentFrequency: frequency,
    tenureMonths: tenure,
    totalInstalments: scheduleResult.totalInstalments,
    remainingInstalments: scheduleResult.totalInstalments,
    emiAmount: scheduleResult.emiAmount,

    disbursementDate: startDate,
    loanStartDate: startDate,
    firstDueDate,
    maturityDate: scheduleResult.maturityDate,
    nextDueDate: firstDueDate,

    currentScheduleVersion: 1,
    scheduleVersions: [scheduleResult.version],
    schedules: scheduleResult.schedules,
    repaymentSettings,
    charges: [],
    transactions: [{
      id: `txn_${Date.now()}`,
      loanId,
      accountNumber,
      transactionReference: `DISB-${loanSeq}`,
      transactionType: 'DISBURSEMENT',
      amount: payload.amount,
      principalPortion: payload.amount,
      interestPortion: 0,
      feePortion: 0,
      penaltyPortion: 0,
      status: 'SUCCESSFUL',
      transactionDate: startDate,
      paymentMethod: 'NEFT',
      notes: payload.notes || 'Initial loan disbursement and booking.',
      createdAt: new Date().toISOString(),
      createdBy: payload.assignedOfficer || 'Operations Officer',
    }],
    history: [{
      id: `lh_${Date.now()}`,
      loanId,
      timestamp: new Date().toISOString(),
      action: 'LOAN_BOOKED',
      actor: payload.assignedOfficer || 'Operations Officer',
      actorName: payload.assignedOfficer || 'Operations Officer',
      actorRole: 'Operations Officer',
      newState: 'ACTIVE',
      amount: payload.amount,
      reference: accountNumber,
      reason: 'Direct loan origination and activation.',
      notes: `Loan Account ${accountNumber} booked for ₹${payload.amount.toLocaleString('en-IN')}.`,
    }],

    createdAt: new Date().toISOString(),
    createdBy: payload.assignedOfficer || 'Operations Officer',
    updatedAt: new Date().toISOString(),
  };

  ctx.loanAccounts.unshift(newLoan);

  const customerLoanEntry: CustomerLoanItem = {
    id: newLoan.id,
    accountNumber: newLoan.accountNumber,
    customerId: newLoan.customerId,
    customerName: newLoan.customerName,
    applicationNumber: newLoan.applicationNumber || '',
    productCode: newLoan.productCode,
    productName: newLoan.productName,
    originalPrincipal: newLoan.originalPrincipal,
    outstandingPrincipal: newLoan.principalOutstanding,
    interestRate: newLoan.interestRate,
    emiAmount: newLoan.emiAmount,
    disbursementDate: newLoan.disbursementDate,
    nextDueDate: newLoan.nextDueDate,
    dpd: newLoan.dpd,
    overdueAmount: newLoan.overdueAmount,
    totalTenureMonths: newLoan.tenureMonths,
    remainingTenureMonths: newLoan.remainingInstalments,
    status: newLoan.status,
    branchName: newLoan.branchName,
  };
  ctx.customerLoans.unshift(customerLoanEntry);

  ctx.syncApi('/api/loans', 'POST', newLoan);
  ctx.notify();
  return newLoan;
}

export function getLoanAccounts(ctx: LMSStoreContext): LoanAccountRecord[] {
  return ctx.loanAccounts;
}

export function getLoanAccountById(ctx: LMSStoreContext, id: string): LoanAccountRecord | undefined {
  return ctx.loanAccounts.find((l) => l.id === id || l.accountNumber === id);
}

export function getLoanAccountByApplicationId(ctx: LMSStoreContext, appId: string): LoanAccountRecord | undefined {
  return ctx.loanAccounts.find(
    (l) => l.applicationId === appId || l.applicationNumber === appId
  );
}

export function getLoanAccountBySanctionId(ctx: LMSStoreContext, sanctionId: string): LoanAccountRecord | undefined {
  return ctx.loanAccounts.find(
    (l) => l.sanctionId === sanctionId || l.sanctionNumber === sanctionId
  );
}

export function getLoanAccountByDisbursementId(ctx: LMSStoreContext, disbId: string): LoanAccountRecord | undefined {
  return ctx.loanAccounts.find(
    (l) => l.primaryDisbursementId === disbId || l.primaryDisbursementNumber === disbId
  );
}

export function getLoanAccountsByCustomerId(ctx: LMSStoreContext, customerId: string): LoanAccountRecord[] {
  return ctx.loanAccounts.filter(
    (l) => l.customerId === customerId || l.customerNumber === customerId
  );
}

export function generateScheduleVersion(
  ctx: LMSStoreContext,
  loanId: string,
  reason: string,
  customTerms?: { annualRate?: number; tenureMonths?: number; frequency?: LoanRepaymentFrequency },
  actorName: string = 'Operations Officer',
  actorRole: string = 'Operations Manager'
): RepaymentScheduleVersion {
  const loan = ctx.loanAccounts.find((l) => l.id === loanId);
  if (!loan) throw new Error('Loan account not found.');

  const newVersionNumber = (loan.currentScheduleVersion || 1) + 1;
  const rate = customTerms?.annualRate !== undefined ? customTerms.annualRate : loan.interestRate;
  const tenure = customTerms?.tenureMonths !== undefined ? customTerms.tenureMonths : loan.remainingInstalments;
  const frequency = customTerms?.frequency || loan.repaymentFrequency;

  // Mark previous active versions as SUPERSEDED
  if (loan.scheduleVersions) {
    loan.scheduleVersions.forEach((v) => {
      if (v.status === 'ACTIVE') v.status = 'SUPERSEDED';
    });
  }

  const startDate = new Date().toISOString().split('T')[0];
  const firstDueDateObj = new Date();
  firstDueDateObj.setDate(firstDueDateObj.getDate() + 30);
  const firstDueDate = firstDueDateObj.toISOString().split('T')[0];

  const result = generateRepaymentSchedule({
    loanId: loan.id,
    versionNumber: newVersionNumber,
    reason,
    principal: loan.principalOutstanding,
    annualRate: rate,
    tenureMonths: tenure,
    frequency,
    interestMethod: loan.interestMethod,
    startDate,
    firstDueDate,
    createdBy: actorName,
  });

  loan.currentScheduleVersion = newVersionNumber;
  loan.scheduleVersions = [result.version, ...(loan.scheduleVersions || [])];
  loan.schedules = result.schedules;
  loan.emiAmount = result.emiAmount;
  loan.interestRate = rate;
  loan.repaymentFrequency = frequency;
  loan.remainingInstalments = result.totalInstalments;
  loan.maturityDate = result.maturityDate;
  loan.updatedAt = new Date().toISOString();
  loan.updatedBy = actorName;

  // Audit log
  const historyEntry: LoanHistoryItem = {
    id: `lh_${Date.now()}`,
    loanId: loan.id,
    timestamp: new Date().toISOString(),
    action: 'SCHEDULE_VERSION_GENERATED',
    actor: actorName,
    actorName,
    actorRole,
    previousState: `Version ${newVersionNumber - 1}`,
    newState: `Version ${newVersionNumber}`,
    reason,
    notes: `New Repayment Schedule Version ${newVersionNumber} generated and activated. Reason: ${reason}`,
  };
  loan.history = [historyEntry, ...(loan.history || [])];

  ctx.notify();
  ctx.syncApi(`/api/loans/${loan.id}/schedule`, 'POST', { version: result.version, reason });
  return result.version;
}

export function updateRepaymentSettings(
  ctx: LMSStoreContext,
  loanId: string,
  updates: Partial<LoanRepaymentSettings>,
  actorName: string = 'Operations Officer',
  actorRole: string = 'Operations Officer'
): LoanRepaymentSettings {
  const loan = ctx.loanAccounts.find((l) => l.id === loanId);
  if (!loan) throw new Error('Loan account not found.');

  loan.repaymentSettings = {
    ...loan.repaymentSettings,
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: actorName,
  };
  loan.updatedAt = new Date().toISOString();

  const historyEntry: LoanHistoryItem = {
    id: `lh_${Date.now()}`,
    loanId: loan.id,
    timestamp: new Date().toISOString(),
    action: 'REPAYMENT_SETTINGS_UPDATED',
    actor: actorName,
    actorName,
    actorRole,
    notes: `Repayment settings updated: Method: ${loan.repaymentSettings.paymentMethod}, Debit Day: ${loan.repaymentSettings.preferredDebitDate}, Mandate: ${loan.repaymentSettings.mandateStatus}`,
  };
  loan.history = [historyEntry, ...(loan.history || [])];

  ctx.notify();
  ctx.syncApi(`/api/loans/${loan.id}/repayment-setup`, 'PUT', loan.repaymentSettings);
  return loan.repaymentSettings;
}

export function addLoanCharge(
  ctx: LMSStoreContext,
  loanId: string,
  charge: Omit<LoanChargeItem, 'id' | 'loanId' | 'createdAt' | 'createdBy'>,
  actorName: string = 'Operations Officer',
  actorRole: string = 'Operations Officer'
): LoanChargeItem {
  const loan = ctx.loanAccounts.find((l) => l.id === loanId);
  if (!loan) throw new Error('Loan account not found.');

  const newCharge: LoanChargeItem = {
    ...charge,
    id: `lc_${Date.now()}`,
    loanId: loan.id,
    createdAt: new Date().toISOString(),
    createdBy: actorName,
  };

  loan.charges = [newCharge, ...(loan.charges || [])];
  if (newCharge.chargeTiming === 'ORIGINATION_CAPITALIZED') {
    loan.principalOutstanding = roundMoney(loan.principalOutstanding + newCharge.totalAmount);
    loan.totalOutstanding = roundMoney(loan.totalOutstanding + newCharge.totalAmount);
  } else if (newCharge.status === 'PENDING') {
    loan.feeOutstanding = roundMoney(loan.feeOutstanding + newCharge.totalAmount);
    loan.totalOutstanding = roundMoney(loan.totalOutstanding + newCharge.totalAmount);
  }
  loan.updatedAt = new Date().toISOString();

  const historyEntry: LoanHistoryItem = {
    id: `lh_${Date.now()}`,
    loanId: loan.id,
    timestamp: new Date().toISOString(),
    action: 'CHARGE_LEVIED',
    actor: actorName,
    actorName,
    actorRole,
    amount: newCharge.totalAmount,
    reference: newCharge.chargeCode,
    notes: `Charge "${newCharge.chargeName}" of ₹${newCharge.totalAmount.toLocaleString('en-IN')} levied to account.`,
  };
  loan.history = [historyEntry, ...(loan.history || [])];

  ctx.notify();
  ctx.syncApi(`/api/loans/${loan.id}/charges`, 'POST', newCharge);
  return newCharge;
}

export function getPayments(ctx: LMSStoreContext, filters?: PaymentFilterState): PaymentRecord[] {
  let result = [...ctx.payments];
  if (!filters) return result;

  if (filters.status && filters.status !== 'ALL') {
    result = result.filter((p) => p.status === filters.status);
  }
  if (filters.paymentMethod && filters.paymentMethod !== 'ALL') {
    result = result.filter((p) => p.paymentMethod === filters.paymentMethod);
  }
  if (filters.branchId && filters.branchId !== 'ALL') {
    result = result.filter((p) => p.branchId === filters.branchId);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase().trim();
    result = result.filter(
      (p) =>
        p.paymentNumber.toLowerCase().includes(q) ||
        p.accountNumber.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        (p.referenceNumber && p.referenceNumber.toLowerCase().includes(q)) ||
        (p.receiptNumber && p.receiptNumber.toLowerCase().includes(q))
    );
  }
  if (filters.dateFrom) {
    result = result.filter((p) => p.paymentDate >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    result = result.filter((p) => p.paymentDate <= filters.dateTo!);
  }
  if (filters.minAmount !== undefined) {
    result = result.filter((p) => p.amount >= filters.minAmount!);
  }
  if (filters.maxAmount !== undefined) {
    result = result.filter((p) => p.amount <= filters.maxAmount!);
  }

  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getPaymentById(ctx: LMSStoreContext, id: string): PaymentRecord | undefined {
  return ctx.payments.find((p) => p.id === id || p.paymentNumber === id);
}

export function getPaymentsByLoanId(ctx: LMSStoreContext, loanId: string): PaymentRecord[] {
  return ctx.payments
    .filter((p) => p.loanId === loanId || p.accountNumber === loanId)
    .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
}

export function getUnallocatedPayments(ctx: LMSStoreContext): UnallocatedPaymentRecord[] {
  return ctx.unallocatedPayments.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function recordPayment(
  ctx: LMSStoreContext,
  payload: RecordPaymentPayload,
  actorName: string = 'Operations Officer',
  actorRole: string = 'Operations Officer'
): PaymentRecord {
  const loan = ctx.loanAccounts.find((l) => l.id === payload.loanId || l.accountNumber === payload.loanId);
  if (!loan) {
    throw new Error(`Loan account (${payload.loanId}) not found.`);
  }

  if (loan.status === 'CANCELLED') {
    throw new Error('Cannot record payment for a cancelled loan account.');
  }

  if (payload.amount <= 0) {
    throw new Error('Payment amount must be strictly greater than zero.');
  }

  // Idempotency / Duplicate Reference check
  if (payload.idempotencyKey) {
    const existing = ctx.payments.find((p) => p.idempotencyKey === payload.idempotencyKey);
    if (existing) {
      return existing;
    }
  }

  if (payload.referenceNumber && payload.referenceNumber.trim() !== '') {
    const duplicateRef = ctx.payments.find(
      (p) =>
        p.referenceNumber === payload.referenceNumber &&
        p.paymentMethod === payload.paymentMethod &&
        p.status !== 'CANCELLED' &&
        p.status !== 'FAILED' &&
        p.status !== 'REVERSED'
    );
    if (duplicateRef) {
      throw new Error(
        `A payment with reference number "${payload.referenceNumber}" already exists (${duplicateRef.paymentNumber}).`
      );
    }
  }

  const paymentSeq = ctx.nextPaymentSeq++;
  const paymentNumber = `PAY-${new Date().getFullYear()}-${String(paymentSeq).padStart(6, '0')}`;
  const paymentId = `pay_${Date.now()}`;

  const newPayment: PaymentRecord = {
    id: paymentId,
    paymentNumber,
    loanId: loan.id,
    accountNumber: loan.accountNumber,
    customerId: loan.customerId,
    customerNumber: loan.customerNumber,
    customerName: loan.customerName,
    customerMobile: loan.customerMobile,
    branchId: loan.branchId,
    branchName: loan.branchName,
    amount: roundMoney(payload.amount),
    allocatedAmount: 0,
    unallocatedAmount: 0,
    paymentDate: payload.paymentDate || new Date().toISOString().split('T')[0],
    valueDate: payload.valueDate || payload.paymentDate || new Date().toISOString().split('T')[0],
    paymentMethod: payload.paymentMethod,
    referenceNumber: payload.referenceNumber,
    bankName: payload.bankName,
    channel: payload.channel,
    status: payload.requireVerification ? 'PENDING_VERIFICATION' : 'RECEIVED',
    idempotencyKey: payload.idempotencyKey,
    notes: payload.notes,
    supportingDocument: payload.supportingDocument,
    receivedBy: actorName,
    receivedByName: actorName,
    allocations: [],
    history: [
      {
        id: `ph_rec_${paymentId}`,
        paymentId,
        timestamp: new Date().toISOString(),
        event: 'RECEIVED',
        actor: actorName,
        actorName,
        actorRole,
        previousState: 'NONE',
        newState: payload.requireVerification ? 'PENDING_VERIFICATION' : 'RECEIVED',
        amount: payload.amount,
        reference: payload.referenceNumber,
        notes: `Payment of ₹${payload.amount.toLocaleString('en-IN')} recorded via ${payload.paymentMethod}.`,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  ctx.payments = [newPayment, ...ctx.payments];

  // If verification is not required, immediately post & allocate
  if (!payload.requireVerification) {
    return postPayment(ctx, newPayment.id, actorName, actorRole);
  }

  ctx.notify();
  ctx.syncApi('/api/repayments', 'POST', newPayment);
  return newPayment;
}

export function verifyPayment(
  ctx: LMSStoreContext,
  paymentId: string,
  actorName: string = 'Branch Manager',
  actorRole: string = 'Branch Manager'
): PaymentRecord {
  const payment = ctx.payments.find((p) => p.id === paymentId);
  if (!payment) throw new Error('Payment record not found.');

  if (payment.status !== 'PENDING_VERIFICATION' && payment.status !== 'RECEIVED') {
    throw new Error(`Payment is in ${payment.status} status and cannot be verified.`);
  }

  // Maker-checker rule: Creator cannot verify
  if (payment.receivedBy === actorName) {
    throw new Error(
      'Segregation of Duties Violation: The user who created/received the payment cannot verify it.'
    );
  }

  payment.status = 'VERIFIED';
  payment.verifiedBy = actorName;
  payment.verifiedByName = actorName;
  payment.verifiedAt = new Date().toISOString();
  payment.updatedAt = new Date().toISOString();

  const historyEntry: PaymentHistoryRecord = {
    id: `ph_ver_${payment.id}_${Date.now()}`,
    paymentId: payment.id,
    timestamp: new Date().toISOString(),
    event: 'VERIFIED',
    actor: actorName,
    actorName,
    actorRole,
    previousState: 'PENDING_VERIFICATION',
    newState: 'VERIFIED',
    amount: payment.amount,
    notes: `Payment verified by ${actorName} (${actorRole}).`,
  };
  payment.history = [historyEntry, ...payment.history];

  ctx.notify();
  ctx.syncApi(`/api/repayments/${payment.id}/verify`, 'POST', { actorName, actorRole });
  return payment;
}

export function postPayment(
  ctx: LMSStoreContext,
  paymentId: string,
  actorName: string = 'Operations Officer',
  actorRole: string = 'Operations Officer'
): PaymentRecord {
  const payment = ctx.payments.find((p) => p.id === paymentId);
  if (!payment) throw new Error('Payment record not found.');

  if (payment.status === 'POSTED' || payment.status === 'FULLY_ALLOCATED' || payment.status === 'PARTIALLY_ALLOCATED') {
    throw new Error('This payment has already been posted.');
  }

  if (payment.status === 'REVERSED' || payment.status === 'CANCELLED') {
    throw new Error(`Cannot post payment with status ${payment.status}.`);
  }

  const loan = ctx.loanAccounts.find((l) => l.id === payment.loanId);
  if (!loan) throw new Error('Associated loan account not found.');

  // Execute core financial allocation engine
  const allocResult = executePaymentAllocation({
    loan,
    payment,
    actorName,
    actorRole,
  });

  // Update loan account in store
  Object.assign(loan, allocResult.updatedLoan);
  loan.schedules = allocResult.updatedSchedules;
  loan.charges = allocResult.updatedCharges;
  loan.transactions = [allocResult.repaymentTransaction, ...(loan.transactions || [])];
  loan.history = [allocResult.loanHistoryEntry, ...(loan.history || [])];

  // Generate Official Receipt
  const receiptNumber = `RCT-${new Date().getFullYear()}-${String(payment.paymentNumber.split('-')[2] || Math.floor(100000 + Math.random() * 900000))}`;
  const receipt: PaymentReceiptRecord = {
    id: `rct_${payment.id}`,
    receiptNumber,
    paymentId: payment.id,
    loanId: loan.id,
    accountNumber: loan.accountNumber,
    customerId: loan.customerId,
    customerName: loan.customerName,
    customerNumber: loan.customerNumber,
    amount: payment.amount,
    paymentDate: payment.paymentDate,
    valueDate: payment.valueDate,
    paymentMethod: payment.paymentMethod,
    referenceNumber: payment.referenceNumber,
    allocationSummary: allocResult.receiptSummary,
    postPaymentBalances: {
      remainingPrincipal: loan.principalOutstanding,
      totalOutstanding: loan.totalOutstanding,
      nextDueDate: loan.nextDueDate,
    },
    generatedAt: new Date().toISOString(),
    generatedBy: actorName,
  };

  // Update Payment
  payment.status = allocResult.unallocatedAmount > 0 && allocResult.allocatedAmount > 0 ? 'PARTIALLY_ALLOCATED' : 'POSTED';
  payment.allocatedAmount = allocResult.allocatedAmount;
  payment.unallocatedAmount = allocResult.unallocatedAmount;
  payment.postingDate = new Date().toISOString();
  payment.postedBy = actorName;
  payment.postedByName = actorName;
  payment.postedAt = new Date().toISOString();
  payment.receiptNumber = receiptNumber;
  payment.receipt = receipt;
  payment.allocations = allocResult.allocations;
  payment.history = [allocResult.paymentHistoryEntry, ...payment.history];
  payment.updatedAt = new Date().toISOString();

  if (allocResult.unallocatedRecord) {
    ctx.unallocatedPayments = [allocResult.unallocatedRecord, ...ctx.unallocatedPayments];
  }

  ctx.notify();
  ctx.syncApi(`/api/repayments/${payment.id}/post`, 'POST', {
    payment,
    allocations: allocResult.allocations,
    receipt,
    unallocated: allocResult.unallocatedRecord,
    loanUpdates: allocResult.updatedLoan,
  });

  return payment;
}

export function reversePayment(
  ctx: LMSStoreContext,
  paymentId: string,
  reason: string,
  notes?: string,
  actorName: string = 'Branch Manager',
  actorRole: string = 'Branch Manager'
): PaymentRecord {
  const payment = ctx.payments.find((p) => p.id === paymentId);
  if (!payment) throw new Error('Payment record not found.');

  const loan = ctx.loanAccounts.find((l) => l.id === payment.loanId);
  if (!loan) throw new Error('Associated loan account not found.');

  const reversalResult = executePaymentReversal({
    payment,
    loan,
    reason,
    notes,
    actorName,
    actorRole,
  });

  // Update loan
  Object.assign(loan, reversalResult.updatedLoan);
  loan.schedules = reversalResult.updatedSchedules;
  loan.charges = reversalResult.updatedCharges;
  loan.transactions = [reversalResult.compensatingTransaction, ...(loan.transactions || [])];
  loan.history = [reversalResult.loanHistoryEntry, ...(loan.history || [])];

  // Update payment
  payment.status = 'REVERSED';
  payment.reversedBy = actorName;
  payment.reversedByName = actorName;
  payment.reversedAt = new Date().toISOString();
  payment.reversalReason = reason;
  payment.reversal = reversalResult.reversalRecord;
  payment.allocations = reversalResult.updatedAllocations;
  payment.history = [reversalResult.paymentHistoryEntry, ...payment.history];
  payment.updatedAt = new Date().toISOString();

  ctx.notify();
  ctx.syncApi(`/api/repayments/${payment.id}/reverse`, 'POST', {
    reversal: reversalResult.reversalRecord,
    reason,
    notes,
    actorName,
    actorRole,
  });

  return payment;
}

export function getReceiptByPaymentId(ctx: LMSStoreContext, paymentId: string): PaymentReceiptRecord | undefined {
  const payment = ctx.payments.find((p) => p.id === paymentId || p.paymentNumber === paymentId);
  return payment?.receipt;
}

export function resolveUnallocatedPayment(
  ctx: LMSStoreContext,
  unallocId: string,
  action: 'REFUND' | 'ALLOCATE_ADVANCE',
  actorName: string = 'Operations Officer',
  actorRole: string = 'Operations Officer'
): UnallocatedPaymentRecord {
  const unalloc = ctx.unallocatedPayments.find((u) => u.id === unallocId);
  if (!unalloc) throw new Error('Unallocated payment record not found.');

  if (unalloc.status !== 'UNALLOCATED' && unalloc.status !== 'PARTIALLY_ALLOCATED') {
    throw new Error(`Record already in ${unalloc.status} status.`);
  }

  if (action === 'REFUND') {
    unalloc.status = 'REFUNDED';
    unalloc.resolvedAt = new Date().toISOString();
    unalloc.resolvedBy = actorName;
    unalloc.updatedAt = new Date().toISOString();
  } else {
    unalloc.status = 'FULLY_ALLOCATED';
    unalloc.allocatedAmount = unalloc.totalAmount;
    unalloc.remainingAmount = 0;
    unalloc.resolvedAt = new Date().toISOString();
    unalloc.resolvedBy = actorName;
    unalloc.updatedAt = new Date().toISOString();
  }

  ctx.notify();
  ctx.syncApi('/api/repayments/unallocated', 'POST', { unallocId, action, actorName, actorRole });
  return unalloc;
}

export function getRepaymentKPIs(ctx: LMSStoreContext) {
  let totalCollected = 0;
  let totalAllocated = 0;
  let totalUnallocated = 0;
  let postedCount = 0;
  let pendingVerificationCount = 0;
  let pendingVerificationAmount = 0;
  let reversedCount = 0;
  let reversedAmount = 0;

  ctx.payments.forEach((p) => {
    if (p.status === 'POSTED' || p.status === 'FULLY_ALLOCATED' || p.status === 'PARTIALLY_ALLOCATED') {
      totalCollected = roundMoney(totalCollected + p.amount);
      totalAllocated = roundMoney(totalAllocated + p.allocatedAmount);
      totalUnallocated = roundMoney(totalUnallocated + p.unallocatedAmount);
      postedCount++;
    } else if (p.status === 'PENDING_VERIFICATION' || p.status === 'RECEIVED') {
      pendingVerificationCount++;
      pendingVerificationAmount = roundMoney(pendingVerificationAmount + p.amount);
    } else if (p.status === 'REVERSED') {
      reversedCount++;
      reversedAmount = roundMoney(reversedAmount + p.amount);
    }
  });

  return {
    totalCollected,
    totalAllocated,
    totalUnallocated,
    postedCount,
    pendingVerificationCount,
    pendingVerificationAmount,
    reversedCount,
    reversedAmount,
  };
}
