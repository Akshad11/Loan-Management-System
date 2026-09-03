import React, { useState } from 'react';
import {
  CreditAssessmentRecord,
  CreditRecommendation,
} from '../../types/creditTypes';
import { CreditStatusBadge } from './CreditStatusBadge';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  RotateCcw,
  ShieldCheck,
  Send,
  HelpCircle,
  Info,
} from 'lucide-react';

interface DecisionPanelTabProps {
  assessment: CreditAssessmentRecord;
  onSubmitRecommendation?: (data: {
    recommendation: CreditRecommendation;
    recommendedAmount: number;
    recommendedTenureMonths: number;
    recommendedInterestRate: number;
    recommendationNotes: string;
    underwriterNotes: string;
    changeReason?: string;
  }) => void;
  canEdit?: boolean;
}

export const DecisionPanelTab: React.FC<DecisionPanelTabProps> = ({
  assessment,
  onSubmitRecommendation,
  canEdit = true,
}) => {
  const [recommendation, setRecommendation] = useState<CreditRecommendation>(
    assessment.recommendation || 'RECOMMEND_APPROVE'
  );
  const [amount, setAmount] = useState<number>(
    assessment.recommendedAmount || assessment.requestedAmount
  );
  const [tenure, setTenure] = useState<number>(
    assessment.recommendedTenureMonths || assessment.requestedTenureMonths
  );
  const [rate, setRate] = useState<number>(
    assessment.recommendedInterestRate || assessment.requestedInterestRate
  );
  const [recommendationNotes, setRecommendationNotes] = useState<string>(
    assessment.recommendationNotes || ''
  );
  const [underwriterNotes, setUnderwriterNotes] = useState<string>(
    assessment.underwriterNotes || ''
  );
  const [changeReason, setChangeReason] = useState<string>(
    assessment.decisionChangeReason || ''
  );
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Calculate live proposed EMI and live FOIR
  const calculateLiveEMI = (p: number, rPct: number, tMos: number) => {
    if (tMos <= 0 || p <= 0) return 0;
    const r = rPct / 100 / 12;
    if (r === 0) return Math.round(p / tMos);
    const emi = (p * r * Math.pow(1 + r, tMos)) / (Math.pow(1 + r, tMos) - 1);
    return Math.round(emi);
  };

  const liveProposedEmi = calculateLiveEMI(amount, rate, tenure);
  const liveTotalEmi = (assessment.totalExistingMonthlyEmi || 0) + liveProposedEmi;
  const liveFoir = Number(
    ((liveTotalEmi / (assessment.totalConsideredIncome || 1)) * 100).toFixed(2)
  );

  const hasFailedBlockingRules = (assessment.rules || []).some(
    (r) => r.result === 'FAIL' && r.isBlockingApproval
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recommendationNotes.trim()) {
      alert('Please provide detailed recommendation justification notes.');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = () => {
    if (onSubmitRecommendation) {
      onSubmitRecommendation({
        recommendation,
        recommendedAmount: Number(amount),
        recommendedTenureMonths: Number(tenure),
        recommendedInterestRate: Number(rate),
        recommendationNotes,
        underwriterNotes,
        changeReason: changeReason || undefined,
      });
    }
    setShowConfirmModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Policy Gate Check Warning */}
      {hasFailedBlockingRules && recommendation === 'RECOMMEND_APPROVE' && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-300 flex items-start gap-3 text-xs text-rose-800">
          <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
          <div>
            <strong className="font-bold block">Hard Policy Failure Alert</strong>
            One or more mandatory policy evaluation rules have failed. If recommending approval, you must clearly document deviation rationale in the notes.
          </div>
        </div>
      )}

      {/* Decision Card Form */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="pb-4 mb-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Underwriting Decision & Sanction Terms Formulation
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit formal underwriter recommendation to Sanction Authority / Credit Committee.
            </p>
          </div>
          <CreditStatusBadge recommendation={recommendation} size="md" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* 1. Recommendation Category Selector */}
          <div>
            <label className="block text-slate-800 font-bold mb-2">
              Decision Recommendation *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Option 1: Approve */}
              <label
                className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  recommendation === 'RECOMMEND_APPROVE'
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs uppercase">Recommend Approve</span>
                  <input
                    type="radio"
                    name="decisionRec"
                    value="RECOMMEND_APPROVE"
                    checked={recommendation === 'RECOMMEND_APPROVE'}
                    onChange={() => setRecommendation('RECOMMEND_APPROVE')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-normal">
                  Satisfies credit parameters; proposed for sanctioning.
                </p>
              </label>

              {/* Option 2: Refer */}
              <label
                className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  recommendation === 'RECOMMEND_REFER'
                    ? 'border-amber-500 bg-amber-50/50 text-amber-950 font-bold'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs uppercase">Recommend Refer</span>
                  <input
                    type="radio"
                    name="decisionRec"
                    value="RECOMMEND_REFER"
                    checked={recommendation === 'RECOMMEND_REFER'}
                    onChange={() => setRecommendation('RECOMMEND_REFER')}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-normal">
                  Requires higher-tier delegation or risk committee approval.
                </p>
              </label>

              {/* Option 3: Reject */}
              <label
                className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  recommendation === 'RECOMMEND_REJECT'
                    ? 'border-rose-600 bg-rose-50/50 text-rose-950 font-bold'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs uppercase">Recommend Reject</span>
                  <input
                    type="radio"
                    name="decisionRec"
                    value="RECOMMEND_REJECT"
                    checked={recommendation === 'RECOMMEND_REJECT'}
                    onChange={() => setRecommendation('RECOMMEND_REJECT')}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-normal">
                  Unacceptable risk or severe credit policy breach.
                </p>
              </label>

              {/* Option 4: Return for info */}
              <label
                className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  recommendation === 'RETURN_FOR_MORE_INFO'
                    ? 'border-sky-500 bg-sky-50/50 text-sky-950 font-bold'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs uppercase">Return For Info</span>
                  <input
                    type="radio"
                    name="decisionRec"
                    value="RETURN_FOR_MORE_INFO"
                    checked={recommendation === 'RETURN_FOR_MORE_INFO'}
                    onChange={() => setRecommendation('RETURN_FOR_MORE_INFO')}
                    className="text-sky-600 focus:ring-sky-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 font-normal">
                  Send back to sourcing branch with actionable queries.
                </p>
              </label>
            </div>
          </div>

          {/* 2. Recommended Loan Parameters & Real-Time Calculations */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-900 uppercase">
              Sanction Terms & Financial Calibration
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Recommended Loan Quantum (₹) *
                </label>
                <input
                  type="number"
                  min="10000"
                  step="5000"
                  required
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 font-bold text-sm"
                />
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Requested: ₹{assessment.requestedAmount.toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Tenure (Months) *
                </label>
                <input
                  type="number"
                  min="6"
                  max="360"
                  required
                  value={tenure}
                  onChange={(e) => setTenure(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 font-bold text-sm"
                />
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Requested: {assessment.requestedTenureMonths} Months
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Interest Rate (% p.a.) *
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="1"
                  max="40"
                  required
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 font-bold text-sm"
                />
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Base Product Rate: {assessment.requestedInterestRate}%
                </span>
              </div>
            </div>

            {/* Calculated Output Live Strip */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-200">
              <div className="p-3 bg-white rounded border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Proposed Monthly EMI</span>
                <span className="text-base font-bold text-indigo-700">
                  ₹{liveProposedEmi.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3 bg-white rounded border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Total Post-Loan Monthly Debt</span>
                <span className="text-base font-bold text-slate-900">
                  ₹{liveTotalEmi.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3 bg-white rounded border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Post-Sanction FOIR / DTI</span>
                <div className="flex items-center gap-2">
                  <span className={`text-base font-bold ${liveFoir > 50 ? 'text-amber-600' : 'text-emerald-700'}`}>
                    {liveFoir.toFixed(2)}%
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {liveFoir <= 50 ? '(Within 50% Cap)' : '(Policy Deviation)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Underwriter Recommendation Rationale */}
          <div>
            <label className="block text-slate-800 font-bold mb-1">
              Sanction / Recommendation Rationale (Formal Audit Record) *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Detail debt-service capacity, banking stability, score strength, collateral viability, and mitigants for any policy deviations..."
              value={recommendationNotes}
              onChange={(e) => setRecommendationNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* 4. Internal Underwriter Notes */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Internal Underwriter & Verification Comments (Confidential)
            </label>
            <textarea
              rows={2}
              placeholder="Internal underwriting remarks, investigation details, or cross-branch intelligence..."
              value={underwriterNotes}
              onChange={(e) => setUnderwriterNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* 5. Change Reason if modifying existing recommendation */}
          {assessment.currentVersion && assessment.currentVersion > 0 && (
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Version Modification Reason (Snapshot v{(assessment.currentVersion || 0) + 1})
              </label>
              <input
                type="text"
                placeholder="e.g. Recalibrated loan amount post updated banking turnover statement."
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Submit Action */}
          {canEdit && (
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm text-xs"
              >
                <Send className="w-4 h-4" />
                Submit Formal Credit Recommendation
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-6 text-xs">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase">
                Confirm Credit Recommendation Submission
              </h3>
            </div>

            <div className="space-y-3 text-slate-700">
              <p>
                You are about to submit the following credit underwriter appraisal for{' '}
                <strong>{assessment.customerName}</strong> ({assessment.assessmentNumber}):
              </p>

              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1.5 font-medium">
                <div className="flex justify-between">
                  <span>Recommendation:</span>
                  <strong className="text-slate-900">{recommendation}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Recommended Quantum:</span>
                  <strong className="text-slate-900">₹{amount.toLocaleString('en-IN')}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Tenure & Rate:</span>
                  <strong className="text-slate-900">{tenure} Mos @ {rate}%</strong>
                </div>
                <div className="flex justify-between">
                  <span>Proposed FOIR:</span>
                  <strong className="text-slate-900">{liveFoir.toFixed(2)}%</strong>
                </div>
              </div>

              <p className="text-slate-500 text-[11px]">
                This will increment the assessment snapshot version and progress application{' '}
                <strong>{assessment.applicationNumber}</strong> to the Sanction Committee review queue.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-3 py-2 text-slate-600 hover:text-slate-800 font-medium"
              >
                Review Again
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="px-4 py-2 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-700 transition-colors shadow-sm"
              >
                Confirm & Submit Recommendation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
