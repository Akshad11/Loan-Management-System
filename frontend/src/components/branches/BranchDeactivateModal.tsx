import React, { useState, useEffect } from 'react';
import { Modal } from '../shared/Modal';
import { FormField } from '../shared/FormField';
import { Branch } from '../../types';
import { AlertTriangle, Building2 } from 'lucide-react';

interface BranchDeactivateModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch | null;
  onConfirm: (branchId: string, reason: string) => void;
}

export const BranchDeactivateModal: React.FC<BranchDeactivateModalProps> = ({
  isOpen,
  onClose,
  branch,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setReason('');
    setError('');
  }, [isOpen]);

  if (!branch) return null;

  const handleDeactivate = () => {
    if (!reason.trim()) {
      setError('Please state an administrative reason for deactivating this branch.');
      return;
    }
    onConfirm(branch.id, reason.trim());
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Deactivate Branch Office"
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
            id="confirm-deactivate-branch-btn"
            onClick={handleDeactivate}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-700 border border-red-700 rounded hover:bg-red-800 transition-colors flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Deactivate Branch</span>
          </button>
        </>
      }
    >
      <div className="space-y-4 text-left">
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded p-3 text-red-900 text-xs">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Confirm Branch Deactivation</p>
            <p className="text-red-800 leading-relaxed">
              <strong>{branch.userCount} staff user(s)</strong> are currently assigned to this branch. Deactivating the branch will prevent new loan application intake and restrict staff assignment until a rebalancing is executed.
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
          <div className="flex justify-between">
            <span className="text-slate-500">Active Loans Monitored:</span>
            <span className="font-semibold text-slate-900">{branch.activeLoanCount} accounts</span>
          </div>
        </div>

        <FormField
          id="deactivate-branch-reason"
          label="Administrative Reason for Deactivation"
          type="textarea"
          rows={3}
          value={reason}
          onChange={(val) => {
            setReason(val);
            if (error) setError('');
          }}
          placeholder="e.g. Relocation, regional consolidation, or lease expiration..."
          required
          error={error}
          helperText="Reason will be logged into the system audit trail."
        />
      </div>
    </Modal>
  );
};
