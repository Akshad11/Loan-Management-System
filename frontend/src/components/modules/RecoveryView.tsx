import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  PhoneCall,
  Scale,
  FileText,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  UserCheck,
  Plus,
  Eye,
  Building,
  DollarSign,
  Briefcase,
  AlertOctagon,
} from 'lucide-react';
import { useMockStore } from '../../services/mockService';
import {
  RecoveryCaseRecord,
  RecoveryStage,
  RecoveryPriority,
  LegalReviewRecord,
  LegalCaseRecord,
  LegalNoticeRecord,
  RecordRecoveryActionPayload,
  EscalateToRecoveryPayload,
  RequestLegalReviewPayload,
  CreateLegalNoticePayload,
  CreateLegalCasePayload,
} from '../../types/recoveryTypes';
import { LoanAccountRecord } from '../../types/loanAccountTypes';
import { evaluateRecoveryEligibility } from '../../services/recoveryEngine';
import { formatCurrencyINR, formatDate } from '../../utils/formatters';
import { RecoveryCaseDetailModal } from '../recovery/RecoveryCaseDetailModal';
import { RecordRecoveryActionModal } from '../recovery/RecordRecoveryActionModal';
import { EscalateToRecoveryModal } from '../recovery/EscalateToRecoveryModal';
import { LegalReviewModal } from '../recovery/LegalReviewModal';
import { LegalNoticeModal } from '../recovery/LegalNoticeModal';
import { LegalCaseDetailModal } from '../recovery/LegalCaseDetailModal';

