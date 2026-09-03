import React, { useState } from 'react';
import {
  ShieldAlert,
  PhoneCall,
  Scale,
  FileText,
  AlertTriangle,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { LoanAccountRecord } from '../../types/loanAccountTypes';
import {
  RecoveryCaseRecord,
  LegalReviewRecord,
  LegalCaseRecord,
  LegalNoticeRecord,
  RecordRecoveryActionPayload,
  EscalateToRecoveryPayload,
  RequestLegalReviewPayload,
  CreateLegalNoticePayload,
  CreateLegalCasePayload,
} from '../../types/recoveryTypes';
import { evaluateRecoveryEligibility } from '../../services/recoveryEngine';
import { formatCurrencyINR, formatDate } from '../../utils/formatters';
import { RecordRecoveryActionModal } from '../recovery/RecordRecoveryActionModal';
import { EscalateToRecoveryModal } from '../recovery/EscalateToRecoveryModal';
import { LegalReviewModal } from '../recovery/LegalReviewModal';
import { LegalNoticeModal } from '../recovery/LegalNoticeModal';
import { LegalCaseDetailModal } from '../recovery/LegalCaseDetailModal';

interface RecoveryTabProps {
  loan: LoanAccountRecord;
  recoveryCase?: RecoveryCaseRecord;
  onEscalate: (payload: EscalateToRecoveryPayload) => void;
  onLogAction: (payload: RecordRecoveryActionPayload) => void;
  onRequestLegalReview: (payload: RequestLegalReviewPayload) => void;
  onApproveLegalReview: (reviewId: string, approved: boolean, notes?: string) => void;
  onCreateLegalNotice: (payload: CreateLegalNoticePayload) => void;
  onApproveLegalNotice: (noticeId: string) => void;
  onDispatchLegalNotice: (noticeId: string, trackingNumber?: string, dispatchMode?: string) => void;
  onCreateLegalCase: (payload: CreateLegalCasePayload) => void;
  onAddLegalCaseEvent: (
    legalCaseId: string,
    eventType: any,
    notes: string,
    referenceNumber?: string,
    nextHearingDate?: string
  ) => void;
  currentUser?: { name: string; id: string; roleName: string };
}

export const RecoveryTab: React.FC<RecoveryTabProps> = ({
  loan,
  recoveryCase,
  onEscalate,
  onLogAction,
  onRequestLegalReview,
  onApproveLegalReview,
  onCreateLegalNotice,
  onApproveLegalNotice,
  onDispatchLegalNotice,
  onCreateLegalCase,
  onAddLegalCaseEvent,
  currentUser,
}) => {
  const [isEscalateOpen, setIsEscalateOpen] = useState<boolean>(false);
  const [isActionOpen, setIsActionOpen] = useState<boolean>(false);
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);
  const [reviewToDecide, setReviewToDecide] = useState<LegalReviewRecord | null>(null);
  const [isNoticeOpen, setIsNoticeOpen] = useState<boolean>(false);
  const [noticeToView, setNoticeToView] = useState<LegalNoticeRecord | null>(null);
  const [isLegalCaseOpen, setIsLegalCaseOpen] = useState<boolean>(false);
  const [selectedLegalCase, setSelectedLegalCase] = useState<LegalCaseRecord | null>(null);

  const eligibility = evaluateRecoveryEligibility(loan, 0, 0);

  return (
    <div className="space-y-6 text-xs">
      {/* Recovery Banner */}
      {!recoveryCase ? (
        <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              <h4 className="text-sm font-bold text-amber-950">
                Loan Not in Recovery (Delinquency Servicing Stage)
              </h4>
            </div>
            <p className="text-slate-600 text-xs">
              Current DPD: <span className="font-bold text-slate-800">{loan.dpd} Days ({loan.dpdBucket})</span> • Overdue Amount:{' '}
              <span className="font-bold text-rose-600">{formatCurrencyINR(loan.overdueAmount)}</span>
            </p>
            <p className="text-[11px] text-amber-800 font-medium">
              Eligibility Assessment: {eligibility.isEligible ? 'Eligible for Recovery Escalation' : 'Standard Collections Active'} (Score: {eligibility.score}/100)
            </p>
          </div>

          <button
            onClick={() => setIsEscalateOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-all shrink-0"
          >
            <ShieldAlert className="w-4 h-4" />
            Escalate to Recovery
          </button>
        </div>
      ) : (
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-4">
          {/* Active Recovery Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    Recovery Case: {recoveryCase.recoveryCaseNumber}
                  </h4>
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
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Stage: <span className="font-semibold text-slate-700">{recoveryCase.recoveryStage.replace(/_/g, ' ')}</span> • Officer:{' '}
                  <span className="font-semibold text-slate-700">{recoveryCase.assignedOfficerName || 'Rajesh Naik'}</span> ({recoveryCase.assignedTeam || 'Field Recovery'})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsActionOpen(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                Log Interaction
              </button>
              <button
                onClick={() => {
                  setReviewToDecide(null);
                  setIsReviewOpen(true);
                }}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Scale className="w-3.5 h-3.5" />
                Legal Review
              </button>
              <button
                onClick={() => {
                  setNoticeToView(null);
                  setIsNoticeOpen(true);
                }}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-bold flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                Legal Notice
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Target Recovery</span>
              <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                {formatCurrencyINR(recoveryCase.targetAmount || recoveryCase.overdueAmount)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Overdue</span>
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
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Collected in Recovery</span>
              <span className="font-mono font-bold text-emerald-600 text-sm mt-0.5 block">
                {formatCurrencyINR(recoveryCase.collectedAmount)}
              </span>
            </div>
          </div>

          {/* Action Log History */}
          <div className="space-y-3">
            <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              Recovery Interaction Log ({recoveryCase.actions?.length || 0})
            </h5>
            {recoveryCase.actions && recoveryCase.actions.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {recoveryCase.actions.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{act.actionType.replace(/_/g, ' ')} • {act.outcome.replace(/_/g, ' ')}</span>
                      <span className="font-mono text-slate-500 font-normal">{formatDate(act.actionDate)}</span>
                    </div>
                    <p className="text-slate-600">{act.outcomeNotes}</p>
                    {act.promisedAmount && (
                      <span className="text-emerald-700 font-semibold block">
                        PTP Amount: {formatCurrencyINR(act.promisedAmount)} (Due: {act.promisedDate ? formatDate(act.promisedDate) : 'N/A'})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 italic">No recovery interactions logged yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <EscalateToRecoveryModal
        isOpen={isEscalateOpen}
        onClose={() => setIsEscalateOpen(false)}
        loan={loan}
        onSubmit={onEscalate}
        currentUser={currentUser}
      />

      {recoveryCase && (
        <>
          <RecordRecoveryActionModal
            isOpen={isActionOpen}
            onClose={() => setIsActionOpen(false)}
            recoveryCase={recoveryCase}
            onSubmit={onLogAction}
            currentUser={currentUser}
          />

          <LegalReviewModal
            isOpen={isReviewOpen}
            onClose={() => {
              setIsReviewOpen(false);
              setReviewToDecide(null);
            }}
            recoveryCase={recoveryCase}
            reviewToDecide={reviewToDecide}
            onRequest={onRequestLegalReview}
            onDecide={onApproveLegalReview}
            currentUser={currentUser}
          />

          <LegalNoticeModal
            isOpen={isNoticeOpen}
            onClose={() => {
              setIsNoticeOpen(false);
              setNoticeToView(null);
            }}
            recoveryCase={recoveryCase}
            noticeToView={noticeToView}
            onCreate={onCreateLegalNotice}
            onApprove={onApproveLegalNotice}
            onDispatch={onDispatchLegalNotice}
            currentUser={currentUser}
          />

          <LegalCaseDetailModal
            isOpen={isLegalCaseOpen}
            onClose={() => {
              setIsLegalCaseOpen(false);
              setSelectedLegalCase(null);
            }}
            legalCase={selectedLegalCase}
            recoveryCaseId={recoveryCase.id}
            claimDefaultAmount={recoveryCase.totalOutstanding}
            onCreate={onCreateLegalCase}
            onAddEvent={onAddLegalCaseEvent}
            currentUser={currentUser}
          />
        </>
      )}
    </div>
  );
};
