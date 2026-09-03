import React, { useState } from 'react';
import { CustomerRecord } from '../../types';
import { CustomerStatusBadge } from './CustomerStatusBadge';
import { formatIndianCurrency, formatDateDisplay } from '../../utils/formatters';
import {
  Copy,
  Check,
  Eye,
  Edit2,
  History,
  FileText,
  Archive,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from 'lucide-react';

interface CustomerTableProps {
  customers: CustomerRecord[];
  onViewCustomer: (customer: CustomerRecord) => void;
  onEditCustomer: (customer: CustomerRecord) => void;
  onViewHistory: (customer: CustomerRecord) => void;
  onViewLoans: (customer: CustomerRecord) => void;
  onArchiveCustomer: (customer: CustomerRecord) => void;
  onRestoreCustomer?: (customer: CustomerRecord) => void;
  canManage?: boolean;
}

type SortField = 'customerNumber' | 'name' | 'branchName' | 'activeLoanCount' | 'totalOutstanding' | 'createdDate';
type SortDirection = 'asc' | 'desc';

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
  onViewCustomer,
  onEditCustomer,
  onViewHistory,
  onViewLoans,
  onArchiveCustomer,
  onRestoreCustomer,
  canManage = true,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('createdDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const handleCopy = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort logic
  const sorted = [...customers].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];

    if (sortField === 'name') {
      aVal = a.name.toLowerCase();
      bVal = b.name.toLowerCase();
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const totalItems = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = sorted.slice(startIndex, startIndex + pageSize);

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ChevronDown className="w-3 h-3 text-slate-300 inline ml-1 opacity-0 group-hover:opacity-100" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-slate-900 inline ml-1" />
    ) : (
      <ChevronDown className="w-3 h-3 text-slate-900 inline ml-1" />
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded overflow-hidden">
      <div className="overflow-x-auto min-h-[380px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold select-none">
              <th
                onClick={() => handleSort('customerNumber')}
                className="py-2.5 px-3 cursor-pointer group hover:bg-slate-100 transition-colors"
              >
                Customer ID {renderSortIndicator('customerNumber')}
              </th>
              <th
                onClick={() => handleSort('name')}
                className="py-2.5 px-3 cursor-pointer group hover:bg-slate-100 transition-colors"
              >
                Customer Name {renderSortIndicator('name')}
              </th>
              <th className="py-2.5 px-3">Contact Details</th>
              <th
                onClick={() => handleSort('branchName')}
                className="py-2.5 px-3 cursor-pointer group hover:bg-slate-100 transition-colors"
              >
                Branch {renderSortIndicator('branchName')}
              </th>
              <th
                onClick={() => handleSort('activeLoanCount')}
                className="py-2.5 px-3 text-center cursor-pointer group hover:bg-slate-100 transition-colors"
              >
                Active Loans {renderSortIndicator('activeLoanCount')}
              </th>
              <th
                onClick={() => handleSort('totalOutstanding')}
                className="py-2.5 px-3 text-right cursor-pointer group hover:bg-slate-100 transition-colors"
              >
                Outstanding Amount {renderSortIndicator('totalOutstanding')}
              </th>
              <th className="py-2.5 px-3">Status</th>
              <th
                onClick={() => handleSort('createdDate')}
                className="py-2.5 px-3 cursor-pointer group hover:bg-slate-100 transition-colors"
              >
                Onboarded {renderSortIndicator('createdDate')}
              </th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <p className="font-semibold text-slate-800 text-sm">No customers match the selected criteria</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Try adjusting your search terms, removing active filters, or check for archived status.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => onViewCustomer(customer)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                >
                  {/* Customer Number with Copy */}
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span>{customer.customerNumber}</span>
                      <button
                        type="button"
                        onClick={(e) => handleCopy(e, customer.customerNumber)}
                        className="text-slate-400 hover:text-slate-700 p-0.5 rounded focus:outline-none"
                        title="Copy Customer ID"
                      >
                        {copiedId === customer.customerNumber ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Name + Location */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="font-semibold text-slate-900">{customer.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {customer.currentAddress.city}, {customer.currentAddress.state}
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="text-slate-900 font-mono text-[11px]">{customer.mobile}</div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[150px]">
                      {customer.email || '—'}
                    </div>
                  </td>

                  {/* Branch */}
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                    {customer.branchName}
                  </td>

                  {/* Active Loans */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span
                      className={`inline-block font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                        customer.activeLoanCount > 0
                          ? 'bg-slate-100 text-slate-900 border border-slate-200'
                          : 'text-slate-400'
                      }`}
                    >
                      {customer.activeLoanCount}
                    </span>
                  </td>

                  {/* Outstanding Amount */}
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                    {formatIndianCurrency(customer.totalOutstanding, true)}
                    {customer.totalOverdue > 0 && (
                      <div className="text-[10px] text-amber-700 font-medium">
                        Overdue: {formatIndianCurrency(customer.totalOverdue)}
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <CustomerStatusBadge status={customer.status} size="sm" />
                  </td>

                  {/* Created Date */}
                  <td className="py-2.5 px-3 whitespace-nowrap text-slate-600">
                    {formatDateDisplay(customer.createdDate)}
                  </td>

                  {/* Action Menu */}
                  <td className="py-2.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="relative inline-block text-left">
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(activeMenuId === customer.id ? null : customer.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded focus:outline-none"
                        title="Actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === customer.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setActiveMenuId(null)}
                          />
                          <div className="absolute right-0 mt-1 w-44 bg-white border border-slate-200 rounded shadow-md z-20 py-1 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onViewCustomer(customer);
                              }}
                              className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-slate-700 hover:bg-slate-50"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>View Profile</span>
                            </button>

                            {canManage && customer.status !== 'ARCHIVED' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onEditCustomer(customer);
                                }}
                                className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-slate-700 hover:bg-slate-50"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                <span>Edit Information</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onViewLoans(customer);
                              }}
                              className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-slate-700 hover:bg-slate-50"
                            >
                              <FileText className="w-3.5 h-3.5 text-slate-500" />
                              <span>View Loans ({customer.activeLoanCount + customer.closedLoanCount})</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onViewHistory(customer);
                              }}
                              className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-slate-700 hover:bg-slate-50"
                            >
                              <History className="w-3.5 h-3.5 text-slate-500" />
                              <span>View Activity History</span>
                            </button>

                            {canManage && (
                              <div className="border-t border-slate-100 my-1 pt-1">
                                {customer.status === 'ARCHIVED' ? (
                                  onRestoreCustomer && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        onRestoreCustomer(customer);
                                      }}
                                      className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-emerald-700 hover:bg-emerald-50 font-medium"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                      <span>Restore Customer</span>
                                    </button>
                                  )
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onArchiveCustomer(customer);
                                    }}
                                    className="w-full text-left px-3 py-1.5 flex items-center gap-2 text-amber-700 hover:bg-amber-50 font-medium"
                                  >
                                    <Archive className="w-3.5 h-3.5" />
                                    <span>Archive Customer</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>
            records | Showing {totalItems > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + pageSize, totalItems)} of {totalItems} entries
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          <span className="px-2 font-medium text-slate-700">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
