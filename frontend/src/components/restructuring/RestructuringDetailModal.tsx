import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  User,
  Building,
  Calendar,
  DollarSign,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Play,
  XCircle,
  Layers,
  History,
} from 'lucide-react';
import { RestructuringRequestRecord } from '../../types/restructuringTypes';
import { formatCurrencyINR, formatDate } from '../../utils/formatters';

interface RestructuringDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: RestructuringRequestRecord | null;
  currentUser: { id: string; name: string; roleName: string };
  onStartReview: (requestId: string, notes?: string) => Promise<void>;
  onApprove: (requestId: string, notes?: string) => Promise<void>;
  onReject: (requestId: string, reason: string) => Promise<void>;
  onApply: (requestId: string) => Promise<void>;
  onOpenScheduleComparison?: (request: RestructuringRequestRecord) => void;
}

export const RestructuringDetailModal: React.FC<RestructuringDetailModalProps> = ({
  isOpen,
  onClose,
  request,
  currentUser,
  onStartReview,
  onApprove,
  onReject,
  onApply,
  onOpenScheduleComparison,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TERMS_COMPARISON' | 'EVENTS'>('OVERVIEW');
  const [actionNotes, setActionNotes] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showRejectBox, setShowRejectBox] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !request) return null;

  const isCreator = request.requestedBy === currentUser.id;
  const canReview = ['SUBMITTED', 'UNDER_REVIEW'].includes(request.status);
  const canApprove = ['SUBMITTED', 'UNDER_REVIEW'].includes(request.status);
  const canApply = request.status === 'APPROVED';

  const handleApprove = async () => {
    if (isCreator) {
      setErrorMsg('Segregation of duties violation: You created this request and cannot approve it.');
      return;
    }
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      await onApprove(request.id, actionNotes || undefined);
    } catch (err: any) {
      setErrorMsg(err.message || 'Approval failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setErrorMsg('Rejection reason is mandatory.');
      return;
    }
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      await onReject(request.id, rejectReason);
      setShowRejectBox(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Rejection failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      await onApply(request.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to apply restructuring.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'EFFECTIVE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'UNDER_REVIEW':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'SUBMITTED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold">{request.requestNumber}</h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(request.status)}`}>
                  {request.status.replace(/_/g, ' ')}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  {request.requestType.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                Loan {request.accountNumber} • {request.customerName} ({request.branchName || 'Panjim Branch'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workflow Stepper */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold">
          {[
            { id: 'SUBMITTED', label: '1. Submitted' },
            { id: 'UNDER_REVIEW', label: '2. Under Review' },
            { id: 'APPROVED', label: '3. Committee Approved' },
            { id: 'EFFECTIVE', label: '4. Active / Effective' },
          ].map((s, idx) => {
            const isDone =
              (s.id === 'SUBMITTED' && ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'EFFECTIVE'].includes(request.status)) ||
              (s.id === 'UNDER_REVIEW' && ['UNDER_REVIEW', 'APPROVED', 'EFFECTIVE'].includes(request.status)) ||
              (s.id === 'APPROVED' && ['APPROVED', 'EFFECTIVE'].includes(request.status)) ||
              (s.id === 'EFFECTIVE' && request.status === 'EFFECTIVE');

            const isCurrent = request.status === s.id;

            return (
              <div key={s.id} className="flex items-center space-x-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isDone ? '✓' : idx + 1}
                </div>
                <span className={isDone ? 'text-emerald-700' : isCurrent ? 'text-indigo-600 font-bold' : 'text-slate-400'}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Segregation of Duties Warning */}
        {isCreator && canApprove && (
          <div className="mx-6 mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-2 text-amber-800 text-xs font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Maker-Checker Enforced:</strong> You created this request as <em>{request.requestedByName}</em>. An independent credit approver or committee member must approve this request.
            </span>
          </div>
        )}

        {/* Error Banner */}
        {errorMsg && (
          <div className="mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-6 pt-3 border-b border-slate-200 flex space-x-6 text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'OVERVIEW'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Overview & Summary
          </button>
          <button
            onClick={() => setActiveTab('TERMS_COMPARISON')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'TERMS_COMPARISON'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Before / After Comparison & Impact
          </button>
          <button
            onClick={() => setActiveTab('EVENTS')}
            className={`pb-2.5 border-b-2 transition-colors ${
              activeTab === 'EVENTS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Timeline & Audit Log ({request.events?.length || 0})
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Top Quick Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 block">Outstanding Principal</span>
                  <span className="text-base font-bold text-slate-900">
                    {formatCurrencyINR(request.currentPrincipalOutstanding)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Authoritative Balance</span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 block">Proposed Monthly EMI</span>
                  <span className="text-base font-bold text-indigo-600">
                    {formatCurrencyINR(request.proposedEmiAmount)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Was {formatCurrencyINR(request.currentEmiAmount)}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 block">Proposed Tenure</span>
                  <span className="text-base font-bold text-slate-900">
                    {request.proposedTenureMonths} Months
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    +{request.tenureDifference} mos extension
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 block">Effective Date</span>
                  <span className="text-base font-bold text-slate-900">
                    {formatDate(request.effectiveDate)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Contractual Switch</span>
                </div>
              </div>

              {/* Justification Reason */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Borrower Justification & Hardship Reason
                </h4>
                <p className="text-sm text-slate-800 leading-relaxed">{request.reason}</p>
              </div>

              {/* Customer Consent Details */}
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">
                      Customer Consent: {request.consentReceived ? 'Recorded & Verified' : 'Pending Consent'}
                    </span>
                    <span className="text-xs text-slate-500">
                      Method: {request.consentMethod || 'Digital OTP'} • Ref: {request.consentDocumentRef || 'DOC-VERIFIED'} • Date: {request.consentDate ? formatDate(request.consentDate) : 'N/A'}
                    </span>
                  </div>
                </div>

                {onOpenScheduleComparison && (
                  <button
                    onClick={() => onOpenScheduleComparison(request)}
                    className="px-3.5 py-1.5 bg-white border border-indigo-200 hover:border-indigo-300 text-indigo-700 rounded-lg text-xs font-bold shadow-sm flex items-center space-x-1.5 transition-colors"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Compare Version Schedules</span>
                  </button>
                )}
              </div>

              {/* Review & Approval Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-400 block font-medium">Initiated By</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{request.requestedByName}</span>
                  <span className="text-[11px] text-slate-500">{request.requestedByRole} • {formatDate(request.requestedAt)}</span>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-400 block font-medium">Underwriting Review</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{request.reviewedByName || 'Pending Assignment'}</span>
                  <span className="text-[11px] text-slate-500">
                    {request.reviewedAt ? formatDate(request.reviewedAt) : 'Under Assessment'}
                  </span>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-slate-400 block font-medium">Approval Sign-off</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{request.approvedByName || 'Awaiting Committee'}</span>
                  <span className="text-[11px] text-slate-500">
                    {request.approvedAt ? formatDate(request.approvedAt) : 'Pending Final Decision'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'TERMS_COMPARISON' && (
            <div className="space-y-6">
              {/* Before vs After Table */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current Contractual Terms */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Current Contractual Terms
                    </span>
                    <span className="text-xs font-bold text-slate-500">Version {request.currentScheduleVersion}</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Principal Outstanding</span>
                      <span className="font-bold text-slate-900">{formatCurrencyINR(request.currentPrincipalOutstanding)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Interest Rate</span>
                      <span className="font-bold text-slate-900">{request.currentInterestRate}% p.a.</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Remaining Tenure</span>
                      <span className="font-bold text-slate-900">{request.currentRemainingTenureMonths} Months</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Current Monthly EMI</span>
                      <span className="font-bold text-slate-900">{formatCurrencyINR(request.currentEmiAmount)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Repayment Frequency</span>
                      <span className="font-bold text-slate-900">{request.currentRepaymentFrequency}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-500">Delinquency (DPD)</span>
                      <span className="font-bold text-amber-600">{request.currentDpd} Days</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Maturity Date</span>
                      <span className="font-bold text-slate-900">{formatDate(request.currentMaturityDate || '')}</span>
                    </div>
                  </div>
                </div>

                {/* Proposed Restructured Terms */}
                <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-200 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                      Proposed Restructured Terms
                    </span>
                    <span className="text-xs font-bold text-indigo-600">
                      Version {request.resultingScheduleVersionNumber || request.currentScheduleVersion + 1}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-indigo-100/60">
                      <span className="text-indigo-800">Starting Principal</span>
                      <span className="font-bold text-indigo-950">{formatCurrencyINR(request.proposedPrincipal)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-indigo-100/60">
                      <span className="text-indigo-800">New Interest Rate</span>
                      <span className="font-bold text-indigo-950">{request.proposedInterestRate}% p.a.</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-indigo-100/60">
                      <span className="text-indigo-800">New Tenure</span>
                      <span className="font-bold text-indigo-950">{request.proposedTenureMonths} Months</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-indigo-100/60">
                      <span className="text-indigo-800">New Monthly EMI</span>
                      <span className="font-bold text-indigo-600 text-sm">{formatCurrencyINR(request.proposedEmiAmount)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-indigo-100/60">
                      <span className="text-indigo-800">Moratorium Period</span>
                      <span className="font-bold text-indigo-950">
                        {request.moratoriumMonths || 0} Months ({request.moratoriumInterestTreatment?.replace(/_/g, ' ') || 'None'})
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-indigo-100/60">
                      <span className="text-indigo-800">First Restructured Due Date</span>
                      <span className="font-bold text-indigo-950">{formatDate(request.proposedFirstDueDate)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-indigo-800">New Maturity Date</span>
                      <span className="font-bold text-indigo-950">{formatDate(request.proposedMaturityDate)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Impact Analysis */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
                  Authoritative Financial Delta Analysis
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-slate-400 block text-[11px]">Monthly EMI Delta</span>
                    <span
                      className={`text-base font-bold flex items-center space-x-1 ${
                        request.emiDifference < 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {request.emiDifference < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                      <span>{formatCurrencyINR(Math.abs(request.emiDifference))}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">{request.emiDifference < 0 ? 'Relief / Mo' : 'Increase'}</span>
                  </div>

                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-slate-400 block text-[11px]">Lifetime Interest Delta</span>
                    <span className="text-base font-bold text-white">
                      {request.interestDifference > 0 ? '+' : ''}
                      {formatCurrencyINR(request.interestDifference)}
                    </span>
                    <span className="text-[10px] text-slate-400">Total Interest Difference</span>
                  </div>

                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-slate-400 block text-[11px]">Total Scheduled Volume</span>
                    <span className="text-base font-bold text-white">{formatCurrencyINR(request.proposedTotalScheduled)}</span>
                    <span className="text-[10px] text-slate-400">Principal + Interest</span>
                  </div>

                  <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-slate-400 block text-[11px]">Tenure Adjustment</span>
                    <span className="text-base font-bold text-indigo-300">+{request.tenureDifference} Months</span>
                    <span className="text-[10px] text-slate-400">Extension Horizon</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'EVENTS' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Immutable Restructuring Audit History
              </h4>
              <div className="space-y-3">
                {request.events && request.events.length > 0 ? (
                  request.events.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start space-x-3 text-xs"
                    >
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                        <History className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{evt.title}</span>
                          <span className="text-[10px] text-slate-400">{formatDate(evt.timestamp)}</span>
                        </div>
                        <p className="text-slate-600 mt-1">{evt.description}</p>
                        <div className="text-[10px] text-slate-400 mt-1">
                          By: <strong className="text-slate-700">{evt.actorName}</strong> ({evt.actorRole})
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic">No events logged yet.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Reject Reason Box */}
        {showRejectBox && (
          <div className="px-6 py-3 bg-rose-50 border-t border-rose-200 flex flex-col space-y-2">
            <span className="text-xs font-bold text-rose-900">Mandatory Rejection Justification:</span>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Unviable debt servicing capability, insufficient borrower cash flow..."
                className="flex-1 px-3 py-1.5 bg-white border border-rose-300 rounded-lg text-xs"
              />
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
              >
                Confirm Reject
              </button>
              <button
                onClick={() => setShowRejectBox(false)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Close
          </button>

          <div className="flex items-center space-x-3">
            {canReview && request.status === 'SUBMITTED' && (
              <button
                onClick={() => onStartReview(request.id)}
                disabled={isProcessing}
                className="px-4 py-2 bg-indigo-50 border border-indigo-300 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5"
              >
                <Clock className="w-4 h-4" />
                <span>Start Review</span>
              </button>
            )}

            {canApprove && (
              <>
                <button
                  onClick={() => setShowRejectBox(true)}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Request</span>
                </button>

                <button
                  onClick={handleApprove}
                  disabled={isProcessing || isCreator}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Restructuring</span>
                </button>
              </>
            )}

            {canApply && (
              <button
                onClick={handleApply}
                disabled={isProcessing}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center space-x-2 animate-pulse"
              >
                <Play className="w-4 h-4" />
                <span>Apply Restructuring (Activate Schedule V{request.currentScheduleVersion + 1})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
