import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, DollarSign } from 'lucide-react';
import { LoanClosureRequestRecord, ReconcileClosePayload } from '../../types/closureTypes';
import { formatCurrencyINR } from '../../utils/formatters';

interface ClosureReconcileModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: LoanClosureRequestRecord | null;
  currentUser: { id: string; name: string; roleName: string };
  onReconcile: (payload: ReconcileClosePayload) => Promise<void>;
}

export const ClosureReconcileModal: React.FC<ClosureReconcileModalProps> = ({
  isOpen,
  onClose,
  request,
  currentUser,
  onReconcile,
}) => {
  const [paymentAmount, setPaymentAmount] = useState<number>(
    request ? Number(request.finalPayableAmount) : 0
  );
  const [paymentReference, setPaymentReference] = useState<string>(
    `PAY-SET-${Date.now().toString().slice(-6)}`
  );
  const [closureNotes, setClosureNotes] = useState<string>(
    'Final payment received and verified. All dues cleared.'
  );

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !request) return null;

  const requiredAmount = Number(request.finalPayableAmount);
  const isShortfall = paymentAmount < requiredAmount - 0.05;

  const handleExecute = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await onReconcile({
        closureRequestId: request.id,
        receivedPaymentAmount: paymentAmount,
        paymentReference,
        closureNotes,
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.roleName,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Closure execution failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Financial Reconciliation & Loan Closure</h2>
              <p className="text-xs text-emerald-200">Match final payoff, post adjustment, and close account</p>
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
          {/* Account Summary */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Request Number:</span>
              <span className="font-mono font-bold text-slate-800">{request.requestNumber}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Account / Borrower:</span>
              <span className="font-bold text-slate-800">{request.accountNumber} — {request.customerName}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Closure Type:</span>
              <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {request.closureType}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
              <span className="text-slate-500">Required Payoff Amount:</span>
              <span className="text-sm font-black text-slate-900">{formatCurrencyINR(requiredAmount)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Received Payment Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Payment Reference / UTR
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {isShortfall && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-2 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
              <span>
                Payment amount is less than required. Loan will remain in <strong>PAYMENT_PENDING</strong> status and will not close.
              </span>
            </div>
          )}

          {/* Action List Preview */}
          <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-xs space-y-1.5 text-slate-700">
            <span className="font-bold text-emerald-900 block">Atomic Transactions on Execution:</span>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Record closure payment and reconcile remaining dues to ₹0.00</span>
            </div>
            {Number(request.concessionAmount) > 0 && (
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Post concession credit adjustment of {formatCurrencyINR(request.concessionAmount)}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Update Loan status to <strong>CLOSED</strong> and mark schedule completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Resolve any open recovery litigation and generate No Objection Certificate (NOC)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Closure Notes
            </label>
            <input
              type="text"
              value={closureNotes}
              onChange={(e) => setClosureNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
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
            onClick={handleExecute}
            disabled={isSubmitting || paymentAmount <= 0}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Closing Loan...' : 'Reconcile & Close Loan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
