import React, { useState, useMemo } from 'react';
import { useMockLMSStore } from '../../services/mockService';
import { useAuth } from '../../services/authContext';
import { CreditAssessmentRecord, ConditionStatus } from '../../types/creditTypes';
import { CreditStatusBadge } from '../credit/CreditStatusBadge';
import { CreditQueueKPIs } from '../credit/CreditQueueKPIs';
import { CreditQueueFilters } from '../credit/CreditQueueFilters';
import { CreditAssessmentWorkspace } from '../credit/CreditAssessmentWorkspace';
import { AssignmentModal } from '../credit/AssignmentModal';
import { ReturnAssessmentModal } from '../credit/ReturnAssessmentModal';
import {
  ShieldCheck,
  Play,
  UserCheck,
  RotateCcw,
  ArrowRight,
  Sliders,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';

interface CreditAssessmentViewProps {
  initialAssessmentId?: string;
  onNavigate?: (module: string) => void;
  onNavigateToApproval?: (approvalId?: string) => void;
}

export const CreditAssessmentView: React.FC<CreditAssessmentViewProps> = ({
  initialAssessmentId,
  onNavigate,
  onNavigateToApproval,
}) => {
  const store = useMockLMSStore();
  const { user, hasPermission } = useAuth();

  // Selected assessment state (if viewing workspace)
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(
    initialAssessmentId || null
  );

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [productFilter, setProductFilter] = useState('ALL');
  const [officerFilter, setOfficerFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('PRIORITY_DESC');

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [assignModalAssessment, setAssignModalAssessment] = useState<CreditAssessmentRecord | null>(null);
  const [returnModalAssessment, setReturnModalAssessment] = useState<CreditAssessmentRecord | null>(null);

  // Permissions check
  const canView = hasPermission('view_credit_assessment');
  const canAssess = hasPermission('conduct_credit_assessment');
  const canAssign = hasPermission('manage_users_roles') || hasPermission('conduct_credit_assessment');
  const canDecide = hasPermission('conduct_credit_assessment') || hasPermission('action_approvals');

  // Filtered assessments list
  const filteredAssessments = useMemo(() => {
    return store.creditAssessments.filter((a) => {
      // 1. Search
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesName = a.customerName.toLowerCase().includes(q);
        const matchesNum = a.assessmentNumber.toLowerCase().includes(q);
        const matchesApp = a.applicationNumber.toLowerCase().includes(q);
        const matchesMobile = a.customerMobile?.includes(q);
        const matchesCust = a.customerNumber.toLowerCase().includes(q);
        if (!matchesName && !matchesNum && !matchesApp && !matchesMobile && !matchesCust) {
          return false;
        }
      }

      // 2. Status
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'PENDING' && a.status !== 'PENDING' && a.status !== 'ASSIGNED') return false;
        if (statusFilter !== 'PENDING' && a.status !== statusFilter) return false;
      }

      // 3. Branch
      if (branchFilter !== 'ALL' && a.branchId !== branchFilter) {
        return false;
      }

      // 4. Product
      if (productFilter !== 'ALL' && a.productCode !== productFilter) {
        return false;
      }

      // 5. Officer
      if (officerFilter !== 'ALL') {
        if (officerFilter === 'UNASSIGNED' && a.assignedToId) return false;
        if (officerFilter !== 'UNASSIGNED' && a.assignedToId !== officerFilter) return false;
      }

      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'PRIORITY_DESC': {
          const priorityOrder: Record<string, number> = { HIGH: 3, NORMAL: 2, LOW: 1 };
          return (priorityOrder[b.priority || 'NORMAL'] || 2) - (priorityOrder[a.priority || 'NORMAL'] || 2);
        }
        case 'DATE_DESC':
          return new Date(b.createdDate || '').getTime() - new Date(a.createdDate || '').getTime();
        case 'DATE_ASC':
          return new Date(a.createdDate || '').getTime() - new Date(b.createdDate || '').getTime();
        case 'AMOUNT_DESC':
          return b.requestedAmount - a.requestedAmount;
        case 'AMOUNT_ASC':
          return a.requestedAmount - b.requestedAmount;
        case 'AGE_DESC':
          return (b.ageDays || 0) - (a.ageDays || 0);
        default:
          return 0;
      }
    });
  }, [
    store.creditAssessments,
    searchTerm,
    statusFilter,
    branchFilter,
    productFilter,
    officerFilter,
    sortBy,
  ]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setBranchFilter('ALL');
    setProductFilter('ALL');
    setOfficerFilter('ALL');
    setSortBy('PRIORITY_DESC');
  };

  // Toggle selection
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredAssessments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAssessments.map((a) => a.id));
    }
  };

  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Currently opened assessment for workspace
  const activeAssessment = selectedAssessmentId
    ? store.getCreditAssessmentById(selectedAssessmentId)
    : null;

  const activeApplication = activeAssessment
    ? store.getApplicationById(activeAssessment.applicationId)
    : undefined;

  const activeCustomer = activeAssessment
    ? store.getCustomerById(activeAssessment.customerId)
    : undefined;

  if (activeAssessment) {
    return (
      <CreditAssessmentWorkspace
        assessment={activeAssessment}
        application={activeApplication}
        customer={activeCustomer}
        users={store.users}
        onBack={() => setSelectedAssessmentId(null)}
        onStartAssessment={() =>
          store.startCreditAssessment(activeAssessment.id, user?.name || 'Sunita Patel')
        }
        onAssignOfficer={(officerId, officerName, notes) =>
          store.assignCreditAssessment(
            activeAssessment.id,
            officerId,
            officerName,
            notes,
            user?.name || 'Alex Morgan'
          )
        }
        onUpdateFinancials={(updates) =>
          store.updateCreditAssessment(activeAssessment.id, updates, user?.name || 'Sunita Patel')
        }
        onAddObligation={(obligation) =>
          store.addCreditObligation(activeAssessment.id, obligation, user?.name || 'Sunita Patel')
        }
        onDeleteObligation={(obligationId) =>
          store.deleteCreditObligation(activeAssessment.id, obligationId, user?.name || 'Sunita Patel')
        }
        onEvaluateRules={() =>
          store.evaluateCreditRules(activeAssessment.id, user?.name || 'Sunita Patel')
        }
        onAddCondition={(condition) =>
          store.addCreditCondition(activeAssessment.id, condition, user?.name || 'Sunita Patel')
        }
        onUpdateConditionStatus={(conditionId, status, resolutionNotes) =>
          store.updateCreditConditionStatus(
            activeAssessment.id,
            conditionId,
            status,
            resolutionNotes,
            user?.name || 'Sunita Patel'
          )
        }
        onDeleteCondition={(conditionId) =>
          store.deleteCreditCondition(activeAssessment.id, conditionId, user?.name || 'Sunita Patel')
        }
        onReturnAssessment={(reason, requiredAction) =>
          store.returnCreditAssessment(
            activeAssessment.id,
            reason,
            requiredAction,
            user?.name || 'Sunita Patel'
          )
        }
        onSubmitRecommendation={(data) =>
          store.submitCreditAssessmentRecommendation(
            activeAssessment.id,
            data,
            user?.name || 'Sunita Patel'
          )
        }
        canEdit={canAssess || canDecide}
      />
    );
  }

  return (
    <div className="p-0 sm:p-2 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            Credit Assessment & Underwriting Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise underwriting workspace for credit appraisal, debt-service FOIR analysis, policy rule verification, and sanction formulation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && canAssign && (
            <button
              onClick={() => {
                const first = store.creditAssessments.find((a) => a.id === selectedIds[0]);
                if (first) setAssignModalAssessment(first);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Batch Assign ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <CreditQueueKPIs
        assessments={store.creditAssessments}
        activeStatusFilter={statusFilter}
        onSelectStatus={(status) => setStatusFilter(status)}
      />

      {/* Filters */}
      <CreditQueueFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        branchFilter={branchFilter}
        onBranchChange={setBranchFilter}
        productFilter={productFilter}
        onProductChange={setProductFilter}
        officerFilter={officerFilter}
        onOfficerChange={setOfficerFilter}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onReset={handleResetFilters}
        branches={store.branches}
        products={store.loanProductsConfig}
        users={store.users}
      />

      {/* Queue Data Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900 uppercase">
              Underwriting Cases ({filteredAssessments.length})
            </span>
          </div>
          {selectedIds.length > 0 && (
            <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              {selectedIds.length} Cases Selected
            </span>
          )}
        </div>

        {filteredAssessments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={
                        filteredAssessments.length > 0 &&
                        selectedIds.length === filteredAssessments.length
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-4 py-3">Case Identifier</th>
                  <th className="px-4 py-3">Applicant & Mobile</th>
                  <th className="px-4 py-3">Product & Branch</th>
                  <th className="px-4 py-3">Quantum & Proposed EMI</th>
                  <th className="px-4 py-3">FOIR / DTI</th>
                  <th className="px-4 py-3">Bureau Score</th>
                  <th className="px-4 py-3">Underwriting Status</th>
                  <th className="px-4 py-3">Assigned Officer</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredAssessments.map((a) => {
                  const isSelected = selectedIds.includes(a.id);
                  const foir = a.postApplicationObligationRatio || 0;
                  const isHighFoir = foir > 50;

                  return (
                    <tr
                      key={a.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectId(a.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>

                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => setSelectedAssessmentId(a.id)}
                          className="font-bold text-indigo-600 hover:text-indigo-900 font-mono text-xs block text-left"
                        >
                          {a.assessmentNumber}
                        </button>
                        <span className="text-[11px] text-slate-400 font-mono">
                          App: {a.applicationNumber}
                        </span>
                        {a.currentVersion && a.currentVersion > 1 && (
                          <span className="ml-1 text-[10px] bg-indigo-50 text-indigo-700 px-1 rounded border border-indigo-200 font-mono">
                            v{a.currentVersion}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{a.customerName}</div>
                        <div className="text-[11px] text-slate-500">{a.customerMobile}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-800">{a.productName}</div>
                        <div className="text-[11px] text-slate-500">{a.branchName}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 font-mono">
                          ₹{a.requestedAmount.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          EMI: ₹{a.proposedEmi.toLocaleString('en-IN')} ({a.requestedTenureMonths}m)
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${
                            isHighFoir
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {foir.toFixed(1)}%
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-900 text-xs">
                          {a.creditHistory?.bureauScore || 'N/A'}
                        </span>
                        {a.creditHistory?.scoreBand && (
                          <span className="text-[10px] text-slate-400 block">
                            {a.creditHistory.scoreBand}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 space-y-1">
                        <CreditStatusBadge status={a.status} size="sm" />
                        {a.recommendation && a.status !== 'PENDING' && (
                          <div>
                            <CreditStatusBadge recommendation={a.recommendation} size="sm" />
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-slate-700">
                        {a.assignedToName ? (
                          <span className="font-medium">{a.assignedToName}</span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right space-x-1">
                        <button
                          onClick={() => setSelectedAssessmentId(a.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors shadow-sm"
                        >
                          Open Workspace
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400">
            No credit assessment cases match the active filter criteria.
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {assignModalAssessment && (
        <AssignmentModal
          assessment={assignModalAssessment}
          users={store.users}
          onClose={() => setAssignModalAssessment(null)}
          onAssign={(officerId, officerName, notes) => {
            // Assign to all selected or single
            const idsToAssign = selectedIds.length > 0 ? selectedIds : [assignModalAssessment.id];
            idsToAssign.forEach((id) => {
              store.assignCreditAssessment(
                id,
                officerId,
                officerName,
                notes,
                user?.name || 'Alex Morgan'
              );
            });
            setSelectedIds([]);
          }}
        />
      )}

      {/* Return Modal */}
      {returnModalAssessment && (
        <ReturnAssessmentModal
          assessment={returnModalAssessment}
          onClose={() => setReturnModalAssessment(null)}
          onConfirmReturn={(reason, requiredAction) => {
            store.returnCreditAssessment(
              returnModalAssessment.id,
              reason,
              requiredAction,
              user?.name || 'Sunita Patel'
            );
          }}
        />
      )}
    </div>
  );
};
