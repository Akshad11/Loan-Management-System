import React from 'react';
import { Breadcrumbs, BreadcrumbItem } from './Breadcrumbs';
import { cn } from '../../utils/formatters';

interface PageHeaderProps {
  id?: string;
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  badge?: React.ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    disabled?: boolean;
    loading?: boolean;
  };
  secondaryActions?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    disabled?: boolean;
  }[];
  children?: React.ReactNode;
  className?: string;
  onHomeClick?: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  id,
  title,
  subtitle,
  breadcrumbs,
  badge,
  primaryAction,
  secondaryActions,
  children,
  className = '',
  onHomeClick,
}) => {
  return (
    <div id={id} className={cn('mb-6', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="mb-2">
          <Breadcrumbs items={breadcrumbs} onHomeClick={onHomeClick} />
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">{subtitle}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {children}

          {secondaryActions?.map((action, idx) => (
            <button
              key={idx}
              type="button"
              onClick={action.onClick}
              disabled={action.disabled}
              className="inline-flex items-center justify-center px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {action.icon && <span className="mr-1.5 shrink-0">{action.icon}</span>}
              {action.label}
            </button>
          ))}

          {primaryAction && (
            <button
              type="button"
              onClick={action => primaryAction.onClick()}
              disabled={primaryAction.disabled || primaryAction.loading}
              className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-slate-900 border border-slate-900 rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {primaryAction.loading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin mr-2" />
              ) : primaryAction.icon ? (
                <span className="mr-1.5 shrink-0">{primaryAction.icon}</span>
              ) : null}
              {primaryAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
