import React from 'react';
import {
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Layers,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { LoanAccountRecord, LoanTransactionItem } from '../../types/loanAccountTypes';
import { formatCurrencyINR, formatDate, formatDateTime } from '../../utils/formatters';

interface TransactionsTabProps {
  loan: LoanAccountRecord;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({ loan }) => {
  const transactions = loan.transactions || [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600" />
            Financial Transaction Ledger
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable audit record of all disbursements, repayments, reversals, and financial allocations.
          </p>
        </div>
        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-mono text-xs font-semibold rounded-lg">
          {transactions.length} Recorded Transactions
        </span>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Txn Reference #</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-right">Principal</th>
                <th className="py-3 px-4 text-right">Interest</th>
                <th className="py-3 px-4 text-right">Fees/Penalty</th>
                <th className="py-3 px-4">Channel / UTR</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div className="font-semibold text-slate-700">No transactions recorded yet</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Disbursements and repayments will automatically register in this ledger.
                    </p>
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">{txn.transactionReference}</div>
                      {txn.referenceId && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Ref: {txn.referenceId}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          txn.transactionType === 'DISBURSEMENT'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : txn.transactionType === 'REPAYMENT'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {txn.transactionType === 'DISBURSEMENT' ? (
                          <ArrowDownLeft className="w-3 h-3 text-blue-600" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                        )}
                        {txn.transactionType}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                      {formatDate(txn.transactionDate)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrencyINR(txn.amount, false)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {txn.principalPortion > 0 ? formatCurrencyINR(txn.principalPortion, false) : '—'}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-amber-700">
                      {txn.interestPortion > 0 ? formatCurrencyINR(txn.interestPortion, false) : '—'}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {txn.feePortion + txn.penaltyPortion > 0
                        ? formatCurrencyINR(txn.feePortion + txn.penaltyPortion, false)
                        : '—'}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{txn.paymentMethod || 'SYSTEM'}</div>
                      {txn.utrNumber && (
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          UTR: {txn.utrNumber}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {txn.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={txn.notes}>
                      {txn.notes || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
