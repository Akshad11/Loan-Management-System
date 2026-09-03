import React, { useState } from 'react';
import { Drawer } from '../shared/Drawer';
import { Tabs, TabItem } from '../shared/Tabs';
import { AdminStatusBadge } from '../shared/AdminStatusBadge';
import { AuditTimeline } from '../shared/AuditTimeline';
import { UserAvatar } from '../shared/UserAvatar';
import { Branch, LMSUser, AdminAuditEntry } from '../../types';
import { formatIndianCurrency, formatCompactCurrency } from '../../utils/formatters';
import {
  Building,
  MapPin,
  Phone,
  Mail,
  Users,
  Landmark,
  Clock,
  Edit2,
  Building2,
  CheckCircle2,
  Calendar,
  DollarSign,
} from 'lucide-react';

interface BranchDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch | null;
  assignedUsers: LMSUser[];
  auditLogs: AdminAuditEntry[];
  onEdit: (branch: Branch) => void;
  onDeactivate: (branch: Branch) => void;
  onReactivate: (branch: Branch) => void;
  onViewUser: (user: LMSUser) => void;
}

export const BranchDetailsDrawer: React.FC<BranchDetailsDrawerProps> = ({
  isOpen,
  onClose,
  branch,
  assignedUsers,
  auditLogs,
  onEdit,
  onDeactivate,
  onReactivate,
  onViewUser,
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!branch) return null;

  const branchLogs = auditLogs.filter((l) => l.entityId === branch.id || l.entityName.includes(branch.code));

  const tabs: TabItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Assigned Staff', count: assignedUsers.length },
    { id: 'activity', label: 'Audit Timeline', count: branchLogs.length },
  ];

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={branch.name}
      subtitle={`Branch Code: ${branch.code} • ${branch.city}, ${branch.state}`}
      badge={<AdminStatusBadge status={branch.status} size="sm" />}
      width="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div>
            {branch.status === 'ACTIVE' ? (
              <button
                type="button"
                id="drawer-deactivate-branch-btn"
                onClick={() => onDeactivate(branch)}
                className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors flex items-center gap-1.5"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Deactivate Branch</span>
              </button>
            ) : (
              <button
                type="button"
                id="drawer-reactivate-branch-btn"
                onClick={() => onReactivate(branch)}
                className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
              >
                <Building className="w-3.5 h-3.5" />
                <span>Reactivate Branch</span>
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
              id="drawer-edit-branch-btn"
              onClick={() => onEdit(branch)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 border border-slate-900 rounded hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Branch</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 text-left">
        {/* Branch Quick Header Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded bg-slate-900 text-white flex items-center justify-center font-bold">
            <Building className="w-6 h-6" />
          </div>
          <div className="space-y-1 flex-1">
            <h4 className="text-base font-bold text-slate-900">{branch.name}</h4>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>{branch.city}, {branch.state} ({branch.pinCode})</span>
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>{branch.userCount} active staff</span>
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Financial & Portfolio Metrics */}
            <div>
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Branch Portfolio Metrics
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white border border-slate-200 rounded-lg p-3.5">
                  <span className="text-[11px] font-medium text-slate-500 block">Total Portfolio Outstanding</span>
                  <span className="text-base font-bold text-slate-900 block mt-1">
                    {formatIndianCurrency(branch.totalPortfolioValue)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                    {formatCompactCurrency(branch.totalPortfolioValue)}
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-3.5">
                  <span className="text-[11px] font-medium text-slate-500 block">Active Loan Accounts</span>
                  <span className="text-base font-bold text-slate-900 block mt-1">
                    {branch.activeLoanCount} accounts
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Originating jurisdiction</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-3.5">
                  <span className="text-[11px] font-medium text-slate-500 block">Staff User Headcount</span>
                  <span className="text-base font-bold text-slate-900 block mt-1">
                    {branch.userCount} staff members
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Across all roles</span>
                </div>
              </div>
            </div>

            {/* Address & Physical Premises */}
            <div>
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Premises & Location Coordinates
              </h5>
              <div className="bg-white border border-slate-200 rounded-lg p-4 text-xs space-y-3">
                <div>
                  <span className="text-slate-500 block mb-0.5">Physical Address</span>
                  <p className="font-medium text-slate-900 leading-relaxed">
                    {branch.addressLine1}
                    {branch.addressLine2 ? `, ${branch.addressLine2}` : ''}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-500 block mb-0.5">City / Town</span>
                    <span className="font-semibold text-slate-900">{branch.city}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">State</span>
                    <span className="font-semibold text-slate-900">{branch.state}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">PIN Code</span>
                    <span className="font-mono font-bold text-slate-900">{branch.pinCode}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Management & Contact */}
            <div>
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Branch Leadership & Contact Channels
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white border border-slate-200 rounded-lg p-4 text-xs">
                <div>
                  <span className="text-slate-500 block mb-0.5">Designated Branch Manager</span>
                  <span className="font-bold text-slate-900">
                    {branch.managerName || 'No Manager Assigned'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Telephone / Landline</span>
                  <span className="font-mono text-slate-900 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{branch.phone}</span>
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Official Branch Email</span>
                  <a
                    href={`mailto:${branch.email}`}
                    className="font-medium text-slate-900 hover:underline flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{branch.email}</span>
                  </a>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Registration Date</span>
                  <span className="text-slate-900 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{branch.createdDate}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ASSIGNED USERS */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-xs text-slate-600">
              Staff members currently stationed at <strong>{branch.name}</strong> ({assignedUsers.length} total).
            </div>

            {assignedUsers.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-slate-200 rounded-lg text-xs text-slate-500">
                No staff members are currently assigned to this branch.
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
                        <p className="text-[11px] text-slate-500 font-medium">{u.roleName}</p>
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

        {/* TAB 3: AUDIT TIMELINE */}
        {activeTab === 'activity' && (
          <AuditTimeline
            logs={branchLogs}
            emptyMessage="No administrative modifications logged for this branch."
          />
        )}
      </div>
    </Drawer>
  );
};
