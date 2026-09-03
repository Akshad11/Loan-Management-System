import React, { useState } from 'react';
import { XCircle, AlertTriangle } from 'lucide-react';
import { Modal } from '../shared/Modal';
import { LoanApplicationRecord } from '../../types/applicationTypes';

interface ApplicationCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: LoanApplicationRecord;
  onConfirmCancel: (reason: string) => void;
}

export const ApplicationCancelModal: React.FC<ApplicationCancelModalProps> = ({
  isOpen,
  onClose,
  application,
  onConfirmCancel,
}) => {
  const [reason, setReason] = useState('');

  const handleCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onConfirmCancel(reason);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Cancel Loan Application — ${application.applicationNumber}`}
      maxWidth="md"
    >
      <form onSubmit={handleCancel} className="space-y-4">
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong>Are you sure you want to cancel this application?</strong>
            <p className="mt-1">
              Cancelling application for <strong>{application.customerName}</strong> ({application.productName}) will mark it as CANCELLED and withdraw it from the origination pipeline.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Reason for Application Withdrawal / Cancellation <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Borrower requested withdrawal following alternate funding arrangement..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-rose-500 focus:border-rose-500"
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-md border border-slate-300"
          >
            Keep Application
          </button>
          <button
            type="submit"
            disabled={!reason.trim()}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-md shadow-sm"
          >
            Confirm Cancellation
          </button>
        </div>
      </form>
    </Modal>
  );
};
