import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Users, FileText, Landmark, ArrowRight, CornerDownLeft, Loader2 } from 'lucide-react';
import { formatINR } from '../../utils/formatters';
import { StatusBadge } from '../shared/StatusBadge';
import { customerApi, applicationApi, loanApi } from '../../services/apiClient';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: string, entityId?: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'customers' | 'applications' | 'loans'>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setCustomers([]);
      setApplications([]);
      setLoans([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Live search debounced against database APIs
  useEffect(() => {
    if (!isOpen) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setCustomers([]);
      setApplications([]);
      setLoans([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const [custRes, appRes, loanRes] = await Promise.all([
          customerApi.getAll({ search: trimmed }).catch(() => []),
          applicationApi.getAll({ search: trimmed }).catch(() => []),
          loanApi.getAll({ search: trimmed }).catch(() => []),
        ]);

        const custList = Array.isArray(custRes) ? custRes : custRes?.customers || [];
        const appList = Array.isArray(appRes) ? appRes : appRes?.applications || [];
        const loanList = Array.isArray(loanRes) ? loanRes : loanRes?.loans || [];

        setCustomers(custList.slice(0, 4));
        setApplications(appList.slice(0, 4));
        setLoans(loanList.slice(0, 4));
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  const showCustomers = filterType === 'all' || filterType === 'customers';
  const showApplications = filterType === 'all' || filterType === 'applications';
  const showLoans = filterType === 'all' || filterType === 'loans';

  const totalResults =
    (showCustomers ? customers.length : 0) +
    (showApplications ? applications.length : 0) +
    (showLoans ? loans.length : 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 p-4 sm:p-6 overflow-y-auto flex items-start justify-center pt-16">
      <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="p-3 border-b border-slate-200 flex items-center gap-3">
          {isSearching ? (
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin shrink-0 ml-1" />
          ) : (
            <Search className="w-5 h-5 text-slate-400 shrink-0 ml-1" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search live database by Customer name, CUS-ID, Application #, Loan Account #, PAN, Mobile..."
            className="w-full text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
              aria-label="Clear query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
          >
            ESC
          </button>
        </div>

        {/* Category Tabs */}
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium mr-1">Filter:</span>
          {(['all', 'customers', 'applications', 'loans'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 rounded font-medium capitalize transition-colors ${
                filterType === type
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-slate-100">
          {!query.trim() ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Type to search live customer records, loan applications, and loan accounts in the database.
            </div>
          ) : totalResults === 0 && !isSearching ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No matching LMS database records found for &quot;{query}&quot;
            </div>
          ) : (
            <>
              {/* Customers Section */}
              {showCustomers && customers.length > 0 && (
                <div className="py-2">
                  <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Customers
                  </div>
                  {customers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigate('customers', c.id);
                      }}
                      className="w-full px-3 py-2 rounded-md hover:bg-slate-50 text-left flex items-center justify-between group transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900">{c.name || `${c.firstName} ${c.lastName}`}</span>
                          <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {c.customerNumber}
                          </span>
                          <StatusBadge status={c.status} size="sm" />
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex gap-3">
                          <span>{c.mobile}</span>
                          <span>PAN: {c.panMasked || c.pan || '-'}</span>
                          <span>CIBIL: {c.cibilScore || '-'}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              )}

              {/* Applications Section */}
              {showApplications && applications.length > 0 && (
                <div className="py-2">
                  <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Loan Applications
                  </div>
                  {applications.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigate('applications', a.id);
                      }}
                      className="w-full px-3 py-2 rounded-md hover:bg-slate-50 text-left flex items-center justify-between group transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-900">
                            {a.applicationNumber}
                          </span>
                          <span className="text-xs text-slate-700 font-medium truncate">{a.customerName}</span>
                          <StatusBadge status={a.status} size="sm" />
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex gap-3">
                          <span>{a.productName || a.productCode}</span>
                          <span className="font-semibold text-slate-700">{formatINR(Number(a.requestedAmount || 0))}</span>
                          <span>Assigned: {a.assignedTo || 'Unassigned'}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              )}

              {/* Loans Section */}
              {showLoans && loans.length > 0 && (
                <div className="py-2">
                  <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5" />
                    Loan Accounts
                  </div>
                  {loans.map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigate('loans', l.id);
                      }}
                      className="w-full px-3 py-2 rounded-md hover:bg-slate-50 text-left flex items-center justify-between group transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-slate-900">
                            {l.loanAccountNumber || l.accountNumber}
                          </span>
                          <span className="text-xs text-slate-700 font-medium truncate">{l.customerName}</span>
                          <StatusBadge status={l.status} size="sm" />
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex gap-3">
                          <span>Outstanding: {formatINR(Number(l.outstandingPrincipal || 0))}</span>
                          <span>EMI: {formatINR(Number(l.emiAmount || 0))}</span>
                          <span>DPD: {l.dpd || 0}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Keyboard Footer */}
        <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Search records across database in real-time</span>
          <div className="flex items-center gap-2 font-mono">
            <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 inline-flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3" /> Select
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
