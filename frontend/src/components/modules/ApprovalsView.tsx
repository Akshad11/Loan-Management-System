import React, { useState, useMemo } from 'react';
import { useMockLMSStore } from '../../services/mockService';
import { useAuth } from '../../services/authContext';
import {
  ApprovalRecord,
  ApprovalDecisionType,
  ApprovalCondition,
  ApprovalException,
  ConditionStatus,
} from '../../types/approvalTypes';
import { ApprovalsQueueView } from '../approvals/ApprovalsQueueView';
import { ApprovalWorkspaceView } from '../approvals/ApprovalWorkspaceView';

interface ApprovalsViewProps {
  initialApprovalId?: string;
  onNavigateToCreditAssessment?: (caId: string) => void;
  onNavigateToApplication?: (appId: string) => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  initialApprovalId,
  onNavigateToCreditAssessment,
  onNavigateToApplication,
}) => {
  const store = useMockLMSStore();
  const { user } = useAuth();

  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(
    initialApprovalId || null
  );

  const activeApproval = selectedApprovalId
    ? store.getApprovalById(selectedApprovalId)
    : null;

  // Mock approvers list from system users
  const approversList = useMemo(() => {
    return (store.users || [])
      .filter((u) => u.status === 'ACTIVE')
      .map((u) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        role: u.roleName || 'Credit Approver',
        branchId: u.branchId,
      }));
  }, [store.users]);

  const currentUserData = useMemo(() => {
    return {
      name: user?.name || 'Alex Morgan',
      role: (user as any)?.roleName || (user as any)?.role || 'Branch Credit Manager',
    };
  }, [user]);

  if (activeApproval) {
    return (
      <div className="p-0 sm:p-2 max-w-7xl mx-auto">
        <ApprovalWorkspaceView
          approval={activeApproval}
          approvers={approversList}
          onBack={() => setSelectedApprovalId(null)}
          onAssignApproval={(apprId, approverId, approverName, notes) =>
            store.assignApproval(apprId, approverId, approverName, notes, currentUserData.name)
          }
          onStartReview={(apprId) =>
            store.startApprovalReview(apprId, currentUserData.name)
          }
          onMakeDecision={(apprId, data) =>
            store.makeApprovalDecision(
              apprId,
              data,
              currentUserData.name,
              currentUserData.role
            )
          }
          onAddCondition={(apprId, condition) =>
            store.addApprovalCondition(apprId, condition, currentUserData.name)
          }
          onUpdateConditionStatus={(condId, status, resolutionNotes, waiverReason) =>
            store.updateApprovalConditionStatus(
              activeApproval.id,
              condId,
              status,
              resolutionNotes,
              waiverReason,
              currentUserData.name
            )
          }
          onDeleteCondition={(condId) =>
            store.deleteApprovalCondition(activeApproval.id, condId, currentUserData.name)
          }
          onAddException={(apprId, exception) =>
            store.addApprovalException(apprId, exception, currentUserData.name)
          }
          onRouteException={(excId, routedToRole) =>
            store.routeApprovalException(
              activeApproval.id,
              excId,
              routedToRole,
              currentUserData.name
            )
          }
          onResolveException={(excId, status, decisionNotes) =>
            store.resolveApprovalException(
              activeApproval.id,
              excId,
              status,
              decisionNotes,
              currentUserData.name
            )
          }
          onNavigateToCreditAssessment={onNavigateToCreditAssessment}
          onNavigateToApplication={onNavigateToApplication}
          currentUser={currentUserData}
        />
      </div>
    );
  }

  return (
    <div className="p-0 sm:p-2 max-w-7xl mx-auto">
      <ApprovalsQueueView
        onSelectApproval={(id) => setSelectedApprovalId(id)}
        onNavigateToCreditAssessment={onNavigateToCreditAssessment}
        onNavigateToApplication={onNavigateToApplication}
      />
    </div>
  );
};