export const RecoveryView: React.FC = () => {
  const store = useMockStore();

  const recoveryCases = store.recoveryCases || [];
  const legalCases = store.legalCases || [];
  const legalNotices = store.legalNotices || [];
  const loanAccounts = store.loanAccounts || [];
  const branches = store.branches || [];

  const [activeTab, setActiveTab] = useState<'QUEUE' | 'LEGAL_CASES' | 'NOTICES' | 'ELIGIBLE_LOANS'>('QUEUE');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');

  // Modal selection states
  const [selectedCase, setSelectedCase] = useState<RecoveryCaseRecord | null>(null);
  const [isCaseDetailOpen, setIsCaseDetailOpen] = useState<boolean>(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState<boolean>(false);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState<boolean>(false);
  const [selectedLoanForEscalation, setSelectedLoanForEscalation] = useState<LoanAccountRecord | null>(null);
  const [isLegalReviewModalOpen, setIsLegalReviewModalOpen] = useState<boolean>(false);
  const [reviewToDecide, setReviewToDecide] = useState<LegalReviewRecord | null>(null);
  const [isLegalNoticeModalOpen, setIsLegalNoticeModalOpen] = useState<boolean>(false);
  const [noticeToView, setNoticeToView] = useState<LegalNoticeRecord | null>(null);
  const [isLegalCaseModalOpen, setIsLegalCaseModalOpen] = useState<boolean>(false);
  const [selectedLegalCase, setSelectedLegalCase] = useState<LegalCaseRecord | null>(null);

  const kpis = store.getRecoveryKPIs();

  // Filtered recovery queue
  const filteredCases = useMemo(() => {
    return recoveryCases.filter((rc) => {
      if (stageFilter !== 'ALL' && rc.recoveryStage !== stageFilter) return false;
      if (priorityFilter !== 'ALL' && rc.priority !== priorityFilter) return false;
      if (branchFilter !== 'ALL' && rc.branchId !== branchFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchNumber = rc.recoveryCaseNumber.toLowerCase().includes(q);
        const matchAccount = rc.accountNumber.toLowerCase().includes(q);
        const matchCustomer = rc.customerName.toLowerCase().includes(q);
        const matchCustNo = rc.customerNumber?.toLowerCase().includes(q);
        if (!matchNumber && !matchAccount && !matchCustomer && !matchCustNo) return false;
      }
      return true;
    });
  }, [recoveryCases, stageFilter, priorityFilter, branchFilter, searchTerm]);

  // Delinquent loans eligible for recovery escalation
  const eligibleLoans = useMemo(() => {
    return loanAccounts.filter((l) => {
      if (l.status === 'CANCELLED' || l.status === 'MATURED' || l.status === 'WRITTEN_OFF') return false;
      // Check if loan already in active recovery
      const alreadyInRecovery = recoveryCases.some(
        (rc) => rc.loanId === l.id && rc.status !== 'CLOSED' && rc.status !== 'CANCELLED' && rc.status !== 'CURED'
      );
      if (alreadyInRecovery) return false;

      const evalRes = evaluateRecoveryEligibility(l, 0, 0);
      return evalRes.isEligible || l.dpd >= 60;
    });
  }, [loanAccounts, recoveryCases]);

  // Handlers
  const handleOpenCaseDetail = (rc: RecoveryCaseRecord) => {
    setSelectedCase(rc);
    setIsCaseDetailOpen(true);
  };

  const handleOpenActionModal = (rc?: RecoveryCaseRecord) => {
    if (rc) setSelectedCase(rc);
    setIsActionModalOpen(true);
  };

  const handleEscalateSubmit = (payload: EscalateToRecoveryPayload) => {
    store.escalateToRecovery(payload, 'Vikram Mehta', 'Head of Credit & Remedial');
  };

  const handleLogActionSubmit = (payload: RecordRecoveryActionPayload) => {
    store.logRecoveryAction(payload, 'Rajesh Naik', 'Senior Recovery Officer');
    if (selectedCase) {
      const updated = store.getRecoveryCaseById(selectedCase.id);
      if (updated) setSelectedCase(updated);
    }
  };

  const handleRequestLegalReview = (payload: RequestLegalReviewPayload) => {
    store.requestLegalReview(payload, 'Rajesh Naik', 'Senior Recovery Officer');
    if (selectedCase) {
      const updated = store.getRecoveryCaseById(selectedCase.id);
      if (updated) setSelectedCase(updated);
    }
  };

  const handleApproveLegalReview = (reviewId: string, approved: boolean, notes?: string) => {
    store.approveLegalReview(reviewId, approved, notes, 'Vikram Mehta', 'Head of Credit & Remedial');
    if (selectedCase) {
      const updated = store.getRecoveryCaseById(selectedCase.id);
      if (updated) setSelectedCase(updated);
    }
  };

  const handleCreateLegalNotice = (payload: CreateLegalNoticePayload) => {
    store.createLegalNotice(payload, 'Sanjay Deshmukh');
    if (selectedCase) {
      const updated = store.getRecoveryCaseById(selectedCase.id);
      if (updated) setSelectedCase(updated);
    }
  };

  const handleApproveLegalNotice = (noticeId: string) => {
    store.approveLegalNotice(noticeId, 'Vikram Mehta');
    if (selectedCase) {
      const updated = store.getRecoveryCaseById(selectedCase.id);
      if (updated) setSelectedCase(updated);
    }
  };

  const handleDispatchLegalNotice = (noticeId: string, trackingNumber?: string, dispatchMode?: string) => {
    store.dispatchLegalNotice(noticeId, trackingNumber, dispatchMode, 'Sanjay Deshmukh');
    if (selectedCase) {
      const updated = store.getRecoveryCaseById(selectedCase.id);
      if (updated) setSelectedCase(updated);
    }
  };

  const handleCreateLegalCase = (payload: CreateLegalCasePayload) => {
    store.createLegalCase(payload, 'Sanjay Deshmukh', 'Legal Officer');
    if (selectedCase) {
      const updated = store.getRecoveryCaseById(selectedCase.id);
      if (updated) setSelectedCase(updated);
    }
  };

  const handleAddLegalCaseEvent = (
    legalCaseId: string,
    eventType: any,
    notes: string,
    referenceNumber?: string,
    nextHearingDate?: string
  ) => {
    store.addLegalCaseEvent(legalCaseId, eventType, notes, referenceNumber, nextHearingDate, 'Sanjay Deshmukh', 'Legal Officer');
    if (selectedCase) {
      const updated = store.getRecoveryCaseById(selectedCase.id);
      if (updated) setSelectedCase(updated);
    }
  };

  const handleResolveCase = (caseId: string, outcome: string, notes?: string) => {
    store.resolveRecoveryCase(caseId, outcome, notes, 'Vikram Mehta');
    if (selectedCase) {
      const updated = store.getRecoveryCaseById(selectedCase.id);
      if (updated) setSelectedCase(updated);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-xs">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              Recovery, Escalations & Remedial Collections
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
              Batch 13
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative non-performing asset remedial management, field investigations, statutory notices & legal proceedings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (eligibleLoans.length > 0) {
                setSelectedLoanForEscalation(eligibleLoans[0]);
                setIsEscalateModalOpen(true);
              } else if (loanAccounts.length > 0) {
                setSelectedLoanForEscalation(loanAccounts[0]);
                setIsEscalateModalOpen(true);
              }
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <ShieldAlert className="w-4 h-4" />
            Escalate Delinquent Loan
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Exposure */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-500 text-xs">Recovery Portfolio Exposure</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-rose-600">
            {formatCurrencyINR(kpis.totalRecoveryExposure)}
          </div>
          <span className="text-[11px] text-slate-500 block">
            {kpis.openCasesCount} active remedial accounts
          </span>
        </div>

        {/* Recovered Amount */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-500 text-xs">Total Collections in Recovery</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-emerald-600">
            {formatCurrencyINR(kpis.totalRecoveredAmount)}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold block">
            Recovery Rate: {kpis.recoveryRatePercent}% of portfolio
          </span>
        </div>

        {/* Critical Cases */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-500 text-xs">Critical / NPA Exposure</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-amber-600">
            {kpis.criticalPriorityCount}
          </div>
          <span className="text-[11px] text-slate-500 block">
            Immediate field visit required
          </span>
        </div>

        {/* Legal Actions */}
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-500 text-xs">Active Legal Court Cases</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-purple-700">
            {kpis.activeLegalCasesCount}
          </div>
          <span className="text-[11px] text-purple-700 font-semibold block">
            {kpis.pendingLegalReviewCount} cases awaiting legal approval
          </span>
        </div>
      </div>

      {/* Tabs & Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
          {/* Main Module Tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('QUEUE')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-colors ${
                activeTab === 'QUEUE'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              Recovery Queue ({filteredCases.length})
            </button>
            <button
              onClick={() => setActiveTab('LEGAL_CASES')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-colors ${
                activeTab === 'LEGAL_CASES'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              Court Cases ({legalCases.length})
            </button>
            <button
              onClick={() => setActiveTab('NOTICES')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-colors ${
                activeTab === 'NOTICES'
                  ? 'bg-blue-800 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              Statutory Notices ({legalNotices.length})
            </button>
            <button
              onClick={() => setActiveTab('ELIGIBLE_LOANS')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-colors ${
                activeTab === 'ELIGIBLE_LOANS'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
              }`}
            >
              Eligible for Escalation ({eligibleLoans.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search case #, account, customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
            />
          </div>
        </div>

        {/* Filter Controls (for Queue) */}
        {activeTab === 'QUEUE' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Recovery Stage
              </label>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
              >
                <option value="ALL">All Stages</option>
                <option value="EARLY_RECOVERY">Early Recovery</option>
                <option value="HARD_RECOVERY">Hard Recovery</option>
                <option value="PRE_LEGAL">Pre-Legal</option>
                <option value="LEGAL_ACTION">Legal Action</option>
                <option value="RESOLVED">Resolved / Cured</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Operating Branch
              </label>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
              >
                <option value="ALL">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Table / Tab Content */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        {activeTab === 'QUEUE' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Case # & Borrower</th>
                  <th className="py-3 px-4">Account & Branch</th>
                  <th className="py-3 px-4">DPD & Risk</th>
                  <th className="py-3 px-4 text-right">Overdue Balance</th>
                  <th className="py-3 px-4 text-right">Total Exposure</th>
                  <th className="py-3 px-4">Stage & Status</th>
                  <th className="py-3 px-4">Assigned Officer</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.length > 0 ? (
                  filteredCases.map((rc) => (
                    <tr
                      key={rc.id}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                      onClick={() => handleOpenCaseDetail(rc)}
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-blue-700 block">
                          {rc.recoveryCaseNumber}
                        </span>
                        <span className="font-semibold text-slate-900 block mt-0.5">
                          {rc.customerName}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-slate-800 font-semibold block">
                          {rc.accountNumber}
                        </span>
                        <span className="text-slate-500 text-[11px] block mt-0.5">
                          {rc.branchName}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">
                          {rc.dpd} DPD
                        </span>
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase mt-0.5 ${
                            rc.priority === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-800'
                              : rc.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {rc.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-bold text-rose-600 block">
                          {formatCurrencyINR(rc.overdueAmount)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-mono font-bold text-slate-900 block">
                          {formatCurrencyINR(rc.totalOutstanding)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 block">
                          {rc.recoveryStage.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5 ${
                            rc.status === 'CURED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rc.status === 'LEGAL_ACTION'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rc.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">
                          {rc.assignedOfficerName || 'Rajesh Naik'}
                        </span>
                        <span className="text-slate-400 text-[10px] block mt-0.5">
                          {rc.assignedTeam || 'Field Recovery'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenActionModal(rc)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                            title="Log Field/Tele Interaction"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenCaseDetail(rc)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                            title="View Case 360"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No recovery cases match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'LEGAL_CASES' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Case # & Type</th>
                  <th className="py-3 px-4">Borrower & Account</th>
                  <th className="py-3 px-4">Court / Forum</th>
                  <th className="py-3 px-4">Court Case #</th>
                  <th className="py-3 px-4 text-right">Claim Amount</th>
                  <th className="py-3 px-4">Next Hearing</th>
                  <th className="py-3 px-4">Advocate</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {legalCases.length > 0 ? (
                  legalCases.map((lc) => (
                    <tr
                      key={lc.id}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedLegalCase(lc);
                        setIsLegalCaseModalOpen(true);
                      }}
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-purple-700 block">
                          {lc.legalCaseNumber}
                        </span>
                        <span className="text-[11px] font-medium text-slate-600 block mt-0.5">
                          {lc.caseType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block">{lc.customerName}</span>
                        <span className="font-mono text-slate-500 text-[11px] block mt-0.5">
                          {lc.accountNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">{lc.courtOrForum}</span>
                        <span className="text-slate-400 text-[10px] block mt-0.5">{lc.jurisdiction}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                        {lc.courtCaseNumber || 'Pending Number'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatCurrencyINR(lc.claimAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-purple-800 block">
                          {lc.nextHearingDate ? formatDate(lc.nextHearingDate) : 'Not Scheduled'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {lc.advocateName || 'In-House'}
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setSelectedLegalCase(lc);
                            setIsLegalCaseModalOpen(true);
                          }}
                          className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg border border-purple-200 transition-colors"
                        >
                          Manage Case
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No formal court cases instituted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'NOTICES' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Notice # & Type</th>
                  <th className="py-3 px-4">Recipient Borrower</th>
                  <th className="py-3 px-4 text-right">Demand Amount</th>
                  <th className="py-3 px-4">Notice Date</th>
                  <th className="py-3 px-4">Cure Expiry Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Prepared By</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {legalNotices.length > 0 ? (
                  legalNotices.map((n) => (
                    <tr
                      key={n.id}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                      onClick={() => {
                        const rc = recoveryCases.find((r) => r.id === n.recoveryCaseId) || recoveryCases[0];
                        setSelectedCase(rc);
                        setNoticeToView(n);
                        setIsLegalNoticeModalOpen(true);
                      }}
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-blue-700 block">{n.noticeNumber}</span>
                        <span className="text-[11px] font-medium text-slate-600 block mt-0.5">
                          {n.noticeType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{n.recipientName}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                        {formatCurrencyINR(n.demandAmount)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">{formatDate(n.noticeDate)}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">{formatDate(n.dueDate)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            n.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : n.status === 'DISPATCHED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {n.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{n.preparedByName}</td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            const rc = recoveryCases.find((r) => r.id === n.recoveryCaseId) || recoveryCases[0];
                            setSelectedCase(rc);
                            setNoticeToView(n);
                            setIsLegalNoticeModalOpen(true);
                          }}
                          className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-300 rounded-lg transition-colors"
                        >
                          View & Act
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No statutory notices drafted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'ELIGIBLE_LOANS' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Account & Borrower</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">DPD & Bucket</th>
                  <th className="py-3 px-4 text-right">Overdue Balance</th>
                  <th className="py-3 px-4 text-right">Total Exposure</th>
                  <th className="py-3 px-4">Eligibility Engine Triggers</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eligibleLoans.length > 0 ? (
                  eligibleLoans.map((loan) => {
                    const evalRes = evaluateRecoveryEligibility(loan, 0, 0);
                    return (
                      <tr key={loan.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-900 block">{loan.accountNumber}</span>
                          <span className="font-semibold text-slate-700 block mt-0.5">{loan.customerName}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{loan.branchName}</td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-rose-600 block">{loan.dpd} DPD</span>
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800 uppercase mt-0.5 inline-block">
                            {loan.dpdBucket}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                          {formatCurrencyINR(loan.overdueAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {formatCurrencyINR(loan.totalOutstanding)}
                        </td>
                        <td className="py-3 px-4">
                          <ul className="list-disc pl-3 text-[11px] text-slate-600 space-y-0.5">
                            {evalRes.triggers.slice(0, 2).map((t, idx) => (
                              <li key={idx}>{t}</li>
                            ))}
                          </ul>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedLoanForEscalation(loan);
                              setIsEscalateModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-2xs transition-colors flex items-center gap-1 ml-auto"
                          >
                            <ShieldAlert className="w-3 h-3" />
                            Escalate
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No un-escalated loans qualify for recovery at this time.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedCase && isCaseDetailOpen && (
        <RecoveryCaseDetailModal
          isOpen={isCaseDetailOpen}
          onClose={() => setIsCaseDetailOpen(false)}
          recoveryCase={selectedCase}
          onOpenActionModal={() => setIsActionModalOpen(true)}
          onOpenLegalReviewModal={(rev) => {
            setReviewToDecide(rev || null);
            setIsLegalReviewModalOpen(true);
          }}
          onOpenLegalNoticeModal={(not) => {
            setNoticeToView(not || null);
            setIsLegalNoticeModalOpen(true);
          }}
          onOpenLegalCaseModal={(lc) => {
            setSelectedLegalCase(lc || null);
            setIsLegalCaseModalOpen(true);
          }}
          onResolveCase={handleResolveCase}
          currentUser={{ id: 'usr_vikram', name: 'Vikram Mehta', roleName: 'Head of Credit & Remedial' }}
        />
      )}

      {/* Action Logging Modal */}
      {selectedCase && (
        <RecordRecoveryActionModal
          isOpen={isActionModalOpen}
          onClose={() => setIsActionModalOpen(false)}
          recoveryCase={selectedCase}
          onSubmit={handleLogActionSubmit}
          currentUser={{ id: 'usr_rajesh', name: 'Rajesh Naik', roleName: 'Senior Recovery Officer' }}
        />
      )}

      {/* Escalation Modal */}
      {selectedLoanForEscalation && (
        <EscalateToRecoveryModal
          isOpen={isEscalateModalOpen}
          onClose={() => {
            setIsEscalateModalOpen(false);
            setSelectedLoanForEscalation(null);
          }}
          loan={selectedLoanForEscalation}
          onSubmit={handleEscalateSubmit}
          currentUser={{ id: 'usr_vikram', name: 'Vikram Mehta', roleName: 'Head of Credit & Remedial' }}
        />
      )}

      {/* Legal Review Modal */}
      {selectedCase && (
        <LegalReviewModal
          isOpen={isLegalReviewModalOpen}
          onClose={() => {
            setIsLegalReviewModalOpen(false);
            setReviewToDecide(null);
          }}
          recoveryCase={selectedCase}
          reviewToDecide={reviewToDecide}
          onRequest={handleRequestLegalReview}
          onDecide={handleApproveLegalReview}
          currentUser={{ id: 'usr_vikram', name: 'Vikram Mehta', roleName: 'Head of Credit & Remedial' }}
        />
      )}

      {/* Legal Notice Modal */}
      {selectedCase && (
        <LegalNoticeModal
          isOpen={isLegalNoticeModalOpen}
          onClose={() => {
            setIsLegalNoticeModalOpen(false);
            setNoticeToView(null);
          }}
          recoveryCase={selectedCase}
          noticeToView={noticeToView}
          onCreate={handleCreateLegalNotice}
          onApprove={handleApproveLegalNotice}
          onDispatch={handleDispatchLegalNotice}
          currentUser={{ id: 'usr_sanjay', name: 'Sanjay Deshmukh', roleName: 'Legal Officer' }}
        />
      )}

      {/* Legal Case Modal */}
      {selectedCase && (
        <LegalCaseDetailModal
          isOpen={isLegalCaseModalOpen}
          onClose={() => {
            setIsLegalCaseModalOpen(false);
            setSelectedLegalCase(null);
          }}
          legalCase={selectedLegalCase}
          recoveryCaseId={selectedCase.id}
          claimDefaultAmount={selectedCase.totalOutstanding}
          onCreate={handleCreateLegalCase}
          onAddEvent={handleAddLegalCaseEvent}
          currentUser={{ id: 'usr_sanjay', name: 'Sanjay Deshmukh', roleName: 'Legal Officer' }}
        />
      )}
    </div>
  );
};
