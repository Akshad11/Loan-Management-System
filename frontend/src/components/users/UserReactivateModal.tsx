import React, { useState, useEffect } from 'react';
import { Modal } from '../shared/Modal';
import { FormField } from '../shared/FormField';
import { LMSUser } from '../../types';
import { UserCheck, ShieldCheck } from 'lucide-react';

interface UserReactivateModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: LMSUser | null;
  onConfirm: (userId: string, reason?: string) => void;
}

export const UserReactivateModal: React.FC<UserReactivateModalProps> = ({
  isOpen,
  onClose,
  user,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    setReason('');
  }, [isOpen]);

  if (!user) return null;

  const handleReactivate = () => {
    onConfirm(user.id, reason.trim());
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reactivate Staff User Account"
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
            id="confirm-reactivate-user-btn"
            onClick={handleReactivate}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-800 border border-emerald-800 rounded hover:bg-emerald-900 transition-colors flex items-center gap-1.5"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Reactivate Account</span>
          </button>
        </>
      }
    >
      <div className="space-y-4 text-left">
        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded p-3 text-emerald-900 text-xs">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Confirm Account Reactivation</p>
            <p className="text-emerald-800">
              Restoring this account to ACTIVE will allow the user to authenticate and action loan workflows with their assigned role.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Employee:</span>
            <span className="font-bold text-slate-900">{user.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Employee ID:</span>
            <span className="font-mono font-bold text-slate-900">{user.employeeId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Role:</span>
            <span className="font-medium text-slate-900">{user.roleName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Branch:</span>
            <span className="font-medium text-slate-900">{user.branchName}</span>
          </div>
        </div>

        <FormField
          id="reactivate-user-reason"
          label="Administrative Note (Optional)"
          type="textarea"
          rows={2}
          value={reason}
          onChange={setReason}
          placeholder="e.g. Return from leave / Reinstatement approved by HR..."
          helperText="Reason will be logged into the system audit trail."
        />
      </div>
    </Modal>
  );
};
