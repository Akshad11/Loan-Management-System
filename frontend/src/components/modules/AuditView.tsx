import React, { useState, useMemo } from 'react';
import { useMockLMSStore } from '../../services/mockService';
import { AuditTimeline } from '../shared/AuditTimeline';
import { Search, Filter, History, ShieldAlert, X } from 'lucide-react';

export interface AuditViewProps {
  onNavigate?: (mod: string) => void;
}

export const AuditView: React.FC<AuditViewProps> = ({ onNavigate }) => {
  const { auditLogs } = useMockLMSStore();
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (search) {
        const q = search.toLowerCase();
        const matches =
          log.entityName.toLowerCase().includes(q) ||
          log.action.toLowerCase().includes(q) ||
          log.actorName.toLowerCase().includes(q) ||
          (log.details && log.details.toLowerCase().includes(q)) ||
          (log.reason && log.reason.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (entityFilter && log.entityType !== entityFilter) return false;
      return true;
    });
  }, [auditLogs, search, entityFilter]);

  return (
    <div className="space-y-5 text-left">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          System Administration Audit Log
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable, timestamped ledger of staff provisioning, permission matrix adjustments, and branch status changes.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            id="audit-search-input"
            name="audit-search-input"
            type="text"
            placeholder="Search audit trail by user, role name, admin staff, or action description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-slate-800 focus:outline-none transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <select
          id="audit-filter-entity"
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="text-xs bg-white border border-slate-300 rounded px-2.5 py-2 text-slate-800 focus:outline-none focus:border-slate-800 shrink-0"
        >
          <option value="">All Entities</option>
          <option value="USER">User Accounts</option>
          <option value="ROLE">Roles & Permissions</option>
          <option value="BRANCH">Branches</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <AuditTimeline logs={filteredLogs} emptyMessage="No audit records match the selected criteria." />
      </div>
    </div>
  );
};
