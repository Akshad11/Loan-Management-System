import React from 'react';
import { CustomerRecord } from '../../types';
import { Modal } from '../shared/Modal';
import { AlertTriangle, ExternalLink, Copy, Check } from 'lucide-react';
import { CustomerStatusBadge } from './CustomerStatusBadge';

interface DuplicateCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  matches: CustomerRecord[];
  onViewCustomer: (customer: CustomerRecord) => void;
  onContinueAnyway: () => void;
}

export const DuplicateCustomerDialog: React.FC<DuplicateCustomerDialogProps> = ({
  isOpen,
  onClose,
  matches,
  onViewCustomer,
  onContinueAnyway,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const primaryMatch = matches[0];
  if (!primaryMatch) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Possible Existing Customer Detected"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-slate-300 text-xs font-semibold text-slate-700 rounded hover:bg-slate-50 focus:outline-none"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onContinueAnyway}
              className="px-3.5 py-1.5 border border-amber-300 bg-amber-50 text-xs font-semibold text-amber-900 rounded hover:bg-amber-100 focus:outline-none"
            >
              Continue Anyway
            </button>
            <button
              type="button"
              onClick={() => onViewCustomer(primaryMatch)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-xs font-semibold text-white rounded hover:bg-slate-800 focus:outline-none"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Existing Customer</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <div className="font-semibold mb-0.5">Potential Duplicate Record Found</div>
            <div>
              We found {matches.length} customer record{matches.length > 1 ? 's' : ''} with matching identification criteria
              (mobile number, email address, or name and date of birth). Review before creating a new record.
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {matches.map((cust) => (
            <div
              key={cust.id}
              className="p-3.5 border border-slate-200 rounded bg-white hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{cust.name}</span>
                    <CustomerStatusBadge status={cust.status} size="sm" />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                      {cust.customerNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(cust.customerNumber)}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none"
                      title="Copy Customer ID"
                    >
                      {copiedId === cust.customerNumber ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="text-xs text-slate-600">{cust.branchName}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onViewCustomer(cust)}
                  className="text-xs font-semibold text-slate-900 hover:underline flex items-center gap-1"
                >
                  <span>Open Profile</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Primary Mobile</span>
                  <span className="font-medium text-slate-800">{cust.mobile}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Email</span>
                  <span className="font-medium text-slate-800 truncate block">{cust.email || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Date of Birth</span>
                  <span className="font-medium text-slate-800">{cust.dateOfBirth}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Active Exposure</span>
                  <span className="font-medium text-slate-800">
                    {cust.activeLoanCount} active loans
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
