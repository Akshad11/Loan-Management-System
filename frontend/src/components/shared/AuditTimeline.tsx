import React from 'react';
import { AdminAuditEntry } from '../../types';
import { Shield, Clock, User, AlertTriangle } from 'lucide-react';

interface AuditTimelineProps {
  logs: AdminAuditEntry[];
  emptyMessage?: string;
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({
  logs,
  emptyMessage = 'No audit records logged yet.',
}) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="py-8 text-center border border-dashed border-slate-200 rounded-lg">
        <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-600">{emptyMessage}</p>
        <p className="text-xs text-slate-400 mt-0.5">Audit records are permanently indexed in the immutable ledger.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {logs.map((log) => (
        <div key={log.id} className="relative group">
          {/* Timeline Dot */}
          <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-white border-2 border-slate-800 flex items-center justify-center shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
          </div>

          <div className="bg-white border border-slate-200 rounded p-4 text-left">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-900 px-1.5 py-0.5 bg-slate-100 rounded">
                  {log.action}
                </span>
                <span className="text-xs text-slate-500 font-medium">{log.entityName}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                <span>{log.timestamp}</span>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">{log.details}</p>

            {log.reason && (
              <div className="mt-2 text-xs bg-slate-50 border border-slate-200 p-2 rounded flex items-start gap-1.5">
                <span className="font-semibold text-slate-600 shrink-0">Reason:</span>
                <span className="text-slate-800">{log.reason}</span>
              </div>
            )}

            {log.changes && log.changes.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-slate-100 text-xs">
                <p className="font-semibold text-slate-600 mb-1">State Modifications:</p>
                <div className="space-y-1">
                  {log.changes.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-slate-500">{c.field}:</span>
                      <span className="line-through text-red-600">{c.oldValue}</span>
                      <span className="text-slate-400">→</span>
                      <span className="text-emerald-700 font-bold">{c.newValue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                <span>Actor: {log.actorName}</span>
              </span>
              <span className="font-mono">IP: {log.ipAddress}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
