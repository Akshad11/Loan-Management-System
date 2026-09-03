import React, { useState } from 'react';
import { CreditAssessmentRecord } from '../../types/creditTypes';
import { LMSUser } from '../../types';
import { UserCheck, ShieldCheck, AlertCircle } from 'lucide-react';

interface AssignmentModalProps {
  assessment: CreditAssessmentRecord;
  users: LMSUser[];
  onClose: () => void;
  onAssign: (officerId: string, officerName: string, notes: string) => void;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  assessment,
  users,
  onClose,
  onAssign,
}) => {
  // Filter credit officers or underwriting staff (or all active users)
  const creditOfficers = users.filter(
    (u) =>
      u.status === 'ACTIVE' &&
      (u.roleName?.toLowerCase().includes('credit') ||
        u.roleName?.toLowerCase().includes('underwriter') ||
        u.roleName?.toLowerCase().includes('officer') ||
        u.roleName?.toLowerCase().includes('manager') ||
        u.roleName?.toLowerCase().includes('admin'))
  );

  const [selectedOfficerId, setSelectedOfficerId] = useState(
    assessment.assignedToId || (creditOfficers[0]?.id || '')
  );
  const [notes, setNotes] = useState(assessment.assignmentNotes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const officer = users.find((u) => u.id === selectedOfficerId);
    if (!officer) return;

    onAssign(officer.id, officer.name, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase">
              Assign Credit Officer / Underwriter
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <div className="font-semibold text-slate-900">{assessment.customerName}</div>
            <div className="text-slate-500 font-mono text-[11px]">
              {assessment.assessmentNumber} • ₹{assessment.requestedAmount.toLocaleString('en-IN')} ({assessment.productName})
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Select Underwriter / Credit Analyst *
            </label>
            <select
              required
              value={selectedOfficerId}
              onChange={(e) => setSelectedOfficerId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              <option value="" disabled>-- Select Officer --</option>
              {creditOfficers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.roleName} - {u.branchName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Assignment Notes & Instructions
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Please expedite financial validation and verify ITR acknowledgment."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-slate-600 hover:text-slate-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Confirm Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
