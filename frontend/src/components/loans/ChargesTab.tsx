import React from 'react';
import {
  Receipt,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Percent,
  ShieldCheck,
} from 'lucide-react';
import { LoanAccountRecord, LoanChargeItem } from '../../types/loanAccountTypes';
import { formatCurrencyINR, formatDate } from '../../utils/formatters';

interface ChargesTabProps {
  loan: LoanAccountRecord;
  onAddCharge?: () => void;
  canManageCharges?: boolean;
}

export const ChargesTab: React.FC<ChargesTabProps> = ({
  loan,
  onAddCharge,
  canManageCharges = true,
}) => {
  const charges = loan.charges || [];

  const totalChargesAmount = charges.reduce((sum, c) => sum + c.totalAmount, 0);
  const totalDeductedOrPaid = charges
    .filter((c) => c.status === 'DEDUCTED_AT_DISBURSEMENT' || c.status === 'PAID')
    .reduce((sum, c) => sum + c.totalAmount, 0);
  const totalPendingCharges = charges
    .filter((c) => c.status === 'PENDING')
    .reduce((sum, c) => sum + c.totalAmount, 0);

  const getChargeStatusBadge = (status: string) => {
    switch (status) {
      case 'DEDUCTED_AT_DISBURSEMENT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            DEDUCTED AT DISBURSEMENT
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            PAID
          </span>
        );
      case 'CAPITALIZED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            CAPITALIZED TO PRINCIPAL
          </span>
        );
      case 'WAIVED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            WAIVED
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            PENDING RECOVERY
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500">Total Charges Levied</span>
          <div className="text-lg font-bold text-slate-900 font-mono mt-1">
            {formatCurrencyINR(totalChargesAmount, false)}
          </div>
          <span className="text-[10px] text-slate-400">{charges.length} fee items configured</span>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-900">Total Settled / Deducted</span>
          <div className="text-lg font-bold text-emerald-800 font-mono mt-1">
            {formatCurrencyINR(totalDeductedOrPaid, false)}
          </div>
          <span className="text-[10px] text-emerald-700">Recovered at origination / payout</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500">Pending Fee Recovery</span>
          <div className="text-lg font-bold text-slate-900 font-mono mt-1">
            {formatCurrencyINR(totalPendingCharges, false)}
          </div>
          <span className="text-[10px] text-slate-400">Due on subsequent events</span>
        </div>
      </div>

      {/* Charges Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Product-Linked Fees & Charges
            </h4>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">Charge Code & Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Calculation Rule</th>
                <th className="py-3 px-4">Timing</th>
                <th className="py-3 px-4 text-right">Base Amount</th>
                <th className="py-3 px-4 text-right">GST (18%)</th>
                <th className="py-3 px-4 text-right font-bold text-slate-900">Total Levied</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {charges.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div className="font-semibold text-slate-700">No charges configured for this facility</div>
                  </td>
                </tr>
              ) : (
                charges.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{c.chargeName}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{c.chargeCode}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-slate-700 font-medium">{c.chargeType.replace(/_/g, ' ')}</span>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600">
                      {c.calculationType === 'PERCENTAGE_OF_SANCTION' || c.calculationType === 'PERCENTAGE_OF_PRINCIPAL'
                        ? `${c.rateOrValue}% of Sanction`
                        : 'Fixed Flat Charge'}
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      {c.chargeTiming.replace(/_/g, ' ')}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-slate-700">
                      {formatCurrencyINR(c.amount, false)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {formatCurrencyINR(c.taxAmount, false)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrencyINR(c.totalAmount, false)}
                    </td>

                    <td className="py-3 px-4 text-center">{getChargeStatusBadge(c.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
