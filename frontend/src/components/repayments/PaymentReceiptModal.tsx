import React from 'react';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  Landmark,
  ShieldCheck,
  FileText,
  QrCode,
} from 'lucide-react';
import { PaymentReceiptRecord } from '../../types/repaymentTypes';
import { formatCurrencyINR, formatDate } from '../../utils/formatters';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: PaymentReceiptRecord | null;
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  receipt,
}) => {
  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Top Actions */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <FileText className="w-4 h-4 text-blue-600" />
            Official Repayment Receipt Document
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Official Printable Receipt Document */}
        <div id="repayment-receipt-print" className="p-8 space-y-6 text-slate-800 bg-white">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Landmark className="w-6 h-6 text-blue-600" />
                <span className="text-base font-black tracking-tight text-slate-900 uppercase">
                  Apex Commercial Finance Ltd.
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Licensed Non-Banking Financial Company (NBFC-ND-SI)
              </p>
              <p className="text-[11px] text-slate-500">
                Corporate Office: Panaji Financial Centre, Goa - 403001
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full uppercase tracking-wider mb-1">
                Original Receipt
              </span>
              <div className="font-mono text-sm font-bold text-slate-900">
                {receipt.receiptNumber}
              </div>
              <div className="text-[11px] text-slate-500">
                Date: {formatDate(receipt.generatedAt)}
              </div>
            </div>
          </div>

          {/* Amount Paid Highlight */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-semibold block">Total Amount Received</span>
              <span className="text-2xl font-black font-mono text-slate-900 mt-0.5 block">
                {formatCurrencyINR(receipt.amount)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 font-semibold block">Payment Mode</span>
              <span className="text-xs font-bold text-slate-800 mt-0.5 block">
                {receipt.paymentMethod}
              </span>
              {receipt.referenceNumber && (
                <span className="text-[11px] font-mono text-slate-500 mt-0.5 block">
                  Ref: {receipt.referenceNumber}
                </span>
              )}
            </div>
          </div>

          {/* Borrower & Loan Account Details */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50/50 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-bold text-[10px] uppercase block mb-1">
                Borrower Details
              </span>
              <div className="font-bold text-slate-900 text-sm">{receipt.customerName}</div>
              <div className="text-slate-600 font-mono text-[11px] mt-0.5">
                Customer ID: {receipt.customerNumber || receipt.customerId}
              </div>
            </div>

            <div className="p-3 bg-slate-50/50 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-bold text-[10px] uppercase block mb-1">
                Loan Account Details
              </span>
              <div className="font-mono font-bold text-slate-900 text-sm">
                {receipt.accountNumber}
              </div>
              <div className="text-slate-600 text-[11px] mt-0.5">
                Payment Date: {formatDate(receipt.paymentDate)}
              </div>
            </div>
          </div>

          {/* Allocation Breakdown Table */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
              Payment Allocation Breakdown
            </span>
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="py-2 px-3">Description / Component</th>
                    <th className="py-2 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receipt.allocationSummary.principal > 0 && (
                    <tr>
                      <td className="py-2 px-3 text-slate-700">Principal Due / Repayment</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold">
                        {formatCurrencyINR(receipt.allocationSummary.principal)}
                      </td>
                    </tr>
                  )}
                  {receipt.allocationSummary.interest > 0 && (
                    <tr>
                      <td className="py-2 px-3 text-slate-700">Interest Component</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold">
                        {formatCurrencyINR(receipt.allocationSummary.interest)}
                      </td>
                    </tr>
                  )}
                  {receipt.allocationSummary.fees > 0 && (
                    <tr>
                      <td className="py-2 px-3 text-slate-700">Fees / Charges</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold">
                        {formatCurrencyINR(receipt.allocationSummary.fees)}
                      </td>
                    </tr>
                  )}
                  {receipt.allocationSummary.penalty > 0 && (
                    <tr>
                      <td className="py-2 px-3 text-slate-700">Overdue Penalty</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold">
                        {formatCurrencyINR(receipt.allocationSummary.penalty)}
                      </td>
                    </tr>
                  )}
                  {receipt.allocationSummary.advancePrincipal > 0 && (
                    <tr>
                      <td className="py-2 px-3 text-slate-700">Advance Principal Prepayment</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold">
                        {formatCurrencyINR(receipt.allocationSummary.advancePrincipal)}
                      </td>
                    </tr>
                  )}
                  {receipt.allocationSummary.unallocated > 0 && (
                    <tr className="bg-amber-50/50">
                      <td className="py-2 px-3 text-amber-800 font-semibold">
                        Unallocated / Suspense Credit
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-amber-900">
                        {formatCurrencyINR(receipt.allocationSummary.unallocated)}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                  <tr>
                    <td className="py-2.5 px-3">Total Amount Paid</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-900">
                      {formatCurrencyINR(receipt.amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Post Payment Balance Summary */}
          {receipt.postPaymentBalances && (
            <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-3 text-xs flex justify-between items-center">
              <div>
                <span className="text-slate-500">Remaining Principal:</span>{' '}
                <span className="font-mono font-bold text-slate-900">
                  {formatCurrencyINR(receipt.postPaymentBalances.remainingPrincipal)}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Next Due Date:</span>{' '}
                <span className="font-bold text-slate-800">
                  {formatDate(receipt.postPaymentBalances.nextDueDate)}
                </span>
              </div>
            </div>
          )}

          {/* Footer & Watermark */}
          <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Computer generated receipt. No physical signature required.</span>
            </div>
            <div>Generated by: {receipt.generatedBy}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
