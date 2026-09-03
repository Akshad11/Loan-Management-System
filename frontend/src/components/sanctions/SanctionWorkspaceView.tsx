import React, { useState } from 'react';
import { SanctionRecord, SanctionTerms, SanctionConditionCategory } from '../../types/sanctionTypes';
import { ConditionStatus, ConditionCategory } from '../../types';
import { SanctionHeader } from './SanctionHeader';
import { SanctionTermsTab } from './SanctionTermsTab';
import { SanctionConditionsTab } from './SanctionConditionsTab';
import { SanctionLetterTab } from './SanctionLetterTab';
import { SanctionReadinessTab } from './SanctionReadinessTab';
import { SanctionHistoryTab } from './SanctionHistoryTab';
import { SanctionTermsModal } from './SanctionTermsModal';
import { SanctionConditionModal } from './SanctionConditionModal';
import { SanctionLetterModal } from './SanctionLetterModal';
import { SanctionConfirmationModal } from './SanctionConfirmationModal';
import { SanctionReturnModal } from './SanctionReturnModal';
import { ConfirmationDialog } from '../shared/ConfirmationDialog';
import { useMockStore } from '../../services/mockService';
import {
  FileText,
  Layers,
  FileCheck,
  CheckCircle2,
  History,
  ShieldCheck,
  Landmark,
} from 'lucide-react';

interface SanctionWorkspaceViewProps {
  sanctionId: string;
  onBack: () => void;
  onNavigateModule?: (moduleName: string) => void;
  currentUser: { name: string; id: string; roleName: string };
  canEditSanctionTerms: boolean;
  canConfirmSanction: boolean;
  canManageConditions: boolean;
  canGenerateSanctionLetter: boolean;
  canIssueSanctionLetter: boolean;
}

export type SanctionTabId = 'terms' | 'conditions' | 'letter' | 'readiness' | 'history';

