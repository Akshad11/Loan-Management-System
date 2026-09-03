import React, { useState } from 'react';
import { SanctionRecord, SanctionLetterVersion } from '../../types/sanctionTypes';
import { LetterStatusBadge } from './SanctionStatusBadge';
import {
  FileCheck,
  Printer,
  Download,
  Send,
  History,
  AlertCircle,
  CheckCircle2,
  Building,
  Calendar,
  IndianRupee,
  ShieldCheck,
} from 'lucide-react';

interface SanctionLetterTabProps {
  sanction: SanctionRecord;
  onOpenGenerateModal: () => void;
  onIssueLetter: (letterId: string) => void;
  canGenerateLetter: boolean;
  canIssueLetter: boolean;
}

export const SanctionLetterTab: React.FC<SanctionLetterTabProps> = ({
  sanction,
  onOpenGenerateModal,
  onIssueLetter,
  canGenerateLetter,
  canIssueLetter,
}) => {
  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    sanction.activeLetterId || (sanction.letters[0]?.id ?? '')
  );

  const activeLetter = sanction.letters.find((l) => l.id === selectedVersionId) || sanction.letters[0];

  const handlePrint = () => {
    window.print();
  };

  if (!activeLetter && sanction.letters.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
          <FileCheck className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No Sanction Letter Generated</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
          Generate an official, legally binding sanction advice letter with standardized regulatory clauses and facility schedules.
        </p>
        {canGenerateLetter && (
          <button
            onClick={onOpenGenerateModal}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors inline-flex items-center"
          >
            <FileCheck className="w-4 h-4 mr-2" />
            Generate Sanction Letter v1
          </button>
        )}
      </div>
    );
  }

  const isIssued = activeLetter?.status === 'ISSUED';
  const isSuperseded = activeLetter?.status === 'SUPERSEDED';

  return (
    <div className="space-y-6">
      {/* Top Bar: Letter Version Switcher & Operations */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Version Switcher */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-600">Letter Version:</span>
          <select
            value={selectedVersionId}
            onChange={(e) => setSelectedVersionId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-md text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
          >
            {sanction.letters.map((l) => (
              <option key={l.id} value={l.id}>
                v{l.version} ({l.status}) - {l.generatedAt}
              </option>
            ))}
          </select>
          {activeLetter && <LetterStatusBadge status={activeLetter.status} />}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {canGenerateLetter && sanction.status !== 'CANCELLED' && (
            <button
              onClick={onOpenGenerateModal}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-md border border-slate-300 transition-colors inline-flex items-center"
            >
              <History className="w-3.5 h-3.5 mr-1.5" />
              Re-generate (New Version)
            </button>
          )}

          {canIssueLetter && !isIssued && !isSuperseded && activeLetter && (
            <button
              onClick={() => onIssueLetter(activeLetter.id)}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-md shadow-xs transition-colors inline-flex items-center"
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              Issue to Borrower
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-md border border-slate-300 transition-colors inline-flex items-center"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Official Formatted Sanction Letter View */}
      <div className="bg-white border border-slate-300 rounded-lg shadow-md p-8 md:p-12 font-serif text-slate-900 max-w-4xl mx-auto leading-relaxed">
        {/* Letterhead */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 font-sans uppercase">
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
              <p>www.apexfinance.in</p>
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
              <strong>Letter Version:</strong> <span className="font-mono">v{activeLetter.version}.0</span>
            </p>
            <p>
              <strong>Application Ref:</strong> <span className="font-mono">{sanction.applicationNumber}</span>
            </p>
          </div>
          <div className="text-right">
            <p>
              <strong>Date of Issuance:</strong> {activeLetter.generatedAt}
            </p>
            <p>
              <strong>Validity / Expiry:</strong> {sanction.expiryDate} (90 Days)
            </p>
            <p>
              <strong>Sanction Authority:</strong> {sanction.branchName}
            </p>
          </div>
        </div>

        {/* Recipient / Borrower Address */}
        <div className="text-xs font-sans mb-6">
          <p className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">To,</p>
          <p className="text-sm font-bold text-slate-900 mt-1">{sanction.customerName}</p>
          <p className="text-slate-700">Customer Ref ID: <span className="font-mono">{sanction.customerNumber}</span></p>
          <p className="text-slate-700">Resident / Operational Address on Record, {sanction.branchName}</p>
        </div>

        {/* Subject */}
        <div className="mb-6 font-sans">
          <p className="text-xs font-bold text-slate-900 border-l-4 border-slate-900 pl-3 py-1 bg-slate-50">
            Subject: In-Principle Sanction Advice for {sanction.productName} Facility of ₹{sanction.terms.amount.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Salutation & Body Text */}
        <div className="text-xs space-y-4 text-slate-800">
          <p>Dear {sanction.customerName},</p>
          <p>
            We thank you for choosing Apex Bharat Financial Services Limited. With reference to your loan application Ref No. <strong>{sanction.applicationNumber}</strong>, we are pleased to convey our in-principle sanction of the credit facility, subject to the terms and conditions outlined hereunder:
          </p>

          {/* Schedule of Terms */}
          <div className="my-6">
            <h4 className="font-sans font-bold text-xs text-slate-900 uppercase tracking-wider mb-2">
              Annexure I: Commercial Facility Terms
            </h4>
            <table className="w-full border-collapse border border-slate-300 font-sans text-xs">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="p-2 bg-slate-50 font-semibold w-1/3 border-r border-slate-200">Sanctioned Limit</td>
                  <td className="p-2 font-mono font-bold text-slate-900">₹{sanction.terms.amount.toLocaleString('en-IN')} (Rupees {sanction.customerName ? 'approved limit' : ''})</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2 bg-slate-50 font-semibold border-r border-slate-200">Facility Type</td>
                  <td className="p-2">{sanction.productName} ({sanction.productCode})</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2 bg-slate-50 font-semibold border-r border-slate-200">Rate of Interest</td>
                  <td className="p-2 font-mono font-bold text-slate-900">{sanction.terms.interestRate}% per annum ({sanction.terms.interestMethodology})</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2 bg-slate-50 font-semibold border-r border-slate-200">Tenure & Frequency</td>
                  <td className="p-2 font-mono">{sanction.terms.tenureMonths} Months • {sanction.terms.repaymentFrequency} installments</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2 bg-slate-50 font-semibold border-r border-slate-200">Approx. Monthly Installment (EMI)</td>
                  <td className="p-2 font-mono font-bold text-emerald-800">₹{sanction.terms.approxMonthlyEmi.toLocaleString('en-IN')} / month</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2 bg-slate-50 font-semibold border-r border-slate-200">Processing Fees & GST (18%)</td>
                  <td className="p-2 font-mono">₹{(sanction.terms.processingFee + sanction.terms.processingFeeGst).toLocaleString('en-IN')} (Deducted upfront)</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-2 bg-slate-50 font-semibold border-r border-slate-200">Other Deductions (Legal/Insurance)</td>
                  <td className="p-2 font-mono">₹{(sanction.terms.documentationCharge + sanction.terms.insuranceCharge + sanction.terms.otherCharges).toLocaleString('en-IN')}</td>
                </tr>
                <tr className="border-b border-slate-200 bg-emerald-50/50">
                  <td className="p-2 font-bold text-emerald-900 border-r border-slate-200">Net Estimated Payout</td>
                  <td className="p-2 font-mono font-bold text-emerald-900 text-sm">₹{sanction.terms.netDisbursementAmount.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="p-2 bg-slate-50 font-semibold border-r border-slate-200">Repayment Collection Mode</td>
                  <td className="p-2">{sanction.terms.paymentMethod} (Mandate to be registered on borrower primary bank account)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Annexure II: Pre-Disbursement Conditions */}
          <div className="my-6">
            <h4 className="font-sans font-bold text-xs text-slate-900 uppercase tracking-wider mb-2">
              Annexure II: Key Covenants & Pre-Disbursement Requirements
            </h4>
            <div className="space-y-2 font-sans">
              {sanction.conditions.map((cond, idx) => (
                <div key={cond.id} className="flex items-start gap-2 text-xs">
                  <span className="font-bold text-slate-500 font-mono">{idx + 1}.</span>
                  <span className="text-slate-800">
                    <strong>[{cond.category} / Pre-{cond.requiredBefore}]:</strong> {cond.description}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Notes if any */}
          {activeLetter.customNotes && (
            <div className="my-4 p-3 bg-slate-50 border border-slate-200 rounded font-sans text-xs">
              <span className="font-bold text-slate-700 block mb-1">Special Branch Stipulations:</span>
              <p className="text-slate-700 italic">{activeLetter.customNotes}</p>
            </div>
          )}

          {/* Acceptance paragraph */}
          <p className="font-sans text-xs text-slate-700 mt-6">
            This sanction advice is valid for 90 days from the date of issue. Kindly confirm your unconditional acceptance of the terms and conditions by countersigning the duplicate copy of this letter.
          </p>

          {/* Signatures Block */}
          <div className="mt-12 pt-6 border-t border-slate-300 font-sans grid grid-cols-2 gap-8 text-xs">
            <div>
              <p className="text-slate-500 mb-10">For Apex Bharat Financial Services Ltd.</p>
              <div className="border-t border-slate-400 pt-1">
                <p className="font-bold text-slate-900">{activeLetter.generatedBy || sanction.confirmedBy || 'Authorized Officer'}</p>
                <p className="text-slate-500 text-[11px]">Authorized Signatory • {sanction.branchName}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-slate-500 mb-10">Acknowledged & Accepted by Borrower</p>
              <div className="border-t border-slate-400 pt-1">
                <p className="font-bold text-slate-900">{sanction.customerName}</p>
                <p className="text-slate-500 text-[11px]">Signature / Digital E-Sign</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
