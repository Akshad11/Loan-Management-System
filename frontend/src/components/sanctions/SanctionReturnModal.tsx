import React, { useState } from 'react';
import { SanctionRecord } from '../../types/sanctionTypes';
import { RotateCcw, X, AlertTriangle } from 'lucide-react';

interface SanctionReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  sanction: SanctionRecord;
  onReturn: (reason: string) => void;
}

export const SanctionReturnModal: React.FC<SanctionReturnModalProps> = ({
  isOpen,
  onClose,
  sanction,
  onReturn,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleReturn = () => {
    if (!reason.trim() || reason.trim().length < 5) {
      setError('A mandatory return explanation (min 5 characters) is required for audit trail.');
      return;
    }

    onReturn(reason.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-300 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-rose-600" />
            <h2 className="text-base font-bold text-slate-900">Return Sanction Dossier for Rework</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <p className="text-xs text-slate-600">
            Returning dossier <strong>{sanction.sanctionNumber}</strong> for borrower{' '}
            <strong>{sanction.customerName}</strong> back to the Loan Officer. The sanction status will change to <span className="font-bold text-rose-700">RETURNED</span>.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Correction Required / Rework Reason*
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              placeholder="Specify errors in fees, missing documents, or covenants that need adjustment..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md border border-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={handleReturn}
            className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-md shadow-xs transition-colors"
          >
            Confirm Return
          </button>
        </div>
      </div>
    </div>
  );
};
