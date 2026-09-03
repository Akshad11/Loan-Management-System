import React, { useState, useEffect, useMemo } from 'react';
import {
  RotateCcw,
  Search,
  Filter,
  Plus,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  Building,
  Calendar,
  Layers,
  ArrowRight,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import { useMockStore } from '../../services/mockService';
import { useAuth } from '../../services/authContext';
import {
  RestructuringRequestRecord,
  RestructuringType,
  RestructuringStatus,
  CreateRestructuringPayload,
} from '../../types/restructuringTypes';
import { LoanAccountRecord } from '../../types/loanAccountTypes';
import { formatCurrencyINR, formatDate } from '../../utils/formatters';
import { CreateRestructuringModal } from '../restructuring/CreateRestructuringModal';
import { RestructuringDetailModal } from '../restructuring/RestructuringDetailModal';
import { ScheduleComparisonModal } from '../restructuring/ScheduleComparisonModal';

export const RestructuringView: React.FC = () => {
  const store = useMockStore();
  const { user } = useAuth();

  const currentUser = {
    id: user?.id || 'usr_ops_01',
    name: user?.name || 'Alex Morgan',
    roleName: (user as any)?.roleName || (user as any)?.role || 'Operations Officer',
  };

  const [requests, setRequests] = useState<RestructuringRequestRecord[]>([]);
  const [loans, setLoans] = useState<LoanAccountRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'EFFECTIVE' | 'ELIGIBLE_LOANS'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedLoanForCreate, setSelectedLoanForCreate] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RestructuringRequestRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState<boolean>(false);
  const [comparisonRequest, setComparisonRequest] = useState<RestructuringRequestRecord | null>(null);

  // Fetch real data from server API with store fallback
  const fetchRestructuringData = async () => {
    try {
      const res = await fetch('/api/restructuring');
      if (res.ok) {
        const data = await res.json();
        if (data.requests && data.requests.length > 0) {
          setRequests(data.requests);
        } else {
          setRequests((store.restructuringRequests as RestructuringRequestRecord[]) || []);
        }
      } else {
        setRequests((store.restructuringRequests as RestructuringRequestRecord[]) || []);
      }
    } catch (e) {
      setRequests((store.restructuringRequests as RestructuringRequestRecord[]) || []);
    }
  };

  useEffect(() => {
    fetchRestructuringData();
    setLoans(store.loanAccounts || []);
  }, [store.restructuringRequests, store.loanAccounts]);

  // KPIs
  const kpis = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW').length;
    const approved = requests.filter((r) => r.status === 'APPROVED').length;
    const effective = requests.filter((r) => r.status === 'EFFECTIVE').length;
    const totalExposure = requests
      .filter((r) => r.status === 'EFFECTIVE' || r.status === 'APPROVED')
      .reduce((sum, r) => sum + Number(r.proposedPrincipal || 0), 0);
    const avgEmiDelta =
      requests.length > 0
        ? Math.round(requests.reduce((sum, r) => sum + Number(r.emiDifference || 0), 0) / requests.length)
        : 0;

    return { total, pending, approved, effective, totalExposure, avgEmiDelta };
  }, [requests]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (activeTab === 'PENDING' && !['SUBMITTED', 'UNDER_REVIEW'].includes(r.status)) return false;
      if (activeTab === 'APPROVED' && r.status !== 'APPROVED') return false;
      if (activeTab === 'EFFECTIVE' && r.status !== 'EFFECTIVE') return false;

      if (typeFilter !== 'ALL' && r.requestType !== typeFilter) return false;
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (branchFilter !== 'ALL' && r.branchId !== branchFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchNo = r.requestNumber?.toLowerCase().includes(q);
        const matchAcc = r.accountNumber?.toLowerCase().includes(q);
        const matchCust = r.customerName?.toLowerCase().includes(q);
        if (!matchNo && !matchAcc && !matchCust) return false;
      }

      return true;
    });
  }, [requests, activeTab, typeFilter, statusFilter, branchFilter, searchTerm]);

  // Eligible loans list for restructuring
  const eligibleLoansList = useMemo(() => {
    return loans.filter((l) => {
      if (['CLOSED', 'CANCELLED', 'WRITTEN_OFF'].includes(l.status)) return false;
      if (Number(l.outstandingPrincipal || 0) <= 0) return false;
      const hasActive = requests.some(
        (r) => r.loanId === l.id && ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(r.status)
      );
      return !hasActive;
    });
  }, [loans, requests]);

  // Action Handlers (Server-backed + Optimistic updates)
  const handleCreateSubmit = async (payload: CreateRestructuringPayload) => {
    try {
      const res = await fetch('/api/restructuring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create restructuring request.');
      }

      await fetchRestructuringData();
    } catch (e: any) {
      if (store.createRestructuringRequest) {
        store.createRestructuringRequest(payload as any);
      }
      await fetchRestructuringData();
    }
  };

  const handleStartReview = async (requestId: string) => {
    try {
      await fetch(`/api/restructuring/${requestId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerId: currentUser.id,
          reviewerName: currentUser.name,
          reviewerRole: currentUser.roleName,
        }),
      });
      await fetchRestructuringData();
      if (selectedRequest && selectedRequest.id === requestId) {
        setSelectedRequest({ ...selectedRequest, status: 'UNDER_REVIEW', reviewedByName: currentUser.name });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprove = async (requestId: string, notes?: string) => {
    const res = await fetch(`/api/restructuring/${requestId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        approverId: currentUser.id,
        approverName: currentUser.name,
        approverRole: currentUser.roleName,
        approvalNotes: notes,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Approval failed.');
    }

    await fetchRestructuringData();
    setIsDetailModalOpen(false);
  };

  const handleReject = async (requestId: string, reason: string) => {
    const res = await fetch(`/api/restructuring/${requestId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rejectorId: currentUser.id,
        rejectorName: currentUser.name,
        rejectorRole: currentUser.roleName,
        rejectionReason: reason,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Rejection failed.');
    }

    await fetchRestructuringData();
    setIsDetailModalOpen(false);
  };

  const handleApply = async (requestId: string) => {
    const res = await fetch(`/api/restructuring/${requestId}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.roleName,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to apply restructuring.');
    }

    await fetchRestructuringData();
    setIsDetailModalOpen(false);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'EFFECTIVE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'UNDER_REVIEW':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'SUBMITTED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <RotateCcw className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Loan Restructuring & Rescheduling
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Contractual term adjustments, tenure extensions, rate revisions, and moratorium management (Batch 14)
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedLoanForCreate(null);
            setIsCreateModalOpen(true);
          }}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Restructuring Request</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Requests</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">{kpis.total}</span>
          <span className="text-[10px] text-slate-400">All Pipeline Records</span>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-amber-600 block">Pending Review</span>
          <span className="text-xl font-black text-amber-700 mt-1 block">{kpis.pending}</span>
          <span className="text-[10px] text-amber-500">Awaiting Decision</span>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-blue-600 block">Committee Approved</span>
          <span className="text-xl font-black text-blue-700 mt-1 block">{kpis.approved}</span>
          <span className="text-[10px] text-blue-500">Ready to Execute</span>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-emerald-600 block">Active / Effective</span>
          <span className="text-xl font-black text-emerald-700 mt-1 block">{kpis.effective}</span>
          <span className="text-[10px] text-emerald-500">Active Schedule V2+</span>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 block">Restructured Portfolio</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">{formatCurrencyINR(kpis.totalExposure)}</span>
          <span className="text-[10px] text-slate-400">Total Capital Exposure</span>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 block">Avg Monthly Delta</span>
          <span
            className={`text-xl font-black mt-1 flex items-center space-x-1 ${
              kpis.avgEmiDelta < 0 ? 'text-emerald-600' : 'text-slate-900'
            }`}
          >
            {kpis.avgEmiDelta < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            <span>{formatCurrencyINR(Math.abs(kpis.avgEmiDelta))}</span>
          </span>
          <span className="text-[10px] text-slate-400">Average Relief / Loan</span>
        </div>
      </div>

      {/* Tabs and Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 flex space-x-6 text-xs font-bold text-slate-600 overflow-x-auto">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'ALL' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-900'
            }`}
          >
            All Requests ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab('PENDING')}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'PENDING'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Pending Review ({kpis.pending})
          </button>
          <button
            onClick={() => setActiveTab('APPROVED')}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'APPROVED'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Approved & Ready ({kpis.approved})
          </button>
          <button
            onClick={() => setActiveTab('EFFECTIVE')}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'EFFECTIVE'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Active Restructured ({kpis.effective})
          </button>
          <button
            onClick={() => setActiveTab('ELIGIBLE_LOANS')}
            className={`pb-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'ELIGIBLE_LOANS'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Eligible Loans for Restructuring ({eligibleLoansList.length})
          </button>
        </div>

        {/* Filter Toolbar */}
        {activeTab !== 'ELIGIBLE_LOANS' && (
          <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search request #, loan account, customer name..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Types</option>
              <option value="TENURE_EXTENSION">Tenure Extension</option>
              <option value="MORATORIUM">Moratorium</option>
              <option value="EMI_REDUCTION">EMI Reduction</option>
              <option value="INTEREST_RATE_CHANGE">Interest Rate Change</option>
              <option value="FULL_RESCHEDULING">Full Rescheduling</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="EFFECTIVE">Effective</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        )}

        {/* Main Queue Table */}
        {activeTab !== 'ELIGIBLE_LOANS' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Request #</th>
                  <th className="py-3 px-4">Loan Account</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Strategy Type</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4 text-right">Current EMI</th>
                  <th className="py-3 px-4 text-right">Proposed EMI</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Effective Date</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">{req.requestNumber}</td>
                      <td className="py-3 px-4 font-mono text-slate-900 font-semibold">{req.accountNumber}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{req.customerName}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {req.requestType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                        {formatCurrencyINR(req.currentPrincipalOutstanding)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500">
                        {formatCurrencyINR(req.currentEmiAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-indigo-600">
                        {formatCurrencyINR(req.proposedEmiAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(req.status)}`}>
                          {req.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-600">{formatDate(req.effectiveDate)}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedRequest(req);
                            setIsDetailModalOpen(true);
                          }}
                          className="px-3 py-1 bg-white border border-slate-300 hover:border-indigo-500 hover:text-indigo-600 rounded-lg font-bold text-slate-700 shadow-sm transition-all inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      No restructuring requests found matching current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Eligible Loans Tab */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Account Number</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4 text-right">Outstanding Principal</th>
                  <th className="py-3 px-4 text-right">Current EMI</th>
                  <th className="py-3 px-4 text-center">DPD</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {eligibleLoansList.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{loan.accountNumber}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{loan.customerName}</td>
                    <td className="py-3 px-4 text-slate-600">{loan.productName}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrencyINR(loan.outstandingPrincipal || 0)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600">
                      {formatCurrencyINR(loan.emiAmount || 0)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          loan.dpd > 30 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {loan.dpd} Days
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{loan.branchName || 'Panjim Branch'}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedLoanForCreate(loan.id);
                          setIsCreateModalOpen(true);
                        }}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm inline-flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restructure</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateRestructuringModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        loans={loans}
        initialSelectedLoanId={selectedLoanForCreate}
        currentUser={currentUser}
        onSubmit={handleCreateSubmit}
      />

      <RestructuringDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        request={selectedRequest}
        currentUser={currentUser}
        onStartReview={handleStartReview}
        onApprove={handleApprove}
        onReject={handleReject}
        onApply={handleApply}
        onOpenScheduleComparison={(req) => {
          setComparisonRequest(req);
          setIsComparisonModalOpen(true);
        }}
      />

      <ScheduleComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        request={comparisonRequest}
      />
    </div>
  );
};
