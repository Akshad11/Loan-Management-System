import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { systemApi } from '../../services/apiClient';
import { BranchFilters } from '../branches/BranchFilters';
import { BranchTable } from '../branches/BranchTable';
import { BranchFormModal } from '../branches/BranchFormModal';
import { BranchDetailsDrawer } from '../branches/BranchDetailsDrawer';
import { BranchDeactivateModal } from '../branches/BranchDeactivateModal';
import { BranchReactivateModal } from '../branches/BranchReactivateModal';
import { Branch, LMSUser, BranchFilterState } from '../../types';
import { formatCompactCurrency } from '../../utils/formatters';
import { Building, Plus, Landmark, Users, CheckCircle2, RotateCcw, AlertCircle, Check } from 'lucide-react';

interface BranchesViewProps {
  onViewUser?: (user: LMSUser) => void;
}

export const BranchesView: React.FC<BranchesViewProps> = ({ onViewUser }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<LMSUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [filters, setFilters] = useState<BranchFilterState>({
    search: '',
    status: '',
    state: '',
    city: '',
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [branchToEdit, setBranchToEdit] = useState<Branch | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [branchToDeactivate, setBranchToDeactivate] = useState<Branch | null>(null);
  const [branchToReactivate, setBranchToReactivate] = useState<Branch | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [branchesData, usersData, auditData] = await Promise.all([
        systemApi.getBranches(),
        systemApi.getUsers(),
        systemApi.getAuditLogs({ entityType: 'BRANCH' }).catch(() => []),
      ]);
      setBranches(branchesData || []);
      setUsers(usersData || []);
      setAuditLogs(auditData || []);
    } catch (err: any) {
      console.error('Failed to load branches:', err);
      setError(err.message || 'Failed to load branch records from database');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Extract unique states & cities for filter dropdowns
  const availableStates = useMemo(() => {
    return Array.from(new Set(branches.map((b) => b.state).filter(Boolean))).sort();
  }, [branches]);

  const availableCities = useMemo(() => {
    const subset = filters.state ? branches.filter((b) => b.state === filters.state) : branches;
    return Array.from(new Set(subset.map((b) => b.city).filter(Boolean))).sort();
  }, [branches, filters.state]);

  const filteredBranches = useMemo(() => {
    return branches.filter((b) => {
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        const matches =
          (b.name && b.name.toLowerCase().includes(q)) ||
          (b.code && b.code.toLowerCase().includes(q)) ||
          (b.city && b.city.toLowerCase().includes(q)) ||
          (b.state && b.state.toLowerCase().includes(q)) ||
          (b.managerName && b.managerName.toLowerCase().includes(q));
        if (!matches) return false;
      }
      if (filters.status && b.status !== filters.status) return false;
      if (filters.state && b.state !== filters.state) return false;
      if (filters.city && b.city !== filters.city) return false;
      return true;
    });
  }, [branches, filters]);

  // Aggregate metrics
  const totalPortfolio = branches.reduce((acc, b) => acc + Number(b.totalPortfolioValue || 0), 0);
  const activeCount = branches.filter((b) => b.status === 'ACTIVE').length;
  const totalLoans = branches.reduce((acc, b) => acc + (b.activeLoanCount || 0), 0);

  const handleSaveBranch = async (branchData: any) => {
    try {
      setError(null);
      if (branchToEdit) {
        await systemApi.updateBranch(branchToEdit.id, { id: branchToEdit.id, ...branchData });
        setSuccessMessage(`Branch "${branchData.name || branchToEdit.name}" updated successfully.`);
        if (selectedBranch?.id === branchToEdit.id) {
          setSelectedBranch({ ...selectedBranch, ...branchData });
        }
        setBranchToEdit(null);
      } else {
        await systemApi.createBranch(branchData);
        setSuccessMessage(`Branch "${branchData.name}" registered successfully.`);
        setIsCreateModalOpen(false);
      }
      await loadData();
    } catch (err: any) {
      console.error('Failed to save branch:', err);
      setError(err.message || 'Failed to save branch to database.');
    }
  };

  const handleDeactivateBranch = async (branchId: string, reason?: string) => {
    try {
      setError(null);
      await systemApi.updateBranch(branchId, { id: branchId, status: 'INACTIVE', reason });
      setSuccessMessage('Branch deactivated successfully.');
      setBranchToDeactivate(null);
      if (selectedBranch?.id === branchId) {
        setSelectedBranch(null);
      }
      await loadData();
    } catch (err: any) {
      console.error('Failed to deactivate branch:', err);
      setError(err.message || 'Failed to deactivate branch.');
    }
  };

  const handleReactivateBranch = async (branchId: string, reason?: string) => {
    try {
      setError(null);
      await systemApi.updateBranch(branchId, { id: branchId, status: 'ACTIVE', reason });
      setSuccessMessage('Branch reactivated successfully.');
      setBranchToReactivate(null);
      if (selectedBranch?.id === branchId) {
        setSelectedBranch(null);
      }
      await loadData();
    } catch (err: any) {
      console.error('Failed to reactivate branch:', err);
      setError(err.message || 'Failed to reactivate branch.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Branch Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage operational branch locations, manager designations, and regional portfolio boundaries in database.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-none shrink-0"
            title="Reload from Database"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            id="create-new-branch-btn"
            onClick={() => {
              setBranchToEdit(null);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 border border-slate-900 rounded hover:bg-slate-800 transition-colors shadow-none shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Branch</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between text-xs text-rose-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-700 hover:text-rose-900 font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded text-slate-800">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Total Branch Network</span>
            <span className="text-lg font-bold text-slate-900 leading-tight block">{branches.length} branches</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded text-emerald-800">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Active Operational</span>
            <span className="text-lg font-bold text-emerald-900 leading-tight block">{activeCount} active</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded text-slate-700">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Network Portfolio</span>
            <span className="text-lg font-bold text-slate-900 leading-tight block">
              {formatCompactCurrency(totalPortfolio)}
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded text-slate-700">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Active Loan Accounts</span>
            <span className="text-lg font-bold text-slate-900 leading-tight block">{totalLoans} loans</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <BranchFilters
        filters={filters}
        onFilterChange={setFilters}
        availableStates={availableStates}
        availableCities={availableCities}
      />

      {/* Branch Table */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-500 flex flex-col items-center justify-center">
          <RotateCcw className="w-6 h-6 animate-spin text-slate-400 mb-2" />
          <span className="text-xs font-medium">Loading branch directory from PostgreSQL...</span>
        </div>
      ) : (
        <BranchTable
          branches={filteredBranches}
          onViewBranch={(b) => setSelectedBranch(b)}
          onEditBranch={(b) => setBranchToEdit(b)}
          onDeactivateBranch={(b) => setBranchToDeactivate(b)}
          onReactivateBranch={(b) => setBranchToReactivate(b)}
        />
      )}

      {/* Create / Edit Modal */}
      {(isCreateModalOpen || branchToEdit) && (
        <BranchFormModal
          isOpen={isCreateModalOpen || !!branchToEdit}
          onClose={() => {
            setIsCreateModalOpen(false);
            setBranchToEdit(null);
          }}
          onSave={handleSaveBranch}
          branchToEdit={branchToEdit}
          existingBranches={branches}
          users={users}
        />
      )}

      {/* Branch Details Drawer */}
      {selectedBranch && (
        <BranchDetailsDrawer
          isOpen={!!selectedBranch}
          onClose={() => setSelectedBranch(null)}
          branch={branches.find((b) => b.id === selectedBranch.id) || selectedBranch}
          assignedUsers={users.filter((u) => u.branchId === selectedBranch.id && u.status === 'ACTIVE')}
          auditLogs={auditLogs}
          onEdit={(b) => {
            setSelectedBranch(null);
            setBranchToEdit(b);
          }}
          onDeactivate={(b) => {
            setSelectedBranch(null);
            setBranchToDeactivate(b);
          }}
          onReactivate={(b) => {
            setSelectedBranch(null);
            setBranchToReactivate(b);
          }}
          onViewUser={(u) => {
            setSelectedBranch(null);
            if (onViewUser) onViewUser(u);
          }}
        />
      )}

      {/* Deactivate Branch Modal */}
      {branchToDeactivate && (
        <BranchDeactivateModal
          isOpen={!!branchToDeactivate}
          onClose={() => setBranchToDeactivate(null)}
          branch={branchToDeactivate}
          onConfirm={handleDeactivateBranch}
        />
      )}

      {/* Reactivate Branch Modal */}
      {branchToReactivate && (
        <BranchReactivateModal
          isOpen={!!branchToReactivate}
          onClose={() => setBranchToReactivate(null)}
          branch={branchToReactivate}
          onConfirm={handleReactivateBranch}
        />
      )}
    </div>
  );
};
