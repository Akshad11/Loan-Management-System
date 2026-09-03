import React from 'react';
import { CustomerRecordStatus } from '../../types';
import { CheckCircle2, AlertCircle, Archive } from 'lucide-react';

interface CustomerStatusBadgeProps {
  status: CustomerRecordStatus;
  size?: 'sm' | 'md';
}

export const CustomerStatusBadge: React.FC<CustomerStatusBadgeProps> = ({ status, size = 'md' }) => {
  const isSm = size === 'sm';

  switch (status) {
    case 'ACTIVE':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 rounded ${
            isSm ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
          }`}
        >
          <CheckCircle2 className={isSm ? 'w-3 h-3 text-emerald-600' : 'w-3.5 h-3.5 text-emerald-600'} />
          <span>Active</span>
        </span>
      );
    case 'INACTIVE':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium bg-slate-100 text-slate-700 border border-slate-200 rounded ${
            isSm ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
          }`}
        >
          <AlertCircle className={isSm ? 'w-3 h-3 text-slate-500' : 'w-3.5 h-3.5 text-slate-500'} />
          <span>Inactive</span>
        </span>
      );
    case 'ARCHIVED':
      return (
        <span
          className={`inline-flex items-center gap-1 font-medium bg-amber-50 text-amber-800 border border-amber-200 rounded ${
            isSm ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
          }`}
        >
          <Archive className={isSm ? 'w-3 h-3 text-amber-600' : 'w-3.5 h-3.5 text-amber-600'} />
          <span>Archived</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 text-xs bg-slate-100 text-slate-800 rounded border border-slate-200">
          {status}
        </span>
      );
  }
};
