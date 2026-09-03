import React from 'react';
import { DisbursementReadinessResult } from '../../types/disbursementTypes';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, HelpCircle } from 'lucide-react';

interface DisbursementReadinessCardProps {
  readiness: DisbursementReadinessResult;
  onNavigateToSource?: (category: string) => void;
}

export const DisbursementReadinessCard: React.FC<DisbursementReadinessCardProps> = ({
  readiness,
  onNavigateToSource,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'PENDING':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'BLOCKED':
        return <XCircle className="w-4 h-4 text-rose-600 shrink-0" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PASS':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">PASS</span>;
      case 'PENDING':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">PENDING</span>;
      case 'BLOCKED':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">BLOCKED</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-50 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Pre-Disbursement Verification Engine</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic validation derived directly from live application state, KYC records, and sanction terms.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" /> {readiness.passedChecks} PASS
          </div>
          {readiness.pendingChecks > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-xs font-bold text-amber-700 font-mono">
              <AlertTriangle className="w-3.5 h-3.5" /> {readiness.pendingChecks} PENDING
            </div>
          )}
          {readiness.blockedChecks > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 font-mono">
              <XCircle className="w-3.5 h-3.5" /> {readiness.blockedChecks} BLOCKED
            </div>
          )}
        </div>
      </div>

      {/* Checklist items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {readiness.checks.map((chk) => (
          <div
            key={chk.id}
            className={`p-3.5 rounded-lg border text-xs transition-all ${
              chk.status === 'PASS'
                ? 'bg-emerald-50/20 border-emerald-200'
                : chk.status === 'BLOCKED'
                ? 'bg-rose-50/30 border-rose-200'
                : 'bg-amber-50/20 border-amber-200'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2.5">
                {getStatusIcon(chk.status)}
                <div>
                  <h4 className="font-bold text-slate-900 leading-snug">{chk.title}</h4>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">Source: {chk.source}</div>
                </div>
              </div>
              {getStatusBadge(chk.status)}
            </div>

            <p className="mt-2 text-slate-600 text-[11px] leading-relaxed">{chk.description}</p>

            {chk.reason && (
              <div className="mt-2 text-[11px] font-medium text-rose-700 bg-rose-50 p-1.5 rounded-md border border-rose-100">
                Reason: {chk.reason}
              </div>
            )}

            {chk.blockingDetails && (
              <div className="mt-1.5 text-[10px] text-rose-600 font-mono">
                Items: {chk.blockingDetails}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
