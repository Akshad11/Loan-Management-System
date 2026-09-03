import React, { useState } from 'react';
import { CustomerRecord } from '../../types';
import { Modal } from '../shared/Modal';
import { Archive, AlertCircle } from 'lucide-react';

interface CustomerArchiveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerRecord | null;
  onConfirm: (reason: string) => void;
}

export const CustomerArchiveDialog: React.FC<CustomerArchiveDialogProps> = ({
  isOpen,
  onClose,
  customer,
  onConfirm,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!customer) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide an operational or compliance reason for archiving this customer.');
      return;
    }
    setError(null);
    onConfirm(reason.trim());
    setReason('');
  };

  const handleClose = () => {
    setReason('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Archive Customer Record"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={handleClose}
            className="px-3.5 py-1.5 border border-slate-300 text-xs font-semibold text-slate-700 rounded hover:bg-slate-50 focus:outline-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 text-xs font-semibold text-white rounded hover:bg-amber-700 focus:outline-none"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archive Customer</span>
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Regulatory & Compliance Notice</span>
          </div>
          <p>
            Archiving <strong>{customer.name} ({customer.customerNumber})</strong> will remove this record from standard active customer searches and onboarding pipelines.
          </p>
          <p className="text-amber-800">
            <strong>Important:</strong> All linked historical loan accounts, repayment ledgers, and credit audit logs remain permanently accessible in accordance with statutory retention policies.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Archiving Justification / Reason <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. Customer migrated overseas and closed all facilities, duplicate profile merged, or requested dormancy."
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800"
          />
          {error && <p className="text-xs text-rose-600 mt-1 font-medium">{error}</p>}
        </div>
      </form>
    </Modal>
  );
};
