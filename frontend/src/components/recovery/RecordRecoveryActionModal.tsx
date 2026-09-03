import React, { useState } from 'react';
import {
  X,
  PhoneCall,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  User,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  RecoveryCaseRecord,
  RecoveryActionType,
  RecoveryOutcome,
  RecordRecoveryActionPayload,
} from '../../types/recoveryTypes';
import { formatCurrencyINR } from '../../utils/formatters';

interface RecordRecoveryActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  recoveryCase: RecoveryCaseRecord;
  onSubmit: (payload: RecordRecoveryActionPayload) => void;
  currentUser?: { name: string; id: string; roleName: string };
}

export const RecordRecoveryActionModal: React.FC<RecordRecoveryActionModalProps> = ({
  isOpen,
  onClose,
  recoveryCase,
  onSubmit,
  currentUser,
}) => {
  const [actionType, setActionType] = useState<RecoveryActionType>('FIELD_VISIT');
  const [actionDate, setActionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [outcome, setOutcome] = useState<RecoveryOutcome>('CONTACTED');
  const [outcomeNotes, setOutcomeNotes] = useState<string>('');
  const [promisedAmount, setPromisedAmount] = useState<string>('');
  const [promisedDate, setPromisedDate] = useState<string>('');
  const [nextAction, setNextAction] = useState<string>('');
  const [nextActionDate, setNextActionDate] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!actionDate) newErrors.actionDate = 'Action date is required.';
    if (!outcomeNotes.trim()) newErrors.outcomeNotes = 'Please provide detailed interaction notes.';

    if (outcome === 'PTP_OBTAINED' || outcome === 'PARTIAL_PAYMENT_PROMISE') {
      const numPromised = parseFloat(promisedAmount);
      if (isNaN(numPromised) || numPromised <= 0) {
        newErrors.promisedAmount = 'Promised amount is required for PTP outcomes.';
      }
      if (!promisedDate) {
        newErrors.promisedDate = 'Promised payment date is required for PTP outcomes.';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload: RecordRecoveryActionPayload = {
      recoveryCaseId: recoveryCase.id,
      actionType,
      actionDate,
      outcome,
      outcomeNotes: outcomeNotes.trim(),
      promisedAmount: promisedAmount ? parseFloat(promisedAmount) : undefined,
      promisedDate: promisedDate || undefined,
      nextAction: nextAction.trim() || undefined,
      nextActionDate: nextActionDate || undefined,
      location: location.trim() || undefined,
    };

    onSubmit(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Log Recovery Action / Interaction
              </h3>
              <p className="text-xs text-slate-500">
                Case: <span className="font-mono font-semibold text-slate-700">{recoveryCase.recoveryCaseNumber}</span> • {recoveryCase.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Overdue Snapshot */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-slate-500 block text-[11px]">Overdue Amount</span>
              <span className="font-mono font-bold text-rose-600 text-sm">
                {formatCurrencyINR(recoveryCase.overdueAmount)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Total Outstanding</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {formatCurrencyINR(recoveryCase.totalOutstanding)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Current DPD</span>
              <span className="font-mono font-bold text-slate-800 text-sm">
                {recoveryCase.dpd} Days ({recoveryCase.dpdBucket})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Action Type */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Action Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={actionType}
                onChange={(e) => setActionType(e.target.value as RecoveryActionType)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="FIELD_VISIT">Field Visit to Residence/Workplace</option>
                <option value="PHONE_CALL">Telephonic Recovery Call</option>
                <option value="CUSTOMER_MEETING">Branch Office Meeting</option>
                <option value="DEMAND_NOTICE">Physical Demand Notice Handover</option>
                <option value="NEGOTIATION">Repayment Arrangement Negotiation</option>
                <option value="ADDRESS_VERIFICATION">Skip Tracing / Address Verification</option>
                <option value="REFERENCE_CONTACT">Contact with Co-Borrower / Reference</option>
                <option value="FOLLOW_UP">General Follow-Up</option>
              </select>
            </div>

            {/* Action Date */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Action Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={actionDate}
                onChange={(e) => setActionDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.actionDate && <p className="text-rose-500 mt-1">{errors.actionDate}</p>}
            </div>

            {/* Outcome Disposition */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Interaction Outcome <span className="text-rose-500">*</span>
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as RecoveryOutcome)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="CONTACTED">Contacted & Discussed</option>
                <option value="PTP_OBTAINED">Promise to Pay (PTP) Obtained</option>
                <option value="PARTIAL_PAYMENT_PROMISE">Partial Payment Promised</option>
                <option value="NO_ANSWER">Unreachable / No Answer / Door Locked</option>
                <option value="REFUSED_PAYMENT">Customer Refused to Cooperate</option>
                <option value="FINANCIAL_HARDSHIP">Financial Hardship / Loss of Income</option>
                <option value="DISPUTE_RAISED">Dispute on Charges / Balances</option>
                <option value="ADDRESS_UNTRACEABLE">Address Untraceable / Moved Away</option>
                <option value="LEGAL_RECOMMENDED">Recommended for Immediate Legal Action</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Location / Contacted Number
              </label>
              <input
                type="text"
                placeholder="e.g. Borrower Residence, Panaji or +91 98221..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Conditional PTP Fields */}
          {(outcome === 'PTP_OBTAINED' || outcome === 'PARTIAL_PAYMENT_PROMISE') && (
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3 animate-in fade-in duration-150">
              <span className="font-bold text-emerald-900 block">
                Promise to Pay (PTP) Commitments
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-emerald-950 mb-1">
                    Promised Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 25000"
                    value={promisedAmount}
                    onChange={(e) => setPromisedAmount(e.target.value)}
                    className="w-full px-3 py-1.5 font-mono font-bold border border-emerald-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {errors.promisedAmount && (
                    <p className="text-rose-600 mt-1">{errors.promisedAmount}</p>
                  )}
                </div>
                <div>
                  <label className="block font-bold text-emerald-950 mb-1">
                    Promised Payment Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={promisedDate}
                    onChange={(e) => setPromisedDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-emerald-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {errors.promisedDate && (
                    <p className="text-rose-600 mt-1">{errors.promisedDate}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Detailed Interaction Notes */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
              Detailed Interaction Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Record detailed feedback, reason for delay, borrower demeanor, and action agreed upon..."
              value={outcomeNotes}
              onChange={(e) => setOutcomeNotes(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.outcomeNotes && <p className="text-rose-500 mt-1">{errors.outcomeNotes}</p>}
          </div>

          {/* Next Action Scheduling */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Next Follow-Up Action
              </label>
              <input
                type="text"
                placeholder="e.g. Follow-up on promised payment / Legal Notice"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Next Action Due Date
              </label>
              <input
                type="date"
                value={nextActionDate}
                onChange={(e) => setNextActionDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-xs">
          <span className="text-slate-500">
            Officer: <span className="font-semibold text-slate-700">{currentUser?.name || 'Recovery Officer'}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 font-semibold text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
            >
              Save & Log Activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
