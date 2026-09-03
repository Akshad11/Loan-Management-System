import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Download,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  History,
  TrendingUp,
  FileSpreadsheet,
} from 'lucide-react';
import { LoanAccountRecord, RepaymentScheduleVersion, ScheduleItemStatus } from '../../types/loanAccountTypes';
import { formatCurrencyINR, formatDate } from '../../utils/formatters';

interface ScheduleTabProps {
  loan: LoanAccountRecord;
  onCreateNewVersion?: () => void;
  canManageSchedule?: boolean;
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({
  loan,
  onCreateNewVersion,
  canManageSchedule = true,
}) => {
  const versions = loan.scheduleVersions || [];
  const [selectedVersionNumber, setSelectedVersionNumber] = useState<number>(
    loan.currentScheduleVersion || 1
  );

  const currentVersion = useMemo(() => {
    return (
      versions.find((v) => v.version === selectedVersionNumber) ||
      versions[0] || {
        version: 1,
        reason: 'Initial Schedule',
        totalInstalments: loan.totalInstalments,
        totalPrincipal: loan.originalPrincipal,
        totalInterest: 0,
        totalAmount: loan.originalPrincipal,
        status: 'ACTIVE',
      }
    );
  }, [versions, selectedVersionNumber, loan]);

  const schedules = useMemo(() => {
    if (selectedVersionNumber === loan.currentScheduleVersion && loan.schedules) {
      return loan.schedules;
    }
    return currentVersion.schedules || loan.schedules || [];
  }, [selectedVersionNumber, loan, currentVersion]);

  // Aggregate totals
  const totalPrincipalScheduled = schedules.reduce((s, r) => s + r.principalDue, 0);
  const totalInterestScheduled = schedules.reduce((s, r) => s + r.interestDue, 0);
  const totalFeesScheduled = schedules.reduce((s, r) => s + r.feesDue, 0);
  const totalAmountScheduled = schedules.reduce((s, r) => s + r.instalmentAmount, 0);
  const totalPaidSoFar = schedules.reduce((s, r) => s + r.totalPaid, 0);
  const totalOutstandingRemaining = schedules.reduce((s, r) => s + r.outstandingAmount, 0);

  const getStatusBadge = (status: ScheduleItemStatus) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            PAID
          </span>
        );
      case 'DUE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            DUE NOW
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
            OVERDUE
          </span>
        );
      case 'PARTIALLY_PAID':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            PARTIAL
          </span>
        );
      case 'WAIVED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            WAIVED
          </span>
        );
      case 'FUTURE':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
            FUTURE
          </span>
        );
    }
  };

  const handleExportCsv = () => {
    const csvRows = [
      [
        'Instalment #',
        'Due Date',
        'Opening Principal',
        'Principal Due',
        'Interest Due',
        'Fees Due',
        'Total Due',
        'Principal Paid',
        'Interest Paid',
        'Total Paid',
        'Outstanding',
        'Closing Principal',
        'Status',
        'DPD',
      ],
      ...schedules.map((r) => [
        r.instalmentNumber,
        r.dueDate,
        r.openingPrincipal,
        r.principalDue,
        r.interestDue,
        r.feesDue,
        r.instalmentAmount,
        r.principalPaid,
        r.interestPaid,
        r.totalPaid,
        r.outstandingAmount,
        r.closingPrincipal,
        r.status,
        r.dpd,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `repayment_schedule_${loan.accountNumber}_v${selectedVersionNumber}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Version Selector Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-700">Schedule Version:</span>
          </div>
          <select
            value={selectedVersionNumber}
            onChange={(e) => setSelectedVersionNumber(Number(e.target.value))}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            {versions.map((v) => (
              <option key={v.id || v.version} value={v.version}>
                Version {v.version} ({v.status}) — {v.reason}
              </option>
            ))}
          </select>

          {selectedVersionNumber === loan.currentScheduleVersion && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Active Current
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {canManageSchedule && (
            <button
              onClick={onCreateNewVersion}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <History className="w-3.5 h-3.5" />
              Restructure / Version Schedule
            </button>
          )}

          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            Export Schedule (CSV)
          </button>
        </div>
      </div>

      {/* Summary KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Principal</span>
          <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
            {formatCurrencyINR(totalPrincipalScheduled, false)}
          </div>
          <span className="text-[10px] text-slate-400">{schedules.length} Instalments</span>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Interest</span>
          <div className="text-sm font-bold text-amber-700 font-mono mt-0.5">
            {formatCurrencyINR(totalInterestScheduled, false)}
          </div>
          <span className="text-[10px] text-amber-600 font-mono">{loan.interestRate.toFixed(2)}% p.a.</span>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Fees</span>
          <div className="text-sm font-bold text-slate-800 font-mono mt-0.5">
            {formatCurrencyINR(totalFeesScheduled, false)}
          </div>
          <span className="text-[10px] text-slate-400">Per instalment</span>
        </div>

        <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg shadow-xs">
          <span className="text-[10px] uppercase font-bold text-blue-900">Total Payable</span>
          <div className="text-sm font-bold text-blue-900 font-mono mt-0.5">
            {formatCurrencyINR(totalAmountScheduled, false)}
          </div>
          <span className="text-[10px] text-blue-700">Principal + Interest</span>
        </div>

        <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-lg shadow-xs">
          <span className="text-[10px] uppercase font-bold text-emerald-900">Total Collected</span>
          <div className="text-sm font-bold text-emerald-800 font-mono mt-0.5">
            {formatCurrencyINR(totalPaidSoFar, false)}
          </div>
          <span className="text-[10px] text-emerald-700">Settled to date</span>
        </div>

        <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-lg shadow-xs">
          <span className="text-[10px] uppercase font-bold text-purple-900">Outstanding Due</span>
          <div className="text-sm font-bold text-purple-900 font-mono mt-0.5">
            {formatCurrencyINR(totalOutstandingRemaining, false)}
          </div>
          <span className="text-[10px] text-purple-700">Unsettled Balance</span>
        </div>
      </div>

      {/* Repayment Schedule Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Amortization & Repayment Schedule Table
            </h4>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Frequency: <strong>{loan.repaymentFrequency}</strong> • Method: <strong>{loan.interestMethod.replace(/_/g, ' ')}</strong>
          </span>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-xs border-b border-slate-200 z-10">
              <tr className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3 text-right">Opening Principal</th>
                <th className="py-2.5 px-3 text-right">Principal Due</th>
                <th className="py-2.5 px-3 text-right">Interest Due</th>
                <th className="py-2.5 px-3 text-right">Fees</th>
                <th className="py-2.5 px-3 text-right font-bold text-slate-900">Instalment Due</th>
                <th className="py-2.5 px-3 text-right text-emerald-700">Amount Paid</th>
                <th className="py-2.5 px-3 text-right">Outstanding</th>
                <th className="py-2.5 px-3 text-right">Closing Principal</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">DPD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {schedules.map((row) => (
                <tr
                  key={row.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    row.status === 'PAID'
                      ? 'bg-emerald-50/20'
                      : row.status === 'DUE'
                      ? 'bg-amber-50/30 font-semibold'
                      : row.status === 'OVERDUE'
                      ? 'bg-rose-50/30'
                      : ''
                  }`}
                >
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{row.instalmentNumber}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-900 whitespace-nowrap">{formatDate(row.dueDate)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                    {formatCurrencyINR(row.openingPrincipal, false)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                    {formatCurrencyINR(row.principalDue, false)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-700">
                    {formatCurrencyINR(row.interestDue, false)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                    {row.feesDue > 0 ? formatCurrencyINR(row.feesDue, false) : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-700">
                    {formatCurrencyINR(row.instalmentAmount, false)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700">
                    {row.totalPaid > 0 ? formatCurrencyINR(row.totalPaid, false) : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-900">
                    {formatCurrencyINR(row.outstandingAmount, false)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                    {formatCurrencyINR(row.closingPrincipal, false)}
                  </td>
                  <td className="py-2.5 px-3 text-center">{getStatusBadge(row.status)}</td>
                  <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-500">
                    {row.dpd > 0 ? <span className="font-bold text-rose-600">{row.dpd}</span> : '0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
