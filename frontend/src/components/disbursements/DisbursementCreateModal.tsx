import React, { useState } from 'react';
import { SanctionRecord } from '../../types/sanctionTypes';
import { PaymentMethod } from '../../types/disbursementTypes';
import { Plus, X, Landmark, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface DisbursementCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  sanctions: SanctionRecord[];
  disbursements: any[];
  onCreateRequest: (data: {
    sanctionId: string;
    requestedAmount: number;
    disbursementType: 'FULL' | 'PARTIAL';
    beneficiaryId?: string;
    newBeneficiary?: {
      beneficiaryType: 'PRIMARY_BORROWER' | 'CO_APPLICANT' | 'SELLER_BUILDER' | 'VENDOR' | 'INSTITUTION';
      beneficiaryName: string;
      bankName: string;
      accountNumber: string;
      ifscCode: string;
      accountType: 'SAVINGS' | 'CURRENT';
    };
    paymentMethod: PaymentMethod;
    purpose?: string;
    notes?: string;
  }) => void;
}

export const DisbursementCreateModal: React.FC<DisbursementCreateModalProps> = ({
  isOpen,
  onClose,
  sanctions,
  disbursements,
  onCreateRequest,
}) => {
  // Only confirmed sanctions can be disbursed
  const eligibleSanctions = sanctions.filter((s) => s.status === 'SANCTIONED');

  const [selectedSanctionId, setSelectedSanctionId] = useState<string>(eligibleSanctions[0]?.id || '');
  const [disbursementType, setDisbursementType] = useState<'FULL' | 'PARTIAL'>('FULL');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('NEFT');
  const [purpose, setPurpose] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [useCustomBeneficiary, setUseCustomBeneficiary] = useState<boolean>(false);
  const [beneficiaryName, setBeneficiaryName] = useState<string>('');
  const [beneficiaryType, setBeneficiaryType] = useState<'PRIMARY_BORROWER' | 'SELLER_BUILDER' | 'VENDOR' | 'CO_APPLICANT'>('PRIMARY_BORROWER');
  const [bankName, setBankName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [ifscCode, setIfscCode] = useState<string>('');
  const [accountType, setAccountType] = useState<'SAVINGS' | 'CURRENT'>('SAVINGS');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const selectedSanction = eligibleSanctions.find((s) => s.id === selectedSanctionId);
  const existingDsb = disbursements.find((d) => d.sanctionId === selectedSanctionId);

  const sanctionAmount = selectedSanction ? selectedSanction.approvedAmount : 0;
  const alreadyDisbursed = existingDsb ? existingDsb.totalDisbursedAmount : 0;
  const availableRemaining = Math.max(0, sanctionAmount - alreadyDisbursed);

  const requestedAmountNumber =
    disbursementType === 'FULL' ? availableRemaining : Number(customAmount) || 0;

  const remainingAfterPayout = Math.max(0, availableRemaining - requestedAmountNumber);

  const handleSubmit = () => {
    if (!selectedSanction) {
      setError('Please select an active, confirmed loan sanction.');
      return;
    }

    if (availableRemaining <= 0) {
      setError('This sanction has already been fully disbursed.');
      return;
    }

    if (requestedAmountNumber <= 0) {
      setError('Requested amount must be greater than zero.');
      return;
    }

    if (requestedAmountNumber > availableRemaining) {
      setError(
        `Requested amount (₹${requestedAmountNumber.toLocaleString('en-IN')}) cannot exceed remaining available sanction (₹${availableRemaining.toLocaleString('en-IN')}).`
      );
      return;
    }

    if (useCustomBeneficiary) {
      if (!beneficiaryName.trim() || !bankName.trim() || !accountNumber.trim() || !ifscCode.trim()) {
        setError('Please fill in all beneficiary bank account details.');
        return;
      }
    }

    onCreateRequest({
      sanctionId: selectedSanction.id,
      requestedAmount: requestedAmountNumber,
      disbursementType,
      paymentMethod,
      purpose: purpose.trim() || undefined,
      notes: notes.trim() || undefined,
      newBeneficiary: useCustomBeneficiary
        ? {
            beneficiaryType,
            beneficiaryName: beneficiaryName.trim(),
            bankName: bankName.trim(),
            accountNumber: accountNumber.trim(),
            ifscCode: ifscCode.trim().toUpperCase(),
            accountType,
          }
        : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-300 shadow-2xl max-w-xl w-full p-6 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">Create Disbursement Request</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {eligibleSanctions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No confirmed loan sanctions currently available for disbursement. Ensure sanction dossiers are confirmed and accepted first.
          </div>
        ) : (
          <div className="mt-4 space-y-4 text-xs">
            {/* Sanction Selection */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Select Confirmed Sanction*
              </label>
              <select
                value={selectedSanctionId}
                onChange={(e) => {
                  setSelectedSanctionId(e.target.value);
                  setError('');
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
              >
                {eligibleSanctions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.customerName} — {s.productName} (₹{s.approvedAmount.toLocaleString('en-IN')}) • {s.sanctionNumber}
                  </option>
                ))}
              </select>
            </div>

            {/* Financial Calculations Box */}
            {selectedSanction && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Sanction Amount</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{sanctionAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Already Disbursed</span>
                    <span className="font-mono font-bold text-emerald-700">
                      ₹{alreadyDisbursed.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-2 bg-indigo-50/60 rounded-lg border border-indigo-200">
                    <span className="text-[10px] text-indigo-600 block uppercase font-semibold">Current Request</span>
                    <span className="font-mono font-bold text-indigo-900">
                      ₹{requestedAmountNumber.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Remaining After</span>
                    <span className="font-mono font-bold text-blue-700">
                      ₹{remainingAfterPayout.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Disbursement Type */}
            <div className="grid grid-cols-2 gap-2">
              <label
                className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between ${
                  disbursementType === 'FULL'
                    ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900'
                    : 'border-slate-200 bg-slate-50/50 text-slate-700'
                }`}
              >
                <div>
                  <input
                    type="radio"
                    name="disbursementType"
                    checked={disbursementType === 'FULL'}
                    onChange={() => {
                      setDisbursementType('FULL');
                      setError('');
                    }}
                    className="sr-only"
                  />
                  <span className="font-bold block">Full Payout</span>
                  <span className="text-[11px] text-slate-500">Release remaining ₹{availableRemaining.toLocaleString('en-IN')}</span>
                </div>
                {disbursementType === 'FULL' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
              </label>

              <label
                className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between ${
                  disbursementType === 'PARTIAL'
                    ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900'
                    : 'border-slate-200 bg-slate-50/50 text-slate-700'
                }`}
              >
                <div>
                  <input
                    type="radio"
                    name="disbursementType"
                    checked={disbursementType === 'PARTIAL'}
                    onChange={() => {
                      setDisbursementType('PARTIAL');
                      setError('');
                    }}
                    className="sr-only"
                  />
                  <span className="font-bold block">Partial / Tranche</span>
                  <span className="text-[11px] text-slate-500">Specify tranche amount</span>
                </div>
                {disbursementType === 'PARTIAL' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
              </label>
            </div>

            {/* Custom Tranche Amount */}
            {disbursementType === 'PARTIAL' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tranche Payout Amount (₹)*
                </label>
                <input
                  type="number"
                  placeholder={`Max ₹${availableRemaining}`}
                  value={customAmount}
                  onChange={(e) => {
                    setCustomAmount(e.target.value);
                    setError('');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
            )}

            {/* Payment Method */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['NEFT', 'RTGS', 'IMPS', 'DIRECT_TRANSFER'] as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 px-2.5 rounded-lg border font-bold text-center text-xs transition-all ${
                    paymentMethod === method
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {method === 'DIRECT_TRANSFER' ? 'Direct Book' : method}
                </button>
              ))}
            </div>

            {/* Beneficiary Option */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-700">Beneficiary Bank Account</span>
                <button
                  type="button"
                  onClick={() => setUseCustomBeneficiary(!useCustomBeneficiary)}
                  className="text-[11px] text-indigo-600 font-bold hover:underline"
                >
                  {useCustomBeneficiary ? 'Use Primary Customer Bank' : '+ Add Vendor / Third-party Account'}
                </button>
              </div>

              {!useCustomBeneficiary ? (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <div className="font-bold text-slate-900">{selectedSanction?.customerName}</div>
                  <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                    HDFC Bank Ltd • •••• •••• •••• 0192 (HDFC0000120) — Verified via KYC
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                        Beneficiary Type
                      </label>
                      <select
                        value={beneficiaryType}
                        onChange={(e: any) => setBeneficiaryType(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md"
                      >
                        <option value="PRIMARY_BORROWER">Primary Borrower</option>
                        <option value="SELLER_BUILDER">Seller / Builder</option>
                        <option value="VENDOR">Equipment / Material Vendor</option>
                        <option value="CO_APPLICANT">Co-Applicant</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                        Beneficiary Name*
                      </label>
                      <input
                        type="text"
                        placeholder="Legal Entity / Name"
                        value={beneficiaryName}
                        onChange={(e) => setBeneficiaryName(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Bank Name*</label>
                      <input
                        type="text"
                        placeholder="e.g. ICICI Bank"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Account #*</label>
                      <input
                        type="text"
                        placeholder="Account Number"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">IFSC Code*</label>
                      <input
                        type="text"
                        placeholder="e.g. ICIC0000011"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md font-mono uppercase"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Purpose & Notes */}
            <div className="space-y-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-0.5">Disbursement Purpose / Milestone</label>
                <input
                  type="text"
                  placeholder="e.g. Milestone 1 - Foundation completion / Server deployment"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-0.5">Maker Remarks (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Any special remarks for the checking authority..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>

            {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300"
          >
            Cancel
          </button>
          {eligibleSanctions.length > 0 && (
            <button
              onClick={handleSubmit}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              Submit for Checker Review
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
