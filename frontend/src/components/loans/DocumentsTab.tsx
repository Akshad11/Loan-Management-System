import React from 'react';
import {
  FileText,
  Download,
  Eye,
  CheckCircle2,
  FileCheck2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { LoanAccountRecord } from '../../types/loanAccountTypes';
import { formatDate } from '../../utils/formatters';

interface DocumentsTabProps {
  loan: LoanAccountRecord;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ loan }) => {
  const documents = [
    {
      id: 'doc_loan_agr',
      title: 'Executed Loan Facility Agreement',
      type: 'LEGAL_AGREEMENT',
      format: 'PDF',
      size: '2.4 MB',
      date: loan.disbursementDate,
      verified: true,
    },
    {
      id: 'doc_sanc_ltr',
      title: `Sanction Letter (${loan.sanctionNumber || 'SN-2026'})`,
      type: 'SANCTION_LETTER',
      format: 'PDF',
      size: '840 KB',
      date: loan.disbursementDate,
      verified: true,
    },
    {
      id: 'doc_mandate_form',
      title: 'eMandate / NACH Registration Mandate',
      type: 'BANKING_MANDATE',
      format: 'PDF',
      size: '620 KB',
      date: loan.disbursementDate,
      verified: true,
    },
    {
      id: 'doc_kyc_proof',
      title: 'Borrower KYC & PAN Verification Certificate',
      type: 'KYC_PROOF',
      format: 'PDF',
      size: '1.1 MB',
      date: loan.disbursementDate,
      verified: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Loan Servicing & Origination Documents
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Legal contracts, sanction agreements, and banking mandate proofs attached to this facility.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-start justify-between gap-3 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-900">{doc.title}</h5>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                  <span>{doc.format}</span>
                  <span>•</span>
                  <span>{doc.size}</span>
                  <span>•</span>
                  <span>{formatDate(doc.date)}</span>
                </div>
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    VERIFIED / SIGNED
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => alert(`Downloading ${doc.title}...`)}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Download Document"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
