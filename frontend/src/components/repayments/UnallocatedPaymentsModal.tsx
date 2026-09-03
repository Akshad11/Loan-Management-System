import React from 'react';
import {
  X,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Building2,
  DollarSign,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { UnallocatedPaymentRecord } from '../../types/repaymentTypes';
import { formatCurrencyINR, formatDate } from '../../utils/formatters';

interface UnallocatedPaymentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  unallocatedPayments: UnallocatedPaymentRecord[];
  onResolve: (unallocId: string, action: 'REFUND' | 'ALLOCATE_ADVANCE') => void;
}

export const UnallocatedPaymentsModal: React.FC<UnallocatedPaymentsModalProps> = ({
  isOpen,
  onClose,
  unallocatedPayments,
  onResolve,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Suspense & Unallocated Collections Manager
              </h3>
              <p className="text-xs text-slate-500">
                Manage excess funds received beyond scheduled loan obligations.
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

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {unallocatedPayments.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">All Collections Reconciled</h4>
              <p className="text-xs text-slate-500 mt-1">
                There are no unallocated or suspense balances pending reconciliation.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {unallocatedPayments.map((u) => (
                <div
                  key={u.id}
                  className="p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">
                        {u.paymentNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.status === 'UNALLOCATED'
                            ? 'bg-amber-100 text-amber-800'
                            : u.status === 'REFUNDED'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {u.status}
                      </span>
                    </div>

                    <div className="text-slate-700">
                      Loan: <span className="font-mono font-semibold">{u.accountNumber}</span> • Customer: <span className="font-semibold">{u.customerName}</span>
                    </div>

                    <div className="text-slate-500 text-[11px]">
                      Reason: {u.reason || 'Excess amount received over dues'} • Date: {formatDate(u.paymentDate)}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:border-l sm:border-slate-100 sm:pl-4">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Unallocated Amount
                      </span>
                      <span className="font-mono text-base font-bold text-amber-700">
                        {formatCurrencyINR(u.remainingAmount)}
                      </span>
                    </div>

                    {u.status === 'UNALLOCATED' && (
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button
                          onClick={() => onResolve(u.id, 'ALLOCATE_ADVANCE')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shadow-2xs transition-colors"
                        >
                          Apply to Advance
                        </button>
                        <button
                          onClick={() => onResolve(u.id, 'REFUND')}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] transition-colors"
                        >
                          Refund to Customer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