export const SanctionWorkspaceView: React.FC<SanctionWorkspaceViewProps> = ({
  sanctionId,
  onBack,
  onNavigateModule,
  currentUser,
  canEditSanctionTerms,
  canConfirmSanction,
  canManageConditions,
  canGenerateSanctionLetter,
  canIssueSanctionLetter,
}) => {
  const store = useMockStore();
  const [activeTab, setActiveTab] = useState<SanctionTabId>('terms');

  // Modals state
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const sanction = store.getSanctionById(sanctionId);

  if (!sanction) {
    return (
      <div className="p-8 text-center bg-white rounded-lg border border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900">Sanction Record Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">The requested sanction profile does not exist or has been archived.</p>
        <button
          onClick={onBack}
          className="mt-4 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300"
        >
          Return to Queue
        </button>
      </div>
    );
  }

  // Pre-requisites & Readiness calculation
  const prerequisites = store.validateSanctionPrerequisites(sanction.id);
  const readinessResult = store.getPreDisbursementReadiness(sanction.id);

  // Actions
  const handleSaveTerms = (updatedTerms: Partial<SanctionTerms>, reason: string) => {
    store.updateSanctionTerms(sanction.id, updatedTerms, reason, currentUser.name, currentUser.roleName);
  };

  const handleAddCondition = (condData: {
    category: SanctionConditionCategory;
    description: string;
    requiredBefore: 'SANCTION' | 'DISBURSEMENT' | 'POST_DISBURSEMENT';
    dueDate?: string;
    owner?: string;
  }) => {
    store.addSanctionCondition(
      sanction.id,
      {
        ...condData,
        owner: condData.owner || 'Loan Operations',
        addedBy: currentUser.name,
        source: 'SANCTION',
      },
      currentUser.name,
      currentUser.roleName
    );
  };

  const handleUpdateConditionStatus = (
    conditionId: string,
    status: ConditionStatus,
    resolutionNotes?: string,
    waiverReason?: string
  ) => {
    if (status === 'WAIVED') {
      store.waiveSanctionCondition(sanction.id, conditionId, waiverReason || 'Waived by credit authority.', currentUser.name, currentUser.roleName);
    } else {
      store.updateSanctionConditionStatus(sanction.id, conditionId, status, resolutionNotes, currentUser.name, currentUser.roleName);
    }
  };

  const handleDeleteCondition = (conditionId: string) => {
    store.deleteSanctionCondition(sanction.id, conditionId, currentUser.name, currentUser.roleName);
  };

  const handleGenerateLetter = (options: { templateId?: string; customNotes?: string; reasonForRegeneration?: string }) => {
    store.generateSanctionLetter(sanction.id, options, undefined, currentUser.name, currentUser.roleName);
  };

  const handleIssueLetter = (letterId: string) => {
    store.issueSanctionLetter(sanction.id, letterId, currentUser.name, currentUser.roleName);
  };

  const handleConfirmSanction = (notes: string) => {
    store.confirmSanction(sanction.id, notes, currentUser.name, currentUser.roleName);
  };

  const handleReturnSanction = (reason: string) => {
    store.returnSanction(sanction.id, reason, reason, currentUser.name, currentUser.roleName);
  };

  const handleCancelSanction = () => {
    store.cancelSanction(sanction.id, 'Cancelled from workspace by user.', currentUser.name, currentUser.roleName);
    setShowCancelDialog(false);
  };

  const tabs: { id: SanctionTabId; label: string; icon: React.ReactNode; count?: number; badgeColor?: string }[] = [
    {
      id: 'terms',
      label: 'Facility & Terms',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'conditions',
      label: 'Covenants & Conditions',
      icon: <Layers className="w-4 h-4" />,
      count: sanction.conditions.length,
    },
    {
      id: 'letter',
      label: 'Sanction Letter',
      icon: <FileCheck className="w-4 h-4" />,
      count: sanction.letters.length,
    },
    {
      id: 'readiness',
      label: 'Pre-Disbursement Readiness',
      icon: <CheckCircle2 className="w-4 h-4" />,
      badgeColor: readinessResult.isDisbursementReady ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
    },
    {
      id: 'history',
      label: 'Audit & History',
      icon: <History className="w-4 h-4" />,
      count: (sanction.history || []).length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Dossier Header */}
      <SanctionHeader
        sanction={sanction}
        onBack={onBack}
        onOpenTermsModal={() => setShowTermsModal(true)}
        onOpenConfirmModal={() => setShowConfirmModal(true)}
        onOpenLetterModal={() => setShowLetterModal(true)}
        onOpenReturnModal={() => setShowReturnModal(true)}
        onOpenCancelModal={() => setShowCancelDialog(true)}
        currentUser={currentUser}
        canEditSanctionTerms={canEditSanctionTerms}
        canConfirmSanction={canConfirmSanction}
        canGenerateSanctionLetter={canGenerateSanctionLetter}
      />

      {/* Real Disbursement Integration Card */}
      {(() => {
        const dsb = store.getDisbursementBySanctionId(sanction.id);
        const totalDisbursed = dsb ? dsb.totalDisbursedAmount : 0;
        const remaining = dsb ? dsb.remainingAmount : sanction.approvedAmount;
        const dsbStatus = dsb ? (dsb.remainingAmount === 0 ? 'Fully Disbursed' : dsb.totalDisbursedAmount > 0 ? 'Partially Disbursed' : dsb.status) : 'Not Disbursed';

        return (
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Disbursement Payout Status
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {dsbStatus}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs">
                  <div>
                    <span className="text-slate-500">Sanction: </span>
                    <span className="font-mono font-bold text-slate-900">₹{sanction.approvedAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Disbursed: </span>
                    <span className="font-mono font-bold text-emerald-700">₹{totalDisbursed.toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Remaining Available: </span>
                    <span className="font-mono font-bold text-blue-700">₹{remaining.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {onNavigateModule && (
              <button
                onClick={() => onNavigateModule('disbursements')}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Landmark className="w-3.5 h-3.5" />
                {dsb ? 'View Disbursements' : 'Initiate Disbursement'}
              </button>
            )}
          </div>
        );
      })()}

      {/* Tabs Navigation */}
      <div className="bg-white border border-slate-200 rounded-lg p-1.5 shadow-xs flex flex-wrap items-center gap-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === tab.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            )}
            {tab.id === 'readiness' && (
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  tab.badgeColor || 'bg-slate-100 text-slate-700'
                }`}
              >
                {readinessResult.overallStatus}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <div className="mt-4">
        {activeTab === 'terms' && (
          <SanctionTermsTab
            sanction={sanction}
            onOpenEditModal={() => setShowTermsModal(true)}
            canEditTerms={canEditSanctionTerms}
          />
        )}

        {activeTab === 'conditions' && (
          <SanctionConditionsTab
            sanction={sanction}
            onAddCondition={() => setShowConditionModal(true)}
            onUpdateConditionStatus={handleUpdateConditionStatus}
            onDeleteCondition={handleDeleteCondition}
            canManageConditions={canManageConditions}
          />
        )}

        {activeTab === 'letter' && (
          <SanctionLetterTab
            sanction={sanction}
            onOpenGenerateModal={() => setShowLetterModal(true)}
            onIssueLetter={handleIssueLetter}
            canGenerateLetter={canGenerateSanctionLetter}
            canIssueLetter={canIssueSanctionLetter}
          />
        )}

        {activeTab === 'readiness' && (
          <SanctionReadinessTab
            sanction={sanction}
            readinessResult={readinessResult}
            onNavigateModule={onNavigateModule}
          />
        )}

        {activeTab === 'history' && <SanctionHistoryTab sanction={sanction} />}
      </div>

      {/* Modals */}
      <SanctionTermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        sanction={sanction}
        onSaveTerms={handleSaveTerms}
      />

      <SanctionConditionModal
        isOpen={showConditionModal}
        onClose={() => setShowConditionModal(false)}
        onAddCondition={handleAddCondition}
      />

      <SanctionLetterModal
        isOpen={showLetterModal}
        onClose={() => setShowLetterModal(false)}
        sanction={sanction}
        onGenerateLetter={handleGenerateLetter}
      />

      <SanctionConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        sanction={sanction}
        currentUser={currentUser}
        onConfirm={handleConfirmSanction}
        prerequisites={prerequisites}
      />

      <SanctionReturnModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        sanction={sanction}
        onReturn={handleReturnSanction}
      />

      <ConfirmationDialog
        isOpen={showCancelDialog}
        title="Cancel Sanction Dossier"
        description={`Are you sure you want to cancel sanction record ${sanction.sanctionNumber}? This will revoke any active sanction letters and cannot be undone.`}
        confirmLabel="Cancel Sanction"
        variant="danger"
        onConfirm={handleCancelSanction}
        onClose={() => setShowCancelDialog(false)}
      />
    </div>
  );
};
