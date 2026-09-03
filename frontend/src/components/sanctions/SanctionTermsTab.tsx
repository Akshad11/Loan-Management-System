import React from 'react';
import { SanctionRecord } from '../../types/sanctionTypes';
import {
  IndianRupee,
  Calendar,
  Percent,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Building,
  HelpCircle,
} from 'lucide-react';

interface SanctionTermsTabProps {
  sanction: SanctionRecord;
  onOpenEditModal: () => void;
  canEditTerms: boolean;
}

export const SanctionTermsTab: React.FC<SanctionTermsTabProps> = ({
  sanction,
  onOpenEditModal,
  canEditTerms,
}) => {
  const { terms } = sanction;
  const isDeviated = terms.isDeviatedFromApproval;

  const totalDeductions =
    terms.processingFee +
    terms.processingFeeGst +
    terms.documentationCharge +
    terms.insuranceCharge +
    terms.otherCharges;

  const isEditable =
    canEditTerms &&
    (sanction.status === 'DRAFT' || sanction.status === 'UNDER_REVIEW' || sanction.status === 'RETURNED');

  return (
    <div className="space-y-6">
      {/* Deviation Alert if applicable */}
      {isDeviated && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Approved Baseline Terms Deviation Flagged
              </h4>
              <p className="text-xs text-amber-800 mt-1">
                The drafted sanction terms deviate from the final Credit Committee approval granted by{' '}
                <strong>{sanction.finalApproverName}</strong> on {sanction.approvedDate}.
              </p>
              <div className="mt-2 p-2.5 bg-white/80 border border-amber-200 rounded text-xs text-slate-800">
                <span className="font-semibold text-slate-700">Documented Audit Justification: </span>
                <span className="italic">{sanction.termDeviationReason || terms.deviationNotes || 'Borrower requested revised tenor/limit.'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Grid: Approved vs Sanction */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Box 1: Credit Committee Approved Baseline */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Approved Baseline (Credit Committee)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">{sanction.approvalNumber}</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Sanction Ceiling</span>
              <span className="font-bold font-mono text-slate-900 text-sm block">
                ₹{sanction.approvedAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block">Approved Interest Rate</span>
              <span className="font-bold font-mono text-slate-900 text-sm block">
                {sanction.approvedInterestRate}% p.a.
              </span>
            </div>

            <div>
              <span className="text-slate-500 block">Approved Tenure</span>
              <span className="font-bold font-mono text-slate-900 block">
                {sanction.approvedTenureMonths} Months
              </span>
            </div>

            <div>
              <span className="text-slate-500 block">Approving Authority</span>
              <span className="font-semibold text-slate-900 block truncate">
                {sanction.finalApproverName}
              </span>
              <span className="text-[10px] text-slate-400">{sanction.finalApproverRole}</span>
            </div>
          </div>
        </div>

        {/* Box 2: Proposed / Active Sanction Terms */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Active Sanction Facility Terms
              </h3>
            </div>
            {isEditable && (
              <button
                onClick={onOpenEditModal}
                className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline"
              >
                Modify Terms
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Sanction Amount</span>
              <span className="font-bold font-mono text-slate-900 text-sm block">
                ₹{terms.amount.toLocaleString('en-IN')}
              </span>
              {terms.amount !== sanction.approvedAmount && (
                <span className="text-[10px] text-amber-700 font-medium">
                  (Δ ₹{(terms.amount - sanction.approvedAmount).toLocaleString('en-IN')})
                </span>
              )}
            </div>

            <div>
              <span className="text-slate-500 block">Interest Rate</span>
              <span className="font-bold font-mono text-slate-900 text-sm block">
                {terms.interestRate}% p.a.
              </span>
              {terms.interestRate !== sanction.approvedInterestRate && (
                <span className="text-[10px] text-amber-700 font-medium">
                  (Δ {(terms.interestRate - sanction.approvedInterestRate).toFixed(2)}%)
                </span>
              )}
            </div>

            <div>
              <span className="text-slate-500 block">Loan Tenure</span>
              <span className="font-bold font-mono text-slate-900 block">
                {terms.tenureMonths} Months
              </span>
            </div>

            <div>
              <span className="text-slate-500 block">Calculated Monthly EMI</span>
              <span className="font-bold font-mono text-emerald-800 text-sm block">
                ₹{terms.approxMonthlyEmi.toLocaleString('en-IN')} / mo
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Breakdown: Loan Facility & Repayment Specs */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-slate-600" />
          Facility Parameters & Repayment Structure
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div>
            <span className="text-slate-500 block">Interest Calculation Method</span>
            <span className="font-semibold text-slate-900 block mt-0.5">{terms.interestMethodology}</span>
            <span className="text-[11px] text-slate-400">Standard RBI monthly reducing schedule</span>
          </div>

          <div>
            <span className="text-slate-500 block">Repayment Frequency</span>
            <span className="font-semibold text-slate-900 block mt-0.5">{terms.repaymentFrequency}</span>
            <span className="text-[11px] text-slate-400">Monthly installment cycle</span>
          </div>

          <div>
            <span className="text-slate-500 block">Collection Mandate</span>
            <span className="font-semibold text-slate-900 block mt-0.5">{terms.paymentMethod}</span>
            <span className="text-[11px] text-slate-400">Auto-debit on 5th of every month</span>
          </div>

          <div>
            <span className="text-slate-500 block">First Repayment Date</span>
            <span className="font-semibold font-mono text-slate-900 block mt-0.5">
              {terms.firstRepaymentDatePlaceholder || '2026-10-05'}
            </span>
            <span className="text-[11px] text-slate-400">Post-disbursement initiation</span>
          </div>

          <div>
            <span className="text-slate-500 block">Moratorium / Grace Period</span>
            <span className="font-semibold text-slate-900 block mt-0.5">{terms.gracePeriodDays} Days</span>
            <span className="text-[11px] text-slate-400">Standard retail facility</span>
          </div>

          <div>
            <span className="text-slate-500 block">Sanction Purpose</span>
            <span className="font-semibold text-slate-900 block mt-0.5">{terms.purpose}</span>
            <span className="text-[11px] text-slate-400">End-use verified via KYC & declaration</span>
          </div>
        </div>
      </div>

      {/* Fee & Deduction Accounting Table */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-slate-600" />
          Pre-Disbursement Deductions & Net Disbursement Settlement
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                <th className="py-2.5 px-3">Fee / Charge Component</th>
                <th className="py-2.5 px-3">Taxability / Basis</th>
                <th className="py-2.5 px-3 text-right">Fee (Excl. Tax)</th>
                <th className="py-2.5 px-3 text-right">GST (18%)</th>
                <th className="py-2.5 px-3 text-right">Total Debit (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900">
                  Loan Processing Fee
                </td>
                <td className="py-2.5 px-3 text-slate-500">1.00% of Facility Amount</td>
                <td className="py-2.5 px-3 text-right font-mono">₹{terms.processingFee.toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-3 text-right font-mono">₹{terms.processingFeeGst.toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                  ₹{(terms.processingFee + terms.processingFeeGst).toLocaleString('en-IN')}
                </td>
              </tr>

              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900">
                  Documentation & Stamp Duty Charges
                </td>
                <td className="py-2.5 px-3 text-slate-500">Fixed Legal & e-Stamping Charge</td>
                <td className="py-2.5 px-3 text-right font-mono">₹{terms.documentationCharge.toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-400">Included</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                  ₹{terms.documentationCharge.toLocaleString('en-IN')}
                </td>
              </tr>

              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-900">
                  Credit Life / Loan Shield Premium
                </td>
                <td className="py-2.5 px-3 text-slate-500">Group Credit Life Cover (0.50%)</td>
                <td className="py-2.5 px-3 text-right font-mono">₹{terms.insuranceCharge.toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-400">Included</td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                  ₹{terms.insuranceCharge.toLocaleString('en-IN')}
                </td>
              </tr>

              {terms.otherCharges > 0 && (
                <tr>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    Other Incidental / Valuation Charges
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">Legal inspection / Field verification</td>
                  <td className="py-2.5 px-3 text-right font-mono">₹{terms.otherCharges.toLocaleString('en-IN')}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400">Included</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    ₹{terms.otherCharges.toLocaleString('en-IN')}
                  </td>
                </tr>
              )}

              <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                <td className="py-3 px-3 text-slate-800" colSpan={4}>
                  Total Upfront Deductions
                </td>
                <td className="py-3 px-3 text-right font-mono text-rose-700">
                  - ₹{totalDeductions.toLocaleString('en-IN')}
                </td>
              </tr>

              <tr className="bg-emerald-50/80 font-bold border-t border-emerald-200 text-sm">
                <td className="py-3 px-3 text-emerald-900" colSpan={4}>
                  Net Disbursable Amount (Beneficiary Payout)
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-800 text-base">
                  ₹{terms.netDisbursementAmount.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
