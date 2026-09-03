import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../services/authContext';
import {
  LogOut,
  ChevronDown,
  Building,
  Shield,
  BadgePercent,
} from 'lucide-react';
import { ConfirmationDialog } from '../shared/ConfirmationDialog';

interface UserMenuProps {
  onOpenProfile?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-slate-100 transition-colors text-left focus:outline-none focus:ring-1 focus:ring-slate-900"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <div className="w-7 h-7 rounded bg-slate-900 text-white font-bold text-xs flex items-center justify-center tracking-wider">
            {user.avatarInitials}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[140px]">
              {user.name}
            </div>
            <div className="text-[11px] font-medium text-slate-500 truncate max-w-[140px]">
              {user.roleTitle}
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-lg shadow-xl z-50 overflow-hidden text-left">
            {/* User Details Header */}
            <div className="p-3.5 border-b border-slate-200 bg-slate-50/70">
              <div className="font-bold text-xs text-slate-900">{user.name}</div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5">{user.email}</div>

              <div className="mt-2.5 pt-2 border-t border-slate-200/60 space-y-1 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-700">{user.roleTitle}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{user.branch}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                  <BadgePercent className="w-3.5 h-3.5 shrink-0" />
                  <span>Emp ID: {user.employeeId}</span>
                </div>
              </div>
            </div>

            {/* Sign Out Button */}
            <div className="p-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setShowLogoutConfirm(true);
                }}
                className="w-full px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          setShowLogoutConfirm(false);
          logout();
        }}
        title="Sign Out of Loan Management System"
        description="Are you sure you want to end your current session? Any unsaved form entries will be discarded."
        confirmLabel="Sign Out"
        cancelLabel="Stay Signed In"
        variant="danger"
      />
    </>
  );
};
