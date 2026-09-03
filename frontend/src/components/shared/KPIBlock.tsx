import React from 'react';
import { cn, formatINR } from '../../utils/formatters';
import { ArrowUpRight, ArrowDownRight, Minus, AlertCircle } from 'lucide-react';

export interface KPIBlockProps {
  id?: string;
  title: string;
  value: string | number;
  isCurrency?: boolean;
  subtext?: string;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
    label?: string;
    isPositive?: boolean;
  };
  badgeText?: string;
  badgeVariant?: 'neutral' | 'warning' | 'danger' | 'success';
  alert?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const KPIBlock: React.FC<KPIBlockProps> = ({
  id,
  title,
  value,
  isCurrency = false,
  subtext,
  trend,
  badgeText,
  badgeVariant = 'neutral',
  alert = false,
  icon,
  onClick,
  className = '',
}) => {
  const displayValue = isCurrency && typeof value === 'number' ? formatINR(value) : value;

  const badgeStyles = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-800 border-rose-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  };

  return (
    <div
      id={id}
      onClick={onClick}
      className={cn(
        'bg-white rounded-lg border border-slate-200 p-4 transition-colors',
        alert ? 'border-amber-300 bg-amber-50/20' : 'hover:border-slate-300',
        onClick ? 'cursor-pointer' : '',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">
          {title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {badgeText && (
            <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded border', badgeStyles[badgeVariant])}>
              {badgeText}
            </span>
          )}
          {icon && <div className="text-slate-400">{icon}</div>}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums truncate">
          {displayValue}
        </div>
      </div>

      {(subtext || trend || alert) && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 gap-2">
          {subtext && <span className="truncate">{subtext}</span>}
          {trend && (
            <span
              className={cn(
                'inline-flex items-center font-medium shrink-0 tabular-nums',
                trend.isPositive === true
                  ? 'text-emerald-700'
                  : trend.isPositive === false
                  ? 'text-rose-700'
                  : 'text-slate-600'
              )}
            >
              {trend.direction === 'up' && <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />}
              {trend.direction === 'down' && <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
              {trend.direction === 'neutral' && <Minus className="w-3.5 h-3.5 mr-0.5" />}
              {trend.value}
              {trend.label && <span className="text-slate-500 ml-1 font-normal">{trend.label}</span>}
            </span>
          )}
          {alert && (
            <span className="inline-flex items-center text-amber-800 font-medium shrink-0">
              <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />
              Action required
            </span>
          )}
        </div>
      )}
    </div>
  );
};
