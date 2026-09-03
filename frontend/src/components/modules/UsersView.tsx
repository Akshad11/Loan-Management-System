import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../../services/authContext';
import { UserFilters } from '../users/UserFilters';
import { UserTable } from '../users/UserTable';
import { UserFormModal } from '../users/UserFormModal';
import { UserDetailsDrawer } from '../users/UserDetailsDrawer';
import { UserDeactivateModal } from '../users/UserDeactivateModal';
import { UserReactivateModal } from '../users/UserReactivateModal';
import { LMSUser, UserFilterState } from '../../types';
import { UserPlus, Users, UserCheck, UserX, AlertCircle, Loader2, RefreshCw } from 'lucide-react';


interface UsersViewProps {
  onNavigateToRoles?: () => void;
  onNavigateToBranches?: () => void;
}

export const UsersView: React.FC<UsersViewProps> = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<LMSUser[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<UserFilterState>({
    search: '',
    status: '',
    roleId: '',
    branchId: '',
    lastLoginRange: '',
    createdDateRange: '',
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<LMSUser | null>(null);
  const [selectedUser, setSelectedUser] = useState<LMSUser | null>(null);
  const [userToDeactivate, setUserToDeactivate] = useState<LMSUser | null>(null);
  const [userToReactivate, setUserToReactivate] = useState<LMSUser | null>(null);

  const authHeaders = useCallback(
    () => ({ 'Content-Type': 'application/json', 'x-user-id': currentUser?.id || '' }),
    [currentUser?.id]
  );

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [usersRes, rolesRes, branchesRes] = await Promise.all([
        fetch('/api/users', { headers: authHeaders() }),
        fetch('/api/roles', { headers: authHeaders() }),
        fetch('/api/branches', { headers: authHeaders() }),
      ]);
      if (!usersRes.ok) throw new Error('Failed to load users');
      const [usersData, rolesData, branchesData] = await Promise.all([
        usersRes.json(),
        rolesRes.json(),
        branchesRes.json(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
      setBranches(branchesData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (filters.search) {
        const query = filters.search.toLowerCase().trim();
        const matches =
          (u.name || '').toLowerCase().includes(query) ||
          (u.employeeId || '').toLowerCase().includes(query) ||
          (u.username || '').toLowerCase().includes(query) ||
          (u.email || '').toLowerCase().includes(query) ||
          (u.roleName || '').toLowerCase().includes(query) ||
          (u.branchName || '').toLowerCase().includes(query);
        if (!matches) return false;
      }
      if (filters.status && u.status !== filters.status) return false;
      if (filters.roleId && u.roleId !== filters.roleId) return false;
      if (filters.branchId && u.branchId !== filters.branchId) return false;
      return true;
    });
  }, [users, filters]);

  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;
  const inactiveCount = users.filter((u) => u.status === 'INACTIVE').length;
  const suspendedCount = users.filter((u) => u.status === 'SUSPENDED').length;

  const handleSaveUser = async (userData: any) => {
    try {
      if (userToEdit) {
        const res = await fetch(`/api/users/${userToEdit.id}`, {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify(userData),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        setUserToEdit(null);
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(userData),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      }
      await loadData();
    } catch (err: any) {
      alert(`Failed to save user: ${err.message}`);
    }
  };

  const handleStatusChange = async (
    userId: string,
    action: 'activate' | 'deactivate' | 'suspend' | 'unlock',
    reason?: string
  ) => {
    try {
      const res = await fetch(`/api/users/${userId}/status`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action, reason }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await loadData();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const handleOpenEdit = (u: LMSUser) => setUserToEdit(u);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        <span className="ml-2 text-sm text-slate-500">Loading users from database...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-sm text-slate-600">{error}</p>
        <button onClick={loadData} className="text-xs text-blue-600 flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Staff User Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Provision staff accounts, configure role-based access, and oversee branch officer assignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded hover:bg-slate-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            type="button"
            id="create-new-user-btn"
            onClick={() => { setUserToEdit(null); setIsCreateModalOpen(true); }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 border border-slate-900 rounded hover:bg-slate-800 transition-colors shadow-none shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Provision New Staff User</span>
          </button>
        </div>
      </div>

      {/* KPI Blocks */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded text-slate-800">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Total Staff Accounts</span>
            <span className="text-lg font-bold text-slate-900 leading-tight block">{users.length}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center gap-3">
          <div className="p-2 bg-emerald-50 rounded text-emerald-800">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Active Users</span>
            <span className="text-lg font-bold text-emerald-900 leading-tight block">{activeCount}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded text-amber-800">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Suspended (Security)</span>
            <span className="text-lg font-bold text-amber-900 leading-tight block">{suspendedCount}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded text-slate-600">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Deactivated Accounts</span>
            <span className="text-lg font-bold text-slate-700 leading-tight block">{inactiveCount}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <UserFilters
        filters={filters}
        onFilterChange={setFilters}
        roles={roles}
        branches={branches}
      />

      {/* User Table */}
      <UserTable
        users={filteredUsers}
        onViewUser={(u) => setSelectedUser(u)}
        onEditUser={handleOpenEdit}
        onDeactivateUser={(u) => setUserToDeactivate(u)}
        onReactivateUser={(u) => setUserToReactivate(u)}
      />

      {/* Create / Edit Modal */}
      {(isCreateModalOpen || userToEdit) && (
        <UserFormModal
          isOpen={isCreateModalOpen || !!userToEdit}
          onClose={() => {
            setIsCreateModalOpen(false);
            setUserToEdit(null);
          }}
          onSave={handleSaveUser}
          userToEdit={userToEdit}
          roles={roles}
          branches={branches}
          existingUsers={users}
        />
      )}

      {/* User Details Drawer */}
      {selectedUser && (
        <UserDetailsDrawer
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          user={users.find((u) => u.id === selectedUser.id) || selectedUser}
          role={roles.find((r) => r.id === selectedUser.roleId) || null}
          branch={branches.find((b) => b.id === selectedUser.branchId) || null}
          auditLogs={[]}
          onEdit={(u) => {
            setSelectedUser(null);
            handleOpenEdit(u);
          }}
          onDeactivate={(u) => {
            setSelectedUser(null);
            setUserToDeactivate(u);
          }}
          onReactivate={(u) => {
            setSelectedUser(null);
            setUserToReactivate(u);
          }}
        />
      )}

      {/* Deactivate Modal */}
      {userToDeactivate && (
        <UserDeactivateModal
          isOpen={!!userToDeactivate}
          onClose={() => setUserToDeactivate(null)}
          user={userToDeactivate}
          onConfirm={(userId, reason) => {
            handleStatusChange(userId, 'deactivate', reason);
            setUserToDeactivate(null);
          }}
        />
      )}

      {/* Reactivate Modal */}
      {userToReactivate && (
        <UserReactivateModal
          isOpen={!!userToReactivate}
          onClose={() => setUserToReactivate(null)}
          user={userToReactivate}
          onConfirm={(userId, reason) => {
            handleStatusChange(userId, 'activate', reason);
            setUserToReactivate(null);
          }}
        />
      )}
    </div>
  );
};
