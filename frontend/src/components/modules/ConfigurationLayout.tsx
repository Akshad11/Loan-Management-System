import React, { useState } from 'react';
import { UsersView } from './UsersView';
import { RolesView } from './RolesView';
import { BranchesView } from './BranchesView';
import { AuditView } from './AuditView';
import { LMSUser } from '../../types';
import { Users, Shield, Building, History, ArrowRight } from 'lucide-react';

export type ConfigurationTab = 'users' | 'roles' | 'branches' | 'audit';

interface ConfigurationLayoutProps {
  initialTab?: ConfigurationTab;
  onNavigateGlobal?: (mod: string) => void;
}

export const ConfigurationLayout: React.FC<ConfigurationLayoutProps> = ({
  initialTab = 'users',
  onNavigateGlobal,
}) => {
  const [currentTab, setCurrentTab] = useState<ConfigurationTab>(initialTab);

  const tabs: { id: ConfigurationTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'roles', label: 'Role & Permission Management', icon: Shield },
    { id: 'branches', label: 'Branch Management', icon: Building },
    { id: 'audit', label: 'Audit Trail', icon: History },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <button
            type="button"
            onClick={() => onNavigateGlobal && onNavigateGlobal('dashboard')}
            className="hover:text-slate-900 transition-colors"
          >
            LMS Dashboard
          </button>
          <span>/</span>
          <span className="text-slate-700">Configuration</span>
          <span>/</span>
          <span className="text-slate-900 font-bold capitalize">
            {tabs.find((t) => t.id === currentTab)?.label}
          </span>
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          LMS Production Admin v2.4 • Non-disruptive State Isolation
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1 border border-slate-200 select-none overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              id={`config-tab-${tab.id}`}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Module Content */}
      <div className="transition-opacity duration-150">
        {currentTab === 'users' && <UsersView />}
        {currentTab === 'roles' && (
          <RolesView
            onViewUser={() => {
              setCurrentTab('users');
            }}
          />
        )}
        {currentTab === 'branches' && (
          <BranchesView
            onViewUser={() => {
              setCurrentTab('users');
            }}
          />
        )}
        {currentTab === 'audit' && <AuditView />}
      </div>
    </div>
  );
};
