import React from 'react';
import { Search, Filter, RotateCcw, Download } from 'lucide-react';
import { ApplicationWorkflowStatus } from '../../types/applicationTypes';
import { Branch } from '../../types';

export interface ApplicationToolbarFilters {
  searchQuery: string;
  status: 'ALL' | ApplicationWorkflowStatus;
  productCode: string;
  branchId: string;
  dateRange: 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH';
}

interface ApplicationFiltersProps {
  filters: ApplicationToolbarFilters;
  onFilterChange: (newFilters: ApplicationToolbarFilters) => void;
  branches: Branch[];
  products: { code: string; name: string }[];
  onReset: () => void;
  onExport?: () => void;
  canExport?: boolean;
}

export const ApplicationFilters: React.FC<ApplicationFiltersProps> = ({
  filters,
  onFilterChange,
  branches,
  products,
  onReset,
  onExport,
  canExport = true,
}) => {
  const isFiltered =
    filters.searchQuery !== '' ||
    filters.status !== 'ALL' ||
    filters.productCode !== 'ALL' ||
    filters.branchId !== 'ALL' ||
    filters.dateRange !== 'ALL';

  return (
    <div
      id="application-filters-panel"
      className="bg-white border border-slate-200 rounded-lg p-4 mb-5 shadow-sm"
    >
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="application-search-input"
            type="text"
            placeholder="Search by Application No, Customer Name, ID, Mobile..."
            value={filters.searchQuery}
            onChange={(e) =>
              onFilterChange({ ...filters, searchQuery: e.target.value })
            }
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
          />
        </div>

        {/* Status Dropdown */}
        <div className="w-full md:w-44">
          <select
            id="application-status-filter"
            value={filters.status}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                status: e.target.value as any,
              })
            }
            aria-label="Filter by application status"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="DOCUMENT_PENDING">Docs Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="SANCTIONED">Sanctioned</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Product Dropdown */}
        <div className="w-full md:w-52">
          <select
            id="application-product-filter"
            value={filters.productCode}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                productCode: e.target.value,
              })
            }
            aria-label="Filter by loan product"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
          >
            <option value="ALL">All Products</option>
            {products.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Branch Dropdown */}
        <div className="w-full md:w-48">
          <select
            id="application-branch-filter"
            value={filters.branchId}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                branchId: e.target.value,
              })
            }
            aria-label="Filter by branch"
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
          >
            <option value="ALL">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons: Reset & Export */}
        <div className="flex items-center gap-2">
          {isFiltered && (
            <button
              id="application-filter-reset-btn"
              onClick={onReset}
              className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-300 flex items-center gap-1.5 transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}

          {canExport && onExport && (
            <button
              id="application-export-btn"
              onClick={onExport}
              className="px-3 py-2 text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-md border border-slate-300 flex items-center gap-1.5 transition-colors shadow-sm"
              title="Export Application Records to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
