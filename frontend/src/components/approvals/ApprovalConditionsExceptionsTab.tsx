import React, { useState } from 'react';
import {
  ApprovalRecord,
  ApprovalCondition,
  ApprovalException,
  ConditionStatus,
  ConditionStage,
} from '../../types/approvalTypes';
import { ConditionStatusBadge, ExceptionStatusBadge } from './ApprovalStatusBadge';
import {
  PlusCircle,
  ShieldAlert,
  FileCheck2,
  Check,
  X,
  Send,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Lock,
} from 'lucide-react';

interface ApprovalConditionsExceptionsTabProps {
  approval: ApprovalRecord;
  onOpenConditionModal: () => void;
  onOpenExceptionModal: () => void;
  onUpdateConditionStatus: (
    conditionId: string,
    status: ConditionStatus,
    resolutionNotes?: string,
    waiverReason?: string
  ) => void;
  onDeleteCondition: (conditionId: string) => void;
  onRouteException: (exceptionId: string, routedToRole: string) => void;
  onResolveException: (exceptionId: string, status: 'APPROVED' | 'REJECTED', decisionNotes: string) => void;
  userRole?: string;
  userName?: string;
}

export const ApprovalConditionsExceptionsTab: React.FC<ApprovalConditionsExceptionsTabProps> = ({
  approval,
  onOpenConditionModal,
  onOpenExceptionModal,
  onUpdateConditionStatus,
  onDeleteCondition,
  onRouteException,
  onResolveException,
  userRole = '',
  userName = '',
}) => {
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [waivingConditionId, setWaivingConditionId] = useState<string | null>(null);
  const [waiverReason, setWaiverReason] = useState<string>('');

  const [resolvingExceptionId, setResolvingExceptionId] = useState<string | null>(null);
  const [exceptionDecisionNotes, setExceptionDecisionNotes] = useState<string>('');

  const conditions = approval.conditions || [];
  const exceptions = approval.exceptions || [];

  const filteredConditions = conditions.filter((c) => {
    if (stageFilter === 'ALL') return true;
    return c.requiredBefore === stageFilter;
  });

  const openConditionsCount = conditions.filter((c) => c.status === 'OPEN').length;
  const pendingExceptionsCount = exceptions.filter((e) => e.status === 'PENDING' || e.status === 'SUBMITTED').length;

  const handleConfirmWaiver = (conditionId: string) => {
    if (!waiverReason.trim()) return;
    onUpdateConditionStatus(conditionId, 'WAIVED', undefined, waiverReason.trim());
    setWaivingConditionId(null);
    setWaiverReason('');
  };

  const handleResolveExceptionSubmit = (exceptionId: string, status: 'APPROVED' | 'REJECTED') => {
    if (!exceptionDecisionNotes.trim()) return;
    onResolveException(exceptionId, status, exceptionDecisionNotes.trim());
    setResolvingExceptionId(null);
    setExceptionDecisionNotes('');
  };

  return (
    <div className="space-y-8" id="approval-conditions-exceptions-tab">
      {/* 1. Sanction Covenants & Conditions Section */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-indigo-600" />
                Sanction Conditions & Covenants
              </h2>
              {openConditionsCount > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
                  {openConditionsCount} Open
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Covenants inherited from credit underwriting and new conditions imposed by sanction authorities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Stage filter buttons */}
            <div className="inline-flex rounded-md border border-slate-300 bg-white p-0.5 text-xs">
              {['ALL', 'SANCTION', 'DISBURSEMENT', 'POST_DISBURSEMENT'].map((stage) => (
                <button
                  key={stage}
                  onClick={() => setStageFilter(stage)}
                  className={`rounded px-2.5 py-1 font-semibold transition-colors ${
                    stageFilter === stage
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {stage === 'ALL'
                    ? 'All'
                    : stage === 'SANCTION'
                    ? 'Pre-Sanction'
                    : stage === 'DISBURSEMENT'
                    ? 'Pre-Disbursement'
                    : 'Post-Disbursement'}
                </button>
              ))}
            </div>

            <button
              id="btn-add-condition-tab"
              onClick={onOpenConditionModal}
              className="inline-flex items-center gap-1 rounded bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Add Condition</span>
            </button>
          </div>
        </div>

        {/* Waiver Prompt Overlay/Row if active */}
        {waivingConditionId && (
          <div className="mt-4 rounded-lg border border-purple-300 bg-purple-50 p-4 text-xs">
            <h4 className="font-bold text-purple-950 mb-1">Waive Condition Covenant</h4>
            <p className="text-purple-800 mb-2">
              Please specify the policy justification or compensating control for waiving this sanction covenant.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter mandatory waiver justification..."
                value={waiverReason}
                onChange={(e) => setWaiverReason(e.target.value)}
                className="flex-1 rounded border border-purple-300 bg-white px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-800"
              />
              <button
                disabled={!waiverReason.trim()}
                onClick={() => handleConfirmWaiver(waivingConditionId)}
                className="rounded bg-purple-800 px-3 py-1.5 font-bold text-white disabled:opacity-50 hover:bg-purple-900"
              >
                Confirm Waiver
              </button>
              <button
                onClick={() => {
                  setWaivingConditionId(null);
                  setWaiverReason('');
                }}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Conditions List / Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm" id="conditions-table">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="py-2.5 px-3">Stage</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Condition Description</th>
                <th className="py-2.5 px-3">Source & Owner</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 pr-4 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {filteredConditions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-slate-400">
                    No sanction conditions recorded for the selected stage filter.
                  </td>
                </tr>
              ) : (
                filteredConditions.map((cond) => (
                  <tr key={cond.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-3">
                      <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800 uppercase">
                        {cond.requiredBefore === 'SANCTION'
                          ? 'Pre-Sanction'
                          : cond.requiredBefore === 'DISBURSEMENT'
                          ? 'Pre-Disb.'
                          : 'Post-Disb.'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-xs font-semibold text-slate-600 uppercase">
                        {cond.category}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="max-w-md">
                        <p className="text-xs font-medium text-slate-900">{cond.description}</p>
                        {cond.resolutionNotes && (
                          <p className="text-[11px] text-emerald-800 mt-0.5">
                            <strong>Resolved:</strong> {cond.resolutionNotes}
                          </p>
                        )}
                        {cond.waiverReason && (
                          <p className="text-[11px] text-purple-800 mt-0.5">
                            <strong>Waived by {cond.waivedBy}:</strong> {cond.waiverReason}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs">
                      <span className="text-slate-800 font-medium">{cond.owner}</span>
                      <span className="text-[11px] text-slate-400 block">
                        {cond.source === 'CREDIT_ASSESSMENT' ? 'Credit Assessor' : 'Sanction Committee'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs font-mono text-slate-600">
                      {cond.dueDate || 'Prior to stage'}
                    </td>
                    <td className="py-3 px-3">
                      <ConditionStatusBadge status={cond.status} />
                    </td>
                    <td className="py-3 pr-4 pl-3 text-right">
                      <div className="flex items-center justify-end gap-1 text-xs">
                        {cond.status === 'OPEN' && (
                          <>
                            <button
                              id={`btn-complete-cond-${cond.id}`}
                              onClick={() =>
                                onUpdateConditionStatus(cond.id, 'COMPLETED', 'Verified by Sanction Authority')
                              }
                              title="Mark Condition as Completed"
                              className="rounded border border-emerald-300 bg-emerald-50 p-1 text-emerald-800 hover:bg-emerald-100"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              id={`btn-waive-cond-${cond.id}`}
                              onClick={() => setWaivingConditionId(cond.id)}
                              title="Waive Condition with Justification"
                              className="rounded border border-purple-300 bg-purple-50 p-1 text-purple-800 hover:bg-purple-100"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        {cond.source === 'APPROVAL_STAGE' && (
                          <button
                            id={`btn-delete-cond-${cond.id}`}
                            onClick={() => onDeleteCondition(cond.id)}
                            title="Delete Condition"
                            className="rounded border border-slate-300 bg-white p-1 text-slate-500 hover:bg-slate-100 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Exceptions & Policy Deviations Section */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                Exceptions & Policy Deviations
              </h2>
              {pendingExceptionsCount > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
                  {pendingExceptionsCount} Pending Escalation
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Escalation requests for delegation limit overruns, rate deviations, tenure extensions, or policy waivers.
            </p>
          </div>

          <button
            id="btn-request-exception-tab"
            onClick={onOpenExceptionModal}
            className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100"
          >
            <PlusCircle className="h-3.5 w-3.5 text-amber-700" />
            <span>Request Policy Exception</span>
          </button>
        </div>

        {/* Exception Resolution Prompt Overlay if active */}
        {resolvingExceptionId && (
          <div className="mt-4 rounded-lg border border-indigo-300 bg-indigo-50 p-4 text-xs">
            <h4 className="font-bold text-indigo-950 mb-1">Authorize or Reject Exception Deviation</h4>
            <p className="text-indigo-800 mb-2">
              Enter mandatory committee justification notes for authorizing or declining this deviation.
            </p>
            <div className="flex flex-col gap-2">
              <textarea
                rows={2}
                placeholder="Enter formal justification notes..."
                value={exceptionDecisionNotes}
                onChange={(e) => setExceptionDecisionNotes(e.target.value)}
                className="w-full rounded border border-indigo-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-800"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  disabled={!exceptionDecisionNotes.trim()}
                  onClick={() => handleResolveExceptionSubmit(resolvingExceptionId, 'APPROVED')}
                  className="rounded bg-emerald-700 px-3 py-1.5 font-bold text-white disabled:opacity-50 hover:bg-emerald-800"
                >
                  Authorize Deviation
                </button>
                <button
                  disabled={!exceptionDecisionNotes.trim()}
                  onClick={() => handleResolveExceptionSubmit(resolvingExceptionId, 'REJECTED')}
                  className="rounded bg-rose-700 px-3 py-1.5 font-bold text-white disabled:opacity-50 hover:bg-rose-800"
                >
                  Decline Deviation
                </button>
                <button
                  onClick={() => {
                    setResolvingExceptionId(null);
                    setExceptionDecisionNotes('');
                  }}
                  className="rounded border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Exceptions List */}
        <div className="mt-4 space-y-3">
          {exceptions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
              No policy exceptions or delegation deviations recorded for this approval dossier.
            </div>
          ) : (
            exceptions.map((exc) => {
              const isPending = exc.status === 'PENDING';
              const isSubmitted = exc.status === 'SUBMITTED';

              return (
                <div
                  key={exc.id}
                  id={`exception-card-${exc.id}`}
                  className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 transition-all hover:bg-slate-50"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded bg-amber-100 p-2 text-amber-800 mt-0.5">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            {exc.category.replace('_', ' ')}
                          </span>
                          <ExceptionStatusBadge status={exc.status} />
                        </div>
                        <h4 className="mt-1 text-sm font-bold text-slate-900">{exc.title}</h4>
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed max-w-2xl">{exc.reason}</p>

                        {(exc.recommendedValue !== undefined || exc.requestedValue !== undefined) && (
                          <div className="mt-2 flex items-center gap-4 text-xs font-mono">
                            <span className="text-slate-500">
                              Standard / Limit: <strong>{exc.recommendedValue}</strong>
                            </span>
                            <span className="text-indigo-700 font-bold">
                              Requested Deviation: <strong>{exc.requestedValue}</strong>
                            </span>
                          </div>
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                          <span>Required Authority: <strong className="text-slate-700">{exc.requiredAuthorityRole}</strong></span>
                          <span>Created by: <strong className="text-slate-700">{exc.createdBy}</strong></span>
                          <span>Timestamp: <strong className="font-mono text-slate-700">{exc.createdAt}</strong></span>
                        </div>

                        {exc.decidedBy && (
                          <div className="mt-2 rounded border border-slate-200 bg-white p-2 text-xs text-slate-700">
                            <strong>Decision by {exc.decidedBy} ({exc.decidedAt}):</strong>{' '}
                            {exc.decisionNotes || 'Approved without additional covenant'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {isPending && (
                        <button
                          id={`btn-route-exc-${exc.id}`}
                          onClick={() => onRouteException(exc.id, exc.requiredAuthorityRole)}
                          className="inline-flex items-center gap-1 rounded bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-800"
                        >
                          <Send className="h-3 w-3" />
                          <span>Route to {exc.requiredAuthorityRole}</span>
                        </button>
                      )}

                      {isSubmitted && (
                        <button
                          id={`btn-resolve-exc-${exc.id}`}
                          onClick={() => setResolvingExceptionId(exc.id)}
                          className="inline-flex items-center gap-1 rounded bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                          <FileCheck2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Authorize / Decline</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
