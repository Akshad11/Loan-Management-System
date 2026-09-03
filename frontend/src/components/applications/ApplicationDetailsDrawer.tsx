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
import { HOME_LOAN_FORM_SCHEMA } from '../../data/loanProductData';

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
  const store = useMockStore();

  if (!application) return null;

  const isDraft = application.status === 'DRAFT';
  const validationResult = validateForSubmission(application.id);

  // EMI Estimate
  const monthlyRate = application.interestRate / 12 / 100;
  const estimatedEMI = Math.round(
    (application.requestedAmount *
      monthlyRate *
      Math.pow(1 + monthlyRate, application.requestedTenureMonths)) /
      (Math.pow(1 + monthlyRate, application.requestedTenureMonths) - 1)
  );

  const formInitialResponses = useMemo(() => {
    if (!application) return {};
    return {
      applicant_full_name: application.customerName,
      requested_loan_amount: application.requestedAmount,
      purpose: application.purpose,
    };
  }, [application?.customerName, application?.requestedAmount, application?.purpose]);

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
      id: 'documents',
      label: `Documents (${application.documents.length})`,
      icon: <CheckCircle2 className="w-4 h-4" />,
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
            {isDraft ? (
              <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                <Clock className="w-4 h-4 text-amber-600" />
                Application in <strong>Draft Stage</strong>. Complete checklist & parties prior to submission.
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-blue-700 font-medium">
                <Send className="w-4 h-4 text-blue-600" />
                Application Submitted and under credit underwriting queue.
              </span>
            )}
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

            <DynamicFormRenderer
              schema={HOME_LOAN_FORM_SCHEMA}
              initialResponses={formInitialResponses}
              onSubmitForm={async (resp, sigs) => {
                alert(`Form responses saved for application ${application.applicationNumber}!`);
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
              coApplicants={application.coApplicants}
              allCustomers={allCustomers}
              onAddCoApplicant={(payload) => onAddCoApplicant(application.id, payload)}
              onRemoveCoApplicant={(coAppId) => onRemoveCoApplicant(application.id, coAppId)}
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
