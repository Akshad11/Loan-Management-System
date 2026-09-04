import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileText,
  Landmark,
  CreditCard,
  AlertOctagon,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Layers,
  Settings,
  UserCheck,
  BarChart3,
  History,
  ChevronLeft,
  ChevronRight,
  Shield,
  Building,
  FolderOpen,
  ShieldAlert,
  RotateCcw,
  DollarSign,
  CheckCheck,
  Banknote,
  LucideIcon,
} from 'lucide-react';
import { NAV_ITEMS, NAV_GROUPS } from './navConfig';
import { useAuth } from '../../services/authContext';
import { cn } from '../../utils/formatters';

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  FileText,
  Landmark,
  CreditCard,
  AlertOctagon,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Layers,
  Settings,
  UserCheck,
  BarChart3,
  History,
  Shield,
  Building,
  FolderOpen,
  Banknote,
  ShieldAlert,
  RotateCcw,
  DollarSign,
  CheckCheck,
};

interface SidebarProps {
  currentModule: string;
  onSelectModule: (moduleId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  onSelectModule,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { hasPermission } = useAuth();

  // Filter items based on active user permissions
  const permittedItems = NAV_ITEMS.filter((item) => hasPermission(item.requiredPermission));

  return (
    <aside
      className={cn(
        'bg-white border-r border-slate-200 flex flex-col transition-all duration-200 ease-in-out shrink-0 select-none z-20 h-full min-h-0 overflow-hidden',
        isCollapsed ? 'w-16' : 'w-64'
      )}
      aria-label="Main Navigation Sidebar"
    >
      {/* Navigation Items List */}
      <div className="flex-1 min-h-0 overflow-y-auto py-3 px-2 space-y-4 custom-scrollbar">
        {NAV_GROUPS.map((group) => {
          const groupItems = permittedItems.filter((item) => item.group === group);
          if (groupItems.length === 0) return null;

          return (
            <div key={group} className="space-y-1">
              {!isCollapsed ? (
                <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {group}
                </div>
              ) : (
                <div className="h-px bg-slate-100 my-2 mx-2" />
              )}

              <div className="space-y-0.5">
                {groupItems.map((item) => {
                  const Icon = ICON_MAP[item.iconName] || LayoutDashboard;
                  const isActive = currentModule === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectModule(item.id)}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        'w-full flex items-center rounded-md text-xs sm:text-sm font-medium transition-colors relative group text-left',
                        isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2 gap-3',
                        isActive
                          ? 'bg-slate-900 text-white font-semibold shadow-none'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0',
                          isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-800'
                        )}
                      />

                      {!isCollapsed && (
                        <span className="flex-1 truncate tracking-tight">{item.label}</span>
                      )}

                      {!isCollapsed && item.badgeCount && item.badgeCount > 0 && (
                        <span
                          className={cn(
                            'text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums',
                            isActive ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'
                          )}
                        >
                          {item.badgeCount}
                        </span>
                      )}

                      {/* Tooltip for collapsed mode */}
                      {isCollapsed && (
                        <div className="absolute left-full ml-2 px-2.5 py-1 bg-slate-900 text-white text-xs rounded shadow-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-50">
                          {item.label}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Collapse Toggle Footer */}
      <div className="hidden md:flex p-2 border-t border-slate-200 bg-slate-50/50 items-center justify-between">
        {!isCollapsed && (
          <span className="text-[11px] font-medium text-slate-400 pl-2">Collapse Menu</span>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 rounded-md transition-colors mx-auto"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
