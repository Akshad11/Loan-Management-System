import React from 'react';
import { ApplicationWorkflowStatus, ApplicationPriority } from '../../types/applicationTypes';

interface ApplicationStatusBadgeProps {
  status: ApplicationWorkflowStatus;
  size?: 'sm' | 'md';
}

export const ApplicationStatusBadge: React.FC<ApplicationStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const getStyles = () => {
    switch (status) {
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'SUBMITTED':
        return 'bg-blue-50 text-blue-700 border-blue-300';
      case 'UNDER_REVIEW':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'DOCUMENT_PENDING':
        return 'bg-yellow-50 text-yellow-800 border-yellow-300';
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'SANCTIONED':
        return 'bg-teal-50 text-teal-800 border-teal-300';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-300';
      case 'CANCELLED':
        return 'bg-neutral-100 text-neutral-500 border-neutral-300 line-through';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'DRAFT':
        return 'Draft';
      case 'SUBMITTED':
        return 'Submitted';
      case 'UNDER_REVIEW':
        return 'Under Review';
      case 'DOCUMENT_PENDING':
        return 'Docs Pending';
      case 'APPROVED':
        return 'Approved';
      case 'SANCTIONED':
        return 'Sanctioned';
      case 'REJECTED':
        return 'Rejected';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      id={`app-status-${status.toLowerCase()}`}
      className={`inline-flex items-center rounded-full border tracking-wide uppercase ${sizeClasses} ${getStyles()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70" />
      {getLabel()}
    </span>
  );
};

interface PriorityBadgeProps {
  priority: ApplicationPriority;
}

export const ApplicationPriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const getStyles = () => {
    switch (priority) {
      case 'CRITICAL':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'HIGH':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'MEDIUM':
        return 'text-sky-700 bg-sky-50 border-sky-200';
      case 'LOW':
        return 'text-slate-600 bg-slate-100 border-slate-200';
      default:
        return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border uppercase tracking-wider ${getStyles()}`}
    >
      {priority}
    </span>
  );
};
