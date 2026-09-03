import React from 'react';
import { CustomerFilterState, Branch } from '../../types';
import { Filter, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

interface CustomerFiltersProps {
  filters: CustomerFilterState;
  onFilterChange: (filters: CustomerFilterState) => void;
  branches: Branch[];
  onReset: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const CustomerFilters: React.FC<CustomerFiltersProps> = ({
  filters,
  onFilterChange,
  branches,
  onReset,
  isExpanded,
  onToggleExpand,
}) => {
  // Compute active filters count
  const activeCount = [
    filters.status !== 'ALL' ? 1 : 0,
    filters.customerType !== 'ALL' ? 1 : 0,
    filters.branchId !== 'ALL' ? 1 : 0,
    filters.createdDateFrom ? 1 : 0,
    filters.createdDateTo ? 1 : 0,
    filters.hasExistingLoan !== 'ALL' ? 1 : 0,
    filters.loanStatus !== 'ALL' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const updateField = (field: keyof CustomerFilterState, value: string) => {
    onFilterChange({
      ...filters,
      [field]: value,
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded text-xs">
      <div className="px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleExpand}
            className="flex items-center gap-1.5 font-semibold text-slate-800 hover:text-slate-900 focus:outline-none"
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filter Parameters</span>
            {activeCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-slate-900 text-white text-[10px] font-bold rounded">
                {activeCount} active
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-1" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            )}
          </button>
        </div>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Clear all filters</span>
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Customer Status */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => updateField('status', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          {/* Customer Type */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Customer Type</label>
            <select
              value={filters.customerType}
              onChange={(e) => updateField('customerType', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800"
            >
              <option value="ALL">All Types</option>
              <option value="INDIVIDUAL">Individual</option>
              <option value="BUSINESS">Business</option>
            </select>
          </div>

          {/* Branch */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Branch</label>
            <select
              value={filters.branchId}
              onChange={(e) => updateField('branchId', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800"
            >
              <option value="ALL">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Existing Loan */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Has Existing Loan</label>
            <select
              value={filters.hasExistingLoan}
              onChange={(e) => updateField('hasExistingLoan', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800"
            >
              <option value="ALL">Any</option>
              <option value="YES">Yes (Has Loans)</option>
              <option value="NO">No (0 Loans)</option>
            </select>
          </div>

          {/* Loan Status */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Loan Status</label>
            <select
              value={filters.loanStatus}
              onChange={(e) => updateField('loanStatus', e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800"
            >
              <option value="ALL">Any Loan Status</option>
              <option value="ACTIVE">Active Loans</option>
              <option value="OVERDUE">Overdue Accounts</option>
              <option value="CLOSED">Closed Loans</option>
            </select>
          </div>

          {/* Date Created Range */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">Onboarded From</label>
            <input
              type="date"
              value={filters.createdDateFrom}
              onChange={(e) => updateField('createdDateFrom', e.target.value)}
              className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800 focus:border-slate-800"
            />
          </div>
        </div>
      )}
    </div>
  );
};
