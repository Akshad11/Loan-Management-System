import React, { useState } from 'react';
import { DisbursementRecord, PaymentMethod } from '../../types/disbursementTypes';
import { DisbursementKPIs } from './DisbursementKPIs';
import { DisbursementFilters } from './DisbursementFilters';
import { DisbursementTable } from './DisbursementTable';
import { DisbursementCreateModal } from './DisbursementCreateModal';
import { DisbursementApprovalModal } from './DisbursementApprovalModal';
import { DisbursementTransactionModal } from './DisbursementTransactionModal';
import { useMockStore } from '../../services/mockService';
import { useAuth } from '../../services/authContext';

interface DisbursementsQueueViewProps {
  onSelectDisbursement: (disbursement: DisbursementRecord) => void;
  onNavigateModule?: (moduleName: string) => void;
}

export const DisbursementsQueueView: React.FC<DisbursementsQueueViewProps> = ({
  onSelectDisbursement,
  onNavigateModule,
}) => {
  const store = useMockStore();
  const { user, hasPermission } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [productFilter, setProductFilter] = useState('ALL');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [disbursementToApprove, setDisbursementToApprove] = useState<DisbursementRecord | null>(null);
  const [disbursementForPayout, setDisbursementForPayout] = useState<DisbursementRecord | null>(null);

  const currentUser = {
    name: user?.name || 'Operations Officer',
    id: user?.id || 'usr_ops_01',
    roleName: user?.roleTitle || (user as any)?.roleName || 'Disbursement Authority',
  };

  // Permissions
  const canCreateRequest = hasPermission('DISBURSEMENT:EXECUTE') || hasPermission('view_loans') || hasPermission('perm_disb_view');
  const canApproveDisbursement = hasPermission('DISBURSEMENT:EXECUTE') || hasPermission('action_approvals') || hasPermission('perm_appr_action');
  const canExecuteDisbursement = hasPermission('DISBURSEMENT:EXECUTE') || hasPermission('perm_disb_execute') || hasPermission('execute_disbursement');

  // Filtered list
  const filteredDisbursements = store.disbursements.filter((d) => {
    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchBorrower = d.customerName.toLowerCase().includes(term);
      const matchDsbNo = d.disbursementNumber.toLowerCase().includes(term);
      const matchSanctionNo = d.sanctionNumber.toLowerCase().includes(term);
      const matchAppNo = d.applicationNumber.toLowerCase().includes(term);
      const matchCustomerNo = d.customerNumber.toLowerCase().includes(term);
      if (!matchBorrower && !matchDsbNo && !matchSanctionNo && !matchAppNo && !matchCustomerNo) return false;
    }

    // Status
    const latestStatus = d.requests[0]?.status || d.status;
    if (statusFilter !== 'ALL' && latestStatus !== statusFilter) return false;

    // Branch
    if (branchFilter !== 'ALL' && d.branchId !== branchFilter) return false;

    // Product
    if (productFilter !== 'ALL' && d.productCode !== productFilter) return false;

    return true;
  });

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setBranchFilter('ALL');
    setProductFilter('ALL');
  };

  const handleCreateRequest = (data: any) => {
    store.createDisbursementRequest({
      ...data,
      actorName: currentUser.name,
      actorRole: currentUser.roleName,
      actorId: currentUser.id,
    });
  };

  const handleApproveAction = (notes: string) => {
    if (!disbursementToApprove) return;
    const req = disbursementToApprove.requests[0];
    if (!req) return;
    store.approveDisbursement(disbursementToApprove.id, req.id, currentUser.name, currentUser.roleName, notes);
    setDisbursementToApprove(null);
  };

  const handleRejectAction = (reason: string) => {
    if (!disbursementToApprove) return;
    const req = disbursementToApprove.requests[0];
    if (!req) return;
    store.rejectDisbursement(disbursementToApprove.id, req.id, currentUser.name, currentUser.roleName, reason);
    setDisbursementToApprove(null);
  };

  const handleReturnAction = (reason: string) => {
    if (!disbursementToApprove) return;
    const req = disbursementToApprove.requests[0];
    if (!req) return;
    store.returnDisbursement(disbursementToApprove.id, req.id, currentUser.name, currentUser.roleName, reason);
    setDisbursementToApprove(null);
  };

  const handleExecutePayoutAction = (data: {
    paymentMethod: PaymentMethod;
    utrNumber?: string;
    externalReference?: string;
    simulateFailure?: boolean;
    failureReason?: string;
  }) => {
    if (!disbursementForPayout) return;
    const req = disbursementForPayout.requests[0];
    if (!req) return;
    store.executeDisbursementTransaction(disbursementForPayout.id, req.id, data, currentUser.name, currentUser.roleName);
    setDisbursementForPayout(null);
  };

  const kpis = store.getDisbursementKPIs();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Disbursement Operations & Payment Rails
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real disbursement requests, multi-tranche balance management, pre-disbursement verification, maker-checker authorization, and banking transaction settlement.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <DisbursementKPIs kpis={kpis} />

      {/* Filters */}
      <DisbursementFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        branchFilter={branchFilter}
        onBranchChange={setBranchFilter}
        productFilter={productFilter}
        onProductChange={setProductFilter}
        branches={store.branches || []}
        products={(store.products || store.loanProductsConfig || []).map((p: any) => ({ code: p.code, name: p.name }))}
        onReset={handleResetFilters}
        canCreateRequest={canCreateRequest}
        onOpenCreateModal={() => setShowCreateModal(true)}
      />

      {/* Table */}
      <DisbursementTable
        disbursements={filteredDisbursements}
        onSelectDisbursement={onSelectDisbursement}
        onOpenApproveModal={(d) => setDisbursementToApprove(d)}
        onOpenPayoutModal={(d) => setDisbursementForPayout(d)}
        currentUser={currentUser}
        canApproveDisbursement={canApproveDisbursement}
        canExecuteDisbursement={canExecuteDisbursement}
      />

      {/* Modals */}
      {showCreateModal && (
        <DisbursementCreateModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          sanctions={store.sanctions || []}
          disbursements={store.disbursements || []}
          onCreateRequest={handleCreateRequest}
        />
      )}

      {disbursementToApprove && disbursementToApprove.requests[0] && (
        <DisbursementApprovalModal
          isOpen={!!disbursementToApprove}
          onClose={() => setDisbursementToApprove(null)}
          disbursement={disbursementToApprove}
          request={disbursementToApprove.requests[0]}
          currentUser={currentUser}
          onApprove={handleApproveAction}
          onReject={handleRejectAction}
          onReturn={handleReturnAction}
        />
      )}

      {disbursementForPayout && disbursementForPayout.requests[0] && (
        <DisbursementTransactionModal
          isOpen={!!disbursementForPayout}
          onClose={() => setDisbursementForPayout(null)}
          disbursement={disbursementForPayout}
          request={disbursementForPayout.requests[0]}
          onExecuteTransaction={handleExecutePayoutAction}
        />
      )}
    </div>
  );
};
