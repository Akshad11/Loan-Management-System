import React, { useState, useEffect } from 'react';
import { SanctionRecord, SanctionTerms } from '../../types/sanctionTypes';
import { IndianRupee, AlertTriangle, X, CheckCircle2 } from 'lucide-react';

interface SanctionTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sanction: SanctionRecord;
  onSaveTerms: (updatedTerms: Partial<SanctionTerms>, reason: string) => void;
}

export const SanctionTermsModal: React.FC<SanctionTermsModalProps> = ({
  isOpen,
  onClose,
  sanction,
  onSaveTerms,
}) => {
  const [amount, setAmount] = useState<number>(sanction.terms.amount);
  const [interestRate, setInterestRate] = useState<number>(sanction.terms.interestRate);
  const [tenureMonths, setTenureMonths] = useState<number>(sanction.terms.tenureMonths);
  const [processingFee, setProcessingFee] = useState<number>(sanction.terms.processingFee);
  const [documentationCharge, setDocumentationCharge] = useState<number>(sanction.terms.documentationCharge);
  const [insuranceCharge, setInsuranceCharge] = useState<number>(sanction.terms.insuranceCharge);
  const [otherCharges, setOtherCharges] = useState<number>(sanction.terms.otherCharges);
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setAmount(sanction.terms.amount);
      setInterestRate(sanction.terms.interestRate);
      setTenureMonths(sanction.terms.tenureMonths);
      setProcessingFee(sanction.terms.processingFee);
      setDocumentationCharge(sanction.terms.documentationCharge);
      setInsuranceCharge(sanction.terms.insuranceCharge);
      setOtherCharges(sanction.terms.otherCharges);
      setReason('');
      setError('');
    }
  }, [isOpen, sanction]);

  if (!isOpen) return null;

  // Auto-calculated fields
  const gst = Math.round(processingFee * 0.18);
  const totalDeductions = processingFee + gst + documentationCharge + insuranceCharge + otherCharges;
  const netDisbursement = Math.max(0, amount - totalDeductions);

  // EMI calculation (Reducing balance)
  const monthlyRate = interestRate / 12 / 100;
  const emi =
    monthlyRate === 0
      ? amount / tenureMonths
      : Math.round(
          (amount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
            (Math.pow(1 + monthlyRate, tenureMonths) - 1)
        );

  const isDeviatedFromApproval =
    amount !== sanction.approvedAmount ||
    interestRate !== sanction.approvedInterestRate ||
    tenureMonths !== sanction.approvedTenureMonths;

  const handleSave = () => {
    if (amount <= 0) {
      setError('Sanction amount must be greater than zero.');
      return;
    }
    if (interestRate <= 0 || interestRate > 48) {
      setError('Interest rate must be between 1% and 48% p.a.');
      return;
    }
    if (tenureMonths <= 0 || tenureMonths > 360) {
      setError('Tenure must be between 1 and 360 months.');
      return;
    }
    if (isDeviatedFromApproval && (!reason || reason.trim().length < 5)) {
      setError('Terms deviate from Credit Approval baseline. A mandatory audit justification reason (min 5 characters) is required.');
      return;
    }

    onSaveTerms(
      {
        amount,
        interestRate,
        tenureMonths,
        processingFee,
        processingFeeGst: gst,
        documentationCharge,
        insuranceCharge,
        otherCharges,
        approxMonthlyEmi: emi,
        netDisbursementAmount: netDisbursement,
      },
      reason || 'Terms adjusted in sanction drafting.'
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-300 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-base font-bold text-slate-900">Adjust Sanction Financial Terms & Fees</h2>
            <p className="text-xs text-slate-500 font-mono">Dossier: {sanction.sanctionNumber}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Deviation Warning */}
        {isDeviatedFromApproval && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-300 rounded-md text-xs text-amber-900 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Deviation Notice:</span> These terms differ from the approved baseline (Approved: ₹{sanction.approvedAmount.toLocaleString('en-IN')} @ {sanction.approvedInterestRate}% for {sanction.approvedTenureMonths}m). A mandatory justification is required.
            </div>
          </div>
        )}

        {/* Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Sanction Limit (₹)*</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Interest Rate (% p.a.)*</label>
            <input
              type="number"
              step="0.05"
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tenure (Months)*</label>
            <input
              type="number"
              value={tenureMonths}
              onChange={(e) => setTenureMonths(Number(e.target.value))}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
        </div>

        {/* Deductions & Charges */}
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mt-6 mb-3 pb-1 border-b border-slate-100">
          Deductions & Statutory Levies
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Processing Fee (₹)</label>
            <input
              type="number"
              value={processingFee}
              onChange={(e) => setProcessingFee(Number(e.target.value))}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-mono text-slate-900"
            />
            <span className="text-[10px] text-slate-400 font-mono">+ GST (18%): ₹{gst.toLocaleString('en-IN')}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Documentation (₹)</label>
            <input
              type="number"
              value={documentationCharge}
              onChange={(e) => setDocumentationCharge(Number(e.target.value))}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-mono text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Credit Insurance (₹)</label>
            <input
              type="number"
              value={insuranceCharge}
              onChange={(e) => setInsuranceCharge(Number(e.target.value))}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-mono text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Other Charges (₹)</label>
            <input
              type="number"
              value={otherCharges}
              onChange={(e) => setOtherCharges(Number(e.target.value))}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-mono text-slate-900"
            />
          </div>
        </div>

        {/* Live Calculation Preview Banner */}
        <div className="mt-5 p-3.5 bg-slate-100 rounded-md border border-slate-200 grid grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block">Monthly EMI (Approx)</span>
            <span className="font-mono font-bold text-slate-900 text-sm">₹{emi.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Total Deductions</span>
            <span className="font-mono font-bold text-rose-700 text-sm">₹{totalDeductions.toLocaleString('en-IN')}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Net Payout to Customer</span>
            <span className="font-mono font-bold text-emerald-800 text-sm">₹{netDisbursement.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Justification Textarea */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Modification Justification / Audit Reason {isDeviatedFromApproval && '*'}
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError('');
            }}
            placeholder="Document rationale for adjusting sanction terms or fee structure..."
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>

        {error && <p className="text-xs text-rose-600 font-semibold mt-2">{error}</p>}

        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md border border-slate-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-md shadow-xs transition-colors"
          >
            Save & Update Sanction Terms
          </button>
        </div>
      </div>
    </div>
  );
};
