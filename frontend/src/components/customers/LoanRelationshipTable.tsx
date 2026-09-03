import React, { useState } from 'react';
import { CustomerLoanItem } from '../../types';
import { formatIndianCurrency, formatDateDisplay } from '../../utils/formatters';
import { Copy, Check, CheckCircle2, AlertCircle, Clock, ShieldAlert } from 'lucide-react';

interface LoanRelationshipTableProps {
  loans: CustomerLoanItem[];
  customerName: string;
}

export const LoanRelationshipTable: React.FC<LoanRelationshipTableProps> = ({
  loans,
  customerName,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderLoanStatus = (status: string, dpd: number = 0) => {
    if (status === 'CLOSED' || status === 'SETTLED') {
      return (
        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
          <CheckCircle2 className="w-3 h-3 text-slate-500" />
          <span>Closed</span>
        </span>
      );
    }

    if (dpd > 0 || status === 'OVERDUE') {
      return (
        <span className="inline-flex items-center gap-1 font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px]">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          <span>Overdue</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        <span>Active (Regular)</span>
      </span>
    );
  };

  const renderDPD = (dpd: number = 0) => {
    if (dpd === 0) {
      return (
        <span className="font-mono text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[11px]">
          0 DPD
        </span>
      );
    }
    if (dpd <= 30) {
      return (
        <span className="font-mono text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[11px]">
          {dpd} DPD (SMA-0)
        </span>
      );
    }
    if (dpd <= 60) {
      return (
        <span className="font-mono text-orange-800 font-bold bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200 text-[11px]">
          {dpd} DPD (SMA-1)
        </span>
      );
    }
    return (
      <span className="font-mono text-rose-800 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 text-[11px]">
        {dpd} DPD (SMA-2)
      </span>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded text-xs overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-slate-700" />
          <h3 className="font-semibold text-slate-900">
            Loan Account Portfolio ({loans.length})
          </h3>
        </div>
        <span className="text-slate-500 text-[11px]">
          All active, historical, and closed accounts for {customerName}
        </span>
      </div>

      {loans.length === 0 ? (
        <div className="py-10 text-center text-slate-500">
          <p className="font-semibold text-slate-800">No loan accounts registered</p>
          <p className="text-slate-500 text-[11px] mt-0.5">
            No active or disbursed loan facilities are currently assigned to this customer.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="py-2.5 px-3.5">Loan Account No.</th>
                <th className="py-2.5 px-3.5">Loan Facility Product</th>
                <th className="py-2.5 px-3.5 text-right">Sanctioned Principal</th>
                <th className="py-2.5 px-3.5 text-right">Outstanding Principal</th>
                <th className="py-2.5 px-3.5 text-center">Rate</th>
                <th className="py-2.5 px-3.5 text-right">Monthly EMI</th>
                <th className="py-2.5 px-3.5">Next Due Date</th>
                <th className="py-2.5 px-3.5 text-center">Delinquency (DPD)</th>
                <th className="py-2.5 px-3.5">Account Status</th>
                <th className="py-2.5 px-3.5">Disbursed Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {loans.map((loan) => {
                const accNum = loan.accountNumber || loan.loanAccountNumber || '';
                const origPrinc = loan.originalPrincipal ?? loan.sanctionedAmount ?? 0;
                const disbDate = loan.disbursementDate || loan.disbursedDate || '';

                return (
                  <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                    {/* Loan Account Number with copy */}
                    <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{accNum}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(accNum)}
                          className="text-slate-400 hover:text-slate-700 p-0.5 rounded focus:outline-none"
                          title="Copy Loan Account Number"
                        >
                          {copiedId === accNum ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Product */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{loan.productName}</div>
                      <div className="text-[11px] text-slate-500">{loan.branchName}</div>
                    </td>

                    {/* Sanctioned */}
                    <td className="py-2.5 px-3.5 text-right font-mono text-slate-700 whitespace-nowrap">
                      {formatIndianCurrency(origPrinc, true)}
                    </td>

                    {/* Outstanding */}
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatIndianCurrency(loan.outstandingPrincipal, true)}
                    </td>

                    {/* Interest Rate */}
                    <td className="py-2.5 px-3.5 text-center whitespace-nowrap font-mono">
                      {loan.interestRate}%
                    </td>

                    {/* EMI */}
                    <td className="py-2.5 px-3.5 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {loan.emiAmount ? formatIndianCurrency(loan.emiAmount, true) : '—'}
                    </td>

                    {/* Next Due Date */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-600">
                      {loan.nextDueDate ? formatDateDisplay(loan.nextDueDate) : 'Settled'}
                    </td>

                    {/* DPD */}
                    <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                      {renderDPD(loan.dpd || 0)}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      {renderLoanStatus(loan.status, loan.dpd || 0)}
                    </td>

                    {/* Disbursed Date */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-600">
                      {formatDateDisplay(disbDate)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
