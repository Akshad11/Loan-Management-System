import React, { useState } from 'react';
import { ApprovalMatrixRule, ApprovalMatrixAudit } from '../../types/approvalTypes';
import { ApprovalMatrixRuleModal } from './ApprovalMatrixRuleModal';
import {
  Shield,
  PlusCircle,
  History,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Clock,
  Layers,
  ArrowRight,
  ChevronRight,
  X,
  Building,
} from 'lucide-react';

interface ApprovalMatrixViewProps {
  rules: ApprovalMatrixRule[];
  audits: ApprovalMatrixAudit[];
  branches: { id: string; name: string }[];
  onAddRule: (rule: Omit<ApprovalMatrixRule, 'id' | 'createdDate' | 'updatedDate'>) => {
    success: boolean;
    message?: string;
    rule?: ApprovalMatrixRule;
  };
  onUpdateRule: (
    ruleId: string,
    updates: Partial<ApprovalMatrixRule>
  ) => { success: boolean; message?: string; rule?: ApprovalMatrixRule };
  onToggleActive: (ruleId: string, isActive: boolean) => void;
  onDeleteRule: (ruleId: string) => { success: boolean; message?: string };
}

export const ApprovalMatrixView: React.FC<ApprovalMatrixViewProps> = ({
  rules,
  audits,
  branches,
  onAddRule,
  onUpdateRule,
  onToggleActive,
  onDeleteRule,
}) => {
  const [productFilter, setProductFilter] = useState<string>('ALL');
  const [isRuleModalOpen, setIsRuleModalOpen] = useState<boolean>(false);
  const [ruleToEdit, setRuleToEdit] = useState<ApprovalMatrixRule | null>(null);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const filteredRules = rules.filter((r) => {
    if (productFilter === 'ALL') return true;
    return r.productCode === productFilter || r.productCode === 'ALL';
  });

  const handleOpenAddModal = () => {
    setRuleToEdit(null);
    setIsRuleModalOpen(true);
  };

  const handleOpenEditModal = (rule: ApprovalMatrixRule) => {
    setRuleToEdit(rule);
    setIsRuleModalOpen(true);
  };

  const handleSaveRule = (data: Omit<ApprovalMatrixRule, 'id' | 'createdDate' | 'updatedDate'>) => {
    if (ruleToEdit) {
      const res = onUpdateRule(ruleToEdit.id, data);
      if (res.success) {
        setActionMessage({ type: 'success', text: `Rule ${ruleToEdit.ruleCode} updated successfully.` });
      }
      return res;
    } else {
      const res = onAddRule(data);
      if (res.success) {
        setActionMessage({ type: 'success', text: `Rule ${data.ruleCode} created successfully.` });
      }
      return res;
    }
  };

  const handleDelete = (rule: ApprovalMatrixRule) => {
    if (confirm(`Are you sure you want to delete delegation rule ${rule.ruleCode}?`)) {
      const res = onDeleteRule(rule.id);
      if (res.success) {
        setActionMessage({ type: 'success', text: `Rule ${rule.ruleCode} deleted.` });
      } else {
        setActionMessage({ type: 'error', text: res.message || 'Failed to delete rule.' });
      }
    }
  };

  return (
    <div className="space-y-6" id="approval-matrix-view">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-700" />
            <h1 className="text-lg font-bold text-slate-900">
              Multi-Level Approval & Delegation of Authority Matrix
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configurable governance matrix controlling approval hierarchies, quantum delegation limits, and exception escalation pathways.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-open-matrix-audits"
            onClick={() => setIsAuditDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <History className="h-3.5 w-3.5 text-slate-500" />
            <span>Matrix Change Audit ({audits.length})</span>
          </button>

          <button
            id="btn-add-matrix-rule"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Add Delegation Rule</span>
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div
          className={`rounded-md p-3 text-xs flex items-center justify-between ${
            actionMessage.type === 'success'
              ? 'border border-emerald-300 bg-emerald-50 text-emerald-950'
              : 'border border-rose-300 bg-rose-50 text-rose-950'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-700">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Product Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 text-xs">
        {[
          { id: 'ALL', label: 'All Products' },
          { id: 'PL', label: 'Personal Loans (PL)' },
          { id: 'HL', label: 'Home Loans (HL)' },
          { id: 'BL', label: 'Business Loans (BL)' },
          { id: 'LAP', label: 'Loan Against Property (LAP)' },
          { id: 'VL', label: 'Vehicle Loans (VL)' },
        ].map((prod) => (
          <button
            key={prod.id}
            id={`matrix-tab-${prod.id}`}
            onClick={() => setProductFilter(prod.id)}
            className={`rounded-md px-3 py-1.5 font-semibold transition-colors ${
              productFilter === prod.id
                ? 'bg-indigo-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {prod.label}
          </button>
        ))}
      </div>

      {/* Rules Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" id="matrix-rules-table">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="py-3 px-3">Rule Code & Level</th>
                <th className="py-3 px-3">Product</th>
                <th className="py-3 px-3">Quantum Band</th>
                <th className="py-3 px-3">Branch Scope</th>
                <th className="py-3 px-3">Authorized Role</th>
                <th className="py-3 px-3">Authority Limit</th>
                <th className="py-3 px-3">Exception Approver</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 pr-4 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-slate-400">
                    No matrix delegation rules configured for the selected filter.
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-slate-900">{rule.ruleCode}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="inline-flex rounded bg-indigo-100 px-1.5 py-0.2 text-[11px] font-bold text-indigo-900">
                            Tier {rule.level}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate max-w-[140px]" title={rule.levelName}>
                            {rule.levelName}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800 text-xs block">
                        {rule.productName}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">{rule.productCode}</span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        ₹{rule.minAmount.toLocaleString('en-IN')} – ₹{rule.maxAmount.toLocaleString('en-IN')}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Building className="h-3 w-3 text-slate-400" />
                        <span>{rule.branchName}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-xs font-semibold text-slate-800 block">
                        {rule.approverRoleName}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-emerald-900 text-xs">
                      ₹{rule.authorityLimit.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-3 text-xs text-slate-600">
                      {rule.exceptionApproverRoleName || 'National Sanction Committee'}
                    </td>

                    <td className="py-3 px-3">
                      <button
                        id={`toggle-rule-${rule.id}`}
                        onClick={() => onToggleActive(rule.id, !rule.isActive)}
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold ${
                          rule.isActive
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border border-slate-300'
                        }`}
                      >
                        {rule.isActive ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" /> Inactive
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3 pr-4 pl-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          id={`edit-rule-${rule.id}`}
                          onClick={() => handleOpenEditModal(rule)}
                          className="rounded border border-slate-300 bg-white p-1 text-slate-600 hover:bg-slate-100"
                          title="Edit Matrix Rule"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          id={`delete-rule-${rule.id}`}
                          onClick={() => handleDelete(rule)}
                          className="rounded border border-slate-300 bg-white p-1 text-slate-500 hover:bg-slate-100 hover:text-rose-600"
                          title="Delete Matrix Rule"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <ApprovalMatrixRuleModal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        ruleToEdit={ruleToEdit}
        branches={branches}
        onSaveRule={handleSaveRule}
      />

      {/* Matrix Audit Drawer */}
      {isAuditDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <History className="h-4 w-4 text-indigo-700" />
                  Matrix Governance Audit Trail
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Immutable record of matrix delegation changes for RBI regulatory compliance.
                </p>
              </div>
              <button
                onClick={() => setIsAuditDrawerOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {audits.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No audit events recorded yet.</div>
              ) : (
                audits.map((audit) => (
                  <div key={audit.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900">{audit.ruleCode}</span>
                      <span className="rounded bg-indigo-100 px-1.5 py-0.2 text-[10px] font-bold text-indigo-900">
                        {audit.action}
                      </span>
                    </div>
                    <p className="text-slate-700">{audit.details}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                      <span>By: <strong className="text-slate-700">{audit.actor}</strong></span>
                      <span className="font-mono">{audit.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
