import React, { useState } from 'react';
import {
  X,
  Scale,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  FileText,
  UserCheck,
} from 'lucide-react';
import {
  RecoveryCaseRecord,
  LegalReviewRecord,
  RequestLegalReviewPayload,
} from '../../types/recoveryTypes';
import { formatCurrencyINR, formatDate } from '../../utils/formatters';

interface LegalReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  recoveryCase: RecoveryCaseRecord;
  reviewToDecide?: LegalReviewRecord | null;
  onRequest: (payload: RequestLegalReviewPayload) => void;
  onDecide?: (reviewId: string, approved: boolean, notes?: string) => void;
  currentUser?: { name: string; id: string; roleName: string };
  canApprove?: boolean;
}

export const LegalReviewModal: React.FC<LegalReviewModalProps> = ({
  isOpen,
  onClose,
  recoveryCase,
  reviewToDecide,
  onRequest,
  onDecide,
  currentUser,
  canApprove = true,
}) => {
  const [reason, setReason] = useState<string>('');
  const [recommendedAction, setRecommendedAction] = useState<string>(
    'Issue Statutory 138 Notice and file summary civil recovery suit.'
  );
  const [decisionNotes, setDecisionNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const isDeciding = !!reviewToDecide;

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a mandatory justification for requesting legal review.');
      return;
    }

    onRequest({
      recoveryCaseId: recoveryCase.id,
      reason: reason.trim(),
      recommendedAction,
    });
    onClose();
  };

  const handleDecision = (approved: boolean) => {
    if (!reviewToDecide) return;

    // Maker-checker segregation
    if (reviewToDecide.requestedByName === currentUser?.name || reviewToDecide.requestedBy === currentUser?.name) {
      setError('Segregation of Duties Violation: You requested this legal review and cannot approve it.');
      return;
    }

    if (onDecide) {
      onDecide(reviewToDecide.id, approved, decisionNotes.trim() || undefined);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-xs">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isDeciding ? 'Legal Review Decision & Approval' : 'Request Formal Legal Review'}
              </h3>
              <p className="text-xs text-slate-500">
                Case: <span className="font-mono font-semibold text-slate-700">{recoveryCase.recoveryCaseNumber}</span> • {recoveryCase.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Snapshot */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-slate-500 block text-[11px]">Total Exposure</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {formatCurrencyINR(recoveryCase.totalOutstanding)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Overdue Balance</span>
              <span className="font-mono font-bold text-rose-600 text-sm">
                {formatCurrencyINR(recoveryCase.overdueAmount)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">DPD Bracket</span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                {recoveryCase.dpd} Days ({recoveryCase.dpdBucket})
              </span>
            </div>
          </div>

          {isDeciding ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-purple-900 font-mono">
                    {reviewToDecide.reviewNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                    {reviewToDecide.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-slate-700">
                  <span className="text-slate-500 font-semibold">Requested By:</span>{' '}
                  <span className="font-semibold">{reviewToDecide.requestedByName}</span> ({reviewToDecide.requestedByRole}) on {formatDate(reviewToDecide.requestedAt)}
                </div>
                <div className="text-slate-700">
                  <span className="text-slate-500 font-semibold">Justification:</span>{' '}
                  <p className="mt-0.5 italic bg-white p-2 rounded-lg border border-purple-100">
                    "{reviewToDecide.reviewReason}"
                  </p>
                </div>
                {reviewToDecide.recommendedAction && (
                  <div className="text-slate-700">
                    <span className="text-slate-500 font-semibold">Recommended Action:</span>{' '}
                    <span className="font-medium">{reviewToDecide.recommendedAction}</span>
                  </div>
                )}
              </div>

              {/* Segregation of duties alert if reviewer is requester */}
              {reviewToDecide.requestedByName === currentUser?.name && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 font-medium">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Segregation of Duties: You requested this review and cannot approve it. Another authorized legal authority must decide.</span>
                </div>
              )}

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Legal Counsel Notes / Directions
                </label>
                <textarea
                  rows={3}
                  placeholder="Record legal instructions, notice type, jurisdiction, or reason for return..."
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {error && <p className="text-rose-600 font-semibold">{error}</p>}
            </div>
          ) : (
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Recommended Legal Action <span className="text-rose-500">*</span>
                </label>
                <select
                  value={recommendedAction}
                  onChange={(e) => setRecommendedAction(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                >
                  <option value="Issue Statutory 138 Notice and file summary civil recovery suit.">
                    Section 138 Cheque/NACH Bounce Notice + Summary Civil Suit
                  </option>
                  <option value="Issue Formal Loan Recall & Demand Notice.">
                    Formal Loan Recall & Statutory Demand Notice
                  </option>
                  <option value="Initiate Arbitration Proceedings under Loan Agreement.">
                    Arbitration Proceedings under Loan Agreement
                  </option>
                  <option value="Initiate SARFAESI Act Section 13(2) Demand.">
                    SARFAESI Act 13(2) Secured Asset Demand
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Reason for Legal Escalation <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail previous recovery attempts, broken promises, bounced instruments, or lack of borrower cooperation..."
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    setError('');
                  }}
                  className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {error && <p className="text-rose-500 mt-1">{error}</p>}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
                >
                  Submit for Legal Review
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer for Decision Mode */}
        {isDeciding && (
          <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-slate-500">
              Reviewer: <span className="font-semibold text-slate-700">{currentUser?.name || 'Head of Credit & Remedial'}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDecision(false)}
                disabled={reviewToDecide?.requestedByName === currentUser?.name}
                className="px-3.5 py-2 font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg disabled:opacity-50 transition-colors"
              >
                Return to Recovery
              </button>
              <button
                type="button"
                onClick={() => handleDecision(true)}
                disabled={reviewToDecide?.requestedByName === currentUser?.name}
                className="px-4 py-2 font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm disabled:opacity-50 transition-all"
              >
                Approve for Legal Action
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
