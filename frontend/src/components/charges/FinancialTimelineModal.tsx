import React from 'react';
import { X, History, ArrowDownRight, ArrowUpRight, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import { LoanAccountRecord } from '../../types/loanAccountTypes';
import { formatCurrencyINR } from '../../utils/formatters';

interface FinancialTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: LoanAccountRecord | null;
}

export const FinancialTimelineModal: React.FC<FinancialTimelineModalProps> = ({
  isOpen,
  onClose,
  loan,
}) => {
  if (!isOpen || !loan) return null;

  // Build unified chronological list of transactions and history items
  const transactions = loan.transactions || [];
  const charges = loan.charges || [];
  const history = loan.history || [];

  // Sort unified events descending
  const events = [
    ...transactions.map((t) => ({
      id: t.id,
      date: t.transactionDate || (t as any).createdAt,
      type: 'TRANSACTION',
      title: t.transactionType.replace(/_/g, ' '),
      amount: Number(t.amount),
      reference: t.transactionReference,
      notes: t.notes,
      actor: t.createdBy,
      isCredit: Number(t.amount) < 0 || t.transactionType === 'REPAYMENT' || t.transactionType === 'WAIVER',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Financial Event Ledger Timeline</h2>
              <p className="text-xs text-slate-300">
                {loan.accountNumber} — {loan.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {events.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              No financial transactions recorded for this account.
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {events.map((evt, idx) => (
                <div key={idx} className="relative group">
                  <div
                    className={`absolute -left-6 top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${
                      evt.isCredit ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'
                    }`}
                  />
                  <div className="p-3 bg-slate-50 hover:bg-slate-100/80 transition-colors rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{evt.title}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-[10px] font-mono text-slate-500">{evt.reference}</span>
                      </div>
                      <span
                        className={`font-black text-sm ${
                          evt.isCredit ? 'text-emerald-700' : 'text-slate-900'
                        }`}
                      >
                        {formatCurrencyINR(evt.amount)}
                      </span>
                    </div>
                    {evt.notes && <p className="text-slate-600 mb-1">{evt.notes}</p>}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                      <span>Posted by: {evt.actor || 'System'}</span>
                      <span>{new Date(evt.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
