import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Landmark,
  Calendar,
  AlertCircle,
  TrendingUp,
  FileText,
  User,
  ShieldAlert,
  Clock,
  ArrowUpDown,
  Building2,
  CheckCircle2,
  Layers,
  Plus,
} from 'lucide-react';
import { LoanAccountRecord, LoanFilterState, LoanAccountStatus } from '../../types/loanAccountTypes';
import { formatCurrencyINR, formatDate } from '../../utils/formatters';
import { BookLoanModal } from './BookLoanModal';
import { useMockStore } from '../../services/mockService';

interface LoansQueueViewProps {
  loans: LoanAccountRecord[];
  onSelectLoan: (loan: LoanAccountRecord) => void;
  onNavigateModule?: (moduleName: string) => void;
}

export const LoansQueueView: React.FC<LoansQueueViewProps> = ({
  loans,
  onSelectLoan,
  onNavigateModule,
}) => {
  const store = useMockStore();
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [selectedProduct, setSelectedProduct] = useState<string>('ALL');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [selectedDpdBucket, setSelectedDpdBucket] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof LoanAccountRecord>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter logic
  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      // Tab filter
      if (activeTab === 'ACTIVE' && loan.status !== 'ACTIVE') return false;
      if (activeTab === 'OVERDUE' && (loan.status !== 'OVERDUE' && loan.dpd === 0)) return false;
      if (activeTab === 'PARTIALLY_DISBURSED' && loan.status !== 'PARTIALLY_DISBURSED') return false;
      if (activeTab === 'CLOSED' && loan.status !== 'CLOSED') return false;
      if (activeTab === 'PENDING_ACTIVATION' && loan.status !== 'PENDING_ACTIVATION') return false;

      // Product filter
      if (selectedProduct !== 'ALL' && loan.productCode !== selectedProduct) return false;

      // Branch filter
      if (selectedBranch !== 'ALL' && loan.branchId !== selectedBranch) return false;

      // DPD Bucket filter
      if (selectedDpdBucket !== 'ALL' && loan.dpdBucket !== selectedDpdBucket) return false;

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesNumber = loan.accountNumber.toLowerCase().includes(query);
        const matchesName = loan.customerName.toLowerCase().includes(query);
        const matchesCustNum = (loan.customerNumber || '').toLowerCase().includes(query);
        const matchesAppNum = (loan.applicationNumber || '').toLowerCase().includes(query);
        const matchesMobile = (loan.customerMobile || '').toLowerCase().includes(query);
        if (!matchesNumber && !matchesName && !matchesCustNum && !matchesAppNum && !matchesMobile) {
          return false;
        }
      }

      return true;
    });
  }, [loans, activeTab, selectedProduct, selectedBranch, selectedDpdBucket, searchTerm]);

  // Sort logic
  const sortedLoans = useMemo(() => {
    return [...filteredLoans].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') valA = (valA as string).toLowerCase();
      if (typeof valB === 'string') valB = (valB as string).toLowerCase();

      if (valA! < valB!) return sortDirection === 'asc' ? -1 : 1;
      if (valA! > valB!) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredLoans, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedLoans.length / pageSize) || 1;
  const paginatedLoans = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedLoans.slice(start, start + pageSize);
  }, [sortedLoans, currentPage, pageSize]);

  // KPIs
  const totalActivePrincipal = loans
    .filter((l) => l.status === 'ACTIVE' || l.status === 'PARTIALLY_DISBURSED')
    .reduce((sum, l) => sum + l.principalOutstanding, 0);
  const totalOverdue = loans.reduce((sum, l) => sum + (l.overdueAmount || 0), 0);
  const totalLoansCount = loans.length;
  const overdueCount = loans.filter((l) => l.dpd > 0 || l.status === 'OVERDUE').length;

  const handleSort = (field: keyof LoanAccountRecord) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getStatusBadgeClass = (status: LoanAccountStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PARTIALLY_DISBURSED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'OVERDUE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'CLOSED':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'PENDING_ACTIVATION':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getDpdBadge = (dpd: number) => {
    if (dpd === 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          0 DPD
        </span>
      );
    }
    if (dpd <= 30) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-50 text-amber-700 border border-amber-200">
          {dpd} DPD (SMA-0)
        </span>
      );
    }
    if (dpd <= 60) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-orange-50 text-orange-700 border border-orange-200">
          {dpd} DPD (SMA-1)
        </span>
      );
    }
    if (dpd <= 90) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200">
          {dpd} DPD (SMA-2)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-600 text-white border border-rose-700 animate-pulse">
        {dpd} DPD (NPA)
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Loan Accounts & Servicing</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time loan portfolio servicing, schedule versioning, and repayment management
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              // Export CSV
              const csvRows = [
                ['Loan Number', 'Customer', 'Product', 'Original Principal', 'Outstanding Principal', 'Interest Rate', 'EMI', 'Next Due Date', 'DPD', 'Status'],
                ...loans.map((l) => [
                  l.accountNumber,
                  l.customerName,
                  l.productName,
                  l.originalPrincipal,
                  l.principalOutstanding,
                  l.interestRate,
                  l.emiAmount,
                  l.nextDueDate,
                  l.dpd,
                  l.status,
                ]),
              ];
              const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `loan_portfolio_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export Portfolio
          </button>
          <button
            id="book-new-loan-btn"
            onClick={() => setIsBookModalOpen(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Book New Loan
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Outstanding Portfolio</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-slate-900 font-mono">
              {formatCurrencyINR(totalActivePrincipal, false)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across {totalLoansCount} total loan accounts</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Delinquent / Overdue</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-rose-600 font-mono">
              {formatCurrencyINR(totalOverdue, false)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">{overdueCount} account(s) past due date</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Repayment Collection Health</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-emerald-700 font-mono">
              {totalLoansCount > 0 ? (((totalLoansCount - overdueCount) / totalLoansCount) * 100).toFixed(1) : 100}%
            </div>
            <div className="text-[11px] text-emerald-600 mt-0.5">Performing Standard (SMA-0) loans</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Live Facilities</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold text-slate-900 font-mono">{totalLoansCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Automated eMandate enabled</div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Status Filter Tabs */}
        <div className="border-b border-slate-200 px-4 pt-3 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {[
              { id: 'ALL', label: 'All Loans', count: loans.length },
              { id: 'ACTIVE', label: 'Active', count: loans.filter((l) => l.status === 'ACTIVE').length },
              { id: 'PARTIALLY_DISBURSED', label: 'Partially Disbursed', count: loans.filter((l) => l.status === 'PARTIALLY_DISBURSED').length },
              { id: 'OVERDUE', label: 'Overdue / Delinquent', count: loans.filter((l) => l.dpd > 0 || l.status === 'OVERDUE').length },
              { id: 'CLOSED', label: 'Closed / Matured', count: loans.filter((l) => l.status === 'CLOSED').length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {tab.label}
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    activeTab === tab.id ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Search & Select Filters */}
        <div className="p-4 border-b border-slate-200 bg-white flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Loan #, Borrower Name, Customer ID, App #, or Mobile..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Product filter */}
            <select
              value={selectedProduct}
              onChange={(e) => {
                setSelectedProduct(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Products</option>
              <option value="PROD-PL-001">Personal Loan - Prime</option>
              <option value="PROD-BL-001">Business Facility</option>
              <option value="PROD-AL-002">Auto Loan</option>
              <option value="PROD-HL-001">Home Loan</option>
            </select>

            {/* DPD bucket */}
            <select
              value={selectedDpdBucket}
              onChange={(e) => {
                setSelectedDpdBucket(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All DPD Ranges</option>
              <option value="CURRENT">0 DPD (Current)</option>
              <option value="1-30 DPD">1-30 DPD</option>
              <option value="31-60 DPD">31-60 DPD</option>
              <option value="61-90 DPD">61-90 DPD</option>
              <option value="90+ DPD">90+ DPD (NPA)</option>
            </select>
          </div>
        </div>

        {/* Real Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th
                  onClick={() => handleSort('accountNumber')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Loan Account #
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('customerName')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Borrower
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Product</th>
                <th
                  onClick={() => handleSort('originalPrincipal')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    Original Principal
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('principalOutstanding')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    Outstanding Principal
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Interest Rate</th>
                <th
                  onClick={() => handleSort('emiAmount')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    EMI / Instalment
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('nextDueDate')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    Next Due Date
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">DPD</th>
                <th className="py-3 px-4 text-right">Overdue Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {paginatedLoans.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-500">
                    <Landmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div className="font-semibold text-slate-700">No loan accounts found</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Try adjusting your search criteria or filter options.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedLoans.map((loan) => (
                  <tr
                    key={loan.id}
                    onClick={() => onSelectLoan(loan)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {loan.accountNumber}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {loan.sanctionNumber || loan.applicationNumber || 'Direct'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{loan.customerName}</div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {loan.customerNumber} {loan.customerMobile ? `• ${loan.customerMobile}` : ''}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-slate-800 font-medium">{loan.productName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{loan.productCode}</div>
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                      {formatCurrencyINR(loan.originalPrincipal, false)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">
                      {formatCurrencyINR(loan.principalOutstanding, false)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {loan.interestRate.toFixed(2)}% p.a.
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                      {formatCurrencyINR(loan.emiAmount, false)}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-700">
                      <div>{formatDate(loan.nextDueDate)}</div>
                      <div className="text-[10px] text-slate-400">Freq: {loan.repaymentFrequency}</div>
                    </td>

                    <td className="py-3 px-4 text-center">{getDpdBadge(loan.dpd)}</td>

                    <td className="py-3 px-4 text-right font-mono">
                      {loan.overdueAmount > 0 ? (
                        <span className="font-bold text-rose-600">{formatCurrencyINR(loan.overdueAmount, false)}</span>
                      ) : (
                        <span className="text-slate-400">₹0</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusBadgeClass(
                          loan.status
                        )}`}
                      >
                        {loan.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectLoan(loan)}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-md text-xs font-semibold transition-all shadow-xs"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <span className="font-semibold text-slate-900">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-semibold text-slate-900">
              {Math.min(currentPage * pageSize, sortedLoans.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-900">{sortedLoans.length}</span> loan accounts
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Previous
            </button>
            <span className="px-3 py-1 font-mono text-[11px] text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <BookLoanModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        customers={store.customers || []}
        products={store.loanProductsConfig || []}
        branches={store.branches || []}
        onBookLoan={(data) => store.createLoanAccount(data)}
      />
    </div>
  );
};
