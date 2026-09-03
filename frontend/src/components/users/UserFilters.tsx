import React, { useState } from 'react';
import { Search, Filter, X, RotateCcw } from 'lucide-react';
import { UserFilterState, Role, Branch } from '../../types';

interface UserFiltersProps {
  filters: UserFilterState;
  onFilterChange: (filters: UserFilterState) => void;
  roles: Role[];
  branches: Branch[];
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  filters,
  onFilterChange,
  roles,
  branches,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFilterCount = [
    filters.status,
    filters.roleId,
    filters.branchId,
    filters.lastLoginRange,
    filters.createdDateRange,
  ].filter(Boolean).length;

  const handleSearchChange = (search: string) => {
    onFilterChange({ ...filters, search });
  };

  const handleClearAll = () => {
    onFilterChange({
      search: '',
      status: '',
      roleId: '',
      branchId: '',
      lastLoginRange: '',
      createdDateRange: '',
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 mb-4 space-y-3">
      {/* Top Search + Quick Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            id="user-search-input"
            name="user-search-input"
            type="text"
            placeholder="Search users by name, username, email, or employee ID (e.g. EMP-001001)..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-slate-800 focus:outline-none transition-colors"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            id="toggle-user-filters-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded border transition-colors ${
              isExpanded || activeFilterCount > 0
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-slate-700 text-white text-[10px] rounded-full font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-2 py-2 font-medium"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Filter Panel */}
      {isExpanded && (
        <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Status Filter */}
          <div className="space-y-1 text-left">
            <label htmlFor="user-filter-status" className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Status
            </label>
            <select
              id="user-filter-status"
              value={filters.status}
              onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
              className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-slate-800"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="space-y-1 text-left">
            <label htmlFor="user-filter-role" className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Role
            </label>
            <select
              id="user-filter-role"
              value={filters.roleId}
              onChange={(e) => onFilterChange({ ...filters, roleId: e.target.value })}
              className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-slate-800"
            >
              <option value="">All Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Branch Filter */}
          <div className="space-y-1 text-left">
            <label htmlFor="user-filter-branch" className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Branch
            </label>
            <select
              id="user-filter-branch"
              value={filters.branchId}
              onChange={(e) => onFilterChange({ ...filters, branchId: e.target.value })}
              className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-slate-800"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Last Login Range */}
          <div className="space-y-1 text-left">
            <label htmlFor="user-filter-lastlogin" className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Last Login
            </label>
            <select
              id="user-filter-lastlogin"
              value={filters.lastLoginRange}
              onChange={(e) => onFilterChange({ ...filters, lastLoginRange: e.target.value })}
              className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-slate-800"
            >
              <option value="">Any Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="never">Never Logged In</option>
            </select>
          </div>

          {/* Created Date Range */}
          <div className="space-y-1 text-left">
            <label htmlFor="user-filter-created" className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Created Period
            </label>
            <select
              id="user-filter-created"
              value={filters.createdDateRange}
              onChange={(e) => onFilterChange({ ...filters, createdDateRange: e.target.value })}
              className="w-full text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 focus:outline-none focus:border-slate-800"
            >
              <option value="">All Time</option>
              <option value="this_month">This Month</option>
              <option value="last_quarter">Last Quarter</option>
              <option value="2025">Year 2025</option>
              <option value="2026">Year 2026</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
