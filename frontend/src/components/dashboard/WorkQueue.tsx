import React, { useState } from 'react';
import { WorkQueueItem } from '../../types';
import { formatINR, cn } from '../../utils/formatters';
import { StatusBadge } from '../shared/StatusBadge';
import { Clock, ArrowRight, CheckCircle, Filter } from 'lucide-react';

interface WorkQueueProps {
  items: WorkQueueItem[];
  onActionClick: (item: WorkQueueItem) => void;
  isLoading?: boolean;
}

export const WorkQueue: React.FC<WorkQueueProps> = ({
  items,
  onActionClick,
  isLoading = false,
}) => {
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const rawTypes = items.map((i) => i.type || (i as any).category || 'General').filter(Boolean);
  const types = ['ALL', ...Array.from(new Set(rawTypes))];

  const filteredItems = selectedType === 'ALL'
    ? items
    : items.filter((i) => (i.type || (i as any).category || 'General') === selectedType);

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-none flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>Operational Work Queue</span>
            <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded border border-slate-200">
              {filteredItems.length} Pending
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Prioritized operational tasks requiring your direct review or decision.
          </p>
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {types.map((t, idx) => (
            <button
              key={`filter-${t}-${idx}`}
              type="button"
              onClick={() => setSelectedType(t)}
              className={cn(
                'px-2.5 py-1 text-xs rounded-md font-medium whitespace-nowrap transition-colors border',
                selectedType === t
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Items List */}
      <div className="divide-y divide-slate-100 overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin mx-auto mb-2" />
            Loading pending queue items...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">Work queue is clear</p>
            <p className="text-slate-400 mt-0.5">No pending actions assigned to your role in this queue.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-4">Task / Reference</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4 text-right">Exposure Amount</th>
                <th className="py-2.5 px-4">Stage / Pipeline</th>
                <th className="py-2.5 px-4">Aging</th>
                <th className="py-2.5 px-4">Priority</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
              {filteredItems.map((item, idx) => {
                const uniqueKey = item.id || `wq-${item.referenceNumber || item.targetModule || 'item'}-${idx}`;
                const itemType = item.type || (item as any).title || (item as any).category || 'Operational Task';
                const refNum = item.referenceNumber || item.id || `REF-${idx + 1}`;
                const customer = item.customerName || (item as any).customer || 'Operational Item';
                const amount = typeof item.amount === 'number' ? item.amount : ((item as any).count || 0);
                const stage = item.stage || (item as any).category || 'Review';
                const aging = typeof item.agingDays === 'number' ? item.agingDays : 1;
                const priority = item.priority || (item as any).urgency || 'MEDIUM';
                const actionLabel = item.actionLabel || 'Take Action';

                return (
                  <tr key={uniqueKey} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 align-middle">
                      <div className="font-bold text-slate-900">{itemType}</div>
                      <div className="font-mono text-[11px] text-slate-500">{refNum}</div>
                    </td>

                    <td className="py-3 px-4 align-middle font-medium text-slate-900">
                      {customer}
                    </td>

                    <td className="py-3 px-4 align-middle text-right font-bold tabular-nums text-slate-900">
                      {typeof item.amount === 'number' ? formatINR(amount) : `${amount} items`}
                    </td>

                    <td className="py-3 px-4 align-middle text-slate-600">
                      {stage}
                    </td>

                    <td className="py-3 px-4 align-middle">
                      <span className="inline-flex items-center text-slate-600 gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {aging} {aging === 1 ? 'day' : 'days'}
                      </span>
                    </td>

                    <td className="py-3 px-4 align-middle">
                      <StatusBadge status={priority} size="sm" />
                    </td>

                    <td className="py-3 px-4 align-middle text-right">
                      <button
                        type="button"
                        onClick={() => onActionClick(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 font-semibold text-xs text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors whitespace-nowrap"
                      >
                        <span>{actionLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
