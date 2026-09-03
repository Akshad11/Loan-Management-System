import React from 'react';
import { KycStatus } from '../../types';
import { CheckCircle2, Clock, AlertTriangle, XCircle, AlertOctagon, ShieldAlert, PauseCircle } from 'lucide-react';

interface KycStatusBadgeProps {
  status: KycStatus;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const KycStatusBadge: React.FC<KycStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
}) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'VERIFIED':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          label: 'KYC Verified',
          icon: CheckCircle2,
        };
      case 'PENDING_REVIEW':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          label: 'Pending Review',
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
          label: 'KYC Rejected',
          icon: XCircle,
        };
      case 'EXPIRED':
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          label: 'KYC Expired',
          icon: AlertOctagon,
        };
      case 'SUSPENDED':
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-300',
          label: 'Suspended',
          icon: PauseCircle,
        };
      case 'UNVERIFIED':
      default:
        return {
          bg: 'bg-slate-100 text-slate-600 border-slate-200',
          label: 'Unverified',
          icon: ShieldAlert,
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded border ${config.bg} ${sizeClasses}`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{config.label}</span>
    </span>
  );
};
