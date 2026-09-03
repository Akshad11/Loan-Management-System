import React from 'react';
import { CreditAssessmentRecord } from '../../types/creditTypes';
import { ShieldCheck, AlertOctagon, FileCheck2, Clock, Search } from 'lucide-react';

interface CreditHistoryTabProps {
  assessment: CreditAssessmentRecord;
}

export const CreditHistoryTab: React.FC<CreditHistoryTabProps> = ({
  assessment,
}) => {
  const history = assessment.creditHistory;

  if (!history) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-xs text-slate-400">
        No credit bureau pull records found for this applicant.
      </div>
    );
  }

  const isGoodScore = (history.bureauScore || 0) >= 700;
  const isSevereDpd = (history.recentDpdDays || 0) >= 30;

  return (
    <div className="space-y-6">
      {/* Bureau Score Overview Banner */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                {history.bureauName}
              </h3>
            </div>
            <span className="text-xs text-slate-500">Report Pulled: {history.scoreDate}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Bureau Score</span>
              <span className="text-2xl font-bold text-slate-900">{history.bureauScore}</span>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded font-bold border ${
                isGoodScore
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}
            >
              {history.scoreBand}
            </span>
          </div>
        </div>

        {/* 6 Grid Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 pt-4 text-xs">
          <div>
            <span className="text-slate-500 block mb-1">Active Accounts</span>
            <span className="font-bold text-slate-900 text-sm">{history.activeAccountsCount}</span>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">Closed Accounts</span>
            <span className="font-medium text-slate-800 text-sm">{history.closedAccountsCount}</span>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">Delinquent (DPD &gt; 0)</span>
            <span className={`font-bold text-sm ${history.delinquenciesCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {history.delinquenciesCount}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">Max Recent DPD</span>
            <span className={`font-bold text-sm ${isSevereDpd ? 'text-rose-600' : 'text-emerald-700'}`}>
              {history.recentDpdDays} Days
            </span>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">Write-offs / Settlements</span>
            <span className={`font-bold text-sm ${history.writeOffsCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {history.writeOffsCount}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">Enquiries (Last 6m)</span>
            <span className="font-medium text-slate-800 text-sm">{history.enquiriesLast6Months}</span>
          </div>
        </div>
      </div>

      {/* Negative Indicators & Red Flags if present */}
      {history.negativeIndicators && history.negativeIndicators.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-xs">
          <div className="flex items-center gap-2 text-rose-800 font-bold uppercase mb-2">
            <AlertOctagon className="w-4 h-4 text-rose-600" />
            Credit Bureau Cautionary Markers
          </div>
          <ul className="list-disc list-inside space-y-1 text-rose-700">
            {history.negativeIndicators.map((neg, i) => (
              <li key={i}>{neg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Detailed Bureau Accounts Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-slate-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase">
              Credit Facility Tradeline History
            </h4>
          </div>
          <span className="text-xs text-slate-500">
            {history.accounts?.length || 0} Registered Tradelines
          </span>
        </div>

        {history.accounts && history.accounts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Institution & Facility</th>
                  <th className="px-4 py-2.5">Opened Date</th>
                  <th className="px-4 py-2.5">Sanctioned</th>
                  <th className="px-4 py-2.5">Current Balance</th>
                  <th className="px-4 py-2.5">DPD Status</th>
                  <th className="px-4 py-2.5">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {history.accounts.map((acc, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{acc.lender}</div>
                      <div className="text-[11px] text-slate-500">{acc.accountType}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{acc.openDate}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                      ₹{acc.sanctionedAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      ₹{acc.currentBalance.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          acc.maxDpd === 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {acc.maxDpd === 0 ? '0 DPD (Clean)' : `${acc.maxDpd} DPD`}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[11px] font-medium ${
                          acc.status === 'STANDARD'
                            ? 'text-emerald-700'
                            : 'text-slate-500'
                        }`}
                      >
                        {acc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400">
            No detailed tradelines recorded in bureau feed.
          </div>
        )}
      </div>
    </div>
  );
};
