import React, { useState } from 'react';
import { SanctionRecord, SanctionCondition } from '../../types/sanctionTypes';
import { ConditionStatus } from '../../types';
import {
  Plus,
  CheckCircle2,
  Clock,
  Ban,
  Filter,
  AlertCircle,
  FileText,
  Calendar,
  User,
  Trash2,
  ShieldCheck,
} from 'lucide-react';

interface SanctionConditionsTabProps {
  sanction: SanctionRecord;
  onAddCondition: () => void;
  onUpdateConditionStatus: (
    conditionId: string,
    status: ConditionStatus,
    resolutionNotes?: string,
    waiverReason?: string
  ) => void;
  onDeleteCondition: (conditionId: string) => void;
  canManageConditions: boolean;
}

export const SanctionConditionsTab: React.FC<SanctionConditionsTabProps> = ({
  sanction,
  onAddCondition,
  onUpdateConditionStatus,
  onDeleteCondition,
  canManageConditions,
}) => {
  const [timingFilter, setTimingFilter] = useState<'ALL' | 'SANCTION' | 'DISBURSEMENT' | 'POST_DISBURSEMENT'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ConditionStatus>('ALL');
  const [selectedConditionForAction, setSelectedConditionForAction] = useState<{
    condition: SanctionCondition;
    action: 'COMPLETE' | 'WAIVE';
  } | null>(null);

  const [actionNotes, setActionNotes] = useState('');
  const [actionError, setActionError] = useState('');

  const filteredConditions = sanction.conditions.filter((c) => {
    if (timingFilter !== 'ALL' && c.requiredBefore !== timingFilter) return false;
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    return true;
  });

  const openConditionsCount = sanction.conditions.filter((c) => c.status === 'OPEN').length;
  const preDisbOpenCount = sanction.conditions.filter(
    (c) => c.requiredBefore === 'DISBURSEMENT' && c.status === 'OPEN'
  ).length;

  const handleExecuteAction = () => {
    if (!selectedConditionForAction) return;
    if (selectedConditionForAction.action === 'WAIVE' && (!actionNotes || actionNotes.trim().length < 5)) {
      setActionError('A mandatory waiver justification (minimum 5 characters) is required for audit trail.');
      return;
    }

    if (selectedConditionForAction.action === 'COMPLETE') {
      onUpdateConditionStatus(
        selectedConditionForAction.condition.id,
        'COMPLETED',
        actionNotes || 'Condition verified and satisfied.',
        undefined
      );
    } else {
      onUpdateConditionStatus(
        selectedConditionForAction.condition.id,
        'WAIVED',
        undefined,
        actionNotes
      );
    }

    setSelectedConditionForAction(null);
    setActionNotes('');
    setActionError('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Stats & Add Button */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-700" />
            Sanction Covenants & Pre-Disbursement Conditions ({sanction.conditions.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Mandatory credit, legal, compliance covenants that must be satisfied prior to disbursement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {preDisbOpenCount > 0 && (
            <span className="inline-flex items-center text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-300 rounded px-2.5 py-1">
              <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
              {preDisbOpenCount} Pre-Disbursement Pending
            </span>
          )}

          {canManageConditions && sanction.status !== 'CANCELLED' && (
            <button
              onClick={onAddCondition}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-md shadow-xs transition-colors inline-flex items-center"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Sanction Condition
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-600 mr-1">Timing:</span>
          {(['ALL', 'SANCTION', 'DISBURSEMENT', 'POST_DISBURSEMENT'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimingFilter(t)}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                timingFilter === t
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {t === 'ALL'
                ? 'All Stages'
                : t === 'SANCTION'
                ? 'Pre-Sanction'
                : t === 'DISBURSEMENT'
                ? 'Pre-Disbursement'
                : 'Post-Disbursement'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600 mr-1">Status:</span>
          {(['ALL', 'OPEN', 'COMPLETED', 'WAIVED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-slate-800 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {s === 'ALL' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Conditions List */}
      {filteredConditions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center text-xs text-slate-500">
          No covenants or conditions found matching the selected filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredConditions.map((cond, idx) => {
            const isCompleted = cond.status === 'COMPLETED';
            const isWaived = cond.status === 'WAIVED';
            const isOpen = cond.status === 'OPEN';
            const isInherited = cond.source === 'APPROVAL' || cond.source === 'CREDIT_ASSESSMENT';

            return (
              <div
                key={cond.id}
                className={`bg-white border rounded-lg p-4 shadow-xs transition-all ${
                  isOpen
                    ? 'border-slate-300'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                        {cond.category}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          cond.requiredBefore === 'SANCTION'
                            ? 'bg-purple-50 text-purple-800 border border-purple-200'
                            : cond.requiredBefore === 'DISBURSEMENT'
                            ? 'bg-amber-50 text-amber-800 border border-amber-300'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}
                      >
                        Pre-{cond.requiredBefore.replace('_', ' ')}
                      </span>

                      <span className="text-[10px] text-slate-400 font-mono">
                        Source: {cond.source.replace('_', ' ')}
                      </span>

                      {cond.dueDate && (
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Due: {cond.dueDate}
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-slate-900">{cond.description}</p>

                    {/* Resolution / Waiver Notes */}
                    {cond.resolutionNotes && (
                      <div className="mt-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-2 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold">Resolution: </span>
                          {cond.resolutionNotes}
                          {cond.resolvedBy && (
                            <span className="text-[10px] text-emerald-600 block mt-0.5">
                              Verified by {cond.resolvedBy} on {cond.resolvedAt}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {cond.waiverReason && (
                      <div className="mt-2 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded p-2 flex items-start gap-1.5">
                        <Ban className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold">Formal Waiver Justification: </span>
                          {cond.waiverReason}
                          {cond.waivedBy && (
                            <span className="text-[10px] text-amber-700 block mt-0.5">
                              Approved by {cond.waivedBy} on {cond.waivedAt}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right side: Status and Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded text-xs font-bold ${
                        isOpen
                          ? 'bg-amber-100 text-amber-800'
                          : isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {cond.status}
                    </span>

                    {isOpen && canManageConditions && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedConditionForAction({ condition: cond, action: 'COMPLETE' })}
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium rounded shadow-2xs transition-colors inline-flex items-center"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Satisfy
                        </button>

                        <button
                          onClick={() => setSelectedConditionForAction({ condition: cond, action: 'WAIVE' })}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded border border-slate-300 transition-colors inline-flex items-center"
                        >
                          <Ban className="w-3 h-3 mr-1 text-slate-500" />
                          Waive
                        </button>
                      </div>
                    )}

                    {!isInherited && isOpen && canManageConditions && (
                      <button
                        onClick={() => onDeleteCondition(cond.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Delete Condition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Dialog (Satisfy or Waive Condition) */}
      {selectedConditionForAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-300 shadow-xl max-w-md w-full p-5 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-900">
              {selectedConditionForAction.action === 'COMPLETE'
                ? 'Satisfy Condition Covenant'
                : 'Formally Waive Sanction Condition'}
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              {selectedConditionForAction.condition.description}
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {selectedConditionForAction.action === 'COMPLETE'
                  ? 'Verification Notes (Optional)'
                  : 'Mandatory Waiver Justification (Required for Audit)*'}
              </label>
              <textarea
                rows={3}
                value={actionNotes}
                onChange={(e) => {
                  setActionNotes(e.target.value);
                  setActionError('');
                }}
                placeholder={
                  selectedConditionForAction.action === 'COMPLETE'
                    ? 'e.g., Original title deed verified by legal officer.'
                    : 'e.g., Document waived per Credit Policy Clause 4.2 with Regional Manager sign-off.'
                }
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
              {actionError && <p className="text-[11px] text-rose-600 mt-1">{actionError}</p>}
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setSelectedConditionForAction(null);
                  setActionNotes('');
                  setActionError('');
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md border border-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAction}
                className={`px-4 py-1.5 text-xs font-bold text-white rounded-md shadow-xs ${
                  selectedConditionForAction.action === 'COMPLETE'
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : 'bg-amber-700 hover:bg-amber-800'
                }`}
              >
                Confirm {selectedConditionForAction.action === 'COMPLETE' ? 'Satisfaction' : 'Waiver'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
