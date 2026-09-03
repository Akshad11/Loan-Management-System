import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Calendar,
  User,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { WaiverRequestRecord } from '../../types/chargeAdjustmentTypes';
import { formatCurrencyINR } from '../../utils/formatters';

interface WaiverDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  waiver: WaiverRequestRecord | null;
  currentUser: { id: string; name: string; roleName: string };
  onApprove: (waiverId: string, notes?: string) => Promise<void>;
  onReject: (waiverId: string, reason: string) => Promise<void>;
  onApply: (waiverId: string) => Promise<void>;
}

export const WaiverDetailModal: React.FC<WaiverDetailModalProps> = ({
  isOpen,
  onClose,
  waiver,
  currentUser,
  onApprove,
  onReject,
  onApply,
}) => {
  const [approvalNotes, setApprovalNotes] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showRejectBox, setShowRejectBox] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !waiver) return null;

  const isMaker = waiver.requestedBy === currentUser.id || waiver.requestedByName === currentUser.name;
  const isPending = waiver.status === 'SUBMITTED' || waiver.status === 'UNDER_REVIEW';
  const isApproved = waiver.status === 'APPROVED';

  const handleApprove = async () => {
    if (isMaker) {
      setErrorMsg('Maker-Checker Violation: You cannot approve your own waiver request.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      await onApprove(waiver.id, approvalNotes);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to approve waiver.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setErrorMsg('Please specify rejection reason.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      await onReject(waiver.id, rejectionReason);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reject waiver.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      await onApply(waiver.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to apply waiver.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold">{waiver.waiverNumber}</h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    waiver.status === 'APPLIED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      : waiver.status === 'APPROVED'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                      : waiver.status === 'REJECTED'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                  }`}
                >
                  {waiver.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {waiver.accountNumber} — {waiver.customerName}
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

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Waiver Type</span>
              <span className="text-sm font-black text-slate-900">{waiver.waiverType.replace(/_/g, ' ')}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Category</span>
              <span className="text-sm font-black text-amber-700">{waiver.category}</span>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Requested Amount</span>
              <span className="text-sm font-black text-amber-900">{formatCurrencyINR(waiver.requestedAmount)}</span>
            </div>
          </div>

          {/* Justification Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Justification & Rationale
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">{waiver.reason}</p>
          </div>

          {/* Workflow & Authority */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Requested By:</span>
              <span className="font-bold text-slate-800">
                {waiver.requestedByName} ({waiver.requestedByRole}) on {new Date(waiver.requestedAt).toLocaleDateString()}
              </span>
            </div>
            {waiver.approvedByName && (
              <div className="flex items-center justify-between text-slate-600">
                <span>Approved By:</span>
                <span className="font-bold text-blue-800">
                  {waiver.approvedByName} ({waiver.approvedByRole || 'Approver'}) on {new Date(waiver.approvedAt || '').toLocaleDateString()}
                </span>
              </div>
            )}
            {waiver.resultingTransactionRef && (
              <div className="flex items-center justify-between text-slate-600">
                <span>Posted Transaction Ref:</span>
                <span className="font-mono font-bold text-emerald-800">{waiver.resultingTransactionRef}</span>
              </div>
            )}
          </div>

          {/* Segregation of duties alert if requester is viewing */}
          {isMaker && isPending && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-2 text-xs text-amber-800">
              <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Segregation of Duties:</strong> You requested this waiver. Another authorized manager/checker must sign off.
              </span>
            </div>
          )}

          {/* Approval Notes Input if Pending */}
          {isPending && !isMaker && !showRejectBox && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Approval Sign-off Notes (Optional)
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={2}
                placeholder="Add committee sign-off notes..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}

          {/* Rejection box if active */}
          {showRejectBox && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-rose-800 uppercase tracking-wider">
                Rejection Reason <span className="text-rose-600">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={2}
                placeholder="State reason for rejecting waiver..."
                className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Close
          </button>

          <div className="flex items-center space-x-2">
            {isPending && !isMaker && !showRejectBox && (
              <>
                <button
                  onClick={() => setShowRejectBox(true)}
                  className="px-3.5 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all"
                >
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isProcessing ? 'Approving...' : 'Approve Waiver'}</span>
                </button>
              </>
            )}

            {showRejectBox && (
              <>
                <button
                  onClick={() => setShowRejectBox(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel Rejection
                </button>
                <button
                  onClick={handleReject}
                  disabled={isProcessing || !rejectionReason.trim()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                >
                  Confirm Rejection
                </button>
              </>
            )}

            {isApproved && (
              <button
                onClick={handleApply}
                disabled={isProcessing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isProcessing ? 'Posting Transaction...' : 'Apply Waiver & Post Ledger'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
