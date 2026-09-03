import React from 'react';
import { DocumentStatus } from '../../types';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  AlertOctagon,
  ShieldCheck,
  Ban,
} from 'lucide-react';

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  size?: 'sm' | 'md';
}

export const DocumentStatusBadge: React.FC<DocumentStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const getConfig = () => {
    switch (status) {
      case 'VERIFIED':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          label: 'Verified',
          icon: CheckCircle2,
        };
      case 'PENDING_VERIFICATION':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          label: 'Pending Verification',
          icon: Clock,
        };
      case 'ACTION_REQUIRED':
        return {
          bg: 'bg-orange-50 text-orange-800 border-orange-300',
          label: 'Action Required',
          icon: AlertTriangle,
        };
      case 'REJECTED':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          label: 'Rejected',
          icon: XCircle,
        };
      case 'EXPIRED':
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-400',
          label: 'Expired',
          icon: AlertOctagon,
        };
      case 'EXPIRING_SOON':
        return {
          bg: 'bg-yellow-50 text-yellow-900 border-yellow-300',
          label: 'Expiring Soon',
          icon: Clock,
        };
      case 'WAIVED':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-300',
          label: 'Waived by Credit',
          icon: ShieldCheck,
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          label: 'Unknown',
          icon: Ban,
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded border ${config.bg} ${sizeClasses}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
};
