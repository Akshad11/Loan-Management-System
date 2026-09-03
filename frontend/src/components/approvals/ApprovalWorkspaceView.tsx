import React, { useState } from 'react';
import {
  ApprovalRecord,
  ApprovalDecisionType,
  ApprovalCondition,
  ApprovalException,
  ConditionStatus,
} from '../../types/approvalTypes';
import { ApprovalHeader } from './ApprovalHeader';
import { ApprovalSummaryTab } from './ApprovalSummaryTab';
import { ApprovalConditionsExceptionsTab } from './ApprovalConditionsExceptionsTab';
import { ApprovalHistoryTab } from './ApprovalHistoryTab';
import { ApprovalDecisionModal } from './ApprovalDecisionModal';
import { ApprovalAssignModal } from './ApprovalAssignModal';
import { ApprovalConditionModal } from './ApprovalConditionModal';
import { ApprovalExceptionModal } from './ApprovalExceptionModal';
import { LayoutDashboard, FileCheck2, History, X } from 'lucide-react';

interface ApprovalWorkspaceViewProps {
  approval: ApprovalRecord;
  approvers: { id: string; name: string; role: string; branchId: string }[];
  onBack: () => void;
  onAssignApproval: (approvalId: string, approverId: string, approverName: string, notes?: string) => void;
  onStartReview: (approvalId: string) => void;
  onMakeDecision: (
    approvalId: string,
    data: {
      decision: ApprovalDecisionType;
      approvedAmount?: number;
      approvedTenureMonths?: number;
      approvedInterestRate?: number;
      deviationReason?: string;
      decisionNotes: string;
      returnReason?: string;
      requiredAction?: string;
      dueDate?: string;
    }
  ) => { success: boolean; message?: string };
  onAddCondition: (
    approvalId: string,
    condition: Omit<ApprovalCondition, 'id' | 'approvalId' | 'addedAt'>
  ) => void;
  onUpdateConditionStatus: (
    conditionId: string,
    status: ConditionStatus,
    resolutionNotes?: string,
    waiverReason?: string
  ) => void;
  onDeleteCondition: (conditionId: string) => void;
  onAddException: (
    approvalId: string,
    exception: Omit<ApprovalException, 'id' | 'approvalId' | 'createdAt' | 'status'>
  ) => void;
  onRouteException: (exceptionId: string, routedToRole: string) => void;
  onResolveException: (exceptionId: string, status: 'APPROVED' | 'REJECTED', decisionNotes: string) => void;
  onNavigateToCreditAssessment?: (caId: string) => void;
  onNavigateToApplication?: (appId: string) => void;
  currentUser?: { name: string; role: string };
}

