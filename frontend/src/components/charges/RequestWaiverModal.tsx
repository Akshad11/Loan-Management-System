import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, FileText } from 'lucide-react';
import { LoanAccountRecord } from '../../types/loanAccountTypes';
import { LoanChargeRecord, RequestWaiverPayload, WaiverType, WaiverCategory } from '../../types/chargeAdjustmentTypes';
import { validateWaiverEligibility } from '../../services/chargeAdjustmentEngine';
import { formatCurrencyINR } from '../../utils/formatters';

interface RequestWaiverModalProps {
  isOpen: boolean;
  onClose: () => void;
  loans: LoanAccountRecord[];
  charges: LoanChargeRecord[];
  initialLoanId?: string | null;
  initialChargeId?: string | null;
  currentUser: { id: string; name: string; roleName: string };
  onSubmit: (payload: RequestWaiverPayload) => Promise<void>;
}

export const RequestWaiverModal: React.FC<RequestWaiverModalProps> = ({
  isOpen,
  onClose,
  loans,
  charges,
  initialLoanId,
  initialChargeId,
  currentUser,
  onSubmit,
}) => {
  const [selectedLoanId, setSelectedLoanId] = useState<string>(initialLoanId || '');
  const [selectedChargeId, setSelectedChargeId] = useState<string>(initialChargeId || '');
  const [waiverType, setWaiverType] = useState<WaiverType>('PARTIAL_WAIVER');
  const [category, setCategory] = useState<WaiverCategory>('FEE');
  const [requestedAmount, setRequestedAmount] = useState<number>(0);
  const [reason, setReason] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialLoanId) setSelectedLoanId(initialLoanId);
    if (initialChargeId) setSelectedChargeId(initialChargeId);
  }, [initialLoanId, initialChargeId]);

  const selectedLoan = loans.find((l) => l.id === selectedLoanId || l.accountNumber === selectedLoanId);
  const loanCharges = charges.filter(
    (c) => (c.loanId === selectedLoan?.id || c.accountNumber === selectedLoan?.accountNumber) && (c.status === 'APPLIED' || c.status === 'PARTIALLY_PAID')
  );
  const selectedCharge = charges.find((c) => c.id === selectedChargeId);

  useEffect(() => {
    if (selectedCharge) {
      setRequestedAmount(Number(selectedCharge.outstandingAmount ?? selectedCharge.totalAmount ?? 0));
      if (selectedCharge.chargeType === 'LATE_PAYMENT_FEE' || selectedCharge.chargeCode.includes('PENALTY')) {
        setCategory('PENALTY');
        setWaiverType('PENALTY_WAIVER');
      } else {
        setCategory('FEE');
        setWaiverType('FEE_WAIVER');
      }
    } else if (selectedLoan) {
      if (category === 'FEE') setRequestedAmount(Number(selectedLoan.feeOutstanding || 0));
      else if (category === 'PENALTY') setRequestedAmount(Number(selectedLoan.penaltyOutstanding || 0));
      else if (category === 'INTEREST') setRequestedAmount(Number(selectedLoan.interestOutstanding || 0));
    }
  }, [selectedChargeId, selectedLoanId, category, selectedCharge, selectedLoan]);

  if (!isOpen) return null;

  const validation = selectedLoan
    ? validateWaiverEligibility({
        loan: selectedLoan,
        category,
        requestedAmount,
        charge: selectedCharge || null,
      })
    : { eligible: true, maxEligibleAmount: 0 };

  const handleSubmit = async () => {
    if (!selectedLoan) {
      setErrorMsg('Please select a loan account.');
      return;
    }

    if (!reason || !reason.trim()) {
      setErrorMsg('Please provide a justification reason.');
      return;
    }

    if (!validation.eligible) {
      setErrorMsg(validation.reason || 'Requested amount is ineligible.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await onSubmit({
        loanId: selectedLoan.id,
        chargeId: selectedChargeId || undefined,
        waiverType,
        category,
        requestedAmount,
        reason,
        requestedBy: currentUser.id,
        requestedByName: currentUser.name,
        requestedByRole: currentUser.roleName,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit waiver request.');
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
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Request Fee / Penalty / Interest Waiver</h2>
              <p className="text-xs text-amber-200">Initiate maker-checker waiver approval workflow</p>
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
              onChange={(e) => {
                setSelectedLoanId(e.target.value);
                setSelectedChargeId('');
              }}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="">-- Choose Loan Account --</option>
              {loans.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.accountNumber} — {l.customerName} | Fees: ₹{Number(l.feeOutstanding).toLocaleString()} | Penalties: ₹{Number(l.penaltyOutstanding).toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Waiver Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as WaiverCategory)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500"
              >
                <option value="FEE">Fee Waiver</option>
                <option value="PENALTY">Overdue Penalty Waiver</option>
                <option value="INTEREST">Accrued Interest Waiver</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Link to Specific Charge (Optional)
              </label>
              <select
                value={selectedChargeId}
                onChange={(e) => setSelectedChargeId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Entire Category Balance --</option>
                {loanCharges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.chargeNumber} — {c.chargeName} (₹{Number(c.outstandingAmount ?? c.totalAmount).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Requested Waiver Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-500">
                Max Eligible: <strong className="text-slate-800">{formatCurrencyINR(validation.maxEligibleAmount)}</strong>
              </span>
            </div>
            <input
              type="number"
              min={1}
              max={validation.maxEligibleAmount || undefined}
              value={requestedAmount}
              onChange={(e) => setRequestedAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Validation Notice */}
          {!validation.eligible && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>{validation.reason}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Justification & Hardship Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Provide clear commercial rationale, customer hardship details, or technical glitch evidence..."
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
            disabled={isSubmitting || !selectedLoan || !validation.eligible || requestedAmount <= 0}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center space-x-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>{isSubmitting ? 'Submitting...' : 'Submit Waiver Request'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
