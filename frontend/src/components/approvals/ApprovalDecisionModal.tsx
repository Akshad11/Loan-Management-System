import React, { useState } from 'react';
import { ApprovalRecord, ApprovalDecisionType } from '../../types/approvalTypes';
import { calculateEmi } from '../../utils/formatters';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Shield,
  X,
  AlertOctagon,
  CreditCard,
  Send,
} from 'lucide-react';

interface ApprovalDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  approval: ApprovalRecord;
  onSubmitDecision: (data: {
    decision: ApprovalDecisionType;
    approvedAmount?: number;
    approvedTenureMonths?: number;
    approvedInterestRate?: number;
    deviationReason?: string;
    decisionNotes: string;
    returnReason?: string;
    requiredAction?: string;
    dueDate?: string;
  }) => { success: boolean; message?: string };
  currentUserName?: string;
  currentUserRole?: string;
}

export const ApprovalDecisionModal: React.FC<ApprovalDecisionModalProps> = ({
  isOpen,
  onClose,
  approval,
  onSubmitDecision,
  currentUserName = 'Alex Morgan',
  currentUserRole = 'Branch Credit Manager',
}) => {
  if (!isOpen) return null;

  const currentLevelExecution = approval.levels[approval.currentLevelIndex];
  const authorityLimit = currentLevelExecution?.authorityLimit || 500000;

  // Segregation of Duties (SoD) Check
  const isSoDViolation =
    currentUserName &&
    approval.creditAssessorName &&
    currentUserName.toLowerCase().trim() === approval.creditAssessorName.toLowerCase().trim() &&
    !currentUserRole.toLowerCase().includes('admin');

  // Form State
  const [decision, setDecision] = useState<ApprovalDecisionType>('APPROVE');
  const [approvedAmount, setApprovedAmount] = useState<number>(approval.recommendedAmount);
  const [approvedTenureMonths, setApprovedTenureMonths] = useState<number>(approval.recommendedTenureMonths);
  const [approvedInterestRate, setApprovedInterestRate] = useState<number>(approval.recommendedInterestRate);
  const [deviationReason, setDeviationReason] = useState<string>('');
  const [decisionNotes, setDecisionNotes] = useState<string>('');

  // Return state
  const [returnReason, setReturnReason] = useState<string>('Discrepancy in Income Proof');
  const [requiredAction, setRequiredAction] = useState<string>('');
  const [returnDueDate, setReturnDueDate] = useState<string>(
    new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Rejection state
  const [rejectionCategory, setRejectionCategory] = useState<string>('INSUFFICIENT_DEBT_CAPACITY');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // EMI calculation
  const currentEmi = calculateEmi(approvedAmount, approvedInterestRate, approvedTenureMonths);

  const hasQuantumDeviation =
    approvedAmount !== approval.recommendedAmount ||
    approvedTenureMonths !== approval.recommendedTenureMonths ||
    approvedInterestRate !== approval.recommendedInterestRate;

  const isExceedingLimit =
    decision === 'APPROVE' &&
    approvedAmount > authorityLimit &&
    approval.currentLevelIndex === approval.totalLevels - 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isSoDViolation) {
      setErrorMessage(
        'SoD Violation: As the original credit assessor for this application, you cannot record an approval decision.'
      );
      return;
    }

    if (!decisionNotes.trim()) {
      setErrorMessage('Approver notes and justification rationale are mandatory.');
      return;
    }

    if (decision === 'APPROVE') {
      if (approvedAmount <= 0) {
        setErrorMessage('Approved quantum must be greater than zero.');
        return;
      }
      if (hasQuantumDeviation && !deviationReason.trim()) {
        setErrorMessage('A deviation justification is mandatory when changing recommended parameters.');
        return;
      }
      if (isExceedingLimit) {
        setErrorMessage(
          `Approved quantum ₹${approvedAmount.toLocaleString('en-IN')} exceeds your authority limit of ₹${authorityLimit.toLocaleString('en-IN')}. Please request an Exception or escalate to higher tier.`
        );
        return;
      }
    }

    if (decision === 'RETURN') {
      if (!requiredAction.trim()) {
        setErrorMessage('Specific action required from the credit officer must be specified.');
        return;
      }
    }

    const res = onSubmitDecision({
      decision,
      approvedAmount: decision === 'APPROVE' ? approvedAmount : undefined,
      approvedTenureMonths: decision === 'APPROVE' ? approvedTenureMonths : undefined,
      approvedInterestRate: decision === 'APPROVE' ? approvedInterestRate : undefined,
      deviationReason: hasQuantumDeviation ? deviationReason.trim() : undefined,
      decisionNotes: decisionNotes.trim(),
      returnReason: decision === 'RETURN' ? returnReason : undefined,
      requiredAction: decision === 'RETURN' ? requiredAction.trim() : undefined,
      dueDate: decision === 'RETURN' ? returnDueDate : undefined,
    });

    if (!res.success) {
      setErrorMessage(res.message || 'An error occurred while submitting decision.');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto backdrop-blur-xs">
      <div
        className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white shadow-xl overflow-hidden"
        id="approval-decision-modal"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-700" />
              Record Sanction / Approval Decision
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Case {approval.approvalNumber} • {approval.customerName} ({approval.productName})
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* SoD Error Banner */}
          {isSoDViolation && (
            <div className="rounded-md border border-rose-300 bg-rose-50 p-3 text-xs text-rose-950 flex items-start gap-2.5">
              <AlertOctagon className="h-4 w-4 text-rose-700 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Segregation of Duties (SoD) Restriction:</strong>
                <p className="mt-0.5 text-rose-800">
                  You prepared this credit assessment ({approval.creditAssessorName}). You are prohibited by credit policy and RBI governance from recording the sanction decision. Another designated approver must sign off.
                </p>
              </div>
            </div>
          )}

          {/* Error Message if any */}
          {errorMessage && (
            <div className="rounded-md border border-rose-300 bg-rose-50 p-3 text-xs text-rose-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Current Level & Delegation Info */}
          <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-3.5 text-xs text-indigo-950 flex items-center justify-between">
            <div>
              <span className="font-semibold text-indigo-900 block uppercase tracking-wider text-[11px]">
                Active Delegation Tier: Level {currentLevelExecution?.level} ({currentLevelExecution?.levelName})
              </span>
              <span className="text-indigo-800">
                Acting Role: <strong>{currentUserRole}</strong> • Authority Limit: <strong className="font-mono">₹{authorityLimit.toLocaleString('en-IN')}</strong>
              </span>
            </div>
          </div>

          {/* Decision Selector Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Formal Decision
            </label>
            <div className="grid grid-cols-3 gap-3">
              {/* Approve Card */}
              <button
                type="button"
                id="decision-opt-approve"
                onClick={() => setDecision('APPROVE')}
                className={`flex flex-col items-center justify-center rounded-lg border p-3 text-center transition-all ${
                  decision === 'APPROVE'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className={`h-5 w-5 ${decision === 'APPROVE' ? 'text-emerald-700' : 'text-slate-400'}`} />
                <span className="mt-1.5 text-xs font-bold">Approve (Sanction)</span>
                <span className="text-[11px] text-slate-500">Advance / Final Sanction</span>
              </button>

              {/* Return Card */}
              <button
                type="button"
                id="decision-opt-return"
                onClick={() => setDecision('RETURN')}
                className={`flex flex-col items-center justify-center rounded-lg border p-3 text-center transition-all ${
                  decision === 'RETURN'
                    ? 'border-purple-600 bg-purple-50 text-purple-950 ring-2 ring-purple-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <RotateCcw className={`h-5 w-5 ${decision === 'RETURN' ? 'text-purple-700' : 'text-slate-400'}`} />
                <span className="mt-1.5 text-xs font-bold">Return for Info</span>
                <span className="text-[11px] text-slate-500">Seek Underwriter Action</span>
              </button>

              {/* Reject Card */}
              <button
                type="button"
                id="decision-opt-reject"
                onClick={() => setDecision('REJECT')}
                className={`flex flex-col items-center justify-center rounded-lg border p-3 text-center transition-all ${
                  decision === 'REJECT'
                    ? 'border-rose-600 bg-rose-50 text-rose-950 ring-2 ring-rose-600'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <XCircle className={`h-5 w-5 ${decision === 'REJECT' ? 'text-rose-700' : 'text-slate-400'}`} />
                <span className="mt-1.5 text-xs font-bold">Reject (Decline)</span>
                <span className="text-[11px] text-slate-500">Formal Adverse Decision</span>
              </button>
            </div>
          </div>

          {/* Conditional Form Sections */}

          {/* A. APPROVE DETAILS */}
          {decision === 'APPROVE' && (
            <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-emerald-700" />
                Sanctioned Terms & Parameters
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Approved Quantum (₹)</label>
                  <input
                    id="input-approved-amount"
                    type="number"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(Number(e.target.value))}
                    className={`w-full rounded border bg-white py-1.5 px-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 ${
                      approvedAmount > authorityLimit ? 'border-amber-500 ring-1 ring-amber-500' : 'border-slate-300'
                    }`}
                  />
                  {approvedAmount > authorityLimit && (
                    <span className="text-[11px] font-semibold text-amber-700 block mt-0.5">
                      ⚠️ Exceeds Tier Limit (₹{authorityLimit.toLocaleString('en-IN')})
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Approved Tenure (Mos)</label>
                  <input
                    id="input-approved-tenure"
                    type="number"
                    value={approvedTenureMonths}
                    onChange={(e) => setApprovedTenureMonths(Number(e.target.value))}
                    className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Approved Rate (% p.a.)</label>
                  <input
                    id="input-approved-rate"
                    type="number"
                    step="0.05"
                    value={approvedInterestRate}
                    onChange={(e) => setApprovedInterestRate(Number(e.target.value))}
                    className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-800"
                  />
                </div>
              </div>

              {/* Calculated EMI Preview */}
              <div className="flex items-center justify-between rounded bg-white border border-slate-200 p-2.5 text-xs">
                <span className="text-slate-600 font-medium">Recomputed Monthly EMI:</span>
                <span className="font-mono font-bold text-emerald-900 text-sm">
                  ₹{currentEmi.toLocaleString('en-IN')} / month
                </span>
              </div>

              {/* Deviation justification if changed */}
              {hasQuantumDeviation && (
                <div>
                  <label className="block text-xs font-semibold text-amber-900 mb-1">
                    Deviation Rationale (Mandatory: terms differ from Assessor recommendation) *
                  </label>
                  <input
                    id="input-deviation-reason"
                    type="text"
                    placeholder="e.g. Scaled down loan quantum based on high banking swings..."
                    value={deviationReason}
                    onChange={(e) => setDeviationReason(e.target.value)}
                    className="w-full rounded border border-amber-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-800"
                  />
                </div>
              )}
            </div>
          )}

          {/* B. RETURN DETAILS */}
          {decision === 'RETURN' && (
            <div className="space-y-4 rounded-lg border border-purple-200 bg-purple-50/50 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                <RotateCcw className="h-4 w-4 text-purple-700" />
                Return for Clarification / Underwriter Action
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Reason for Return</label>
                  <select
                    id="select-return-reason"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-800"
                  >
                    <option value="Discrepancy in Income Proof">Discrepancy in Income Proof</option>
                    <option value="Unverified Live Obligation in Bureau">Unverified Live Obligation in Bureau</option>
                    <option value="Property Valuation Report Incomplete">Property Valuation Report Incomplete</option>
                    <option value="Co-applicant KYC Inconclusive">Co-applicant KYC Inconclusive</option>
                    <option value="Inadequate FOIR Headroom">Inadequate FOIR Headroom</option>
                    <option value="Other Documentation Clarification">Other Documentation Clarification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Resolution Due Date</label>
                  <input
                    id="input-return-due-date"
                    type="date"
                    value={returnDueDate}
                    onChange={(e) => setReturnDueDate(e.target.value)}
                    className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Specific Action Required from Underwriter / Sourcing *
                </label>
                <textarea
                  id="input-required-action"
                  rows={2}
                  placeholder="e.g. Please obtain recent 3-month salary credits verification or bank statement re-upload..."
                  value={requiredAction}
                  onChange={(e) => setRequiredAction(e.target.value)}
                  className="w-full rounded border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-800"
                />
              </div>
            </div>
          )}

          {/* C. REJECT DETAILS */}
          {decision === 'REJECT' && (
            <div className="space-y-4 rounded-lg border border-rose-200 bg-rose-50/50 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-950 flex items-center gap-1.5">
                <XCircle className="h-4 w-4 text-rose-700" />
                Adverse Sanction Decline Details
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rejection Category</label>
                <select
                  id="select-rejection-category"
                  value={rejectionCategory}
                  onChange={(e) => setRejectionCategory(e.target.value)}
                  className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-800"
                >
                  <option value="ADVERSE_CREDIT_BUREAU">Adverse Credit / CIBIL Delinquency</option>
                  <option value="INSUFFICIENT_DEBT_CAPACITY">Insufficient Debt Capacity / High FOIR</option>
                  <option value="POLICY_RULE_BREACH">Hard Policy Rule Breach</option>
                  <option value="FRAUD_SUSPECTED">KYC / Identity Inconsistency</option>
                  <option value="COLLATERAL_UNSUITABLE">Collateral Valuation or Legal Title Defect</option>
                  <option value="OTHER">Other Credit Risk Concerns</option>
                </select>
              </div>
            </div>
          )}

          {/* Mandatory Decision Notes for all decisions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Approver's Final Notes & Sanction Rationale *
            </label>
            <textarea
              id="input-decision-notes"
              rows={3}
              placeholder="Enter formal sanction justification, committee observation, and condition compliance remarks..."
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              className="w-full rounded border border-slate-300 bg-white p-2.5 text-xs text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-decision"
              disabled={Boolean(isSoDViolation)}
              className={`inline-flex items-center gap-1.5 rounded px-5 py-2 text-xs font-bold text-white shadow-sm focus:outline-none disabled:opacity-50 ${
                decision === 'APPROVE'
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : decision === 'RETURN'
                  ? 'bg-purple-700 hover:bg-purple-800'
                  : 'bg-rose-700 hover:bg-rose-800'
              }`}
            >
              <Send className="h-3.5 w-3.5" />
              <span>
                {decision === 'APPROVE'
                  ? 'Submit Sanction Approval'
                  : decision === 'RETURN'
                  ? 'Return Application'
                  : 'Confirm Rejection'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
