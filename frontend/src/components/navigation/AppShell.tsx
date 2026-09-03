import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { GlobalSearch } from './GlobalSearch';
import { NAV_ITEMS } from './navConfig';
import { useAuth } from '../../services/authContext';
import { AccessDeniedState } from '../shared/AccessDeniedState';

interface AppShellProps {
  currentModule: string;
  onSelectModule: (module: string) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentModule,
  onSelectModule,
  children,
}) => {
  const { hasPermission } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentNav = NAV_ITEMS.find((item) => item.id === currentModule);
  const currentTitle = currentNav?.label || 'Dashboard';

  // Permission Guard for the current module
  const isPermitted = currentNav ? hasPermission(currentNav.requiredPermission) : true;

  return (
    <div className="h-screen max-h-screen w-full bg-slate-100 flex flex-col font-sans antialiased text-slate-900 overflow-hidden">
      {/* Top Header */}
      <Header
        currentModuleTitle={currentTitle}
        onOpenSearch={() => setIsSearchOpen(true)}
        onNavigate={onSelectModule}
      />

      {/* Body Layout: Sidebar + Main Content */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <Sidebar
          currentModule={currentModule}
          onSelectModule={onSelectModule}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        <main className="flex-1 min-h-0 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {isPermitted ? (
              children
            ) : (
              <AccessDeniedState
                onReturnToDashboard={() => onSelectModule('dashboard')}
                message={`Your assigned role does not have permission to view or manage the "${currentTitle}" module.`}
              />
            )}
          </div>
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={(mod) => {
          onSelectModule(mod);
        }}
      />
    </div>
  );
};
