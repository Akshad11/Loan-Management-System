import React, { useState, useEffect } from 'react';
import { X, Scale, CheckCircle2, AlertTriangle, ArrowRight, FileSpreadsheet } from 'lucide-react';
import { LoanAccountRecord } from '../../types/loanAccountTypes';
import { CreateFinancialAdjustmentPayload, AdjustmentType } from '../../types/chargeAdjustmentTypes';
import { formatCurrencyINR } from '../../utils/formatters';

interface FinancialAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loans: LoanAccountRecord[];
  initialLoanId?: string | null;
  currentUser: { id: string; name: string; roleName: string };
  onSubmit: (payload: CreateFinancialAdjustmentPayload) => Promise<void>;
}

export const FinancialAdjustmentModal: React.FC<FinancialAdjustmentModalProps> = ({
  isOpen,
  onClose,
  loans,
  initialLoanId,
  currentUser,
  onSubmit,
}) => {
  const [selectedLoanId, setSelectedLoanId] = useState<string>(initialLoanId || '');
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('CREDIT_ADJUSTMENT');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [principalPortion, setPrincipalPortion] = useState<number>(0);
  const [interestPortion, setInterestPortion] = useState<number>(0);
  const [feePortion, setFeePortion] = useState<number>(0);
  const [penaltyPortion, setPenaltyPortion] = useState<number>(0);
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialLoanId) setSelectedLoanId(initialLoanId);
  }, [initialLoanId]);

  const selectedLoan = loans.find((l) => l.id === selectedLoanId || l.accountNumber === selectedLoanId);

  useEffect(() => {
    // Keep total in sync if portions change
    const sum = principalPortion + interestPortion + feePortion + penaltyPortion;
    if (sum > 0) {
      setTotalAmount(sum);
    }
  }, [principalPortion, interestPortion, feePortion, penaltyPortion]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedLoan) {
      setErrorMsg('Please select a loan account.');
      return;
    }

    if (!reason || !reason.trim()) {
      setErrorMsg('Please enter a justification reason.');
      return;
    }

    if (totalAmount <= 0) {
      setErrorMsg('Total adjustment amount must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await onSubmit({
        loanId: selectedLoan.id,
        adjustmentType,
        amount: totalAmount,
        principalAdjustment: principalPortion,
        interestAdjustment: interestPortion,
        feeAdjustment: feePortion,
        penaltyAdjustment: penaltyPortion,
        effectiveDate,
        reason,
        reference,
        requestedBy: currentUser.id,
        requestedByName: currentUser.name,
        requestedByRole: currentUser.roleName,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit financial adjustment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-teal-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Financial Debit / Credit Adjustment</h2>
              <p className="text-xs text-teal-200">Post controlled accounting corrections with audit trail</p>
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

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Loan Account <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedLoanId}
              onChange={(e) => setSelectedLoanId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="">-- Choose Loan Account --</option>
              {loans.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.accountNumber} — {l.customerName} | Principal: ₹{Number(l.outstandingPrincipal).toLocaleString()} | Total: ₹{Number(l.totalOutstanding).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Adjustment Type
              </label>
              <select
                value={adjustmentType}
                onChange={(e) => setAdjustmentType(e.target.value as AdjustmentType)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-teal-500"
              >
                <option value="CREDIT_ADJUSTMENT">Credit Adjustment (Reduces Customer Due)</option>
                <option value="DEBIT_ADJUSTMENT">Debit Adjustment (Increases Customer Due)</option>
                <option value="INTEREST_ADJUSTMENT">Interest Calculation Correction</option>
                <option value="FEE_ADJUSTMENT">Fee & Charges Correction</option>
                <option value="PENALTY_ADJUSTMENT">Penalty Adjustment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Effective Value Date
              </label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Allocation Breakdown */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Financial Breakdown (₹)
            </span>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Principal</label>
                <input
                  type="number"
                  min={0}
                  value={principalPortion}
                  onChange={(e) => setPrincipalPortion(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Interest</label>
                <input
                  type="number"
                  min={0}
                  value={interestPortion}
                  onChange={(e) => setInterestPortion(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Fees</label>
                <input
                  type="number"
                  min={0}
                  value={feePortion}
                  onChange={(e) => setFeePortion(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Penalties</label>
                <input
                  type="number"
                  min={0}
                  value={penaltyPortion}
                  onChange={(e) => setPenaltyPortion(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">Total Adjustment Impact:</span>
              <span className="text-sm font-black text-teal-800">{formatCurrencyINR(totalAmount)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Audit / Ledger Reference
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. AUDIT-2026-Q3-09"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Authorizer Authority
              </label>
              <input
                type="text"
                disabled
                value="Branch Credit Committee / Finance Head"
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Accounting Rationale & Explanation <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="State clear operational reason for adjustment..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
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
            disabled={isSubmitting || !selectedLoan || totalAmount <= 0}
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center space-x-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isSubmitting ? 'Submitting...' : 'Submit Adjustment Request'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
