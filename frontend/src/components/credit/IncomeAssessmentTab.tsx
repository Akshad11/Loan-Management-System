import React, { useState } from 'react';
import { CreditAssessmentRecord } from '../../types/creditTypes';
import { DollarSign, Edit3, CheckCircle2, FileText, TrendingUp, AlertCircle } from 'lucide-react';

interface IncomeAssessmentTabProps {
  assessment: CreditAssessmentRecord;
  onUpdateFinancials?: (updates: Partial<CreditAssessmentRecord>) => void;
  canEdit?: boolean;
}

export const IncomeAssessmentTab: React.FC<IncomeAssessmentTabProps> = ({
  assessment,
  onUpdateFinancials,
  canEdit = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [gross, setGross] = useState(assessment.monthlyGrossIncome || 0);
  const [net, setNet] = useState(assessment.monthlyNetIncome || 0);
  const [other, setOther] = useState(assessment.otherMonthlyIncome || 0);
  const [otherSource, setOtherSource] = useState(assessment.otherIncomeDescription || '');
  const [stability, setStability] = useState(assessment.employmentStability || 'STABLE');

  const handleSave = () => {
    if (onUpdateFinancials) {
      onUpdateFinancials({
        monthlyGrossIncome: Number(gross),
        monthlyNetIncome: Number(net),
        otherMonthlyIncome: Number(other),
        otherIncomeDescription: otherSource,
        employmentStability: stability as any,
      });
    }
    setIsEditing(false);
  };

  const calculatedTotal = Number(net) + Number(other);

  return (
    <div className="space-y-6">
      {/* Financial Summary Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Assessed Monthly Income Structure
            </h3>
          </div>
          {canEdit && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Adjust Income Inputs
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase">Underwriter Income Adjustments</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Gross Monthly Income (₹)</label>
                <input
                  type="number"
                  value={gross}
                  onChange={(e) => setGross(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Net Take-Home Salary / Earnings (₹)</label>
                <input
                  type="number"
                  value={net}
                  onChange={(e) => setNet(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Other Secondary Income (₹)</label>
                <input
                  type="number"
                  value={other}
                  onChange={(e) => setOther(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-700 font-medium mb-1">Other Income Source Description</label>
                <input
                  type="text"
                  placeholder="e.g. Verified rental receipt from residential property"
                  value={otherSource}
                  onChange={(e) => setOtherSource(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Employment / Business Stability</label>
                <select
                  value={stability}
                  onChange={(e) => setStability(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="VERY_STABLE">VERY STABLE</option>
                  <option value="STABLE">STABLE</option>
                  <option value="MODERATE">MODERATE</option>
                  <option value="VOLATILE">VOLATILE</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors"
              >
                Apply & Recalculate Ratios
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block mb-1">Gross Monthly Earnings</span>
              <span className="text-base font-bold text-slate-900">
                ₹{assessment.monthlyGrossIncome.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">As per pay slip / P&L</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block mb-1">Net Monthly Take-Home</span>
              <span className="text-base font-bold text-slate-900">
                ₹{assessment.monthlyNetIncome.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">Post tax & standard deductions</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block mb-1">Other Allowable Income</span>
              <span className="text-base font-bold text-slate-900">
                ₹{assessment.otherMonthlyIncome.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {assessment.otherIncomeDescription || 'None declared'}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-indigo-50 border border-indigo-200">
              <span className="text-indigo-700 block mb-1 font-semibold">Total Considered Income</span>
              <span className="text-lg font-bold text-indigo-900">
                ₹{assessment.totalConsideredIncome.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-indigo-600 block mt-0.5">Used for DTI / FOIR denominator</span>
            </div>
          </div>
        )}
      </div>

      {/* Income Verification & Document Cross-References */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
          <FileText className="w-4 h-4 text-slate-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Income Verification & Document Cross-References
          </h3>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="font-semibold text-slate-900 block">3-Month Salary Slips & Form 16</span>
                <span className="text-slate-500">Verified against employer database and tax department records.</span>
              </div>
            </div>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
              VERIFIED
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="font-semibold text-slate-900 block">6-Month Bank Statement Analysis</span>
                <span className="text-slate-500">Regular salary credits observed consistently between 1st and 3rd of each calendar month.</span>
              </div>
            </div>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
              VERIFIED
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div>
                <span className="font-semibold text-slate-900 block">Income Tax Return (ITR-V) Acknowledgments</span>
                <span className="text-slate-500">AY 2024-25 and AY 2025-26 returns verified with central tax portal.</span>
              </div>
            </div>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
              VERIFIED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
