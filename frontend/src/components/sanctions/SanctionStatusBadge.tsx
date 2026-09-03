import React from 'react';
import { SanctionStatus, LetterStatus, ReadinessCheckStatus } from '../../types/sanctionTypes';

interface SanctionStatusBadgeProps {
  status: SanctionStatus;
  size?: 'sm' | 'md';
}

export const SanctionStatusBadge: React.FC<SanctionStatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  switch (status) {
    case 'DRAFT':
      return (
        <span className={`inline-flex items-center font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>
          Draft
        </span>
      );
    case 'UNDER_REVIEW':
      return (
        <span className={`inline-flex items-center font-semibold rounded-md bg-sky-50 text-sky-800 border border-sky-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mr-1.5 animate-pulse"></span>
          Under Review
        </span>
      );
    case 'PENDING_CONFIRMATION':
      return (
        <span className={`inline-flex items-center font-semibold rounded-md bg-amber-50 text-amber-800 border border-amber-300 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>
          Pending Confirmation
        </span>
      );
    case 'SANCTIONED':
      return (
        <span className={`inline-flex items-center font-semibold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5"></span>
          Sanctioned
        </span>
      );
    case 'RETURNED':
      return (
        <span className={`inline-flex items-center font-semibold rounded-md bg-rose-50 text-rose-800 border border-rose-300 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
          Returned
        </span>
      );
    case 'CANCELLED':
      return (
        <span className={`inline-flex items-center font-semibold rounded-md bg-slate-100 text-slate-500 border border-slate-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>
          Cancelled
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
};

interface LetterStatusBadgeProps {
  status: LetterStatus;
  size?: 'sm' | 'md';
}

export const LetterStatusBadge: React.FC<LetterStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  switch (status) {
    case 'DRAFT':
      return (
        <span className={`inline-flex items-center font-semibold rounded-md bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses}`}>
          Letter Draft
        </span>
      );
    case 'GENERATED':
      return (
        <span className={`inline-flex items-center font-semibold rounded-md bg-blue-50 text-blue-800 border border-blue-200 ${sizeClasses}`}>
          Generated
        </span>
      );
    case 'ISSUED':
      return (
        <span className={`inline-flex items-center font-semibold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 ${sizeClasses}`}>
          Issued to Borrower
        </span>
      );
    case 'SUPERSEDED':
      return (
        <span className={`inline-flex items-center font-semibold rounded-md bg-slate-100 text-slate-500 border border-slate-200 line-through ${sizeClasses}`}>
          Superseded
        </span>
      );
    default:
      return <span className={`inline-flex items-center rounded-md ${sizeClasses}`}>{status}</span>;
  }
};

interface ReadinessBadgeProps {
  status: ReadinessCheckStatus;
  size?: 'sm' | 'md';
}

export const ReadinessBadge: React.FC<ReadinessBadgeProps> = ({ status, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  switch (status) {
    case 'PASS':
      return (
        <span className={`inline-flex items-center font-semibold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5"></span>
          PASS
        </span>
      );
    case 'PENDING':
      return (
        <span className={`inline-flex items-center font-semibold rounded-md bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
          PENDING
        </span>
      );
    case 'BLOCKED':
      return (
        <span className={`inline-flex items-center font-semibold rounded-md bg-rose-50 text-rose-800 border border-rose-200 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mr-1.5"></span>
          BLOCKED
        </span>
      );
    case 'NOT_APPLICABLE':
      return (
        <span className={`inline-flex items-center font-semibold rounded-md bg-slate-100 text-slate-500 border border-slate-200 ${sizeClasses}`}>
          N/A
        </span>
      );
    default:
      return <span className={`inline-flex items-center rounded-md ${sizeClasses}`}>{status}</span>;
  }
};
