import React, { useState } from 'react';
import { SanctionConditionCategory } from '../../types/sanctionTypes';
import { X, Plus } from 'lucide-react';

interface SanctionConditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCondition: (condition: {
    category: SanctionConditionCategory;
    description: string;
    requiredBefore: 'SANCTION' | 'DISBURSEMENT' | 'POST_DISBURSEMENT';
    dueDate?: string;
    owner?: string;
  }) => void;
}

export const SanctionConditionModal: React.FC<SanctionConditionModalProps> = ({
  isOpen,
  onClose,
  onAddCondition,
}) => {
  const [category, setCategory] = useState<SanctionConditionCategory>('DOCUMENTATION');
  const [description, setDescription] = useState('');
  const [requiredBefore, setRequiredBefore] = useState<'SANCTION' | 'DISBURSEMENT' | 'POST_DISBURSEMENT'>('DISBURSEMENT');
  const [dueDate, setDueDate] = useState('2026-09-15');
  const [owner, setOwner] = useState('Loan Operations');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!description.trim() || description.trim().length < 5) {
      setError('Condition covenant description must be at least 5 characters.');
      return;
    }

    onAddCondition({
      category,
      description: description.trim(),
      requiredBefore,
      dueDate: dueDate || undefined,
      owner: owner || undefined,
    });

    setDescription('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-300 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">Add Sanction Covenant / Condition</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Covenant Category*</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SanctionConditionCategory)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="DOCUMENTATION">Document Verification</option>
              <option value="LEGAL">Legal & Title Clearance</option>
              <option value="FINANCIAL">Financial / Bank Mandate</option>
              <option value="INSURANCE">Insurance & Protection</option>
              <option value="OPERATIONAL">Operational Stipulation</option>
              <option value="OTHER">Other Compliance</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Required Enforcement Stage*</label>
            <select
              value={requiredBefore}
              onChange={(e) => setRequiredBefore(e.target.value as any)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="DISBURSEMENT">Pre-Disbursement (Must be satisfied before payout)</option>
              <option value="SANCTION">Pre-Sanction (Prior to sanction confirmation)</option>
              <option value="POST_DISBURSEMENT">Post-Disbursement (Covenant monitored after payout)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Condition Description / Covenant*</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setError('');
              }}
              placeholder="e.g. Original property title deed to be deposited with the branch and verified by legal counsel..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Resolution Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Department / Owner</label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="e.g. Legal Operations"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900"
              />
            </div>
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
            onClick={handleSubmit}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-md shadow-xs"
          >
            Add Covenant
          </button>
        </div>
      </div>
    </div>
  );
};
