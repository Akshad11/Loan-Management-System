import React, { useState } from 'react';
import { X, Award, Printer, CheckCircle, Send, FileText, Download, Building, ShieldCheck } from 'lucide-react';
import { NocRecordType } from '../../types/closureTypes';
import { formatCurrencyINR } from '../../utils/formatters';

interface NocCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  noc: NocRecordType | null;
  currentUser: { id: string; name: string; roleName: string };
  onIssueNoc: (nocId: string, deliveryMethod: string) => Promise<void>;
}

export const NocCertificateModal: React.FC<NocCertificateModalProps> = ({
  isOpen,
  onClose,
  noc,
  currentUser,
  onIssueNoc,
}) => {
  const [deliveryMethod, setDeliveryMethod] = useState<string>('DOWNLOAD');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !noc) return null;

  const handleIssue = async () => {
    setIsSubmitting(true);
    try {
      await onIssueNoc(noc.id, deliveryMethod);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Toolbar */}
        <div className="px-6 py-3 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold">Official No Objection Certificate (NOC)</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                noc.status === 'ISSUED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
              }`}
            >
              {noc.status}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Paper Container */}
        <div className="p-8 max-h-[70vh] overflow-y-auto bg-slate-50">
          <div className="bg-white border-2 border-slate-300 rounded-xl p-8 shadow-sm relative space-y-6">
            {/* Watermark / Header */}
            <div className="text-center pb-6 border-b-2 border-slate-800 space-y-1">
              <div className="flex items-center justify-center space-x-2 text-slate-900 mb-1">
                <Building className="w-6 h-6 text-blue-900" />
                <h1 className="text-xl font-black tracking-wide text-slate-900 uppercase">
                  APEX FINANCIAL SERVICES LTD.
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-medium tracking-wider uppercase">
                Licensed Non-Banking Financial Company (NBFC) | Reg No: NBFC-IND-2024-8841
              </p>
              <p className="text-xs text-slate-500">
                Registered Office: 402, Financial Tower, Panaji, Goa 403001 | contact@apexfin.com
              </p>
            </div>

            {/* Document Title */}
            <div className="text-center space-y-1">
              <h2 className="text-lg font-black text-slate-900 tracking-wider uppercase underline underline-offset-4 decoration-amber-500">
                NO OBJECTION & LOAN CLOSURE CERTIFICATE
              </h2>
              <p className="text-xs font-mono font-semibold text-slate-500">
                Ref No: {noc.nocNumber} | Date: {noc.closureDate}
              </p>
            </div>

            {/* Certificate Body */}
            <div className="text-xs text-slate-800 leading-relaxed space-y-4 text-justify">
              <p>
                <strong>TO WHOMSOEVER IT MAY CONCERN,</strong>
              </p>

              <p>
                This is to officially certify that <strong>{noc.customerName}</strong> (Customer ID: <strong>{noc.customerId}</strong>)
                was granted a credit facility under Loan Account Number <strong>{noc.accountNumber}</strong> with a total sanctioned principal of{' '}
                <strong>{formatCurrencyINR(noc.sanctionedAmount)}</strong>.
              </p>

              <p>
                We hereby confirm and place on record that the aforementioned loan account has been{' '}
                <strong>FULLY SETTLED, CLOSED AND LIQUIDATED</strong> in our financial records as of{' '}
                <strong>{noc.closureDate}</strong> through verified <strong>{noc.closureType.replace('_', ' ')}</strong>.
              </p>

              <p>
                As on date, there are <strong>NO OUTSTANDING DUES, CHARGES, PENALTIES OR INTEREST</strong> payable by the borrower
                in respect of the aforementioned loan account. The financial hypothecation / security charge created in favor of
                Apex Financial Services Ltd. stands released and discharged.
              </p>
            </div>

            {/* Account Summary Grid */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Loan Account</span>
                <span className="font-bold text-slate-900 font-mono">{noc.accountNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Closure Date</span>
                <span className="font-bold text-slate-900">{noc.closureDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Closure Type</span>
                <span className="font-bold text-slate-900">{noc.closureType}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Sanctioned Principal</span>
                <span className="font-bold text-slate-900">{formatCurrencyINR(noc.sanctionedAmount)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Disbursed</span>
                <span className="font-bold text-slate-900">{formatCurrencyINR(noc.disbursedAmount)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Paid Dues</span>
                <span className="font-bold text-emerald-800">{formatCurrencyINR(noc.totalRecoveredAmount)}</span>
              </div>
            </div>

            {/* Signature & Seal Block */}
            <div className="pt-6 border-t border-slate-300 flex items-end justify-between text-xs">
              <div>
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-blue-800/40 flex items-center justify-center text-[10px] font-bold text-blue-900 uppercase text-center p-1">
                  Apex Fin Seal & Stamp
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="h-10 flex items-end justify-end">
                  <span className="font-serif italic text-base text-blue-950 font-bold">Sunita Rao</span>
                </div>
                <p className="font-bold text-slate-900">Authorized Signatory</p>
                <p className="text-[10px] text-slate-500">Credit Operations & Risk Committee</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600">Delivery Channel:</span>
            <select
              value={deliveryMethod}
              onChange={(e) => setDeliveryMethod(e.target.value)}
              className="text-xs font-semibold px-2 py-1 bg-slate-100 border border-slate-300 rounded-lg"
            >
              <option value="DOWNLOAD">Direct PDF Download</option>
              <option value="EMAIL">Customer Email Dispatch</option>
              <option value="BRANCH_PICKUP">Branch Counter Pickup</option>
              <option value="POSTAL">Registered Postal Mail</option>
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Close
            </button>

            {noc.status !== 'ISSUED' && (
              <button
                onClick={handleIssue}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center space-x-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSubmitting ? 'Issuing...' : 'Approve & Issue NOC'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
