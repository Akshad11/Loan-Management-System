import React from 'react';
import { CreditAssessmentRecord } from '../../types/creditTypes';
import { Clock, Play, CheckCircle2, RotateCcw, TrendingUp } from 'lucide-react';

interface CreditQueueKPIsProps {
  assessments: CreditAssessmentRecord[];
  activeStatusFilter: string;
  onSelectStatus: (status: string) => void;
}

export const CreditQueueKPIs: React.FC<CreditQueueKPIsProps> = ({
  assessments,
  activeStatusFilter,
  onSelectStatus,
}) => {
  const pendingCount = assessments.filter((a) => a.status === 'PENDING' || a.status === 'ASSIGNED').length;
  const inProgressCount = assessments.filter((a) => a.status === 'IN_PROGRESS').length;
  const submittedCount = assessments.filter((a) => a.status === 'SUBMITTED' || a.status === 'DECISIONED').length;
  const returnedCount = assessments.filter((a) => a.status === 'RETURNED').length;

  const totalVolume = assessments.reduce(
    (acc, a) => acc + (a.requestedAmount || 0),
    0
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {/* 1. Pending Allocation */}
      <button
        onClick={() => onSelectStatus(activeStatusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
        className={`p-4 rounded-lg text-left border transition-all ${
          activeStatusFilter === 'PENDING'
            ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/20'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-medium">
          <span>Pending Allocation</span>
          <Clock className="w-3.5 h-3.5 text-amber-500" />
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {pendingCount}
        </div>
        <span className="text-[11px] text-slate-400">Awaiting underwriter</span>
      </button>

      {/* 2. In Assessment */}
      <button
        onClick={() => onSelectStatus(activeStatusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
        className={`p-4 rounded-lg text-left border transition-all ${
          activeStatusFilter === 'IN_PROGRESS'
            ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-400/20'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-medium">
          <span>In Underwriting</span>
          <Play className="w-3.5 h-3.5 text-indigo-500" />
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {inProgressCount}
        </div>
        <span className="text-[11px] text-slate-400">Active appraisal</span>
      </button>

      {/* 3. Recommended / Submitted */}
      <button
        onClick={() => onSelectStatus(activeStatusFilter === 'SUBMITTED' ? 'ALL' : 'SUBMITTED')}
        className={`p-4 rounded-lg text-left border transition-all ${
          activeStatusFilter === 'SUBMITTED'
            ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-400/20'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-medium">
          <span>Submitted Decisions</span>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {submittedCount}
        </div>
        <span className="text-[11px] text-slate-400">Sent to Committee</span>
      </button>

      {/* 4. Returned */}
      <button
        onClick={() => onSelectStatus(activeStatusFilter === 'RETURNED' ? 'ALL' : 'RETURNED')}
        className={`p-4 rounded-lg text-left border transition-all ${
          activeStatusFilter === 'RETURNED'
            ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-400/20'
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-medium">
          <span>Returned to Branch</span>
          <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
        </div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {returnedCount}
        </div>
        <span className="text-[11px] text-slate-400">Action required</span>
      </button>

      {/* 5. Total Exposure */}
      <div className="p-4 rounded-lg bg-white border border-slate-200">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-medium">
          <span>Pipeline Volume</span>
          <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <div className="text-xl font-bold text-slate-900 tracking-tight">
          ₹{(totalVolume / 100000).toFixed(1)} L
        </div>
        <span className="text-[11px] text-slate-400">{assessments.length} total cases</span>
      </div>
    </div>
  );
};
