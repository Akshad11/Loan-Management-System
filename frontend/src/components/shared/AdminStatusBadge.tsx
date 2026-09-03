import React from 'react';

interface AdminStatusBadgeProps {
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  size?: 'sm' | 'md';
}

export const AdminStatusBadge: React.FC<AdminStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const configs: Record<'ACTIVE' | 'INACTIVE' | 'SUSPENDED', { bg: string; text: string; border: string; dot: string }> = {
    ACTIVE: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      dot: 'bg-emerald-600',
    },
    INACTIVE: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-300',
      dot: 'bg-slate-500',
    },
    SUSPENDED: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dot: 'bg-amber-600',
    },
  };

  const config = configs[status] || configs.INACTIVE;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded border ${config.bg} ${config.text} ${config.border} ${padding} whitespace-nowrap`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status}
    </span>
  );
};
