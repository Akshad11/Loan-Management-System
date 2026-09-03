import React from 'react';
import { ApplicationStatus, LoanStatus, CustomerStatus } from '../../types';
import { cn } from '../../utils/formatters';

type StatusType = ApplicationStatus | LoanStatus | CustomerStatus | 'VERIFIED' | 'PENDING' | 'REJECTED' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'ACTIVE' | 'INACTIVE' | 'SUCCESS' | 'FAILURE' | 'WARNING';

interface StatusBadgeProps {
  status: StatusType | string;
  size?: 'sm' | 'md';
  showDot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showDot = true,
  className = '',
}) => {
  const getStatusStyles = (s: string) => {
    const upper = s.toUpperCase();
    switch (upper) {
      case 'ACTIVE':
      case 'APPROVED':
      case 'DISBURSED':
      case 'VERIFIED':
      case 'SUCCESS':
        return {
          container: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-600',
          label: s.replace(/_/g, ' '),
        };
      case 'PENDING':
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
      case 'PENDING_KYC':
      case 'MEDIUM':
      case 'SANCTIONED':
      case 'CREDIT_ASSESSED':
        return {
          container: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-600',
          label: s.replace(/_/g, ' '),
        };
      case 'OVERDUE':
      case 'REJECTED':
      case 'NPA':
      case 'FAILURE':
      case 'HIGH':
      case 'URGENT':
      case 'SUSPENDED':
        return {
          container: 'bg-rose-50 text-rose-800 border-rose-200',
          dot: 'bg-rose-600',
          label: s.replace(/_/g, ' '),
        };
      case 'DRAFT':
      case 'CLOSED':
      case 'INACTIVE':
      case 'LOW':
      case 'CANCELLED':
      case 'DORMANT':
      default:
        return {
          container: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-500',
          label: s.replace(/_/g, ' '),
        };
    }
  };

  const style = getStatusStyles(status);

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium border rounded-md whitespace-nowrap tracking-tight',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        style.container,
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            'rounded-full mr-1.5 shrink-0',
            size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2',
            style.dot
          )}
          aria-hidden="true"
        />
      )}
      {style.label}
    </span>
  );
};
