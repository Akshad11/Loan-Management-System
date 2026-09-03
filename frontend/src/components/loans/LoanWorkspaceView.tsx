import React, { useState } from 'react';
import {
  ArrowLeft,
  Landmark,
  FileText,
  Calendar,
  CreditCard,
  Receipt,
  Layers,
  History,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Building2,
  Edit2,
  Download,
} from 'lucide-react';
import { LoanAccountRecord, LoanRepaymentSettings, LoanRepaymentFrequency } from '../../types/loanAccountTypes';
import { OverviewTab } from './OverviewTab';
import { ScheduleTab } from './ScheduleTab';
import { TransactionsTab } from './TransactionsTab';
import { ChargesTab } from './ChargesTab';
import { RepaymentSetupTab } from './RepaymentSetupTab';
import { RepaymentsTab } from './RepaymentsTab';
import { RecoveryTab } from './RecoveryTab';
import { DocumentsTab } from './DocumentsTab';
import { HistoryTab } from './HistoryTab';
import { RepaymentSetupModal } from './RepaymentSetupModal';
import { ScheduleVersionModal } from './ScheduleVersionModal';
import { formatCurrencyINR, formatDate } from '../../utils/formatters';

interface LoanWorkspaceViewProps {
  loanId: string;
  onBack: () => void;
  onNavigateModule?: (moduleName: string) => void;
  currentUser?: { name: string; id: string; roleName: string };
  store: any;
  canManageSettings?: boolean;
  canManageSchedule?: boolean;
}

