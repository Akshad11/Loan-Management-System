import React, { useState, useEffect } from 'react';
import { Modal } from '../shared/Modal';
import { FormField } from '../shared/FormField';
import { LMSUser } from '../../types';
import { AlertTriangle, UserX } from 'lucide-react';

interface UserDeactivateModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: LMSUser | null;
  onConfirm: (userId: string, reason: string) => void;
}

export const UserDeactivateModal: React.FC<UserDeactivateModalProps> = ({
  isOpen,
  onClose,
  user,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setReason('');
    setError('');
  }, [isOpen]);

  if (!user) return null;

  const handleDeactivate = () => {
    if (!reason.trim()) {
      setError('Please provide a specific administrative reason for deactivating this user.');
      return;
    }
    onConfirm(user.id, reason.trim());
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Deactivate Staff User Account"
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
            id="confirm-deactivate-user-btn"
            onClick={handleDeactivate}
            className="px-4 py-2 text-xs font-semibold text-white bg-red-700 border border-red-700 rounded hover:bg-red-800 transition-colors flex items-center gap-1.5"
          >
            <UserX className="w-3.5 h-3.5" />
            <span>Deactivate User</span>
          </button>
        </>
      }
    >
      <div className="space-y-4 text-left">
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded p-3 text-red-900 text-xs">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Confirm Deactivation Protocol</p>
            <p className="text-red-800">
              Deactivating this account will immediately revoke all active portal sessions and prevent the user from logging in or actioning loan tasks.
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
            <span className="text-slate-500">Assigned Branch:</span>
            <span className="font-medium text-slate-900">{user.branchName}</span>
          </div>
        </div>

        <FormField
          id="deactivate-user-reason"
          label="Administrative Reason for Deactivation"
          type="textarea"
          rows={3}
          value={reason}
          onChange={(val) => {
            setReason(val);
            if (error) setError('');
          }}
          placeholder="e.g. Employee resignation / Department transfer / Security review..."
          required
          error={error}
          helperText="Reason will be logged immutably into the system audit trail."
        />
      </div>
    </Modal>
  );
};
