import React, { useState } from 'react';
import { CreditAssessmentRecord } from '../../types/creditTypes';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface ReturnAssessmentModalProps {
  assessment: CreditAssessmentRecord;
  onClose: () => void;
  onConfirmReturn: (returnReason: string, returnRequiredAction: string) => void;
}

export const ReturnAssessmentModal: React.FC<ReturnAssessmentModalProps> = ({
  assessment,
  onClose,
  onConfirmReturn,
}) => {
  const [returnReason, setReturnReason] = useState('Income & Document Discrepancy');
  const [returnRequiredAction, setReturnRequiredAction] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnRequiredAction.trim()) return;

    onConfirmReturn(returnReason, returnRequiredAction);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-6 text-xs">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase">
              Return Assessment to Sourcing Branch
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Application Workflow State Transition Notice
            </div>
            <p className="text-[11px] text-rose-700">
              Returning this case will pause credit assessment and move Application{' '}
              <strong>{assessment.applicationNumber}</strong> into <strong>ACTION REQUIRED</strong> state.
              The sourcing officer will be notified to collect supplementary information or rectify discrepancies.
            </p>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Primary Return Reason Category *
            </label>
            <select
              required
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-rose-500 font-medium"
            >
              <option value="Income & Document Discrepancy">Income & Document Discrepancy</option>
              <option value="Missing Crucial KYC / Identity Proof">Missing Crucial KYC / Identity Proof</option>
              <option value="Incomplete Bank Statement (Missing Pages)">Incomplete Bank Statement (Missing Pages)</option>
              <option value="Collateral Title Search Report Clarification">Collateral Title Search Report Clarification</option>
              <option value="GST / Business Turnover Turnover Variance">GST / Business Turnover Variance</option>
              <option value="Co-applicant / Guarantor Signature Required">Co-applicant / Guarantor Signature Required</option>
              <option value="Other Underwriting Clarification">Other Underwriting Clarification</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Specific Rectification Required from Sourcing Officer *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Detail exactly what documents, explanations, or revised declarations are needed from the sourcing officer..."
              value={returnRequiredAction}
              onChange={(e) => setReturnRequiredAction(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-rose-500 font-medium"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-slate-600 hover:text-slate-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 text-white font-bold rounded hover:bg-rose-700 transition-colors shadow-sm"
            >
              Return Case to Sourcing
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
