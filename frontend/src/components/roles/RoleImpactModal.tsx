import React, { useState } from 'react';
import { Modal } from '../shared/Modal';
import { FormField } from '../shared/FormField';
import { Role } from '../../types';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

interface RoleImpactModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
  newPermissionCount: number;
  onConfirm: (reason: string) => void;
}

export const RoleImpactModal: React.FC<RoleImpactModalProps> = ({
  isOpen,
  onClose,
  role,
  newPermissionCount,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!role) return null;

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Please state an administrative reason for updating this role.');
      return;
    }
    onConfirm(reason.trim());
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Role Permission Modifications"
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
            id="confirm-save-role-impact-btn"
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 border border-slate-900 rounded hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Apply Permission Changes</span>
          </button>
        </>
      }
    >
      <div className="space-y-4 text-left">
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded p-3 text-amber-900 text-xs">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Role Scope Propagation</p>
            <p className="text-amber-800 leading-relaxed">
              Modifying permissions for <strong>{role.name}</strong> will take immediate effect for all{' '}
              <strong>{role.userCount} active staff user(s)</strong> assigned to this role.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Role Name:</span>
            <span className="font-bold text-slate-900">{role.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Affected Users:</span>
            <span className="font-mono font-bold text-slate-900">{role.userCount} users</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Granted Permissions:</span>
            <span className="font-semibold text-slate-900">
              {(role.permissionIds || (role as any).permissions || []).length} → {newPermissionCount} permissions
            </span>
          </div>
        </div>

        <FormField
          id="role-change-reason"
          label="Administrative Reason for Modification"
          type="textarea"
          rows={3}
          value={reason}
          onChange={(val) => {
            setReason(val);
            if (error) setError('');
          }}
          placeholder="e.g. Policy update: Enabling disbursement authority for operations tier..."
          required
          error={error}
          helperText="This reason is permanently logged in the compliance audit ledger."
        />
      </div>
    </Modal>
  );
};
