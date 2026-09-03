import React from 'react';
import { DisbursementKPIsData } from '../../types/disbursementTypes';
import { Landmark, CheckCircle2, Clock, AlertTriangle, ArrowUpRight, TrendingUp } from 'lucide-react';

interface DisbursementKPIsProps {
  kpis: DisbursementKPIsData;
}

export const DisbursementKPIs: React.FC<DisbursementKPIsProps> = ({ kpis }) => {
  const percentDisbursed =
    kpis.totalSanctionedAmount > 0
      ? Math.round((kpis.totalDisbursedAmount / kpis.totalSanctionedAmount) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Sanctioned vs Disbursed */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Disbursed
          </span>
          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
            <Landmark className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-xl font-bold font-mono text-slate-900">
            ₹{kpis.totalDisbursedAmount.toLocaleString('en-IN')}
          </span>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {percentDisbursed}% of Sanctions
          </span>
        </div>
        <p className="mt-1.5 text-xs text-slate-500 font-mono">
          Out of ₹{kpis.totalSanctionedAmount.toLocaleString('en-IN')} total sanctioned
        </p>
      </div>

      {/* 2. Remaining Undisbursed Amount */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Available Sanction
          </span>
          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-xl font-bold font-mono text-blue-900">
            ₹{kpis.totalRemainingAmount.toLocaleString('en-IN')}
          </span>
          <span className="text-xs font-medium text-slate-500">
            Available for Payout
          </span>
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          Remaining uncalled credit line balances
        </p>
      </div>

      {/* 3. Pending Checker Review */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Pending Checker
          </span>
          <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-xl font-bold font-mono text-amber-900">
            {kpis.pendingApprovalCount} requests
          </span>
          <span className="text-xs font-bold font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
            ₹{kpis.pendingApprovalAmount.toLocaleString('en-IN')}
          </span>
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          Awaiting maker-checker verification & signoff
        </p>
      </div>

      {/* 4. Ready for Payout */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Ready for Payout
          </span>
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-xl font-bold font-mono text-indigo-900">
            {kpis.readyForPayoutCount} files
          </span>
          <span className="text-xs font-bold font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
            ₹{kpis.readyForPayoutAmount.toLocaleString('en-IN')}
          </span>
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          Approved by checker. Banking execution pending.
        </p>
      </div>
    </div>
  );
};
