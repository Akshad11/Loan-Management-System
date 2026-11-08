import React, { useState, useMemo } from 'react';
import {
  FileText,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  Edit2,
  XCircle,
  Clock,
  Briefcase,
  Building2,
  Calendar,
  IndianRupee,
  Layers,
  History,
  Landmark,
  CreditCard,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { Drawer } from '../shared/Drawer';
import { Tabs } from '../shared/Tabs';
import {
  LoanApplicationRecord,
  LoanProductConfig,
  CoApplicantRelationship,
  GuarantorRelationship,
  SubmissionDeclarationState,
} from '../../types/applicationTypes';
import { CustomerRecord, Branch, DocumentItem } from '../../types';
import { ApplicationStatusBadge, ApplicationPriorityBadge } from './ApplicationStatusBadge';
import { ApplicantSummaryCard } from './ApplicantSummaryCard';
import { CoApplicantManager } from './CoApplicantManager';
import { GuarantorManager } from './GuarantorManager';
import { ApplicationDocumentManager } from './ApplicationDocumentManager';
import { ApplicationSubmissionModal } from './ApplicationSubmissionModal';
import { ApplicationCancelModal } from './ApplicationCancelModal';
import { ApplicationTimeline } from './ApplicationTimeline';
import { formatCurrencyINR } from '../../utils/formatters';
import { useMockStore } from '../../services/mockService';
import { DynamicFormRenderer } from '../forms/DynamicFormRenderer';
import { HOME_LOAN_FORM_SCHEMA } from '../../config/systemTemplates';
import { BureauAnalysisTab } from '../bureau/BureauAnalysisTab';
import { CollateralTab } from '../collateral/CollateralTab';
import { Scale } from 'lucide-react';
import { CreditReviewWorkbench } from '../credit/CreditReviewWorkbench';

interface ApplicationDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  application: LoanApplicationRecord | null;
  products: LoanProductConfig[];
  allCustomers: CustomerRecord[];
  branches: Branch[];
  customerVaultDocuments?: DocumentItem[];
  onEditTerms: (app: LoanApplicationRecord) => void;
  onAddCoApplicant: (appId: string, payload: { customerId: string; relationship: CoApplicantRelationship; notes?: string }) => void;
  onRemoveCoApplicant: (appId: string, coAppId: string) => void;
  onAddGuarantor: (appId: string, payload: { customerId: string; relationship: GuarantorRelationship; guaranteeType: 'INDIVIDUAL' | 'BUSINESS'; netWorthEstimated?: number; notes?: string }) => void;
  onRemoveGuarantor: (appId: string, guarantorId: string) => void;
  onUploadDocument: (appId: string, payload: any) => void;
  onLinkKycDocument: (appId: string, docType: string, vaultDocId: string) => void;
  onVerifyDocument: (appId: string, docId: string, notes?: string) => void;
  onRejectDocument: (appId: string, docId: string, reason: string) => void;
  onRemoveDocument: (appId: string, docId: string) => void;
  onSubmitApplication: (appId: string, declarations: SubmissionDeclarationState) => void;
  onCancelApplication: (appId: string, reason: string) => void;
  onViewCustomerProfile?: (customerId: string) => void;
  validateForSubmission: (appId: string) => any;
  canEdit?: boolean;
  canManageParties?: boolean;
  canUploadDocs?: boolean;
  canVerifyDocs?: boolean;
  canSubmit?: boolean;
  canCancel?: boolean;
}

