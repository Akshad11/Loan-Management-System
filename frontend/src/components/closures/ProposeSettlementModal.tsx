import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, Handshake, Calendar } from 'lucide-react';
import { LoanAccountRecord } from '../../types/loanAccountTypes';
import { ProposeSettlementPayload } from '../../types/closureTypes';
import { calculateSettlementConcession } from '../../services/closureEngine';
import { formatCurrencyINR } from '../../utils/formatters';

interface ProposeSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  loans: LoanAccountRecord[];
  initialLoanId?: string | null;
  currentUser: { id: string; name: string; roleName: string };
  onSubmit: (payload: ProposeSettlementPayload) => Promise<void>;
}

export const ProposeSettlementModal: React.FC<ProposeSettlementModalProps> = ({
  isOpen,
  onClose,
  loans,
  initialLoanId,
  currentUser,
  onSubmit,
}) => {
  const [selectedLoanId, setSelectedLoanId] = useState<string>(initialLoanId || '');
  const [proposedAmount, setProposedAmount] = useState<number>(0);
  const [paymentDeadline, setPaymentDeadline] = useState<string>(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [hardshipCategory, setHardshipCategory] = useState<string>('MEDICAL_EMERGENCY');
  const [reason, setReason] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialLoanId) setSelectedLoanId(initialLoanId);
  }, [initialLoanId]);

  const selectedLoan = loans.find((l) => l.id === selectedLoanId || l.accountNumber === selectedLoanId);

  useEffect(() => {
    if (selectedLoan) {
      const exp =
        Number(selectedLoan.outstandingPrincipal ?? selectedLoan.principalOutstanding ?? 0) +
        Number(selectedLoan.interestOutstanding || 0) +
        Number(selectedLoan.feeOutstanding || 0) +
        Number(selectedLoan.penaltyOutstanding || 0);
      setProposedAmount(Math.round(exp * 0.85)); // 85% default initial offer
    }
  }, [selectedLoanId, selectedLoan]);

  if (!isOpen) return null;

  const concession = selectedLoan
    ? calculateSettlementConcession({
        loan: selectedLoan,
        proposedSettlementAmount: proposedAmount,
        paymentDeadline,
      })
    : null;

  const handleSubmit = async () => {
    if (!selectedLoan) {
      setErrorMsg('Please select a loan account.');
      return;
    }

    if (!reason.trim()) {
      setErrorMsg('Please provide a justification and hardship explanation.');
      return;
    }

    if (proposedAmount <= 0) {
      setErrorMsg('Settlement amount must be strictly greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await onSubmit({
        loanId: selectedLoan.id,
        proposedSettlementAmount: proposedAmount,
        paymentDeadline,
        hardshipCategory,
        settlementReason: reason,
        requestedBy: currentUser.id,
        requestedByName: currentUser.name,
        requestedByRole: currentUser.roleName,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit settlement proposal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-amber-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Handshake className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Propose One-Time Settlement (OTS)</h2>
              <p className="text-xs text-amber-200">Submit distressed account settlement proposal for committee approval</p>
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

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Loan Account <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedLoanId}
              onChange={(e) => setSelectedLoanId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="">-- Choose Loan Account --</option>
              {loans.filter((l) => l.status !== 'CLOSED').map((l) => (
                <option key={l.id} value={l.id}>
                  {l.accountNumber} — {l.customerName} | Total Dues: ₹{Number(l.totalOutstanding).toLocaleString()} | DPD: {l.dpd}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Proposed Settlement Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={proposedAmount}
                onChange={(e) => setProposedAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Payment Deadline Date
              </label>
              <input
                type="date"
                value={paymentDeadline}
                onChange={(e) => setPaymentDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Borrower Hardship Category
            </label>
            <select
              value={hardshipCategory}
              onChange={(e) => setHardshipCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500"
            >
              <option value="MEDICAL_EMERGENCY">Medical Emergency / Severe Illness</option>
              <option value="LOSS_OF_EMPLOYMENT">Loss of Primary Employment / Income</option>
              <option value="BUSINESS_FAILURE">Business Failure / Severe Revenue Contraction</option>
              <option value="NATURAL_CALAMITY">Natural Calamity / Property Loss</option>
              <option value="LEGAL_DISPUTE">Protracted Legal / Family Dispute</option>
            </select>
          </div>

          {/* Concession Breakdown Card */}
          {concession && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  Settlement & Concession Impact
                </span>
                <span className="text-xs font-black text-amber-800 bg-amber-200/80 px-2.5 py-0.5 rounded-full">
                  {concession.concessionPercentage}% Concession
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Exposure:</span>
                  <span className="font-bold text-slate-900">{formatCurrencyINR(concession.totalExposure)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Proposed Payoff:</span>
                  <span className="font-black text-amber-900">{formatCurrencyINR(concession.proposedSettlementAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fee/Penalty Concession:</span>
                  <span className="font-semibold text-slate-700">{formatCurrencyINR(concession.feePenaltyConcession)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Interest Concession:</span>
                  <span className="font-semibold text-slate-700">{formatCurrencyINR(concession.interestConcession)}</span>
                </div>
                <div className="flex justify-between col-span-2 pt-1 border-t border-amber-200/60">
                  <span className="text-slate-500">Principal Concession:</span>
                  <span className="font-semibold text-slate-700">{formatCurrencyINR(concession.principalConcession)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Total Write-Off / Concession:</span>
                <span className="text-base font-black text-rose-700">-{formatCurrencyINR(concession.concessionAmount)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Hardship Details & Recommendation Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="State clear justification why recovery via normal collections is infeasible and why this settlement maximizes net recovery..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
            disabled={isSubmitting || !selectedLoan || proposedAmount <= 0}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center space-x-1.5"
          >
            <Handshake className="w-4 h-4" />
            <span>{isSubmitting ? 'Submitting...' : 'Submit Settlement Proposal'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
