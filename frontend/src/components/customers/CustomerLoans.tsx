import React, { useState } from 'react';
import { CustomerLoanItem } from '../../types';
import { LoanSummary } from './LoanSummary';
import { LoanRelationshipTable } from './LoanRelationshipTable';
import { Filter } from 'lucide-react';

interface CustomerLoansProps {
  loans: CustomerLoanItem[];
  customerName: string;
}

export const CustomerLoans: React.FC<CustomerLoansProps> = ({ loans, customerName }) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'OVERDUE' | 'CLOSED'>('ALL');

  const filteredLoans = loans.filter((l) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ACTIVE') return l.status === 'ACTIVE' || l.status === 'PARTIALLY_DISBURSED';
    if (statusFilter === 'OVERDUE') return (l.dpd && l.dpd > 0) || l.status === 'OVERDUE';
    if (statusFilter === 'CLOSED') return l.status === 'CLOSED' || l.status === 'MATURED';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Portfolio Summary Metric Cards */}
      <LoanSummary loans={loans} />

      {/* Filter Tabs */}
      <div className="flex items-center justify-between text-xs bg-white border border-slate-200 p-2.5 rounded">
        <div className="flex items-center gap-1.5 font-medium text-slate-700">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span>Filter Facility Status:</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Facilities ({loans.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
              statusFilter === 'ACTIVE'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Active Regular ({loans.filter((l) => l.status === 'ACTIVE' && (!l.dpd || l.dpd === 0)).length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('OVERDUE')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
              statusFilter === 'OVERDUE'
                ? 'bg-rose-700 text-white'
                : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            Overdue / DPD ({loans.filter((l) => (l.dpd && l.dpd > 0) || l.status === 'OVERDUE').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('CLOSED')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
              statusFilter === 'CLOSED'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Closed / Settled ({loans.filter((l) => l.status === 'CLOSED' || l.status === 'MATURED').length})
          </button>
        </div>
      </div>

      {/* Main Loan Relationship Table */}
      <LoanRelationshipTable loans={filteredLoans} customerName={customerName} />
    </div>
  );
};
