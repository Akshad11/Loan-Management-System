import React from 'react';
import { Search, RotateCcw, Plus, Filter } from 'lucide-react';

interface DisbursementFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  branchFilter: string;
  onBranchChange: (value: string) => void;
  productFilter: string;
  onProductChange: (value: string) => void;
  branches: { id: string; name: string }[];
  products: { code: string; name: string }[];
  onReset: () => void;
  canCreateRequest: boolean;
  onOpenCreateModal: () => void;
}

export const DisbursementFilters: React.FC<DisbursementFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  branchFilter,
  onBranchChange,
  productFilter,
  onProductChange,
  branches,
  products,
  onReset,
  canCreateRequest,
  onOpenCreateModal,
}) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search borrower, disbursement #, app #, sanction #..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white"
          />
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>

          {canCreateRequest && (
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Disbursement Request
            </button>
          )}
        </div>
      </div>

      {/* Filter Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
        {/* Status */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Request Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium text-slate-800"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_APPROVAL">Pending Checker Review</option>
            <option value="APPROVED">Approved / Ready for Payout</option>
            <option value="SUCCESSFUL">Fully / Partially Disbursed</option>
            <option value="FAILED">Failed Transaction</option>
            <option value="RETURNED">Returned for Correction</option>
            <option value="REJECTED">Rejected</option>
            <option value="REVERSED">Reversed Payout</option>
          </select>
        </div>

        {/* Branch */}
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Operating Branch
          </label>
          <select
            value={branchFilter}
            onChange={(e) => onBranchChange(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium text-slate-800"
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
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Loan Product
          </label>
          <select
            value={productFilter}
            onChange={(e) => onProductChange(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium text-slate-800"
          >
            <option value="ALL">All Products</option>
            {products.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
