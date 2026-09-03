import React from 'react';
import { SanctionRecord, PreDisbursementReadinessResult, ReadinessCheckItem } from '../../types/sanctionTypes';
import { ReadinessBadge } from './SanctionStatusBadge';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  FileText,
  UserCheck,
  Building,
  CreditCard,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface SanctionReadinessTabProps {
  sanction: SanctionRecord;
  readinessResult: PreDisbursementReadinessResult;
  onNavigateModule?: (moduleName: string) => void;
  onRefreshReadiness?: () => void;
}

export const SanctionReadinessTab: React.FC<SanctionReadinessTabProps> = ({
  sanction,
  readinessResult,
  onNavigateModule,
  onRefreshReadiness,
}) => {
  const { overallStatus, isDisbursementReady, blockerReasons, checks, verifiedAt } = readinessResult;

  const passedCount = checks.filter((c) => c.status === 'PASS').length;
  const pendingCount = checks.filter((c) => c.status === 'PENDING').length;
  const blockedCount = checks.filter((c) => c.status === 'BLOCKED').length;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'CUSTOMER':
      case 'KYC':
        return <UserCheck className="w-4 h-4 text-indigo-600" />;
      case 'APPROVAL':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'SANCTION':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'DOCUMENTS':
        return <FileText className="w-4 h-4 text-amber-600" />;
      case 'CONDITIONS':
        return <Layers className="w-4 h-4 text-purple-600" />;
      case 'BANKING':
        return <CreditCard className="w-4 h-4 text-teal-600" />;
      case 'EXCEPTIONS':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Overall Readiness Status */}
      <div
        className={`p-6 rounded-lg border shadow-sm ${
          isDisbursementReady
            ? 'bg-emerald-50 border-emerald-300'
            : overallStatus === 'BLOCKED'
            ? 'bg-rose-50 border-rose-300'
            : 'bg-amber-50 border-amber-300'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            {isDisbursementReady ? (
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            ) : overallStatus === 'BLOCKED' ? (
              <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {isDisbursementReady
                    ? 'READY FOR DISBURSEMENT'
                    : overallStatus === 'BLOCKED'
                    ? 'DISBURSEMENT BLOCKED - COMPLIANCE / POLICY FAILURE'
                    : 'PRE-DISBURSEMENT READINESS PENDING'}
                </h3>
              </div>
              <p className="text-xs text-slate-700 mt-1 max-w-2xl">
                {isDisbursementReady
                  ? 'All mandatory pre-requisites, KYC authentications, credit committee approvals, documents, and pre-disbursement covenants have passed verification.'
                  : overallStatus === 'BLOCKED'
                  ? 'One or more mandatory regulatory checks or documents are rejected or failed. Loan disbursement cannot proceed until resolved.'
                  : 'Pending resolution of open pre-disbursement covenants, documentation, or sanction confirmation.'}
              </p>
              <div className="text-[11px] text-slate-500 mt-2 font-mono">
                Verified at: {verifiedAt} • Evaluated {checks.length} deterministic rules
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-center">
            <div className="text-right">
              <div className="text-sm font-bold font-mono text-slate-900">
                {passedCount} / {checks.length} Passed
              </div>
              <div className="text-[11px] text-slate-500">
                {pendingCount > 0 && `${pendingCount} Pending `}
                {blockedCount > 0 && `• ${blockedCount} Blocked`}
              </div>
            </div>
          </div>
        </div>

        {/* Blocker list if not ready */}
        {blockerReasons.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-900 mb-2 uppercase tracking-wider">
              Critical Blocker Items ({blockerReasons.length})
            </h4>
            <div className="space-y-1.5">
              {blockerReasons.map((reason, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-rose-800 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                  {reason}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Deterministic Checks List */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Pre-Disbursement Audit Checklist (7 Pillars)
          </h3>
          <span className="text-[11px] text-slate-500 font-sans">
            Continuous validation against active store state
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {checks.map((chk) => (
            <div key={chk.id} className="p-4 hover:bg-slate-50/60 transition-colors">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-md border border-slate-200 shrink-0 mt-0.5">
                    {getCategoryIcon(chk.category)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{chk.title}</h4>
                      <span className="text-[10px] font-mono text-slate-400">
                        [{chk.source}]
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1">{chk.details}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                  <ReadinessBadge status={chk.status} size="md" />

                  {chk.actionLabel && onNavigateModule && (
                    <button
                      onClick={() => onNavigateModule(chk.actionTarget || 'applications')}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors inline-flex items-center"
                    >
                      {chk.actionLabel}
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
