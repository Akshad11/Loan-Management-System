import React, { useState, useMemo } from 'react';
import {
  ApprovalRecord,
  ApprovalFilterState,
  ApprovalSortState,
  ApprovalStatus,
  ApprovalPriority,
} from '../../types/approvalTypes';
import { ApprovalQueueKPIs } from './ApprovalQueueKPIs';
import { ApprovalQueueFilters } from './ApprovalQueueFilters';
import { ApprovalQueueTable } from './ApprovalQueueTable';
import { ApprovalAssignModal } from './ApprovalAssignModal';
import { ApprovalMatrixView } from './ApprovalMatrixView';
import { useMockLMSStore } from '../../services/mockService';
import { useAuth } from '../../services/authContext';
import { Shield, CheckSquare, Layers, UserCheck, RefreshCw, Plus, X } from 'lucide-react';

interface ApprovalsQueueViewProps {
  onSelectApproval: (approvalId: string) => void;
  onNavigateToCreditAssessment?: (caId: string) => void;
  onNavigateToApplication?: (appId: string) => void;
}

export const ApprovalsQueueView: React.FC<ApprovalsQueueViewProps> = ({
  onSelectApproval,
  onNavigateToCreditAssessment,
  onNavigateToApplication,
}) => {
  const {
    approvals,
    approvalMatrixRules,
    approvalMatrixAudits,
    creditAssessments,
    branches,
    assignApproval,
    startApprovalReview,
    addApprovalMatrixRule,
    updateApprovalMatrixRule,
    toggleApprovalMatrixRuleActive,
    deleteApprovalMatrixRule,
    createApprovalFromCreditAssessment,
  } = useMockLMSStore();
  const { user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'QUEUE' | 'MATRIX'>('QUEUE');

  // Filters
  const [filters, setFilters] = useState<ApprovalFilterState>({
    status: 'ALL',
    level: 'ALL',
    assignedToId: 'ALL',
    productCode: 'ALL',
    branchId: 'ALL',
    priority: 'ALL',
    slaStatus: 'ALL',
    searchQuery: '',
    dateRange: { start: '', end: '' },
    minAmount: undefined,
    maxAmount: undefined,
  });

  // Sort
  const [sort, setSort] = useState<ApprovalSortState>({
    column: 'createdAt',
    direction: 'desc',
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [assigningSingleApproval, setAssigningSingleApproval] = useState<ApprovalRecord | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // List of mock approvers from branches/roles
  const mockApprovers = useMemo(
    () => [
      { id: 'usr_approver_1', name: 'Alex Morgan', role: 'Branch Credit Manager', branchId: 'BR-001' },
      { id: 'usr_approver_2', name: 'Rohan Sharma', role: 'Regional Credit Manager', branchId: 'BR-002' },
      { id: 'usr_approver_3', name: 'Priya Sundaram', role: 'National Sanction Committee', branchId: 'BR-001' },
      { id: 'usr_approver_4', name: 'Sanjay Deshmukh', role: 'Chief Risk Officer', branchId: 'BR-003' },
    ],
    []
  );

  // Filter logic
  const filteredApprovals = useMemo(() => {
    return approvals.filter((appr) => {
      if (filters.status !== 'ALL' && appr.status !== filters.status) return false;
      if (filters.level !== 'ALL' && appr.currentLevelIndex + 1 !== Number(filters.level)) return false;
      if (filters.assignedToId !== 'ALL') {
        if (filters.assignedToId === 'UNASSIGNED' && appr.assignedToId) return false;
        if (filters.assignedToId !== 'UNASSIGNED' && appr.assignedToId !== filters.assignedToId) return false;
      }
      if (filters.productCode !== 'ALL' && appr.productCode !== filters.productCode) return false;
      if (filters.branchId !== 'ALL' && appr.branchId !== filters.branchId) return false;
      if (filters.priority !== 'ALL' && appr.priority !== filters.priority) return false;
      if (filters.slaStatus !== 'ALL') {
        if (filters.slaStatus === 'BREACHED' && !appr.isSlaBreached) return false;
        if (filters.slaStatus === 'ON_TRACK' && appr.isSlaBreached) return false;
      }
      if (filters.minAmount !== undefined && appr.recommendedAmount < filters.minAmount) return false;
      if (filters.maxAmount !== undefined && appr.recommendedAmount > filters.maxAmount) return false;

      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase().trim();
        const matchNumber = appr.approvalNumber.toLowerCase().includes(q);
        const matchApp = appr.applicationNumber.toLowerCase().includes(q);
        const matchCustomer = appr.customerName.toLowerCase().includes(q);
        const matchAssessor = appr.creditAssessorName.toLowerCase().includes(q);
        const matchApprover = (appr.assignedToName || '').toLowerCase().includes(q);
        if (!matchNumber && !matchApp && !matchCustomer && !matchAssessor && !matchApprover) return false;
      }

      return true;
    });
  }, [approvals, filters]);

  // Sort logic
  const sortedApprovals = useMemo(() => {
    return [...filteredApprovals].sort((a, b) => {
      let valA: any = a[sort.column as keyof ApprovalRecord];
      let valB: any = b[sort.column as keyof ApprovalRecord];

      if (sort.column === 'currentLevelIndex') {
        valA = a.currentLevelIndex;
        valB = b.currentLevelIndex;
      }

      if (typeof valA === 'string') {
        return sort.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (typeof valA === 'number') {
        return sort.direction === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });
  }, [filteredApprovals, sort]);

  // Pagination logic
  const paginatedApprovals = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedApprovals.slice(start, start + pageSize);
  }, [sortedApprovals, currentPage, pageSize]);

  const handleSort = (column: keyof ApprovalRecord) => {
    setSort((prev) => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      status: 'ALL',
      level: 'ALL',
      assignedToId: 'ALL',
      productCode: 'ALL',
      branchId: 'ALL',
      priority: 'ALL',
      slaStatus: 'ALL',
      searchQuery: '',
      dateRange: { start: '', end: '' },
      minAmount: undefined,
      maxAmount: undefined,
    });
    setCurrentPage(1);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedApprovals.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedApprovals.map((a) => a.id));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenAssignSingle = (approval: ApprovalRecord) => {
    setAssigningSingleApproval(approval);
    setIsAssignModalOpen(true);
  };

  const handleOpenBulkAssign = () => {
    setAssigningSingleApproval(null);
    setIsAssignModalOpen(true);
  };

  const handleConfirmAssignment = (approverId: string, approverName: string, notes?: string) => {
    if (assigningSingleApproval) {
      assignApproval(assigningSingleApproval.id, approverId, approverName, notes);
      setNotification({
        type: 'success',
        text: `Assigned case ${assigningSingleApproval.approvalNumber} to ${approverName}.`,
      });
    } else if (selectedIds.length > 0) {
      selectedIds.forEach((id) => {
        assignApproval(id, approverId, approverName, notes);
      });
      setNotification({
        type: 'success',
        text: `Bulk assigned ${selectedIds.length} approval cases to ${approverName}.`,
      });
      setSelectedIds([]);
    }
  };

  const handleQuickStartReview = (approval: ApprovalRecord) => {
    startApprovalReview(approval.id);
    onSelectApproval(approval.id);
  };

  // Convert an approved Credit Assessment into an Approval workflow file if requested
  const handleAutoCreateApprovalFromCA = (caId: string) => {
    try {
      const newApproval = createApprovalFromCreditAssessment(caId) as ApprovalRecord;
      setNotification({
        type: 'success',
        text: `Created new multi-tier approval workflow ${newApproval.approvalNumber}.`,
      });
      onSelectApproval(newApproval.id);
    } catch (err: any) {
      setNotification({
        type: 'error',
        text: err?.message || 'Failed to generate approval from credit assessment.',
      });
    }
  };

  return (
    <div className="space-y-6" id="approvals-queue-view">
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

      {/* Main Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-700" />
            <h1 className="text-lg font-bold text-slate-900">
              Approval & Sanction Workflow Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise credit underwriting approval queue, delegation matrix enforcement, and sanction covenant controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab buttons */}
          <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1 text-xs">
            <button
              id="tab-btn-approvals-queue"
              onClick={() => setActiveTab('QUEUE')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-bold transition-colors ${
                activeTab === 'QUEUE'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>Sanction Queue ({approvals.length})</span>
            </button>

            <button
              id="tab-btn-approval-matrix"
              onClick={() => setActiveTab('MATRIX')}
              className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 font-bold transition-colors ${
                activeTab === 'MATRIX'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Delegation Matrix ({approvalMatrixRules.length} Rules)</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'QUEUE' ? (
        <>
          {/* Top KPIs */}
          <ApprovalQueueKPIs
            approvals={approvals}
            activeTab={activeTab}
            onTabChange={() => {}}
          />

          {/* Queue Filter Controls */}
          <ApprovalQueueFilters
            filters={filters}
            branches={branches.map((b) => ({ id: b.id, name: b.name }))}
            approvers={[]}
            onFilterChange={(newFilters) => {
              setFilters(newFilters);
              setCurrentPage(1);
            }}
            onReset={handleResetFilters}
          />

          {/* Bulk Action Bar (Visible when rows are selected) */}
          {selectedIds.length > 0 && (
            <div className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50/80 px-4 py-3 text-xs text-indigo-950">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-indigo-700" />
                <span className="font-bold">{selectedIds.length} approval files selected</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="btn-bulk-assign"
                  onClick={handleOpenBulkAssign}
                  className="inline-flex items-center gap-1.5 rounded bg-indigo-900 px-3 py-1.5 font-bold text-white hover:bg-indigo-800"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Assign Selected to Approver</span>
                </button>
                <button
                  onClick={() => setSelectedIds([])}
                  className="rounded border border-indigo-300 bg-white px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* Main Approval Queue Data Table */}
          <ApprovalQueueTable
            approvals={filteredApprovals}
            selectedApprovalIds={selectedIds}
            onSelectApproval={(appr) => onSelectApproval(appr.id)}
            onOpenAssignModal={handleOpenAssignSingle}
            onOpenDecisionModal={handleQuickStartReview}
            onToggleSelectApproval={handleSelectRow}
            onToggleSelectAll={handleSelectAll}
            userRole={currentUser?.roleTitle}
            userName={currentUser?.name}
          />

          {/* Assign Modal */}
          <ApprovalAssignModal
            isOpen={isAssignModalOpen}
            onClose={() => setIsAssignModalOpen(false)}
            approval={assigningSingleApproval}
            selectedApprovalIds={selectedIds}
            approvers={mockApprovers}
            onAssign={handleConfirmAssignment}
          />
        </>
      ) : (
        /* Delegation Matrix Management View */
        <ApprovalMatrixView
          rules={approvalMatrixRules}
          audits={approvalMatrixAudits}
          branches={branches}
          onAddRule={addApprovalMatrixRule}
          onUpdateRule={updateApprovalMatrixRule}
          onToggleActive={toggleApprovalMatrixRuleActive}
          onDeleteRule={deleteApprovalMatrixRule}
        />
      )}
    </div>
  );
};
