import React from 'react';
import { Role } from '../../types';
import { AdminStatusBadge } from '../shared/AdminStatusBadge';
import { Shield, Users, Eye, Edit2, ShieldAlert, Lock, MoreHorizontal } from 'lucide-react';

interface RoleTableProps {
  roles: Role[];
  onViewRole: (role: Role) => void;
  onEditRole: (role: Role) => void;
  onDeactivateRole: (role: Role) => void;
  onReactivateRole: (role: Role) => void;
}

export const RoleTable: React.FC<RoleTableProps> = ({
  roles,
  onViewRole,
  onEditRole,
  onDeactivateRole,
  onReactivateRole,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
      <div className="overflow-x-auto min-h-[380px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 select-none">
            <tr>
              <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Role & Code
              </th>
              <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Functional Responsibilities
              </th>
              <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Assigned Staff
              </th>
              <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Permissions
              </th>
              <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Status
              </th>
              <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Last Updated
              </th>
              <th className="py-3 px-4 font-bold text-slate-700 uppercase tracking-wider text-[11px] text-right">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {roles.map((role) => (
              <tr
                key={role.id}
                onClick={() => onViewRole(role)}
                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
              >
                {/* Role Name */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-slate-100 rounded text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{role.name}</span>
                        {role.isSystemProtected && (
                          <span title="Protected System Role">
                            <Lock className="w-3 h-3 text-slate-400" />
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">{role.code}</span>
                    </div>
                  </div>
                </td>

                {/* Description */}
                <td className="py-3 px-4 max-w-sm">
                  <p className="text-slate-600 line-clamp-2 text-xs leading-relaxed">{role.description}</p>
                </td>

                {/* Assigned Users */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 font-semibold text-slate-900">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{role.userCount} users</span>
                  </span>
                </td>

                {/* Permissions */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-800 rounded">
                    {(role.permissionIds || (role as any).permissions || []).length} granted
                  </span>
                </td>

                {/* Status */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <AdminStatusBadge status={role.status} size="sm" />
                </td>

                {/* Last Updated */}
                <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                  <div>
                    <span>{role.updatedDate || (role as any).updatedAt?.split('T')[0] || '—'}</span>
                    <span className="block text-[10px] text-slate-400 truncate max-w-[130px]">
                      {role.updatedBy ? role.updatedBy.split('(')[0].trim() : 'System'}
                    </span>
                  </div>
                </td>

                {/* Actions */}
                <td className="py-3 px-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      id={`view-role-${role.id}`}
                      onClick={() => onViewRole(role)}
                      className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                      title="View Role Details"
                      aria-label={`View ${role.name}`}
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      id={`edit-role-${role.id}`}
                      onClick={() => onEditRole(role)}
                      className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"
                      title="Edit Permissions"
                      aria-label={`Edit ${role.name}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {!role.isSystemProtected && (
                      <>
                        {role.status === 'ACTIVE' ? (
                          <button
                            type="button"
                            id={`deactivate-role-${role.id}`}
                            onClick={() => onDeactivateRole(role)}
                            className="p-1 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded"
                            title="Deactivate Role"
                            aria-label={`Deactivate ${role.name}`}
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            id={`reactivate-role-${role.id}`}
                            onClick={() => onReactivateRole(role)}
                            className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                            title="Reactivate Role"
                            aria-label={`Reactivate ${role.name}`}
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
