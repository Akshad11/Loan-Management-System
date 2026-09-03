import React, { useState, useMemo } from 'react';
import { cn } from '../../utils/formatters';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  SlidersHorizontal,
  Copy,
  Check,
  MoreVertical,
} from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  accessor?: (row: T) => any;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  copyable?: boolean;
  copyValue?: (row: T) => string;
}

export interface DataTableProps<T> {
  id?: string;
  columns: ColumnDef<T>[];
  data: T[];
  searchKey?: string;
  searchPlaceholder?: string;
  pageSizeOptions?: number[];
  initialPageSize?: number;
  onRowClick?: (row: T) => void;
  rowActions?: {
    label: string;
    onClick: (row: T) => void;
    danger?: boolean;
  }[];
  emptyMessage?: string;
  emptySubtext?: string;
  isLoading?: boolean;
  filterComponent?: React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  id,
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search records...',
  pageSizeOptions = [10, 25, 50],
  initialPageSize = 10,
  onRowClick,
  rowActions,
  emptyMessage = 'No records found',
  emptySubtext = 'Try adjusting your search query or filters.',
  isLoading = false,
  filterComponent,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeActionMenu, setActiveActionMenu] = useState<number | null>(null);

  // Copy handler
  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Filter
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const lower = searchTerm.toLowerCase();

    return data.filter((item) => {
      if (searchKey && item[searchKey]) {
        return String(item[searchKey]).toLowerCase().includes(lower);
      }
      // Search all primitive values
      return Object.values(item).some(
        (val) => typeof val === 'string' || typeof val === 'number' ? String(val).toLowerCase().includes(lower) : false
      );
    });
  }, [data, searchTerm, searchKey]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = col.accessor ? col.accessor(a) : a[sortKey];
      const valB = col.accessor ? col.accessor(b) : b[sortKey];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      return sortDirection === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filteredData, sortKey, sortDirection, columns]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const startRecord = sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, sortedData.length);

  return (
    <div id={id} className="bg-white rounded-lg border border-slate-200 shadow-none flex flex-col">
      {/* Top Table Toolbar */}
      <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {filterComponent}
          <div className="text-xs text-slate-500 font-medium tabular-nums hidden sm:block">
            Showing <span className="text-slate-900 font-semibold">{sortedData.length}</span> records
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto min-h-[220px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs font-semibold uppercase tracking-wider">
              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={cn(
                      'py-2.5 px-3.5 whitespace-nowrap',
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                      col.sortable ? 'cursor-pointer select-none hover:bg-slate-100/80' : ''
                    )}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div
                      className={cn(
                        'inline-flex items-center gap-1.5',
                        col.align === 'right' ? 'flex-row-reverse' : ''
                      )}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-slate-900" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-slate-900" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
              {rowActions && <th className="py-2.5 px-3 text-right w-12">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (rowActions ? 1 : 0)} className="py-12 text-center text-slate-500">
                  <div className="inline-flex items-center gap-2 font-medium">
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
                    Loading records...
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (rowActions ? 1 : 0)} className="py-12 text-center text-slate-500">
                  <p className="font-semibold text-slate-700">{emptyMessage}</p>
                  <p className="text-xs text-slate-400 mt-1">{emptySubtext}</p>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={cn(
                    'hover:bg-slate-50/70 transition-colors',
                    onRowClick ? 'cursor-pointer' : ''
                  )}
                >
                  {columns.map((col) => {
                    const value = col.accessor ? col.accessor(row) : row[col.key];
                    const copyText = col.copyValue ? col.copyValue(row) : String(value || '');

                    return (
                      <td
                        key={col.key}
                        className={cn(
                          'py-3 px-3.5 align-middle',
                          col.align === 'right' ? 'text-right font-medium tabular-nums' : col.align === 'center' ? 'text-center' : 'text-left'
                        )}
                      >
                        {col.cell ? (
                          col.cell(row)
                        ) : col.copyable ? (
                          <div className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-800 font-medium">
                            <span>{value}</span>
                            <button
                              type="button"
                              onClick={(e) => handleCopy(copyText, e)}
                              className="p-1 text-slate-400 hover:text-slate-800 rounded transition-colors"
                              title="Copy identifier"
                              aria-label={`Copy ${copyText}`}
                            >
                              {copiedKey === copyText ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="truncate">{value !== undefined && value !== null ? String(value) : '-'}</span>
                        )}
                      </td>
                    );
                  })}

                  {rowActions && (
                    <td className="py-2.5 px-3 text-right align-middle relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveActionMenu(activeActionMenu === rowIdx ? null : rowIdx);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded"
                        aria-label="Row actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeActionMenu === rowIdx && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveActionMenu(null);
                            }}
                          />
                          <div className="absolute right-3 top-8 z-20 w-36 bg-white border border-slate-200 rounded-md shadow-md py-1 text-left">
                            {rowActions.map((action, actionIdx) => (
                              <button
                                key={actionIdx}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionMenu(null);
                                  action.onClick(row);
                                }}
                                className={cn(
                                  'w-full px-3 py-1.5 text-xs text-left hover:bg-slate-50 transition-colors flex items-center',
                                  action.danger ? 'text-rose-700 hover:bg-rose-50 font-medium' : 'text-slate-700'
                                )}
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 sm:p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-slate-800"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span className="text-slate-400 ml-2">|</span>
          <span className="tabular-nums ml-2">
            {startRecord}–{endRecord} of {sortedData.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
            className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            title="First page"
            aria-label="First page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Previous page"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-2 font-medium text-slate-700 tabular-nums">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Next page"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(totalPages)}
            className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Last page"
            aria-label="Last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
