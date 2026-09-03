import React, { useState } from 'react';
import {
  CreditAssessmentRecord,
  AssessmentConditionItem,
  ConditionStatus,
} from '../../types/creditTypes';
import { CreditStatusBadge } from './CreditStatusBadge';
import { FileCheck, Plus, CheckCircle, XCircle, Trash2, Edit2, ShieldAlert } from 'lucide-react';

interface ConditionsTabProps {
  assessment: CreditAssessmentRecord;
  onAddCondition?: (
    condition: Omit<
      AssessmentConditionItem,
      'id' | 'assessmentId' | 'addedBy' | 'addedAt' | 'status'
    >
  ) => void;
  onUpdateConditionStatus?: (
    conditionId: string,
    status: ConditionStatus,
    resolutionNotes: string
  ) => void;
  onDeleteCondition?: (conditionId: string) => void;
  canEdit?: boolean;
}

export const ConditionsTab: React.FC<ConditionsTabProps> = ({
  assessment,
  onAddCondition,
  onUpdateConditionStatus,
  onDeleteCondition,
  canEdit = true,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [description, setDescription] = useState('');
  const [conditionType, setConditionType] = useState('STANDARD');
  const [requiredBefore, setRequiredBefore] = useState<'APPROVAL' | 'SANCTION' | 'DISBURSEMENT' | 'POST_DISBURSEMENT'>('DISBURSEMENT');
  const [dueDate, setDueDate] = useState('');

  // Resolve / Waive Modal
  const [resolveModalCondition, setResolveModalCondition] = useState<AssessmentConditionItem | null>(null);
  const [targetStatus, setTargetStatus] = useState<ConditionStatus>('COMPLETED');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const conditions = assessment.conditions || [];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) return;

    if (onAddCondition) {
      onAddCondition({
        description,
        conditionType,
        requiredBefore,
        dueDate: dueDate || undefined,
      });
    }

    setDescription('');
    setConditionType('STANDARD');
    setRequiredBefore('DISBURSEMENT');
    setDueDate('');
    setShowAddModal(false);
  };

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveModalCondition) return;

    if (onUpdateConditionStatus) {
      onUpdateConditionStatus(resolveModalCondition.id, targetStatus, resolutionNotes);
    }

    setResolveModalCondition(null);
    setResolutionNotes('');
  };

  const openResolve = (cond: AssessmentConditionItem, status: ConditionStatus) => {
    setResolveModalCondition(cond);
    setTargetStatus(status);
    setResolutionNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Conditions Overview */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Underwriting Covenants & Sanction Conditions
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Mandatory covenants required to be fulfilled before sanction letter issuance or fund disbursement.
            </p>
          </div>

          {canEdit && onAddCondition && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Underwriting Condition
            </button>
          )}
        </div>

        {conditions.length > 0 ? (
          <div className="space-y-3">
            {conditions.map((cond) => (
              <div
                key={cond.id}
                className="p-4 rounded-lg border border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">
                      {cond.description}
                    </span>
                    <span className="font-semibold text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Required Before {cond.requiredBefore}
                    </span>
                    <CreditStatusBadge conditionStatus={cond.status} size="sm" />
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 text-slate-500 text-[11px] pt-1">
                    <span>Type: {cond.conditionType}</span>
                    <span>•</span>
                    <span>Added by: {cond.addedBy} ({cond.addedAt})</span>
                    {cond.dueDate && (
                      <>
                        <span>•</span>
                        <span>Due: {cond.dueDate}</span>
                      </>
                    )}
                    {cond.resolvedBy && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-700 font-semibold">
                          Resolved by: {cond.resolvedBy} on {cond.resolvedAt}
                        </span>
                      </>
                    )}
                  </div>

                  {cond.resolutionNotes && (
                    <div className="text-slate-600 bg-white p-2 rounded border border-slate-200 text-[11px] mt-2">
                      <strong className="text-slate-800">Resolution Commentary:</strong> {cond.resolutionNotes}
                    </div>
                  )}
                </div>

                {canEdit && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {cond.status === 'OPEN' && (
                      <>
                        <button
                          onClick={() => openResolve(cond, 'COMPLETED')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded hover:bg-emerald-100 transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Mark Satisfied
                        </button>
                        <button
                          onClick={() => openResolve(cond, 'WAIVED')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                        >
                          Waive
                        </button>
                      </>
                    )}
                    {cond.status !== 'OPEN' && (
                      <button
                        onClick={() => openResolve(cond, 'OPEN')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
                      >
                        Re-open
                      </button>
                    )}
                    {onDeleteCondition && (
                      <button
                        onClick={() => onDeleteCondition(cond.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        title="Delete Condition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            No special conditions or covenants currently attached to this assessment.
          </div>
        )}
      </div>

      {/* Add Condition Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                Add Underwriting Condition / Covenant
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Condition / Covenant Requirement *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Original title deed verification report by empanelled legal counsel prior to final disbursement."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Stage Enforcement *
                  </label>
                  <select
                    value={requiredBefore}
                    onChange={(e) => setRequiredBefore(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="APPROVAL">Pre-Approval</option>
                    <option value="SANCTION">Pre-Sanction Letter</option>
                    <option value="DISBURSEMENT">Pre-Disbursement (Fund Release)</option>
                    <option value="POST_DISBURSEMENT">Post-Disbursement Covenant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Covenant Type
                  </label>
                  <select
                    value={conditionType}
                    onChange={(e) => setConditionType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="STANDARD">Standard Policy Covenant</option>
                    <option value="DOCUMENTARY">Documentary Proof / Clearance</option>
                    <option value="COLLATERAL">Collateral & Charge Creation</option>
                    <option value="FINANCIAL">Financial / Foreclosure Proof</option>
                    <option value="INSURANCE">Asset / Life Insurance Policy</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-700 font-medium mb-1">
                    Due Target Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Attach Condition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve / Waive Condition Modal */}
      {resolveModalCondition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                Update Covenant Status ({targetStatus})
              </h3>
              <button
                onClick={() => setResolveModalCondition(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="font-semibold text-slate-800 block">Condition:</span>
                <p className="text-slate-600 mt-0.5">{resolveModalCondition.description}</p>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Resolution / Waiver Justification *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder={`Provide justification notes for marking this condition as ${targetStatus}...`}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResolveModalCondition(null)}
                  className="px-3 py-2 text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Confirm {targetStatus}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
