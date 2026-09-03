import React, { useState, useEffect } from 'react';
import {
  X,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Calendar,
  DollarSign,
  ShieldCheck,
  FileText,
  Clock,
  Building,
  User,
} from 'lucide-react';
import {
  RestructuringType,
  RestructuringEligibilityResult,
  RestructuringSchedulePreviewResult,
  MoratoriumInterestTreatment,
  MoratoriumPrincipalTreatment,
  CreateRestructuringPayload,
} from '../../types/restructuringTypes';
import { LoanAccountRecord, LoanRepaymentFrequency } from '../../types/loanAccountTypes';
import { evaluateRestructuringEligibility, generateRestructuringSchedulePreview } from '../../services/restructuringEngine';
import { formatCurrencyINR, formatDate } from '../../utils/formatters';

interface CreateRestructuringModalProps {
  isOpen: boolean;
  onClose: () => void;
  loans: LoanAccountRecord[];
  initialSelectedLoanId?: string | null;
  currentUser: { id: string; name: string; roleName: string };
  onSubmit: (payload: CreateRestructuringPayload) => Promise<void>;
}

export const CreateRestructuringModal: React.FC<CreateRestructuringModalProps> = ({
  isOpen,
  onClose,
  loans,
  initialSelectedLoanId,
  currentUser,
  onSubmit,
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedLoanId, setSelectedLoanId] = useState<string>(initialSelectedLoanId || '');
  const [selectedLoan, setSelectedLoan] = useState<LoanAccountRecord | null>(null);
  const [eligibility, setEligibility] = useState<RestructuringEligibilityResult | null>(null);

  // Restructuring Form State
  const [requestType, setRequestType] = useState<RestructuringType>('TENURE_EXTENSION');
  const [reason, setReason] = useState<string>('');
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [proposedTenureMonths, setProposedTenureMonths] = useState<number>(36);
  const [proposedInterestRate, setProposedInterestRate] = useState<number>(14.0);
  const [proposedRepaymentFrequency, setProposedRepaymentFrequency] = useState<LoanRepaymentFrequency>('MONTHLY');
  const [proposedFirstDueDate, setProposedFirstDueDate] = useState<string>('');
  const [moratoriumMonths, setMoratoriumMonths] = useState<number>(0);
  const [moratoriumInterestTreatment, setMoratoriumInterestTreatment] = useState<MoratoriumInterestTreatment>('ACCRUE_AND_AMORTIZE');
  const [moratoriumPrincipalTreatment, setMoratoriumPrincipalTreatment] = useState<MoratoriumPrincipalTreatment>('DEFER');
  const [consentReceived, setConsentReceived] = useState<boolean>(true);
  const [consentMethod, setConsentMethod] = useState<'DIGITAL_OTP' | 'PHYSICAL_SIGNATURE' | 'E_SIGN' | 'IN_PERSON'>('DIGITAL_OTP');
  const [consentDocumentRef, setConsentDocumentRef] = useState<string>('DOC-CONSENT-2026-001');

  const [previewResult, setPreviewResult] = useState<RestructuringSchedulePreviewResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync initial loan if provided
  useEffect(() => {
    if (initialSelectedLoanId) {
      setSelectedLoanId(initialSelectedLoanId);
    }
  }, [initialSelectedLoanId]);

  // When loan changes, evaluate eligibility and set default proposed values
  useEffect(() => {
    if (!selectedLoanId) {
      setSelectedLoan(null);
      setEligibility(null);
      return;
    }

    const loan = loans.find((l) => l.id === selectedLoanId || l.accountNumber === selectedLoanId);
    if (loan) {
      setSelectedLoan(loan);
      const evalRes = evaluateRestructuringEligibility({ loan });
      setEligibility(evalRes);

      // Default proposed terms based on current loan
      const remTenure = Number(loan.remainingTenureMonths || loan.remainingInstalments || 24);
      setProposedTenureMonths(remTenure + 12);
      setProposedInterestRate(Number(loan.interestRate || 14.0));
      setProposedRepaymentFrequency((loan.repaymentFrequency as LoanRepaymentFrequency) || 'MONTHLY');

      const nextDue = loan.nextDueDate || new Date().toISOString().split('T')[0];
      setProposedFirstDueDate(nextDue);
    }
  }, [selectedLoanId, loans]);

  // Re-calculate live schedule preview whenever terms change
  useEffect(() => {
    if (!selectedLoan) return;

    try {
      const preview = generateRestructuringSchedulePreview({
        loan: selectedLoan,
        requestType,
        proposedTenureMonths: Number(proposedTenureMonths) || 1,
        proposedInterestRate: Number(proposedInterestRate) || 0,
        proposedRepaymentFrequency,
        proposedFirstDueDate: proposedFirstDueDate || effectiveDate,
        moratoriumMonths: requestType === 'MORATORIUM' ? Number(moratoriumMonths) : 0,
        moratoriumInterestTreatment,
        moratoriumPrincipalTreatment,
      });
      setPreviewResult(preview);
    } catch (e: any) {
      console.error('Preview generation error:', e);
    }
  }, [
    selectedLoan,
    requestType,
    proposedTenureMonths,
    proposedInterestRate,
    proposedRepaymentFrequency,
    proposedFirstDueDate,
    effectiveDate,
    moratoriumMonths,
    moratoriumInterestTreatment,
    moratoriumPrincipalTreatment,
  ]);

  if (!isOpen) return null;

  const handleNext = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (!selectedLoan) {
        setErrorMsg('Please select a valid loan account.');
        return;
      }
      if (eligibility && !eligibility.eligible) {
        setErrorMsg('Selected loan is not eligible for restructuring.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!reason.trim()) {
        setErrorMsg('Please provide a mandatory justification reason for restructuring.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleFinalSubmit = async () => {
    if (!selectedLoan) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload: CreateRestructuringPayload = {
        loanId: selectedLoan.id,
        requestType,
        reason,
        effectiveDate,
        proposedTenureMonths: Number(proposedTenureMonths),
        proposedInterestRate: Number(proposedInterestRate),
        proposedEmiAmount: previewResult?.emiAmount,
        proposedRepaymentFrequency,
        proposedFirstDueDate: proposedFirstDueDate || effectiveDate,
        moratoriumMonths: requestType === 'MORATORIUM' ? Number(moratoriumMonths) : 0,
        moratoriumInterestTreatment,
        moratoriumPrincipalTreatment,
        consentReceived,
        consentMethod,
        consentDocumentRef,
        requestedBy: currentUser.id,
        requestedByName: currentUser.name,
        requestedByRole: currentUser.roleName,
        status: 'SUBMITTED',
      };

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit restructuring request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">New Contractual Restructuring</h2>
              <p className="text-xs text-indigo-200">
                Reschedule loan terms, apply moratoriums, or adjust EMI parameters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Header */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold">
          {[
            { num: 1, label: 'Loan & Eligibility' },
            { num: 2, label: 'Restructuring Type' },
            { num: 3, label: 'Terms & Moratorium' },
            { num: 4, label: 'Preview & Submit' },
          ].map((s) => (
            <div
              key={s.num}
              className={`flex items-center space-x-2 ${
                step === s.num
                  ? 'text-indigo-600'
                  : step > s.num
                  ? 'text-emerald-600'
                  : 'text-slate-400'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s.num
                    ? 'bg-indigo-600 text-white'
                    : step > s.num
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Body Steps */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: Select Loan & Eligibility */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Loan Account to Restructure
                </label>
                <select
                  value={selectedLoanId}
                  onChange={(e) => setSelectedLoanId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="">-- Choose an Active or Overdue Loan Account --</option>
                  {loans.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.accountNumber} — {l.customerName} ({l.productName}) | Balance: ₹{Number(l.outstandingPrincipal).toLocaleString()} | DPD: {l.dpd}
                    </option>
                  ))}
                </select>
              </div>

              {selectedLoan && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block">Customer</span>
                    <span className="font-bold text-slate-900">{selectedLoan.customerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Outstanding Principal</span>
                    <span className="font-bold text-slate-900">{formatCurrencyINR(selectedLoan.outstandingPrincipal || 0)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Current Interest Rate</span>
                    <span className="font-bold text-slate-900">{selectedLoan.interestRate}% p.a.</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Current EMI / DPD</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrencyINR(selectedLoan.emiAmount || 0)} ({selectedLoan.dpd || 0} DPD)
                    </span>
                  </div>
                </div>
              )}

              {eligibility && (
                <div
                  className={`p-4 rounded-xl border ${
                    eligibility.eligible
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-rose-50 border-rose-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {eligibility.eligible ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                    )}
                    <span className="font-bold text-sm text-slate-900">
                      {eligibility.eligible ? 'Loan Eligible for Restructuring' : 'Restructuring Prohibited / Ineligible'}
                    </span>
                  </div>

                  {eligibility.reasons.length > 0 && (
                    <ul className="mt-2 text-xs text-emerald-800 list-disc list-inside space-y-1">
                      {eligibility.reasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}

                  {eligibility.blockers.length > 0 && (
                    <div className="mt-2 text-xs text-rose-800">
                      <span className="font-semibold block mb-1">Blocking reasons:</span>
                      <ul className="list-disc list-inside space-y-1">
                        {eligibility.blockers.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {eligibility.warnings.length > 0 && (
                    <div className="mt-2 text-xs text-amber-800">
                      <span className="font-semibold block mb-1">Policy Warnings:</span>
                      <ul className="list-disc list-inside space-y-1">
                        {eligibility.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Select Restructuring Type & Reason */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Restructuring Strategy
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      id: 'TENURE_EXTENSION',
                      title: 'Tenure Extension',
                      desc: 'Extend remaining loan tenure to lower monthly EMI burden.',
                    },
                    {
                      id: 'MORATORIUM',
                      title: 'Moratorium / Payment Holiday',
                      desc: 'Temporary repayment pause with interest capitalization or deferral.',
                    },
                    {
                      id: 'EMI_REDUCTION',
                      title: 'EMI Reduction',
                      desc: 'Contractually decrease periodic EMI and adjust amortization schedule.',
                    },
                    {
                      id: 'INTEREST_RATE_CHANGE',
                      title: 'Interest Rate Revision',
                      desc: 'Adjust contractual interest rate prospectively for customer relief/retention.',
                    },
                    {
                      id: 'REPAYMENT_FREQUENCY_CHANGE',
                      title: 'Frequency Change',
                      desc: 'Switch repayment frequency (Monthly to Bi-Weekly / Quarterly).',
                    },
                    {
                      id: 'FULL_RESCHEDULING',
                      title: 'Full Rescheduling',
                      desc: 'Complete restructuring combining tenure, rate, and due date changes.',
                    },
                  ].map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setRequestType(t.id as RestructuringType)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        requestType === t.id
                          ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-sm text-slate-900">{t.title}</div>
                      <div className="text-xs text-slate-500 mt-1">{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Justification & Hardship Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Detail the borrower hardship, cash flow stress, medical emergency, or business disruption..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Effective Date
                  </label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    First New Due Date
                  </label>
                  <input
                    type="date"
                    value={proposedFirstDueDate}
                    onChange={(e) => setProposedFirstDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Configure Terms & Moratorium details */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Proposed Tenure (Months)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={proposedTenureMonths}
                    onChange={(e) => setProposedTenureMonths(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Current remaining: {selectedLoan?.remainingTenureMonths || 24} mos
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Proposed Interest Rate (% p.a.)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={50}
                    value={proposedInterestRate}
                    onChange={(e) => setProposedInterestRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Current rate: {selectedLoan?.interestRate}% p.a.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Repayment Frequency
                  </label>
                  <select
                    value={proposedRepaymentFrequency}
                    onChange={(e) => setProposedRepaymentFrequency(e.target.value as LoanRepaymentFrequency)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="BI_WEEKLY">Bi-Weekly</option>
                    <option value="QUARTERLY">Quarterly</option>
                  </select>
                </div>
              </div>

              {requestType === 'MORATORIUM' && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
                  <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    <span>Moratorium Configuration</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-amber-900 mb-1">
                        Moratorium Period (Months)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={moratoriumMonths}
                        onChange={(e) => setMoratoriumMonths(parseInt(e.target.value, 10) || 1)}
                        className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-sm font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-amber-900 mb-1">
                        Interest Treatment
                      </label>
                      <select
                        value={moratoriumInterestTreatment}
                        onChange={(e) => setMoratoriumInterestTreatment(e.target.value as MoratoriumInterestTreatment)}
                        className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-medium"
                      >
                        <option value="ACCRUE_AND_AMORTIZE">Accrue & Amortize in Future</option>
                        <option value="CAPITALIZE">Capitalize into Principal</option>
                        <option value="PAY_INTEREST_ONLY">Pay Interest Only (Principal Moratorium)</option>
                        <option value="WAIVE">Waive Interest (Relief Program)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-amber-900 mb-1">
                        Principal Treatment
                      </label>
                      <select
                        value={moratoriumPrincipalTreatment}
                        onChange={(e) => setMoratoriumPrincipalTreatment(e.target.value as MoratoriumPrincipalTreatment)}
                        className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-medium"
                      >
                        <option value="DEFER">Defer Principal Payments</option>
                        <option value="REDUCE_AMORTIZATION">Reduce Amortization Rate</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Consent Tracker */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-xs text-slate-900 uppercase">Customer Consent Verification</span>
                  </div>
                  <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={consentReceived}
                      onChange={(e) => setConsentReceived(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>Consent Recorded</span>
                  </label>
                </div>

                {consentReceived && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Consent Method</label>
                      <select
                        value={consentMethod}
                        onChange={(e) => setConsentMethod(e.target.value as any)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      >
                        <option value="DIGITAL_OTP">Digital OTP Verification</option>
                        <option value="PHYSICAL_SIGNATURE">Physical Signed Addendum</option>
                        <option value="E_SIGN">Aadhaar / Digital E-Sign</option>
                        <option value="IN_PERSON">In-Person Branch Verification</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">Document Reference Number</label>
                      <input
                        type="text"
                        value={consentDocumentRef}
                        onChange={(e) => setConsentDocumentRef(e.target.value)}
                        placeholder="e.g. DOC-CONSENT-2026-091"
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Live Schedule Preview & Impact Comparison */}
          {step === 4 && previewResult && selectedLoan && (
            <div className="space-y-4">
              {/* Financial Impact Comparison Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-gradient-to-br from-indigo-50/70 to-slate-50 rounded-xl border border-indigo-100">
                <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Current EMI</span>
                  <span className="text-base font-bold text-slate-900">{formatCurrencyINR(selectedLoan.emiAmount)}</span>
                  <span className="text-[10px] text-slate-400 block">{selectedLoan.remainingTenureMonths} mos left</span>
                </div>

                <div className="p-3 bg-white rounded-lg shadow-sm border border-indigo-200">
                  <span className="text-[11px] text-indigo-600 font-semibold block">Proposed New EMI</span>
                  <span className="text-base font-bold text-indigo-700">{formatCurrencyINR(previewResult.emiAmount)}</span>
                  <span className="text-[10px] text-slate-500 block">{proposedTenureMonths} mos total</span>
                </div>

                <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Monthly EMI Impact</span>
                  <span
                    className={`text-base font-bold flex items-center space-x-1 ${
                      previewResult.financialImpact.emiDifference < 0
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {previewResult.financialImpact.emiDifference < 0 ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : (
                      <TrendingUp className="w-4 h-4" />
                    )}
                    <span>{formatCurrencyINR(Math.abs(previewResult.financialImpact.emiDifference))}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {previewResult.financialImpact.emiDifference < 0 ? 'Customer Savings / Mo' : 'Higher Amortization'}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-100">
                  <span className="text-[11px] text-slate-500 block">Total Scheduled Interest</span>
                  <span className="text-base font-bold text-slate-900">{formatCurrencyINR(previewResult.totalInterest)}</span>
                  <span className="text-[10px] text-slate-500 block">
                    Diff: {previewResult.financialImpact.interestDifference > 0 ? '+' : ''}
                    {formatCurrencyINR(previewResult.financialImpact.interestDifference)}
                  </span>
                </div>
              </div>

              {/* Schedule Preview Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Proposed Schedule Preview ({previewResult.schedules.length} Instalments)
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">
                    New Maturity Date: {formatDate(previewResult.maturityDate)}
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl custom-scrollbar text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                      <tr>
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Due Date</th>
                        <th className="py-2 px-3 text-right">Opening Bal</th>
                        <th className="py-2 px-3 text-right">Principal</th>
                        <th className="py-2 px-3 text-right">Interest</th>
                        <th className="py-2 px-3 text-right">Instalment</th>
                        <th className="py-2 px-3 text-right">Closing Bal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {previewResult.schedules.map((item) => (
                        <tr
                          key={item.instalmentNumber}
                          className={item.isMoratorium ? 'bg-amber-50/60 font-semibold' : 'hover:bg-slate-50'}
                        >
                          <td className="py-1.5 px-3">{item.instalmentNumber}</td>
                          <td className="py-1.5 px-3">{formatDate(item.dueDate)}</td>
                          <td className="py-1.5 px-3 text-right">{formatCurrencyINR(item.openingPrincipal)}</td>
                          <td className="py-1.5 px-3 text-right text-indigo-600">{formatCurrencyINR(item.principalDue)}</td>
                          <td className="py-1.5 px-3 text-right text-slate-600">{formatCurrencyINR(item.interestDue)}</td>
                          <td className="py-1.5 px-3 text-right font-bold text-slate-900">{formatCurrencyINR(item.instalmentAmount)}</td>
                          <td className="py-1.5 px-3 text-right">{formatCurrencyINR(item.closingPrincipal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              if (step === 1) onClose();
              else setStep(step - 1);
            }}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          <div className="flex items-center space-x-3">
            {step < 4 ? (
              <button
                onClick={handleNext}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center space-x-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'Submitting Request...' : 'Submit for Credit Committee Review'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
