import React from 'react';
import {
  CreditCard,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  Landmark,
} from 'lucide-react';
import { LoanAccountRecord, LoanRepaymentSettings } from '../../types/loanAccountTypes';
import { formatDate } from '../../utils/formatters';

interface RepaymentSetupTabProps {
  loan: LoanAccountRecord;
  onEditSettings: () => void;
  canManageSettings?: boolean;
}

export const RepaymentSetupTab: React.FC<RepaymentSetupTabProps> = ({
  loan,
  onEditSettings,
  canManageSettings = true,
}) => {
  const settings: LoanRepaymentSettings = loan.repaymentSettings || {
    id: 'lrs_default',
    loanId: loan.id,
    repaymentFrequency: loan.repaymentFrequency,
    paymentMethod: 'NACH_EMANDATE',
    mandateStatus: 'ACTIVE',
    preferredDebitDate: 5,
    gracePeriodDays: 3,
    updatedAt: loan.updatedAt,
    updatedBy: 'Operations Officer',
  };

  const getMandateBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            ACTIVE / REGISTERED
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            PENDING VALIDATION
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" />
            MANDATE FAILED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200">
            NOT REQUIRED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600" />
            Repayment Channel & Auto-Debit Configuration
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure primary repayment collection rails, eMandate auto-debit accounts, and debit cycle schedules.
          </p>
        </div>

        {canManageSettings && (
          <button
            onClick={onEditSettings}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Configure Repayment Setup
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mandate & Payment Rail Setup */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Direct Debit Mandate Status
            </h4>
            {getMandateBadge(settings.mandateStatus)}
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Payment Collection Method:</span>
              <span className="font-bold text-slate-900">{settings.paymentMethod.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">UMRN / Mandate Reference:</span>
              <span className="font-mono font-bold text-blue-700">{settings.mandateReference || '—'}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Repayment Frequency:</span>
              <span className="font-semibold text-slate-800">{settings.repaymentFrequency}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Preferred Auto-Debit Day:</span>
              <span className="font-mono font-bold text-slate-900">{settings.preferredDebitDate}th of every month</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500">Grace Period Allowed:</span>
              <span className="font-semibold text-slate-800">{settings.gracePeriodDays} Days from Due Date</span>
            </div>
          </div>
        </div>

        {/* Bank Account Details */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Landmark className="w-4 h-4 text-blue-600" />
              Settlement & Debiting Bank Account
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Bank Name:</span>
              <span className="font-semibold text-slate-900">{settings.bankName || 'HDFC Bank Ltd'}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Account Holder Name:</span>
              <span className="font-semibold text-slate-900">{settings.accountHolderName || loan.customerName}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Account Number:</span>
              <span className="font-mono font-bold text-slate-900">{settings.bankAccountMasked || '•••• •••• •••• 1284'}</span>
            </div>
            <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">IFSC Code:</span>
              <span className="font-mono text-slate-800">{settings.ifscCode || 'HDFC0000120'}</span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500">Last Configuration Update:</span>
              <span className="font-mono text-slate-500">{formatDate(settings.updatedAt)} by {settings.updatedBy}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
