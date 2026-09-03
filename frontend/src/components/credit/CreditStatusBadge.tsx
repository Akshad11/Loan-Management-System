import React from 'react';
import {
  AssessmentStatus,
  CreditRecommendation,
  RuleEvaluationResult,
  RiskSeverity,
  ConditionStatus,
} from '../../types/creditTypes';

interface CreditStatusBadgeProps {
  status?: AssessmentStatus | string;
  recommendation?: CreditRecommendation | string;
  ruleResult?: RuleEvaluationResult | string;
  riskSeverity?: RiskSeverity | string;
  conditionStatus?: ConditionStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const CreditStatusBadge: React.FC<CreditStatusBadgeProps> = ({
  status,
  recommendation,
  ruleResult,
  riskSeverity,
  conditionStatus,
  size = 'md',
  showIcon = true,
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5 font-medium',
  }[size];

  // 1. Assessment Status
  if (status) {
    switch (status) {
      case 'PENDING':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
            {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
            Pending Queue
          </span>
        );
      case 'ASSIGNED':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}>
            {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
            Assigned
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 ${sizeClasses}`}>
            {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />}
            In Assessment
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-purple-50 text-purple-700 border border-purple-200 ${sizeClasses}`}>
            {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />}
            Submitted
          </span>
        );
      case 'DECISIONED':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
            {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            Decisioned
          </span>
        );
      case 'RETURNED':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
            {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
            Returned to Sourcing
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
            {status}
          </span>
        );
    }
  }

  // 2. Credit Recommendation
  if (recommendation) {
    switch (recommendation) {
      case 'RECOMMEND_APPROVE':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-emerald-50 text-emerald-800 border border-emerald-300 ${sizeClasses}`}>
            {showIcon && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
            Recommend Approve
          </span>
        );
      case 'RECOMMEND_REJECT':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-rose-50 text-rose-800 border border-rose-300 ${sizeClasses}`}>
            {showIcon && <span className="w-2 h-2 rounded-full bg-rose-600" />}
            Recommend Reject
          </span>
        );
      case 'RECOMMEND_REFER':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-amber-50 text-amber-800 border border-amber-300 ${sizeClasses}`}>
            {showIcon && <span className="w-2 h-2 rounded-full bg-amber-600" />}
            Recommend Refer
          </span>
        );
      case 'RETURN_FOR_MORE_INFO':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-sky-50 text-sky-800 border border-sky-300 ${sizeClasses}`}>
            {showIcon && <span className="w-2 h-2 rounded-full bg-sky-600" />}
            Return for Info
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
            {recommendation}
          </span>
        );
    }
  }

  // 3. Rule Evaluation Result
  if (ruleResult) {
    switch (ruleResult) {
      case 'PASS':
        return (
          <span className={`inline-flex items-center gap-1 rounded font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
            {showIcon && (
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            )}
            PASS
          </span>
        );
      case 'WARNING':
        return (
          <span className={`inline-flex items-center gap-1 rounded font-medium bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
            {showIcon && (
              <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            WARNING
          </span>
        );
      case 'FAIL':
        return (
          <span className={`inline-flex items-center gap-1 rounded font-medium bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
            {showIcon && (
              <svg className="w-3.5 h-3.5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            FAIL
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center gap-1 rounded font-medium bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}>
            NOT EVALUATED
          </span>
        );
    }
  }

  // 4. Risk Severity
  if (riskSeverity) {
    switch (riskSeverity) {
      case 'LOW':
        return (
          <span className={`inline-flex items-center gap-1 rounded font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
            Low Risk
          </span>
        );
      case 'MEDIUM':
        return (
          <span className={`inline-flex items-center gap-1 rounded font-medium bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
            Medium Risk
          </span>
        );
      case 'HIGH':
        return (
          <span className={`inline-flex items-center gap-1 rounded font-medium bg-orange-50 text-orange-700 border border-orange-200 ${sizeClasses}`}>
            High Risk
          </span>
        );
      case 'CRITICAL':
        return (
          <span className={`inline-flex items-center gap-1 rounded font-medium bg-rose-100 text-rose-800 border border-rose-300 font-semibold ${sizeClasses}`}>
            Critical Risk
          </span>
        );
      default:
        return <span className={`inline-flex items-center rounded font-medium bg-slate-100 text-slate-700 ${sizeClasses}`}>{riskSeverity}</span>;
    }
  }

  // 5. Condition Status
  if (conditionStatus) {
    switch (conditionStatus) {
      case 'OPEN':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Open Covenant
          </span>
        );
      case 'COMPLETED':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Satisfied
          </span>
        );
      case 'WAIVED':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Waived
          </span>
        );
      case 'NOT_APPLICABLE':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses}`}>
            N/A
          </span>
        );
    }
  }

  return null;
};
