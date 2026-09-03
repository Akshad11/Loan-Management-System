import React from 'react';
import {
  History,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  ShieldCheck,
  CreditCard,
  Layers,
} from 'lucide-react';
import { LoanAccountRecord, LoanHistoryItem } from '../../types/loanAccountTypes';
import { formatDateTime } from '../../utils/formatters';

interface HistoryTabProps {
  loan: LoanAccountRecord;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ loan }) => {
  const history = loan.history || [];

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOAN_ACCOUNT_CREATED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'SCHEDULE_VERSION_GENERATED':
        return <Layers className="w-4 h-4 text-blue-600" />;
      case 'REPAYMENT_SETTINGS_UPDATED':
      case 'REPAYMENT_MANDATE_ACTIVATED':
        return <CreditCard className="w-4 h-4 text-purple-600" />;
      case 'CHARGE_LEVIED':
        return <FileText className="w-4 h-4 text-amber-600" />;
      case 'DISBURSEMENT_TRANCHE_POSTED':
        return <ShieldCheck className="w-4 h-4 text-teal-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            Immutable Loan Lifecycle & Servicing Audit Log
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Full compliance audit trail with tamper-proof timestamps, actors, references, and state transitions.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        {history.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <div className="font-semibold text-slate-700">No audit events recorded yet</div>
          </div>
        ) : (
          <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
            {history.map((item) => (
              <div key={item.id} className="relative group">
                <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center shadow-xs">
                  {getActionIcon(item.action)}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {item.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400">•</span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {formatDateTime(item.timestamp)}
                    </span>
                    <span className="text-[11px] text-slate-400">•</span>
                    <span className="text-[11px] text-slate-600">
                      by <strong>{item.actorName || item.actor}</strong> ({item.actorRole})
                    </span>
                  </div>

                  {item.previousState && item.newState && (
                    <div className="mt-1 flex items-center gap-2 text-[11px]">
                      <span className="text-slate-500">State Transition:</span>
                      <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded font-mono font-medium">
                        {item.previousState}
                      </span>
                      <span className="text-slate-400">→</span>
                      <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-mono font-bold">
                        {item.newState}
                      </span>
                    </div>
                  )}

                  {item.notes && <p className="text-xs text-slate-700 mt-1">{item.notes}</p>}

                  {item.reason && (
                    <p className="text-[11px] text-slate-500 italic mt-0.5">
                      Justification: {item.reason}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
