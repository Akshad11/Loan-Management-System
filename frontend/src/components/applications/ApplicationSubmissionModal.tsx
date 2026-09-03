import React, { useState, useMemo } from 'react';
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { Modal } from '../shared/Modal';
import {
  LoanApplicationRecord,
  ApplicationValidationResult,
  SubmissionDeclarationState,
} from '../../types/applicationTypes';
import { formatCurrencyINR } from '../../utils/formatters';

interface ApplicationSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: LoanApplicationRecord;
  validationResult: ApplicationValidationResult;
  onSubmit: (declarations: SubmissionDeclarationState) => void;
}

export const ApplicationSubmissionModal: React.FC<ApplicationSubmissionModalProps> = ({
  isOpen,
  onClose,
  application,
  validationResult,
  onSubmit,
}) => {
  const [accurateInfoConfirmed, setAccurateInfoConfirmed] = useState(false);
  const [supportingDocsConfirmed, setSupportingDocsConfirmed] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);

  const canSubmit =
    validationResult.isValid &&
    accurateInfoConfirmed &&
    supportingDocsConfirmed &&
    termsAgreed;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    onSubmit({
      accurateInfoConfirmed,
      supportingDocsConfirmed,
      termsAgreed,
      declaredBy: 'Anita Deshmukh',
      declaredAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Final Submission Gate — ${application.applicationNumber}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Header Summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">Applicant & Product</div>
            <div className="font-bold text-slate-900 text-sm">
              {application.customerName} — {application.productName}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Requested Terms</div>
            <div className="font-bold font-mono text-slate-900 text-sm">
              {formatCurrencyINR(application.requestedAmount)} / {application.requestedTenureMonths}m
            </div>
          </div>
        </div>

        {/* VALIDATION GATE RESULTS */}
        <div>
          <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
            System Pre-Submission Audit
          </label>

          {/* Blockers */}
          {validationResult.blockers.length > 0 && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-1.5 mb-3">
              <div className="font-bold text-rose-900 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600" />
                Submission Blockers ({validationResult.blockers.length}) — Must be resolved before submitting:
              </div>
              <ul className="list-disc pl-5 text-rose-800 space-y-1">
                {validationResult.blockers.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {validationResult.warnings.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1 mb-3">
              <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Underwriting Notices ({validationResult.warnings.length}):
              </div>
              <ul className="list-disc pl-5 text-amber-800 space-y-0.5">
                {validationResult.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Passed Checks */}
          {validationResult.passedChecks.length > 0 && (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs space-y-1">
              <div className="font-semibold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Passed Verification Gates ({validationResult.passedChecks.length}):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pl-2 text-emerald-800 text-[11px]">
                {validationResult.passedChecks.map((p, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="text-emerald-500">✓</span> {p}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* REGULATORY DECLARATIONS */}
        {validationResult.isValid ? (
          <div className="bg-slate-900 text-white rounded-lg p-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Officer Declarations & Sign-Off
            </div>

            <label className="flex items-start gap-2.5 text-xs text-slate-200 cursor-pointer">
              <input
                id="decl-info-checkbox"
                type="checkbox"
                checked={accurateInfoConfirmed}
                onChange={(e) => setAccurateInfoConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-0"
              />
              <span>
                I confirm that all borrower identity, employment, and income data provided has been validated against official banking records.
              </span>
            </label>

            <label className="flex items-start gap-2.5 text-xs text-slate-200 cursor-pointer">
              <input
                id="decl-docs-checkbox"
                type="checkbox"
                checked={supportingDocsConfirmed}
                onChange={(e) => setSupportingDocsConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-0"
              />
              <span>
                All mandatory supporting documents and KYC records have been reviewed, verified, and safely archived in the document repository.
              </span>
            </label>

            <label className="flex items-start gap-2.5 text-xs text-slate-200 cursor-pointer">
              <input
                id="decl-terms-checkbox"
                type="checkbox"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-0"
              />
              <span>
                The borrower has formally consented to bureau credit scoring checks and regulatory RBI underwriting disclosures.
              </span>
            </label>
          </div>
        ) : (
          <div className="p-3 bg-slate-100 rounded text-xs text-slate-600 text-center">
            Fix all blocking items above before officer declarations can be signed.
          </div>
        )}

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md border border-slate-300"
          >
            Back to Application
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-md flex items-center gap-1.5 shadow-sm"
          >
            <Send className="w-4 h-4" />
            Submit for Credit Review
          </button>
        </div>
      </form>
    </Modal>
  );
};
