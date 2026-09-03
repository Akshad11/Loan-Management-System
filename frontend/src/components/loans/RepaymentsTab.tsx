import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Receipt,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Eye,
  FileText,
} from 'lucide-react';
import { LoanAccountRecord } from '../../types/loanAccountTypes';
import { PaymentRecord } from '../../types/repaymentTypes';
import { formatCurrencyINR, formatDate } from '../../utils/formatters';
import { PaymentDetailModal } from '../repayments/PaymentDetailModal';
import { PaymentReceiptModal } from '../repayments/PaymentReceiptModal';
import { RecordPaymentModal } from '../repayments/RecordPaymentModal';

interface RepaymentsTabProps {
  loan: LoanAccountRecord;
  store: any;
  currentUser?: { name: string; id: string; roleName: string };
  canManageRepayments?: boolean;
}

export const RepaymentsTab: React.FC<RepaymentsTabProps> = ({
  loan,
  store,
  currentUser,
  canManageRepayments = true,
}) => {
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const payments: PaymentRecord[] = store.getPaymentsByLoanId(loan.id);

  const handleOpenDetail = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setIsDetailModalOpen(true);
  };

  const handleOpenReceipt = (paymentId: string) => {
    const payment = store.getPaymentById(paymentId);
    if (payment) {
      setSelectedPayment(payment);
      setIsReceiptModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold block">Total Principal Paid</span>
          <span className="text-lg font-bold font-mono text-emerald-700 mt-1 block">
            {formatCurrencyINR(loan.totalPrincipalPaid)}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Original: {formatCurrencyINR(loan.originalPrincipal)}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold block">Total Interest Paid</span>
          <span className="text-lg font-bold font-mono text-blue-700 mt-1 block">
            {formatCurrencyINR(loan.totalInterestPaid)}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Rate: {loan.interestRate}% p.a.
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold block">Current Total Outstanding</span>
          <span className="text-lg font-bold font-mono text-slate-900 mt-1 block">
            {formatCurrencyINR(loan.totalOutstanding)}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Principal: {formatCurrencyINR(loan.principalOutstanding)}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Next Scheduled Due</span>
            <span className="text-sm font-bold text-slate-800 mt-1 block">
              {formatDate(loan.nextDueDate)}
            </span>
          </div>
          {canManageRepayments && loan.status !== 'CLOSED' && loan.status !== 'CANCELLED' && (
            <button
              onClick={() => setIsRecordModalOpen(true)}
              className="mt-2 w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Record Repayment
            </button>
          )}
        </div>
      </div>

      {/* Repayments History Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Loan Repayment & Collection History ({payments.length})
            </h4>
          </div>

          {canManageRepayments && (
            <button
              onClick={() => setIsRecordModalOpen(true)}
              className="px-3 py-1 bg-white hover:bg-slate-100 text-blue-600 rounded-lg text-xs font-bold border border-blue-200 flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Receive Payment
            </button>
          )}
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-12 bg-white">
            <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h5 className="text-sm font-bold text-slate-700">No Repayments Recorded Yet</h5>
            <p className="text-xs text-slate-500 mt-0.5">
              Incoming NACH debits or counter collections for this loan will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Payment #</th>
                  <th className="py-2.5 px-4">Payment Date</th>
                  <th className="py-2.5 px-4">Method & Channel</th>
                  <th className="py-2.5 px-4">Reference / UTR</th>
                  <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                  <th className="py-2.5 px-4 text-right">Allocated (₹)</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-center">Receipt</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {p.paymentNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{formatDate(p.paymentDate)}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {p.paymentMethod.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {p.referenceNumber || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrencyINR(p.amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      {formatCurrencyINR(p.allocatedAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.status === 'POSTED' || p.status === 'FULLY_ALLOCATED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'PARTIALLY_ALLOCATED'
                            ? 'bg-blue-100 text-blue-800'
                            : p.status === 'PENDING_VERIFICATION'
                            ? 'bg-amber-100 text-amber-800'
                            : p.status === 'REVERSED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {p.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.receipt ? (
                        <button
                          onClick={() => handleOpenReceipt(p.id)}
                          className="font-mono text-[11px] text-blue-600 hover:text-blue-800 hover:underline font-bold"
                        >
                          {p.receipt.receiptNumber}
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(p)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-[11px] transition-colors"
                      >
                        View Breakdown
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {isDetailModalOpen && selectedPayment && (
        <PaymentDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          payment={selectedPayment}
          onVerify={(pid) => {
            store.verifyPayment(
              pid,
              currentUser?.name || 'Branch Manager',
              currentUser?.roleName || 'Branch Manager'
            );
            setSelectedPayment(store.getPaymentById(pid));
          }}
          onPost={(pid) => {
            store.postPayment(
              pid,
              currentUser?.name || 'Operations Officer',
              currentUser?.roleName || 'Operations Officer'
            );
            setSelectedPayment(store.getPaymentById(pid));
          }}
          onReverse={(pid, reason) => {
            store.reversePayment(
              pid,
              reason,
              undefined,
              currentUser?.name || 'Branch Manager',
              currentUser?.roleName || 'Branch Manager'
            );
            setSelectedPayment(store.getPaymentById(pid));
          }}
          onViewReceipt={(pid) => {
            setIsDetailModalOpen(false);
            handleOpenReceipt(pid);
          }}
          currentUser={currentUser}
        />
      )}

      {isReceiptModalOpen && selectedPayment?.receipt && (
        <PaymentReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          receipt={selectedPayment.receipt}
        />
      )}

      {isRecordModalOpen && (
        <RecordPaymentModal
          isOpen={isRecordModalOpen}
          onClose={() => setIsRecordModalOpen(false)}
          onSubmit={(payload) => {
            store.recordPayment(
              payload,
              currentUser?.name || 'Operations Officer',
              currentUser?.roleName || 'Operations Officer'
            );
          }}
          loans={[loan]}
          initialLoanId={loan.id}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};
