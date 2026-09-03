import React, { useState } from 'react';
import { DisbursementRecord } from '../../types/disbursementTypes';
import { DisbursementsQueueView } from '../disbursements/DisbursementsQueueView';
import { DisbursementWorkspaceView } from '../disbursements/DisbursementWorkspaceView';
import { useAuth } from '../../services/authContext';
import { useMockStore } from '../../services/mockService';

interface DisbursementsViewProps {
  onNavigate?: (moduleName: string) => void;
  initialDisbursementId?: string;
}

export const DisbursementsView: React.FC<DisbursementsViewProps> = ({
  onNavigate,
  initialDisbursementId,
}) => {
  const store = useMockStore();
  const { user, hasPermission } = useAuth();
  const [selectedDisbursementId, setSelectedDisbursementId] = useState<string | null>(
    initialDisbursementId || null
  );

  const currentUser = {
    name: user?.name || 'Operations Officer',
    id: user?.id || 'usr_ops_01',
    roleName: (user as any)?.roleName || (user as any)?.role || 'Disbursement Authority',
  };

  const canCreateRequest = hasPermission('DISBURSEMENT:EXECUTE') || hasPermission('view_loans') || hasPermission('perm_disb_view');
  const canApproveDisbursement = hasPermission('DISBURSEMENT:EXECUTE') || hasPermission('action_approvals') || hasPermission('perm_appr_action');
  const canExecuteDisbursement = hasPermission('DISBURSEMENT:EXECUTE') || hasPermission('perm_disb_execute') || hasPermission('execute_disbursement');

  if (selectedDisbursementId) {
    return (
      <DisbursementWorkspaceView
        disbursementId={selectedDisbursementId}
        onBack={() => setSelectedDisbursementId(null)}
        onNavigateModule={onNavigate}
        currentUser={currentUser}
        store={store}
        canCreateRequest={canCreateRequest}
        canApproveDisbursement={canApproveDisbursement}
        canExecuteDisbursement={canExecuteDisbursement}
      />
    );
  }

  return (
    <DisbursementsQueueView
      onSelectDisbursement={(dsb) => setSelectedDisbursementId(dsb.id)}
      onNavigateModule={onNavigate}
    />
  );
};
