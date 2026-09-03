import React, { useState } from 'react';
import {
  DisbursementRecord,
  DisbursementRequestRecord,
  DisbursementTransactionRecord,
  DisbursementStatus,
  PaymentMethod,
} from '../../types/disbursementTypes';
import { DisbursementReadinessCard } from './DisbursementReadinessCard';
import { DisbursementApprovalModal } from './DisbursementApprovalModal';
import { DisbursementTransactionModal } from './DisbursementTransactionModal';
import { DisbursementReversalModal } from './DisbursementReversalModal';
import { DisbursementCreateModal } from './DisbursementCreateModal';
import {
  ArrowLeft,
  Building,
  CheckCircle2,
  Clock,
  Landmark,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  FileText,
  RotateCcw,
  Plus,
  ArrowUpRight,
  History,
  CreditCard,
  Layers,
  User,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';

interface DisbursementWorkspaceViewProps {
  disbursementId: string;
  onBack: () => void;
  onNavigateModule?: (moduleName: string) => void;
  currentUser: { name: string; id: string; roleName: string };
  store: any;
  canCreateRequest: boolean;
  canApproveDisbursement: boolean;
  canExecuteDisbursement: boolean;
}

export const DisbursementWorkspaceView: React.FC<DisbursementWorkspaceViewProps> = ({
  disbursementId,
  onBack,
  onNavigateModule,
  currentUser,
  store,
  canCreateRequest,
  canApproveDisbursement,
  canExecuteDisbursement,
}) => {
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'READINESS' | 'REQUESTS' | 'TRANSACTIONS' | 'BENEFICIARIES' | 'AUDIT'
  >('OVERVIEW');

  // Modals state
  const [showApprovalModal, setShowApprovalModal] = useState<boolean>(false);
  const [showPayoutModal, setShowPayoutModal] = useState<boolean>(false);
  const [showReversalModal, setShowReversalModal] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedTxnForReversal, setSelectedTxnForReversal] = useState<DisbursementTransactionRecord | null>(null);

  const disbursement: DisbursementRecord | undefined = store.getDisbursementById(disbursementId);

  if (!disbursement) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
        <h3 className="text-sm font-bold text-slate-800">Disbursement File Not Found</h3>
        <p className="text-xs text-slate-500">The requested disbursement record could not be loaded.</p>
        <button
          onClick={onBack}
          className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg"
        >
          Return to Queue
        </button>
      </div>
    );
  }

  const latestReq = disbursement.requests[0];
  const readiness = store.evaluateDisbursementReadiness(disbursement.sanctionId);
  const isMaker = latestReq?.requestedByName?.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
  const canApproveCurrent = canApproveDisbursement && !isMaker && latestReq?.status === 'PENDING_APPROVAL';
  const canExecuteCurrent = canExecuteDisbursement && (latestReq?.status === 'APPROVED' || latestReq?.status === 'FAILED');

  const handleApprove = (notes: string) => {
    if (!latestReq) return;
    store.approveDisbursement(disbursement.id, latestReq.id, currentUser.name, currentUser.roleName, notes);
  };

  const handleReject = (reason: string) => {
    if (!latestReq) return;
    store.rejectDisbursement(disbursement.id, latestReq.id, currentUser.name, currentUser.roleName, reason);
  };

  const handleReturn = (reason: string) => {
    if (!latestReq) return;
    store.returnDisbursement(disbursement.id, latestReq.id, currentUser.name, currentUser.roleName, reason);
  };

  const handleExecutePayout = (data: {
    paymentMethod: PaymentMethod;
    utrNumber?: string;
    externalReference?: string;
    simulateFailure?: boolean;
    failureReason?: string;
  }) => {
    if (!latestReq) return;
    store.executeDisbursementTransaction(disbursement.id, latestReq.id, data, currentUser.name, currentUser.roleName);
  };

  const handleReversePayout = (reason: string) => {
    if (!selectedTxnForReversal) return;
    store.reverseDisbursementTransaction(disbursement.id, selectedTxnForReversal.id, reason, currentUser.name, currentUser.roleName);
    setSelectedTxnForReversal(null);
  };

  const handleCreateNewRequest = (data: any) => {
    store.createDisbursementRequest({
      ...data,
      actorName: currentUser.name,
      actorRole: currentUser.roleName,
      actorId: currentUser.id,
    });
  };

  const percentDisbursed =
    disbursement.sanctionAmount > 0
      ? Math.round((disbursement.totalDisbursedAmount / disbursement.sanctionAmount) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
              title="Back to Disbursements Queue"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 font-mono tracking-tight">
                  {disbursement.disbursementNumber}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-800 border border-slate-300">
                  {disbursement.status}
                </span>
                {disbursement.remainingAmount === 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Fully Disbursed
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Borrower: <span className="font-semibold text-slate-800">{disbursement.customerName}</span> ({disbursement.customerNumber}) • App #{disbursement.applicationNumber}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {disbursement.remainingAmount > 0 && canCreateRequest && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New Tranche Request
              </button>
            )}

            {canApproveCurrent && (
              <button
                onClick={() => setShowApprovalModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                Checker Review
              </button>
            )}

            {canExecuteCurrent && (
              <button
                onClick={() => setShowPayoutModal(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
              >
                <ArrowUpRight className="w-4 h-4" />
                Execute Banking Payout
              </button>
            )}
          </div>
        </div>

        {/* 4-KPI Metric Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">
              Sanction Limit
            </span>
            <span className="text-base font-bold font-mono text-slate-900">
              ₹{disbursement.sanctionAmount.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{disbursement.sanctionNumber}</span>
          </div>

          <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200">
            <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-wider block">
              Total Disbursed ({percentDisbursed}%)
            </span>
            <span className="text-base font-bold font-mono text-emerald-950">
              ₹{disbursement.totalDisbursedAmount.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-emerald-600 font-mono block mt-0.5">
              {disbursement.transactions.filter((t) => t.status === 'SUCCESSFUL').length} settled payout(s)
            </span>
          </div>

          <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200">
            <span className="text-[10px] text-indigo-700 uppercase font-bold tracking-wider block">
              Latest Request
            </span>
            <span className="text-base font-bold font-mono text-indigo-950">
              ₹{(latestReq?.requestedAmount || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-indigo-600 font-mono block mt-0.5">
              {latestReq ? `${latestReq.disbursementType} • ${latestReq.status}` : 'No active request'}
            </span>
          </div>

          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200">
            <span className="text-[10px] text-blue-700 uppercase font-bold tracking-wider block">
              Remaining Available
            </span>
            <span className="text-base font-bold font-mono text-blue-950">
              ₹{disbursement.remainingAmount.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-blue-600 font-mono block mt-0.5">
              Available for further tranches
            </span>
          </div>
        </div>

        {/* Batch 10: Linked Loan Account Servicing Banner */}
        {(() => {
          const linkedLoan = store.getLoanAccountByDisbursementId
            ? store.getLoanAccountByDisbursementId(disbursement.id) ||
              store.getLoanAccountBySanctionId(disbursement.sanctionId)
            : undefined;

          if (!linkedLoan) return null;

          return (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider">
                      Servicing Loan Account Created
                    </span>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {linkedLoan.status}
                    </span>
                  </div>
                  <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                    {linkedLoan.accountNumber} • Outstanding: ₹{linkedLoan.principalOutstanding.toLocaleString('en-IN')} (EMI: ₹{linkedLoan.emiAmount.toLocaleString('en-IN')}/mo)
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigateModule && onNavigateModule('loans')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shrink-0 shadow-xs transition-colors"
              >
                View Loan Account <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })()}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'OVERVIEW', label: 'Summary & Overview', icon: Layers },
            { id: 'READINESS', label: `Verification Readiness (${readiness.passedChecks}/${readiness.totalChecks})`, icon: ShieldCheck },
            { id: 'REQUESTS', label: `Disbursement Requests (${disbursement.requests.length})`, icon: Landmark },
            { id: 'TRANSACTIONS', label: `Bank Transactions (${disbursement.transactions.length})`, icon: CreditCard },
            { id: 'BENEFICIARIES', label: `Beneficiaries (${disbursement.beneficiaries.length})`, icon: User },
            { id: 'AUDIT', label: `Audit Trail (${disbursement.history.length})`, icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENTS */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <DisbursementReadinessCard
            readiness={readiness}
            onNavigateToSource={(cat) => {
              if (cat === 'SANCTION' && onNavigateModule) onNavigateModule('sanctions');
              if (cat === 'APPLICATION' && onNavigateModule) onNavigateModule('applications');
              if (cat === 'CUSTOMER' && onNavigateModule) onNavigateModule('customers');
            }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sanction & Facility Context */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Sanction Terms & Originating Approval</h3>
                {onNavigateModule && (
                  <button
                    onClick={() => onNavigateModule('sanctions')}
                    className="text-[11px] text-indigo-600 font-bold hover:underline flex items-center gap-1"
                  >
                    View Sanction <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Facility Product:</span>
                  <span className="font-semibold text-slate-900">{disbursement.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sanction Number:</span>
                  <span className="font-mono text-slate-900">{disbursement.sanctionNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Application Reference:</span>
                  <span className="font-mono text-slate-900">{disbursement.applicationNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sanctioned Amount:</span>
                  <span className="font-mono font-bold text-slate-900">₹{disbursement.sanctionAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Branch:</span>
                  <span className="text-slate-800">{disbursement.branchName || disbursement.branchId}</span>
                </div>
              </div>
            </div>

            {/* Active Beneficiary Bank Information */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Designated Beneficiary Account</h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Verified Account
                </span>
              </div>

              {disbursement.beneficiaries.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Beneficiary Name:</span>
                    <span className="font-bold text-slate-900">{disbursement.beneficiaries[0].beneficiaryName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bank Name:</span>
                    <span className="text-slate-900">{disbursement.beneficiaries[0].bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Account Number:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {disbursement.beneficiaries[0].accountNumberMasked}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">IFSC Code:</span>
                    <span className="font-mono text-slate-900">{disbursement.beneficiaries[0].ifscCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Verification Source:</span>
                    <span className="text-slate-600">{disbursement.beneficiaries[0].verificationSource || 'KYC Bank Proof'}</span>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 py-4 text-center">No beneficiary attached.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. READINESS TAB */}
      {activeTab === 'READINESS' && (
        <DisbursementReadinessCard
          readiness={readiness}
          onNavigateToSource={(cat) => {
            if (cat === 'SANCTION' && onNavigateModule) onNavigateModule('sanctions');
            if (cat === 'APPLICATION' && onNavigateModule) onNavigateModule('applications');
            if (cat === 'CUSTOMER' && onNavigateModule) onNavigateModule('customers');
          }}
        />
      )}

      {/* 3. REQUESTS TAB */}
      {activeTab === 'REQUESTS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Disbursement Request Tranches</h3>
              <p className="text-xs text-slate-500">History of all full and partial payout requests created against this sanction.</p>
            </div>
            {disbursement.remainingAmount > 0 && canCreateRequest && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> New Tranche
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {disbursement.requests.map((r, idx) => (
              <div key={r.id} className="p-4 hover:bg-slate-50/50 transition-colors space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{r.requestNumber}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 uppercase">
                      {r.disbursementType} Payout
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {r.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      ₹{r.requestedAmount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Via {r.paymentMethod}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Maker:</span>
                    <span className="font-medium text-slate-900">{r.requestedByName}</span> ({new Date(r.requestedAt).toLocaleDateString()})
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Checker Signoff:</span>
                    <span className="font-medium text-slate-900">{r.approvedByName || r.rejectedByName || r.returnedByName || 'Pending'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Purpose:</span>
                    <span className="text-slate-800">{r.purpose || 'Disbursement payout'}</span>
                  </div>
                </div>

                {r.approvalNotes && (
                  <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded-md border border-emerald-100">
                    <span className="font-bold">Checker Signoff Note:</span> {r.approvalNotes}
                  </div>
                )}
                {r.rejectionReason && (
                  <div className="text-[11px] text-rose-800 bg-rose-50 p-2 rounded-md border border-rose-100">
                    <span className="font-bold">Rejection Reason:</span> {r.rejectionReason}
                  </div>
                )}
                {r.returnReason && (
                  <div className="text-[11px] text-purple-800 bg-purple-50 p-2 rounded-md border border-purple-100">
                    <span className="font-bold">Return Correction Notes:</span> {r.returnReason}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. TRANSACTIONS TAB */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Banking Payout Transactions</h3>
              <p className="text-xs text-slate-500">Core banking payment rail settlements, UTR tracking, and reversal logs.</p>
            </div>
            {canExecuteCurrent && (
              <button
                onClick={() => setShowPayoutModal(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs"
              >
                <ArrowUpRight className="w-3.5 h-3.5" /> Execute Payout
              </button>
            )}
          </div>

          {disbursement.transactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No banking transactions executed yet. Approve a disbursement request to initiate the payment.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {disbursement.transactions.map((txn) => (
                <div key={txn.id} className="p-4 hover:bg-slate-50/50 transition-colors space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{txn.transactionReference}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            txn.status === 'SUCCESSFUL'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : txn.status === 'FAILED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {txn.status}
                        </span>
                      </div>
                      {txn.utrNumber && (
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          UTR: <span className="font-bold text-slate-800">{txn.utrNumber}</span> • {txn.paymentMethod}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-mono font-bold text-base text-slate-900">
                          ₹{txn.amount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {new Date(txn.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {txn.status === 'SUCCESSFUL' && (
                        <button
                          onClick={() => {
                            setSelectedTxnForReversal(txn);
                            setShowReversalModal(true);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
                          title="Reverse Settlement Transaction"
                        >
                          Reverse
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Beneficiary Account:</span>
                      <span className="font-medium text-slate-900">{txn.beneficiaryName}</span> ({txn.beneficiaryAccountNumberMasked})
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">IFSC & Bank:</span>
                      <span className="font-mono text-slate-900">{txn.beneficiaryIfsc}</span> ({txn.bankName})
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">External Ref:</span>
                      <span className="font-mono text-slate-800">{txn.externalReference || 'N/A'}</span>
                    </div>
                  </div>

                  {txn.failureReason && (
                    <div className="text-[11px] text-rose-800 bg-rose-50 p-2 rounded-md border border-rose-100">
                      <span className="font-bold">Failure Cause:</span> {txn.failureReason}
                    </div>
                  )}

                  {txn.reversalReason && (
                    <div className="text-[11px] text-red-800 bg-red-50 p-2 rounded-md border border-red-100">
                      <span className="font-bold">Reversal Audit Reason:</span> {txn.reversalReason} (Reversed by {txn.reversedBy})
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. BENEFICIARIES TAB */}
      {activeTab === 'BENEFICIARIES' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Authorized Beneficiary Accounts</h3>
              <p className="text-xs text-slate-500">Verified bank accounts eligible to receive loan payout disbursements.</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {disbursement.beneficiaries.map((ben) => (
              <div key={ben.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{ben.beneficiaryName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {ben.beneficiaryType}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {ben.verificationStatus}
                    </span>
                  </div>
                  <div className="font-mono text-slate-500 text-[11px]">
                    {ben.bankName} • Account: <span className="font-bold text-slate-800">{ben.accountNumberMasked}</span> • IFSC: <span className="font-bold text-slate-800">{ben.ifscCode}</span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400">
                  Source: {ben.verificationSource || 'Direct Bank Mandate'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. AUDIT TAB */}
      {activeTab === 'AUDIT' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Immutable Disbursement Audit History</h3>
            <p className="text-xs text-slate-500">Chronological, tamper-proof record of all events, maker-checker signoffs, and payout transactions.</p>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {disbursement.history.map((h, i) => (
              <div key={h.id || i} className="relative text-xs">
                <div className="absolute -left-6 top-0.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-600" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="font-bold text-slate-900">{h.event.replace(/_/g, ' ')}</div>
                  <span className="text-[10px] font-mono text-slate-400">{new Date(h.timestamp).toLocaleString()}</span>
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Actor: <span className="font-semibold text-slate-800">{h.actorName}</span> ({h.actorRole})
                </div>
                {h.notes && <p className="mt-1 text-slate-700 text-[11px] bg-slate-50 p-2 rounded-md border border-slate-100">{h.notes}</p>}
                {h.reference && <span className="text-[10px] font-mono text-slate-500 block mt-0.5">Ref: {h.reference}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}
      {showApprovalModal && latestReq && (
        <DisbursementApprovalModal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          disbursement={disbursement}
          request={latestReq}
          currentUser={currentUser}
          onApprove={handleApprove}
          onReject={handleReject}
          onReturn={handleReturn}
        />
      )}

      {showPayoutModal && latestReq && (
        <DisbursementTransactionModal
          isOpen={showPayoutModal}
          onClose={() => setShowPayoutModal(false)}
          disbursement={disbursement}
          request={latestReq}
          onExecuteTransaction={handleExecutePayout}
        />
      )}

      {showReversalModal && selectedTxnForReversal && (
        <DisbursementReversalModal
          isOpen={showReversalModal}
          onClose={() => {
            setShowReversalModal(false);
            setSelectedTxnForReversal(null);
          }}
          transaction={selectedTxnForReversal}
          onReverse={handleReversePayout}
        />
      )}

      {showCreateModal && (
        <DisbursementCreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          sanctions={store.sanctions || []}
          disbursements={store.disbursements || []}
          onCreateRequest={handleCreateNewRequest}
        />
      )}
    </div>
  );
};
