import React, { useState } from 'react';
import { X, Layers, ArrowRight, CheckCircle2, History, Calendar } from 'lucide-react';
import { RestructuringRequestRecord } from '../../types/restructuringTypes';
import { formatCurrencyINR, formatDate } from '../../utils/formatters';

interface ScheduleComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: RestructuringRequestRecord | null;
  historicalSchedules?: any[];
  restructuredSchedules?: any[];
}

export const ScheduleComparisonModal: React.FC<ScheduleComparisonModalProps> = ({
  isOpen,
  onClose,
  request,
  historicalSchedules = [],
  restructuredSchedules = [],
}) => {
  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Schedule Version Comparison</h2>
              <p className="text-xs text-indigo-200">
                Loan {request.accountNumber} • Version {request.currentScheduleVersion} (Historical) vs Version{' '}
                {request.resultingScheduleVersionNumber || request.currentScheduleVersion + 1} (Restructured)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison Summary Banner */}
        <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Previous EMI</span>
              <span className="font-bold text-slate-800">{formatCurrencyINR(request.currentEmiAmount)}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-indigo-400" />
            <div>
              <span className="text-indigo-600 block text-[10px] uppercase font-bold">Restructured EMI</span>
              <span className="font-bold text-indigo-900">{formatCurrencyINR(request.proposedEmiAmount)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Previous Tenure</span>
              <span className="font-bold text-slate-800">{request.currentRemainingTenureMonths} Mos</span>
            </div>
            <ArrowRight className="w-4 h-4 text-indigo-400" />
            <div>
              <span className="text-indigo-600 block text-[10px] uppercase font-bold">New Tenure</span>
              <span className="font-bold text-indigo-900">{request.proposedTenureMonths} Mos</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Monthly Relief</span>
            <span className="font-bold text-emerald-600">
              {formatCurrencyINR(Math.abs(request.emiDifference))} / mo
            </span>
          </div>
        </div>

        {/* Side-by-side Tables */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 custom-scrollbar text-xs">
          {/* Version 1: Historical */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-700 flex items-center space-x-1.5">
                <History className="w-4 h-4 text-slate-400" />
                <span>Version {request.currentScheduleVersion} (Original Schedule)</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                {request.status === 'EFFECTIVE' ? 'SUPERSEDED' : 'CURRENT CONTRACT'}
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold text-[11px]">
                  <tr>
                    <th className="py-2 px-2.5">#</th>
                    <th className="py-2 px-2.5">Due Date</th>
                    <th className="py-2 px-2.5 text-right">Principal</th>
                    <th className="py-2 px-2.5 text-right">Interest</th>
                    <th className="py-2 px-2.5 text-right">Instalment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {historicalSchedules.length > 0 ? (
                    historicalSchedules.map((item: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="py-1.5 px-2.5">{item.instalmentNumber || i + 1}</td>
                        <td className="py-1.5 px-2.5">{formatDate(item.dueDate)}</td>
                        <td className="py-1.5 px-2.5 text-right">{formatCurrencyINR(item.principalDue)}</td>
                        <td className="py-1.5 px-2.5 text-right">{formatCurrencyINR(item.interestDue)}</td>
                        <td className="py-1.5 px-2.5 text-right font-bold">{formatCurrencyINR(item.instalmentAmount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400 italic">
                        Schedule details loaded from active loan baseline.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Version 2: Restructured */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-indigo-200">
              <span className="font-bold text-indigo-900 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                <span>
                  Version {request.resultingScheduleVersionNumber || request.currentScheduleVersion + 1} (Restructured)
                </span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                ACTIVE / PROPOSED
              </span>
            </div>

            <div className="border border-indigo-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-indigo-50/80 text-indigo-800 font-semibold text-[11px]">
                  <tr>
                    <th className="py-2 px-2.5">#</th>
                    <th className="py-2 px-2.5">Due Date</th>
                    <th className="py-2 px-2.5 text-right">Principal</th>
                    <th className="py-2 px-2.5 text-right">Interest</th>
                    <th className="py-2 px-2.5 text-right">Instalment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-50 font-mono text-[11px]">
                  {restructuredSchedules.length > 0 ? (
                    restructuredSchedules.map((item: any, i: number) => (
                      <tr
                        key={i}
                        className={item.isMoratorium ? 'bg-amber-50/70 font-semibold' : 'hover:bg-indigo-50/40'}
                      >
                        <td className="py-1.5 px-2.5">{item.instalmentNumber || i + 1}</td>
                        <td className="py-1.5 px-2.5">{formatDate(item.dueDate)}</td>
                        <td className="py-1.5 px-2.5 text-right text-indigo-700">{formatCurrencyINR(item.principalDue)}</td>
                        <td className="py-1.5 px-2.5 text-right text-slate-600">{formatCurrencyINR(item.interestDue)}</td>
                        <td className="py-1.5 px-2.5 text-right font-bold text-slate-900">
                          {formatCurrencyINR(item.instalmentAmount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-indigo-400 italic">
                        Calculated from proposed restructuring terms.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