export const ApprovalWorkspaceView: React.FC<ApprovalWorkspaceViewProps> = ({
  approval,
  approvers,
  onBack,
  onAssignApproval,
  onStartReview,
  onMakeDecision,
  onAddCondition,
  onUpdateConditionStatus,
  onDeleteCondition,
  onAddException,
  onRouteException,
  onResolveException,
  onNavigateToCreditAssessment,
  onNavigateToApplication,
  currentUser = { name: 'Alex Morgan', role: 'Branch Credit Manager' },
}) => {
  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'CONDITIONS' | 'HISTORY'>('SUMMARY');
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState<boolean>(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [isConditionModalOpen, setIsConditionModalOpen] = useState<boolean>(false);
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState<boolean>(false);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const openConditionsCount = (approval.conditions || []).filter((c) => c.status === 'OPEN').length;
  const pendingExceptionsCount = (approval.exceptions || []).filter(
    (e) => e.status === 'PENDING' || e.status === 'SUBMITTED'
  ).length;

  const handleDecisionSubmit = (data: {
    decision: ApprovalDecisionType;
    approvedAmount?: number;
    approvedTenureMonths?: number;
    approvedInterestRate?: number;
    deviationReason?: string;
    decisionNotes: string;
    returnReason?: string;
    requiredAction?: string;
    dueDate?: string;
  }) => {
    const res = onMakeDecision(approval.id, data);
    if (res.success) {
      setNotification({
        type: 'success',
        text: `Decision '${data.decision}' recorded successfully for Level ${approval.currentLevelIndex + 1}.`,
      });
    } else {
      setNotification({
        type: 'error',
        text: res.message || 'Failed to record decision.',
      });
    }
    return res;
  };

  const handleAssignSubmit = (approverId: string, approverName: string, notes?: string) => {
    onAssignApproval(approval.id, approverId, approverName, notes);
    setNotification({
      type: 'success',
      text: `Assigned case to ${approverName}.`,
    });
  };

  const handleExportDossier = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="approval-workspace-view">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`rounded-md p-3.5 text-xs flex items-center justify-between shadow-sm ${
            notification.type === 'success'
              ? 'border border-emerald-300 bg-emerald-50 text-emerald-950'
              : 'border border-rose-300 bg-rose-50 text-rose-950'
          }`}
        >
          <span className="font-semibold">{notification.text}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Workspace Header */}
      <ApprovalHeader
        approval={approval}
        onBack={onBack}
        onOpenAssignModal={() => setIsAssignModalOpen(true)}
        onOpenDecisionModal={() => setIsDecisionModalOpen(true)}
        onOpenConditionModal={() => setIsConditionModalOpen(true)}
        onOpenExceptionModal={() => setIsExceptionModalOpen(true)}
        onExport={handleExportDossier}
        userRole={currentUser.role}
        userName={currentUser.name}
      />

      {/* Workspace Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-2 rounded-t-lg">
        <button
          id="tab-approval-summary"
          onClick={() => setActiveTab('SUMMARY')}
          className={`inline-flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition-colors ${
            activeTab === 'SUMMARY'
              ? 'border-indigo-700 text-indigo-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Sanction Summary & Financials</span>
        </button>

        <button
          id="tab-approval-conditions"
          onClick={() => setActiveTab('CONDITIONS')}
          className={`inline-flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition-colors ${
            activeTab === 'CONDITIONS'
              ? 'border-indigo-700 text-indigo-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck2 className="h-4 w-4" />
          <span>Conditions & Exceptions</span>
          {(openConditionsCount > 0 || pendingExceptionsCount > 0) && (
            <span className="rounded-full bg-amber-100 px-2 py-0.2 text-[10px] font-bold text-amber-900">
              {openConditionsCount + pendingExceptionsCount}
            </span>
          )}
        </button>

        <button
          id="tab-approval-history"
          onClick={() => setActiveTab('HISTORY')}
          className={`inline-flex items-center gap-2 border-b-2 py-3 px-4 text-xs font-bold transition-colors ${
            activeTab === 'HISTORY'
              ? 'border-indigo-700 text-indigo-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Audit Trail & Decision Versions ({approval.versions?.length || 0})</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'SUMMARY' && (
          <ApprovalSummaryTab
            approval={approval}
            onNavigateToCreditAssessment={onNavigateToCreditAssessment}
            onNavigateToApplication={onNavigateToApplication}
          />
        )}

        {activeTab === 'CONDITIONS' && (
          <ApprovalConditionsExceptionsTab
            approval={approval}
            onOpenConditionModal={() => setIsConditionModalOpen(true)}
            onOpenExceptionModal={() => setIsExceptionModalOpen(true)}
            onUpdateConditionStatus={onUpdateConditionStatus}
            onDeleteCondition={onDeleteCondition}
            onRouteException={onRouteException}
            onResolveException={onResolveException}
            userRole={currentUser.role}
            userName={currentUser.name}
          />
        )}

        {activeTab === 'HISTORY' && (
          <ApprovalHistoryTab approval={approval} onExportAudit={handleExportDossier} />
        )}
      </div>

      {/* Modals */}
      <ApprovalDecisionModal
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        approval={approval}
        onSubmitDecision={handleDecisionSubmit}
        currentUserName={currentUser.name}
        currentUserRole={currentUser.role}
      />

      <ApprovalAssignModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        approval={approval}
        approvers={approvers}
        onAssign={handleAssignSubmit}
      />

      <ApprovalConditionModal
        isOpen={isConditionModalOpen}
        onClose={() => setIsConditionModalOpen(false)}
        approvalId={approval.id}
        onAddCondition={(condition) => {
          onAddCondition(approval.id, condition);
          setNotification({ type: 'success', text: 'Sanction covenant added successfully.' });
        }}
      />

      <ApprovalExceptionModal
        isOpen={isExceptionModalOpen}
        onClose={() => setIsExceptionModalOpen(false)}
        approvalId={approval.id}
        onAddException={(exception) => {
          onAddException(approval.id, exception);
          setNotification({ type: 'success', text: 'Policy exception request submitted.' });
        }}
        currentUserName={currentUser.name}
      />
    </div>
  );
};
