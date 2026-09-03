'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../services/authContext';
import { UsersView } from './UsersView';
import { RolesView } from './RolesView';
import { AuditView } from './AuditView';
import { AppSettingsPanel } from '../admin/AppSettingsPanel';
import { useSettings } from '../../services/settingsContext';
import {
  Users, Shield, Settings, History, ShieldCog, Building2,
  ChevronRight, AlertTriangle
} from 'lucide-react';

type AdminTab = 'users' | 'roles' | 'settings' | 'audit';

const TABS: { id: AdminTab; label: string; description: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'users', label: 'User Management', description: 'Manage staff accounts, roles, and access', icon: Users },
  { id: 'roles', label: 'Roles & Permissions', description: 'Configure role-based access control', icon: Shield },
  { id: 'settings', label: 'Application Settings', description: 'Company, branding, security configuration', icon: Settings },
  { id: 'audit', label: 'Audit Logs', description: 'Administrative action audit trail', icon: History },
];

interface AdminViewProps {
  initialTab?: AdminTab;
  onNavigateGlobal?: (mod: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  initialTab = 'users',
  onNavigateGlobal,
}) => {
  const { user, hasPermission } = useAuth();
  const { getSetting } = useSettings();
  const [currentTab, setCurrentTab] = useState<AdminTab>(initialTab);

  const isAdmin = hasPermission('manage_users_roles');

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <div className="text-center">
          <h3 className="text-base font-bold text-slate-900">Access Denied</h3>
          <p className="text-sm text-slate-500 mt-1">
            Your role ({user?.roleTitle || 'Unknown'}) does not have administration privileges.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigateGlobal?.('dashboard')}
          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-2">
            <button
              type="button"
              onClick={() => onNavigateGlobal?.('dashboard')}
              className="hover:text-slate-900 transition-colors"
            >
              {getSetting('application.shortName', 'LMS')}
            </button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-900 font-bold">Administration</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-700">{TABS.find((t) => t.id === currentTab)?.label}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center shadow-sm">
              <ShieldCog className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Administration</h1>
              <p className="text-xs text-slate-500">
                {getSetting('company.name', 'ABC Finance')} · System Administration Panel
              </p>
            </div>
          </div>
        </div>
        <div className="text-[10px] text-slate-400 font-mono bg-slate-100 border border-slate-200 rounded px-2 py-1">
          {getSetting('application.name', 'LMS')} v{getSetting('application.version', '2.4.0')}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              id={`admin-tab-${tab.id}`}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="transition-opacity duration-150">
        {currentTab === 'users' && (
          <UsersView onNavigateToRoles={() => setCurrentTab('roles')} />
        )}
        {currentTab === 'roles' && (
          <RolesView />
        )}
        {currentTab === 'settings' && (
          <AppSettingsPanel />
        )}
        {currentTab === 'audit' && (
          <AuditView onNavigate={(mod) => onNavigateGlobal?.(mod)} />
        )}
      </div>
    </div>
  );
};
