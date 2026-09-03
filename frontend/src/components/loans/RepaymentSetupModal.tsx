import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import {
  LoanAccountRecord,
  LoanRepaymentSettings,
  LoanPaymentMethod,
  MandateStatus,
  LoanRepaymentFrequency,
} from '../../types/loanAccountTypes';

interface RepaymentSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: LoanAccountRecord;
  onSave: (updates: Partial<LoanRepaymentSettings>) => void;
}

export const RepaymentSetupModal: React.FC<RepaymentSetupModalProps> = ({
  isOpen,
  onClose,
  loan,
  onSave,
}) => {
  const currentSettings = loan.repaymentSettings || {
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

  const [paymentMethod, setPaymentMethod] = useState<LoanPaymentMethod>(
    currentSettings.paymentMethod || 'NACH_EMANDATE'
  );
  const [mandateStatus, setMandateStatus] = useState<MandateStatus>(
    currentSettings.mandateStatus || 'ACTIVE'
  );
  const [preferredDebitDate, setPreferredDebitDate] = useState<number>(
    currentSettings.preferredDebitDate || 5
  );
  const [gracePeriodDays, setGracePeriodDays] = useState<number>(
    currentSettings.gracePeriodDays || 3
  );
  const [bankName, setBankName] = useState<string>(
    currentSettings.bankName || 'HDFC Bank Ltd'
  );
  const [bankAccountMasked, setBankAccountMasked] = useState<string>(
    currentSettings.bankAccountMasked || '•••• •••• •••• 1284'
  );
  const [ifscCode, setIfscCode] = useState<string>(
    currentSettings.ifscCode || 'HDFC0000120'
  );
  const [accountHolderName, setAccountHolderName] = useState<string>(
    currentSettings.accountHolderName || loan.customerName
  );
  const [mandateReference, setMandateReference] = useState<string>(
    currentSettings.mandateReference || `UMRN-HDFC-2026-${Date.now().toString().slice(-6)}`
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      paymentMethod,
      mandateStatus,
      preferredDebitDate,
      gracePeriodDays,
      bankName,
      bankAccountMasked,
      ifscCode,
      accountHolderName,
      mandateReference,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Configure Repayment Setup</h3>
              <p className="text-[11px] text-slate-500 font-mono">Account: {loan.accountNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Channel / Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as LoanPaymentMethod)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="NACH_EMANDATE">NACH / eMandate Auto-Debit</option>
                <option value="BANK_TRANSFER">Direct Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI AutoPay / QR</option>
                <option value="CHEQUE">PDC / CTS Cheque</option>
                <option value="MANUAL_POSTING">Manual Branch Posting</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                eMandate Registration Status
              </label>
              <select
                value={mandateStatus}
                onChange={(e) => setMandateStatus(e.target.value as MandateStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="ACTIVE">ACTIVE / Validated</option>
                <option value="PENDING">PENDING Bank Approval</option>
                <option value="FAILED">FAILED Registration</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="NOT_REQUIRED">NOT REQUIRED</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Preferred Auto-Debit Day (1-31)
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={preferredDebitDate}
                onChange={(e) => setPreferredDebitDate(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Grace Period Days
              </label>
              <input
                type="number"
                min={0}
                max={15}
                value={gracePeriodDays}
                onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              UMRN / Mandate Reference Number
            </label>
            <input
              type="text"
              value={mandateReference}
              onChange={(e) => setMandateReference(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2 border-t border-slate-200">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Registered Bank Account Details
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Account Holder Name</label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              Save Repayment Setup
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
