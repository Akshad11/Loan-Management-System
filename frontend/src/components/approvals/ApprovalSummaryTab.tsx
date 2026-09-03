import React from 'react';
import { ApprovalRecord } from '../../types/approvalTypes';
import { calculateEmi } from '../../utils/formatters';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  User,
  Shield,
  CreditCard,
  Building,
  TrendingDown,
  TrendingUp,
  Check,
  ChevronRight,
} from 'lucide-react';

interface ApprovalSummaryTabProps {
  approval: ApprovalRecord;
  onNavigateToCreditAssessment?: (caId: string) => void;
  onNavigateToApplication?: (appId: string) => void;
}

export const ApprovalSummaryTab: React.FC<ApprovalSummaryTabProps> = ({
  approval,
  onNavigateToCreditAssessment,
  onNavigateToApplication,
}) => {
  // Compute EMIs
  const requestedEmi = calculateEmi(
    approval.requestedAmount,
    approval.requestedInterestRate,
    approval.requestedTenureMonths
  );
  const recommendedEmi = calculateEmi(
    approval.recommendedAmount,
    approval.recommendedInterestRate,
    approval.recommendedTenureMonths
  );
  const approvedEmi =
    approval.approvedAmount && approval.approvedInterestRate && approval.approvedTenureMonths
      ? calculateEmi(approval.approvedAmount, approval.approvedInterestRate, approval.approvedTenureMonths)
      : null;

  const requestedTotalRepayable = requestedEmi * approval.requestedTenureMonths;
  const recommendedTotalRepayable = recommendedEmi * approval.recommendedTenureMonths;
  const approvedTotalRepayable = approvedEmi ? approvedEmi * (approval.approvedTenureMonths || 0) : null;

  const amountVariance = approval.recommendedAmount - approval.requestedAmount;
  const amountVariancePercent = ((amountVariance / approval.requestedAmount) * 100).toFixed(1);

  return (
    <div className="space-y-6" id="approval-summary-tab">
      {/* 1. Multi-Level Approval Delegation Journey */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Shield className="h-4 w-4 text-indigo-600" />
            Multi-Level Delegation Journey & Authority Matrix
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            {approval.totalLevels} Tier{approval.totalLevels > 1 ? 's' : ''} Required for ₹{approval.recommendedAmount.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {approval.levels.map((lvl, index) => {
            const isCompleted = lvl.status === 'APPROVED';
            const isRejected = lvl.status === 'REJECTED';
            const isCurrent = index === approval.currentLevelIndex && (approval.status === 'IN_REVIEW' || approval.status === 'PENDING' || approval.status === 'ASSIGNED');
            const isPending = lvl.status === 'PENDING' && !isCurrent;

            return (
              <div
                key={lvl.level}
                id={`level-card-${lvl.level}`}
                className={`relative flex flex-col justify-between rounded-lg border p-4 transition-all ${
                  isCompleted
                    ? 'border-emerald-300 bg-emerald-50/40'
                    : isRejected
                    ? 'border-rose-300 bg-rose-50/40'
                    : isCurrent
                    ? 'border-indigo-400 bg-indigo-50/50 shadow-sm ring-1 ring-indigo-400'
                    : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}
              >
                {/* Top header */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold font-mono uppercase tracking-wider text-slate-700">
                      Level {lvl.level}
                    </span>
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-900">
                        <Check className="h-3 w-3" /> Approved
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1 rounded bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-900">
                        <XCircle className="h-3 w-3" /> Rejected
                      </span>
                    )}
                    {isCurrent && (
                      <span className="inline-flex items-center gap-1 rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-900 animate-pulse">
                        <Clock className="h-3 w-3" /> Under Review
                      </span>
                    )}
                    {isPending && (
                      <span className="inline-flex items-center gap-1 rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                        Pending
                      </span>
                    )}
                  </div>

                  <h3 className="mt-2 text-sm font-bold text-slate-900">{lvl.levelName}</h3>
                  <p className="text-xs text-slate-500 font-medium">Required Role: {lvl.requiredRoleName}</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Authority Limit: ₹{lvl.authorityLimit.toLocaleString('en-IN')}
                  </p>
                </div>

                {/* Approver & Decision details */}
                <div className="mt-4 border-t border-slate-200/80 pt-3 text-xs">
                  {lvl.decidedBy ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Decided By:</span>
                        <strong className="text-slate-800">{lvl.decidedBy}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Timestamp:</span>
                        <span className="font-mono text-slate-700">{lvl.decidedAt}</span>
                      </div>
                      {lvl.approvedAmount && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Sanctioned:</span>
                          <span className="font-mono font-bold text-emerald-800">
                            ₹{lvl.approvedAmount.toLocaleString('en-IN')} @ {lvl.approvedInterestRate}%
                          </span>
                        </div>
                      )}
                      {lvl.decisionNotes && (
                        <div className="mt-1.5 rounded bg-white/80 p-2 text-[11px] text-slate-700 border border-slate-200">
                          <strong>Notes:</strong> {lvl.decisionNotes}
                        </div>
                      )}
                    </div>
                  ) : lvl.assignedToName ? (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Assigned To:</span>
                      <strong className="text-indigo-900">{lvl.assignedToName}</strong>
                    </div>
                  ) : (
                    <div className="text-slate-400 italic">Awaiting prior level completion / assignment</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. 3-Way Financial Comparison Table */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              Financial Parameters & Quantum Reconciliation
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparison across Applicant Request, Credit Assessor Recommendation, and Final Sanction Terms.
            </p>
          </div>
          {amountVariance !== 0 && (
            <div
              className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-bold ${
                amountVariance < 0 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
              }`}
            >
              {amountVariance < 0 ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
              <span>
                Assessment Variance: ₹{Math.abs(amountVariance).toLocaleString('en-IN')} ({amountVariancePercent}%)
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm" id="financial-comparison-table">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="py-2.5 px-3">Parameter</th>
                <th className="py-2.5 px-3">Applicant Request</th>
                <th className="py-2.5 px-3">Underwriter Recommended</th>
                <th className="py-2.5 px-3">Variance</th>
                <th className="py-2.5 px-3 bg-indigo-50/60 font-bold text-indigo-950">
                  Final Sanction Terms
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-700">Loan Quantum</td>
                <td className="py-3 px-3 font-mono font-bold text-slate-900">
                  ₹{approval.requestedAmount.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-3 font-mono font-bold text-indigo-900">
                  ₹{approval.recommendedAmount.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-3 font-mono text-xs text-slate-600">
                  {amountVariance === 0 ? (
                    <span className="text-slate-400">Exact Match (₹0)</span>
                  ) : (
                    <span className={amountVariance < 0 ? 'text-amber-700 font-semibold' : 'text-emerald-700 font-semibold'}>
                      {amountVariance < 0 ? '-' : '+'}₹{Math.abs(amountVariance).toLocaleString('en-IN')}
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 bg-indigo-50/30 font-mono font-bold text-slate-900">
                  {approval.approvedAmount ? (
                    <span className="text-emerald-800 font-bold">
                      ₹{approval.approvedAmount.toLocaleString('en-IN')}
                    </span>
                  ) : (
                    <span className="italic text-slate-400">Pending Decision</span>
                  )}
                </td>
              </tr>

              <tr>
                <td className="py-3 px-3 font-semibold text-slate-700">Tenure (Months)</td>
                <td className="py-3 px-3 font-mono">{approval.requestedTenureMonths} Months</td>
                <td className="py-3 px-3 font-mono">{approval.recommendedTenureMonths} Months</td>
                <td className="py-3 px-3 font-mono text-xs text-slate-600">
                  {approval.recommendedTenureMonths - approval.requestedTenureMonths === 0 ? (
                    <span className="text-slate-400">0 Months</span>
                  ) : (
                    <span>{approval.recommendedTenureMonths - approval.requestedTenureMonths} Months</span>
                  )}
                </td>
                <td className="py-3 px-3 bg-indigo-50/30 font-mono">
                  {approval.approvedTenureMonths ? `${approval.approvedTenureMonths} Months` : <span className="italic text-slate-400">—</span>}
                </td>
              </tr>

              <tr>
                <td className="py-3 px-3 font-semibold text-slate-700">Interest Rate (% p.a.)</td>
                <td className="py-3 px-3 font-mono">{approval.requestedInterestRate}%</td>
                <td className="py-3 px-3 font-mono font-semibold text-slate-900">{approval.recommendedInterestRate}%</td>
                <td className="py-3 px-3 font-mono text-xs text-slate-600">
                  {(approval.recommendedInterestRate - approval.requestedInterestRate).toFixed(2)}%
                </td>
                <td className="py-3 px-3 bg-indigo-50/30 font-mono">
                  {approval.approvedInterestRate ? (
                    <span className="text-emerald-800 font-semibold">{approval.approvedInterestRate}%</span>
                  ) : (
                    <span className="italic text-slate-400">—</span>
                  )}
                </td>
              </tr>

              <tr>
                <td className="py-3 px-3 font-semibold text-slate-700">Calculated Monthly EMI</td>
                <td className="py-3 px-3 font-mono text-slate-700">₹{requestedEmi.toLocaleString('en-IN')}</td>
                <td className="py-3 px-3 font-mono font-bold text-indigo-900">
                  ₹{recommendedEmi.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-3 font-mono text-xs text-slate-600">
                  {recommendedEmi - requestedEmi < 0 ? '-' : '+'}₹{Math.abs(recommendedEmi - requestedEmi).toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-3 bg-indigo-50/30 font-mono">
                  {approvedEmi ? (
                    <span className="text-emerald-800 font-bold">₹{approvedEmi.toLocaleString('en-IN')}</span>
                  ) : (
                    <span className="italic text-slate-400">—</span>
                  )}
                </td>
              </tr>

              <tr>
                <td className="py-3 px-3 font-semibold text-slate-700">Total Repayable Value</td>
                <td className="py-3 px-3 font-mono text-slate-500">₹{requestedTotalRepayable.toLocaleString('en-IN')}</td>
                <td className="py-3 px-3 font-mono text-slate-700">₹{recommendedTotalRepayable.toLocaleString('en-IN')}</td>
                <td className="py-3 px-3 font-mono text-xs text-slate-400">—</td>
                <td className="py-3 px-3 bg-indigo-50/30 font-mono">
                  {approvedTotalRepayable ? `₹${approvedTotalRepayable.toLocaleString('en-IN')}` : <span className="italic text-slate-400">—</span>}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Underwriter Assessment Summary & Borrower Profile */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Underwriter Rationale */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" />
                Credit Assessor's Rationale
              </h2>
              {onNavigateToCreditAssessment && approval.creditAssessmentId && (
                <button
                  id="btn-view-credit-assessment"
                  onClick={() => onNavigateToCreditAssessment(approval.creditAssessmentId)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 hover:underline"
                >
                  <span>Open Full Assessment ({approval.creditAssessmentNumber})</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4 text-xs text-slate-800 leading-relaxed font-sans">
              <p className="font-semibold text-slate-900 mb-1">
                Prepared by: {approval.creditAssessorName} (Senior Underwriter)
              </p>
              <p className="text-slate-700 whitespace-pre-wrap">{approval.creditRecommendationNotes}</p>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Assessment Ticket: <strong className="font-mono text-slate-700">{approval.creditAssessmentNumber}</strong></span>
            <span>CIBIL Score: <strong className="font-mono text-slate-800">{approval.creditScore}</strong></span>
          </div>
        </div>

        {/* Linked Application & Borrower Details */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <User className="h-4 w-4 text-slate-600" />
                Borrower & Sourcing Dossier
              </h2>
              {onNavigateToApplication && (
                <button
                  id="btn-view-application"
                  onClick={() => onNavigateToApplication(approval.applicationId)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 hover:underline"
                >
                  <span>View Application ({approval.applicationNumber})</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded border border-slate-200 bg-slate-50 p-3">
                <span className="text-slate-500 block text-[11px] uppercase font-semibold">Borrower Name</span>
                <strong className="text-sm text-slate-900">{approval.customerName}</strong>
                <span className="text-slate-500 block font-mono mt-0.5">ID: {approval.customerNumber}</span>
              </div>

              <div className="rounded border border-slate-200 bg-slate-50 p-3">
                <span className="text-slate-500 block text-[11px] uppercase font-semibold">Originating Branch</span>
                <strong className="text-sm text-slate-900">{approval.branchName}</strong>
                <span className="text-slate-500 block font-mono mt-0.5">Branch ID: {approval.branchId}</span>
              </div>

              <div className="rounded border border-slate-200 bg-slate-50 p-3">
                <span className="text-slate-500 block text-[11px] uppercase font-semibold">Loan Product</span>
                <strong className="text-sm text-slate-900">{approval.productName}</strong>
                <span className="text-slate-500 block font-mono mt-0.5">Code: {approval.productCode}</span>
              </div>

              <div className="rounded border border-slate-200 bg-slate-50 p-3">
                <span className="text-slate-500 block text-[11px] uppercase font-semibold">Risk Classification</span>
                <strong className="text-sm text-slate-900">{approval.riskRating} Risk</strong>
                <span className="text-slate-500 block mt-0.5">Bureau: {approval.creditScore}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Created: <strong className="font-mono text-slate-700">{approval.createdAt}</strong></span>
            <span>Priority: <strong className="uppercase text-slate-700">{approval.priority}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
