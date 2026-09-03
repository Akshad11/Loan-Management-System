import React, { useState } from 'react';
import { ApprovalRecord, ApprovalVersionSnapshot, ApprovalHistoryEvent } from '../../types/approvalTypes';
import {
  History,
  GitCommit,
  User,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  RotateCcw,
  XCircle,
  CheckCircle2,
  FileText,
  Download,
} from 'lucide-react';

interface ApprovalHistoryTabProps {
  approval: ApprovalRecord;
  onExportAudit?: () => void;
}

export const ApprovalHistoryTab: React.FC<ApprovalHistoryTabProps> = ({ approval, onExportAudit }) => {
  const versions = approval.versions || [];
  const history = [...(approval.history || [])].reverse();

  const [selectedVersionNum, setSelectedVersionNum] = useState<number | null>(
    versions.length > 0 ? versions[versions.length - 1].versionNumber : null
  );

  const selectedVersion = versions.find((v) => v.versionNumber === selectedVersionNum);

  const getEventIcon = (event: string) => {
    switch (event) {
      case 'APPROVAL_APPROVED':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'APPROVAL_REJECTED':
        return <XCircle className="h-4 w-4 text-rose-600" />;
      case 'APPROVAL_RETURNED':
        return <RotateCcw className="h-4 w-4 text-purple-600" />;
      case 'APPROVAL_ASSIGNED':
      case 'APPROVAL_REASSIGNED':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'APPROVAL_STARTED':
        return <Clock className="h-4 w-4 text-indigo-600" />;
      case 'CONDITION_ADDED':
      case 'CONDITION_UPDATED':
        return <FileCheck className="h-4 w-4 text-slate-600" />;
      default:
        return <GitCommit className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-8" id="approval-history-tab">
      {/* 1. Version Comparison Matrix (if versions exist) */}
      {versions.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <History className="h-4 w-4 text-indigo-600" />
                Sanction Decision Version History
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Snapshot of all approval, return, and rejection decisions recorded across governance tiers.
              </p>
            </div>

            {/* Version select tabs */}
            <div className="inline-flex rounded-md border border-slate-300 bg-white p-0.5 text-xs">
              {versions.map((ver) => (
                <button
                  key={ver.versionNumber}
                  onClick={() => setSelectedVersionNum(ver.versionNumber)}
                  className={`rounded px-3 py-1 font-semibold transition-colors ${
                    selectedVersionNum === ver.versionNumber
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Version {ver.versionNumber} ({ver.decision})
                </button>
              ))}
            </div>
          </div>

          {selectedVersion && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-slate-900 px-2 py-0.5 text-xs font-bold text-white">
                    Version {selectedVersion.versionNumber}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-bold ${
                      selectedVersion.decision === 'APPROVE'
                        ? 'bg-emerald-100 text-emerald-900'
                        : selectedVersion.decision === 'REJECT'
                        ? 'bg-rose-100 text-rose-900'
                        : 'bg-purple-100 text-purple-900'
                    }`}
                  >
                    {selectedVersion.decision} (Level {selectedVersion.level})
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Decided by <strong className="text-slate-800">{selectedVersion.decidedBy}</strong> ({selectedVersion.approverRole}) on{' '}
                  <span className="font-mono">{selectedVersion.decidedAt}</span>
                </div>
              </div>

              {/* Sanction Parameters Snapshot */}
              {selectedVersion.decision === 'APPROVE' && selectedVersion.approvedAmount && (
                <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                  <div className="rounded border border-slate-200 bg-white p-2.5">
                    <span className="text-[11px] text-slate-500 uppercase font-semibold">Sanction Quantum</span>
                    <p className="font-mono text-sm font-bold text-emerald-900 mt-0.5">
                      ₹{selectedVersion.approvedAmount.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="rounded border border-slate-200 bg-white p-2.5">
                    <span className="text-[11px] text-slate-500 uppercase font-semibold">Tenure</span>
                    <p className="font-mono text-sm font-bold text-slate-900 mt-0.5">
                      {selectedVersion.approvedTenureMonths} Months
                    </p>
                  </div>
                  <div className="rounded border border-slate-200 bg-white p-2.5">
                    <span className="text-[11px] text-slate-500 uppercase font-semibold">Interest Rate</span>
                    <p className="font-mono text-sm font-bold text-slate-900 mt-0.5">
                      {selectedVersion.approvedInterestRate}% p.a.
                    </p>
                  </div>
                </div>
              )}

              {/* Decision Notes */}
              <div className="mt-3 rounded border border-slate-200 bg-white p-3 text-xs">
                <span className="font-semibold text-slate-700 block mb-1">Approver's Notes & Rationale:</span>
                <p className="text-slate-800 leading-relaxed">{selectedVersion.decisionNotes}</p>
                {selectedVersion.deviationReason && (
                  <p className="mt-2 text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                    <strong>Deviation Justification:</strong> {selectedVersion.deviationReason}
                  </p>
                )}
                {selectedVersion.returnReason && (
                  <p className="mt-2 text-purple-800 bg-purple-50 p-2 rounded border border-purple-200">
                    <strong>Return Reason:</strong> {selectedVersion.returnReason} |{' '}
                    <strong>Action Required:</strong> {selectedVersion.requiredAction || 'None'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Chronological Audit Trail */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Immutable Workflow Audit Trail
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete chronological ledger of all actions, state transitions, and actor stamps for RBI audit readiness.
            </p>
          </div>
          {onExportAudit && (
            <button
              id="btn-export-audit-log"
              onClick={onExportAudit}
              className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Audit Ledger</span>
            </button>
          )}
        </div>

        <div className="mt-6 space-y-6">
          {history.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">No audit events recorded yet.</div>
          ) : (
            history.map((event, index) => (
              <div key={event.id} className="relative flex items-start gap-4">
                {/* Connector line */}
                {index < history.length - 1 && (
                  <div className="absolute left-4 top-8 -bottom-6 w-0.5 bg-slate-200" />
                )}

                {/* Event icon dot */}
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white shadow-xs z-10 flex-shrink-0">
                  {getEventIcon(event.event)}
                </div>

                {/* Event body */}
                <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 text-xs text-slate-700">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 uppercase tracking-wider font-mono">
                        {event.event.replace('_', ' ')}
                      </span>
                      {event.level && (
                        <span className="rounded bg-indigo-100 px-2 py-0.2 text-[11px] font-semibold text-indigo-900">
                          Tier Level {event.level}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-slate-500">{event.timestamp}</span>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-slate-500">
                    <span>Actor: <strong className="text-slate-800">{event.actor}</strong></span>
                    <span>•</span>
                    <span>Role: <strong className="text-slate-800">{event.actorRole}</strong></span>
                    {event.previousState && event.newState && (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                          <span className="text-slate-500">{event.previousState}</span>
                          <ArrowRight className="h-3 w-3 text-slate-400" />
                          <span className="font-bold text-slate-900">{event.newState}</span>
                        </span>
                      </>
                    )}
                  </div>

                  {event.notes && (
                    <div className="mt-2 rounded border border-slate-200 bg-white p-2 text-xs text-slate-800 leading-relaxed font-sans">
                      {event.notes}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
