import React from 'react';
import { Modal } from '../shared/Modal';
import { ShieldAlert } from 'lucide-react';

interface RoleSafetyModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleName: string;
}

export const RoleSafetyModal: React.FC<RoleSafetyModalProps> = ({
  isOpen,
  onClose,
  roleName,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="System Protection Safeguard"
      maxWidth="sm"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="w-full px-4 py-2 text-xs font-semibold text-white bg-slate-900 border border-slate-900 rounded hover:bg-slate-800 transition-colors"
        >
          Acknowledge & Close
        </button>
      }
    >
      <div className="space-y-3 text-left">
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded p-3 text-red-900 text-xs">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Protected Core Role</p>
            <p className="text-red-800 leading-relaxed">
              <strong>{roleName}</strong> is a core system-protected role. To prevent catastrophic system lockout, this role cannot be deactivated or deleted.
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          You may modify non-administrative permissions or assign/unassign individual staff users, but at least one active System Administrator role must remain intact.
        </p>
      </div>
    </Modal>
  );
};
