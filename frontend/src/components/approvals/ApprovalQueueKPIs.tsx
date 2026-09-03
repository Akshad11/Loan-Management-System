import React from 'react';
import { ApprovalRecord } from '../../types/approvalTypes';
import { Layers, ShieldCheck, AlertCircle, Clock, RotateCcw, CheckCircle2 } from 'lucide-react';

interface ApprovalQueueKPIsProps {
  approvals: ApprovalRecord[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const ApprovalQueueKPIs: React.FC<ApprovalQueueKPIsProps> = ({
  approvals,
  activeTab,
  onTabChange,
}) => {
  const totalQueue = approvals.filter((a) => a.status !== 'CANCELLED').length;
  const pendingL1 = approvals.filter(
    (a) => (a.status === 'PENDING' || a.status === 'ASSIGNED' || a.status === 'IN_REVIEW') && a.currentLevelIndex === 0
  ).length;
  const pendingMulti = approvals.filter(
    (a) => (a.status === 'PENDING' || a.status === 'ASSIGNED' || a.status === 'IN_REVIEW') && a.currentLevelIndex > 0
  ).length;
  const returnedCount = approvals.filter((a) => a.status === 'RETURNED').length;
  const approvedCount = approvals.filter((a) => a.status === 'APPROVED').length;
  const slaBreached = approvals.filter(
    (a) => a.isSlaBreached && a.status !== 'APPROVED' && a.status !== 'REJECTED'
  ).length;

  const kpis = [
    {
      id: 'ALL',
      label: 'All Queue Cases',
      count: totalQueue,
      icon: Layers,
      color: 'text-slate-700',
      activeBorder: 'border-slate-800 bg-slate-50',
    },
    {
      id: 'LEVEL_1',
      label: 'Pending Level 1 (Branch)',
      count: pendingL1,
      icon: Clock,
      color: 'text-amber-700',
      activeBorder: 'border-amber-600 bg-amber-50/50',
    },
    {
      id: 'MULTI_LEVEL',
      label: 'Pending Escalated (L2 / L3)',
      count: pendingMulti,
      icon: ShieldCheck,
      color: 'text-indigo-700',
      activeBorder: 'border-indigo-600 bg-indigo-50/50',
    },
    {
      id: 'RETURNED',
      label: 'Returned for Clarification',
      count: returnedCount,
      icon: RotateCcw,
      color: 'text-purple-700',
      activeBorder: 'border-purple-600 bg-purple-50/50',
    },
    {
      id: 'APPROVED',
      label: 'Sanctioned / Approved',
      count: approvedCount,
      icon: CheckCircle2,
      color: 'text-emerald-700',
      activeBorder: 'border-emerald-600 bg-emerald-50/50',
    },
    {
      id: 'SLA_RISK',
      label: 'SLA Breached / At Risk',
      count: slaBreached,
      icon: AlertCircle,
      color: 'text-rose-700',
      activeBorder: 'border-rose-600 bg-rose-50/50',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6" id="approval-queue-kpis">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const isActive = activeTab === kpi.id;
        return (
          <button
            key={kpi.id}
            id={`kpi-btn-${kpi.id}`}
            onClick={() => onTabChange(kpi.id)}
            className={`flex flex-col justify-between rounded-lg border p-3.5 text-left transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 ${
              isActive ? `${kpi.activeBorder} shadow-sm ring-1 ring-slate-400` : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
              <Icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${kpi.color}`}>{kpi.count}</span>
              <span className="text-xs text-slate-400">cases</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
