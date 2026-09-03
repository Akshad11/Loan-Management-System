import React, { useState } from 'react';
import { SanctionRecord } from '../../types/sanctionTypes';
import { SanctionsQueueView } from '../sanctions/SanctionsQueueView';
import { SanctionWorkspaceView } from '../sanctions/SanctionWorkspaceView';
import { useAuth } from '../../services/authContext';
import { useMockStore } from '../../services/mockService';

interface SanctionsViewProps {
  onNavigate?: (moduleName: string) => void;
  initialSanctionId?: string;
}

export const SanctionsView: React.FC<SanctionsViewProps> = ({
  onNavigate,
  initialSanctionId,
}) => {
  const store = useMockStore();
  const { user, hasPermission } = useAuth();
  const [selectedSanctionId, setSelectedSanctionId] = useState<string | null>(initialSanctionId || null);

  const currentUser = {
    name: user?.name || 'Authorized Officer',
    id: user?.id || 'usr_sanction_auth',
    roleName: (user as any)?.roleName || (user as any)?.role || 'Sanction Authority',
  };

  const canEditSanctionTerms = hasPermission('SANCTIONS:EDIT_TERMS') || hasPermission('SANCTIONS:FULL_ACCESS');
  const canConfirmSanction = hasPermission('SANCTIONS:APPROVE') || hasPermission('SANCTIONS:FULL_ACCESS');
  const canManageConditions = hasPermission('SANCTIONS:MANAGE_CONDITIONS') || hasPermission('SANCTIONS:FULL_ACCESS');
  const canGenerateSanctionLetter = hasPermission('SANCTIONS:GENERATE_LETTER') || hasPermission('SANCTIONS:FULL_ACCESS');
  const canIssueSanctionLetter = hasPermission('SANCTIONS:ISSUE_LETTER') || hasPermission('SANCTIONS:FULL_ACCESS');

  if (selectedSanctionId) {
    return (
      <SanctionWorkspaceView
        sanctionId={selectedSanctionId}
        onBack={() => setSelectedSanctionId(null)}
        onNavigateModule={onNavigate}
        currentUser={currentUser}
        canEditSanctionTerms={canEditSanctionTerms}
        canConfirmSanction={canConfirmSanction}
        canManageConditions={canManageConditions}
        canGenerateSanctionLetter={canGenerateSanctionLetter}
        canIssueSanctionLetter={canIssueSanctionLetter}
      />
    );
  }

  return (
    <SanctionsQueueView
      onSelectSanction={(sanction) => setSelectedSanctionId(sanction.id)}
      onNavigateModule={onNavigate}
    />
  );
};
