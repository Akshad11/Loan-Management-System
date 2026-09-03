import React, { useState } from 'react';
import { CustomerHistoryItem } from '../../types';
import {
  History,
  UserPlus,
  Edit2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Archive,
  RotateCcw,
  CreditCard,
  Filter,
  RotateCw,
  Search,
} from 'lucide-react';

interface CustomerTimelineProps {
  history: CustomerHistoryItem[];
  customerName: string;
}

export const CustomerTimeline: React.FC<CustomerTimelineProps> = ({ history, customerName }) => {
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('ALL');
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredHistory = history.filter((item) => {
    if (eventTypeFilter !== 'ALL' && item.eventType !== eventTypeFilter) return false;
    if (moduleFilter !== 'ALL' && item.module !== moduleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchActor = item.actor.toLowerCase().includes(q);
      const matchRef = item.entityReference?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchActor && !matchRef) return false;
    }
    return true;
  });

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'CUSTOMER_CREATED':
        return <UserPlus className="w-3.5 h-3.5 text-emerald-600" />;
      case 'CUSTOMER_UPDATED':
        return <Edit2 className="w-3.5 h-3.5 text-blue-600" />;
      case 'APPLICATION_SUBMITTED':
      case 'APPLICATION_APPROVED':
        return <FileText className="w-3.5 h-3.5 text-indigo-600" />;
      case 'LOAN_DISBURSED':
      case 'LOAN_SETTLED':
        return <CreditCard className="w-3.5 h-3.5 text-emerald-600" />;
      case 'REPAYMENT_RECORDED':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'CUSTOMER_ARCHIVED':
        return <Archive className="w-3.5 h-3.5 text-amber-600" />;
      case 'CUSTOMER_RESTORED':
        return <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <History className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getModuleBadge = (module?: string) => {
    const m = module || 'CUSTOMERS';
    return (
      <span className="font-mono text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
        {m}
      </span>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded text-xs space-y-4 p-4">
      {/* Header & Filter Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-700" />
            <h3 className="font-semibold text-slate-900">
              Customer Lifecycle Audit & Event Trail ({filteredHistory.length})
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Immutable chronological operational ledger for {customerName}
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Module Filter */}
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
          >
            <option value="ALL">All Modules</option>
            <option value="CUSTOMERS">Customers</option>
            <option value="APPLICATIONS">Applications</option>
            <option value="LOANS">Loans</option>
            <option value="REPAYMENTS">Repayments</option>
            <option value="KYC">KYC</option>
          </select>

          {/* Event Filter */}
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
          >
            <option value="ALL">All Event Types</option>
            <option value="CUSTOMER_CREATED">Customer Created</option>
            <option value="CUSTOMER_UPDATED">Customer Updated</option>
            <option value="KYC_COMPLETED">KYC Completed</option>
            <option value="APPLICATION_SUBMITTED">Application Submitted</option>
            <option value="APPLICATION_APPROVED">Application Approved</option>
            <option value="LOAN_DISBURSED">Loan Disbursed</option>
            <option value="REPAYMENT_RECORDED">Repayment Recorded</option>
            <option value="CUSTOMER_ARCHIVED">Customer Archived</option>
            <option value="CUSTOMER_RESTORED">Customer Restored</option>
          </select>

          {/* Quick search */}
          <div className="relative flex-1 sm:w-48">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className="w-full pl-7 pr-2 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
          </div>

          {(eventTypeFilter !== 'ALL' || moduleFilter !== 'ALL' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setEventTypeFilter('ALL');
                setModuleFilter('ALL');
                setSearchQuery('');
              }}
              className="px-2 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold"
              title="Reset timeline filters"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Timeline List */}
      {filteredHistory.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-800">No events found matching filters</p>
          <p className="text-xs text-slate-500 mt-0.5">Try clearing filters or adjusting your search term.</p>
        </div>
      ) : (
        <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 my-2">
          {filteredHistory.map((item) => (
            <div key={item.id} className="relative group">
              {/* Dot Icon Indicator */}
              <div className="absolute -left-[31px] top-0 p-1 bg-white border-2 border-slate-300 rounded-full group-hover:border-slate-800 transition-colors shadow-xs">
                {getEventIcon(item.eventType)}
              </div>

              {/* Event Body */}
              <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded p-3 text-xs space-y-1.5 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{item.title}</span>
                    {getModuleBadge(item.module)}
                    {item.entityReference && (
                      <span className="font-mono text-[11px] font-semibold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                        {item.entityReference}
                      </span>
                    )}
                  </div>

                  <span className="text-[11px] font-mono text-slate-500">{item.timestamp}</span>
                </div>

                <p className="text-slate-700 text-xs leading-relaxed">{item.description}</p>

                {/* Actor info */}
                <div className="flex items-center gap-3 pt-1 border-t border-slate-200/60 text-[11px] text-slate-500">
                  <span>
                    Initiated by: <strong className="text-slate-800 font-semibold">{item.actor}</strong>
                  </span>
                  {item.actorRole && (
                    <>
                      <span>•</span>
                      <span>{item.actorRole}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
