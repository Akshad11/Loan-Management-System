import React, { useState } from 'react';
import {
  X,
  Layers,
  History,
  AlertTriangle,
  Calendar,
  Percent,
  Clock,
} from 'lucide-react';
import { LoanAccountRecord, LoanRepaymentFrequency } from '../../types/loanAccountTypes';
import { formatCurrencyINR } from '../../utils/formatters';

interface ScheduleVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: LoanAccountRecord;
  onGenerate: (payload: {
    reason: string;
    annualRate?: number;
    tenureMonths?: number;
    frequency?: LoanRepaymentFrequency;
  }) => void;
}

export const ScheduleVersionModal: React.FC<ScheduleVersionModalProps> = ({
  isOpen,
  onClose,
  loan,
  onGenerate,
}) => {
  const [reason, setReason] = useState('');
  const [annualRate, setAnnualRate] = useState<number>(loan.interestRate);
  const [tenureMonths, setTenureMonths] = useState<number>(loan.remainingInstalments || loan.tenureMonths);
  const [frequency, setFrequency] = useState<LoanRepaymentFrequency>(loan.repaymentFrequency);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A valid business justification is mandatory to generate a new schedule version.');
      return;
    }

    onGenerate({
      reason: reason.trim(),
      annualRate: Number(annualRate),
      tenureMonths: Number(tenureMonths),
      frequency,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Generate Schedule Version {(loan.currentScheduleVersion || 1) + 1}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">Account: {loan.accountNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              Generating a new version will supersede the current active schedule. Historical versions remain preserved and immutable in the audit trail.
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Business Justification / Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Approved restructuring: Extended tenure by 12 months per Credit Committee approval..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              required
            />
            {error && <p className="text-[11px] text-rose-600 mt-1">{error}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Annual Interest Rate (% p.a.)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="50"
                value={annualRate}
                onChange={(e) => setAnnualRate(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Remaining Tenure (Months)
              </label>
              <input
                type="number"
                min="1"
                max="360"
                value={tenureMonths}
                onChange={(e) => setTenureMonths(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Repayment Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as LoanRepaymentFrequency)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="MONTHLY">MONTHLY (12 instalments/yr)</option>
              <option value="BI_WEEKLY">BI-WEEKLY (26 instalments/yr)</option>
              <option value="WEEKLY">WEEKLY (52 instalments/yr)</option>
              <option value="QUARTERLY">QUARTERLY (4 instalments/yr)</option>
            </select>
          </div>

          <div className="pt-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-500">Amortization Basis:</span>
            <div className="font-bold text-slate-900 mt-0.5">
              Principal Balance: {formatCurrencyINR(loan.principalOutstanding, false)}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              Generate & Activate Version
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
