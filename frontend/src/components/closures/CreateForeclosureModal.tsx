import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, Calculator, Calendar, DollarSign } from 'lucide-react';
import { LoanAccountRecord } from '../../types/loanAccountTypes';
import { CreateForeclosurePayload } from '../../types/closureTypes';
import { calculateForeclosureQuote } from '../../services/closureEngine';
import { formatCurrencyINR } from '../../utils/formatters';

interface CreateForeclosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  loans: LoanAccountRecord[];
  initialLoanId?: string | null;
  currentUser: { id: string; name: string; roleName: string };
  onSubmit: (payload: CreateForeclosurePayload) => Promise<void>;
}

export const CreateForeclosureModal: React.FC<CreateForeclosureModalProps> = ({
  isOpen,
  onClose,
  loans,
  initialLoanId,
  currentUser,
  onSubmit,
}) => {
  const [selectedLoanId, setSelectedLoanId] = useState<string>(initialLoanId || '');
  const [calculationDate, setCalculationDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [foreclosureFeeRate, setForeclosureFeeRate] = useState<number>(2.0); // 2%
  const [taxPercentage, setTaxPercentage] = useState<number>(18.0); // 18% GST
  const [reason, setReason] = useState<string>('Customer requested official early prepayment foreclosure quote.');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialLoanId) setSelectedLoanId(initialLoanId);
  }, [initialLoanId]);

  const selectedLoan = loans.find((l) => l.id === selectedLoanId || l.accountNumber === selectedLoanId);

  if (!isOpen) return null;

  const quote = selectedLoan
    ? calculateForeclosureQuote({
        loan: selectedLoan,
        calculationDate,
        foreclosureFeeRate,
        taxPercentage,
      })
    : null;

  const handleSubmit = async () => {
    if (!selectedLoan) {
      setErrorMsg('Please select a loan account.');
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('Please enter a foreclosure reason.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await onSubmit({
        loanId: selectedLoan.id,
        calculationDate,
        foreclosureFeeRate,
        taxPercentage,
        reason,
        requestedBy: currentUser.id,
        requestedByName: currentUser.name,
        requestedByRole: currentUser.roleName,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create foreclosure request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Generate Foreclosure Payoff Quote</h2>
              <p className="text-xs text-blue-200">Calculate early prepayment dues with GST and validity window</p>
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

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Loan Account <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedLoanId}
              onChange={(e) => setSelectedLoanId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">-- Choose Loan Account --</option>
              {loans.filter((l) => l.status !== 'CLOSED').map((l) => (
                <option key={l.id} value={l.id}>
                  {l.accountNumber} — {l.customerName} | Principal: ₹{Number(l.outstandingPrincipal ?? l.principalOutstanding ?? 0).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Calculation Date
              </label>
              <input
                type="date"
                value={calculationDate}
                onChange={(e) => setCalculationDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Prepayment Fee (%)
              </label>
              <input
                type="number"
                min={0}
                max={10}
                step={0.5}
                value={foreclosureFeeRate}
                onChange={(e) => setForeclosureFeeRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tax Rate (% GST)
              </label>
              <input
                type="number"
                disabled
                value={taxPercentage}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-600"
              />
            </div>
          </div>

          {/* Real-time Calculation Breakdown Card */}
          {quote && (
            <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-blue-200/60">
                <span className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                  Authoritative Quote Breakdown
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                  Valid Until {quote.validUntil} (7 Days)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Principal Balance:</span>
                  <span className="font-bold text-slate-800">{formatCurrencyINR(quote.principalOutstanding)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Accrued Interest:</span>
                  <span className="font-bold text-slate-800">+{formatCurrencyINR(quote.accruedInterest)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Outstanding Fees:</span>
                  <span className="font-bold text-slate-800">+{formatCurrencyINR(quote.feesDue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Late Penalties:</span>
                  <span className="font-bold text-slate-800">+{formatCurrencyINR(quote.penaltiesDue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Prepayment Fee ({quote.foreclosureFeeRate}%):</span>
                  <span className="font-bold text-slate-800">+{formatCurrencyINR(quote.foreclosureFeeAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">GST on Fee (18%):</span>
                  <span className="font-bold text-slate-800">+{formatCurrencyINR(quote.foreclosureFeeTax)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-blue-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-800 block">Total Foreclosure Payoff</span>
                  <span className="text-xs text-slate-500">Includes all charges and GST</span>
                </div>
                <span className="text-xl font-black text-blue-950">{formatCurrencyINR(quote.netPayableAmount)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Customer Request Notes & Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedLoan}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Generating...' : 'Issue Foreclosure Quote'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
