import React from 'react';
import { SanctionRecord, SanctionVersionSnapshot, SanctionHistoryItem } from '../../types/sanctionTypes';
import {
  History,
  FileText,
  Clock,
  User,
  ShieldCheck,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Ban,
  Send,
  Layers,
} from 'lucide-react';
import { formatCurrencyINR } from '../../utils/formatters';

interface SanctionHistoryTabProps {
  sanction: SanctionRecord;
}

export const SanctionHistoryTab: React.FC<SanctionHistoryTabProps> = ({ sanction }) => {
  const history = sanction.history || [];
  const versions = sanction.versions || [];

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'DRAFTED':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'TERMS_MODIFIED':
        return <Edit3 className="w-4 h-4 text-amber-600" />;
      case 'CONDITION_ADDED':
      case 'CONDITION_STATUS_UPDATED':
      case 'CONDITION_WAIVED':
        return <Layers className="w-4 h-4 text-purple-600" />;
      case 'LETTER_GENERATED':
        return <FileText className="w-4 h-4 text-indigo-600" />;
      case 'LETTER_ISSUED':
        return <Send className="w-4 h-4 text-emerald-600" />;
      case 'CONFIRMED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'RETURNED':
        return <RotateCcw className="w-4 h-4 text-rose-600" />;
      case 'CANCELLED':
        return <Ban className="w-4 h-4 text-slate-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Version Snapshots Overview */}
      {versions.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-700" />
            Sanction Terms Version Evolution ({versions.length} Versions)
          </h3>

          <div className="space-y-3">
            {versions.map((ver: SanctionVersionSnapshot) => (
              <div
                key={ver.version}
                className={`p-3.5 rounded-lg border text-xs ${
                  ver.version === versions.length
                    ? 'bg-blue-50/50 border-blue-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded px-2 py-0.5">
                      v{ver.version}.0
                    </span>
                    <span className="font-semibold text-slate-800">
                      {formatCurrencyINR(ver.amount)} @ {ver.interestRate}% ({ver.tenureMonths}m)
                    </span>
                    {ver.version === versions.length && (
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                        Current Active
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-sans">
                    Modified on {ver.snapshotDate} by {ver.actor}
                  </div>
                </div>
                <div className="mt-2 text-slate-600 flex items-start gap-1">
                  <span className="font-medium text-slate-700">Reason:</span>
                  <span className="italic">{ver.reason || ver.changeDescription}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chronological Audit Trail */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-700" />
          Immutable Sanction Audit Trail ({history.length} Events)
        </h3>

        {history.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400">No sanction audit events recorded yet.</div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {history.map((ev: SanctionHistoryItem, idx: number) => (
              <div key={ev.id || idx} className="relative group">
                <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center">
                  {getEventIcon(ev.event)}
                </div>

                <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-slate-900">{ev.event}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{ev.timestamp}</span>
                  </div>

                  <div className="text-slate-600 my-1">{ev.notes}</div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <User className="w-3 h-3 text-slate-400" />
                      {ev.actor} ({ev.actorRole})
                    </span>
                    <span>•</span>
                    <span className="font-mono">v{ev.version}.0</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
