import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../utils/formatters';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  onHomeClick?: () => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '', onHomeClick }) => {
  return (
    <nav className={cn('flex items-center text-xs text-slate-500 font-medium', className)} aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1.5">
        <li className="inline-flex items-center">
          <button
            type="button"
            onClick={onHomeClick}
            className="inline-flex items-center hover:text-slate-900 transition-colors focus:outline-none"
            aria-label="Home"
          >
            <Home className="w-3.5 h-3.5 mr-1" />
            <span>LMS</span>
          </button>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={index} className="inline-flex items-center">
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 mx-1 shrink-0" />
              {isLast || item.active ? (
                <span className="text-slate-900 font-semibold truncate max-w-[200px]" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="hover:text-slate-900 transition-colors focus:outline-none truncate max-w-[150px]"
                >
                  {item.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
