import React, { useState } from 'react';
import {
  X,
  Receipt,
  FileText,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  Building2,
  Calendar,
  CreditCard,
  Layers,
  History,
  ShieldAlert,
  ArrowDownRight,
  Printer,
  Download,
} from 'lucide-react';
import { PaymentRecord } from '../../types/repaymentTypes';
import { formatCurrencyINR, formatDate } from '../../utils/formatters';

interface PaymentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentRecord | null;
  onVerify?: (paymentId: string) => void;
  onPost?: (paymentId: string) => void;
  onReverse?: (paymentId: string, reason: string) => void;
  onViewReceipt?: (paymentId: string) => void;
  canVerify?: boolean;
  canPost?: boolean;
  canReverse?: boolean;
  currentUser?: { name: string; id: string; roleName: string };
}

export const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({
  isOpen,
  onClose,
  payment,
  onVerify,
  onPost,
  onReverse,
  onViewReceipt,
  canVerify = true,
  canPost = true,
  canReverse = true,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'allocations' | 'history'>('summary');
  const [isReversalDialogOpen, setIsReversalDialogOpen] = useState(false);
  const [reversalReason, setReversalReason] = useState('');
  const [reversalError, setReversalError] = useState('');

  if (!isOpen || !payment) return null;

  const handleConfirmReversal = () => {
    if (!reversalReason.trim()) {
      setReversalError('Please provide a mandatory justification for reversing this payment.');
      return;
    }
    if (onReverse) {
      onReverse(payment.id, reversalReason.trim());
    }
    setIsReversalDialogOpen(false);
    setReversalReason('');
    setReversalError('');
  };

  const isPosted =
    payment.status === 'POSTED' ||
    payment.status === 'FULLY_ALLOCATED' ||
    payment.status === 'PARTIALLY_ALLOCATED';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${
                payment.status === 'REVERSED'
                  ? 'bg-rose-100 text-rose-700'
                  : isPosted
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 text-white'
              }`}
            >
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-mono text-slate-900">
                  {payment.paymentNumber}
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    payment.status === 'POSTED' || payment.status === 'FULLY_ALLOCATED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : payment.status === 'PARTIALLY_ALLOCATED'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : payment.status === 'PENDING_VERIFICATION'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : payment.status === 'REVERSED'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {payment.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Loan Account: <span className="font-mono font-semibold text-slate-700">{payment.accountNumber}</span> • Customer: <span className="font-semibold text-slate-700">{payment.customerName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {payment.receipt && (
              <button
                onClick={() => onViewReceipt && onViewReceipt(payment.id)}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-blue-200"
              >
                <FileText className="w-3.5 h-3.5" />
                View Receipt
              </button>
            )}

            {isPosted && canReverse && payment.status !== 'REVERSED' && (
              <button
                onClick={() => setIsReversalDialogOpen(true)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-rose-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reverse Payment
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'summary'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Payment Summary
          </button>
          <button
            onClick={() => setActiveTab('allocations')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'allocations'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Allocation Breakdown
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] text-slate-600">
              {payment.allocations?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Audit Trail
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] text-slate-600">
              {payment.history?.length || 0}
            </span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Reversal Banner if Reversed */}
          {payment.status === 'REVERSED' && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-900 block text-sm">
                  Compensating Reversal Executed
                </span>
                <p className="text-rose-700 mt-0.5">
                  This payment was reversed by{' '}
                  <span className="font-semibold">{payment.reversedByName || 'Authorized Officer'}</span>{' '}
                  on {payment.reversedAt ? formatDate(payment.reversedAt) : 'N/A'}.
                </p>
                {payment.reversalReason && (
                  <p className="text-rose-800 font-medium mt-1">
                    Reason: <span className="font-normal italic">"{payment.reversalReason}"</span>
                  </p>
                )}
                {payment.reversal?.reversalNumber && (
                  <p className="text-rose-900 font-mono text-[11px] mt-1">
                    Compensating Ref: {payment.reversal.reversalNumber}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Financial KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-xs text-slate-500 font-semibold block">Total Amount Paid</span>
                  <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
                    {formatCurrencyINR(payment.amount)}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Method: {payment.paymentMethod.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
                  <span className="text-xs text-emerald-800 font-semibold block">Allocated to Dues</span>
                  <span className="text-xl font-bold font-mono text-emerald-900 mt-1 block">
                    {formatCurrencyINR(payment.allocatedAmount)}
                  </span>
                  <span className="text-[11px] text-emerald-700 mt-0.5 block">
                    Principal, Interest & Charges
                  </span>
                </div>

                <div
                  className={`p-4 rounded-xl border ${
                    payment.unallocatedAmount > 0
                      ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <span className="text-xs font-semibold block">Suspense / Unallocated</span>
                  <span className="text-xl font-bold font-mono mt-1 block">
                    {formatCurrencyINR(payment.unallocatedAmount)}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    Excess / Advance funds
                  </span>
                </div>
              </div>

              {/* Key Attributes Grid */}
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4 pb-2 border-b border-slate-100">
                  Payment Attributes & Identifiers
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Internal Payment ID</span>
                    <span className="font-mono font-bold text-slate-800">{payment.paymentNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">External UTR / Reference</span>
                    <span className="font-mono font-bold text-slate-800">
                      {payment.referenceNumber || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Official Receipt #</span>
                    <span className="font-mono font-bold text-blue-600">
                      {payment.receiptNumber || 'Pending Generation'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Payment Date</span>
                    <span className="font-medium text-slate-800">{formatDate(payment.paymentDate)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Value Date (Bank Credit)</span>
                    <span className="font-medium text-slate-800">{formatDate(payment.valueDate)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Bank / Channel</span>
                    <span className="font-medium text-slate-800">
                      {payment.bankName || payment.channel || 'Direct Clearing'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Recorded By</span>
                    <span className="font-medium text-slate-800">{payment.receivedByName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Posting Authority</span>
                    <span className="font-medium text-slate-800">
                      {payment.postedByName || 'Automated / Pending'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Branch</span>
                    <span className="font-medium text-slate-800">
                      {payment.branchName || 'Panaji Main Branch'}
                    </span>
                  </div>
                </div>

                {payment.notes && (
                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
                    <span className="text-slate-400 block mb-0.5">Remarks / Collection Notes:</span>
                    <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                      "{payment.notes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons for Pending Verification Payments */}
              {payment.status === 'PENDING_VERIFICATION' && (
                <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">
                      Pending Supervisor Verification (Maker-Checker)
                    </span>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      Segregation of duties: Creator ({payment.receivedByName}) cannot verify.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {canVerify && payment.receivedBy !== currentUser?.name && (
                      <button
                        onClick={() => onVerify && onVerify(payment.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                      >
                        Verify Payment
                      </button>
                    )}
                  </div>
                </div>
              )}

              {payment.status === 'VERIFIED' && (
                <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-blue-900 block">
                      Verified & Ready for Final Ledger Posting
                    </span>
                    <p className="text-[11px] text-blue-700 mt-0.5">
                      Verified by {payment.verifiedByName}. Click post to update schedule and loan balance.
                    </p>
                  </div>
                  {canPost && (
                    <button
                      onClick={() => onPost && onPost(payment.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                    >
                      Post to Ledgers
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'allocations' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Itemized Component Allocations
                </h4>
                <span className="text-xs text-slate-500">
                  Total Allocated:{' '}
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrencyINR(payment.allocatedAmount)}
                  </span>
                </span>
              </div>

              {(!payment.allocations || payment.allocations.length === 0) ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200">
                  <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">
                    No allocations created yet. Allocations generate automatically upon posting.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Allocation ID</th>
                        <th className="py-2.5 px-3">Target Component</th>
                        <th className="py-2.5 px-3">Instalment #</th>
                        <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3">Allocated By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payment.allocations.map((alloc) => (
                        <tr key={alloc.id} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                            {alloc.id}
                          </td>
                          <td className="py-2.5 px-3 font-semibold">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold ${
                                alloc.allocationType === 'PRINCIPAL' ||
                                alloc.allocationType === 'ADVANCE_PRINCIPAL'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : alloc.allocationType === 'INTEREST'
                                  ? 'bg-blue-100 text-blue-800'
                                  : alloc.allocationType === 'PENALTY'
                                  ? 'bg-rose-100 text-rose-800'
                                  : alloc.allocationType === 'FEE'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {alloc.allocationType.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700">
                            {alloc.instalmentNumber ? `#${alloc.instalmentNumber}` : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            {formatCurrencyINR(alloc.amount)}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                alloc.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {alloc.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                            {alloc.createdBy}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Immutable Lifecycle Audit Trail
              </h4>
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 divide-y divide-slate-100">
                {(payment.history || []).map((ev, idx) => (
                  <div key={ev.id || idx} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{ev.event}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600">{ev.actorName} ({ev.actorRole})</span>
                      </div>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {formatDate(ev.timestamp)}
                      </span>
                    </div>
                    {ev.notes && (
                      <p className="text-xs text-slate-600 mt-0.5">{ev.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reversal Confirmation Dialog */}
        {isReversalDialogOpen && (
          <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">
                Confirm Payment Reversal
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Reversing this payment of <span className="font-bold text-slate-800">{formatCurrencyINR(payment.amount)}</span> will create a compensating reversal transaction, restore schedule instalment balances, and re-open dues on the loan account.
              </p>

              <div className="mb-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Mandatory Reversal Justification <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Bank chargeback / Bounced cheque / Erroneous manual entry..."
                  value={reversalReason}
                  onChange={(e) => {
                    setReversalReason(e.target.value);
                    setReversalError('');
                  }}
                  className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                {reversalError && (
                  <p className="text-xs text-rose-500 mt-1">{reversalError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReversalDialogOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReversal}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
                >
                  Confirm & Reverse
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
