import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Handshake,
  ShieldCheck,
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Eye,
  FileText,
  DollarSign,
  TrendingDown,
  Building,
  CheckCheck,
} from 'lucide-react';
import { useMockLMSStore } from '../../services/mockService';
import {
  LoanClosureRequestRecord,
  NocRecordType,
  ClosureKPIsData,
  CreateForeclosurePayload,
  ProposeSettlementPayload,
  ReconcileClosePayload,
} from '../../types/closureTypes';
import { INITIAL_CLOSURE_REQUESTS, INITIAL_NOCS } from '../../data/closureData';
import { CreateForeclosureModal } from '../closures/CreateForeclosureModal';
import { ProposeSettlementModal } from '../closures/ProposeSettlementModal';
import { ClosureReconcileModal } from '../closures/ClosureReconcileModal';
import { NocCertificateModal } from '../closures/NocCertificateModal';
import { formatCurrencyINR } from '../../utils/formatters';

import { useAuth } from '../../services/authContext';

export const ClosuresNocView: React.FC = () => {
  const store = useMockLMSStore();
  const { user } = useAuth();
  const loans = store.getLoanAccounts();
  const currentUser = {
    id: user?.id || 'usr_ops_01',
    name: user?.name || 'Alex Morgan',
    roleName: user?.roleTitle || 'Operations Officer',
  };

  const [activeTab, setActiveTab] = useState<'FORECLOSURES' | 'SETTLEMENTS' | 'CLOSED_LOANS' | 'NOCS'>('FORECLOSURES');
  const [closureRequests, setClosureRequests] = useState<LoanClosureRequestRecord[]>(INITIAL_CLOSURE_REQUESTS);
  const [nocRecords, setNocRecords] = useState<NocRecordType[]>(INITIAL_NOCS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal States
  const [isForeclosureModalOpen, setIsForeclosureModalOpen] = useState<boolean>(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState<boolean>(false);
  const [reconcileRequest, setReconcileRequest] = useState<LoanClosureRequestRecord | null>(null);
  const [selectedNoc, setSelectedNoc] = useState<NocRecordType | null>(null);

  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Fetch from Server API if available
  const fetchClosureData = async () => {
    try {
      const res = await fetch('/api/closures');
      if (res.ok) {
        const data = await res.json();
        if (data.requests && data.requests.length > 0) {
          setClosureRequests(data.requests);
        }
      }
      const nocRes = await fetch('/api/noc');
      if (nocRes.ok) {
        const nocData = await nocRes.json();
        if (nocData.nocs && nocData.nocs.length > 0) {
          setNocRecords(nocData.nocs);
        }
      }
    } catch (e) {
      // Fallback to local memory state
    }
  };

  useEffect(() => {
    fetchClosureData();
  }, []);

  // Handler: Create Foreclosure
  const handleCreateForeclosure = async (payload: CreateForeclosurePayload) => {
    try {
      const res = await fetch('/api/closures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, closureType: 'FORECLOSURE' }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate quote');
      }

      const created = await res.json();
      setClosureRequests((prev) => [created, ...prev]);
      setFeedbackBanner({
        type: 'success',
        message: `Foreclosure quote ${created.requestNumber} generated successfully!`,
      });
      fetchClosureData();
    } catch (err: any) {
      setFeedbackBanner({ type: 'error', message: err.message });
      throw err;
    }
  };

  // Handler: Propose Settlement
  const handleProposeSettlement = async (payload: ProposeSettlementPayload) => {
    try {
      const res = await fetch('/api/closures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, closureType: 'SETTLEMENT' }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit settlement proposal');
      }

      const created = await res.json();
      setClosureRequests((prev) => [created, ...prev]);
      setFeedbackBanner({
        type: 'success',
        message: `Settlement proposal ${created.requestNumber} submitted for committee review.`,
      });
      fetchClosureData();
    } catch (err: any) {
      setFeedbackBanner({ type: 'error', message: err.message });
      throw err;
    }
  };

  // Handler: Approve Request (Maker-Checker)
  const handleApproveRequest = async (requestId: string) => {
    try {
      const res = await fetch(`/api/closures/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approverId: currentUser.id,
          approverName: currentUser.name,
          approverRole: currentUser.roleName,
          approvalNotes: 'Approved by Committee.',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Approval failed');
      }

      setFeedbackBanner({
        type: 'success',
        message: `Closure request approved successfully. Ready for payment reconciliation.`,
      });
      fetchClosureData();
    } catch (err: any) {
      setFeedbackBanner({ type: 'error', message: err.message });
    }
  };

  // Handler: Reconcile & Close Loan
  const handleReconcileClose = async (payload: ReconcileClosePayload) => {
    try {
      const res = await fetch(`/api/closures/${payload.closureRequestId}/reconcile-close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Reconciliation failed');
      }

      const result = await res.json();
      setFeedbackBanner({
        type: 'success',
        message: `Loan account closed successfully! No Objection Certificate (NOC) generated.`,
      });
      fetchClosureData();
      if (result.noc) {
        setSelectedNoc(result.noc);
      }
    } catch (err: any) {
      setFeedbackBanner({ type: 'error', message: err.message });
      throw err;
    }
  };

  // Handler: Issue NOC
  const handleIssueNoc = async (nocId: string, deliveryMethod: string) => {
    try {
      const res = await fetch(`/api/noc/${nocId}/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issuedBy: currentUser.name,
          approvedBy: 'Branch Credit Committee Head',
          deliveryMethod,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to issue NOC');
      }

      const updated = await res.json();
      setSelectedNoc(updated);
      setFeedbackBanner({
        type: 'success',
        message: `NOC ${updated.nocNumber} officially approved and issued!`,
      });
      fetchClosureData();
    } catch (err: any) {
      setFeedbackBanner({ type: 'error', message: err.message });
    }
  };

  // Computed KPIs
  const activeQuotesCount = closureRequests.filter(
    (r) => r.closureType === 'FORECLOSURE' && ['SUBMITTED', 'APPROVED', 'PAYMENT_PENDING'].includes(r.status)
  ).length;
  const pendingSettlementsCount = closureRequests.filter(
    (r) => r.closureType === 'SETTLEMENT' && ['SUBMITTED', 'UNDER_REVIEW'].includes(r.status)
  ).length;
  const closedLoansCount = closureRequests.filter((r) => r.status === 'CLOSED').length;
  const totalConcessionsGranted = closureRequests
    .filter((r) => r.status === 'CLOSED')
    .reduce((sum, r) => sum + Number(r.concessionAmount || 0), 0);
  const pendingNocsCount = nocRecords.filter((n) => n.status === 'READY' || n.status === 'GENERATED').length;
  const issuedNocsCount = nocRecords.filter((n) => n.status === 'ISSUED').length;

  // Filtered Lists
  const filteredRequests = closureRequests.filter((r) => {
    if (activeTab === 'FORECLOSURES' && r.closureType !== 'FORECLOSURE') return false;
    if (activeTab === 'SETTLEMENTS' && r.closureType !== 'SETTLEMENT') return false;
    if (activeTab === 'CLOSED_LOANS' && r.status !== 'CLOSED') return false;

    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = r.requestNumber.toLowerCase().includes(q);
      const matchAcc = r.accountNumber.toLowerCase().includes(q);
      const matchCust = r.customerName.toLowerCase().includes(q);
      return matchNum || matchAcc || matchCust;
    }

    return true;
  });

  const filteredNocs = nocRecords.filter((n) => {
    if (statusFilter !== 'ALL' && n.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        n.nocNumber.toLowerCase().includes(q) ||
        n.accountNumber.toLowerCase().includes(q) ||
        n.customerName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Settlement, Foreclosure & NOC</h1>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-emerald-300">
              Batch 16 Production
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Authoritative early prepayment quotes, one-time settlements, atomic financial closure & official NOCs
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsForeclosureModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all flex items-center space-x-2"
          >
            <Calculator className="w-4 h-4" />
            <span>+ Request Foreclosure</span>
          </button>

          <button
            onClick={() => setIsSettlementModalOpen(true)}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 transition-all flex items-center space-x-2"
          >
            <Handshake className="w-4 h-4" />
            <span>+ Propose Settlement</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackBanner && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-sm ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedbackBanner.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            )}
            <span className="font-semibold">{feedbackBanner.message}</span>
          </div>
          <button
            onClick={() => setFeedbackBanner(null)}
            className="text-xs font-bold text-slate-500 hover:text-slate-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Aggregate KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Active Quotes</span>
            <Calculator className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{activeQuotesCount}</div>
          <span className="text-[10px] text-blue-700 font-semibold">Valid 7-day quotes</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Pending OTS</span>
            <Handshake className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{pendingSettlementsCount}</div>
          <span className="text-[10px] text-amber-700 font-semibold">Under committee review</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Closed Accounts</span>
            <CheckCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{closedLoansCount}</div>
          <span className="text-[10px] text-emerald-700 font-semibold">Reconciled to ₹0.00</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Concessions</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-lg font-black text-slate-900">{formatCurrencyINR(totalConcessionsGranted)}</div>
          <span className="text-[10px] text-rose-700 font-semibold">Approved write-offs</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Pending NOCs</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{pendingNocsCount}</div>
          <span className="text-[10px] text-purple-700 font-semibold">Ready for generation</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Issued NOCs</span>
            <Award className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{issuedNocsCount}</div>
          <span className="text-[10px] text-teal-700 font-semibold">Signed certificates</span>
        </div>
      </div>

      {/* Main Filter & Tabs Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 bg-slate-50/70 px-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex space-x-1 py-2">
            <button
              onClick={() => {
                setActiveTab('FORECLOSURES');
                setStatusFilter('ALL');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'FORECLOSURES'
                  ? 'bg-white text-blue-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Foreclosure Quotes</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('SETTLEMENTS');
                setStatusFilter('ALL');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'SETTLEMENTS'
                  ? 'bg-white text-amber-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Handshake className="w-3.5 h-3.5" />
              <span>Distressed Settlements (OTS)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('CLOSED_LOANS');
                setStatusFilter('ALL');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'CLOSED_LOANS'
                  ? 'bg-white text-emerald-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Closed Accounts Ledger</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('NOCS');
                setStatusFilter('ALL');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                activeTab === 'NOCS'
                  ? 'bg-white text-purple-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>NOC Certificates</span>
            </button>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex items-center space-x-2 py-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search account, number, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs w-64 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="PAYMENT_PENDING">Payment Pending</option>
              <option value="CLOSED">Closed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Tab 1, 2, 3: Closure Requests Table */}
        {activeTab !== 'NOCS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Request Number</th>
                  <th className="px-4 py-3">Loan / Customer</th>
                  <th className="px-4 py-3">Total Exposure</th>
                  <th className="px-4 py-3">Payable Amount</th>
                  <th className="px-4 py-3">Concession / Fees</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Valid / Due Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                      No records found matching current criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {req.requestNumber}
                        <span className="block text-[10px] font-sans font-medium text-slate-400">
                          {req.closureType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{req.customerName}</span>
                        <span className="font-mono text-[11px] text-slate-500">{req.accountNumber}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {formatCurrencyINR(req.totalExposure)}
                      </td>
                      <td className="px-4 py-3 font-black text-blue-950">
                        {formatCurrencyINR(req.finalPayableAmount)}
                      </td>
                      <td className="px-4 py-3">
                        {Number(req.concessionAmount) > 0 ? (
                          <span className="text-rose-700 font-bold">
                            -{formatCurrencyINR(req.concessionAmount)} (OTS)
                          </span>
                        ) : Number(req.foreclosureChargeAmount) > 0 ? (
                          <span className="text-slate-600 font-medium">
                            +{formatCurrencyINR(req.foreclosureChargeAmount)} fee
                          </span>
                        ) : (
                          <span className="text-slate-400">₹0</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === 'CLOSED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'APPROVED'
                              ? 'bg-blue-100 text-blue-800'
                              : req.status === 'PAYMENT_PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : req.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        {req.quoteValidUntil || req.effectiveDate}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5">
                        {/* Action: Approve */}
                        {['SUBMITTED', 'UNDER_REVIEW'].includes(req.status) && (
                          <button
                            onClick={() => handleApproveRequest(req.id)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors"
                          >
                            Approve
                          </button>
                        )}

                        {/* Action: Reconcile & Close */}
                        {['APPROVED', 'PAYMENT_PENDING'].includes(req.status) && (
                          <button
                            onClick={() => setReconcileRequest(req)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow transition-colors"
                          >
                            Reconcile & Close
                          </button>
                        )}

                        {/* Action: View NOC if closed */}
                        {req.status === 'CLOSED' && (
                          <button
                            onClick={() => {
                              const foundNoc = nocRecords.find(
                                (n) => n.loanId === req.loanId || n.closureRequestId === req.id
                              );
                              if (foundNoc) setSelectedNoc(foundNoc);
                            }}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold transition-colors"
                          >
                            View NOC
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: NOC Certificates Table */}
        {activeTab === 'NOCS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">NOC Number</th>
                  <th className="px-4 py-3">Customer / Account</th>
                  <th className="px-4 py-3">Closure Type</th>
                  <th className="px-4 py-3">Closure Date</th>
                  <th className="px-4 py-3">Total Recovered</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredNocs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                      No No-Objection Certificates issued yet.
                    </td>
                  </tr>
                ) : (
                  filteredNocs.map((noc) => (
                    <tr key={noc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {noc.nocNumber}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{noc.customerName}</span>
                        <span className="font-mono text-[11px] text-slate-500">{noc.accountNumber}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{noc.closureType}</td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{noc.closureDate}</td>
                      <td className="px-4 py-3 font-bold text-emerald-800">
                        {formatCurrencyINR(noc.totalRecoveredAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            noc.status === 'ISSUED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {noc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setSelectedNoc(noc)}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow transition-colors"
                        >
                          Open Certificate
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateForeclosureModal
        isOpen={isForeclosureModalOpen}
        onClose={() => setIsForeclosureModalOpen(false)}
        loans={loans}
        currentUser={currentUser}
        onSubmit={handleCreateForeclosure}
      />

      <ProposeSettlementModal
        isOpen={isSettlementModalOpen}
        onClose={() => setIsSettlementModalOpen(false)}
        loans={loans}
        currentUser={currentUser}
        onSubmit={handleProposeSettlement}
      />

      <ClosureReconcileModal
        isOpen={!!reconcileRequest}
        onClose={() => setReconcileRequest(null)}
        request={reconcileRequest}
        currentUser={currentUser}
        onReconcile={handleReconcileClose}
      />

      <NocCertificateModal
        isOpen={!!selectedNoc}
        onClose={() => setSelectedNoc(null)}
        noc={selectedNoc}
        currentUser={currentUser}
        onIssueNoc={handleIssueNoc}
      />
    </div>
  );
};
