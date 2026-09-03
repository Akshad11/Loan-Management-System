import React from 'react';
import { Search, Landmark, Shield } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { NotificationMenu } from './NotificationMenu';
import { useAuth } from '../../services/authContext';

interface HeaderProps {
  currentModuleTitle: string;
  onOpenSearch: () => void;
  onNavigate: (module: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentModuleTitle,
  onOpenSearch,
  onNavigate,
}) => {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 h-14 px-3 sm:px-5 flex items-center justify-between shrink-0 z-30 sticky top-0">
      {/* Brand & Module Context */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center font-black text-sm tracking-tighter">
            LMS
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-sm text-slate-900 tracking-tight block leading-tight group-hover:text-slate-700 transition-colors">
              Loan Management System
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block leading-none">
              Enterprise Banking Platform
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

        {/* Current Module Title Context */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
            {currentModuleTitle}
          </span>
        </div>
      </div>

      {/* Global Search Bar Trigger */}
      <div className="flex-1 max-w-xs sm:max-w-md mx-2 sm:mx-6">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-400 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-md transition-colors text-left focus:outline-none focus:ring-1 focus:ring-slate-900"
          aria-label="Open global search (Press Ctrl+K)"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">Search customers, applications, loans...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-500 bg-white border border-slate-200 rounded shrink-0">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right Action Icons & User Profile Menu */}
      <div className="flex items-center gap-2 shrink-0">
        <NotificationMenu onNavigate={onNavigate} />

        <div className="h-4 w-px bg-slate-200 mx-1" />

        <UserMenu />
      </div>
    </header>
  );
};
