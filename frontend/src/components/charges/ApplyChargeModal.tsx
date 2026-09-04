import React, { useState, useEffect } from 'react';
import { X, DollarSign, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Building } from 'lucide-react';
import { ChargeConfigurationRecord, ApplyChargePayload, ChargeType } from '../../types/chargeAdjustmentTypes';
import { LoanAccountRecord } from '../../types/loanAccountTypes';
import { calculateChargeAmount } from '../../services/chargeAdjustmentEngine';
import { formatCurrencyINR } from '../../utils/formatters';

interface ApplyChargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  loans: LoanAccountRecord[];
  configs: ChargeConfigurationRecord[];
  initialLoanId?: string | null;
  currentUser: { id: string; name: string; roleName: string };
  onSubmit: (payload: ApplyChargePayload) => Promise<void>;
}

export const ApplyChargeModal: React.FC<ApplyChargeModalProps> = ({
  isOpen,
  onClose,
  loans,
  configs,
  initialLoanId,
  currentUser,
  onSubmit,
}) => {
  const [selectedLoanId, setSelectedLoanId] = useState<string>(initialLoanId || '');
  const [selectedConfigCode, setSelectedConfigCode] = useState<string>(configs[0]?.chargeCode || 'LATE_FEE_MONTHLY');
  const [customAmount, setCustomAmount] = useState<number>(500);
  const [taxPercentage, setTaxPercentage] = useState<number>(18.0);
  const [sourceEvent, setSourceEvent] = useState<string>('MANUAL_ASSESSMENT');
  const [notes, setNotes] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialLoanId) setSelectedLoanId(initialLoanId);
  }, [initialLoanId]);

  const selectedLoan = loans.find((l) => l.id === selectedLoanId || l.accountNumber === selectedLoanId);
  const selectedConfig = configs.find((c) => c.chargeCode === selectedConfigCode);

  useEffect(() => {
    if (selectedConfig && selectedLoan) {
      if (selectedConfig.calculationBasis === 'FIXED_AMOUNT') {
        setCustomAmount(selectedConfig.rateOrValue || 500);
      } else if (selectedConfig.calculationBasis === 'PERCENTAGE_OF_OVERDUE') {
        const amt = ((Number(selectedLoan.overdueAmount || 0) * selectedConfig.rateOrValue) / 100);
        setCustomAmount(Math.max(selectedConfig.minAmount || 500, Math.round(amt)));
      }
      setTaxPercentage(selectedConfig.taxPercentage || 18.0);
    }
  }, [selectedConfigCode, selectedLoanId, selectedConfig, selectedLoan]);

  if (!isOpen) return null;

  const calculated = selectedLoan
    ? calculateChargeAmount({
        config: selectedConfig || { calculationBasis: 'FIXED_AMOUNT', rateOrValue: customAmount, taxPercentage },
        loan: selectedLoan,
        customAmount,
      })
    : { baseAmount: customAmount, taxAmount: (customAmount * taxPercentage) / 100, totalAmount: customAmount * (1 + taxPercentage / 100) };

  const handleSubmit = async () => {
    if (!selectedLoan) {
      setErrorMsg('Please select a loan account.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await onSubmit({
        loanId: selectedLoan.id,
        chargeCode: selectedConfig?.chargeCode || 'MANUAL_FEE',
        chargeName: selectedConfig?.chargeName || 'Manual Fee Assessment',
        chargeType: selectedConfig?.chargeType || 'OTHER_FEE',
        customAmount,
        taxPercentage,
        dueDate,
        sourceEvent,
        notes,
        createdBy: currentUser.name,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to apply charge.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Apply Fee / Charge</h2>
              <p className="text-xs text-indigo-200">Levy configuration-driven fee or penalty to loan account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Loan Account <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedLoanId}
              onChange={(e) => setSelectedLoanId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">-- Choose Loan Account --</option>
              {loans.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.accountNumber} — {l.customerName} | Balance: ₹{Number(l.outstandingPrincipal).toLocaleString()} | DPD: {l.dpd}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Charge Type / Rule
              </label>
              <select
                value={selectedConfigCode}
                onChange={(e) => setSelectedConfigCode(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
              >
                {configs.map((c) => (
                  <option key={c.id} value={c.chargeCode}>
                    {c.chargeName} ({c.calculationBasis.replace(/_/g, ' ')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Source Event Trigger
              </label>
              <select
                value={sourceEvent}
                onChange={(e) => setSourceEvent(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
              >
                <option value="MANUAL_ASSESSMENT">Manual Operations Assessment</option>
                <option value="PAYMENT_RETURNED">Payment Bounce / Return</option>
                <option value="PAYMENT_LATE">Delinquency Overdue Late Trigger</option>
                <option value="NOTICE_ISSUED">Legal Notice Dispatch</option>
                <option value="COLLECTION_EVENT">Field Visit & Inspection</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Base Amount (₹)
              </label>
              <input
                type="number"
                min={1}
                value={customAmount}
                onChange={(e) => setCustomAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                GST Tax Rate (%)
              </label>
              <input
                type="number"
                min={0}
                max={28}
                value={taxPercentage}
                onChange={(e) => setTaxPercentage(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Real-time Tax & Total Card */}
          <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-500 block">Base Amount</span>
              <span className="font-bold text-slate-900">{formatCurrencyINR(calculated.baseAmount)}</span>
            </div>
            <div className="text-center">
              <span className="text-slate-500 block">GST Tax ({taxPercentage}%)</span>
              <span className="font-bold text-slate-900">+{formatCurrencyINR(calculated.taxAmount)}</span>
            </div>
            <div className="text-right">
              <span className="text-indigo-700 font-bold block uppercase text-[10px]">Total Charge Payable</span>
              <span className="text-base font-black text-indigo-900">{formatCurrencyINR(calculated.totalAmount)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Assessment Notes / Reference
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. NACH mandate return reason: insufficient funds on 15th August..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedLoan}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Levying Charge...' : 'Apply & Post Charge'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
