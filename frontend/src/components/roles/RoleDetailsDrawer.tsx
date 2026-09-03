import React, { useState } from 'react';
import { Drawer } from '../shared/Drawer';
import { Tabs, TabItem } from '../shared/Tabs';
import { AdminStatusBadge } from '../shared/AdminStatusBadge';
import { RolePermissionMatrix } from './RolePermissionMatrix';
import { AuditTimeline } from '../shared/AuditTimeline';
import { UserAvatar } from '../shared/UserAvatar';
import { Role, LMSUser, AdminAuditEntry } from '../../types';
import { Shield, Users, Clock, Edit2, ShieldAlert, CheckCircle2, Lock, ArrowUpRight } from 'lucide-react';

interface RoleDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
  assignedUsers: LMSUser[];
  auditLogs: AdminAuditEntry[];
  onEdit: (role: Role) => void;
  onDeactivate: (role: Role) => void;
  onReactivate: (role: Role) => void;
  onViewUser: (user: LMSUser) => void;
}

export const RoleDetailsDrawer: React.FC<RoleDetailsDrawerProps> = ({
  isOpen,
  onClose,
  role,
  assignedUsers,
  auditLogs,
  onEdit,
  onDeactivate,
  onReactivate,
  onViewUser,
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!role) return null;

  const roleLogs = auditLogs.filter((l) => l.entityId === role.id || l.entityName.includes(role.name));

  const permCount = (role.permissionIds || (role as any).permissions || []).length;

  const tabs: TabItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'permissions', label: 'Granted Permissions', count: permCount },
    { id: 'users', label: 'Assigned Users', count: assignedUsers.length },
    { id: 'activity', label: 'Audit Timeline', count: roleLogs.length },
  ];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={role.name}
      subtitle={`Role Code: ${role.code} • ${role.userCount} assigned staff`}
      badge={<AdminStatusBadge status={role.status} size="sm" />}
      width="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            {role.isSystemProtected ? (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Protected System Role</span>
              </span>
            ) : role.status === 'ACTIVE' ? (
              <button
                type="button"
                id="drawer-deactivate-role-btn"
                onClick={() => onDeactivate(role)}
                className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
              >
                Deactivate Role
              </button>
            ) : (
              <button
                type="button"
                id="drawer-reactivate-role-btn"
                onClick={() => onReactivate(role)}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded hover:bg-emerald-100 transition-colors"
              >
                Reactivate Role
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              id="drawer-edit-role-btn"
              onClick={() => onEdit(role)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 border border-slate-900 rounded hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Role & Permissions</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 text-left">
        {/* Header summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded bg-slate-900 text-white flex items-center justify-center font-bold">
            <Shield className="w-6 h-6" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-slate-900">{role.name}</h4>
              {role.isSystemProtected && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                  <Lock className="w-3 h-3" />
                  System Core
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 leading-tight">{role.description}</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white border border-slate-200 rounded-lg p-4 text-xs">
              <div>
                <span className="text-slate-500 block mb-0.5">Role Code</span>
                <span className="font-mono font-bold text-slate-900">{role.code}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Assigned Staff Count</span>
                <span className="font-semibold text-slate-900">{role.userCount} active users</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Last Updated</span>
                <span className="font-medium text-slate-900">{role.updatedDate || (role as any).updatedAt?.split('T')[0] || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Updated By</span>
                <span className="text-slate-900">{role.updatedBy || 'System Administrator'}</span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded p-4 text-xs space-y-2">
              <h5 className="font-bold text-slate-900">Functional Responsibility Description</h5>
              <p className="text-slate-700 leading-relaxed">{role.description}</p>
            </div>
          </div>
        )}

        {/* TAB 2: PERMISSIONS */}
        {activeTab === 'permissions' && (
          <div className="space-y-3">
            <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-600 flex items-center justify-between">
              <span>
                <strong>{permCount}</strong> operational permissions currently granted.
              </span>
              <button
                type="button"
                onClick={() => onEdit(role)}
                className="text-xs font-bold text-slate-900 hover:underline flex items-center gap-1"
              >
                <span>Edit Permissions</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <RolePermissionMatrix
              selectedPermissionIds={role.permissionIds || (role as any).permissions || []}
              onChange={() => {}}
              readOnly
            />
          </div>
        )}

        {/* TAB 3: ASSIGNED USERS */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-xs text-slate-600">
              Staff members currently assigned to the <strong>{role.name}</strong> role ({assignedUsers.length} total).
            </div>

            {assignedUsers.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-200 rounded-lg text-xs text-slate-500">
                No active staff users currently assigned to this role.
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
                {assignedUsers.map((u) => (
                  <div
                    key={u.id}
                    className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar name={u.name} size="sm" status={u.status} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{u.name}</span>
                          <span className="font-mono text-[11px] text-slate-500">({u.employeeId})</span>
                        </div>
                        <p className="text-[11px] text-slate-500">{u.branchName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <AdminStatusBadge status={u.status} size="sm" />
                      <button
                        type="button"
                        onClick={() => onViewUser(u)}
                        className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded"
                      >
                        View User
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: AUDIT TIMELINE */}
        {activeTab === 'activity' && (
          <AuditTimeline
            logs={roleLogs}
            emptyMessage="No administrative changes recorded for this role."
          />
        )}
      </div>
    </Drawer>
  );
};
