import React from 'react';
import { SanctionRecord } from '../../types/sanctionTypes';
import { FileCheck, Clock, CheckCircle2, AlertTriangle, IndianRupee, Layers } from 'lucide-react';

interface SanctionKPIsProps {
  sanctions: SanctionRecord[];
}

export const SanctionKPIs: React.FC<SanctionKPIsProps> = ({ sanctions }) => {
  const totalCount = sanctions.length;
  const sanctionedRecords = sanctions.filter((s) => s.status === 'SANCTIONED');
  const sanctionedCount = sanctionedRecords.length;
  const sanctionedVolume = sanctionedRecords.reduce((sum, s) => sum + s.terms.amount, 0);

  const inReviewCount = sanctions.filter((s) => s.status === 'UNDER_REVIEW' || s.status === 'PENDING_CONFIRMATION').length;
  const draftCount = sanctions.filter((s) => s.status === 'DRAFT').length;
  const returnedCount = sanctions.filter((s) => s.status === 'RETURNED').length;
  const deviatedCount = sanctions.filter((s) => s.terms.isDeviatedFromApproval).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {/* KPI 1: Total Portfolio Sanctioned Volume */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sanctioned Volume</span>
          <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
            <IndianRupee className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-slate-900 font-mono">
            ₹{(sanctionedVolume / 10000000).toFixed(2)} Cr
          </span>
          <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
            {sanctionedCount} cases
          </span>
        </div>
        <div className="mt-1 text-xs text-slate-500">
          Formally executed & confirmed
        </div>
      </div>

      {/* KPI 2: Total Active Cases */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sanction Queue</span>
          <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200">
            <Layers className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-slate-900 font-mono">{totalCount}</span>
          <span className="text-xs font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
            {draftCount} in draft
          </span>
        </div>
        <div className="mt-1 text-xs text-slate-500">
          All sanction dossiers
        </div>
      </div>

      {/* KPI 3: Pending Confirmation / Review */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Confirmation</span>
          <span className="p-1.5 bg-amber-50 text-amber-700 rounded-md border border-amber-200">
            <Clock className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-slate-900 font-mono">{inReviewCount}</span>
          <span className="text-xs font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
            Requires Action
          </span>
        </div>
        <div className="mt-1 text-xs text-slate-500">
          Independent sign-off queue
        </div>
      </div>

      {/* KPI 4: Formally Sanctioned & Letters */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirmed Sanctions</span>
          <span className="p-1.5 bg-teal-50 text-teal-700 rounded-md border border-teal-200">
            <CheckCircle2 className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-slate-900 font-mono">{sanctionedCount}</span>
          <span className="text-xs font-medium text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
            {Math.round((sanctionedCount / (totalCount || 1)) * 100)}% Rate
          </span>
        </div>
        <div className="mt-1 text-xs text-slate-500">
          Ready for Pre-Disbursement
        </div>
      </div>

      {/* KPI 5: Returned & Deviations */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deviations & Returns</span>
          <span className="p-1.5 bg-rose-50 text-rose-700 rounded-md border border-rose-200">
            <AlertTriangle className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-slate-900 font-mono">{deviatedCount}</span>
          <span className="text-xs font-medium text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
            {returnedCount} returned
          </span>
        </div>
        <div className="mt-1 text-xs text-slate-500">
          Term adjustments & rework
        </div>
      </div>
    </div>
  );
};
