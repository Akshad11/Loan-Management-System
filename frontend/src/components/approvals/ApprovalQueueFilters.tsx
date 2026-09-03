import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { ApprovalFilterState } from '../../types/approvalTypes';

interface ApprovalQueueFiltersProps {
  filters: ApprovalFilterState;
  onFilterChange: (filters: ApprovalFilterState) => void;
  onReset: () => void;
  branches: { id: string; name: string }[];
  approvers: { id: string; name: string }[];
}

export const ApprovalQueueFilters: React.FC<ApprovalQueueFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
  branches,
  approvers,
}) => {
  const handleChange = (key: keyof ApprovalFilterState, value: any) => {
    onFilterChange({
      ...filters,
      [key]: value === '' ? undefined : value,
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.status ||
    filters.level !== undefined ||
    filters.productCode ||
    filters.branchId ||
    filters.assignedToId ||
    filters.minAmount ||
    filters.maxAmount ||
    filters.priority ||
    filters.isSlaBreached;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" id="approval-queue-filters">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {/* Search */}
        <div className="col-span-1 sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Search Case</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="approval-filter-search"
              type="text"
              placeholder="Search Application #, Customer, Approval #..."
              value={filters.search || ''}
              onChange={(e) => handleChange('search', e.target.value)}
              className="w-full rounded border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Workflow Status</label>
          <select
            id="approval-filter-status"
            value={filters.status || ''}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-sm text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending Approval</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="RETURNED">Returned for Info</option>
            <option value="APPROVED">Approved / Sanctioned</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Approval Level Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Approval Tier Level</label>
          <select
            id="approval-filter-level"
            value={filters.level !== undefined ? filters.level : ''}
            onChange={(e) => handleChange('level', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-sm text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
          >
            <option value="">All Tiers</option>
            <option value="1">Level 1 — Branch Credit Review</option>
            <option value="2">Level 2 — Regional Sanction</option>
            <option value="3">Level 3 — National Committee</option>
          </select>
        </div>

        {/* Product Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Loan Product</label>
          <select
            id="approval-filter-product"
            value={filters.productCode || ''}
            onChange={(e) => handleChange('productCode', e.target.value)}
            className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-sm text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
          >
            <option value="">All Products</option>
            <option value="PL">Personal Loan</option>
            <option value="BL">Business Loan</option>
            <option value="HL">Home Loan</option>
            <option value="LAP">Loan Against Property</option>
            <option value="VL">Vehicle Loan</option>
          </select>
        </div>

        {/* Branch Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Branch</label>
          <select
            id="approval-filter-branch"
            value={filters.branchId || ''}
            onChange={(e) => handleChange('branchId', e.target.value)}
            className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-sm text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Approver Filter */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Assigned Approver</label>
          <select
            id="approval-filter-approver"
            value={filters.assignedToId || ''}
            onChange={(e) => handleChange('assignedToId', e.target.value)}
            className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-sm text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
          >
            <option value="">All Approvers</option>
            <option value="UNASSIGNED">Unassigned</option>
            {approvers.map((appr) => (
              <option key={appr.id} value={appr.id}>
                {appr.name}
              </option>
            ))}
          </select>
        </div>

        {/* Min / Max Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Min Quantum (₹)</label>
          <input
            id="approval-filter-min-amount"
            type="number"
            placeholder="Min Amount"
            value={filters.minAmount || ''}
            onChange={(e) => handleChange('minAmount', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-sm text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Max Quantum (₹)</label>
          <input
            id="approval-filter-max-amount"
            type="number"
            placeholder="Max Amount"
            value={filters.maxAmount || ''}
            onChange={(e) => handleChange('maxAmount', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-sm text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
          />
        </div>

        {/* SLA Breach Only */}
        <div className="flex items-center pt-5">
          <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
            <input
              id="approval-filter-sla"
              type="checkbox"
              checked={!!filters.isSlaBreached}
              onChange={(e) => handleChange('isSlaBreached', e.target.checked ? true : undefined)}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-800"
            />
            <span>SLA Breached Only</span>
          </label>
        </div>

        {/* Action buttons */}
        <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-2 flex items-center justify-end gap-2 pt-4">
          {hasActiveFilters && (
            <button
              id="approval-filter-reset"
              onClick={onReset}
              className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
