import React from 'react';
import { DisbursementRecord, DisbursementStatus } from '../../types/disbursementTypes';
import {
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  RotateCcw,
  Landmark,
  ShieldCheck,
  Building,
  ChevronRight,
} from 'lucide-react';

interface DisbursementTableProps {
  disbursements: DisbursementRecord[];
  onSelectDisbursement: (disbursement: DisbursementRecord) => void;
  onOpenApproveModal?: (disbursement: DisbursementRecord) => void;
  onOpenPayoutModal?: (disbursement: DisbursementRecord) => void;
  currentUser: { name: string; id: string; roleName: string };
  canApproveDisbursement: boolean;
  canExecuteDisbursement: boolean;
}

export const DisbursementTable: React.FC<DisbursementTableProps> = ({
  disbursements,
  onSelectDisbursement,
  onOpenApproveModal,
  onOpenPayoutModal,
  currentUser,
  canApproveDisbursement,
  canExecuteDisbursement,
}) => {
  const getStatusBadge = (status: DisbursementStatus) => {
    switch (status) {
      case 'SUCCESSFUL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Disbursed
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <ShieldCheck className="w-3 h-3" /> Ready for Payout
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Pending Checker
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> Failed Payout
          </span>
        );
      case 'RETURNED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <RotateCcw className="w-3 h-3" /> Returned
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      case 'REVERSED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
            <RotateCcw className="w-3 h-3" /> Reversed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-50 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  if (disbursements.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <Landmark className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-800">No disbursement files found</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          No disbursement requests match your filter criteria. Click "New Disbursement Request" to initiate a payout against confirmed sanctions.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-3.5">Disbursement #</th>
              <th className="py-3 px-3">Borrower & App</th>
              <th className="py-3 px-3">Product</th>
              <th className="py-3 px-3 text-right">Sanctioned</th>
              <th className="py-3 px-3 text-right">Requested</th>
              <th className="py-3 px-3 text-right">Disbursed</th>
              <th className="py-3 px-3 text-right">Remaining</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 px-3">Assigned / Maker</th>
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {disbursements.map((d) => {
              const latestReq = d.requests[0];
              const requestedAmount = latestReq ? latestReq.requestedAmount : d.remainingAmount;
              const isMaker = latestReq?.requestedByName?.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
              const canApproveThis = canApproveDisbursement && !isMaker && latestReq?.status === 'PENDING_APPROVAL';
              const canExecuteThis = canExecuteDisbursement && (latestReq?.status === 'APPROVED' || latestReq?.status === 'FAILED');

              return (
                <tr
                  key={d.id}
                  className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                  onClick={() => onSelectDisbursement(d)}
                >
                  {/* Disbursement # */}
                  <td className="py-3 px-3.5 font-mono font-bold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <span className="text-blue-700 group-hover:underline">{d.disbursementNumber}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-sans block">{d.sanctionNumber}</span>
                  </td>

                  {/* Borrower & App */}
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-900">{d.customerName}</div>
                    <div className="text-[10px] font-mono text-slate-500">
                      {d.applicationNumber} • {d.customerNumber}
                    </div>
                  </td>

                  {/* Product */}
                  <td className="py-3 px-3">
                    <div className="text-slate-800 font-medium truncate max-w-[150px]">{d.productName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{d.branchName || d.branchId}</div>
                  </td>

                  {/* Sanctioned */}
                  <td className="py-3 px-3 text-right font-mono font-medium text-slate-700">
                    ₹{d.sanctionAmount.toLocaleString('en-IN')}
                  </td>

                  {/* Requested Amount */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                    ₹{requestedAmount.toLocaleString('en-IN')}
                    {latestReq?.disbursementType === 'PARTIAL' && (
                      <span className="text-[9px] block text-indigo-600 font-sans uppercase font-bold">Partial</span>
                    )}
                  </td>

                  {/* Disbursed */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                    ₹{d.totalDisbursedAmount.toLocaleString('en-IN')}
                  </td>

                  {/* Remaining */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-blue-700">
                    ₹{d.remainingAmount.toLocaleString('en-IN')}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-3 text-center">
                    {getStatusBadge(latestReq?.status || d.status)}
                  </td>

                  {/* Assigned / Maker */}
                  <td className="py-3 px-3 text-[11px]">
                    <div className="font-medium text-slate-800">{latestReq?.assignedToName || 'Unassigned'}</div>
                    <div className="text-[10px] text-slate-400">Maker: {latestReq?.requestedByName || 'System'}</div>
                  </td>

                  {/* Date */}
                  <td className="py-3 px-3 text-[11px] font-mono text-slate-500">
                    {new Date(d.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {canApproveThis && onOpenApproveModal && (
                        <button
                          onClick={() => onOpenApproveModal(d)}
                          className="px-2.5 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors"
                          title="Checker Review / Approval"
                        >
                          Review
                        </button>
                      )}

                      {canExecuteThis && onOpenPayoutModal && (
                        <button
                          onClick={() => onOpenPayoutModal(d)}
                          className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md shadow-xs transition-colors flex items-center gap-1"
                          title="Execute Banking Payout"
                        >
                          <ArrowUpRight className="w-3 h-3" /> Payout
                        </button>
                      )}

                      <button
                        onClick={() => onSelectDisbursement(d)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                        title="View Disbursement Workspace"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
