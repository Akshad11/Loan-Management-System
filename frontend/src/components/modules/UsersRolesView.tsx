import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '../shared/PageHeader';
import { DataTable, ColumnDef } from '../shared/DataTable';
import { formatDateTime } from '../../utils/formatters';
import { UserPlus } from 'lucide-react';
import { systemApi } from '../../services/apiClient';
import { TableSkeleton } from '../shared/LoadingSkeleton';

export const UsersRolesView: React.FC<{ onNavigate: (mod: string) => void }> = ({ onNavigate }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await systemApi.getUsers();
      const list = Array.isArray(res) ? res : res?.users || [];
      setUsers(list);
    } catch (err) {
      console.error('Failed to load users for UsersRolesView:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const columns: ColumnDef<any>[] = [
    {
      key: 'employeeId',
      header: 'Employee ID',
      sortable: true,
      copyable: true,
      copyValue: (r) => r.employeeId,
      cell: (r) => <span className="font-mono text-xs font-bold text-slate-900">{r.employeeId}</span>,
    },
    {
      key: 'name',
      header: 'Staff Name',
      sortable: true,
      cell: (r) => (
        <div>
          <div className="font-semibold text-xs text-slate-900">{r.name || `${r.firstName} ${r.lastName}`}</div>
          <div className="text-[11px] text-slate-400 font-mono">{r.email}</div>
        </div>
      ),
    },
    {
      key: 'roleName',
      header: 'Assigned Role',
      sortable: true,
      cell: (r) => (
        <span className="text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
          {r.roleName || r.role?.name || 'Staff'}
        </span>
      ),
    },
    {
      key: 'department',
      header: 'Department / Unit',
      sortable: true,
      cell: (r) => <span className="text-xs text-slate-700">{r.department || 'Retail Banking'}</span>,
    },
    {
      key: 'branchName',
      header: 'Assigned Branch',
      sortable: true,
      cell: (r) => (
        <span className="text-xs text-slate-600 truncate max-w-[160px] block">
          {r.branchName || r.branch?.name || 'Main Branch'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      cell: (r) => (
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded ${
            r.status === 'ACTIVE'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {r.status || 'ACTIVE'}
        </span>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Active Session',
      sortable: true,
      cell: (r) => (
        <span className="text-xs text-slate-500 font-mono">
          {r.lastLogin ? formatDateTime(r.lastLogin) : 'Never'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Users & Role-Based Access Control (RBAC)"
        subtitle="Manage employee access authorizations, operational roles, branch assignments, and delegated approval limits."
        breadcrumbs={[{ label: 'Configuration' }, { label: 'Users & Roles', active: true }]}
        onHomeClick={() => onNavigate('dashboard')}
      />

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : (
        <DataTable
          id="users-roles-table"
          columns={columns}
          data={users}
          searchKey="name"
          searchPlaceholder="Search staff by name, employee ID, or role..."
          pageSizeOptions={[5, 10, 25]}
          initialPageSize={10}
          emptyMessage="No staff user accounts found in database."
        />
      )}
    </div>
  );
};
