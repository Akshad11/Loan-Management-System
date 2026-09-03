import React, { useState } from 'react';
import { ApprovalRecord, LoanApplicationRecord } from '../../types';
import { Plus, X } from 'lucide-react';

interface SanctionCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  approvedApplications: {
    application: LoanApplicationRecord;
    approval?: ApprovalRecord;
  }[];
  onCreateSanction: (data: {
    applicationId: string;
    approvalId: string;
    terms?: any;
    termDeviationReason?: string;
  }) => void;
}

export const SanctionCreateModal: React.FC<SanctionCreateModalProps> = ({
  isOpen,
  onClose,
  approvedApplications,
  onCreateSanction,
}) => {
  const [selectedAppId, setSelectedAppId] = useState(approvedApplications[0]?.application.id || '');
  const [termDeviationReason, setTermDeviationReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const selectedItem = approvedApplications.find((item) => item.application.id === selectedAppId);
  const application = selectedItem?.application;
  const approval = selectedItem?.approval;

  const handleCreate = () => {
    if (!selectedAppId || !application) {
      setError('Please select an approved loan application.');
      return;
    }

    onCreateSanction({
      applicationId: application.id,
      approvalId: approval?.id || `apprv_${application.id}`,
      termDeviationReason: termDeviationReason.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-300 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Draft New Sanction Dossier</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {approvedApplications.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No approved loan applications currently available for drafting sanctions. Ensure credit assessments and committee approvals are completed first.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Approved Loan Application*
              </label>
              <select
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
              >
                {approvedApplications.map(({ application, approval }) => (
                  <option key={application.id} value={application.id}>
                    {application.customerName} — {application.productName} (₹{(approval?.approvedAmount || approval?.recommendedAmount || application.requestedAmount).toLocaleString('en-IN')}) • App #{application.applicationNumber}
                  </option>
                ))}
              </select>
            </div>

            {application && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Borrower:</span>
                  <span className="font-semibold text-slate-900">{application.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Facility Type:</span>
                  <span className="text-slate-900">{application.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Approved Limit:</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{(approval?.approvedAmount || approval?.recommendedAmount || application.requestedAmount).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Interest Rate & Tenure:</span>
                  <span className="font-mono text-slate-900">
                    {approval?.approvedInterestRate || approval?.recommendedInterestRate || application.interestRate}% p.a. • {approval?.approvedTenureMonths || approval?.recommendedTenureMonths || application.requestedTenureMonths} Months
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Credit Approval Ref:</span>
                  <span className="font-mono text-slate-700">{approval?.approvalNumber || 'APPRV-COMMITTEE-PASS'}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Drafting Notes / Deviation Reason (Optional)
              </label>
              <textarea
                rows={2}
                value={termDeviationReason}
                onChange={(e) => setTermDeviationReason(e.target.value)}
                placeholder="Any special remarks or reason for adjusting terms from credit memo..."
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>

            {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md border border-slate-300"
          >
            Cancel
          </button>
          {approvedApplications.length > 0 && (
            <button
              onClick={handleCreate}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-md shadow-xs transition-colors"
            >
              Initialize Sanction Dossier
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
