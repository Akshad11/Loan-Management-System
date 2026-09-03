import React, { useState } from 'react';
import { DisbursementRecord, DisbursementRequestRecord } from '../../types/disbursementTypes';
import { CheckCircle2, XCircle, RotateCcw, X, ShieldAlert, ShieldCheck } from 'lucide-react';

interface DisbursementApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  disbursement: DisbursementRecord;
  request: DisbursementRequestRecord;
  currentUser: { name: string; id: string; roleName: string };
  onApprove: (notes: string) => void;
  onReject: (reason: string) => void;
  onReturn: (reason: string) => void;
}

export const DisbursementApprovalModal: React.FC<DisbursementApprovalModalProps> = ({
  isOpen,
  onClose,
  disbursement,
  request,
  currentUser,
  onApprove,
  onReject,
  onReturn,
}) => {
  const [decisionMode, setDecisionMode] = useState<'APPROVE' | 'REJECT' | 'RETURN'>('APPROVE');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const isMaker = request.requestedByName?.trim().toLowerCase() === currentUser.name.trim().toLowerCase();

  const handleConfirm = () => {
    setError('');

    if (isMaker && decisionMode === 'APPROVE') {
      setError(
        'Segregation of Duties Violation: You cannot approve a request created by yourself. A separate checker/approver is required.'
      );
      return;
    }

    if ((decisionMode === 'REJECT' || decisionMode === 'RETURN') && !notes.trim()) {
      setError(`Please provide a reason / remarks for ${decisionMode === 'REJECT' ? 'rejection' : 'return'}.`);
      return;
    }

    if (decisionMode === 'APPROVE') {
      onApprove(notes.trim());
    } else if (decisionMode === 'REJECT') {
      onReject(notes.trim());
    } else {
      onReturn(notes.trim());
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-300 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Disbursement Checker Signoff</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Summary Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Borrower:</span>
              <span className="font-bold text-slate-900">{disbursement.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Facility / Sanction:</span>
              <span className="text-slate-900 font-mono">{disbursement.sanctionNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Requested Payout:</span>
              <span className="font-mono font-bold text-indigo-900 text-sm">
                ₹{request.requestedAmount.toLocaleString('en-IN')} ({request.disbursementType})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Maker Officer:</span>
              <span className="font-medium text-slate-800">{request.requestedByName}</span>
            </div>
          </div>

          {/* Segregation of Duties Warning */}
          {isMaker && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-rose-800">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Maker-Checker Segregation Policy</span>
                You created this request ({request.requestedByName}). To prevent fraud and comply with RBI/banking governance, approval must be performed by an independent checker.
              </div>
            </div>
          )}

          {/* Decision Selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Select Signoff Action*</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDecisionMode('APPROVE')}
                className={`py-2 px-3 rounded-lg border font-bold text-center flex items-center justify-center gap-1.5 transition-all ${
                  decisionMode === 'APPROVE'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve Payout
              </button>

              <button
                type="button"
                onClick={() => setDecisionMode('RETURN')}
                className={`py-2 px-3 rounded-lg border font-bold text-center flex items-center justify-center gap-1.5 transition-all ${
                  decisionMode === 'RETURN'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" /> Return
              </button>

              <button
                type="button"
                onClick={() => setDecisionMode('REJECT')}
                className={`py-2 px-3 rounded-lg border font-bold text-center flex items-center justify-center gap-1.5 transition-all ${
                  decisionMode === 'REJECT'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          </div>

          {/* Notes / Reason */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {decisionMode === 'APPROVE' ? 'Checker Signoff Remarks (Optional)' : 'Mandatory Reason / Correction Notes*'}
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setError('');
              }}
              placeholder={
                decisionMode === 'APPROVE'
                  ? 'All pre-disbursement verification verified. Ready for core banking payout.'
                  : 'Specify reason for rejection or details to be corrected by the maker...'
              }
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-1.5 text-white text-xs font-bold rounded-lg shadow-xs transition-colors ${
              decisionMode === 'APPROVE'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : decisionMode === 'RETURN'
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            Confirm {decisionMode}
          </button>
        </div>
      </div>
    </div>
  );
};
