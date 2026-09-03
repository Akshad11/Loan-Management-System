import React, { useState } from 'react';
import { ConditionCategory, ConditionStage, ApprovalCondition } from '../../types/approvalTypes';
import { PlusCircle, X, ShieldAlert } from 'lucide-react';

interface ApprovalConditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  approvalId: string;
  onAddCondition: (condition: Omit<ApprovalCondition, 'id' | 'approvalId' | 'addedAt'>) => void;
}

export const ApprovalConditionModal: React.FC<ApprovalConditionModalProps> = ({
  isOpen,
  onClose,
  approvalId,
  onAddCondition,
}) => {
  if (!isOpen) return null;

  const [category, setCategory] = useState<ConditionCategory>('DOCUMENTATION');
  const [description, setDescription] = useState<string>('');
  const [requiredBefore, setRequiredBefore] = useState<ConditionStage>('DISBURSEMENT');
  const [owner, setOwner] = useState<string>('Credit Operations / Branch Manager');
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Condition description is mandatory.');
      return;
    }

    onAddCondition({
      category,
      description: description.trim(),
      requiredBefore,
      owner,
      dueDate,
      status: 'OPEN',
      addedBy: 'Sanction Committee Approver',
      source: 'APPROVAL_STAGE',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PlusCircle className="h-4 w-4 text-indigo-700" />
            Add Sanction Covenant / Condition
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Covenant Stage *</label>
              <select
                id="select-condition-stage"
                value={requiredBefore}
                onChange={(e) => setRequiredBefore(e.target.value as ConditionStage)}
                className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
              >
                <option value="SANCTION">Pre-Sanction</option>
                <option value="DISBURSEMENT">Pre-Disbursement</option>
                <option value="POST_DISBURSEMENT">Post-Disbursement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <select
                id="select-condition-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ConditionCategory)}
                className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
              >
                <option value="DOCUMENTATION">Documentation</option>
                <option value="VERIFICATION">Verification</option>
                <option value="FINANCIAL">Financial</option>
                <option value="OPERATIONAL">Operational</option>
                <option value="LEGAL">Legal / Title</option>
                <option value="INSURANCE">Insurance</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Condition / Covenant Description *
            </label>
            <textarea
              id="input-condition-description"
              rows={3}
              placeholder="e.g. Original registered sale deed along with 13-year non-encumbrance certificate must be deposited prior to disbursement..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Responsible Owner</label>
              <input
                id="input-condition-owner"
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Due Date</label>
              <input
                id="input-condition-duedate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-none"
              />
            </div>
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
              id="btn-submit-condition"
              className="rounded bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
            >
              Add Covenant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
