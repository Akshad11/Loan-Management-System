import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';
import { BranchFilterState } from '../../types';

interface BranchFiltersProps {
  filters: BranchFilterState;
  onFilterChange: (filters: BranchFilterState) => void;
  availableStates: string[];
  availableCities: string[];
}

export const BranchFilters: React.FC<BranchFiltersProps> = ({
  filters,
  onFilterChange,
  availableStates,
  availableCities,
}) => {
  const activeCount = [filters.status, filters.state, filters.city].filter(Boolean).length;

  const handleClearAll = () => {
    onFilterChange({
      search: '',
      status: '',
      state: '',
      city: '',
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 mb-4 space-y-3">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            id="branch-search-input"
            name="branch-search-input"
            type="text"
            placeholder="Search branches by code (e.g. BR-PNJ-001), name, city, state, or branch manager..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-slate-800 focus:outline-none transition-colors"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Filter Selects */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          {/* Status */}
          <select
            id="branch-filter-status"
            value={filters.status}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
            className="text-xs bg-white border border-slate-300 rounded px-2.5 py-2 text-slate-800 focus:outline-none focus:border-slate-800"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>

          {/* State */}
          <select
            id="branch-filter-state"
            value={filters.state}
            onChange={(e) => onFilterChange({ ...filters, state: e.target.value, city: '' })}
            className="text-xs bg-white border border-slate-300 rounded px-2.5 py-2 text-slate-800 focus:outline-none focus:border-slate-800"
          >
            <option value="">All States</option>
            {availableStates.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* City */}
          <select
            id="branch-filter-city"
            value={filters.city}
            onChange={(e) => onFilterChange({ ...filters, city: e.target.value })}
            className="text-xs bg-white border border-slate-300 rounded px-2.5 py-2 text-slate-800 focus:outline-none focus:border-slate-800"
          >
            <option value="">All Cities</option>
            {availableCities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-2 py-1.5 font-medium"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
