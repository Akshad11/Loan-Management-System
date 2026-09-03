import React, { useState } from 'react';
import { CustomerApplicationItem } from '../../types';
import { formatIndianCurrency, formatDateDisplay } from '../../utils/formatters';
import { Copy, Check, FileText, CheckCircle2, Clock, XCircle, ChevronRight } from 'lucide-react';

interface CustomerApplicationsProps {
  applications: CustomerApplicationItem[];
  customerName: string;
}

export const CustomerApplications: React.FC<CustomerApplicationsProps> = ({
  applications,
  customerName,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'SANCTIONED':
      case 'DISBURSED':
        return (
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>{status}</span>
          </span>
        );
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[11px]">
            <Clock className="w-3 h-3 text-blue-600" />
            <span>{status.replace('_', ' ')}</span>
          </span>
        );
      case 'REJECTED':
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px]">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>{status}</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded border border-slate-200 text-[11px]">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded text-xs overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-700" />
          <h3 className="font-semibold text-slate-900">
            Loan Application History ({applications.length})
          </h3>
        </div>
        <span className="text-slate-500 text-[11px]">
          Lifecycle originating records for {customerName}
        </span>
      </div>

      {applications.length === 0 ? (
        <div className="py-10 text-center text-slate-500">
          <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="font-semibold text-slate-800">No loan applications recorded</p>
          <p className="text-slate-500 text-[11px] mt-0.5">
            This customer has not originated any credit applications in this lifecycle instance.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="py-2.5 px-3.5">Application Number</th>
                <th className="py-2.5 px-3.5">Loan Product</th>
                <th className="py-2.5 px-3.5 text-right">Requested Amount</th>
                <th className="py-2.5 px-3.5 text-center">Tenure</th>
                <th className="py-2.5 px-3.5 text-center">Interest Rate</th>
                <th className="py-2.5 px-3.5">Applied Date</th>
                <th className="py-2.5 px-3.5">Status</th>
                <th className="py-2.5 px-3.5">Underwriter / Officer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                  {/* App Number with Copy */}
                  <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span>{app.applicationNumber}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(app.applicationNumber)}
                        className="text-slate-400 hover:text-slate-700 p-0.5 rounded focus:outline-none"
                        title="Copy Application Number"
                      >
                        {copiedId === app.applicationNumber ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Product */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <div className="font-semibold text-slate-900">{app.productName}</div>
                    <div className="text-[11px] text-slate-500">{app.branchName}</div>
                  </td>

                  {/* Requested Amount */}
                  <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                    {formatIndianCurrency(app.requestedAmount, true)}
                  </td>

                  {/* Tenure */}
                  <td className="py-2.5 px-3.5 text-center whitespace-nowrap font-medium">
                    {app.tenureMonths} mos
                  </td>

                  {/* Rate */}
                  <td className="py-2.5 px-3.5 text-center whitespace-nowrap font-mono font-medium">
                    {app.interestRate}% p.a.
                  </td>

                  {/* Date */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-600">
                    {formatDateDisplay(app.applicationDate || app.appliedDate || '')}
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    {renderStatusBadge(app.status)}
                  </td>

                  {/* Underwriter */}
                  <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-600">
                    {app.assignedOfficer || 'Credit Committee'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
