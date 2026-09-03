import React from 'react';
import { ApprovalStatus, ExceptionStatus, ConditionStatus } from '../../types/approvalTypes';

interface StatusBadgeProps {
  status: ApprovalStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const ApprovalStatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs font-semibold',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  switch (status) {
    case 'PENDING':
      return (
        <span
          id={`badge-approval-pending`}
          className={`inline-flex items-center gap-1.5 rounded border border-amber-300 bg-amber-50 text-amber-900 ${sizeClasses[size]}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
          Pending Approval
        </span>
      );
    case 'ASSIGNED':
      return (
        <span
          id={`badge-approval-assigned`}
          className={`inline-flex items-center gap-1.5 rounded border border-blue-300 bg-blue-50 text-blue-900 ${sizeClasses[size]}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
          Assigned
        </span>
      );
    case 'IN_REVIEW':
      return (
        <span
          id={`badge-approval-in-review`}
          className={`inline-flex items-center gap-1.5 rounded border border-indigo-300 bg-indigo-50 text-indigo-900 ${sizeClasses[size]}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
          In Review
        </span>
      );
    case 'RETURNED':
      return (
        <span
          id={`badge-approval-returned`}
          className={`inline-flex items-center gap-1.5 rounded border border-purple-300 bg-purple-50 text-purple-900 ${sizeClasses[size]}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
          Returned for Info
        </span>
      );
    case 'APPROVED':
      return (
        <span
          id={`badge-approval-approved`}
          className={`inline-flex items-center gap-1.5 rounded border border-emerald-400 bg-emerald-50 text-emerald-950 ${sizeClasses[size]}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-700" />
          Approved
        </span>
      );
    case 'REJECTED':
      return (
        <span
          id={`badge-approval-rejected`}
          className={`inline-flex items-center gap-1.5 rounded border border-rose-300 bg-rose-50 text-rose-900 ${sizeClasses[size]}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
          Rejected
        </span>
      );
    case 'CANCELLED':
      return (
        <span
          id={`badge-approval-cancelled`}
          className={`inline-flex items-center gap-1.5 rounded border border-slate-300 bg-slate-100 text-slate-700 ${sizeClasses[size]}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
          Cancelled
        </span>
      );
    default:
      return (
        <span
          id={`badge-approval-default`}
          className={`inline-flex items-center gap-1.5 rounded border border-slate-300 bg-slate-50 text-slate-800 ${sizeClasses[size]}`}
        >
          {status}
        </span>
      );
  }
};

export const ConditionStatusBadge: React.FC<{ status: ConditionStatus }> = ({ status }) => {
  switch (status) {
    case 'OPEN':
      return (
        <span className="inline-flex items-center rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900">
          Open
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-900">
          Completed
        </span>
      );
    case 'WAIVED':
      return (
        <span className="inline-flex items-center rounded border border-purple-300 bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-900">
          Waived
        </span>
      );
    case 'NOT_APPLICABLE':
      return (
        <span className="inline-flex items-center rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
          N/A
        </span>
      );
    default:
      return <span className="text-xs">{status}</span>;
  }
};

export const ExceptionStatusBadge: React.FC<{ status: ExceptionStatus }> = ({ status }) => {
  switch (status) {
    case 'PENDING':
      return (
        <span className="inline-flex items-center rounded border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900">
          Pending
        </span>
      );
    case 'SUBMITTED':
      return (
        <span className="inline-flex items-center rounded border border-blue-300 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-900">
          Routed / In Review
        </span>
      );
    case 'APPROVED':
      return (
        <span className="inline-flex items-center rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-900">
          Authorized
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center rounded border border-rose-300 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-900">
          Declined
        </span>
      );
    case 'WITHDRAWN':
      return (
        <span className="inline-flex items-center rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
          Withdrawn
        </span>
      );
    default:
      return <span className="text-xs">{status}</span>;
  }
};

export const PriorityBadge: React.FC<{ priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL' }> = ({ priority }) => {
  switch (priority) {
    case 'CRITICAL':
      return (
        <span className="inline-flex items-center rounded border border-rose-300 bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-950">
          Critical
        </span>
      );
    case 'HIGH':
      return (
        <span className="inline-flex items-center rounded border border-amber-300 bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-950">
          High
        </span>
      );
    case 'NORMAL':
      return (
        <span className="inline-flex items-center rounded border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
          Normal
        </span>
      );
    case 'LOW':
      return (
        <span className="inline-flex items-center rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-normal text-slate-600">
          Low
        </span>
      );
    default:
      return <span className="text-xs">{priority}</span>;
  }
};
