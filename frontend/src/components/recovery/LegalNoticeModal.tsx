import React, { useState, useMemo } from 'react';
import {
  X,
  FileText,
  Printer,
  Send,
  CheckCircle,
  AlertTriangle,
  Download,
  Landmark,
  ShieldCheck,
} from 'lucide-react';
import {
  RecoveryCaseRecord,
  LegalNoticeRecord,
  LegalNoticeType,
  CreateLegalNoticePayload,
} from '../../types/recoveryTypes';
import { generateStatutoryNoticeText } from '../../services/recoveryEngine';
import { formatCurrencyINR, formatDate } from '../../utils/formatters';

interface LegalNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recoveryCase: RecoveryCaseRecord;
  noticeToView?: LegalNoticeRecord | null;
  onCreate?: (payload: CreateLegalNoticePayload) => void;
  onApprove?: (noticeId: string) => void;
  onDispatch?: (noticeId: string, trackingNumber?: string, dispatchMode?: string) => void;
  currentUser?: { name: string; id: string; roleName: string };
  loanDisbursementDate?: string;
  loanOriginalPrincipal?: number;
}

export const LegalNoticeModal: React.FC<LegalNoticeModalProps> = ({
  isOpen,
  onClose,
  recoveryCase,
  noticeToView,
  onCreate,
  onApprove,
  onDispatch,
  currentUser,
  loanDisbursementDate = '2026-06-01',
  loanOriginalPrincipal = 500000,
}) => {
  const [noticeType, setNoticeType] = useState<LegalNoticeType>(
    'SECTION_138_CHEQUE_BOUNCE'
  );
  const [curePeriodDays, setCurePeriodDays] = useState<number>(15);
  const [recipientName, setRecipientName] = useState<string>(
    recoveryCase.customerName
  );
  const [recipientAddress, setRecipientAddress] = useState<string>(
    'Flat 302, Sagar View Enclave, Miramar, Panaji, Goa - 403002'
  );
  const [customClauses, setCustomClauses] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [dispatchMode, setDispatchMode] = useState<string>('REGISTERED_POST_AD');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const isViewing = !!noticeToView;

  // Live draft preview text
  const liveDraftContent = useMemo(() => {
    if (noticeToView) return noticeToView.draftContent;

    const noticeDate = new Date().toISOString().split('T')[0];
    const d = new Date();
    d.setDate(d.getDate() + curePeriodDays);
    const dueDate = d.toISOString().split('T')[0];

    return generateStatutoryNoticeText({
      noticeType,
      customerName: recipientName || recoveryCase.customerName,
      customerAddress: recipientAddress,
      accountNumber: recoveryCase.accountNumber,
      disbursementDate: loanDisbursementDate,
      originalPrincipal: loanOriginalPrincipal,
      overdueAmount: recoveryCase.overdueAmount,
      principalOutstanding: recoveryCase.totalOutstanding,
      interestOutstanding: 0,
      feeOutstanding: 0,
      penaltyOutstanding: 0,
      totalOutstanding: recoveryCase.totalOutstanding,
      curePeriodDays,
      noticeDate,
      dueDate,
      customClauses: customClauses.trim() || undefined,
    });
  }, [
    noticeToView,
    noticeType,
    recipientName,
    recipientAddress,
    curePeriodDays,
    customClauses,
    recoveryCase,
    loanDisbursementDate,
    loanOriginalPrincipal,
  ]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onCreate) {
      onCreate({
        recoveryCaseId: recoveryCase.id,
        noticeType,
        curePeriodDays,
        recipientName,
        recipientAddress,
        customClauses: customClauses.trim() || undefined,
      });
    }
    onClose();
  };

  const handleApprove = () => {
    if (!noticeToView) return;

    if (noticeToView.preparedByName === currentUser?.name || noticeToView.preparedBy === currentUser?.name) {
      setError('Segregation of Duties Violation: You drafted this notice and cannot approve it.');
      return;
    }

    if (onApprove) {
      onApprove(noticeToView.id);
    }
    onClose();
  };

  const handleDispatch = () => {
    if (!noticeToView) return;
    if (onDispatch) {
      onDispatch(noticeToView.id, trackingNumber.trim() || undefined, dispatchMode);
    }
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-xs">
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isViewing ? `Statutory Notice: ${noticeToView.noticeNumber}` : 'Draft Statutory Legal Notice'}
              </h3>
              <p className="text-xs text-slate-500">
                Loan: <span className="font-mono font-semibold text-slate-700">{recoveryCase.accountNumber}</span> • Borrower: <span className="font-semibold text-slate-700">{recoveryCase.customerName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isViewing && (
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg font-semibold border border-slate-200 flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Notice
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!isViewing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Statutory Notice Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={noticeType}
                    onChange={(e) => setNoticeType(e.target.value as LegalNoticeType)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SECTION_138_CHEQUE_BOUNCE">
                      Section 138 NI Act (Cheque / NACH Bounce Notice)
                    </option>
                    <option value="LOAN_RECALL_DEMAND">
                      Formal Loan Recall & Statutory Demand Notice
                    </option>
                    <option value="STATUTORY_DEMAND_NOTICE">
                      Statutory Demand Notice Prior to Civil Suit
                    </option>
                    <option value="ARBITRATION_INVOCATION">
                      Notice Invoking Arbitration Agreement
                    </option>
                    <option value="SARFAESI_13_2_NOTICE">
                      SARFAESI Act Section 13(2) Demand Notice
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Statutory Cure Period (Days)
                  </label>
                  <input
                    type="number"
                    min="7"
                    max="60"
                    value={curePeriodDays}
                    onChange={(e) => setCurePeriodDays(parseInt(e.target.value) || 15)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Recipient Full Name
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Recipient Postal Address
                  </label>
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Custom Legal Clauses / Specific Instrument Details
                </label>
                <input
                  type="text"
                  placeholder="e.g. NACH Mandate UMRN: HDFC0002910 presented on 5th August 2026..."
                  value={customClauses}
                  onChange={(e) => setCustomClauses(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-slate-500 block text-[11px]">Notice Status</span>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase mt-0.5 ${
                    noticeToView.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : noticeToView.status === 'DISPATCHED'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {noticeToView.status}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Prepared By</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {noticeToView.preparedByName} on {formatDate(noticeToView.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Approved By</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {noticeToView.approvedByName ? `${noticeToView.approvedByName} (${formatDate(noticeToView.approvedAt)})` : 'Pending Approval'}
                </span>
              </div>
            </div>
          )}

          {/* Legal Notice Document Preview */}
          <div className="border border-slate-300 rounded-xl p-5 bg-slate-50/50 font-mono text-[11px] leading-relaxed text-slate-800 whitespace-pre-wrap shadow-inner max-h-96 overflow-y-auto">
            {liveDraftContent}
          </div>

          {/* Dispatch inputs if viewing and approved */}
          {isViewing && noticeToView.status === 'APPROVED' && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
              <span className="font-bold text-blue-900 block">
                Dispatch Notice via Postal / Courier Service
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-blue-950 mb-1">
                    Postal / Speed Post Tracking UTR #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ED482910492IN"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full px-3 py-1.5 font-mono border border-blue-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-blue-950 mb-1">
                    Dispatch Mode
                  </label>
                  <select
                    value={dispatchMode}
                    onChange={(e) => setDispatchMode(e.target.value)}
                    className="w-full px-3 py-1.5 border border-blue-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="REGISTERED_POST_AD">Registered Post A.D.</option>
                    <option value="SPEED_POST">Speed Post (India Post)</option>
                    <option value="COURIER">Certified Courier</option>
                    <option value="HAND_DELIVERY">Hand Delivery with Acknowledgment</option>
                    <option value="EMAIL">Registered Email</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {error && <p className="text-rose-600 font-semibold">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-slate-500">
            User: <span className="font-semibold text-slate-700">{currentUser?.name || 'Legal Officer'}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 font-semibold text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              Close
            </button>

            {!isViewing && (
              <button
                type="button"
                onClick={handleCreateSubmit}
                className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all"
              >
                Save Draft Notice
              </button>
            )}

            {isViewing && noticeToView.status === 'DRAFT' && (
              <button
                type="button"
                onClick={handleApprove}
                disabled={noticeToView.preparedByName === currentUser?.name}
                className="px-4 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50 transition-all"
              >
                Approve Notice (Checker)
              </button>
            )}

            {isViewing && noticeToView.status === 'APPROVED' && (
              <button
                type="button"
                onClick={handleDispatch}
                className="px-4 py-2 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                Dispatch Notice
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
