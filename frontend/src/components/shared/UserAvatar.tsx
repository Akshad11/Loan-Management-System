import React from 'react';
import { getInitials } from '../../utils/formatters';

interface UserAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  size = 'md',
  status,
}) => {
  const initials = getInitials(name);

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-xs font-semibold',
    lg: 'w-12 h-12 text-sm font-bold',
  };

  const statusIndicatorClasses = {
    ACTIVE: 'bg-emerald-500',
    INACTIVE: 'bg-slate-400',
    SUSPENDED: 'bg-amber-500',
  };

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <div
        className={`${sizeClasses[size]} rounded bg-slate-800 text-slate-100 flex items-center justify-center font-mono tracking-tight select-none border border-slate-700`}
        title={name}
      >
        {initials}
      </div>
      {status && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 block w-2.5 h-2.5 rounded-full ring-2 ring-white ${statusIndicatorClasses[status]}`}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
};