export const ApplicationDetailsDrawer: React.FC<ApplicationDetailsDrawerProps> = ({
  isOpen,
  onClose,
  application,
  products,
  allCustomers,
  branches,
  customerVaultDocuments = [],
  onEditTerms,
  onAddCoApplicant,
  onRemoveCoApplicant,
  onAddGuarantor,
  onRemoveGuarantor,
  onUploadDocument,
  onLinkKycDocument,
  onVerifyDocument,
  onRejectDocument,
  onRemoveDocument,
  onSubmitApplication,
  onCancelApplication,
  onViewCustomerProfile,
  validateForSubmission,
  canEdit = true,
  canManageParties = true,
  canUploadDocs = true,
  canVerifyDocs = true,
  canSubmit = true,
  canCancel = true,
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const store = useMockStore();

  if (!application) return null;

  const isDraft = application.status === 'DRAFT';
  const validationResult = validateForSubmission(application.id);

  // Identify matching customer master record
  const currentCustomer = useMemo(() => {
    if (!application) return null;
    return (
      allCustomers.find(
        (c) => c.id === application.customerId || c.customerNumber === application.customerNumber
      ) || null
    );
  }, [allCustomers, application]);

  // Clean and auto-fill customer profile credentials into form schema fields
  const customerAutoFilledResponses = useMemo(() => {
    if (!application) return {};

    // 1. Clean PAN number: if masked e.g. "ABCDE••••F", format valid matching digits
    let pan = currentCustomer?.panMasked || 'ABCDE1001F';
    if (pan.includes('•') || pan.includes('*')) {
      const numDigits = (currentCustomer?.customerNumber || '1001').replace(/\D/g, '').slice(-4).padStart(4, '0');
      pan = pan.replace(/[•*]+/g, numDigits);
    }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
      pan = 'ABCDE1001F';
    }

    // 2. Clean mobile number to exactly 10 digits
    let mobileDigits = (currentCustomer?.mobile || application.customerMobile || '').replace(/\D/g, '').slice(-10);
    if (!/^[6-9][0-9]{9}$/.test(mobileDigits)) {
      mobileDigits = '9876501003';
    }

    // 3. Format address string
    let formattedAddress = '';
    const addr = currentCustomer?.currentAddress as any;
    if (typeof addr === 'string' && addr.trim().length >= 10) {
      formattedAddress = addr;
    } else if (addr && typeof addr === 'object') {
      const parts = [
        addr.addressLine1 || addr.line1 || addr.street,
        addr.addressLine2 || addr.line2,
        addr.city,
        addr.state,
        addr.pinCode || addr.pincode ? `PIN: ${addr.pinCode || addr.pincode}` : '',
      ].filter(Boolean);
      formattedAddress = parts.join(', ');
    }
    if (!formattedAddress || formattedAddress.trim().length < 10) {
      formattedAddress = `${currentCustomer?.branchName || 'Panaji Head Office'}, Goa, India - 403001`;
    }

    // 4. Map marital status
    let maritalStatus = 'Married';
    if (currentCustomer?.maritalStatus) {
      const ms = String(currentCustomer.maritalStatus).toUpperCase();
      if (ms === 'SINGLE') maritalStatus = 'Single';
      else if (ms === 'DIVORCED') maritalStatus = 'Divorced';
      else if (ms === 'WIDOWED') maritalStatus = 'Widowed';
      else maritalStatus = 'Married';
    }

    // 5. Map employment type
    let employmentType = 'Salaried';
    const empType = String(currentCustomer?.employmentType || application.customerEmploymentType || '').toUpperCase();
    if (empType.includes('SELF') || empType.includes('PROFESSIONAL')) {
      employmentType = 'Self Employed Professional';
    } else if (empType.includes('BUSINESS')) {
      employmentType = 'Business Owner';
    } else if (empType.includes('RETIRED')) {
      employmentType = 'Retired';
    } else {
      employmentType = 'Salaried';
    }

    return {
      applicant_full_name: currentCustomer?.name || application.customerName,
      applicant_dob: currentCustomer?.dateOfBirth || '1990-01-01',
      applicant_pan: pan,
      applicant_mobile: mobileDigits,
      applicant_email: currentCustomer?.email || 'applicant@fintechlms.com',
      marital_status: maritalStatus,
      current_address: formattedAddress,
      employment_type: employmentType,
      employer_name: currentCustomer?.employerName || (currentCustomer as any)?.occupation || 'Tech Solutions Pvt Ltd',
      monthly_net_income: currentCustomer?.monthlyIncome || Number(application.customerMonthlyIncome) || 75000,
      existing_monthly_emis: currentCustomer?.totalOverdue || 0,
      property_type: 'Apartment / Flat',
      property_stage: 'Ready to Move',
      property_cost: Math.round(Number(application.requestedAmount) * 1.25),
      requested_loan_amount: Number(application.requestedAmount),
      has_coapplicant: application.coApplicants && application.coApplicants.length > 0 ? 'Yes' : 'No',
      coapplicant_name: application.coApplicants?.[0]?.customerName || '',
      coapplicant_income: Number(application.coApplicants?.[0]?.monthlyIncome || 0),
      doc_pan_card: 'pan_card_verified.pdf',
      doc_salary_slips: 'salary_slips_last_3m.pdf',
      doc_property_agreement: 'property_agreement_draft.pdf',
      decl_terms: true,
      decl_cibil_consent: true,
      purpose: application.purpose || 'Home purchase and interior improvement',
    };
  }, [application, currentCustomer]);

  // Retrieve any draft or final response previously saved
  const existingSavedResponse = store.getApplicationFormResponse?.(application.id);

  // Merged initial responses
  const formInitialResponses = useMemo(() => {
    return {
      ...customerAutoFilledResponses,
      ...(existingSavedResponse?.responses || {}),
    };
  }, [customerAutoFilledResponses, existingSavedResponse]);

  const formInitialSignatures = useMemo(() => {
    return existingSavedResponse?.signatures || {};
  }, [existingSavedResponse]);

  // EMI Estimate
  const monthlyRate = application.interestRate / 12 / 100;
  const estimatedEMI = Math.round(
    (application.requestedAmount *
      monthlyRate *
      Math.pow(1 + monthlyRate, application.requestedTenureMonths)) /
      (Math.pow(1 + monthlyRate, application.requestedTenureMonths) - 1)
  );

  const tabs = [
    {
      id: 'overview',
      label: 'Terms & Applicant',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'custom_form',
      label: 'Product Application Form',
      icon: <Layers className="w-4 h-4" />,
    },
    {
      id: 'parties',
      label: `Parties (${application.coApplicants.length + application.guarantors.length})`,
      icon: <Users className="w-4 h-4" />,
    },
    {
      id: 'bureau',
      label: 'Bureau Analysis',
      icon: <CreditCard className="w-4 h-4" />,
    },
    {
      id: 'collateral',
      label: 'Collateral & Security',
      icon: <Shield className="w-4 h-4" />,
    },
    {
      id: 'documents',
      label: `Documents (${application.documents.length})`,
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
    {
      id: 'credit_workbench',
      label: 'Credit Workbench',
      icon: <Scale className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'submission',
      label: 'Validation & Audit',
      icon: <History className="w-4 h-4" />,
    },
  ];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <span className="font-mono text-base font-bold text-slate-900">
            {application.applicationNumber}
          </span>
          <ApplicationStatusBadge status={application.status} size="sm" />
          <ApplicationPriorityBadge priority={application.priority} />
        </div>
      }
      size="3xl"
    >
      <div className="space-y-6">
        {/* TOP SUMMARY BAR */}
        <div className="bg-slate-900 text-white rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div>
            <div className="text-xs text-slate-400 font-medium">Primary Borrower</div>
            <div className="text-lg font-bold text-white flex items-center gap-2">
              {application.customerName}
              <span className="text-xs font-mono text-slate-400 bg-white/10 px-2 py-0.5 rounded">
                {application.customerNumber}
              </span>
            </div>
            <div className="text-xs text-slate-300 mt-1 flex items-center gap-3">
              <span>{application.productName}</span>
              <span>•</span>
              <span>Branch: {application.branchName}</span>
              <span>•</span>
              <span>Officer: {application.loanOfficer}</span>
            </div>
          </div>

          <div className="flex flex-col md:items-end">
            <div className="text-xs text-slate-400 font-medium">Requested Capital</div>
            <div className="text-2xl font-bold font-mono text-amber-400">
              {formatCurrencyINR(application.requestedAmount)}
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              {application.requestedTenureMonths} Months @ {application.interestRate}% p.a.
            </div>
          </div>
        </div>

        {/* WORKFLOW ACTION BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-xs text-slate-600">
            {(() => {
              switch (application.status) {
                case 'DRAFT':
                  return (
                    <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Application in <strong>Draft Stage</strong>. Complete checklist & parties prior to submission.
                    </span>
                  );
                case 'SUBMITTED':
                  return (
                    <span className="flex items-center gap-1.5 text-blue-700 font-medium">
                      <Send className="w-4 h-4 text-blue-600" />
                      Application <strong>Submitted</strong> and currently queued for credit underwriting review.
                    </span>
                  );
                case 'UNDER_REVIEW':
                case 'CREDIT_ASSESSMENT':
                  return (
                    <span className="flex items-center gap-1.5 text-indigo-700 font-medium">
                      <Scale className="w-4 h-4 text-indigo-600" />
                      Under <strong>Credit Underwriting</strong>. Bureau scoring and financial eligibility assessment in progress.
                    </span>
                  );
                case 'DOCUMENT_PENDING':
                  return (
                    <span className="flex items-center gap-1.5 text-yellow-800 font-medium">
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                      Underwriting On Hold: <strong>Additional Documents Required</strong> from applicant.
                    </span>
                  );
                case 'APPROVED':
                  return (
                    <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Credit Appraisal <strong>Approved</strong>. Sanction letter & dossier generated.
                    </span>
                  );
                case 'SANCTIONED':
                  return (
                    <span className="flex items-center gap-1.5 text-teal-800 font-medium">
                      <Landmark className="w-4 h-4 text-teal-700" />
                      Loan <strong>Sanction Confirmed & Accepted</strong>. Active in Pre-Disbursement Readiness.
                    </span>
                  );
                case 'DISBURSED':
                  return (
                    <span className="flex items-center gap-1.5 text-emerald-800 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Loan <strong>Fully Disbursed</strong>. Active account under repayment servicing.
                    </span>
                  );
                case 'REJECTED':
                  return (
                    <span className="flex items-center gap-1.5 text-rose-700 font-medium">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      Application <strong>Rejected</strong> by Credit Committee.
                    </span>
                  );
                case 'CANCELLED':
                  return (
                    <span className="flex items-center gap-1.5 text-neutral-600 font-medium">
                      <XCircle className="w-4 h-4 text-neutral-500" />
                      Application <strong>Cancelled</strong>.
                    </span>
                  );
                default:
                  return (
                    <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                      <FileText className="w-4 h-4 text-slate-500" />
                      Status: <strong>{application.status}</strong>
                    </span>
                  );
              }
            })()}
          </div>

          <div className="flex items-center gap-2">
            {isDraft && canEdit && (
              <button
                onClick={() => onEditTerms(application)}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md flex items-center gap-1.5 shadow-sm"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Terms
              </button>
            )}

            {isDraft && canSubmit && (
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                Validate & Submit
              </button>
            )}

            {isDraft && canCancel && (
              <button
                onClick={() => setIsCancelModalOpen(true)}
                className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancel App
              </button>
            )}
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* TAB 1: OVERVIEW & TERMS */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* Primary Applicant Card */}
            <ApplicantSummaryCard
              application={application}
              onViewCustomerProfile={onViewCustomerProfile}
              onApproveKyc={(cid) => {
                store.verifyKyc(cid, { verifiedBy: 'Alex Morgan' });
                setFormFeedback({
                  type: 'success',
                  message: 'Applicant KYC verified and approved successfully! Pre-submission diagnostics cleared.',
                });
              }}
            />

            {/* Financial Parameters Detail */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                Requested Loan Parameters & Amortization Terms
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Requested Amount</span>
                  <span className="text-sm font-bold text-slate-900">
                    {formatCurrencyINR(application.requestedAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Requested Tenure</span>
                  <span className="text-sm font-bold text-slate-900">
                    {application.requestedTenureMonths} Months ({(application.requestedTenureMonths / 12).toFixed(1)} yrs)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Base Interest Rate</span>
                  <span className="text-sm font-bold text-slate-900">
                    {application.interestRate}% p.a. Reducing
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Estimated Monthly EMI</span>
                  <span className="text-sm font-bold font-mono text-blue-700">
                    {formatCurrencyINR(estimatedEMI)} / mo
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block">Repayment Frequency</span>
                  <span className="font-semibold text-slate-800">
                    {application.repaymentFrequency}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Preferred Due Date</span>
                  <span className="font-semibold text-slate-800">
                    {application.preferredRepaymentDate || 5}th of month
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Purpose Category</span>
                  <span className="font-semibold text-slate-800">
                    {application.purposeCategory}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Origination Date</span>
                  <span className="font-mono text-slate-800">
                    {application.applicationDate}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <span className="text-slate-500 block text-xs mb-1">Detailed Purpose & End-Use:</span>
                <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-md border border-slate-200">
                  {application.purpose}
                </p>
              </div>

              {application.notes && (
                <div className="pt-2">
                  <span className="text-slate-500 block text-xs mb-1">Underwriter & Origination Notes:</span>
                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-200 italic">
                    {application.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Real Disbursement Status Card */}
            {(() => {
              const dsb = store.getDisbursementByApplicationId(application.id);
              const sanction = store.sanctions.find((s) => s.applicationId === application.id);
              if (!sanction && !dsb) return null;

              const sanctionedAmt = sanction ? sanction.approvedAmount : Number(application.sanctionedAmount || application.requestedAmount);
              const disbursedAmt = dsb ? dsb.totalDisbursedAmount : 0;
              const remainingAmt = dsb ? dsb.remainingAmount : sanctionedAmt;
              const statusText = dsb
                ? dsb.remainingAmount === 0
                  ? 'Fully Disbursed'
                  : dsb.totalDisbursedAmount > 0
                  ? 'Partially Disbursed'
                  : dsb.status
                : 'Pending Disbursement';

              return (
                <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-900">Disbursement & Payout Lifecycle</h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {statusText}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-md border border-slate-200">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Sanctioned</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatCurrencyINR(sanctionedAmt)}
                      </span>
                    </div>
                    <div className="p-2.5 bg-emerald-50/60 rounded-md border border-emerald-200">
                      <span className="text-emerald-700 block text-[10px] uppercase font-bold">Disbursed</span>
                      <span className="font-mono font-bold text-emerald-950">
                        {formatCurrencyINR(disbursedAmt)}
                      </span>
                    </div>
                    <div className="p-2.5 bg-blue-50/60 rounded-md border border-blue-200">
                      <span className="text-blue-700 block text-[10px] uppercase font-bold">Remaining Available</span>
                      <span className="font-mono font-bold text-blue-950">
                        {formatCurrencyINR(remainingAmt)}
                      </span>
                    </div>
                  </div>

                  {dsb && dsb.transactions.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                      Latest Payout: <span className="font-mono font-bold text-slate-800">{dsb.transactions[0].transactionReference}</span> ({dsb.transactions[0].paymentMethod}) • UTR: <span className="font-mono text-slate-700">{dsb.transactions[0].utrNumber || 'N/A'}</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB: CUSTOM PRODUCT APPLICATION FORM */}
        {activeTab === 'custom_form' && (
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold">Dynamic {application.productName} Form</span>
                  <span className="bg-blue-500/30 text-blue-200 text-[10px] font-mono px-2 py-0.5 rounded-full border border-blue-400/30">
                    {application.productCode}
                  </span>
                </div>
                <p className="text-xs text-blue-200 mt-0.5">
                  Multi-page structured form schema configured via Form Builder
                </p>
              </div>
            </div>

            {formFeedback && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between border ${
                  formFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {formFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{formFeedback.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormFeedback(null)}
                  className="text-xs font-bold opacity-60 hover:opacity-100"
                >
                  Dismiss
                </button>
              </div>
            )}

            <DynamicFormRenderer
              schema={HOME_LOAN_FORM_SCHEMA}
              initialResponses={formInitialResponses}
              initialSignatures={formInitialSignatures}
              readOnly={!isDraft}
              onAutoSaveDraft={async (resp, sigs, pageIdx) => {
                if (store.saveDraftFormResponse) {
                  await store.saveDraftFormResponse(application.id, resp, sigs, pageIdx);
                }
              }}
              onSubmitForm={async (resp, sigs) => {
                try {
                  if (store.submitApplicationFormResponse) {
                    await store.submitApplicationFormResponse(application.id, resp, sigs);
                  }
                  setFormFeedback({
                    type: 'success',
                    message: `Application form successfully submitted with verified digital signature for ${application.applicationNumber}! Application status transitioned to SUBMITTED.`,
                  });
                } catch (err: any) {
                  setFormFeedback({
                    type: 'error',
                    message: err?.message || 'Failed to submit form responses. Please check all fields.',
                  });
                }
              }}
            />
          </div>
        )}

        {/* TAB 2: PARTIES (CO-APPLICANTS & GUARANTORS) */}
        {activeTab === 'parties' && (
          <div className="space-y-6">
            <CoApplicantManager
              applicationId={application.id}
              primaryApplicantId={application.customerId}
              primaryApplicantName={application.customerName}
              primaryMonthlyIncome={Number(application.customerMonthlyIncome || 0)}
              coApplicants={application.coApplicants}
              onCoApplicantChange={() => {}}
              onViewBureau={() => setActiveTab('bureau')}
              isDraft={isDraft}
              canManageParties={canManageParties}
            />

            <GuarantorManager
              applicationId={application.id}
              primaryApplicantId={application.customerId}
              guarantors={application.guarantors}
              allCustomers={allCustomers}
              onAddGuarantor={(payload) => onAddGuarantor(application.id, payload)}
              onRemoveGuarantor={(guarId) => onRemoveGuarantor(application.id, guarId)}
              isDraft={isDraft}
              canManageParties={canManageParties}
            />
          </div>
        )}

        {/* TAB: BUREAU ANALYSIS */}
        {activeTab === 'bureau' && (
          <BureauAnalysisTab
            applicationId={application.id}
            primaryApplicant={{
              id: application.customerId,
              name: application.customerName,
              panMasked: (application as any).panMasked || (application as any).customer?.panMasked,
            }}
            coApplicants={application.coApplicants.map((ca: any) => ({
              id: ca.id,
              customerId: ca.customerId,
              customerName: ca.customerName,
              panMasked: ca.panMasked,
              relationship: ca.relationship,
            }))}
            readOnly={!isDraft && (application.status as string) === 'CLOSED'}
          />
        )}

        {/* TAB: COLLATERAL */}
        {activeTab === 'collateral' && (
          <CollateralTab
            applicationId={application.id}
            customerId={application.customerId}
            loanAmount={Number(application.requestedAmount)}
            readOnly={!isDraft && (application.status as string) === 'CLOSED'}
          />
        )}

        {/* TAB 3: DOCUMENTS & CHECKLIST */}
        {activeTab === 'documents' && (
          <div className="space-y-5">
            <ApplicationDocumentManager
              applicationId={application.id}
              documents={application.documents}
              customerVaultDocuments={customerVaultDocuments}
              onUploadDocument={(payload) => onUploadDocument(application.id, payload)}
              onLinkKycDocument={(docType, vaultDocId) => onLinkKycDocument(application.id, docType, vaultDocId)}
              onVerifyDocument={(docId, notes) => onVerifyDocument(application.id, docId, notes)}
              onRejectDocument={(docId, reason) => onRejectDocument(application.id, docId, reason)}
              onRemoveDocument={(docId) => onRemoveDocument(application.id, docId)}
              isDraft={isDraft}
              canUploadDocs={canUploadDocs}
              canVerifyDocs={canVerifyDocs}
            />
          </div>
        )}

        {/* TAB 4: PRE-SUBMISSION VALIDATION & AUDIT HISTORY */}
        {activeTab === 'submission' && (
          <div className="space-y-6">
            {/* Live Pre-submission Diagnostics Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Pre-Submission Validation Diagnostics
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Automated checklist verifying KYC compliance, product caps, and mandatory documentation.
                  </p>
                </div>

                {isDraft && (
                  <button
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Open Submission Gate
                  </button>
                )}
              </div>

              {/* Blockers */}
              {validationResult.blockers.length > 0 ? (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-1.5">
                  <div className="font-bold text-rose-900 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Blocking Issues ({validationResult.blockers.length})
                  </div>
                  <ul className="list-disc pl-5 text-rose-800 space-y-1">
                    {validationResult.blockers.map((b: string, i: number) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <strong>Zero blockers found.</strong> All mandatory KYC and documentation criteria are satisfied.
                </div>
              )}

              {/* Warnings */}
              {validationResult.warnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1">
                  <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Underwriting Advisories:
                  </div>
                  <ul className="list-disc pl-5 text-amber-800 space-y-0.5">
                    {validationResult.warnings.map((w: string, i: number) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Application Lifecycle Timeline */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-600" />
                Application Lifecycle & Audit Trail
              </h3>
              <ApplicationTimeline history={application.history || (store.applicationHistory && store.applicationHistory[application.id]) || []} />
            </div>
          </div>
        )}

        {/* Credit Review Workbench Tab */}
        {activeTab === 'credit_workbench' && (
          <div className="py-2">
            <CreditReviewWorkbench applicationId={application.id} initialApplication={application} />
          </div>
        )}
      </div>

      {/* Submission Modal */}
      {isSubmitModalOpen && (
        <ApplicationSubmissionModal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          application={application}
          validationResult={validationResult}
          onSubmit={(declarations) => onSubmitApplication(application.id, declarations)}
        />
      )}

      {/* Cancellation Modal */}
      {isCancelModalOpen && (
        <ApplicationCancelModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          application={application}
          onConfirmCancel={(reason) => onCancelApplication(application.id, reason)}
        />
      )}
    </Drawer>
  );
};
