import React, { useState } from 'react';
import { Drawer } from '../shared/Drawer';
import { Tabs, TabItem } from '../shared/Tabs';
import { AdminStatusBadge } from '../shared/AdminStatusBadge';
import { UserAvatar } from '../shared/UserAvatar';
import { AuditTimeline } from '../shared/AuditTimeline';
import { LMSUser, Role, Branch, AdminAuditEntry } from '../../types';
import { PERMISSION_CATALOG, PERMISSION_MODULES } from '../../config/permissions';
import { formatIndianPhone } from '../../utils/formatters';
import {
  Mail,
  Phone,
  Building,
  Shield,
  Calendar,
  Clock,
  KeyRound,
  AlertTriangle,
  Edit2,
  UserX,
  UserCheck,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface UserDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: LMSUser | null;
  role: Role | null;
  branch: Branch | null;
  auditLogs: AdminAuditEntry[];
  onEdit: (user: LMSUser) => void;
  onDeactivate: (user: LMSUser) => void;
  onReactivate: (user: LMSUser) => void;
}

export const UserDetailsDrawer: React.FC<UserDetailsDrawerProps> = ({
  isOpen,
  onClose,
  user,
  role,
  branch,
  auditLogs,
  onEdit,
  onDeactivate,
  onReactivate,
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!user) return null;

  const userLogs = auditLogs.filter((log) => log.entityId === user.id || log.entityName.includes(user.employeeId));

  const grantedPermissionIds = new Set(
    role ? (role.permissionIds || (role as any).permissions || []) : []
  );

  const tabs: TabItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'permissions', label: 'Effective Permissions', count: grantedPermissionIds.size },
    { id: 'activity', label: 'Audit Timeline', count: userLogs.length },
  ];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={user.name}
      subtitle={`Employee ID: ${user.employeeId} • ${user.username}`}
      badge={<AdminStatusBadge status={user.status} size="sm" />}
      width="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            {user.status === 'ACTIVE' ? (
              <button
                type="button"
                id="drawer-deactivate-user-btn"
                onClick={() => onDeactivate(user)}
                className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors flex items-center gap-1.5"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Deactivate User</span>
              </button>
            ) : (
              <button
                type="button"
                id="drawer-reactivate-user-btn"
                onClick={() => onReactivate(user)}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Reactivate User</span>
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
              id="drawer-edit-user-btn"
              onClick={() => onEdit(user)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 border border-slate-900 rounded hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Details</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 text-left">
        {/* User Quick Header Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center gap-4">
          <UserAvatar name={user.name} size="lg" status={user.status} />
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900">{user.name}</h4>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-semibold text-slate-900">{user.roleName}</span>
              </span>
              <span className="flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-slate-500" />
                <span>{user.branchName}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Identity & Contact Info */}
            <div>
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Contact & Identity Details
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white border border-slate-200 rounded-lg p-4 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">Full Name</span>
                  <span className="font-semibold text-slate-900">{user.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Employee ID</span>
                  <span className="font-mono font-bold text-slate-900">{user.employeeId}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Official Email</span>
                  <a
                    href={`mailto:${user.email}`}
                    className="font-medium text-slate-900 hover:underline flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{user.email}</span>
                  </a>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Mobile Number</span>
                  <span className="font-mono text-slate-900 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{formatIndianPhone(user.mobile)}</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Username</span>
                  <span className="font-mono text-slate-900">{user.username}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Department</span>
                  <span className="text-slate-900 font-medium">{user.department}</span>
                </div>
              </div>
            </div>

            {/* Organizational Context */}
            <div>
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Organizational Assignment
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white border border-slate-200 rounded-lg p-4 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">Assigned Role</span>
                  <span className="font-semibold text-slate-900">{user.roleName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Primary Branch</span>
                  <span className="font-medium text-slate-900">{user.branchName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Branch City / State</span>
                  <span className="text-slate-900">{branch ? `${branch.city}, ${branch.state}` : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Branch Manager</span>
                  <span className="text-slate-900">{branch?.managerName || 'None Assigned'}</span>
                </div>
              </div>
            </div>

            {/* Security & Access Stats */}
            <div>
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Security & Session Telemetry
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white border border-slate-200 rounded-lg p-4 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">Last Interactive Login</span>
                  <span className="font-medium text-slate-900 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.lastLogin}</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Account Created</span>
                  <span className="font-medium text-slate-900 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.createdDate}</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Failed Login Attempts</span>
                  <span
                    className={`font-mono font-bold ${
                      user.failedLoginAttempts > 0 ? 'text-amber-700' : 'text-slate-900'
                    }`}
                  >
                    {user.failedLoginAttempts} attempts
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EFFECTIVE PERMISSIONS */}
        {activeTab === 'permissions' && (
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-600 flex items-start gap-2">
              <Shield className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900">Inherited Role: {user.roleName}</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Permissions are governed strictly by the assigned RBAC role. Direct permission overrides are disallowed by security policy.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {PERMISSION_MODULES.map((mod) => {
                const modulePerms = PERMISSION_CATALOG.filter((p) => p.module === mod.key);
                const grantedInMod = modulePerms.filter((p) => grantedPermissionIds.has(p.id));

                return (
                  <div key={mod.key} className="bg-white border border-slate-200 rounded-lg overflow-hidden text-xs">
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{mod.label}</span>
                        <p className="text-[11px] text-slate-500">{mod.description}</p>
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-200 text-slate-700 rounded">
                        {grantedInMod.length} / {modulePerms.length} granted
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {modulePerms.map((perm) => {
                        const isGranted = grantedPermissionIds.has(perm.id);
                        return (
                          <div
                            key={perm.id}
                            className={`p-3 flex items-start justify-between gap-3 ${
                              isGranted ? 'bg-white' : 'bg-slate-50/50 opacity-60'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] font-bold text-slate-700">{perm.code}</span>
                                {perm.isHighRiskFinancial && (
                                  <span className="text-[10px] font-bold text-red-800 bg-red-100 px-1.5 py-0.2 rounded">
                                    High-Risk Financial
                                  </span>
                                )}
                              </div>
                              <p className="font-semibold text-slate-900">{perm.name}</p>
                              <p className="text-[11px] text-slate-500">{perm.description}</p>
                            </div>

                            <div className="shrink-0 pt-0.5">
                              {isGranted ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Granted</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Denied</span>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT TIMELINE */}
        {activeTab === 'activity' && (
          <AuditTimeline
            logs={userLogs}
            emptyMessage="No administrative audit events recorded for this user."
          />
        )}
      </div>
    </Drawer>
  );
};
