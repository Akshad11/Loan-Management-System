import React, { useState } from 'react';
import { SanctionRecord } from '../../types/sanctionTypes';
import { FileCheck, X, AlertCircle } from 'lucide-react';

interface SanctionLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  sanction: SanctionRecord;
  onGenerateLetter: (options: { templateId?: string; customNotes?: string; reasonForRegeneration?: string }) => void;
}

export const SanctionLetterModal: React.FC<SanctionLetterModalProps> = ({
  isOpen,
  onClose,
  sanction,
  onGenerateLetter,
}) => {
  const [templateId, setTemplateId] = useState('STANDARD_RETAIL_v2');
  const [customNotes, setCustomNotes] = useState('');
  const [reasonForRegeneration, setReasonForRegeneration] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const hasExistingLetter = sanction.letters.length > 0;

  const handleGenerate = () => {
    if (hasExistingLetter && (!reasonForRegeneration || reasonForRegeneration.trim().length < 5)) {
      setError('A mandatory reason for generating a new letter version (min 5 characters) is required for audit.');
      return;
    }

    onGenerateLetter({
      templateId,
      customNotes: customNotes.trim() || undefined,
      reasonForRegeneration: reasonForRegeneration.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-300 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              {hasExistingLetter ? 'Regenerate Sanction Letter (New Version)' : 'Generate Sanction Advice Letter'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mt-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700">
            <div className="flex justify-between">
              <span>Facility Amount:</span>
              <strong className="font-mono text-slate-900">₹{sanction.terms.amount.toLocaleString('en-IN')}</strong>
            </div>
            <div className="flex justify-between mt-1">
              <span>Rate & Tenure:</span>
              <strong className="font-mono text-slate-900">{sanction.terms.interestRate}% • {sanction.terms.tenureMonths} Months</strong>
            </div>
            <div className="flex justify-between mt-1">
              <span>Net Disbursement:</span>
              <strong className="font-mono text-emerald-800">₹{sanction.terms.netDisbursementAmount.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Sanction Letter Template*</label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="STANDARD_RETAIL_v2">Standard Retail Facility Schedule (RBI Master Directions Compliant)</option>
              <option value="MSME_BUSINESS_v1">MSME & Secured Business Loan Sanction Format</option>
              <option value="PRIORITY_SECTOR_v1">Priority Sector Lending (PSL) Format</option>
            </select>
          </div>

          {hasExistingLetter && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Re-generation / New Version*
              </label>
              <input
                type="text"
                value={reasonForRegeneration}
                onChange={(e) => {
                  setReasonForRegeneration(e.target.value);
                  setError('');
                }}
                placeholder="e.g. Terms modified per customer request, revised processing fee schedule..."
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Special Branch Stipulations / Custom Notes</label>
            <textarea
              rows={3}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Any additional branch covenants or borrower instructions to append to Annexure II..."
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
            onClick={handleGenerate}
            className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-md shadow-xs"
          >
            {hasExistingLetter ? 'Generate Version v' + (sanction.letters.length + 1) : 'Generate Sanction Letter'}
          </button>
        </div>
      </div>
    </div>
  );
};
