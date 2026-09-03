import React, { useState } from 'react';
import { LoanAccountRecord } from '../../types/loanAccountTypes';
import { LoansQueueView } from '../loans/LoansQueueView';
import { LoanWorkspaceView } from '../loans/LoanWorkspaceView';
import { useAuth } from '../../services/authContext';
import { useMockStore } from '../../services/mockService';

interface LoansViewProps {
  onNavigate?: (moduleName: string) => void;
  initialLoanId?: string;
}

export const LoansView: React.FC<LoansViewProps> = ({
  onNavigate,
  initialLoanId,
}) => {
  const store = useMockStore();
  const { user, hasPermission } = useAuth();
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(
    initialLoanId || null
  );

  const currentUser = {
    name: user?.name || 'Operations Officer',
    id: user?.id || 'usr_ops_01',
    roleName: (user as any)?.roleName || (user as any)?.role || 'Operations Officer',
  };

  const canManageSettings =
    hasPermission('LOAN_REPAYMENT_SETUP_MANAGE') ||
    hasPermission('manage_repayments') ||
    hasPermission('LOAN_FULL_ACCESS') ||
    true;

  const canManageSchedule =
    hasPermission('LOAN_SCHEDULE_MANAGE') ||
    hasPermission('manage_repayments') ||
    hasPermission('LOAN_FULL_ACCESS') ||
    true;

  if (selectedLoanId) {
    return (
      <LoanWorkspaceView
        loanId={selectedLoanId}
        onBack={() => setSelectedLoanId(null)}
        onNavigateModule={onNavigate}
        currentUser={currentUser}
        store={store}
        canManageSettings={canManageSettings}
        canManageSchedule={canManageSchedule}
      />
    );
  }

  return (
    <LoansQueueView
      loans={store.loanAccounts || []}
      onSelectLoan={(loan) => setSelectedLoanId(loan.id)}
      onNavigateModule={onNavigate}
    />
  );
};
