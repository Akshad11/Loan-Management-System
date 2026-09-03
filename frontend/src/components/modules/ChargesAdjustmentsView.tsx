import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShieldAlert,
  Scale,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  FileText,
  History,
  Sliders,
  TrendingDown,
  Building,
} from 'lucide-react';
import { useMockStore } from '../../services/mockService';
import {
  LoanChargeRecord,
  WaiverRequestRecord,
  FinancialAdjustmentRequestRecord,
  ChargeConfigurationRecord,
  ApplyChargePayload,
  RequestWaiverPayload,
  CreateFinancialAdjustmentPayload,
} from '../../types/chargeAdjustmentTypes';
import { INITIAL_CHARGE_CONFIGURATIONS } from '../../config/systemTemplates';
import { formatCurrencyINR } from '../../utils/formatters';
import { ApplyChargeModal } from '../charges/ApplyChargeModal';
import { RequestWaiverModal } from '../charges/RequestWaiverModal';
import { FinancialAdjustmentModal } from '../charges/FinancialAdjustmentModal';
import { WaiverDetailModal } from '../charges/WaiverDetailModal';
import { FinancialTimelineModal } from '../charges/FinancialTimelineModal';

export const ChargesAdjustmentsView: React.FC = () => {
  const store = useMockStore();
  const [activeTab, setActiveTab] = useState<'charges' | 'waivers' | 'adjustments' | 'reversals' | 'configs'>('charges');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isApplyChargeOpen, setIsApplyChargeOpen] = useState<boolean>(false);
  const [isRequestWaiverOpen, setIsRequestWaiverOpen] = useState<boolean>(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState<boolean>(false);
  const [selectedWaiver, setSelectedWaiver] = useState<WaiverRequestRecord | null>(null);
  const [selectedTimelineLoanId, setSelectedTimelineLoanId] = useState<string | null>(null);

  // Reversal confirmation modal state
  const [reversingCharge, setReversingCharge] = useState<LoanChargeRecord | null>(null);
  const [chargeReversalReason, setChargeReversalReason] = useState<string>('');

  const [reversingAdj, setReversingAdj] = useState<FinancialAdjustmentRequestRecord | null>(null);
  const [adjReversalReason, setAdjReversalReason] = useState<string>('');

  const [configs, setConfigs] = useState<ChargeConfigurationRecord[]>(INITIAL_CHARGE_CONFIGURATIONS);

  const currentUser = { id: 'usr_ops_01', name: 'Alex Morgan', roleName: 'Operations Officer' };

  // Fetch from DB or fallback
  const [dbCharges, setDbCharges] = useState<LoanChargeRecord[]>([]);
  const [dbWaivers, setDbWaivers] = useState<WaiverRequestRecord[]>([]);
  const [dbAdjustments, setDbAdjustments] = useState<FinancialAdjustmentRequestRecord[]>([]);
  const [dbReversals, setDbReversals] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [chgRes, wvrRes, adjRes, cfgRes] = await Promise.all([
        fetch('/api/charges').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/waivers').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/adjustments').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/charges/configs').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);

      if (chgRes && chgRes.charges) setDbCharges(chgRes.charges);
      if (wvrRes && wvrRes.waivers) setDbWaivers(wvrRes.waivers);
      if (adjRes && adjRes.adjustments) setDbAdjustments(adjRes.adjustments);
      if (cfgRes && Array.isArray(cfgRes)) setConfigs(cfgRes);
    } catch (err) {
      console.error('Failed to load charge and adjustment records:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loans = store.loanAccounts || [];

  // Handlers
  const handleApplyCharge = async (payload: ApplyChargePayload) => {
    const res = await fetch('/api/charges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to apply charge.');
    }
    await loadData();
    await store.loadFromDatabase();
  };

  const handleRequestWaiver = async (payload: RequestWaiverPayload) => {
    const res = await fetch('/api/waivers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit waiver.');
    }
    await loadData();
  };

  const handleCreateAdjustment = async (payload: CreateFinancialAdjustmentPayload) => {
    const res = await fetch('/api/adjustments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit adjustment.');
    }
    await loadData();
  };

  const handleApproveWaiver = async (waiverId: string, notes?: string) => {
    const res = await fetch(`/api/waivers/${waiverId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        approverId: 'usr_mgr_01',
        approverName: 'Sunita Rao',
        approverRole: 'Branch Credit Committee Head',
        approvalNotes: notes,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Approval failed.');
    }
    await loadData();
  };

  const handleRejectWaiver = async (waiverId: string, reason: string) => {
    const res = await fetch(`/api/waivers/${waiverId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rejectorId: 'usr_mgr_01',
        rejectorName: 'Sunita Rao',
        rejectionReason: reason,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Rejection failed.');
    }
    await loadData();
  };

  const handleApplyWaiver = async (waiverId: string) => {
    const res = await fetch(`/api/waivers/${waiverId}/apply`, {
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
      throw new Error(err.error || 'Apply failed.');
    }
    await loadData();
    await store.loadFromDatabase();
  };

  const handleApproveAdjustment = async (adjId: string) => {
    const res = await fetch(`/api/adjustments/${adjId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        approverId: 'usr_mgr_01',
        approverName: 'Sunita Rao',
        approverRole: 'Branch Manager',
        approvalNotes: 'Approved by Branch Committee.',
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.error || 'Failed to approve adjustment.');
      return;
    }
    await loadData();
  };

  const handleApplyAdjustment = async (adjId: string) => {
    const res = await fetch(`/api/adjustments/${adjId}/apply`, {
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
      alert(err.error || 'Failed to apply adjustment.');
      return;
    }
    await loadData();
    await store.loadFromDatabase();
  };

  const handleExecuteChargeReversal = async () => {
    if (!reversingCharge || !chargeReversalReason.trim()) return;
    try {
      const res = await fetch(`/api/charges/${reversingCharge.id}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: chargeReversalReason,
          reversedBy: currentUser.id,
          reversedByName: currentUser.name,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to reverse charge.');
        return;
      }
      setReversingCharge(null);
      setChargeReversalReason('');
      await loadData();
      await store.loadFromDatabase();
    } catch (err: any) {
      alert(err.message || 'Error executing reversal.');
    }
  };

  const handleExecuteAdjReversal = async () => {
    if (!reversingAdj || !adjReversalReason.trim()) return;
    try {
      const res = await fetch(`/api/adjustments/${reversingAdj.id}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: adjReversalReason,
          reversedBy: currentUser.id,
          reversedByName: currentUser.name,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to reverse adjustment.');
        return;
      }
      setReversingAdj(null);
      setAdjReversalReason('');
      await loadData();
      await store.loadFromDatabase();
    } catch (err: any) {
      alert(err.message || 'Error executing adjustment reversal.');
    }
  };

  // KPIs
  const totalChargesLevied = dbCharges.reduce((sum, c) => sum + Number(c.totalAmount || 0), 0);
  const outstandingCharges = dbCharges
    .filter((c) => c.status === 'APPLIED' || c.status === 'PARTIALLY_PAID')
    .reduce((sum, c) => sum + Number(c.outstandingAmount ?? c.totalAmount ?? 0), 0);
  const pendingWaiversCount = dbWaivers.filter((w) => w.status === 'SUBMITTED' || w.status === 'UNDER_REVIEW').length;
  const approvedWaiversCount = dbWaivers.filter((w) => w.status === 'APPROVED').length;
  const totalWaivedVolume = dbWaivers
    .filter((w) => w.status === 'APPLIED')
    .reduce((sum, w) => sum + Number(w.approvedAmount || w.requestedAmount || 0), 0);
  const pendingAdjustmentsCount = dbAdjustments.filter((a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW').length;

  // Filtered lists
  const filteredCharges = dbCharges.filter((c) => {
    const matchesSearch =
      c.chargeNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.chargeName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredWaivers = dbWaivers.filter((w) => {
    const matchesSearch =
      w.waiverNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredAdjustments = dbAdjustments.filter((a) => {
    const matchesSearch =
      a.adjustmentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.accountNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedTimelineLoan = loans.find((l) => l.id === selectedTimelineLoanId);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Charges, Waivers & Financial Adjustments
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
              Batch 15 Production
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative financial fee engine, structured maker-checker waivers, and non-destructive adjustments
          </p>
        </div>

        {/* Global Action Triggers */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setIsApplyChargeOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5"
          >
            <DollarSign className="w-4 h-4" />
            <span>Apply Fee / Charge</span>
          </button>

          <button
            onClick={() => setIsRequestWaiverOpen(true)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Request Waiver</span>
          </button>

          <button
            onClick={() => setIsAdjustmentOpen(true)}
            className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5"
          >
            <Scale className="w-4 h-4" />
            <span>Financial Adjustment</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Charges Levied</span>
          <span className="text-lg font-black text-slate-900 mt-1 block">{formatCurrencyINR(totalChargesLevied)}</span>
          <span className="text-[10px] text-slate-500">{dbCharges.length} total charges</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">Outstanding Fees</span>
          <span className="text-lg font-black text-rose-700 mt-1 block">{formatCurrencyINR(outstandingCharges)}</span>
          <span className="text-[10px] text-slate-500">Uncollected dues</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Waivers Pending</span>
          <span className="text-lg font-black text-amber-800 mt-1 block">{pendingWaiversCount}</span>
          <span className="text-[10px] text-slate-500">Awaiting committee review</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Waivers Approved</span>
          <span className="text-lg font-black text-blue-800 mt-1 block">{approvedWaiversCount}</span>
          <span className="text-[10px] text-slate-500">Ready to post</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Total Waived</span>
          <span className="text-lg font-black text-emerald-800 mt-1 block">{formatCurrencyINR(totalWaivedVolume)}</span>
          <span className="text-[10px] text-slate-500">Posted relief</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider block">Adjustments Pending</span>
          <span className="text-lg font-black text-teal-800 mt-1 block">{pendingAdjustmentsCount}</span>
          <span className="text-[10px] text-slate-500">Maker-checker queue</span>
        </div>
      </div>

      {/* Tabs & Search Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 pt-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0">
            <button
              onClick={() => {
                setActiveTab('charges');
                setStatusFilter('ALL');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'charges'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Charges & Penalties ({dbCharges.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('waivers');
                setStatusFilter('ALL');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'waivers'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Waiver Requests ({dbWaivers.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('adjustments');
                setStatusFilter('ALL');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'adjustments'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Financial Adjustments ({dbAdjustments.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('configs');
                setStatusFilter('ALL');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                activeTab === 'configs'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Charge Configurations ({configs.length})</span>
            </button>
          </div>

          <div className="flex items-center space-x-3 pb-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search accounts, IDs, customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none w-56"
              />
            </div>

            <button
              onClick={loadData}
              title="Refresh Data"
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Charges & Penalties Table */}
        {activeTab === 'charges' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Charge ID</th>
                  <th className="py-3 px-4">Loan / Customer</th>
                  <th className="py-3 px-4">Charge Name & Type</th>
                  <th className="py-3 px-4 text-right">Base + Tax</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-right">Outstanding</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredCharges.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No charges found.
                    </td>
                  </tr>
                ) : (
                  filteredCharges.map((chg) => (
                    <tr key={chg.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-900">{chg.chargeNumber}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{chg.customerName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{chg.accountNumber}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">{chg.chargeName}</span>
                        <span className="text-[10px] text-slate-400">{chg.sourceEvent || 'MANUAL'}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span>{formatCurrencyINR(chg.amount)}</span>
                        <span className="text-[10px] text-slate-400 block">+{formatCurrencyINR(chg.taxAmount)} GST</span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatCurrencyINR(chg.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-rose-700">
                        {formatCurrencyINR(chg.outstandingAmount ?? chg.totalAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            chg.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : chg.status === 'WAIVED'
                              ? 'bg-amber-100 text-amber-800'
                              : chg.status === 'REVERSED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {chg.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => setSelectedTimelineLoanId(chg.loanId)}
                          title="View Ledger Timeline"
                          className="p-1 text-slate-500 hover:text-indigo-600 transition-colors"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        {chg.status === 'APPLIED' && (
                          <button
                            onClick={() => setReversingCharge(chg)}
                            title="Reverse Charge Non-Destructively"
                            className="p-1 text-rose-500 hover:text-rose-700 transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
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

        {/* Tab 2: Waiver Requests Table */}
        {activeTab === 'waivers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Waiver ID</th>
                  <th className="py-3 px-4">Loan / Customer</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Requested Amount</th>
                  <th className="py-3 px-4">Requester</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredWaivers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No waiver requests found.
                    </td>
                  </tr>
                ) : (
                  filteredWaivers.map((wvr) => (
                    <tr key={wvr.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-900">{wvr.waiverNumber}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{wvr.customerName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{wvr.accountNumber}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {wvr.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-amber-900">
                        {formatCurrencyINR(wvr.requestedAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">{wvr.requestedByName}</span>
                        <span className="text-[10px] text-slate-400">{wvr.requestedByRole}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            wvr.status === 'APPLIED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : wvr.status === 'APPROVED'
                              ? 'bg-blue-100 text-blue-800'
                              : wvr.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {wvr.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        <button
                          onClick={() => setSelectedWaiver(wvr)}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg font-bold text-xs transition-colors"
                        >
                          Inspect & Act
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Financial Adjustments Table */}
        {activeTab === 'adjustments' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Adjustment ID</th>
                  <th className="py-3 px-4">Loan / Customer</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Reason / Ref</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {filteredAdjustments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No financial adjustments found.
                    </td>
                  </tr>
                ) : (
                  filteredAdjustments.map((adj) => (
                    <tr key={adj.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-teal-900">{adj.adjustmentNumber}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{adj.customerName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{adj.accountNumber}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            adj.adjustmentType.includes('CREDIT')
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {adj.adjustmentType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        {formatCurrencyINR(adj.amount)}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate" title={adj.reason}>
                        <span className="font-medium text-slate-700 block truncate">{adj.reason}</span>
                        {adj.reference && <span className="text-[10px] font-mono text-slate-400">{adj.reference}</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            adj.status === 'APPLIED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : adj.status === 'APPROVED'
                              ? 'bg-blue-100 text-blue-800'
                              : adj.status === 'REVERSED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {adj.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1">
                        {adj.status === 'SUBMITTED' && (
                          <button
                            onClick={() => handleApproveAdjustment(adj.id)}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold text-xs transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        {adj.status === 'APPROVED' && (
                          <button
                            onClick={() => handleApplyAdjustment(adj.id)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm transition-colors"
                          >
                            Apply
                          </button>
                        )}
                        {adj.status === 'APPLIED' && (
                          <button
                            onClick={() => setReversingAdj(adj)}
                            title="Reverse Adjustment Non-Destructively"
                            className="p-1 text-rose-500 hover:text-rose-700 transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
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

        {/* Tab 4: Charge Configurations Table */}
        {activeTab === 'configs' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Rule Code</th>
                  <th className="py-3 px-4">Charge Description</th>
                  <th className="py-3 px-4">Calculation Basis</th>
                  <th className="py-3 px-4 text-right">Rate / Value</th>
                  <th className="py-3 px-4 text-right">GST Rate</th>
                  <th className="py-3 px-4">Event Trigger</th>
                  <th className="py-3 px-4">Waivable</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                {configs.map((cfg) => (
                  <tr key={cfg.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{cfg.chargeCode}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{cfg.chargeName}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {cfg.calculationBasis.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      {cfg.calculationBasis.includes('PERCENTAGE') ? `${cfg.rateOrValue}%` : formatCurrencyINR(cfg.rateOrValue)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-700">{cfg.taxPercentage}%</td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-500">{cfg.applicableEvent || 'MANUAL'}</td>
                    <td className="py-3 px-4">
                      <span className={`font-bold ${cfg.isWaivable ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {cfg.isWaivable ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Charge Reversal Dialog */}
      {reversingCharge && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reverse Charge</h3>
                <p className="text-xs text-slate-500">Non-destructive compensating reversal</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              You are about to reverse <strong>{reversingCharge.chargeName}</strong> ({reversingCharge.chargeNumber}) for{' '}
              <strong>{formatCurrencyINR(reversingCharge.outstandingAmount ?? reversingCharge.totalAmount)}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mandatory Reversal Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={chargeReversalReason}
                onChange={(e) => setChargeReversalReason(e.target.value)}
                rows={2}
                placeholder="e.g. Erroneous bounce assessment after bank confirmed technical reversal..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <button
                onClick={() => setReversingCharge(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteChargeReversal}
                disabled={!chargeReversalReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md transition-all"
              >
                Confirm Reversal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjustment Reversal Dialog */}
      {reversingAdj && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reverse Financial Adjustment</h3>
                <p className="text-xs text-slate-500">Compensating ledger reversal</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              You are about to reverse adjustment <strong>{reversingAdj.adjustmentNumber}</strong> ({formatCurrencyINR(reversingAdj.amount)}).
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mandatory Reversal Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={adjReversalReason}
                onChange={(e) => setAdjReversalReason(e.target.value)}
                rows={2}
                placeholder="State audit reason for reversing adjustment..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <button
                onClick={() => setReversingAdj(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAdjReversal}
                disabled={!adjReversalReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md transition-all"
              >
                Confirm Reversal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ApplyChargeModal
        isOpen={isApplyChargeOpen}
        onClose={() => setIsApplyChargeOpen(false)}
        loans={loans}
        configs={configs}
        currentUser={currentUser}
        onSubmit={handleApplyCharge}
      />

      <RequestWaiverModal
        isOpen={isRequestWaiverOpen}
        onClose={() => setIsRequestWaiverOpen(false)}
        loans={loans}
        charges={dbCharges}
        currentUser={currentUser}
        onSubmit={handleRequestWaiver}
      />

      <FinancialAdjustmentModal
        isOpen={isAdjustmentOpen}
        onClose={() => setIsAdjustmentOpen(false)}
        loans={loans}
        currentUser={currentUser}
        onSubmit={handleCreateAdjustment}
      />

      <WaiverDetailModal
        isOpen={!!selectedWaiver}
        onClose={() => setSelectedWaiver(null)}
        waiver={selectedWaiver}
        currentUser={currentUser}
        onApprove={handleApproveWaiver}
        onReject={handleRejectWaiver}
        onApply={handleApplyWaiver}
      />

      <FinancialTimelineModal
        isOpen={!!selectedTimelineLoanId}
        onClose={() => setSelectedTimelineLoanId(null)}
        loan={selectedTimelineLoan || null}
      />
    </div>
  );
};
