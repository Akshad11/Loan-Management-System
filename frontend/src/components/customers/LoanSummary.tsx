import React from 'react';
import { CustomerLoanItem } from '../../types';
import { formatIndianCurrency } from '../../utils/formatters';
import { CheckCircle2, AlertTriangle, ShieldCheck, Wallet } from 'lucide-react';

interface LoanSummaryProps {
  loans: CustomerLoanItem[];
}

export const LoanSummary: React.FC<LoanSummaryProps> = ({ loans }) => {
  const activeLoans = loans.filter((l) => l.status === 'ACTIVE' || l.status === 'PARTIALLY_DISBURSED');
  const closedLoans = loans.filter((l) => l.status === 'CLOSED' || l.status === 'MATURED');
  const overdueLoans = loans.filter((l) => (l.dpd && l.dpd > 0) || l.status === 'OVERDUE' || (l.overdueAmount && l.overdueAmount > 0));

  const totalOutstanding = activeLoans.reduce((sum, l) => sum + (l.outstandingPrincipal || 0), 0);
  const totalOriginalPrincipal = loans.reduce(
    (sum, l) => sum + (l.originalPrincipal ?? l.sanctionedAmount ?? 0),
    0
  );
  const totalOverdue = overdueLoans.reduce((sum, l) => sum + (l.overdueAmount || 0), 0);
  const maxDpd = Math.max(0, ...loans.map((l) => l.dpd || 0));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
      {/* 1. Total Sanctioned Capital */}
      <div className="bg-white border border-slate-200 rounded p-3">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px] mb-1">
          <Wallet className="w-3.5 h-3.5 text-slate-400" />
          <span>Lifetime Sanctioned</span>
        </div>
        <div className="font-mono text-base font-bold text-slate-900">
          {formatIndianCurrency(totalOriginalPrincipal, true)}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">
          Across {loans.length} total loan facilities
        </div>
      </div>

      {/* 2. Active Principal Outstanding */}
      <div className="bg-white border border-slate-200 rounded p-3">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px] mb-1">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Active Exposure</span>
        </div>
        <div className="font-mono text-base font-bold text-slate-900">
          {formatIndianCurrency(totalOutstanding, true)}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">
          {activeLoans.length} active loan account{activeLoans.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* 3. Closed / Settled Facilities */}
      <div className="bg-white border border-slate-200 rounded p-3">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px] mb-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Settled & Closed</span>
        </div>
        <div className="font-mono text-base font-bold text-slate-900">
          {closedLoans.length} Account{closedLoans.length === 1 ? '' : 's'}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">
          Satisfactorily repaid to date
        </div>
      </div>

      {/* 4. Portfolio Delinquency / DPD */}
      <div
        className={`rounded p-3 border ${
          overdueLoans.length > 0
            ? 'bg-rose-50/60 border-rose-200 text-rose-900'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center gap-1.5 text-[11px] font-medium mb-1">
          <AlertTriangle
            className={`w-3.5 h-3.5 ${overdueLoans.length > 0 ? 'text-rose-600' : 'text-slate-400'}`}
          />
          <span className={overdueLoans.length > 0 ? 'text-rose-800' : 'text-slate-500'}>
            Overdue / Max DPD
          </span>
        </div>
        <div className="font-mono text-base font-bold">
          {overdueLoans.length > 0 ? formatIndianCurrency(totalOverdue, true) : '₹0.00'}
        </div>
        <div className="text-[10px] mt-0.5">
          {overdueLoans.length > 0 ? (
            <span className="text-rose-700 font-semibold">
              Peak DPD: {maxDpd} days ({overdueLoans.length} delinquent)
            </span>
          ) : (
            <span className="text-emerald-700 font-semibold">0 DPD • Standard Asset</span>
          )}
        </div>
      </div>
    </div>
  );
};
