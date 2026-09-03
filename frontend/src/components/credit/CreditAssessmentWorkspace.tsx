import React, { useState } from 'react';
import {
  CreditAssessmentRecord,
  CreditRecommendation,
  ConditionStatus,
  ObligationItem,
  AssessmentConditionItem,
} from '../../types/creditTypes';
import { LoanApplicationRecord, CustomerRecord, LMSUser } from '../../types';
import { CreditAssessmentHeader } from './CreditAssessmentHeader';
import { CreditAssessmentSummaryBanner } from './CreditAssessmentSummaryBanner';
import { ApplicantProfileTab } from './ApplicantProfileTab';
import { IncomeAssessmentTab } from './IncomeAssessmentTab';
import { ExistingObligationsTab } from './ExistingObligationsTab';
import { BankingIndicatorsTab } from './BankingIndicatorsTab';
import { CreditHistoryTab } from './CreditHistoryTab';
import { RiskIndicatorsTab } from './RiskIndicatorsTab';
import { DecisionRulesTab } from './DecisionRulesTab';
import { ConditionsTab } from './ConditionsTab';
import { DecisionPanelTab } from './DecisionPanelTab';
import { AssessmentTimelineTab } from './AssessmentTimelineTab';
import { AssignmentModal } from './AssignmentModal';
import { ReturnAssessmentModal } from './ReturnAssessmentModal';
import { VersionHistoryModal } from './VersionHistoryModal';
import {
  User,
  DollarSign,
  CreditCard,
  Landmark,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  FileCheck,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface CreditAssessmentWorkspaceProps {
  assessment: CreditAssessmentRecord;
  application?: LoanApplicationRecord;
  customer?: CustomerRecord;
  users: LMSUser[];
  onBack: () => void;
  onStartAssessment?: () => void;
  onAssignOfficer?: (officerId: string, officerName: string, notes: string) => void;
  onUpdateFinancials?: (updates: Partial<CreditAssessmentRecord>) => void;
  onAddObligation?: (obligation: Omit<ObligationItem, 'id' | 'assessmentId'>) => void;
  onDeleteObligation?: (obligationId: string) => void;
  onEvaluateRules?: () => void;
  onAddCondition?: (
    condition: Omit<
      AssessmentConditionItem,
      'id' | 'assessmentId' | 'addedBy' | 'addedAt' | 'status'
    >
  ) => void;
  onUpdateConditionStatus?: (
    conditionId: string,
    status: ConditionStatus,
    resolutionNotes: string
  ) => void;
  onDeleteCondition?: (conditionId: string) => void;
  onReturnAssessment?: (reason: string, requiredAction: string) => void;
  onSubmitRecommendation?: (data: {
    recommendation: CreditRecommendation;
    recommendedAmount: number;
    recommendedTenureMonths: number;
    recommendedInterestRate: number;
    recommendationNotes: string;
    underwriterNotes: string;
    changeReason?: string;
  }) => void;
  canEdit?: boolean;
}

export const CreditAssessmentWorkspace: React.FC<CreditAssessmentWorkspaceProps> = ({
  assessment,
  application,
  customer,
  users,
  onBack,
  onStartAssessment,
  onAssignOfficer,
  onUpdateFinancials,
  onAddObligation,
  onDeleteObligation,
  onEvaluateRules,
  onAddCondition,
  onUpdateConditionStatus,
  onDeleteCondition,
  onReturnAssessment,
  onSubmitRecommendation,
  canEdit = true,
}) => {
  const [activeTab, setActiveTab] = useState<string>('PROFILE');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showVersionHistoryModal, setShowVersionHistoryModal] = useState(false);

  const tabs = [
    { id: 'PROFILE', label: 'Applicant Profile', icon: User },
    { id: 'INCOME', label: 'Income Appraisal', icon: DollarSign },
    { id: 'OBLIGATIONS', label: `Obligations (${assessment.obligations?.length || 0})`, icon: CreditCard },
    { id: 'BANKING', label: 'Banking Health', icon: Landmark },
    { id: 'CREDIT_BUREAU', label: 'Credit Bureau', icon: ShieldCheck },
    { id: 'RULES', label: `Policy Rules (${assessment.rules?.length || 0})`, icon: Sliders },
    { id: 'CONDITIONS', label: `Conditions (${assessment.conditions?.length || 0})`, icon: FileCheck },
    { id: 'RISKS', label: `Risk Checklist (${assessment.riskIndicators?.length || 0})`, icon: ShieldAlert },
    { id: 'DECISION', label: 'Credit Decision', icon: CheckCircle, highlight: true },
    { id: 'TIMELINE', label: 'Audit History', icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky Header */}
      <CreditAssessmentHeader
        assessment={assessment}
        onBack={onBack}
        onStartAssessment={onStartAssessment}
        onEvaluateRules={onEvaluateRules}
        onOpenReturnModal={() => setShowReturnModal(true)}
        onOpenSubmitDecisionTab={() => setActiveTab('DECISION')}
        onOpenVersionHistory={() => setShowVersionHistoryModal(true)}
        onOpenAssignModal={() => setShowAssignModal(true)}
        canEdit={canEdit}
      />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Global Financial Indicator Banner */}
        <CreditAssessmentSummaryBanner assessment={assessment} />

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-1.5 overflow-x-auto">
          <nav className="flex space-x-1 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md transition-all ${
                    isActive
                      ? tab.highlight
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-900 text-white shadow-sm'
                      : tab.highlight
                      ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content Rendering */}
        <div>
          {activeTab === 'PROFILE' && (
            <ApplicantProfileTab
              assessment={assessment}
              application={application}
              customer={customer}
            />
          )}

          {activeTab === 'INCOME' && (
            <IncomeAssessmentTab
              assessment={assessment}
              onUpdateFinancials={onUpdateFinancials}
              canEdit={canEdit}
            />
          )}

          {activeTab === 'OBLIGATIONS' && (
            <ExistingObligationsTab
              assessment={assessment}
              onAddObligation={onAddObligation}
              onDeleteObligation={onDeleteObligation}
              canEdit={canEdit}
            />
          )}

          {activeTab === 'BANKING' && (
            <BankingIndicatorsTab assessment={assessment} />
          )}

          {activeTab === 'CREDIT_BUREAU' && (
            <CreditHistoryTab assessment={assessment} />
          )}

          {activeTab === 'RULES' && (
            <DecisionRulesTab
              assessment={assessment}
              onEvaluateRules={onEvaluateRules}
              canEdit={canEdit}
            />
          )}

          {activeTab === 'CONDITIONS' && (
            <ConditionsTab
              assessment={assessment}
              onAddCondition={onAddCondition}
              onUpdateConditionStatus={onUpdateConditionStatus}
              onDeleteCondition={onDeleteCondition}
              canEdit={canEdit}
            />
          )}

          {activeTab === 'RISKS' && (
            <RiskIndicatorsTab assessment={assessment} />
          )}

          {activeTab === 'DECISION' && (
            <DecisionPanelTab
              assessment={assessment}
              onSubmitRecommendation={onSubmitRecommendation}
              canEdit={canEdit}
            />
          )}

          {activeTab === 'TIMELINE' && (
            <AssessmentTimelineTab assessment={assessment} />
          )}
        </div>
      </div>

      {/* Modals */}
      {showAssignModal && onAssignOfficer && (
        <AssignmentModal
          assessment={assessment}
          users={users}
          onClose={() => setShowAssignModal(false)}
          onAssign={onAssignOfficer}
        />
      )}

      {showReturnModal && onReturnAssessment && (
        <ReturnAssessmentModal
          assessment={assessment}
          onClose={() => setShowReturnModal(false)}
          onConfirmReturn={onReturnAssessment}
        />
      )}

      {showVersionHistoryModal && (
        <VersionHistoryModal
          assessment={assessment}
          onClose={() => setShowVersionHistoryModal(false)}
        />
      )}
    </div>
  );
};
