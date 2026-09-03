import React from 'react';
import {
  User,
  Building2,
  Calendar,
  Percent,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Landmark,
  IndianRupee,
} from 'lucide-react';
import { LoanAccountRecord } from '../../types/loanAccountTypes';
import { formatCurrencyINR, formatDate } from '../../utils/formatters';

interface OverviewTabProps {
  loan: LoanAccountRecord;
  onNavigateModule?: (moduleName: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ loan, onNavigateModule }) => {
  return (
    <div className="space-y-6">
      {/* 1. Comprehensive Financial Breakdown Grid */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-blue-600" />
          Financial Summary & Balance Breakdown
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[11px] font-medium text-slate-500">Original Principal</span>
            <div className="text-base font-bold text-slate-900 font-mono mt-1">
              {formatCurrencyINR(loan.originalPrincipal, false)}
            </div>
            <span className="text-[10px] text-slate-400">Sanctioned Limit</span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[11px] font-medium text-slate-500">Disbursed Principal</span>
            <div className="text-base font-bold text-blue-700 font-mono mt-1">
              {formatCurrencyINR(loan.disbursedPrincipal, false)}
            </div>
            <span className="text-[10px] text-blue-600">Total Payout Settled</span>
          </div>

          <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-lg">
            <span className="text-[11px] font-bold text-blue-900">Principal Outstanding</span>
            <div className="text-base font-bold text-blue-800 font-mono mt-1">
              {formatCurrencyINR(loan.principalOutstanding, false)}
            </div>
            <span className="text-[10px] text-blue-600">Live Amortized Principal</span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[11px] font-medium text-slate-500">Interest Outstanding</span>
            <div className="text-base font-bold text-slate-900 font-mono mt-1">
              {formatCurrencyINR(loan.interestOutstanding, false)}
            </div>
            <span className="text-[10px] text-slate-400">Accrued / Due Interest</span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[11px] font-medium text-slate-500">Fee Outstanding</span>
            <div className="text-base font-bold text-slate-900 font-mono mt-1">
              {formatCurrencyINR(loan.feeOutstanding, false)}
            </div>
            <span className="text-[10px] text-slate-400">Levied Charges</span>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[11px] font-medium text-slate-500">Penalty Outstanding</span>
            <div className="text-base font-bold text-slate-900 font-mono mt-1">
              {formatCurrencyINR(loan.penaltyOutstanding, false)}
            </div>
            <span className="text-[10px] text-slate-400">Late Payment Penalties</span>
          </div>

          <div className="p-3.5 bg-purple-50/50 border border-purple-200 rounded-lg">
            <span className="text-[11px] font-bold text-purple-900">Total Net Outstanding</span>
            <div className="text-base font-bold text-purple-900 font-mono mt-1">
              {formatCurrencyINR(loan.totalOutstanding, false)}
            </div>
            <span className="text-[10px] text-purple-700">Principal + Interest + Fees</span>
          </div>

          <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-lg">
            <span className="text-[11px] font-bold text-emerald-900">Total Amount Repaid</span>
            <div className="text-base font-bold text-emerald-800 font-mono mt-1">
              {formatCurrencyINR(loan.totalPaidAmount, false)}
            </div>
            <span className="text-[10px] text-emerald-700">Principal: {formatCurrencyINR(loan.totalPrincipalPaid, false)}</span>
          </div>
        </div>
      </div>

      {/* 2. Facility Terms & Origination Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Facility Parameters */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-600" />
            Loan Facility Terms & Pricing
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Product Code & Name:</span>
              <span className="font-semibold text-slate-900">{loan.productName} ({loan.productCode})</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Annual Interest Rate:</span>
              <span className="font-bold text-blue-700 font-mono">{loan.interestRate.toFixed(2)}% p.a.</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Interest Methodology:</span>
              <span className="font-medium text-slate-800 uppercase font-mono">{loan.interestMethod.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Monthly EMI Amount:</span>
              <span className="font-bold text-slate-900 font-mono">{formatCurrencyINR(loan.emiAmount, false)}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Tenure & Instalments:</span>
              <span className="font-semibold text-slate-900">{loan.tenureMonths} Months ({loan.totalInstalments} Instalments)</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Remaining Instalments:</span>
              <span className="font-mono font-semibold text-slate-800">{loan.remainingInstalments} Instalments remaining</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Disbursement & Start Date:</span>
              <span className="font-medium text-slate-800">{formatDate(loan.disbursementDate)}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500">Maturity Date:</span>
              <span className="font-medium text-slate-800">{formatDate(loan.maturityDate)}</span>
            </div>
          </div>
        </div>

        {/* Borrower Profile & Servicing Details */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200 flex items-center gap-2">
            <User className="w-4 h-4 text-slate-600" />
            Borrower & Account Servicing
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Borrower Name:</span>
              <span className="font-bold text-slate-900">{loan.customerName}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Customer Number:</span>
              <span className="font-mono font-semibold text-slate-800">{loan.customerNumber}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Contact Number:</span>
              <span className="font-mono text-slate-800">{loan.customerMobile || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Assigned Branch:</span>
              <span className="font-medium text-slate-800">{loan.branchName}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Loan Servicing Officer:</span>
              <span className="font-semibold text-slate-900">{loan.assignedOfficer}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">DPD & Delinquency:</span>
              <span className="font-bold font-mono text-emerald-700">{loan.dpd} Days ({loan.dpdBucket})</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500">Active Schedule Version:</span>
              <span className="font-mono font-bold text-blue-700">Version {loan.currentScheduleVersion}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Origination Lineage & Traceability */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          End-to-End Origination Lineage & References
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Traceability links connecting this active loan account to its origination documents and authorizations.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">Origination Application</span>
            <div className="font-mono font-bold text-xs text-slate-900 mt-1">
              {loan.applicationNumber || 'APP-LEGACY'}
            </div>
            <button
              onClick={() => onNavigateModule && onNavigateModule('applications')}
              className="mt-2 text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              View Application <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">Sanction Authority Reference</span>
            <div className="font-mono font-bold text-xs text-slate-900 mt-1">
              {loan.sanctionNumber || 'SN-LEGACY'}
            </div>
            <button
              onClick={() => onNavigateModule && onNavigateModule('sanctions')}
              className="mt-2 text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              View Sanction <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">Primary Payout Disbursement</span>
            <div className="font-mono font-bold text-xs text-slate-900 mt-1">
              {loan.primaryDisbursementNumber || 'DSB-LEGACY'}
            </div>
            <button
              onClick={() => onNavigateModule && onNavigateModule('disbursements')}
              className="mt-2 text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              View Disbursement <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
