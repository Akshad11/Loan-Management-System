import React, { useState } from 'react';
import { ApprovalRecord } from '../../types/approvalTypes';
import { ApprovalStatusBadge, PriorityBadge } from './ApprovalStatusBadge';
import {
  ChevronRight,
  UserCheck,
  Clock,
  AlertTriangle,
  ArrowUpDown,
  Shield,
  FileCheck2,
  Send,
} from 'lucide-react';

interface ApprovalQueueTableProps {
  approvals: ApprovalRecord[];
  onSelectApproval: (approval: ApprovalRecord) => void;
  onOpenAssignModal: (approval: ApprovalRecord) => void;
  onOpenDecisionModal: (approval: ApprovalRecord) => void;
  selectedApprovalIds: string[];
  onToggleSelectApproval: (id: string) => void;
  onToggleSelectAll: () => void;
  userRole?: string;
  userName?: string;
}

export const ApprovalQueueTable: React.FC<ApprovalQueueTableProps> = ({
  approvals,
  onSelectApproval,
  onOpenAssignModal,
  onOpenDecisionModal,
  selectedApprovalIds,
  onToggleSelectApproval,
  onToggleSelectAll,
  userRole = '',
  userName = '',
}) => {
  const [sortField, setSortField] = useState<keyof ApprovalRecord>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const handleSort = (field: keyof ApprovalRecord) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedApprovals = [...approvals].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;

    if (typeof aVal === 'string') {
      return sortDirection === 'asc'
        ? (aVal as string).localeCompare(bVal as string)
        : (bVal as string).localeCompare(aVal as string);
    }
    if (typeof aVal === 'number') {
      return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedApprovals.length / pageSize) || 1;
  const paginatedApprovals = sortedApprovals.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const isAllSelected =
    paginatedApprovals.length > 0 && paginatedApprovals.every((a) => selectedApprovalIds.includes(a.id));

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden" id="approval-queue-table-container">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm" id="approval-queue-table">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <tr>
              <th className="py-3.5 pl-4 pr-2 w-10">
                <input
                  type="checkbox"
                  id="select-all-approvals"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-800"
                />
              </th>
              <th
                className="py-3.5 px-3 cursor-pointer hover:text-slate-900"
                onClick={() => handleSort('approvalNumber')}
              >
                <div className="flex items-center gap-1">
                  Approval & App #
                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                </div>
              </th>
              <th
                className="py-3.5 px-3 cursor-pointer hover:text-slate-900"
                onClick={() => handleSort('customerName')}
              >
                <div className="flex items-center gap-1">
                  Customer & Branch
                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                </div>
              </th>
              <th
                className="py-3.5 px-3 cursor-pointer hover:text-slate-900"
                onClick={() => handleSort('recommendedAmount')}
              >
                <div className="flex items-center gap-1">
                  Recommended Quantum
                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                </div>
              </th>
              <th className="py-3.5 px-3">Risk & Bureau</th>
              <th className="py-3.5 px-3">Tier Level Progress</th>
              <th className="py-3.5 px-3">Assigned Approver & SLA</th>
              <th className="py-3.5 px-3">Status</th>
              <th className="py-3.5 pr-4 pl-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800">
            {paginatedApprovals.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <FileCheck2 className="h-10 w-10 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No approval records found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search query.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedApprovals.map((approval) => {
                const isSelected = selectedApprovalIds.includes(approval.id);
                const currentLevelExecution = approval.levels[approval.currentLevelIndex];
                const isPendingOrAssigned =
                  approval.status === 'PENDING' || approval.status === 'ASSIGNED' || approval.status === 'IN_REVIEW';

                // Check SoD violation potential
                const isAssessor =
                  userName &&
                  approval.creditAssessorName &&
                  userName.toLowerCase().trim() === approval.creditAssessorName.toLowerCase().trim();

                return (
                  <tr
                    key={approval.id}
                    id={`approval-row-${approval.id}`}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSelected ? 'bg-indigo-50/40' : ''
                    } ${approval.isSlaBreached ? 'border-l-4 border-l-rose-500' : ''}`}
                  >
                    <td className="py-3.5 pl-4 pr-2">
                      <input
                        type="checkbox"
                        id={`select-approval-${approval.id}`}
                        checked={isSelected}
                        onChange={() => onToggleSelectApproval(approval.id)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-800"
                      />
                    </td>

                    {/* Approval # & App # */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-col">
                        <button
                          onClick={() => onSelectApproval(approval)}
                          className="text-left font-mono font-bold text-slate-900 hover:text-indigo-600 hover:underline"
                        >
                          {approval.approvalNumber}
                        </button>
                        <span className="font-mono text-xs text-slate-500">{approval.applicationNumber}</span>
                        <span className="text-[11px] text-slate-400">{approval.createdAt}</span>
                      </div>
                    </td>

                    {/* Customer & Branch */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{approval.customerName}</span>
                        <span className="text-xs text-slate-500">
                          {approval.productName} ({approval.productCode})
                        </span>
                        <span className="text-[11px] text-slate-400">{approval.branchName}</span>
                      </div>
                    </td>

                    {/* Recommended Quantum */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 font-mono">
                          ₹{approval.recommendedAmount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-slate-500">
                          {approval.recommendedTenureMonths} mos @ {approval.recommendedInterestRate}% p.a.
                        </span>
                        {approval.approvedAmount && approval.status === 'APPROVED' && (
                          <span className="text-[11px] font-semibold text-emerald-700 font-mono">
                            Sanctioned: ₹{approval.approvedAmount.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Risk & Bureau */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold font-mono ${
                            approval.creditScore >= 750
                              ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                              : approval.creditScore >= 680
                              ? 'bg-amber-100 text-amber-950 border border-amber-300'
                              : 'bg-rose-100 text-rose-950 border border-rose-300'
                          }`}
                        >
                          <Shield className="h-3 w-3" />
                          {approval.creditScore}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 uppercase">
                          Grade: {approval.riskRating}
                        </span>
                      </div>
                    </td>

                    {/* Tier Level Progress */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-xs font-semibold text-indigo-900">
                            Level {approval.currentLevelIndex + 1} of {approval.totalLevels}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-slate-600 truncate max-w-[170px]" title={currentLevelExecution?.levelName}>
                          {currentLevelExecution?.levelName}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Limit: ₹{currentLevelExecution?.authorityLimit.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </td>

                    {/* Assigned Approver & SLA */}
                    <td className="py-3.5 px-3">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-slate-800 text-xs">
                            {approval.assignedToName || (
                              <span className="italic text-slate-400">Unassigned</span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>Age: {approval.ageDays}d</span>
                          {approval.isSlaBreached && (
                            <span className="inline-flex items-center text-rose-600 font-bold ml-1">
                              <AlertTriangle className="h-3 w-3 mr-0.5" /> SLA Breached
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3">
                      <ApprovalStatusBadge status={approval.status} size="sm" />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 pr-4 pl-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isPendingOrAssigned && (
                          <>
                            <button
                              id={`btn-assign-${approval.id}`}
                              onClick={() => onOpenAssignModal(approval)}
                              title="Assign / Reassign Approver"
                              className="rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-100 focus:outline-none"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                            </button>

                            <button
                              id={`btn-decide-${approval.id}`}
                              onClick={() => onOpenDecisionModal(approval)}
                              title="Record Sanction Decision"
                              className="rounded border border-emerald-600 bg-emerald-50 p-1.5 text-emerald-800 hover:bg-emerald-100 focus:outline-none"
                            >
                              <Send className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}

                        <button
                          id={`btn-open-${approval.id}`}
                          onClick={() => onSelectApproval(approval)}
                          className="inline-flex items-center gap-1 rounded bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 focus:outline-none"
                        >
                          <span>Review</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
        <div>
          Showing <span className="font-semibold">{paginatedApprovals.length}</span> of{' '}
          <span className="font-semibold">{sortedApprovals.length}</span> approval cases
        </div>
        <div className="flex items-center gap-2">
          <button
            id="prev-approval-page"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="rounded border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700 disabled:opacity-50 hover:bg-slate-100"
          >
            Previous
          </button>
          <span>
            Page <span className="font-semibold">{currentPage}</span> of{' '}
            <span className="font-semibold">{totalPages}</span>
          </span>
          <button
            id="next-approval-page"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="rounded border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700 disabled:opacity-50 hover:bg-slate-100"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
