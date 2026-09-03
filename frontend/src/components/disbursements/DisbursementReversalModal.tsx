import React, { useState } from 'react';
import { DisbursementTransactionRecord } from '../../types/disbursementTypes';
import { RotateCcw, X, AlertTriangle } from 'lucide-react';

interface DisbursementReversalModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: DisbursementTransactionRecord;
  onReverse: (reason: string) => void;
}

export const DisbursementReversalModal: React.FC<DisbursementReversalModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onReverse,
}) => {
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Please provide a mandatory reversal reason for the audit trail.');
      return;
    }
    onReverse(reason.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-300 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-rose-600" />
            <h2 className="text-base font-bold text-slate-900">Reverse Disbursement Payout</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-rose-950">
            <div className="flex justify-between">
              <span className="text-rose-700">Transaction Ref:</span>
              <span className="font-mono font-bold">{transaction.transactionReference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-rose-700">UTR / Reference:</span>
              <span className="font-mono">{transaction.utrNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-rose-700">Amount to Restore:</span>
              <span className="font-mono font-bold text-sm">₹{transaction.amount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 leading-relaxed text-[11px]">
            <span className="font-bold text-slate-900 block mb-0.5">Audit Trail & Balance Restoration:</span>
            Reversing this transaction will restore ₹{transaction.amount.toLocaleString('en-IN')} back to the available remaining sanction balance. The original transaction record will be preserved as <span className="font-mono font-bold text-red-700">REVERSED</span> in the immutable audit log.
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Mandatory Reversal Reason*
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              placeholder="e.g. Beneficiary account incorrect / Bank returned funds / Customer cancellation requested..."
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
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            Confirm Reversal
          </button>
        </div>
      </div>
    </div>
  );
};
