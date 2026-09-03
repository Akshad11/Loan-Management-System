import React from 'react';
import { SanctionRecord } from '../../types/sanctionTypes';
import { SanctionStatusBadge, LetterStatusBadge } from './SanctionStatusBadge';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileCheck,
  Edit3,
  RotateCcw,
  Ban,
  ShieldCheck,
  ShieldAlert,
  Download,
  Printer,
  FileText,
  User,
  Building2,
  AlertTriangle,
} from 'lucide-react';

interface SanctionHeaderProps {
  sanction: SanctionRecord;
  onBack: () => void;
  onOpenTermsModal: () => void;
  onOpenConfirmModal: () => void;
  onOpenLetterModal: () => void;
  onOpenReturnModal: () => void;
  onOpenCancelModal: () => void;
  currentUser: { name: string; id: string; roleName: string };
  canEditSanctionTerms: boolean;
  canConfirmSanction: boolean;
  canGenerateSanctionLetter: boolean;
}

export const SanctionHeader: React.FC<SanctionHeaderProps> = ({
  sanction,
  onBack,
  onOpenTermsModal,
  onOpenConfirmModal,
  onOpenLetterModal,
  onOpenReturnModal,
  onOpenCancelModal,
  currentUser,
  canEditSanctionTerms,
  canConfirmSanction,
  canGenerateSanctionLetter,
}) => {
  const activeLetter = sanction.letters.find((l) => l.id === sanction.activeLetterId) || sanction.letters[0];

  // SoD Check
  const finalApproverName = sanction.finalApproverName.toLowerCase();
  const currentUserName = currentUser.name.toLowerCase();
  const isSodRestricted = currentUserName && finalApproverName && (currentUserName.includes(finalApproverName) || finalApproverName.includes(currentUserName));

  const isEditable = canEditSanctionTerms && (sanction.status === 'DRAFT' || sanction.status === 'UNDER_REVIEW' || sanction.status === 'RETURNED');
  const isConfirmable =
    canConfirmSanction &&
    (sanction.status === 'DRAFT' || sanction.status === 'UNDER_REVIEW' || sanction.status === 'PENDING_CONFIRMATION') &&
    !isSodRestricted;
  const isReturnable =
    canConfirmSanction &&
    (sanction.status === 'DRAFT' || sanction.status === 'UNDER_REVIEW' || sanction.status === 'PENDING_CONFIRMATION');
  const isCancellable =
    canConfirmSanction &&
    sanction.status !== 'SANCTIONED' &&
    sanction.status !== 'CANCELLED';

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6 shadow-sm">
      {/* Top row: Back button, Title & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            title="Back to Sanctions Queue"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 font-mono tracking-tight">
                {sanction.sanctionNumber}
              </h1>
              <SanctionStatusBadge status={sanction.status} />
              {activeLetter && <LetterStatusBadge status={activeLetter.status} />}
              {sanction.terms.isDeviatedFromApproval && (
                <span className="inline-flex items-center text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-300 rounded px-2 py-0.5">
                  <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
                  Deviated from Approval
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                App Ref: <strong className="font-mono text-slate-700">{sanction.applicationNumber}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                Approval Ref: <strong className="font-mono text-slate-700">{sanction.approvalNumber}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Created: <strong className="text-slate-700">{sanction.createdDate}</strong> by {sanction.createdBy}
              </span>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {isEditable && (
            <button
              onClick={onOpenTermsModal}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md border border-slate-300 transition-colors inline-flex items-center"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
              Adjust Terms & Fees
            </button>
          )}

          {canGenerateSanctionLetter && (
            <button
              onClick={onOpenLetterModal}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-semibold rounded-md border border-blue-200 transition-colors inline-flex items-center"
            >
              <FileCheck className="w-3.5 h-3.5 mr-1.5 text-blue-700" />
              {activeLetter ? 'Letter Preview / Regenerate' : 'Generate Sanction Letter'}
            </button>
          )}

          {isReturnable && (
            <button
              onClick={onOpenReturnModal}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold rounded-md border border-rose-200 transition-colors inline-flex items-center"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-rose-600" />
              Return for Rework
            </button>
          )}

          {isConfirmable && (
            <button
              onClick={onOpenConfirmModal}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-md shadow-xs transition-colors inline-flex items-center"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Confirm & Finalize Sanction
            </button>
          )}

          {isCancellable && (
            <button
              onClick={onOpenCancelModal}
              title="Cancel Sanction Record"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md border border-slate-200 transition-colors"
            >
              <Ban className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* SoD Compliance Banner if applicable */}
      {isSodRestricted && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <span className="font-bold">Segregation of Duties (SoD) Active:</span> You approved this loan application at the Final Credit Committee stage ({sanction.finalApproverName}). In compliance with regulatory lending guidelines, sanction confirmation must be executed by an independent officer.
          </div>
        </div>
      )}

      {/* Bottom Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 mt-4 pt-3 text-xs">
        <div>
          <span className="text-slate-500 block">Borrower Name</span>
          <span className="font-semibold text-slate-900 truncate block">{sanction.customerName}</span>
          <span className="text-[11px] text-slate-400 font-mono">{sanction.customerNumber}</span>
        </div>

        <div>
          <span className="text-slate-500 block">Loan Product</span>
          <span className="font-semibold text-slate-900 block">{sanction.productName}</span>
          <span className="text-[11px] text-slate-400">{sanction.productCode}</span>
        </div>

        <div>
          <span className="text-slate-500 block">Sanctioned Limit</span>
          <span className="font-bold font-mono text-slate-900 text-sm block">
            ₹{sanction.terms.amount.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-slate-500">
            Net: ₹{sanction.terms.netDisbursementAmount.toLocaleString('en-IN')}
          </span>
        </div>

        <div>
          <span className="text-slate-500 block">Interest Rate & Tenure</span>
          <span className="font-semibold font-mono text-slate-900 block">
            {sanction.terms.interestRate}% p.a.
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {sanction.terms.tenureMonths} months ({sanction.terms.repaymentFrequency})
          </span>
        </div>

        <div>
          <span className="text-slate-500 block">Credit Approval Sign-off</span>
          <span className="font-semibold text-slate-900 block truncate">{sanction.finalApproverName}</span>
          <span className="text-[11px] text-slate-400">{sanction.finalApproverRole}</span>
        </div>

        <div>
          <span className="text-slate-500 block">Branch Location</span>
          <span className="font-semibold text-slate-900 block truncate">{sanction.branchName}</span>
          <span className="text-[11px] text-slate-400">ID: {sanction.branchId}</span>
        </div>
      </div>
    </div>
  );
};
