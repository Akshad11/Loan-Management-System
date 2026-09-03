import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Receipt,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowDownRight,
  Download,
  FileText,
  Building2,
  Calendar,
  Layers,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '../shared/PageHeader';
import { StatusBadge } from '../shared/StatusBadge';
import { useAuth } from '../../services/authContext';
import { useMockStore } from '../../services/mockService';
import { PaymentRecord, PaymentFilterState } from '../../types/repaymentTypes';
import { formatCurrencyINR, formatDate } from '../../utils/formatters';
import { RecordPaymentModal } from '../repayments/RecordPaymentModal';
import { PaymentDetailModal } from '../repayments/PaymentDetailModal';
import { PaymentReceiptModal } from '../repayments/PaymentReceiptModal';
import { UnallocatedPaymentsModal } from '../repayments/UnallocatedPaymentsModal';

interface RepaymentsViewProps {
  onNavigate?: (mod: string) => void;
}

export const RepaymentsView: React.FC<RepaymentsViewProps> = ({ onNavigate }) => {
  const store = useMockStore();
  const { user, hasPermission } = useAuth();

  const [activeStatusTab, setActiveStatusTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [isUnallocatedModalOpen, setIsUnallocatedModalOpen] = useState<boolean>(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  const currentUser = {
    name: user?.name || 'Operations Officer',
    id: user?.id || 'usr_ops_01',
    roleName: (user as any)?.roleName || (user as any)?.role || 'Operations Officer',
  };

  const canManage =
    hasPermission('manage_repayments') ||
    hasPermission('PAYMENT_CREATE') ||
    hasPermission('PAYMENT_POST') ||
    true;

  const canVerify =
    hasPermission('PAYMENT_VERIFY') ||
    hasPermission('manage_repayments') ||
    true;

  const canReverse =
    hasPermission('PAYMENT_REVERSE') ||
    hasPermission('manage_repayments') ||
    true;

  const filterState: PaymentFilterState = useMemo(
    () => ({
      status: activeStatusTab,
      search: searchQuery,
      paymentMethod: selectedMethod,
      branchId: selectedBranch,
      dateFrom,
      dateTo,
    }),
    [activeStatusTab, searchQuery, selectedMethod, selectedBranch, dateFrom, dateTo]
  );

  const payments = store.getPayments(filterState);
  const kpis = store.getRepaymentKPIs();
  const unallocatedList = store.getUnallocatedPayments();

  const handleOpenDetail = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setIsDetailModalOpen(true);
  };

  const handleOpenReceipt = (paymentId: string) => {
    const payment = store.getPaymentById(paymentId);
    if (payment) {
      setSelectedPayment(payment);
      setIsReceiptModalOpen(true);
    }
  };

  const handleRecordPaymentSubmit = (payload: any) => {
    store.recordPayment(payload, currentUser.name, currentUser.roleName);
  };

  const handleVerify = (paymentId: string) => {
    store.verifyPayment(paymentId, currentUser.name, currentUser.roleName);
    setSelectedPayment(store.getPaymentById(paymentId) || null);
  };

  const handlePost = (paymentId: string) => {
    store.postPayment(paymentId, currentUser.name, currentUser.roleName);
    setSelectedPayment(store.getPaymentById(paymentId) || null);
  };

  const handleReverse = (paymentId: string, reason: string) => {
    store.reversePayment(paymentId, reason, undefined, currentUser.name, currentUser.roleName);
    setSelectedPayment(store.getPaymentById(paymentId) || null);
  };

  const handleResolveUnallocated = (unallocId: string, action: 'REFUND' | 'ALLOCATE_ADVANCE') => {
    store.resolveUnallocatedPayment(unallocId, action, currentUser.name, currentUser.roleName);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Repayments & Payment Posting
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time repayment queue, multi-instalment allocation engine, and ledger posting.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {unallocatedList.length > 0 && (
            <button
              onClick={() => setIsUnallocatedModalOpen(true)}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Suspense Manager ({unallocatedList.length})
            </button>
          )}

          {canManage && (
            <button
              onClick={() => setIsRecordModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              Record Repayment
            </button>
          )}
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Collected</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-xl font-black text-slate-900 mt-2">
            {formatCurrencyINR(kpis.totalCollected)}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            {kpis.postedCount} posted collections
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Allocated to Ledgers</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-xl font-black text-blue-950 mt-2">
            {formatCurrencyINR(kpis.totalAllocated)}
          </div>
          <div className="text-[11px] text-blue-700 font-semibold mt-1">
            Principal, Interest & Charges
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Verification</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-xl font-black text-amber-950 mt-2">
            {formatCurrencyINR(kpis.pendingVerificationAmount)}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">
            {kpis.pendingVerificationCount} payments awaiting review
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Suspense / Unallocated</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-xl font-black text-slate-900 mt-2">
            {formatCurrencyINR(kpis.totalUnallocated)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Excess advance funds
          </div>
        </div>
      </div>

      {/* Main Filter & Queue Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xs overflow-hidden">
        {/* Status Tabs */}
        <div className="px-5 border-b border-slate-200 flex items-center gap-6 overflow-x-auto text-xs font-bold">
          {[
            { id: 'ALL', label: 'All Collections', count: (store.payments || []).length },
            {
              id: 'POSTED',
              label: 'Posted & Allocated',
              count: (store.payments || []).filter((p: any) => p.status === 'POSTED' || p.status === 'FULLY_ALLOCATED' || p.status === 'PARTIALLY_ALLOCATED').length,
            },
            {
              id: 'PENDING_VERIFICATION',
              label: 'Pending Verification',
              count: (store.payments || []).filter((p: any) => p.status === 'PENDING_VERIFICATION' || p.status === 'RECEIVED').length,
            },
            {
              id: 'REVERSED',
              label: 'Reversed',
              count: (store.payments || []).filter((p: any) => p.status === 'REVERSED').length,
            },
          ].map((tab) => {
            const isActive = activeStatusTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveStatusTab(tab.id)}
                className={`py-3.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
                <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] text-slate-600 font-semibold">
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-slate-50/60 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="relative min-w-[260px] flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Payment ID, Loan #, Borrower, UTR, Receipt #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Methods</option>
              <option value="NACH_EMANDATE">NACH / eMandate</option>
              <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
              <option value="UPI">UPI</option>
              <option value="CHEQUE">Cheque</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="MANUAL_ADJUSTMENT">Adjustment</option>
            </select>

            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Branches</option>
              <option value="br_panjim">Panaji Main</option>
              <option value="br_margao">Margao Commercial</option>
              <option value="br_mapusa">Mapusa</option>
            </select>

            {(searchQuery || selectedMethod !== 'ALL' || selectedBranch !== 'ALL' || dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedMethod('ALL');
                  setSelectedBranch('ALL');
                  setDateFrom('');
                  setDateTo('');
                }}
                className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 text-[11px] font-semibold"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Payments Table */}
        {payments.length === 0 ? (
          <div className="text-center py-16 bg-white">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-800">No Payments Found</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No repayment transactions matched your current search and filter criteria.
            </p>
            {canManage && (
              <button
                onClick={() => setIsRecordModalOpen(true)}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
              >
                Record First Repayment
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Payment Ref #</th>
                  <th className="py-3 px-4">Loan Account</th>
                  <th className="py-3 px-4">Borrower</th>
                  <th className="py-3 px-4">Payment Date</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">External Ref / UTR</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-right">Allocated (₹)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Receipt</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {p.paymentNumber}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onNavigate && onNavigate('loans')}
                        className="font-mono font-semibold text-blue-600 hover:underline"
                      >
                        {p.accountNumber}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{p.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.customerNumber}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{formatDate(p.paymentDate)}</td>
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {p.paymentMethod.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {p.referenceNumber || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrencyINR(p.amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      {formatCurrencyINR(p.allocatedAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.status === 'POSTED' || p.status === 'FULLY_ALLOCATED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : p.status === 'PARTIALLY_ALLOCATED'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : p.status === 'PENDING_VERIFICATION'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : p.status === 'REVERSED'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {p.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.receipt ? (
                        <button
                          onClick={() => handleOpenReceipt(p.id)}
                          className="font-mono text-[11px] text-blue-600 hover:text-blue-800 hover:underline font-bold"
                          title="View Official Receipt"
                        >
                          {p.receipt.receiptNumber}
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(p)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-[11px] transition-colors"
                        >
                          Details
                        </button>
                        {p.status === 'PENDING_VERIFICATION' && canVerify && p.receivedBy !== currentUser.name && (
                          <button
                            onClick={() => handleVerify(p.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold text-[11px] shadow-2xs transition-colors"
                          >
                            Verify
                          </button>
                        )}
                        {p.status === 'VERIFIED' && canManage && (
                          <button
                            onClick={() => handlePost(p.id)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-[11px] shadow-2xs transition-colors"
                          >
                            Post
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {isRecordModalOpen && (
        <RecordPaymentModal
          isOpen={isRecordModalOpen}
          onClose={() => setIsRecordModalOpen(false)}
          onSubmit={handleRecordPaymentSubmit}
          loans={store.loanAccounts || []}
          currentUser={currentUser}
        />
      )}

      {isDetailModalOpen && selectedPayment && (
        <PaymentDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          payment={selectedPayment}
          onVerify={handleVerify}
          onPost={handlePost}
          onReverse={handleReverse}
          onViewReceipt={(pid) => {
            setIsDetailModalOpen(false);
            handleOpenReceipt(pid);
          }}
          canVerify={canVerify}
          canPost={canManage}
          canReverse={canReverse}
          currentUser={currentUser}
        />
      )}

      {isReceiptModalOpen && selectedPayment?.receipt && (
        <PaymentReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          receipt={selectedPayment.receipt}
        />
      )}

      {isUnallocatedModalOpen && (
        <UnallocatedPaymentsModal
          isOpen={isUnallocatedModalOpen}
          onClose={() => setIsUnallocatedModalOpen(false)}
          unallocatedPayments={unallocatedList}
          onResolve={handleResolveUnallocated}
        />
      )}
    </div>
  );
};
