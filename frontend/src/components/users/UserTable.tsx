import React, { useState, useMemo } from 'react';
import { LMSUser } from '../../types';
import { UserAvatar } from '../shared/UserAvatar';
import { AdminStatusBadge } from '../shared/AdminStatusBadge';
import {
  Copy,
  Check,
  Eye,
  Edit2,
  UserX,
  UserCheck,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react';

interface UserTableProps {
  users: LMSUser[];
  onViewUser: (user: LMSUser) => void;
  onEditUser: (user: LMSUser) => void;
  onDeactivateUser: (user: LMSUser) => void;
  onReactivateUser: (user: LMSUser) => void;
}

type SortField = 'employeeId' | 'name' | 'username' | 'roleName' | 'branchName' | 'status' | 'lastLogin' | 'createdDate';
type SortDirection = 'asc' | 'desc';

export const UserTable: React.FC<UserTableProps> = ({
  users,
  onViewUser,
  onEditUser,
  onDeactivateUser,
  onReactivateUser,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('employeeId');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const handleCopy = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const aVal = (a[sortField] || '').toString().toLowerCase();
      const bVal = (b[sortField] || '').toString().toLowerCase();
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedUsers.length / pageSize) || 1;
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <button
      type="button"
      onClick={() => handleSort(field)}
      className="group inline-flex items-center gap-1 font-bold text-[11px] uppercase tracking-wider text-slate-700 hover:text-slate-900 focus:outline-none"
    >
      <span>{label}</span>
      <ArrowUpDown className={`w-3 h-3 transition-colors ${sortField === field ? 'text-slate-900' : 'text-slate-300 group-hover:text-slate-500'}`} />
    </button>
  );

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
      {/* Table Container */}
      <div className="overflow-x-auto min-h-[380px]">
        <table className="w-full text-left border-collapse text-xs">
          {/* Sticky Header */}
          <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 select-none">
            <tr>
              <th className="py-3 px-3.5 font-bold text-slate-700">
                <SortHeader field="employeeId" label="Emp ID" />
              </th>
              <th className="py-3 px-3.5 font-bold text-slate-700">
                <SortHeader field="name" label="Staff Name & Unit" />
              </th>
              <th className="py-3 px-3.5 font-bold text-slate-700">
                <SortHeader field="username" label="Username & Email" />
              </th>
              <th className="py-3 px-3.5 font-bold text-slate-700">
                <SortHeader field="roleName" label="Role" />
              </th>
              <th className="py-3 px-3.5 font-bold text-slate-700">
                <SortHeader field="branchName" label="Assigned Branch" />
              </th>
              <th className="py-3 px-3.5 font-bold text-slate-700">
                <SortHeader field="status" label="Status" />
              </th>
              <th className="py-3 px-3.5 font-bold text-slate-700">
                <SortHeader field="lastLogin" label="Last Login" />
              </th>
              <th className="py-3 px-3.5 font-bold text-slate-700">
                <SortHeader field="createdDate" label="Created" />
              </th>
              <th className="py-3 px-3.5 font-bold text-slate-700 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  <p className="text-sm font-medium">No users found matching current filters.</p>
                  <p className="text-xs text-slate-400 mt-1">Try refining your search query or reset active filters.</p>
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => {
                const isCopied = copiedId === user.id;

                return (
                  <tr
                    key={user.id}
                    onClick={() => onViewUser(user)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Employee ID */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900">
                        <span>{user.employeeId}</span>
                        <button
                          type="button"
                          onClick={(e) => handleCopy(user.employeeId, user.id, e)}
                          className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
                          title="Copy Employee ID"
                          aria-label={`Copy ${user.employeeId}`}
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>

                    {/* Staff Name & Department */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar name={user.name} size="sm" status={user.status} />
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight group-hover:text-slate-950">
                            {user.name}
                          </p>
                          <p className="text-[11px] text-slate-500">{user.department}</p>
                        </div>
                      </div>
                    </td>

                    {/* Username & Email */}
                    <td className="py-3 px-3.5">
                      <div>
                        <p className="font-mono text-slate-800 text-[11px]">{user.username}</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-[170px]">{user.email}</p>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="font-medium text-slate-900">{user.roleName}</span>
                    </td>

                    {/* Branch */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="text-slate-700">{user.branchName}</span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <AdminStatusBadge status={user.status} size="sm" />
                    </td>

                    {/* Last Login */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-slate-500 text-[11px]">
                      {user.lastLogin}
                    </td>

                    {/* Created Date */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-slate-500 text-[11px]">
                      {user.createdDate}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3.5 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          id={`view-user-${user.id}`}
                          onClick={() => onViewUser(user)}
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="View Details & Permissions"
                          aria-label={`View ${user.name}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          id={`edit-user-${user.id}`}
                          onClick={() => onEditUser(user)}
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                          title="Edit User Details"
                          aria-label={`Edit ${user.name}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {user.status === 'ACTIVE' ? (
                          <button
                            type="button"
                            id={`deactivate-user-${user.id}`}
                            onClick={() => onDeactivateUser(user)}
                            className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded"
                            title="Deactivate User"
                            aria-label={`Deactivate ${user.name}`}
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            id={`reactivate-user-${user.id}`}
                            onClick={() => onReactivateUser(user)}
                            className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                            title="Reactivate User"
                            aria-label={`Reactivate ${user.name}`}
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex items-center justify-between text-xs text-slate-600">
        <div>
          Showing{' '}
          <span className="font-semibold text-slate-900">
            {users.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </span>{' '}
          to{' '}
          <span className="font-semibold text-slate-900">
            {Math.min(currentPage * pageSize, users.length)}
          </span>{' '}
          of <span className="font-semibold text-slate-900">{users.length}</span> staff users
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
