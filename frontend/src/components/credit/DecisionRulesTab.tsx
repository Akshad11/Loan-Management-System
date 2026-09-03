import React from 'react';
import { CreditAssessmentRecord, AssessmentRuleItem } from '../../types/creditTypes';
import { CreditStatusBadge } from './CreditStatusBadge';
import { ShieldCheck, RefreshCw, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface DecisionRulesTabProps {
  assessment: CreditAssessmentRecord;
  onEvaluateRules?: () => void;
  canEdit?: boolean;
}

export const DecisionRulesTab: React.FC<DecisionRulesTabProps> = ({
  assessment,
  onEvaluateRules,
  canEdit = true,
}) => {
  const rules: AssessmentRuleItem[] = assessment.rules || [];

  const passCount = rules.filter((r) => r.result === 'PASS').length;
  const warnCount = rules.filter((r) => r.result === 'WARNING').length;
  const failCount = rules.filter((r) => r.result === 'FAIL').length;

  return (
    <div className="space-y-6">
      {/* Rules Engine Header & Action */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Automated Credit Policy Rules Engine
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic evaluation against institutional underwriting parameters & regulatory thresholds.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Counts */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                {passCount} PASS
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200">
                {warnCount} WARN
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-200">
                {failCount} FAIL
              </span>
            </div>

            {canEdit && onEvaluateRules && (
              <button
                onClick={onEvaluateRules}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Run Policy Evaluation
              </button>
            )}
          </div>
        </div>

        {/* Rules Table */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Rule Identifier & Name</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Assessed Value</th>
                <th className="px-4 py-2.5">Policy Benchmark</th>
                <th className="px-4 py-2.5">Evaluation</th>
                <th className="px-4 py-2.5">Approval Blocker</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-900">{rule.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{rule.ruleCode}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{rule.description}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {rule.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {rule.currentValueDisplay}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {rule.thresholdDisplay}
                  </td>
                  <td className="px-4 py-3">
                    <CreditStatusBadge ruleResult={rule.result} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    {rule.isBlockingApproval ? (
                      <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        Hard Blocker
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-500">
                        Advisory Only
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
