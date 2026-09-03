import React, { useState, useMemo } from 'react';
import { useMockLMSStore } from '../../services/mockService';
import { RoleTable } from '../roles/RoleTable';
import { RoleFormModal } from '../roles/RoleFormModal';
import { RoleDetailsDrawer } from '../roles/RoleDetailsDrawer';
import { RoleImpactModal } from '../roles/RoleImpactModal';
import { RoleSafetyModal } from '../roles/RoleSafetyModal';
import { Role, LMSUser } from '../../types';
import { PERMISSION_CATALOG } from '../../data/permissions';
import { Shield, ShieldPlus, KeyRound, Search, X, CheckCircle2 } from 'lucide-react';

interface RolesViewProps {
  onViewUser?: (user: LMSUser) => void;
}

export const RolesView: React.FC<RolesViewProps> = ({ onViewUser }) => {
  const {
    roles,
    users,
    auditLogs,
    createRole,
    updateRole,
    deactivateRole,
    reactivateRole,
  } = useMockLMSStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState<Role | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [pendingRoleUpdate, setPendingRoleUpdate] = useState<{
    role: Role;
    data: any;
  } | null>(null);
  const [safetyModalRole, setSafetyModalRole] = useState<string | null>(null);

  const filteredRoles = useMemo(() => {
    return roles.filter((r) => {
      if (search) {
        const q = search.toLowerCase().trim();
        const matches =
          r.name.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (statusFilter && r.status !== statusFilter) return false;
      return true;
    });
  }, [roles, search, statusFilter]);

  const handleSaveRole = (roleData: any) => {
    if (roleToEdit) {
      // If role has active users, show impact confirmation
      if (roleToEdit.userCount > 0) {
        setPendingRoleUpdate({ role: roleToEdit, data: roleData });
        setRoleToEdit(null);
      } else {
        updateRole(roleToEdit.id, roleData);
        setRoleToEdit(null);
      }
    } else {
      createRole(roleData);
    }
  };

  const handleConfirmImpactUpdate = (reason: string) => {
    if (!pendingRoleUpdate) return;
    updateRole(pendingRoleUpdate.role.id, pendingRoleUpdate.data, reason);
    if (selectedRole?.id === pendingRoleUpdate.role.id) {
      setSelectedRole({ ...selectedRole, ...pendingRoleUpdate.data });
    }
    setPendingRoleUpdate(null);
  };

  const handleDeactivate = (role: Role) => {
    if (role.isSystemProtected) {
      setSafetyModalRole(role.name);
      return;
    }
    deactivateRole(role.id, 'Administrative role deactivation');
  };

  return (
    <div className="space-y-5">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Role & Permission Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure role definitions, operational matrices, and segregation-of-duties access policies.
          </p>
        </div>

        <button
          type="button"
          id="create-new-role-btn"
          onClick={() => {
            setRoleToEdit(null);
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 border border-slate-900 rounded hover:bg-slate-800 transition-colors shadow-none shrink-0"
        >
          <ShieldPlus className="w-4 h-4" />
          <span>Create New System Role</span>
        </button>
      </div>

      {/* KPI Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded text-slate-800">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Configured System Roles</span>
            <span className="text-lg font-bold text-slate-900 leading-tight block">{roles.length} roles</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded text-emerald-800">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Active Roles in Production</span>
            <span className="text-lg font-bold text-emerald-900 leading-tight block">
              {roles.filter((r) => r.status === 'ACTIVE').length} active
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded text-slate-700">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Granular Permission Catalog</span>
            <span className="text-lg font-bold text-slate-900 leading-tight block">
              {PERMISSION_CATALOG.length} permissions
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            id="role-search-input"
            name="role-search-input"
            type="text"
            placeholder="Search roles by title, code (e.g. LOAN_OFFICER), or responsibility keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-slate-800 focus:outline-none transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <select
          id="role-filter-status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-white border border-slate-300 rounded px-2.5 py-2 text-slate-800 focus:outline-none focus:border-slate-800 shrink-0"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>
      </div>

      {/* Role Table */}
      <RoleTable
        roles={filteredRoles}
        onViewRole={(r) => setSelectedRole(r)}
        onEditRole={(r) => setRoleToEdit(r)}
        onDeactivateRole={handleDeactivate}
        onReactivateRole={(r) => reactivateRole(r.id)}
      />

      {/* Create / Edit Modal */}
      {(isCreateModalOpen || roleToEdit) && (
        <RoleFormModal
          isOpen={isCreateModalOpen || !!roleToEdit}
          onClose={() => {
            setIsCreateModalOpen(false);
            setRoleToEdit(null);
          }}
          onSave={handleSaveRole}
          roleToEdit={roleToEdit}
          existingRoles={roles}
        />
      )}

      {/* Impact Modal for editing role with existing users */}
      {pendingRoleUpdate && (
        <RoleImpactModal
          isOpen={!!pendingRoleUpdate}
          onClose={() => setPendingRoleUpdate(null)}
          role={pendingRoleUpdate.role}
          newPermissionCount={pendingRoleUpdate.data.permissionIds.length}
          onConfirm={handleConfirmImpactUpdate}
        />
      )}

      {/* Safety Modal for Protected Role */}
      {safetyModalRole && (
        <RoleSafetyModal
          isOpen={!!safetyModalRole}
          onClose={() => setSafetyModalRole(null)}
          roleName={safetyModalRole}
        />
      )}

      {/* Role Details Drawer */}
      {selectedRole && (
        <RoleDetailsDrawer
          isOpen={!!selectedRole}
          onClose={() => setSelectedRole(null)}
          role={roles.find((r) => r.id === selectedRole.id) || selectedRole}
          assignedUsers={users.filter((u) => u.roleId === selectedRole.id && u.status === 'ACTIVE')}
          auditLogs={auditLogs}
          onEdit={(r) => {
            setSelectedRole(null);
            setRoleToEdit(r);
          }}
          onDeactivate={(r) => {
            setSelectedRole(null);
            handleDeactivate(r);
          }}
          onReactivate={(r) => {
            setSelectedRole(null);
            reactivateRole(r.id);
          }}
          onViewUser={(u) => {
            setSelectedRole(null);
            if (onViewUser) onViewUser(u);
          }}
        />
      )}
    </div>
  );
};
