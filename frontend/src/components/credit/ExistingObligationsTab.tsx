import React, { useState } from 'react';
import { CreditAssessmentRecord, ObligationItem } from '../../types/creditTypes';
import { CreditCard, Plus, Trash2, Shield, AlertCircle, Info, Layers } from 'lucide-react';

interface ExistingObligationsTabProps {
  assessment: CreditAssessmentRecord;
  onAddObligation?: (obligation: Omit<ObligationItem, 'id' | 'assessmentId'>) => void;
  onDeleteObligation?: (obligationId: string) => void;
  canEdit?: boolean;
}

export const ExistingObligationsTab: React.FC<ExistingObligationsTabProps> = ({
  assessment,
  onAddObligation,
  onDeleteObligation,
  canEdit = true,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [lenderName, setLenderName] = useState('');
  const [loanType, setLoanType] = useState('Personal Loan');
  const [outstandingAmount, setOutstandingAmount] = useState(0);
  const [monthlyEmi, setMonthlyEmi] = useState(0);
  const [tenureRemainingMonths, setTenureRemainingMonths] = useState(12);
  const [isSecured, setIsSecured] = useState(false);
  const [source, setSource] = useState<'BUREAU' | 'DECLARED' | 'MANUAL_ENTRY'>('BUREAU');
  const [isExcludedFromFoir, setIsExcludedFromFoir] = useState(false);
  const [exclusionReason, setExclusionReason] = useState('');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lenderName || monthlyEmi <= 0) return;

    if (onAddObligation) {
      onAddObligation({
        lenderName,
        loanType,
        outstandingAmount: Number(outstandingAmount),
        monthlyEmi: Number(monthlyEmi),
        remainingTenureMonths: Number(tenureRemainingMonths),
        isSecured,
        source,
        isExcludedFromFoir,
        exclusionReason: isExcludedFromFoir ? exclusionReason : undefined,
      });
    }

    // Reset form
    setLenderName('');
    setOutstandingAmount(0);
    setMonthlyEmi(0);
    setTenureRemainingMonths(12);
    setIsSecured(false);
    setIsExcludedFromFoir(false);
    setExclusionReason('');
    setShowAddModal(false);
  };

  const obligations = assessment.obligations || [];

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 block mb-1">Total Existing Debt Exposure</span>
          <span className="text-xl font-bold text-slate-900">
            ₹{assessment.totalExistingOutstanding.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Across {obligations.length} loan accounts</span>
        </div>

        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 block mb-1">Total Monthly EMI Obligations</span>
          <span className="text-xl font-bold text-slate-900">
            ₹{assessment.totalExistingMonthlyEmi.toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Active recurring monthly debt service</span>
        </div>

        <div className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 block mb-1">Pre-Loan Obligation Burden</span>
          <span className="text-xl font-bold text-indigo-600">
            {assessment.existingObligationRatio.toFixed(2)}%
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Of considered monthly net income</span>
        </div>
      </div>

      {/* 1. Obligations Table */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Existing Liabilities & Loans ({obligations.length})
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Obligation
          </button>
        </div>

        {obligations.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">No existing liabilities recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50 font-semibold">
                  <th className="px-4 py-2.5">Lender & Facility</th>
                  <th className="px-4 py-2.5">Source</th>
                  <th className="px-4 py-2.5">Outstanding Balance</th>
                  <th className="px-4 py-2.5">Monthly EMI</th>
                  <th className="px-4 py-2.5">Tenure Remaining</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">FOIR Inclusion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {obligations.map((ob: ObligationItem, idx: number) => (
                  <tr key={ob.id || idx} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{ob.lenderName}</div>
                      <div className="text-[11px] text-slate-500">{ob.loanType}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          ob.source === 'BUREAU'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : ob.source === 'INTERNAL_LOAN'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {ob.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                      ₹{ob.outstandingAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      ₹{ob.monthlyEmi.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {ob.remainingTenureMonths} Months
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                          ob.isSecured ? 'text-emerald-700' : 'text-slate-500'
                        }`}
                      >
                        {ob.isSecured ? 'Secured' : 'Unsecured'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {ob.isExcludedFromFoir ? (
                        <div>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            EXCLUDED
                          </span>
                          {ob.exclusionReason && (
                            <span className="block text-[10px] text-slate-500 mt-0.5 truncate max-w-[140px]" title={ob.exclusionReason}>
                              {ob.exclusionReason}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] font-medium text-emerald-700">Included in DTI</span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onDeleteObligation && onDeleteObligation(ob.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Remove Obligation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Obligation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase">Add Existing Debt Facility</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">Financial Institution / Bank *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HDFC Bank Ltd"
                    value={lenderName}
                    onChange={(e) => setLenderName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Facility Type *</label>
                  <select
                    value={loanType}
                    onChange={(e) => setLoanType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Personal Loan">Personal Loan</option>
                    <option value="Home Loan">Home Loan</option>
                    <option value="Auto Loan">Auto / Vehicle Loan</option>
                    <option value="Credit Card Outstanding">Credit Card Outstanding</option>
                    <option value="Business Term Loan">Business Term Loan</option>
                    <option value="Education Loan">Education Loan</option>
                    <option value="Gold Loan">Gold Loan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Outstanding Balance (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={outstandingAmount}
                    onChange={(e) => setOutstandingAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Monthly EMI (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={monthlyEmi}
                    onChange={(e) => setMonthlyEmi(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Tenure Remaining (Months)</label>
                  <input
                    type="number"
                    min="1"
                    value={tenureRemainingMonths}
                    onChange={(e) => setTenureRemainingMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">Data Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="BUREAU">Credit Bureau Match</option>
                    <option value="DECLARED">Customer Declared</option>
                    <option value="INTERNAL">Internal LMS Match</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSecured}
                    onChange={(e) => setIsSecured(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-slate-700 font-medium">Secured Facility (Backed by Collateral)</span>
                </label>
              </div>

              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isExcludedFromFoir}
                    onChange={(e) => setIsExcludedFromFoir(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-slate-800 font-bold">Exclude EMI from DTI / FOIR Ratio</span>
                </label>

                {isExcludedFromFoir && (
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">Exclusion Justification</label>
                    <input
                      type="text"
                      placeholder="e.g. Loan scheduled for foreclosure prior to disbursement"
                      value={exclusionReason}
                      onChange={(e) => setExclusionReason(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                )}
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
                  Add Obligation & Recalculate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
