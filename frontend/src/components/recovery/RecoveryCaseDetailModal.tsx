import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  PhoneCall,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Scale,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Send,
  Plus,
  ArrowRight,
  TrendingUp,
  History,
  Building,
} from 'lucide-react';
import {
  RecoveryCaseRecord,
  RecoveryActionRecord,
  LegalReviewRecord,
  LegalCaseRecord,
  LegalNoticeRecord,
} from '../../types/recoveryTypes';
import { formatCurrencyINR, formatDate } from '../../utils/formatters';

interface RecoveryCaseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recoveryCase: RecoveryCaseRecord;
  onOpenActionModal: () => void;
  onOpenLegalReviewModal: (reviewToDecide?: LegalReviewRecord) => void;
  onOpenLegalNoticeModal: (noticeToView?: LegalNoticeRecord) => void;
  onOpenLegalCaseModal: (legalCase?: LegalCaseRecord) => void;
  onResolveCase?: (caseId: string, outcome: string, notes?: string) => void;
  currentUser?: { name: string; id: string; roleName: string };
}

export const RecoveryCaseDetailModal: React.FC<RecoveryCaseDetailModalProps> = ({
  isOpen,
  onClose,
  recoveryCase,
  onOpenActionModal,
  onOpenLegalReviewModal,
  onOpenLegalNoticeModal,
  onOpenLegalCaseModal,
  onResolveCase,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'ACTIONS' | 'LEGAL' | 'NEGOTIATIONS' | 'HISTORY'>('ACTIONS');
  const [resolveOutcome, setResolveOutcome] = useState<string>('FULL_RECOVERY');
  const [resolveNotes, setResolveNotes] = useState<string>('');
  const [showResolveModal, setShowResolveModal] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onResolveCase) {
      onResolveCase(recoveryCase.id, resolveOutcome, resolveNotes);
    }
    setShowResolveModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-xs">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {recoveryCase.recoveryCaseNumber}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    recoveryCase.status === 'CURED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : recoveryCase.status === 'LEGAL_ACTION'
                      ? 'bg-purple-100 text-purple-800'
                      : recoveryCase.priority === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {recoveryCase.status.replace(/_/g, ' ')}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                  {recoveryCase.recoveryStage.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Borrower: <span className="font-semibold text-slate-800">{recoveryCase.customerName}</span> ({recoveryCase.customerNumber || 'CUST-001'}) • Account: <span className="font-mono font-semibold text-slate-800">{recoveryCase.accountNumber}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenActionModal}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Log Action
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Financial Exposure KPI Bar */}
        <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Overdue Balance</span>
            <span className="font-mono font-bold text-rose-600 text-sm mt-0.5 block">
              {formatCurrencyINR(recoveryCase.overdueAmount)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Exposure</span>
            <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
              {formatCurrencyINR(recoveryCase.totalOutstanding)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Recovered to Date</span>
            <span className="font-mono font-bold text-emerald-600 text-sm mt-0.5 block">
              {formatCurrencyINR(recoveryCase.collectedAmount)}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Officer</span>
            <span className="font-semibold text-slate-800 text-xs mt-0.5 block truncate">
              {recoveryCase.assignedOfficerName || 'Rajesh Naik'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('ACTIONS')}
              className={`pb-2.5 font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'ACTIONS'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              Activity Log ({recoveryCase.actions?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('LEGAL')}
              className={`pb-2.5 font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'LEGAL'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              Legal & Notices ({ (recoveryCase.legalReviews?.length || 0) + (recoveryCase.legalNotices?.length || 0) + (recoveryCase.legalCases?.length || 0) })
            </button>
            <button
              onClick={() => setActiveTab('NEGOTIATIONS')}
              className={`pb-2.5 font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'NEGOTIATIONS'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Arrangements / PTP ({recoveryCase.negotiations?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`pb-2.5 font-bold flex items-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'HISTORY'
                  ? 'border-amber-600 text-amber-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Escalations & Assignments ({ (recoveryCase.escalations?.length || 0) + (recoveryCase.assignments?.length || 0) })
            </button>
          </div>

          <div className="flex items-center gap-2 pb-2">
            {recoveryCase.status !== 'RESOLVED' && recoveryCase.status !== 'CURED' && (
              <button
                type="button"
                onClick={() => setShowResolveModal(true)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-[11px] transition-colors"
              >
                Resolve Case
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'ACTIONS' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">
                  Field Visits & Borrower Interactions
                </span>
                <button
                  onClick={onOpenActionModal}
                  className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Activity
                </button>
              </div>

              {recoveryCase.actions && recoveryCase.actions.length > 0 ? (
                <div className="space-y-2.5">
                  {recoveryCase.actions.map((act) => (
                    <div
                      key={act.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 hover:border-blue-200 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">
                            {act.actionType.replace(/_/g, ' ')}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-slate-200 text-slate-700">
                            {act.outcome.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <span className="font-mono text-slate-500 text-[11px]">
                          {formatDate(act.actionDate)}
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{act.outcomeNotes}</p>

                      {act.promisedAmount && (
                        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-emerald-900 font-semibold">
                          <span>Promise to Pay (PTP): {formatCurrencyINR(act.promisedAmount)}</span>
                          <span>Due: {act.promisedDate ? formatDate(act.promisedDate) : 'N/A'}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                        <span>Officer: {act.officerName} ({act.officerRole})</span>
                        {act.location && <span>Location: {act.location}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No recovery field visits or calls logged yet.
                </div>
              )}
            </div>
          )}

          {activeTab === 'LEGAL' && (
            <div className="space-y-6">
              {/* Quick Legal Actions Toolbar */}
              <div className="flex items-center justify-between p-3 bg-purple-50/60 border border-purple-200 rounded-xl">
                <span className="font-bold text-purple-950">
                  Remedial & Statutory Legal Operations
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenLegalReviewModal()}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Request Review
                  </button>
                  <button
                    onClick={() => onOpenLegalNoticeModal()}
                    className="px-2.5 py-1 bg-white hover:bg-purple-100 text-purple-800 border border-purple-300 rounded-lg font-bold flex items-center gap-1 transition-colors"
                  >
                    <FileText className="w-3 h-3" />
                    Draft Notice
                  </button>
                  <button
                    onClick={() => onOpenLegalCaseModal()}
                    className="px-2.5 py-1 bg-purple-900 hover:bg-black text-white rounded-lg font-bold flex items-center gap-1 transition-colors"
                  >
                    <Scale className="w-3 h-3" />
                    Institute Suit
                  </button>
                </div>
              </div>

              {/* Legal Reviews Section */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">Legal Reviews & Approvals</h4>
                {recoveryCase.legalReviews && recoveryCase.legalReviews.length > 0 ? (
                  <div className="space-y-2">
                    {recoveryCase.legalReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-purple-800">{rev.reviewNumber}</span>
                            <span className="px-2 py-0.2 text-[10px] font-bold rounded-full bg-purple-100 text-purple-800">
                              {rev.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-slate-600">{rev.reviewReason}</p>
                        </div>
                        {rev.status === 'PENDING_REVIEW' && (
                          <button
                            onClick={() => onOpenLegalReviewModal(rev)}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-2xs"
                          >
                            Decide Review
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No formal legal reviews requested.</p>
                )}
              </div>

              {/* Legal Notices Section */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">Statutory Legal Notices</h4>
                {recoveryCase.legalNotices && recoveryCase.legalNotices.length > 0 ? (
                  <div className="space-y-2">
                    {recoveryCase.legalNotices.map((not) => (
                      <div
                        key={not.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-800">{not.noticeNumber}</span>
                            <span className="font-medium text-slate-800">{not.noticeType.replace(/_/g, ' ')}</span>
                            <span className="px-2 py-0.2 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800">
                              {not.status}
                            </span>
                          </div>
                          <span className="text-slate-500 text-[11px] block mt-0.5">
                            Demand: {formatCurrencyINR(not.demandAmount)} • Due: {formatDate(not.dueDate)}
                          </span>
                        </div>
                        <button
                          onClick={() => onOpenLegalNoticeModal(not)}
                          className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-300 rounded-lg"
                        >
                          View & Act
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No statutory notices issued.</p>
                )}
              </div>

              {/* Legal Cases Section */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900">Active Court Cases</h4>
                {recoveryCase.legalCases && recoveryCase.legalCases.length > 0 ? (
                  <div className="space-y-2">
                    {recoveryCase.legalCases.map((lc) => (
                      <div
                        key={lc.id}
                        className="p-3.5 bg-purple-50/50 border border-purple-200 rounded-xl flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-purple-900">{lc.legalCaseNumber}</span>
                            <span className="font-bold text-slate-900">{lc.courtOrForum}</span>
                            <span className="px-2 py-0.2 text-[10px] font-bold rounded-full bg-purple-100 text-purple-800">
                              {lc.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <span className="text-slate-600 text-[11px] block mt-0.5">
                            Claim: {formatCurrencyINR(lc.claimAmount)} • Next Hearing: {lc.nextHearingDate ? formatDate(lc.nextHearingDate) : 'N/A'} • Advocate: {lc.advocateName}
                          </span>
                        </div>
                        <button
                          onClick={() => onOpenLegalCaseModal(lc)}
                          className="px-3 py-1 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg"
                        >
                          Manage Case
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No court cases instituted.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'NEGOTIATIONS' && (
            <div className="space-y-3">
              <span className="font-bold text-slate-900 text-xs">
                Proposed Repayment Plans & Settlements
              </span>
              {recoveryCase.negotiations && recoveryCase.negotiations.length > 0 ? (
                <div className="space-y-2.5">
                  {recoveryCase.negotiations.map((neg) => (
                    <div
                      key={neg.id}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          Proposed Amount: {formatCurrencyINR(neg.proposedAmount)} ({neg.frequency})
                        </span>
                        <span className="font-mono text-slate-500 text-[11px]">
                          Target Date: {formatDate(neg.proposedDate)}
                        </span>
                      </div>
                      <p className="text-slate-700">{neg.reason}</p>
                      {neg.customerResponse && (
                        <p className="text-slate-500 italic">Borrower Response: "{neg.customerResponse}"</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No repayment arrangements recorded.
                </div>
              )}
            </div>
          )}

          {activeTab === 'HISTORY' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 mb-2">Escalation Records</h4>
                {recoveryCase.escalations?.map((esc) => (
                  <div key={esc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-2">
                    <div className="flex justify-between font-bold">
                      <span>{esc.escalationNumber} ({esc.previousStage} → {esc.newStage})</span>
                      <span className="font-mono text-slate-500">{formatDate(esc.effectiveDate)}</span>
                    </div>
                    <p className="text-slate-600 mt-1">{esc.reason}</p>
                    <span className="text-[11px] text-slate-400 block mt-1">Triggered by: {esc.triggeredByName} ({esc.triggeredByRole})</span>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">Officer Assignments</h4>
                {recoveryCase.assignments?.map((asgn) => (
                  <div key={asgn.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-2">
                    <div className="flex justify-between font-bold">
                      <span>Assigned to: {asgn.officerName} ({asgn.teamName})</span>
                      <span className="font-mono text-slate-500">{formatDate(asgn.assignedAt)}</span>
                    </div>
                    <p className="text-slate-600 mt-1">{asgn.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-slate-500">
            Case Status: <span className="font-semibold text-slate-800">{recoveryCase.status}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-semibold text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Resolve Case Sub-modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4">
            <h4 className="font-bold text-slate-900 text-sm">Resolve Recovery Case</h4>
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Resolution Outcome</label>
                <select
                  value={resolveOutcome}
                  onChange={(e) => setResolveOutcome(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  <option value="FULL_RECOVERY">Full Overdue Recovered</option>
                  <option value="SETTLEMENT_APPROVED">Formal Settlement Approved</option>
                  <option value="RETURNED_TO_SERVICING">Returned to Normal Servicing</option>
                  <option value="RESTRUCTURED">Loan Restructured / Rescheduled</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Resolution Notes</label>
                <textarea
                  rows={3}
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                  placeholder="Provide resolution details..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResolveModal(false)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResolveSubmit}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-2xs"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
