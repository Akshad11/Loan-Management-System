'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../services/authContext';
import {
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Building,
  ShieldCheck,
  Calendar,
  DollarSign,
  PieChart,
  ChevronRight,
  User,
  Users,
  FileText,
  AlertOctagon,
} from 'lucide-react';

interface BureauAnalysisTabProps {
  applicationId: string;
  primaryApplicant: {
    id: string;
    name: string;
    panMasked?: string;
  };
  coApplicants?: {
    id: string;
    customerId: string;
    customerName: string;
    panMasked?: string;
    relationship: string;
  }[];
  readOnly?: boolean;
}

export const BureauAnalysisTab: React.FC<BureauAnalysisTabProps> = ({
  applicationId,
  primaryApplicant,
  coApplicants = [],
  readOnly = false,
}) => {
  const { user, hasPermission } = useAuth();
  const [selectedApplicantId, setSelectedApplicantId] = useState<string>(primaryApplicant.id);
  const [selectedApplicantType, setSelectedApplicantType] = useState<'PRIMARY' | 'CO_APPLICANT'>('PRIMARY');
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPulling, setIsPulling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const canRequest = hasPermission('bureau.request') || hasPermission('manage_system_settings');
  const canRefresh = hasPermission('bureau.refresh') || hasPermission('manage_system_settings');

  // Load bureau reports for this application
  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/bureau`, {
        headers: { 'x-user-id': user?.id || '' },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load bureau reports');
      }
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [applicationId, user?.id]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Current active report for the selected applicant
  const activeReport = reports.find(
    (r) => r.applicantId === selectedApplicantId || (selectedApplicantType === 'PRIMARY' && r.applicantType === 'PRIMARY')
  );

  const handlePullBureau = async (forceRefresh: boolean = false) => {
    setIsPulling(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/bureau`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          applicantId: selectedApplicantId,
          applicantType: selectedApplicantType,
          forceRefresh,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to request bureau report');
      }

      const data = await res.json();
      setSuccessMsg(
        forceRefresh
          ? 'Credit bureau report refreshed successfully!'
          : 'Credit bureau report retrieved successfully!'
      );
      await fetchReports();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsPulling(false);
    }
  };

  const selectedName =
    selectedApplicantType === 'PRIMARY'
      ? primaryApplicant.name
      : coApplicants.find((ca) => ca.id === selectedApplicantId || ca.customerId === selectedApplicantId)?.customerName || 'Co-Applicant';

  const getScoreColor = (score?: number | null) => {
    if (!score) return 'text-slate-400';
    if (score >= 800) return 'text-emerald-600';
    if (score >= 740) return 'text-teal-600';
    if (score >= 680) return 'text-blue-600';
    if (score >= 600) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getScoreBg = (score?: number | null) => {
    if (!score) return 'bg-slate-50 border-slate-200';
    if (score >= 740) return 'bg-emerald-50/70 border-emerald-200';
    if (score >= 680) return 'bg-blue-50/70 border-blue-200';
    if (score >= 600) return 'bg-amber-50/70 border-amber-200';
    return 'bg-rose-50/70 border-rose-200';
  };

  return (
    <div className="space-y-6">
      {/* APPLICANT SELECTOR HEADER */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Applicant:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSelectedApplicantId(primaryApplicant.id);
                setSelectedApplicantType('PRIMARY');
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                selectedApplicantType === 'PRIMARY'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{primaryApplicant.name}</span>
              <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-200 font-mono">
                Primary
              </span>
            </button>

            {coApplicants.map((ca) => {
              const isSelected = selectedApplicantId === ca.id || selectedApplicantId === ca.customerId;
              return (
                <button
                  key={ca.id}
                  type="button"
                  onClick={() => {
                    setSelectedApplicantId(ca.id);
                    setSelectedApplicantType('CO_APPLICANT');
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isSelected && selectedApplicantType === 'CO_APPLICANT'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{ca.customerName}</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    ({ca.relationship})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Refresh / Pull Action Button */}
        {!readOnly && (
          <div className="flex items-center gap-2">
            {activeReport ? (
              <button
                type="button"
                onClick={() => handlePullBureau(true)}
                disabled={isPulling || !canRefresh}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPulling ? 'animate-spin' : ''}`} />
                <span>{isPulling ? 'Refreshing...' : 'Refresh Bureau'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handlePullBureau(false)}
                disabled={isPulling || !canRequest}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-xs disabled:opacity-50"
              >
                <Search className={`w-3.5 h-3.5 ${isPulling ? 'animate-spin' : ''}`} />
                <span>{isPulling ? 'Requesting CIBIL...' : 'Pull CIBIL Report'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* MAIN REPORT VIEW */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span>Loading credit bureau intelligence...</span>
        </div>
      ) : !activeReport ? (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center space-y-4 bg-slate-50/50">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">No Bureau Report Retrieved</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              A credit information report (CIR) has not been pulled yet for <strong>{selectedName}</strong>. Request a real-time CIBIL TransUnion bureau inquiry to analyze creditworthiness.
            </p>
          </div>
          {!readOnly && canRequest && (
            <button
              type="button"
              onClick={() => handlePullBureau(false)}
              disabled={isPulling}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <Search className="w-4 h-4" />
              <span>Pull CIBIL Report Now</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* SCORE BANNER */}
          <div className={`p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-5 ${getScoreBg(activeReport.score)}`}>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white shadow-sm border border-slate-200 flex flex-col items-center justify-center shrink-0">
                <span className={`text-2xl font-black font-mono leading-none ${getScoreColor(activeReport.score)}`}>
                  {activeReport.score || 'N/A'}
                </span>
                <span className="text-[10px] font-bold text-slate-400 mt-0.5">300 - 900</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{selectedName}</h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/80 border border-slate-200 text-slate-700">
                    {activeReport.scoreBand || 'FAIR'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Ref: {activeReport.referenceNumber || 'N/A'}
                  </span>
                </div>
                <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>Provider: <strong>{activeReport.provider} TransUnion</strong></span>
                  <span>Report Date: <strong>{new Date(activeReport.scoreDate || activeReport.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>
                  <span>Status: <strong className="text-emerald-700">{activeReport.status}</strong></span>
                </div>
              </div>
            </div>

            {/* Score History Trend Sparkline */}
            {activeReport.scoreHistory && Array.isArray(activeReport.scoreHistory) && (
              <div className="bg-white/80 border border-slate-200 p-3 rounded-lg flex flex-col items-end shrink-0">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Score Trend (Past 12 Months)
                </div>
                <div className="flex items-end gap-1.5 h-10">
                  {activeReport.scoreHistory.map((pt: any, i: number) => {
                    const heightPercent = Math.max(15, Math.min(100, ((pt.score - 500) / 400) * 100));
                    return (
                      <div key={i} className="flex flex-col items-center gap-0.5 group relative">
                        <div
                          className="w-4 bg-blue-600 rounded-t-xs transition-all hover:bg-blue-800"
                          style={{ height: `${heightPercent}%` }}
                        />
                        <span className="text-[9px] text-slate-400 font-mono">{pt.month.slice(0, 3)}</span>
                        <div className="absolute bottom-12 hidden group-hover:block bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded shadow-md whitespace-nowrap z-10 font-mono">
                          {pt.score} ({pt.month})
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* KEY METRICS 4-GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Total Outstanding Debt</div>
              <div className="text-base font-bold text-slate-900 font-mono mt-1">
                ₹{Number(activeReport.totalOutstanding || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                <span>Secured: ₹{Number(activeReport.securedExposure || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Overdue Amount</div>
              <div className={`text-base font-bold font-mono mt-1 ${activeReport.totalOverdue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                ₹{Number(activeReport.totalOverdue || 0).toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {activeReport.totalOverdue > 0 ? 'Delinquency Flagged' : 'No Overdue Balances'}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Credit Trade Lines</div>
              <div className="text-base font-bold text-slate-900 font-mono mt-1">
                {activeReport.activeAccounts} Active / {activeReport.totalAccounts} Total
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {activeReport.creditCardAccounts} Credit Cards • {activeReport.closedAccounts} Closed
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase">Delinquencies & DPD</div>
              <div className="text-base font-bold text-slate-900 font-mono mt-1 flex items-center gap-2">
                <span className={activeReport.dpd90PlusCount > 0 ? 'text-rose-600' : 'text-slate-900'}>
                  90+ DPD: {activeReport.dpd90PlusCount || 0}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                30+ DPD: {activeReport.dpd30PlusCount || 0} • Settled: {activeReport.settlementsCount || 0}
              </div>
            </div>
          </div>

          {/* RISK INDICATORS / REMARKS */}
          {activeReport.riskIndicators && Array.isArray(activeReport.riskIndicators) && activeReport.riskIndicators.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Bureau Risk Indicators & Underwriter Notes</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeReport.riskIndicators.map((indicator: string, idx: number) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-medium flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    {indicator}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* TRADE LINES / CREDIT ACCOUNTS TABLE */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-600" />
                <h4 className="text-xs font-bold text-slate-900">Trade Line Accounts Summary</h4>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                {activeReport.creditAccounts?.length || 0} Reported Accounts
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/50 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Account / Type</th>
                    <th className="px-4 py-2.5">Lender</th>
                    <th className="px-4 py-2.5 text-right">Sanctioned</th>
                    <th className="px-4 py-2.5 text-right">Current Balance</th>
                    <th className="px-4 py-2.5 text-right">Overdue</th>
                    <th className="px-4 py-2.5 text-center">Status</th>
                    <th className="px-4 py-2.5 text-center">DPD Bucket</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(activeReport.creditAccounts || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                        No credit accounts reported by bureau.
                      </td>
                    </tr>
                  ) : (
                    activeReport.creditAccounts.map((acc: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{acc.accountType}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{acc.accountNumberMasked}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{acc.lenderName}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          ₹{Number(acc.sanctionedAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-900">
                          ₹{Number(acc.currentBalance || 0).toLocaleString('en-IN')}
                        </td>
                        <td className={`px-4 py-3 text-right font-mono font-bold ${acc.overdueAmount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                          ₹{Number(acc.overdueAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              acc.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {acc.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-mono">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                              acc.dpdBucket === '0'
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {acc.dpdBucket}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* RECENT CREDIT ENQUIRIES TABLE */}
          {activeReport.enquiries && Array.isArray(activeReport.enquiries) && activeReport.enquiries.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-2xs">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-slate-600" />
                  <h4 className="text-xs font-bold text-slate-900">Recent Credit Inquiries</h4>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  {activeReport.enquiries.length} Inquiries Recorded
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50/50 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Lender</th>
                      <th className="px-4 py-2">Purpose</th>
                      <th className="px-4 py-2 text-right">Requested Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {activeReport.enquiries.map((enq: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-mono text-slate-500">{enq.date}</td>
                        <td className="px-4 py-2.5 font-semibold text-slate-900">{enq.lender}</td>
                        <td className="px-4 py-2.5 text-slate-600">{enq.purpose}</td>
                        <td className="px-4 py-2.5 text-right font-mono text-slate-900">
                          ₹{Number(enq.amount || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
