import React from 'react';
import {
  Clock,
  CheckCircle2,
  FileText,
  UserPlus,
  ShieldCheck,
  Send,
  XCircle,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import { ApplicationHistoryItem } from '../../types/applicationTypes';

interface ApplicationTimelineProps {
  history: ApplicationHistoryItem[];
}

export const ApplicationTimeline: React.FC<ApplicationTimelineProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
        No lifecycle events recorded for this application yet.
      </div>
    );
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATED':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'SUBMITTED':
        return <Send className="w-4 h-4 text-indigo-600" />;
      case 'CO_APPLICANT_ADDED':
        return <UserPlus className="w-4 h-4 text-sky-600" />;
      case 'GUARANTOR_ADDED':
        return <ShieldCheck className="w-4 h-4 text-purple-600" />;
      case 'DOCUMENT_UPLOADED':
        return <Upload className="w-4 h-4 text-teal-600" />;
      case 'DOCUMENT_VERIFIED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'DOCUMENT_REJECTED':
        return <XCircle className="w-4 h-4 text-rose-600" />;
      case 'STATUS_CHANGED':
        return <CheckCircle2 className="w-4 h-4 text-amber-600" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 text-rose-700" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
        {history.map((item) => {
          const actionLabel = item.action || item.eventType || 'ACTIVITY';
          const actorDisplay = item.actorName || item.actor || 'System';
          const detailText = item.details || item.description || '';

          return (
            <div key={item.id} className="relative group">
              {/* Timeline bullet icon */}
              <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shadow-xs">
                {getActionIcon(actionLabel)}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{actionLabel.replace(/_/g, ' ')}</span>
                  <span className="text-[11px] text-slate-400">•</span>
                  <span className="text-[11px] font-mono text-slate-500">{item.timestamp}</span>
                  <span className="text-[11px] text-slate-400">•</span>
                  <span className="text-[11px] text-slate-600">by <strong>{actorDisplay}</strong> ({item.actorRole})</span>
                </div>

                {detailText && (
                  <p className="text-xs text-slate-700 mt-1">
                    {detailText}
                  </p>
                )}

                {item.notes && (
                  <div className="mt-1 p-2 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-600 italic">
                    Note: {item.notes}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
