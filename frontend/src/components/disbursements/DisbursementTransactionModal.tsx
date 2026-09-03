import React, { useState } from 'react';
import { DisbursementRecord, DisbursementRequestRecord, PaymentMethod } from '../../types/disbursementTypes';
import { ArrowUpRight, X, Landmark, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';

interface DisbursementTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  disbursement: DisbursementRecord;
  request: DisbursementRequestRecord;
  onExecuteTransaction: (data: {
    paymentMethod: PaymentMethod;
    utrNumber?: string;
    externalReference?: string;
    simulateFailure?: boolean;
    failureReason?: string;
  }) => void;
}

export const DisbursementTransactionModal: React.FC<DisbursementTransactionModalProps> = ({
  isOpen,
  onClose,
  disbursement,
  request,
  onExecuteTransaction,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(request.paymentMethod || 'NEFT');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [simulateFailure, setSimulateFailure] = useState<boolean>(false);
  const [failureReason, setFailureReason] = useState<string>(
    'Beneficiary bank network rejected transaction / IMPS velocity limit exceeded.'
  );

  if (!isOpen) return null;

  const beneficiary =
    disbursement.beneficiaries.find((b) => b.id === request.beneficiaryId) ||
    disbursement.beneficiaries[0];

  const handleExecute = () => {
    onExecuteTransaction({
      paymentMethod,
      utrNumber: utrNumber.trim() || undefined,
      simulateFailure,
      failureReason: simulateFailure ? failureReason.trim() : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-300 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Execute Banking Disbursement Payout</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Amount Box */}
          <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
                Disbursement Amount
              </span>
              <span className="text-xl font-mono font-bold text-emerald-950">
                ₹{request.requestedAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-mono block">{request.requestNumber}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Authorized for Payout
              </span>
            </div>
          </div>

          {/* Beneficiary Details */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Beneficiary:</span>
              <span className="font-bold text-slate-900">{beneficiary?.beneficiaryName || disbursement.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Bank & Account:</span>
              <span className="font-mono text-slate-900">
                {beneficiary?.bankName || 'HDFC Bank'} • {beneficiary?.accountNumberMasked || '•••• •••• •••• 0192'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">IFSC Code:</span>
              <span className="font-mono text-slate-900">{beneficiary?.ifscCode || 'HDFC0000120'}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Payment Rail / Method</label>
            <div className="grid grid-cols-4 gap-2">
              {(['NEFT', 'RTGS', 'IMPS', 'DIRECT_TRANSFER'] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPaymentMethod(m)}
                  className={`py-2 px-2 rounded-lg border font-bold text-center text-xs transition-all ${
                    paymentMethod === m
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {m === 'DIRECT_TRANSFER' ? 'Book Trf' : m}
                </button>
              ))}
            </div>
          </div>

          {/* UTR Custom input */}
          <div>
            <label className="block font-semibold text-slate-700 mb-0.5">
              Custom UTR / Bank Reference (Optional)
            </label>
            <input
              type="text"
              placeholder="Leave blank to auto-generate standard core banking UTR"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          {/* Failure Simulation Toggle (Development & Compliance Testing) */}
          <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={simulateFailure}
                onChange={(e) => setSimulateFailure(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="font-semibold text-amber-900">
                Simulate Payment Gateway Failure (Test Failure Handling)
              </span>
            </label>

            {simulateFailure && (
              <div>
                <input
                  type="text"
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  placeholder="Reason for payment failure..."
                  className="w-full p-1.5 text-xs bg-white border border-amber-300 rounded-md text-amber-900"
                />
                <span className="text-[10px] text-amber-700 mt-1 block">
                  The system will record the failed transaction in audit history and keep the remaining balance intact.
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={handleExecute}
            className={`px-4 py-1.5 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 ${
              simulateFailure ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            {simulateFailure ? 'Simulate Transaction Failure' : 'Confirm & Release Funds'}
          </button>
        </div>
      </div>
    </div>
  );
};
