import React from 'react';
import { Branch } from '../../types';
import { AdminStatusBadge } from '../shared/AdminStatusBadge';
import { formatIndianCurrency, formatCompactCurrency } from '../../utils/formatters';
import { Building, MapPin, Users, Eye, Edit2, Building2, Landmark, MoreHorizontal } from 'lucide-react';

interface BranchTableProps {
  branches: Branch[];
  onViewBranch: (branch: Branch) => void;
  onEditBranch: (branch: Branch) => void;
  onDeactivateBranch: (branch: Branch) => void;
  onReactivateBranch: (branch: Branch) => void;
}

export const BranchTable: React.FC<BranchTableProps> = ({
  branches,
  onViewBranch,
  onEditBranch,
  onDeactivateBranch,
  onReactivateBranch,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
      <div className="overflow-x-auto min-h-[380px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 select-none">
            <tr>
              <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Branch Code
              </th>
              <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Branch Name & Address
              </th>
              <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Location
              </th>
              <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Branch Manager
              </th>
              <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Staff Count
              </th>
              <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Active Portfolio
              </th>
              <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Status
              </th>
              <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wider text-[11px] text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {branches.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  <p className="text-sm font-medium">No branches found matching active filters.</p>
                  <p className="text-xs text-slate-400 mt-1">Try clearing or adjusting search parameters.</p>
                </td>
              </tr>
            ) : (
              branches.map((branch) => (
                <tr
                  key={branch.id}
                  onClick={() => onViewBranch(branch)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  {/* Branch Code */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-100 rounded text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                        <Building className="w-4 h-4" />
                      </div>
                      <span className="font-mono font-bold text-slate-900">{branch.code}</span>
                    </div>
                  </td>

                  {/* Branch Name & Address */}
                  <td className="py-3 px-4 max-w-xs">
                    <p className="font-bold text-slate-900 leading-tight">{branch.name}</p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{branch.addressLine1}</p>
                  </td>

                  {/* City & State */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-medium text-slate-900">{branch.city}</span>
                    <span className="text-slate-500 block text-[11px]">{branch.state} ({branch.pinCode})</span>
                  </td>

                  {/* Manager */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="text-slate-800 font-medium">{branch.managerName || '—'}</span>
                  </td>

                  {/* Staff Count */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{branch.userCount}</span>
                    </span>
                  </td>

                  {/* Portfolio */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-semibold text-slate-900 block">
                      {formatCompactCurrency(branch.totalPortfolioValue)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{branch.activeLoanCount} active loans</span>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <AdminStatusBadge status={branch.status} size="sm" />
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        id={`view-branch-${branch.id}`}
                        onClick={() => onViewBranch(branch)}
                        className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                        title="View Branch Details"
                        aria-label={`View ${branch.name}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        id={`edit-branch-${branch.id}`}
                        onClick={() => onEditBranch(branch)}
                        className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                        title="Edit Branch"
                        aria-label={`Edit ${branch.name}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {branch.status === 'ACTIVE' ? (
                        <button
                          type="button"
                          id={`deactivate-branch-${branch.id}`}
                          onClick={() => onDeactivateBranch(branch)}
                          className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded"
                          title="Deactivate Branch"
                          aria-label={`Deactivate ${branch.name}`}
                        >
                          <Building2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          id={`reactivate-branch-${branch.id}`}
                          onClick={() => onReactivateBranch(branch)}
                          className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                          title="Reactivate Branch"
                          aria-label={`Reactivate ${branch.name}`}
                        >
                          <Building className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
