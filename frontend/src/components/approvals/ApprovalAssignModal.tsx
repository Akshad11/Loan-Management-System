import React, { useState } from 'react';
import { ApprovalRecord } from '../../types/approvalTypes';
import { UserCheck, X, Shield } from 'lucide-react';

interface ApprovalAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  approval?: ApprovalRecord | null;
  selectedApprovalIds?: string[];
  approvers: { id: string; name: string; role: string; branchId: string }[];
  onAssign: (approverId: string, approverName: string, notes?: string) => void;
}

export const ApprovalAssignModal: React.FC<ApprovalAssignModalProps> = ({
  isOpen,
  onClose,
  approval,
  selectedApprovalIds = [],
  approvers,
  onAssign,
}) => {
  if (!isOpen) return null;

  const isBulk = !approval && selectedApprovalIds.length > 0;
  const currentLevelExecution = approval?.levels[approval?.currentLevelIndex];

  const [selectedApproverId, setSelectedApproverId] = useState<string>(
    approvers.length > 0 ? approvers[0].id : ''
  );
  const [assignmentNotes, setAssignmentNotes] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selected = approvers.find((a) => a.id === selectedApproverId);
    if (!selected) return;

    onAssign(selected.id, selected.name, assignmentNotes.trim() || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-indigo-700" />
              {isBulk ? `Bulk Assign ${selectedApprovalIds.length} Cases` : 'Assign / Reassign Approver'}
            </h3>
            {approval && (
              <p className="text-xs text-slate-500 mt-0.5">
                {approval.approvalNumber} • Level {approval.currentLevelIndex + 1} ({currentLevelExecution?.levelName})
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {currentLevelExecution && (
            <div className="rounded border border-indigo-100 bg-indigo-50/50 p-2.5 text-xs text-indigo-900 flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-600 flex-shrink-0" />
              <span>
                Required Delegation Role:{' '}
                <strong>{currentLevelExecution.requiredRoleName}</strong> (Limit: ₹{currentLevelExecution.authorityLimit.toLocaleString('en-IN')})
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Designated Approver *
            </label>
            <select
              id="select-assign-approver"
              value={selectedApproverId}
              onChange={(e) => setSelectedApproverId(e.target.value)}
              className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-sm text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
            >
              {approvers.map((appr) => (
                <option key={appr.id} value={appr.id}>
                  {appr.name} — {appr.role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assignment Notes / Instructions
            </label>
            <textarea
              id="input-assign-notes"
              rows={3}
              placeholder="e.g. Priority sanction file. Please review collateral valuation covenants before decision..."
              value={assignmentNotes}
              onChange={(e) => setAssignmentNotes(e.target.value)}
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
              id="btn-confirm-assign"
              className="rounded bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
            >
              Confirm Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
