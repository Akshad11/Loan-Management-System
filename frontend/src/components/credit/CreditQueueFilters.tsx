import React from 'react';
import { Branch, LoanProductConfig, LMSUser } from '../../types';
import { Search, Filter, RotateCcw } from 'lucide-react';

interface CreditQueueFiltersProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  branchFilter: string;
  onBranchChange: (val: string) => void;
  productFilter: string;
  onProductChange: (val: string) => void;
  officerFilter: string;
  onOfficerChange: (val: string) => void;
  sortBy: string;
  onSortChange: (val: string) => void;
  onReset: () => void;
  branches: Branch[];
  products: LoanProductConfig[];
  users: LMSUser[];
}

export const CreditQueueFilters: React.FC<CreditQueueFiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  branchFilter,
  onBranchChange,
  productFilter,
  onProductChange,
  officerFilter,
  onOfficerChange,
  sortBy,
  onSortChange,
  onReset,
  branches,
  products,
  users,
}) => {
  const creditOfficers = users.filter(
    (u) =>
      u.status === 'ACTIVE' &&
      (u.roleName?.toLowerCase().includes('credit') ||
        u.roleName?.toLowerCase().includes('underwriter') ||
        u.roleName?.toLowerCase().includes('officer') ||
        u.roleName?.toLowerCase().includes('manager'))
  );

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
        {/* Search */}
        <div className="lg:col-span-2 relative">
          <label className="block text-slate-600 font-medium mb-1">Search Cases</label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Borrower name, Assessment #, App #, Phone..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 font-medium"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-slate-600 font-medium mb-1">Stage Status</label>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 font-medium"
          >
            <option value="ALL">All Stages</option>
            <option value="PENDING">Pending Allocation</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Underwriting</option>
            <option value="SUBMITTED">Decision Submitted</option>
            <option value="DECISIONED">Decisioned</option>
            <option value="RETURNED">Returned to Sourcing</option>
          </select>
        </div>

        {/* Branch Filter */}
        <div>
          <label className="block text-slate-600 font-medium mb-1">Branch</label>
          <select
            value={branchFilter}
            onChange={(e) => onBranchChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 font-medium"
          >
            <option value="ALL">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Product Filter */}
        <div>
          <label className="block text-slate-600 font-medium mb-1">Loan Product</label>
          <select
            value={productFilter}
            onChange={(e) => onProductChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 font-medium"
          >
            <option value="ALL">All Products</option>
            {products.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Assigned Officer */}
        <div>
          <label className="block text-slate-600 font-medium mb-1">Assigned Officer</label>
          <select
            value={officerFilter}
            onChange={(e) => onOfficerChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 font-medium"
          >
            <option value="ALL">All Officers</option>
            <option value="UNASSIGNED">Unassigned</option>
            {creditOfficers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Second Row: Sort and Reset */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-2.5 py-1 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 text-xs"
          >
            <option value="PRIORITY_DESC">Priority (High to Low)</option>
            <option value="DATE_DESC">Application Date (Newest First)</option>
            <option value="DATE_ASC">Application Date (Oldest First)</option>
            <option value="AMOUNT_DESC">Loan Amount (High to Low)</option>
            <option value="AMOUNT_ASC">Loan Amount (Low to High)</option>
            <option value="AGE_DESC">Queue Age (Longest in Queue)</option>
          </select>
        </div>

        <button
          onClick={onReset}
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 font-medium transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Reset Filters
        </button>
      </div>
    </div>
  );
};
