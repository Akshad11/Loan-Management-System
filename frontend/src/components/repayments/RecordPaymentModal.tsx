import React, { useState, useMemo } from 'react';
import {
  X,
  CreditCard,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { LoanAccountRecord } from '../../types/loanAccountTypes';
import {
  PaymentMethodType,
  RecordPaymentPayload,
} from '../../types/repaymentTypes';
import { formatCurrencyINR, formatDate } from '../../utils/formatters';
import { roundMoney } from '../../services/loanFinancialService';
import { ValidationPopup } from '../shared/ValidationPopup';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: RecordPaymentPayload) => void;
  loans: LoanAccountRecord[];
  initialLoanId?: string;
  currentUser?: { name: string; id: string; roleName: string };
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loans,
  initialLoanId,
  currentUser,
}) => {
  const [selectedLoanId, setSelectedLoanId] = useState<string>(
    initialLoanId || (loans.length > 0 ? loans[0].id : '')
  );
  const [loanSearch, setLoanSearch] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [valueDate, setValueDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('NACH_EMANDATE');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [channel, setChannel] = useState<string>('');
  const [notes, setNotes] = useState<string>(
    ''
  );
  const [requireVerification, setRequireVerification] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidationPopupOpen, setIsValidationPopupOpen] = useState<boolean>(false);

  const filteredLoans = useMemo(() => {
    if (!loanSearch.trim()) return loans.slice(0, 8);
    const q = loanSearch.toLowerCase();
    return loans.filter(
      (l) =>
        l.accountNumber.toLowerCase().includes(q) ||
        l.customerName.toLowerCase().includes(q) ||
        l.customerNumber?.toLowerCase().includes(q)
    );
  }, [loans, loanSearch]);

  const selectedLoan = useMemo(() => {
    return loans.find((l) => l.id === selectedLoanId);
  }, [loans, selectedLoanId]);

  // Live Allocation Preview Calculation
  const allocationPreview = useMemo(() => {
    const numAmount = parseFloat(amount);
    if (!selectedLoan || isNaN(numAmount) || numAmount <= 0) return null;

    let remaining = roundMoney(numAmount);
    let penaltyAlloc = 0;
    let feeAlloc = 0;
    let interestAlloc = 0;
    let principalAlloc = 0;
    let advanceAlloc = 0;

    // 1. Penalty
    if (selectedLoan.penaltyOutstanding > 0 && remaining > 0) {
      penaltyAlloc = Math.min(remaining, selectedLoan.penaltyOutstanding);
      remaining = roundMoney(remaining - penaltyAlloc);
    }

    // 2. Fee
    if (selectedLoan.feeOutstanding > 0 && remaining > 0) {
      feeAlloc = Math.min(remaining, selectedLoan.feeOutstanding);
      remaining = roundMoney(remaining - feeAlloc);
    }

    // 3. Interest
    if (selectedLoan.interestOutstanding > 0 && remaining > 0) {
      interestAlloc = Math.min(remaining, selectedLoan.interestOutstanding);
      remaining = roundMoney(remaining - interestAlloc);
    }

    // 4. Principal
    if (selectedLoan.principalOutstanding > 0 && remaining > 0) {
      principalAlloc = Math.min(remaining, selectedLoan.principalOutstanding);
      remaining = roundMoney(remaining - principalAlloc);
    }

    // 5. Unallocated
    const unallocated = remaining;

    return {
      penalty: penaltyAlloc,
      fees: feeAlloc,
      interest: interestAlloc,
      principal: principalAlloc,
      unallocated,
      totalAllocated: roundMoney(numAmount - unallocated),
    };
  }, [selectedLoan, amount]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!selectedLoanId) {
      newErrors.loanId = 'Please select an active loan account.';
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than ₹0.';
    }

    if (!paymentDate) {
      newErrors.paymentDate = 'Payment date is required.';
    }

    if (
      (paymentMethod === 'BANK_TRANSFER' ||
        paymentMethod === 'CHEQUE' ||
        paymentMethod === 'UPI') &&
      !referenceNumber.trim()
    ) {
      newErrors.referenceNumber =
        'Reference / UTR / Cheque number is mandatory for electronic and cheque payments.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsValidationPopupOpen(true);
      return;
    }

    const payload: RecordPaymentPayload = {
      loanId: selectedLoanId,
      amount: roundMoney(numAmount),
      paymentDate,
      valueDate: valueDate || paymentDate,
      paymentMethod,
      referenceNumber: referenceNumber.trim() || undefined,
      bankName: bankName.trim() || undefined,
      channel: channel.trim() || undefined,
      notes: notes.trim() || undefined,
      idempotencyKey: `IDEMP-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      requireVerification,
    };

    onSubmit(payload);
    onClose();
  };

  const setSuggestedAmount = (type: 'EMI' | 'TOTAL_DUE' | 'CUSTOM', val?: number) => {
    if (val !== undefined) {
      setAmount(val.toString());
    } else if (type === 'EMI' && selectedLoan) {
      setAmount(selectedLoan.emiAmount.toString());
    } else if (type === 'TOTAL_DUE' && selectedLoan) {
      setAmount(selectedLoan.totalOutstanding.toString());
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Record Real Loan Repayment</h3>
              <p className="text-xs text-slate-500">
                Post incoming payment directly to repayment schedule and financial ledgers.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Loan Account Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              1. Select Loan Account <span className="text-rose-500">*</span>
            </label>
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by loan account number or borrower name..."
                value={loanSearch}
                onChange={(e) => setLoanSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-100">
              {filteredLoans.map((l) => {
                const isSelected = l.id === selectedLoanId;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      setSelectedLoanId(l.id);
                      if (!amount && l.emiAmount) {
                        setAmount(l.emiAmount.toString());
                      }
                      setErrors((prev) => ({ ...prev, loanId: '' }));
                    }}
                    className={`p-2.5 rounded-lg text-left transition-all border text-xs ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold">{l.accountNumber}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-600">
                        {l.status}
                      </span>
                    </div>
                    <div className="text-[11px] font-medium text-slate-600 mt-0.5 truncate">
                      {l.customerName}
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                      <span>EMI: {formatCurrencyINR(l.emiAmount)}</span>
                      <span>Bal: {formatCurrencyINR(l.totalOutstanding)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.loanId && <p className="text-xs text-rose-500 mt-1">{errors.loanId}</p>}
          </div>

          {/* Selected Loan Snapshot Banner */}
          {selectedLoan && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-500">Customer:</span>{' '}
                <span className="font-bold text-slate-800">{selectedLoan.customerName}</span> (
                <span className="font-mono text-[11px]">{selectedLoan.customerNumber}</span>)
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-slate-500">EMI:</span>{' '}
                  <span className="font-bold text-slate-900 font-mono">
                    {formatCurrencyINR(selectedLoan.emiAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Total Outstanding:</span>{' '}
                  <span className="font-bold text-slate-900 font-mono">
                    {formatCurrencyINR(selectedLoan.totalOutstanding)}
                  </span>
                </div>
                {selectedLoan.overdueAmount > 0 && (
                  <div className="text-rose-600 font-bold">
                    Overdue: {formatCurrencyINR(selectedLoan.overdueAmount)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Details Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Amount */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setErrors((prev) => ({ ...prev, amount: '' }));
                  }}
                  className="w-full pl-7 pr-3 py-2 text-sm font-mono font-bold text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
              {selectedLoan && (
                <div className="flex items-center gap-1.5 mt-1.5 text-[11px]">
                  <span className="text-slate-400">Quick:</span>
                  <button
                    type="button"
                    onClick={() => setSuggestedAmount('EMI')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium text-[10px]"
                  >
                    1 EMI ({formatCurrencyINR(selectedLoan.emiAmount)})
                  </button>
                  {selectedLoan.overdueAmount > 0 && (
                    <button
                      type="button"
                      onClick={() => setSuggestedAmount('CUSTOM', selectedLoan.overdueAmount)}
                      className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md font-medium text-[10px]"
                    >
                      Overdue ({formatCurrencyINR(selectedLoan.overdueAmount)})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSuggestedAmount('TOTAL_DUE')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium text-[10px]"
                  >
                    Full Balance
                  </button>
                </div>
              )}
              {errors.amount && <p className="text-xs text-rose-500 mt-1">{errors.amount}</p>}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Payment Method <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="NACH_EMANDATE">NACH / eMandate Auto-Debit</option>
                <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS / IMPS)</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="CHEQUE">Cheque / Demand Draft</option>
                <option value="CASH">Cash Deposit at Counter</option>
                <option value="CARD">Debit / Credit Card</option>
                <option value="MANUAL_ADJUSTMENT">Manual Ledger Adjustment</option>
              </select>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Value Date */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Value Date (Credit in Bank)
              </label>
              <input
                type="date"
                value={valueDate}
                onChange={(e) => setValueDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Reference Number */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                External Reference / UTR / Cheque #
              </label>
              <input
                type="text"
                placeholder="e.g. HDFC2621890012 or CHQ-482019"
                value={referenceNumber}
                onChange={(e) => {
                  setReferenceNumber(e.target.value);
                  setErrors((prev) => ({ ...prev, referenceNumber: '' }));
                }}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.referenceNumber && (
                <p className="text-xs text-rose-500 mt-1">{errors.referenceNumber}</p>
              )}
            </div>

            {/* Bank Name / Channel */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Bank / Clearing Channel
              </label>
              <input
                type="text"
                placeholder="e.g. HDFC Bank, NPCI NACH Clearing"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Payment Remarks & Notes
            </label>
            <input
              type="text"
              placeholder="Optional notes regarding this collection..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Maker-Checker Toggle */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800">
                Route for Maker-Checker Verification
              </span>
              <p className="text-[11px] text-slate-500">
                Leave unchecked to automatically post and allocate immediately. Check if supervisor
                verification is required prior to ledger posting.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={requireVerification}
                onChange={(e) => setRequireVerification(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Live Waterfall Allocation Preview */}
          {allocationPreview && (
            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Deterministic Waterfall Allocation Preview
                </span>
                <span className="font-mono text-xs font-bold text-blue-900">
                  Total: {formatCurrencyINR(parseFloat(amount) || 0)}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block">1. Penalty</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatCurrencyINR(allocationPreview.penalty)}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block">2. Fees</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatCurrencyINR(allocationPreview.fees)}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block">3. Interest</span>
                  <span className="font-mono font-bold text-blue-700">
                    {formatCurrencyINR(allocationPreview.interest)}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block">4. Principal</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {formatCurrencyINR(allocationPreview.principal)}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-blue-100 shadow-2xs">
                  <span className="text-[10px] text-slate-500 block">5. Suspense</span>
                  <span
                    className={`font-mono font-bold ${
                      allocationPreview.unallocated > 0 ? 'text-amber-600' : 'text-slate-400'
                    }`}
                  >
                    {formatCurrencyINR(allocationPreview.unallocated)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="text-[11px] text-slate-500">
            Posting by: <span className="font-semibold text-slate-700">{currentUser?.name || 'Operations Officer'}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow transition-all"
            >
              {requireVerification ? 'Save & Submit for Verification' : 'Post Payment & Generate Receipt'}
            </button>
          </div>
        </div>

        {/* Validation Warning Popup */}
        <ValidationPopup
          isOpen={isValidationPopupOpen}
          onClose={() => setIsValidationPopupOpen(false)}
          title="Payment Validation Incomplete"
          subtitle="Please correct the following requirements before posting this repayment transaction:"
          errors={errors}
          fixLabel="Back to Payment Form"
        />
      </div>
    </div>
  );
};