export const LoanWorkspaceView: React.FC<LoanWorkspaceViewProps> = ({
  loanId,
  onBack,
  onNavigateModule,
  currentUser,
  store,
  canManageSettings = true,
  canManageSchedule = true,
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isRepaymentModalOpen, setIsRepaymentModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const loan: LoanAccountRecord | undefined = store.getLoanAccountById(loanId);
  const recoveryCase = loan ? store.getRecoveryByLoanId(loan.id) : undefined;

  if (!loan) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
        <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800">Loan Account Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">
          The requested loan account ({loanId}) could not be located in the database.
        </p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
        >
          Return to Loans List
        </button>
      </div>
    );
  }

  const handleUpdateRepaymentSettings = (updates: Partial<LoanRepaymentSettings>) => {
    store.updateRepaymentSettings(
      loan.id,
      updates,
      currentUser?.name || 'Operations Officer',
      currentUser?.roleName || 'Disbursement Authority'
    );
  };

  const handleGenerateScheduleVersion = (payload: {
    reason: string;
    annualRate?: number;
    tenureMonths?: number;
    frequency?: LoanRepaymentFrequency;
  }) => {
    store.generateScheduleVersion(
      loan.id,
      payload.reason,
      {
        annualRate: payload.annualRate,
        tenureMonths: payload.tenureMonths,
        frequency: payload.frequency,
      },
      currentUser?.name || 'Operations Officer',
      currentUser?.roleName || 'Disbursement Authority'
    );
  };

  const tabs = [
    { id: 'overview', label: 'Overview & Summary', icon: <Landmark className="w-4 h-4" /> },
    {
      id: 'repayments',
      label: 'Repayments',
      icon: <CreditCard className="w-4 h-4" />,
    },
    {
      id: 'schedule',
      label: `Repayment Schedule (v${loan.currentScheduleVersion})`,
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: 'transactions',
      label: `Transactions (${loan.transactions?.length || 0})`,
      icon: <Receipt className="w-4 h-4" />,
    },
    {
      id: 'charges',
      label: `Charges (${loan.charges?.length || 0})`,
      icon: <Layers className="w-4 h-4" />,
    },
    {
      id: 'repayment_setup',
      label: 'Repayment Setup & Mandate',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      id: 'recovery',
      label: `Recovery & Legal${recoveryCase ? ` (${recoveryCase.recoveryStage})` : ''}`,
      icon: <ShieldAlert className={`w-4 h-4 ${loan.dpd >= 60 || recoveryCase ? 'text-amber-600' : ''}`} />,
    },
    { id: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
    { id: 'history', label: 'Audit Trail', icon: <History className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-900 transition-colors mt-0.5"
              title="Back to Loans List"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-lg font-bold text-slate-900 tracking-tight">
                  {loan.accountNumber}
                </span>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                    loan.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : loan.status === 'PARTIALLY_DISBURSED'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : loan.status === 'OVERDUE'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {loan.status.replace(/_/g, ' ')}
                </span>

                {loan.dpd > 0 ? (
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    {loan.dpd} DPD
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    0 DPD Standard
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="font-semibold text-slate-800">{loan.customerName}</span>
                <span>•</span>
                <span className="font-mono">{loan.customerNumber}</span>
                <span>•</span>
                <span>{loan.productName}</span>
                <span>•</span>
                <span>{loan.branchName}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canManageSettings && (
              <button
                onClick={() => setIsRepaymentModalOpen(true)}
                className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                Repayment Setup
              </button>
            )}

            {canManageSchedule && (
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                Restructure Schedule
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-slate-200 pt-3 mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && <OverviewTab loan={loan} onNavigateModule={onNavigateModule} />}
      {activeTab === 'repayments' && (
        <RepaymentsTab
          loan={loan}
          store={store}
          currentUser={currentUser}
          canManageRepayments={canManageSettings}
        />
      )}
      {activeTab === 'schedule' && (
        <ScheduleTab
          loan={loan}
          onCreateNewVersion={() => setIsScheduleModalOpen(true)}
          canManageSchedule={canManageSchedule}
        />
      )}
      {activeTab === 'transactions' && <TransactionsTab loan={loan} />}
      {activeTab === 'charges' && (
        <ChargesTab
          loan={loan}
          canManageCharges={canManageSettings}
        />
      )}
      {activeTab === 'repayment_setup' && (
        <RepaymentSetupTab
          loan={loan}
          onEditSettings={() => setIsRepaymentModalOpen(true)}
          canManageSettings={canManageSettings}
        />
      )}
      {activeTab === 'recovery' && (
        <RecoveryTab
          loan={loan}
          recoveryCase={recoveryCase}
          onEscalate={(payload) => store.escalateToRecovery(payload, currentUser?.name, currentUser?.roleName)}
          onLogAction={(payload) => store.logRecoveryAction(payload, currentUser?.name, currentUser?.roleName)}
          onRequestLegalReview={(payload) => store.requestLegalReview(payload, currentUser?.name, currentUser?.roleName)}
          onApproveLegalReview={(revId, apprv, notes) => store.approveLegalReview(revId, apprv, notes, currentUser?.name, currentUser?.roleName)}
          onCreateLegalNotice={(payload) => store.createLegalNotice(payload, currentUser?.name)}
          onApproveLegalNotice={(notId) => store.approveLegalNotice(notId, currentUser?.name)}
          onDispatchLegalNotice={(notId, trk, mode) => store.dispatchLegalNotice(notId, trk, mode, currentUser?.name)}
          onCreateLegalCase={(payload) => store.createLegalCase(payload, currentUser?.name, currentUser?.roleName)}
          onAddLegalCaseEvent={(lcId, evtType, nts, ref, nxt) => store.addLegalCaseEvent(lcId, evtType, nts, ref, nxt, currentUser?.name, currentUser?.roleName)}
          currentUser={currentUser}
        />
      )}
      {activeTab === 'documents' && <DocumentsTab loan={loan} />}
      {activeTab === 'history' && <HistoryTab loan={loan} />}

      {/* Modals */}
      {isRepaymentModalOpen && (
        <RepaymentSetupModal
          isOpen={isRepaymentModalOpen}
          onClose={() => setIsRepaymentModalOpen(false)}
          loan={loan}
          onSave={handleUpdateRepaymentSettings}
        />
      )}

      {isScheduleModalOpen && (
        <ScheduleVersionModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          loan={loan}
          onGenerate={handleGenerateScheduleVersion}
        />
      )}
    </div>
  );
};
