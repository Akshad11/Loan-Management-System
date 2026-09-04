// Priority LMS Batch 5 — Real-time Banking Operations Dashboard
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Banknote,
  ArrowUpRight,
  ArrowDownLeft,
  AlertOctagon,
  RefreshCw,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  Search,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { formatCurrencyINR } from '../../utils/formatters';

interface OpsMetrics {
  pendingDisbursementsCount: number;
  pendingDisbursementsAmount: number;
  failedDisbursementsCount: number;
  processingTransactionsCount: number;
  todayDisbursementAmount: number;
  todayDisbursementCount: number;
  todayRepaymentAmount: number;
  todayRepaymentCount: number;
  failedPaymentsCount: number;
  pendingReconciliationCount: number;
  totalUnallocatedSuspense: number;
  totalReversalsCount: number;
}

interface OpsException {
  id: string;
  type: string;
  severity: string;
  reference: string;
  title: string;
  detail: string;
  timestamp: string;
}

interface UnallocatedItem {
  id: string;
  paymentId: string;
  loanId: string;
  customerId: string;
  totalAmount: number;
  remainingAmount: number;
  reason?: string;
}

export const OperationsDashboardView: React.FC = () => {
  const [metrics, setMetrics] = useState<OpsMetrics | null>(null);
  const [exceptions, setExceptions] = useState<OpsException[]>([]);
  const [unallocatedQueue, setUnallocatedQueue] = useState<UnallocatedItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isReconciling, setIsReconciling] = useState<boolean>(false);
  const [reconMessage, setReconMessage] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/operations/dashboard');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setExceptions(data.exceptions || []);
        setUnallocatedQueue(data.unallocatedQueue || []);
      }
    } catch (err) {
      console.error('Failed to load operations metrics:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRunReconciliation = async (type: 'DISBURSEMENT' | 'REPAYMENT') => {
    setIsReconciling(true);
    setReconMessage(null);
    try {
      const res = await fetch('/api/reconciliation/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (res.ok) {
        setReconMessage(
          `3-Way Reconciliation ${data.batchNumber} Completed: ${data.matchedCount} Matched, ${data.mismatchCount} Discrepancies found.`
        );
        fetchDashboardData();
      } else {
        setReconMessage(`Reconciliation Error: ${data.error || 'Failed'}`);
      }
    } catch (err: any) {
      setReconMessage(`Reconciliation Error: ${err.message}`);
    } finally {
      setIsReconciling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Banking & Treasury Operations</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time liquidity, payout queue, automated repayment clearing, and 3-way reconciliation ledger.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleRunReconciliation('DISBURSEMENT')}
            disabled={isReconciling}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition shadow-xs disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            {isReconciling ? 'Reconciling...' : 'Run 3-Way Recon'}
          </button>

          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {reconMessage && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
          {reconMessage}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Disbursements */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Today Payouts</span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {formatCurrencyINR(metrics?.todayDisbursementAmount || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {metrics?.todayDisbursementCount || 0} successfully settled transactions
            </p>
          </div>
        </div>

        {/* Card 2: Today's Repayments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Today Collections</span>
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {formatCurrencyINR(metrics?.todayRepaymentAmount || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {metrics?.todayRepaymentCount || 0} receipts posted & GL allocated
            </p>
          </div>
        </div>

        {/* Card 3: Pending Payout Queue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Payouts</span>
            <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {formatCurrencyINR(metrics?.pendingDisbursementsAmount || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {metrics?.pendingDisbursementsCount || 0} tranches awaiting checker authorization
            </p>
          </div>
        </div>

        {/* Card 4: Unallocated Suspense */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Suspense Account</span>
            <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {formatCurrencyINR(metrics?.totalUnallocatedSuspense || 0)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Excess collections awaiting manual/advance allocation
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Status Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Failed Disbursements</div>
              <div className="text-sm font-bold text-slate-900">
                {metrics?.failedDisbursementsCount || 0} failed payouts
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Recon Exceptions</div>
              <div className="text-sm font-bold text-slate-900">
                {metrics?.pendingReconciliationCount || 0} items pending resolution
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Total Reversals</div>
              <div className="text-sm font-bold text-slate-900">
                {metrics?.totalReversalsCount || 0} compensating entries
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exceptions & Action Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Critical Operational Exceptions</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Items requiring immediate treasury or operations officer investigation.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {exceptions.length} Active Items
          </span>
        </div>

        {exceptions.length === 0 ? (
          <div className="p-8 text-center">
            <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="text-sm font-bold text-slate-900">All Operations Systems Healthy</div>
            <p className="text-xs text-slate-500 mt-0.5">
              Zero failed payouts or unhandled reconciliation discrepancies.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Type / Severity</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exceptions.map((ex) => (
                  <tr key={ex.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ex.severity === 'HIGH'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {ex.severity}
                        </span>
                        <span className="font-semibold text-slate-700">{ex.type}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{ex.reference}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{ex.title}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{ex.detail}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => alert(`Investigating exception: ${ex.reference}`)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800"
                      >
                        Investigate &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Unallocated Suspense Queue */}
      {unallocatedQueue.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900">Unallocated Suspense Queue</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Payments received with excess amounts held in GL 2002 Suspense.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Payment ID</th>
                  <th className="py-3 px-4">Loan Account</th>
                  <th className="py-3 px-4">Total Received</th>
                  <th className="py-3 px-4">Suspense Balance</th>
                  <th className="py-3 px-4">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unallocatedQueue.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{u.paymentId.substring(0, 12)}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{u.loanId}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{formatCurrencyINR(u.totalAmount)}</td>
                    <td className="py-3 px-4 font-black text-purple-700">{formatCurrencyINR(u.remainingAmount)}</td>
                    <td className="py-3 px-4 text-slate-500">{u.reason || 'Excess amount over total outstanding dues'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
