import React, { useState, useMemo } from 'react';
import { KycRecord, KycStatus, KycRiskCategory } from '../../types';
import { KycStatusBadge } from './KycStatusBadge';
import {
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  UserCheck,
} from 'lucide-react';

interface KycQueueTableProps {
  kycRecords: KycRecord[];
  onSelectCustomer: (customerId: string) => void;
  onOpenWorkbench: (record: KycRecord) => void;
}

export const KycQueueTable: React.FC<KycQueueTableProps> = ({
  kycRecords,
  onSelectCustomer,
  onOpenWorkbench,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');

  const filteredRecords = useMemo(() => {
    return kycRecords.filter((record) => {
      // Search
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        record.customerName.toLowerCase().includes(searchLower) ||
        record.customerNumber.toLowerCase().includes(searchLower) ||
        (record.cKycNumber && record.cKycNumber.toLowerCase().includes(searchLower)) ||
        (record.panRecord?.idNumberMasked && record.panRecord.idNumberMasked.toLowerCase().includes(searchLower));

      if (!matchesSearch) return false;

      // Status
      if (statusFilter !== 'ALL' && record.status !== statusFilter) return false;

      // Risk
      if (riskFilter !== 'ALL' && record.riskCategory !== riskFilter) return false;

      return true;
    });
  }, [kycRecords, searchTerm, statusFilter, riskFilter]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: kycRecords.length,
      pending: kycRecords.filter((r) => r.status === 'PENDING_REVIEW').length,
      actionRequired: kycRecords.filter((r) => r.status === 'ACTION_REQUIRED').length,
      verified: kycRecords.filter((r) => r.status === 'VERIFIED').length,
      rejected: kycRecords.filter((r) => r.status === 'REJECTED').length,
      expired: kycRecords.filter((r) => r.status === 'EXPIRED').length,
    };
  }, [kycRecords]);

  return (
    <div className="space-y-3 text-xs">
      {/* Tab bar for quick status switching */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`px-3 py-1.5 rounded font-semibold text-xs transition-colors ${
            statusFilter === 'ALL'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Profiles ({counts.all})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('PENDING_REVIEW')}
          className={`px-3 py-1.5 rounded font-semibold text-xs flex items-center gap-1.5 transition-colors ${
            statusFilter === 'PENDING_REVIEW'
              ? 'bg-amber-700 text-white'
              : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Pending Review ({counts.pending})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('ACTION_REQUIRED')}
          className={`px-3 py-1.5 rounded font-semibold text-xs flex items-center gap-1.5 transition-colors ${
            statusFilter === 'ACTION_REQUIRED'
              ? 'bg-orange-700 text-white'
              : 'text-orange-800 bg-orange-50 hover:bg-orange-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Action Required ({counts.actionRequired})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('VERIFIED')}
          className={`px-3 py-1.5 rounded font-semibold text-xs flex items-center gap-1.5 transition-colors ${
            statusFilter === 'VERIFIED'
              ? 'bg-emerald-800 text-white'
              : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Verified ({counts.verified})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('REJECTED')}
          className={`px-3 py-1.5 rounded font-semibold text-xs transition-colors ${
            statusFilter === 'REJECTED'
              ? 'bg-rose-700 text-white'
              : 'text-rose-800 bg-rose-50 hover:bg-rose-100'
          }`}
        >
          Rejected ({counts.rejected})
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-2.5 rounded border border-slate-200">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-2.5 top-2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search borrower name, CUS#, PAN, C-KYC..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold text-[11px]">Risk:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800"
            >
              <option value="ALL">All Risk Ratings</option>
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High Risk</option>
              <option value="PEP">PEP Declared</option>
              <option value="AML_WATCHLIST">AML Watchlist</option>
            </select>
          </div>
        </div>
      </div>

      {/* KYC Table */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 text-[11px] font-bold uppercase border-b border-slate-200">
              <th className="p-3">Borrower / Profile</th>
              <th className="p-3">KYC Status</th>
              <th className="p-3">Verification Tier</th>
              <th className="p-3">Risk Rating</th>
              <th className="p-3">PAN / UIDAI Status</th>
              <th className="p-3">Review Due</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500">
                  No KYC records found matching current criteria.
                </td>
              </tr>
            ) : (
              filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => onSelectCustomer(record.customerId)}
                      className="text-left group"
                    >
                      <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors flex items-center gap-1.5">
                        <span>{record.customerName}</span>
                        <ChevronRight className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                        {record.customerNumber} • {record.customerType}
                      </div>
                    </button>
                  </td>

                  <td className="p-3">
                    <KycStatusBadge status={record.status} size="sm" />
                  </td>

                  <td className="p-3">
                    <span className="font-semibold text-slate-800">
                      {record.kycLevel.replace('_', ' ')}
                    </span>
                    {record.cKycNumber && (
                      <span className="block text-[10px] text-slate-500 font-mono">
                        CKYC: {record.cKycNumber}
                      </span>
                    )}
                  </td>

                  <td className="p-3">
                    <span
                      className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded ${
                        record.riskCategory === 'LOW'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : record.riskCategory === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {record.riskCategory}
                    </span>
                  </td>

                  <td className="p-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="text-slate-500">PAN:</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {record.panRecord?.idNumberMasked || 'Pending'}
                        </span>
                        {record.panRecord?.isVerified && (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="text-slate-500">UIDAI:</span>
                        <span className="font-mono text-slate-700">
                          {record.aadhaarRecord?.idNumberMasked || 'Pending'}
                        </span>
                        {record.aadhaarRecord?.isVerified && (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="p-3 text-slate-700">
                    {record.nextReviewDate ? (
                      <span className="font-mono text-[11px]">{record.nextReviewDate}</span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">—</span>
                    )}
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenWorkbench(record)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-xs flex items-center gap-1 transition-colors"
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>Review</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectCustomer(record.customerId)}
                        className="p-1 text-slate-500 hover:text-slate-800 rounded border border-slate-200 hover:bg-slate-100"
                        title="View Full Customer Workspace"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
