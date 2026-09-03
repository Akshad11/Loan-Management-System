import React from 'react';
import { CustomerRecord } from '../../types';
import { formatIndianCurrency, formatDateDisplay } from '../../utils/formatters';
import {
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Calendar,
  UserCheck,
  Building2,
  TrendingUp,
} from 'lucide-react';

interface CustomerSummaryProps {
  customer: CustomerRecord;
}

export const CustomerSummary: React.FC<CustomerSummaryProps> = ({ customer }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* Active Loans */}
      <div className="bg-white border border-slate-200 rounded p-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px] mb-1">
          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
          <span>Active Loans</span>
        </div>
        <div className="font-mono text-lg font-bold text-slate-900">
          {customer.activeLoanCount}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">Running accounts</div>
      </div>

      {/* Closed Loans */}
      <div className="bg-white border border-slate-200 rounded p-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px] mb-1">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>Closed Loans</span>
        </div>
        <div className="font-mono text-lg font-bold text-slate-900">
          {customer.closedLoanCount}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">Settled / Closed</div>
      </div>

      {/* Total Outstanding */}
      <div className="bg-white border border-slate-200 rounded p-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px] mb-1">
          <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
          <span>Total Outstanding</span>
        </div>
        <div className="font-mono text-base font-bold text-slate-900">
          {formatIndianCurrency(customer.totalOutstanding, true)}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">Principal + Accrued</div>
      </div>

      {/* Total Overdue */}
      <div className="bg-white border border-slate-200 rounded p-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px] mb-1">
          <AlertTriangle
            className={`w-3.5 h-3.5 ${
              customer.totalOverdue > 0 ? 'text-rose-600' : 'text-slate-400'
            }`}
          />
          <span>Total Overdue</span>
        </div>
        <div
          className={`font-mono text-base font-bold ${
            customer.totalOverdue > 0 ? 'text-rose-700' : 'text-slate-900'
          }`}
        >
          {formatIndianCurrency(customer.totalOverdue, true)}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">
          {customer.totalOverdue > 0 ? 'Action required' : '0 DPD (Clear)'}
        </div>
      </div>

      {/* Customer Since */}
      <div className="bg-white border border-slate-200 rounded p-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px] mb-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Customer Since</span>
        </div>
        <div className="font-medium text-slate-900 truncate">
          {formatDateDisplay(customer.createdDate)}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">Onboarding date</div>
      </div>

      {/* Assigned Officer */}
      <div className="bg-white border border-slate-200 rounded p-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 font-medium text-[11px] mb-1">
          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Assigned Officer</span>
        </div>
        <div className="font-medium text-slate-900 truncate">
          {customer.assignedOfficer || 'Siddharth Rao'}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5 truncate">{customer.branchName}</div>
      </div>
    </div>
  );
};
