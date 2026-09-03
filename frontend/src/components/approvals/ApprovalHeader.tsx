import React from 'react';
import { ApprovalRecord } from '../../types/approvalTypes';
import { ApprovalStatusBadge } from './ApprovalStatusBadge';
import {
  ArrowLeft,
  UserCheck,
  PlusCircle,
  AlertOctagon,
  FileCheck,
  Clock,
  Printer,
  Shield,
  Building,
  User,
  Phone,
} from 'lucide-react';

interface ApprovalHeaderProps {
  approval: ApprovalRecord;
  onBack: () => void;
  onOpenAssignModal: () => void;
  onOpenDecisionModal: () => void;
  onOpenConditionModal: () => void;
  onOpenExceptionModal: () => void;
  onExport: () => void;
  userRole?: string;
  userName?: string;
}

export const ApprovalHeader: React.FC<ApprovalHeaderProps> = ({
  approval,
  onBack,
  onOpenAssignModal,
  onOpenDecisionModal,
  onOpenConditionModal,
  onOpenExceptionModal,
  onExport,
  userRole = '',
  userName = '',
}) => {
  const currentLevelExecution = approval.levels[approval.currentLevelIndex];
  const isFinalDecisionMade = approval.status === 'APPROVED' || approval.status === 'REJECTED';

  // Check SoD
  const isAssessor =
    userName &&
    approval.creditAssessorName &&
    userName.toLowerCase().trim() === approval.creditAssessorName.toLowerCase().trim();

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" id="approval-workspace-header">
      {/* Top row: Back button & Breadcrumbs & Action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <button
            id="btn-back-to-approvals-queue"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Approval Queue</span>
          </button>
          <div className="h-4 w-px bg-slate-300" />
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-mono font-medium text-slate-700">{approval.approvalNumber}</span>
            <span>/</span>
            <span className="font-mono text-slate-500">{approval.applicationNumber}</span>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-export-dossier"
            onClick={onExport}
            className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Export Dossier</span>
          </button>

          {!isFinalDecisionMade && (
            <>
              <button
                id="btn-add-condition-header"
                onClick={onOpenConditionModal}
                className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none"
              >
                <PlusCircle className="h-3.5 w-3.5 text-slate-500" />
                <span>Add Covenant</span>
              </button>

              <button
                id="btn-request-exception-header"
                onClick={onOpenExceptionModal}
                className="inline-flex items-center gap-1.5 rounded border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 focus:outline-none"
              >
                <AlertOctagon className="h-3.5 w-3.5 text-amber-700" />
                <span>Request Exception</span>
              </button>

              <button
                id="btn-assign-header"
                onClick={onOpenAssignModal}
                className="inline-flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none"
              >
                <UserCheck className="h-3.5 w-3.5 text-slate-600" />
                <span>{approval.assignedToName ? 'Reassign Approver' : 'Assign Approver'}</span>
              </button>

              <button
                id="btn-decide-header"
                onClick={onOpenDecisionModal}
                className="inline-flex items-center gap-1.5 rounded bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <FileCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Record Decision</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* SoD Warning Banner if user is the assessor */}
      {isAssessor && !isFinalDecisionMade && (
        <div className="mt-3 rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 flex items-center gap-2">
          <AlertOctagon className="h-4 w-4 text-amber-700 flex-shrink-0" />
          <span>
            <strong>Segregation of Duties (SoD) Active:</strong> You prepared this credit assessment ({approval.creditAssessorName}). Under RBI governance policies, you cannot record an approval decision for your own assessed file.
          </span>
        </div>
      )}

      {/* Main Title & Key Parameters */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">{approval.customerName}</h1>
            <ApprovalStatusBadge status={approval.status} size="md" />
            <span className="inline-flex items-center rounded bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-800 uppercase tracking-wider">
              {approval.productName} ({approval.productCode})
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span>Customer ID: <strong className="font-mono text-slate-800">{approval.customerNumber}</strong></span>
            </div>
            {approval.customerMobile && (
              <div className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-mono">{approval.customerMobile}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Building className="h-3.5 w-3.5 text-slate-400" />
              <span>Branch: <strong>{approval.branchName}</strong></span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5 text-slate-400" />
              <span>Bureau Score: <strong className="font-mono">{approval.creditScore}</strong> ({approval.riskRating} Risk)</span>
            </div>
          </div>
        </div>

        {/* Right side stats: Delegation Tier & Quantum */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Current Level Box */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-right">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Delegation Tier
            </div>
            <div className="text-sm font-bold text-slate-900">
              Level {approval.currentLevelIndex + 1} of {approval.totalLevels}
            </div>
            <div className="text-xs text-slate-600 truncate max-w-[200px]" title={currentLevelExecution?.levelName}>
              {currentLevelExecution?.levelName}
            </div>
          </div>

          {/* Recommended Quantum Box */}
          <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 text-right">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700">
              Recommended Amount
            </div>
            <div className="text-base font-bold font-mono text-indigo-950">
              ₹{approval.recommendedAmount.toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-indigo-800">
              {approval.recommendedTenureMonths}m @ {approval.recommendedInterestRate}% p.a.
            </div>
          </div>

          {/* Approved Quantum Box if Approved */}
          {approval.status === 'APPROVED' && approval.approvedAmount && (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-right">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                Sanctioned Amount
              </div>
              <div className="text-base font-bold font-mono text-emerald-950">
                ₹{approval.approvedAmount.toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-emerald-800">
                {approval.approvedTenureMonths}m @ {approval.approvedInterestRate}% p.a.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom info bar: Assigned Approver, SLA, and Assessor */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            Assigned Approver:{' '}
            <strong className="text-slate-800">
              {approval.assignedToName || 'Unassigned'}
            </strong>
          </div>
          <div>
            Credit Assessor:{' '}
            <strong className="text-slate-800">{approval.creditAssessorName}</strong>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>Age: <strong>{approval.ageDays} days</strong></span>
          </div>
          {approval.isSlaBreached ? (
            <span className="rounded bg-rose-100 px-2 py-0.5 font-bold text-rose-900">
              SLA Breached
            </span>
          ) : (
            <span className="rounded bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-900">
              Within SLA Target
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
