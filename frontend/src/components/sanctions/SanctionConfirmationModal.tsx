import React, { useState } from 'react';
import { SanctionRecord } from '../../types/sanctionTypes';
import { CheckCircle2, X, ShieldAlert, ShieldCheck, AlertCircle, FileCheck } from 'lucide-react';

interface SanctionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  sanction: SanctionRecord;
  currentUser: { name: string; id: string; roleName: string };
  onConfirm: (notes: string) => void;
  prerequisites: {
    valid: boolean;
    errors: string[];
    warnings: string[];
    isSodRestricted: boolean;
  };
}

export const SanctionConfirmationModal: React.FC<SanctionConfirmationModalProps> = ({
  isOpen,
  onClose,
  sanction,
  currentUser,
  onConfirm,
  prerequisites,
}) => {
  const [notes, setNotes] = useState('Sanction terms verified against approved credit memo and legal requirements.');
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const { valid, errors, warnings, isSodRestricted } = prerequisites;

  const handleConfirm = () => {
    if (isSodRestricted) {
      setError('Confirmation blocked: Segregation of Duties (SoD) violation. You approved this loan application at Credit Committee and cannot confirm the sanction.');
      return;
    }

    if (!valid && errors.length > 0) {
      setError(`Cannot confirm sanction: ${errors.join(', ')}`);
      return;
    }

    if (!acknowledged) {
      setError('Please acknowledge the sanction verification declaration checkbox.');
      return;
    }

    onConfirm(notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-300 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Confirm & Finalize Sanction Dossier</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SoD Check Banner */}
        {isSodRestricted ? (
          <div className="mt-4 p-4 bg-rose-50 border border-rose-300 rounded-md text-xs text-rose-900 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-rose-900">Segregation of Duties (SoD) Policy Violation</h4>
              <p className="mt-1">
                You are recorded as the final credit approver (<strong>{sanction.finalApproverName}</strong>).
                Lending governance policies strictly require an independent authorizing officer to verify and confirm the final sanction terms.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              <strong>SoD Compliant:</strong> Confirming as <strong>{currentUser.name}</strong> ({currentUser.roleName}). Credit approver was {sanction.finalApproverName}.
            </span>
          </div>
        )}

        {/* Prerequisites Evaluation */}
        <div className="mt-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Mandatory Sanction Prerequisites
          </h4>

          {errors.length > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md space-y-1">
              {errors.map((err, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-rose-800 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  {err}
                </div>
              ))}
            </div>
          )}

          {warnings.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md space-y-1">
              {warnings.map((warn, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-amber-800">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  {warn}
                </div>
              ))}
            </div>
          )}

          {errors.length === 0 && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 space-y-1.5">
              <div className="flex justify-between">
                <span>Facility / Borrower:</span>
                <span className="font-semibold text-slate-900">{sanction.customerName} • {sanction.productName}</span>
              </div>
              <div className="flex justify-between">
                <span>Sanction Limit:</span>
                <span className="font-bold font-mono text-slate-900">₹{sanction.terms.amount.toLocaleString('en-IN')} @ {sanction.terms.interestRate}% ({sanction.terms.tenureMonths}m)</span>
              </div>
              <div className="flex justify-between">
                <span>Net Disbursable:</span>
                <span className="font-bold font-mono text-emerald-800">₹{sanction.terms.netDisbursementAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Pre-Sanction Conditions:</span>
                <span className="font-semibold text-slate-900">All Satisfied / Waived</span>
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Sign-off notes */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1">Confirmation Notes / Authorization Sign-off*</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>

        {/* Attestation Checkbox */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-md">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => {
                setAcknowledged(e.target.checked);
                setError('');
              }}
              disabled={isSodRestricted}
              className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs text-slate-700 leading-tight">
              I certify that all commercial terms, mandatory legal covenants, and documentation have been independently verified against the approved credit memo and regulatory policies.
            </span>
          </label>
        </div>

        {error && <p className="text-xs text-rose-600 font-semibold mt-2">{error}</p>}

        <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md border border-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSodRestricted || (!valid && errors.length > 0)}
            className={`px-4 py-1.5 text-xs font-bold text-white rounded-md shadow-xs transition-colors ${
              isSodRestricted || (!valid && errors.length > 0)
                ? 'bg-slate-400 cursor-not-allowed'
                : 'bg-emerald-700 hover:bg-emerald-800'
            }`}
          >
            Execute Sanction Confirmation
          </button>
        </div>
      </div>
    </div>
  );
};
