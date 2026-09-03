import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { GlobalSearch } from './GlobalSearch';
import { NAV_ITEMS } from './navConfig';
import { useAuth } from '../../services/authContext';
import { AccessDeniedState } from '../shared/AccessDeniedState';
import { X } from 'lucide-react';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const handleSelectModule = (mod: string) => {
    setIsMobileMenuOpen(false);
    onSelectModule(mod);
  };

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
        onNavigate={handleSelectModule}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Body Layout: Sidebar + Main Content */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex h-full">
          <Sidebar
            currentModule={currentModule}
            onSelectModule={handleSelectModule}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>

        {/* Mobile Slide-over Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer Container */}
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-2xl z-50">
              <div className="h-14 px-4 border-b border-slate-200 flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Navigation Menu
                </span>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto">
                <Sidebar
                  currentModule={currentModule}
                  onSelectModule={handleSelectModule}
                  isCollapsed={false}
                  onToggleCollapse={() => {}}
                />
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 min-h-0 overflow-y-auto bg-slate-50 p-3 sm:p-5 lg:p-7 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {isPermitted ? (
              children
            ) : (
              <AccessDeniedState
                onReturnToDashboard={() => handleSelectModule('dashboard')}
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
          handleSelectModule(mod);
        }}
      />
    </div>
  );
};
