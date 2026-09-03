import React from 'react';
import { CreditAssessmentRecord } from '../../types/creditTypes';
import { CreditStatusBadge } from './CreditStatusBadge';
import { AlertTriangle, TrendingUp, ShieldCheck, CreditCard, DollarSign } from 'lucide-react';

interface CreditAssessmentSummaryBannerProps {
  assessment: CreditAssessmentRecord;
}

export const CreditAssessmentSummaryBanner: React.FC<CreditAssessmentSummaryBannerProps> = ({
  assessment,
}) => {
  const foir = assessment.postApplicationObligationRatio || 0;
  const isHighFoir = foir > 50;
  const isCriticalFoir = foir > 60;
  const bureauScore = assessment.creditHistory?.bureauScore || 0;

  const foirColor = isCriticalFoir
    ? 'text-rose-700 bg-rose-50 border-rose-200'
    : isHighFoir
    ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-emerald-700 bg-emerald-50 border-emerald-200';

  const foirBarColor = isCriticalFoir
    ? 'bg-rose-500'
    : isHighFoir
    ? 'bg-amber-500'
    : 'bg-emerald-500';

  return (
    <div className="bg-slate-900 text-slate-100 rounded-lg p-5 border border-slate-800 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
        {/* Metric 1: Monthly Net Income */}
        <div className="pt-3 lg:pt-0 lg:pr-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
            Considered Net Income
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            ₹{assessment.totalConsideredIncome.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <span>Gross: ₹{assessment.monthlyGrossIncome.toLocaleString('en-IN')}</span>
            {assessment.otherMonthlyIncome > 0 && (
              <span className="text-emerald-400">(+₹{assessment.otherMonthlyIncome.toLocaleString('en-IN')} other)</span>
            )}
          </div>
        </div>

        {/* Metric 2: Existing Obligations */}
        <div className="pt-3 lg:pt-0 lg:px-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">
            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
            Existing Monthly EMI
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            ₹{assessment.totalExistingMonthlyEmi.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Pre-loan FOIR: <span className="font-semibold text-slate-200">{assessment.existingObligationRatio.toFixed(1)}%</span>
            <span className="text-slate-500 ml-1">({assessment.obligations?.length || 0} active loans)</span>
          </div>
        </div>

        {/* Metric 3: Proposed Loan & EMI */}
        <div className="pt-3 lg:pt-0 lg:px-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
            Proposed Loan EMI
          </div>
          <div className="text-xl font-bold text-sky-400 tracking-tight">
            ₹{assessment.proposedEmi.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            For ₹{(assessment.recommendedAmount || assessment.requestedAmount).toLocaleString('en-IN')} @{' '}
            {assessment.recommendedInterestRate || assessment.requestedInterestRate}%
          </div>
        </div>

        {/* Metric 4: Post-Loan FOIR / DTI with Bar */}
        <div className="pt-3 lg:pt-0 lg:px-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">
            <span className="flex items-center gap-1.5">
              Total FOIR / DTI
              {isHighFoir && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
            </span>
            <span className="text-[11px] text-slate-400">Ceiling: 50%</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {foir.toFixed(2)}%
            </span>
            <span className={`text-xs px-2 py-0.5 rounded border font-medium ${foirColor}`}>
              {foir <= 50 ? 'Within Cap' : foir <= 60 ? 'Policy Breach' : 'Severe Breach'}
            </span>
          </div>
          {/* Visual Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-1.5 rounded-full ${foirBarColor}`}
              style={{ width: `${Math.min(foir, 100)}%` }}
            />
          </div>
        </div>

        {/* Metric 5: Credit Bureau Score */}
        <div className="pt-3 lg:pt-0 lg:pl-4">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Credit Bureau Score
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {bureauScore > 0 ? bureauScore : 'N/A'}
            </span>
            {bureauScore > 0 && (
              <span
                className={`text-xs px-2 py-0.5 rounded border font-medium ${
                  bureauScore >= 750
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : bureauScore >= 680
                    ? 'text-blue-700 bg-blue-50 border-blue-200'
                    : 'text-rose-700 bg-rose-50 border-rose-200'
                }`}
              >
                {assessment.creditHistory?.scoreBand || 'SCORE'}
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {assessment.creditHistory?.bureauName || 'Bureau Assessment'}
          </div>
        </div>
      </div>
    </div>
  );
};
