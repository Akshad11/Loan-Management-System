import React, { useState } from 'react';
import { SanctionRecord } from '../../types/sanctionTypes';
import { SanctionKPIs } from './SanctionKPIs';
import { SanctionFilters } from './SanctionFilters';
import { SanctionTable } from './SanctionTable';
import { SanctionCreateModal } from './SanctionCreateModal';
import { SanctionConfirmationModal } from './SanctionConfirmationModal';
import { SanctionLetterModal } from './SanctionLetterModal';
import { useMockStore } from '../../services/mockService';
import { useAuth } from '../../services/authContext';

interface SanctionsQueueViewProps {
  onSelectSanction: (sanction: SanctionRecord) => void;
  onNavigateModule?: (moduleName: string) => void;
}

export const SanctionsQueueView: React.FC<SanctionsQueueViewProps> = ({
  onSelectSanction,
  onNavigateModule,
}) => {
  const store = useMockStore();
  const { user, hasPermission } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [productFilter, setProductFilter] = useState('ALL');
  const [deviationFilter, setDeviationFilter] = useState('ALL');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sanctionToConfirm, setSanctionToConfirm] = useState<SanctionRecord | null>(null);
  const [sanctionForLetter, setSanctionForLetter] = useState<SanctionRecord | null>(null);

  const currentUser = {
    name: user?.name || 'Sanction Authority Officer',
    id: user?.id || 'usr_sanction_auth',
    roleName: user?.roleTitle || (user as any)?.roleName || 'Sanction Authority',
  };

  // Permissions
  const canCreateSanction = hasPermission('SANCTIONS:CREATE') || hasPermission('SANCTIONS:FULL_ACCESS');
  const canConfirmSanction = hasPermission('SANCTIONS:APPROVE') || hasPermission('SANCTIONS:FULL_ACCESS');
  const canGenerateLetter = hasPermission('SANCTIONS:GENERATE_LETTER') || hasPermission('SANCTIONS:FULL_ACCESS');

  // Filtered Sanctions
  const filteredSanctions = store.sanctions.filter((s) => {
    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchBorrower = s.customerName.toLowerCase().includes(term);
      const matchSanctionNo = s.sanctionNumber.toLowerCase().includes(term);
      const matchAppNo = s.applicationNumber.toLowerCase().includes(term);
      const matchCustomerNo = s.customerNumber.toLowerCase().includes(term);
      if (!matchBorrower && !matchSanctionNo && !matchAppNo && !matchCustomerNo) return false;
    }

    // Status
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;

    // Branch
    if (branchFilter !== 'ALL' && s.branchId !== branchFilter) return false;

    // Product
    if (productFilter !== 'ALL' && s.productCode !== productFilter) return false;

    // Deviation
    if (deviationFilter === 'DEVIATED' && !s.terms.isDeviatedFromApproval) return false;
    if (deviationFilter === 'MATCHED' && s.terms.isDeviatedFromApproval) return false;

    return true;
  });

  // Approved applications available for drafting new sanction
  const approvedApplications = store.applications
    .filter((a) => a.status === 'APPROVED' || a.status === 'SANCTIONED')
    .map((app) => ({
      application: app,
      approval: store.approvals.find((ap) => ap.applicationId === app.id),
    }));

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setBranchFilter('ALL');
    setProductFilter('ALL');
    setDeviationFilter('ALL');
  };

  const handleCreateSanction = (data: {
    applicationId: string;
    approvalId: string;
    terms?: any;
    termDeviationReason?: string;
  }) => {
    const newSanction = store.createSanction({
      applicationId: data.applicationId,
      approvalId: data.approvalId,
      terms: data.terms,
      deviationReason: data.termDeviationReason,
      actorName: currentUser.name,
      actorRole: currentUser.roleName,
    });
    onSelectSanction(newSanction);
  };

  const handleConfirmSanctionAction = (notes: string) => {
    if (!sanctionToConfirm) return;
    store.confirmSanction(sanctionToConfirm.id, notes, currentUser.name, currentUser.roleName);
    setSanctionToConfirm(null);
  };

  const handleGenerateLetterAction = (options: {
    templateId?: string;
    customNotes?: string;
    reasonForRegeneration?: string;
  }) => {
    if (!sanctionForLetter) return;
    store.generateSanctionLetter(sanctionForLetter.id, options, currentUser.name, currentUser.roleName);
    setSanctionForLetter(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Sanction Management & Pre-Disbursement Readiness
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise sanction drafting, terms governance, official sanction letter issuance, and deterministic pre-disbursement verification.
          </p>
        </div>
      </div>

      {/* Executive KPIs */}
      <SanctionKPIs sanctions={store.sanctions} />

      {/* Filter Controls */}
      <SanctionFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        branchFilter={branchFilter}
        onBranchChange={setBranchFilter}
        productFilter={productFilter}
        onProductChange={setProductFilter}
        deviationFilter={deviationFilter}
        onDeviationChange={setDeviationFilter}
        branches={store.branches || []}
        products={(store.products || store.loanProductsConfig || []).map((p: any) => ({ code: p.code, name: p.name }))}
        onReset={handleResetFilters}
        canCreateSanction={canCreateSanction}
        onOpenCreateModal={() => setShowCreateModal(true)}
      />

      {/* Sanctions Table */}
      <SanctionTable
        sanctions={filteredSanctions}
        onSelectSanction={onSelectSanction}
        onOpenConfirmModal={(s) => setSanctionToConfirm(s)}
        onOpenLetterModal={(s) => setSanctionForLetter(s)}
        currentUser={currentUser}
        canConfirmSanction={canConfirmSanction}
      />

      {/* Create Sanction Modal */}
      <SanctionCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        approvedApplications={approvedApplications}
        onCreateSanction={handleCreateSanction}
      />

      {/* Quick Confirmation Modal */}
      {sanctionToConfirm && (
        <SanctionConfirmationModal
          isOpen={!!sanctionToConfirm}
          onClose={() => setSanctionToConfirm(null)}
          sanction={sanctionToConfirm}
          currentUser={currentUser}
          onConfirm={handleConfirmSanctionAction}
          prerequisites={store.validateSanctionPrerequisites(sanctionToConfirm.id, currentUser.name)}
        />
      )}

      {/* Quick Letter Modal */}
      {sanctionForLetter && (
        <SanctionLetterModal
          isOpen={!!sanctionForLetter}
          onClose={() => setSanctionForLetter(null)}
          sanction={sanctionForLetter}
          onGenerateLetter={handleGenerateLetterAction}
        />
      )}
    </div>
  );
};
