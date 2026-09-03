import React, { useState } from 'react';
import { ExceptionCategory, ApprovalException } from '../../types/approvalTypes';
import { AlertOctagon, X, AlertTriangle } from 'lucide-react';

interface ApprovalExceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  approvalId: string;
  onAddException: (exception: Omit<ApprovalException, 'id' | 'approvalId' | 'createdAt' | 'status'>) => void;
  currentUserName?: string;
}

export const ApprovalExceptionModal: React.FC<ApprovalExceptionModalProps> = ({
  isOpen,
  onClose,
  approvalId,
  onAddException,
  currentUserName = 'Approver',
}) => {
  if (!isOpen) return null;

  const [category, setCategory] = useState<ExceptionCategory>('AMOUNT_EXCEPTION');
  const [title, setTitle] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [recommendedValue, setRecommendedValue] = useState<string>('Standard Policy Limit');
  const [requestedValue, setRequestedValue] = useState<string>('Requested Exception');
  const [requiredAuthorityRole, setRequiredAuthorityRole] = useState<string>('Regional Credit Manager');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !reason.trim()) {
      setError('Title and comprehensive justification reason are mandatory.');
      return;
    }

    onAddException({
      category,
      title: title.trim(),
      description: title.trim(),
      reason: reason.trim(),
      deviationDetails: reason.trim(),
      recommendedValue: recommendedValue.trim() || 'N/A',
      requestedValue: requestedValue.trim() || 'N/A',
      requiredAuthorityRole,
      createdBy: currentUserName,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertOctagon className="h-4 w-4 text-amber-700" />
            Request Policy Exception / Delegation Deviation
          </h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="rounded border border-rose-300 bg-rose-50 p-2.5 text-xs text-rose-900">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Exception Category *</label>
              <select
                id="select-exception-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExceptionCategory)}
                className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
              >
                <option value="AMOUNT_EXCEPTION">Amount / Authority Limit Overrun</option>
                <option value="RATE_EXCEPTION">Interest Rate Concession / Deviation</option>
                <option value="TENURE_EXCEPTION">Tenure Extension Beyond Product Norms</option>
                <option value="POLICY_EXCEPTION">Credit Policy Rule Waiver</option>
                <option value="DOCUMENTATION_EXCEPTION">Documentation / Title Deviation</option>
                <option value="OTHER">Other Escalated Exception</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Required Authority Role *</label>
              <select
                id="select-exception-authority"
                value={requiredAuthorityRole}
                onChange={(e) => setRequiredAuthorityRole(e.target.value)}
                className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
              >
                <option value="Regional Credit Manager">Regional Credit Manager (Level 2)</option>
                <option value="Sanction Committee">Sanction Committee (Level 3)</option>
                <option value="Head of Credit Risk">Head of Credit Risk</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Exception Title *</label>
            <input
              id="input-exception-title"
              type="text"
              placeholder="e.g. Authority limit overrun from ₹5L to ₹7.5L based on strong banking"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Standard / Limit</label>
              <input
                id="input-exception-recommended"
                type="text"
                value={recommendedValue}
                onChange={(e) => setRecommendedValue(e.target.value)}
                className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Requested Deviation</label>
              <input
                id="input-exception-requested"
                type="text"
                value={requestedValue}
                onChange={(e) => setRequestedValue(e.target.value)}
                className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Business Justification & Compensating Factors *
            </label>
            <textarea
              id="input-exception-reason"
              rows={3}
              placeholder="Detail the mitigating risk controls, high credit score, prime collateral, or financial stability justifying this exception..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-exception"
              className="rounded bg-amber-800 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-900"
            >
              Submit Exception Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
