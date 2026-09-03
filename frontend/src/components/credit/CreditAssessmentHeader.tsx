import React from 'react';
import { CreditAssessmentRecord } from '../../types/creditTypes';
import { CreditStatusBadge } from './CreditStatusBadge';
import {
  ArrowLeft,
  Play,
  RotateCcw,
  CheckCircle,
  FileText,
  UserCheck,
  History,
  AlertOctagon,
} from 'lucide-react';

interface CreditAssessmentHeaderProps {
  assessment: CreditAssessmentRecord;
  onBack: () => void;
  onStartAssessment?: () => void;
  onEvaluateRules?: () => void;
  onOpenReturnModal?: () => void;
  onOpenSubmitDecisionTab?: () => void;
  onOpenVersionHistory?: () => void;
  onOpenAssignModal?: () => void;
  canEdit?: boolean;
}

export const CreditAssessmentHeader: React.FC<CreditAssessmentHeaderProps> = ({
  assessment,
  onBack,
  onStartAssessment,
  onEvaluateRules,
  onOpenReturnModal,
  onOpenSubmitDecisionTab,
  onOpenVersionHistory,
  onOpenAssignModal,
  canEdit = true,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-5">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left Section: Back link, Assessment title, IDs, badges */}
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Credit Assessment Queue
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {assessment.customerName}
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200">
              {assessment.assessmentNumber}
            </span>
            <span className="font-mono text-xs text-slate-500">
              (App: {assessment.applicationNumber})
            </span>
            <CreditStatusBadge status={assessment.status} size="md" />
            {assessment.recommendation && assessment.status !== 'PENDING' && (
              <CreditStatusBadge recommendation={assessment.recommendation} size="md" />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 mt-2">
            <span>Product: <strong className="text-slate-700 font-medium">{assessment.productName}</strong></span>
            <span>•</span>
            <span>Branch: <strong className="text-slate-700 font-medium">{assessment.branchName}</strong></span>
            <span>•</span>
            <span>Requested: <strong className="text-slate-900 font-semibold">₹{assessment.requestedAmount.toLocaleString('en-IN')}</strong> for {assessment.requestedTenureMonths}m</span>
            <span>•</span>
            <span>
              Assigned To:{' '}
              <strong className="text-slate-800 font-medium">
                {assessment.assignedToName || 'Unassigned'}
              </strong>
            </span>
            {assessment.currentVersion && assessment.currentVersion > 1 && (
              <>
                <span>•</span>
                <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-mono font-medium text-[11px]">
                  v{assessment.currentVersion}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right Section: Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Version History Button */}
          {assessment.versions && assessment.versions.length > 0 && onOpenVersionHistory && (
            <button
              onClick={onOpenVersionHistory}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-sm"
              title="View Underwriter Version Snapshots"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              Versions ({assessment.versions.length})
            </button>
          )}

          {/* Re-assign Officer Button */}
          {onOpenAssignModal && (
            <button
              onClick={onOpenAssignModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-sm"
            >
              <UserCheck className="w-3.5 h-3.5 text-slate-500" />
              {assessment.assignedToName ? 'Reassign' : 'Assign Officer'}
            </button>
          )}

          {/* Start Assessment (if in PENDING or ASSIGNED state) */}
          {canEdit && (assessment.status === 'PENDING' || assessment.status === 'ASSIGNED') && onStartAssessment && (
            <button
              onClick={onStartAssessment}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Play className="w-3.5 h-3.5" />
              Start Underwriting
            </button>
          )}

          {/* Return to Sourcing Button */}
          {canEdit && assessment.status !== 'RETURNED' && assessment.status !== 'DECISIONED' && onOpenReturnModal && (
            <button
              onClick={onOpenReturnModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded hover:bg-rose-100 transition-colors shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Return to Sourcing
            </button>
          )}

          {/* Submit Decision Recommendation Button */}
          {canEdit && assessment.status !== 'DECISIONED' && onOpenSubmitDecisionTab && (
            <button
              onClick={onOpenSubmitDecisionTab}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Credit Decision
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
