import React, { useState } from 'react';
import { SanctionRecord } from '../../types/sanctionTypes';
import { SanctionStatusBadge, LetterStatusBadge } from './SanctionStatusBadge';
import {
  FileText,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Calendar,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

interface SanctionTableProps {
  sanctions: SanctionRecord[];
  onSelectSanction: (sanction: SanctionRecord) => void;
  onOpenConfirmModal: (sanction: SanctionRecord) => void;
  onOpenLetterModal: (sanction: SanctionRecord) => void;
  currentUser: { name: string; id: string; roleName: string };
  canConfirmSanction: boolean;
}

export const SanctionTable: React.FC<SanctionTableProps> = ({
  sanctions,
  onSelectSanction,
  onOpenConfirmModal,
  onOpenLetterModal,
  currentUser,
  canConfirmSanction,
}) => {
  const [sortField, setSortField] = useState<keyof SanctionRecord>('createdDate');
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (field: keyof SanctionRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedSanctions = [...sanctions].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (valA === undefined || valB === undefined) return 0;
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  if (sanctions.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">No Sanction Dossiers Found</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          No loan sanction records match your search criteria. Draft a new sanction dossier or adjust your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('sanctionNumber')}>
                Sanction Ref # / Date
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-slate-900" onClick={() => handleSort('customerName')}>
                Borrower / App #
              </th>
              <th className="py-3 px-4">Product & Branch</th>
              <th className="py-3 px-4 text-right cursor-pointer hover:text-slate-900" onClick={() => handleSort('approvedAmount')}>
                Sanction Limit / Rates
              </th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-center">Letter</th>
              <th className="py-3 px-4 text-center">SoD Audit</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {sortedSanctions.map((s) => {
              const activeLetter = s.letters.find((l) => l.id === s.activeLetterId) || s.letters[0];
              const isDeviated = s.terms.isDeviatedFromApproval;
              
              // Segregation of duties check: Final approver cannot confirm
              const finalApproverName = s.finalApproverName.toLowerCase();
              const currentUserName = currentUser.name.toLowerCase();
              const isSodRestricted = currentUserName && finalApproverName && (currentUserName.includes(finalApproverName) || finalApproverName.includes(currentUserName));

              const isConfirmable =
                canConfirmSanction &&
                (s.status === 'DRAFT' || s.status === 'UNDER_REVIEW' || s.status === 'PENDING_CONFIRMATION') &&
                !isSodRestricted;

              return (
                <tr
                  key={s.id}
                  onClick={() => onSelectSanction(s)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  {/* Sanction Ref # & Date */}
                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {s.sanctionNumber}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 font-sans">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {s.createdDate}
                    </div>
                  </td>

                  {/* Borrower & App Number */}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{s.customerName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      App: {s.applicationNumber}
                    </div>
                  </td>

                  {/* Product & Branch */}
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800">{s.productName}</div>
                    <div className="text-[11px] text-slate-500">{s.branchName}</div>
                  </td>

                  {/* Sanction Limit & Rates */}
                  <td className="py-3 px-4 text-right">
                    <div className="font-mono font-bold text-slate-900">
                      ₹{s.terms.amount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {s.terms.interestRate}% p.a. • {s.terms.tenureMonths}m
                    </div>
                    {isDeviated && (
                      <span className="inline-flex items-center text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.2 mt-0.5" title={s.termDeviationReason || 'Terms deviated from approval'}>
                        <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                        Deviated
                      </span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4 text-center">
                    <SanctionStatusBadge status={s.status} size="sm" />
                  </td>

                  {/* Letter Status */}
                  <td className="py-3 px-4 text-center">
                    {activeLetter ? (
                      <div className="flex flex-col items-center">
                        <LetterStatusBadge status={activeLetter.status} size="sm" />
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                          v{activeLetter.version}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Not Generated</span>
                    )}
                  </td>

                  {/* SoD Audit Indicator */}
                  <td className="py-3 px-4 text-center">
                    {isSodRestricted ? (
                      <span
                        className="inline-flex items-center text-[10px] font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-0.5"
                        title={`SoD Restriction: You approved this loan at Credit Committee and cannot confirm the sanction.`}
                      >
                        <ShieldAlert className="w-3 h-3 mr-1 text-rose-600" />
                        SoD Restricted
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5"
                        title={`SoD Compliant: Approver is ${s.finalApproverName}`}
                      >
                        <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                        Independent
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectSanction(s)}
                        title="Open Sanction Dossier"
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-transparent hover:border-slate-200 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {isConfirmable && (
                        <button
                          onClick={() => onOpenConfirmModal(s)}
                          title="Confirm & Finalize Sanction"
                          className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs rounded shadow-xs transition-colors inline-flex items-center"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Confirm
                        </button>
                      )}

                      {s.status === 'SANCTIONED' && activeLetter && (
                        <button
                          onClick={() => onOpenLetterModal(s)}
                          title="View / Print Sanction Letter"
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs rounded border border-slate-300 transition-colors inline-flex items-center"
                        >
                          <FileCheck className="w-3.5 h-3.5 mr-1" />
                          Letter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing <span className="font-semibold text-slate-700">{sanctions.length}</span> sanction records
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Independent Sanction Authority Verification Enforced</span>
        </div>
      </div>
    </div>
  );
};
