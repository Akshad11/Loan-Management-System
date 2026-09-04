import React from 'react';
import { Search, Filter, RotateCcw, Plus } from 'lucide-react';
import { SanctionStatus } from '../../types/sanctionTypes';

interface SanctionFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  branchFilter: string;
  onBranchChange: (val: string) => void;
  productFilter: string;
  onProductChange: (val: string) => void;
  deviationFilter: string;
  onDeviationChange: (val: string) => void;
  branches: { id: string; name: string }[];
  products: { code: string; name: string }[];
  onReset: () => void;
  canCreateSanction: boolean;
  onOpenCreateModal: () => void;
}

export const SanctionFilters: React.FC<SanctionFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  branchFilter,
  onBranchChange,
  productFilter,
  onProductChange,
  deviationFilter,
  onDeviationChange,
  branches,
  products,
  onReset,
  canCreateSanction,
  onOpenCreateModal,
}) => {
  const statusOptions: { value: string; label: string }[] = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'UNDER_REVIEW', label: 'Under Review' },
    { value: 'PENDING_CONFIRMATION', label: 'Pending Confirmation' },
    { value: 'SANCTIONED', label: 'Sanctioned' },
    { value: 'RETURNED', label: 'Returned' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  const hasActiveFilters =
    searchTerm !== '' ||
    statusFilter !== 'ALL' ||
    branchFilter !== 'ALL' ||
    productFilter !== 'ALL' ||
    deviationFilter !== 'ALL';

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by borrower name, Sanction #, Application #, or Mobile..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all font-sans"
          />
        </div>

        {/* Action Button: Create Sanction */}
        {canCreateSanction && (
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-md shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4 mr-2" />
            Draft Sanction Dossier
          </button>
        )}
      </div>

      {/* Filter Selects */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-100">
        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Branch */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Branch</label>
          <select
            value={branchFilter}
            onChange={(e) => onBranchChange(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="ALL">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Product */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Loan Product</label>
          <select
            value={productFilter}
            onChange={(e) => onProductChange(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
          >
            <option value="ALL">All Products</option>
            {products.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Deviation */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Terms Deviation</label>
          <div className="flex items-center gap-2">
            <select
              value={deviationFilter}
              onChange={(e) => onDeviationChange(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="ALL">All Cases</option>
              <option value="DEVIATED">Deviated from Approval</option>
              <option value="MATCHED">Exact Match to Approval</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={onReset}
                title="Reset all filters"
                className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
