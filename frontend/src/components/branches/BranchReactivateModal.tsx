import React, { useState, useEffect } from 'react';
import { Modal } from '../shared/Modal';
import { FormField } from '../shared/FormField';
import { Branch } from '../../types';
import { Building, ShieldCheck } from 'lucide-react';

interface BranchReactivateModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch | null;
  onConfirm: (branchId: string, reason?: string) => void;
}

export const BranchReactivateModal: React.FC<BranchReactivateModalProps> = ({
  isOpen,
  onClose,
  branch,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    setReason('');
  }, [isOpen]);

  if (!branch) return null;

  const handleReactivate = () => {
    onConfirm(branch.id, reason.trim());
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reactivate Branch Location"
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="confirm-reactivate-branch-btn"
            onClick={handleReactivate}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 border border-emerald-800 rounded hover:bg-emerald-900 transition-colors flex items-center gap-1.5"
          >
            <Building className="w-3.5 h-3.5" />
            <span>Reactivate Branch</span>
          </button>
        </>
      }
    >
      <div className="space-y-4 text-left">
        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded p-3 text-emerald-900 text-xs">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Confirm Branch Reactivation</p>
            <p className="text-emerald-800">
              Restoring this branch to ACTIVE status will allow new staff assignments and enable customer loan origination for this jurisdiction.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Branch Name:</span>
            <span className="font-bold text-slate-900">{branch.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Branch Code:</span>
            <span className="font-mono font-bold text-slate-900">{branch.code}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Location:</span>
            <span className="font-medium text-slate-900">{branch.city}, {branch.state}</span>
          </div>
        </div>

        <FormField
          id="reactivate-branch-reason"
          label="Administrative Note (Optional)"
          type="textarea"
          rows={2}
          value={reason}
          onChange={setReason}
          placeholder="e.g. Audit clearance completed / Premises reopening approved..."
          helperText="Reason will be logged into the immutable audit record."
        />
      </div>
    </Modal>
  );
};
