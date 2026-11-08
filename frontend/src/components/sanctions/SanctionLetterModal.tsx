import React, { useState } from 'react';
import { SanctionRecord } from '../../types/sanctionTypes';
import { LetterStatusBadge } from './SanctionStatusBadge';
import {
  FileCheck,
  X,
  Printer,
  FileText,
  Settings,
  History,
  CheckCircle2,
  Building,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface SanctionLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  sanction: SanctionRecord;
  onGenerateLetter: (options: { templateId?: string; customNotes?: string; reasonForRegeneration?: string }) => void;
}

export const SanctionLetterModal: React.FC<SanctionLetterModalProps> = ({
  isOpen,
  onClose,
  sanction,
  onGenerateLetter,
}) => {
  const [activeModalTab, setActiveModalTab] = useState<'PREVIEW' | 'SETTINGS'>('PREVIEW');
  const [templateId, setTemplateId] = useState('STANDARD_RETAIL_v2');
  const [customNotes, setCustomNotes] = useState('');
  const [reasonForRegeneration, setReasonForRegeneration] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const activeLetter = sanction.letters.find((l) => l.id === sanction.activeLetterId) || sanction.letters[0];
  const hasExistingLetter = sanction.letters.length > 0;

  const handleGenerate = () => {
    if (hasExistingLetter && (!reasonForRegeneration || reasonForRegeneration.trim().length < 5)) {
      setError('A mandatory reason for generating a new letter version (min 5 characters) is required for audit.');
      return;
    }

    onGenerateLetter({
      templateId,
      customNotes: customNotes.trim() || undefined,
      reasonForRegeneration: reasonForRegeneration.trim() || undefined,
    });

    setActiveModalTab('PREVIEW');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-300 shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Sanction Advice Letter — {sanction.sanctionNumber}
                </h2>
                {activeLetter && <LetterStatusBadge status={activeLetter.status} size="sm" />}
                {activeLetter && (
                  <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    v{activeLetter.version}.0
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Borrower: <strong className="text-slate-800">{sanction.customerName}</strong> ({sanction.customerNumber}) • Ref: {sanction.applicationNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeModalTab === 'PREVIEW' && (
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-md border border-slate-300 transition-colors inline-flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                Print / Save PDF
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Tab Switcher */}
        <div className="flex items-center gap-2 px-4 pt-2.5 pb-2 border-b border-slate-100 bg-slate-50">
          <button
            onClick={() => setActiveModalTab('PREVIEW')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md inline-flex items-center gap-1.5 transition-colors ${activeModalTab === 'PREVIEW'
                ? 'bg-white text-blue-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Official Letter Document Preview
          </button>
          <button
            onClick={() => setActiveModalTab('SETTINGS')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md inline-flex items-center gap-1.5 transition-colors ${activeModalTab === 'SETTINGS'
                ? 'bg-white text-blue-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
          >
            <Settings className="w-3.5 h-3.5" />
            {hasExistingLetter ? 'Regenerate / New Version Settings' : 'Generate Configuration'}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/60">
          {activeModalTab === 'PREVIEW' ? (
            <div className="bg-white border border-slate-300 rounded-lg shadow-md p-8 md:p-10 font-serif text-slate-900 max-w-3xl mx-auto leading-relaxed">
              {/* Letterhead */}
              <div className="border-b-2 border-slate-900 pb-4 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-base font-bold tracking-tight text-slate-900 font-sans uppercase">
                      Apex Bharat Financial Services Limited
                    </h2>
                    <p className="text-[11px] text-slate-600 font-sans">
                      (A Non-Banking Financial Company Registered with Reserve Bank of India)
                    </p>
                    <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                      CIN: U65923DL2018PLC339482 • RBI Reg No: B-05.02941
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-slate-600 font-sans">
                    <p className="font-semibold">Corporate Headquarters</p>
                    <p>Barakhamba Road, Connaught Place</p>
                    <p>New Delhi – 110001, India</p>
                    <p className="text-blue-600">www.apexfinance.in</p>
                  </div>
                </div>
              </div>

              {/* Letter Metadata */}
              <div className="flex justify-between items-start text-xs font-sans mb-6 pb-4 border-b border-slate-200">
                <div>
                  <p>
                    <strong>Ref. No:</strong> <span className="font-mono">{sanction.sanctionNumber}</span>
                  </p>
                  <p>
                    <strong>Letter Version:</strong> <span className="font-mono">v{activeLetter ? activeLetter.version : 1}.0</span>
                  </p>
                  <p>
                    <strong>Application Ref:</strong> <span className="font-mono">{sanction.applicationNumber}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p>
                    <strong>Date of Issuance:</strong> {activeLetter ? activeLetter.generatedAt : sanction.createdDate}
                  </p>
                  <p>
                    <strong>Facility Validity:</strong> 90 Days from Issuance
                  </p>
                  <p>
                    <strong>Sanction Branch:</strong> {sanction.branchName}
                  </p>
                </div>
              </div>

              {/* Recipient / Borrower Address */}
              <div className="text-xs font-sans mb-6">
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">To,</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{sanction.customerName}</p>
                <p className="text-slate-700">Customer Ref ID: <span className="font-mono">{sanction.customerNumber}</span></p>
                <p className="text-slate-700">{sanction.customerAddress || 'Address on record'}</p>
                <p className="text-slate-700">Mobile: {sanction.customerMobile || '+91 98765 43210'}</p>
              </div>

              {/* Subject */}
              <div className="mb-6 font-sans">
                <p className="text-xs font-bold text-slate-900 border-l-4 border-slate-900 pl-3 py-1 bg-slate-50">
                  Subject: In-Principle Sanction Advice for {sanction.productName} Facility of ₹{sanction.terms.amount.toLocaleString('en-IN')}
                </p>
              </div>

              {/* Salutation & Body */}
              <div className="text-xs space-y-4 text-slate-800">
                <p>Dear {sanction.customerName},</p>
                <p>
                  We thank you for choosing Apex Bharat Financial Services Limited. With reference to your loan application Ref No. <strong>{sanction.applicationNumber}</strong>, we are pleased to convey our in-principle sanction of the credit facility, subject to the terms and conditions outlined hereunder:
                </p>

                {/* Annexure I: Schedule of Commercial Terms */}
                <div className="my-5 font-sans">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-2">
                    Annexure I: Commercial Facility Terms
                  </h4>
                  <table className="w-full border-collapse border border-slate-300 text-xs">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="p-2 bg-slate-50 font-semibold w-1/3 border-r border-slate-200">Sanctioned Limit</td>
                        <td className="p-2 font-mono font-bold text-slate-900">₹{sanction.terms.amount.toLocaleString('en-IN')}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-2 bg-slate-50 font-semibold border-r border-slate-200">Facility Type</td>
                        <td className="p-2">{sanction.productName} ({sanction.productCode})</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-2 bg-slate-50 font-semibold border-r border-slate-200">Rate of Interest</td>
                        <td className="p-2 font-mono font-bold text-slate-900">{sanction.terms.interestRate}% p.a. ({sanction.terms.interestMethodology})</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-2 bg-slate-50 font-semibold border-r border-slate-200">Tenure & Frequency</td>
                        <td className="p-2 font-mono">{sanction.terms.tenureMonths} Months • {sanction.terms.repaymentFrequency}</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-2 bg-slate-50 font-semibold border-r border-slate-200">Monthly Installment (EMI)</td>
                        <td className="p-2 font-mono font-bold text-emerald-800">₹{sanction.terms.approxMonthlyEmi.toLocaleString('en-IN')} / month</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-2 bg-slate-50 font-semibold border-r border-slate-200">Upfront Processing Fee</td>
                        <td className="p-2 font-mono">₹{sanction.terms.processingFee.toLocaleString('en-IN')} (+ GST ₹{sanction.terms.processingFeeGst.toLocaleString('en-IN')})</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="p-2 bg-slate-50 font-semibold border-r border-slate-200">Net Estimated Payout</td>
                        <td className="p-2 font-mono font-bold text-blue-900">₹{sanction.terms.netDisbursementAmount.toLocaleString('en-IN')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Annexure II: Key Covenants */}
                {sanction.conditions.length > 0 && (
                  <div className="my-5 font-sans">
                    <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider mb-2">
                      Annexure II: Conditions Precedent to Disbursement
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                      {sanction.conditions.map((c, i) => (
                        <li key={i}>
                          <span className="font-semibold text-slate-900">[{c.category}]</span> {c.description}
                          {(c.status === 'COMPLETED' || (c.status as string) === 'RESOLVED') && <span className="ml-1 text-emerald-700 font-bold">(Fulfilled)</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Closing & Signatures */}
                <div className="pt-8 border-t border-slate-200 font-sans grid grid-cols-2 gap-8 text-xs">
                  <div>
                    <p className="font-bold text-slate-900">For Apex Bharat Financial Services Ltd.</p>
                    <div className="h-12 border-b border-dashed border-slate-300 flex items-end pb-1 text-blue-800 font-serif italic text-sm">
                      {sanction.finalApproverName}
                    </div>
                    <p className="font-semibold text-slate-800 mt-1">{sanction.finalApproverName}</p>
                    <p className="text-[11px] text-slate-500">{sanction.finalApproverRole} & Authorized Signatory</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Borrower Acknowledgment & Acceptance</p>
                    <div className="h-12 border-b border-dashed border-slate-300 flex items-end pb-1 text-slate-400 text-xs">
                      (Signature of Applicant)
                    </div>
                    <p className="font-semibold text-slate-800 mt-1">{sanction.customerName}</p>
                    <p className="text-[11px] text-slate-500">Date: ____ / ____ / 2026</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-300 shadow-sm p-6 max-w-xl mx-auto space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700">
                <div className="flex justify-between">
                  <span>Facility Amount:</span>
                  <strong className="font-mono text-slate-900">₹{sanction.terms.amount.toLocaleString('en-IN')}</strong>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Rate & Tenure:</span>
                  <strong className="font-mono text-slate-900">{sanction.terms.interestRate}% • {sanction.terms.tenureMonths} Months</strong>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Net Disbursement:</span>
                  <strong className="font-mono text-emerald-800">₹{sanction.terms.netDisbursementAmount.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sanction Letter Template*</label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                >
                  <option value="STANDARD_RETAIL_v2">Standard Retail Facility Schedule (RBI Master Directions Compliant)</option>
                  <option value="MSME_BUSINESS_v1">MSME & Secured Business Loan Sanction Format</option>
                  <option value="PRIORITY_SECTOR_v1">Priority Sector Lending (PSL) Format</option>
                </select>
              </div>

              {hasExistingLetter && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reason for Re-generation / New Version*
                  </label>
                  <input
                    type="text"
                    value={reasonForRegeneration}
                    onChange={(e) => {
                      setReasonForRegeneration(e.target.value);
                      setError('');
                    }}
                    placeholder="e.g. Terms modified per customer request, revised processing fee schedule..."
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Special Branch Stipulations / Custom Notes</label>
                <textarea
                  rows={3}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="Any additional branch covenants or borrower instructions to append to Annexure II..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>

              {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  onClick={() => setActiveModalTab('PREVIEW')}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md border border-slate-300"
                >
                  Back to Preview
                </button>
                <button
                  onClick={handleGenerate}
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-md shadow-xs"
                >
                  {hasExistingLetter ? 'Generate Version v' + (sanction.letters.length + 1) : 'Generate Sanction Letter'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Apex Bharat Lending Engine • Sanction Advisory System</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-md shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
