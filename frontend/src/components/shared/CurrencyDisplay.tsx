import React, { useState } from 'react';
import { formatINR, cn } from '../../utils/formatters';
import { Copy, Check } from 'lucide-react';

interface CurrencyDisplayProps {
  amount: number | null | undefined;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'positive' | 'negative' | 'warning' | 'muted';
  showPaisa?: boolean;
  copyable?: boolean;
  className?: string;
  alignRight?: boolean;
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  size = 'md',
  variant = 'default',
  showPaisa = true,
  copyable = false,
  className = '',
  alignRight = false,
}) => {
  const [copied, setCopied] = useState(false);

  const formatted = formatINR(amount, { showPaisa });

  const sizeClasses = {
    sm: 'text-xs font-medium',
    md: 'text-sm font-semibold',
    lg: 'text-base font-semibold',
    xl: 'text-xl font-bold tracking-tight',
  };

  const variantClasses = {
    default: 'text-slate-900',
    positive: 'text-emerald-700',
    negative: 'text-rose-700',
    warning: 'text-amber-800',
    muted: 'text-slate-600',
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <span
      className={cn(
        'inline-flex items-center tabular-nums font-sans',
        alignRight ? 'justify-end' : 'justify-start',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      <span>{formatted}</span>
      {copyable && (
        <button
          type="button"
          onClick={handleCopy}
          className="ml-1.5 p-0.5 text-slate-400 hover:text-slate-700 rounded transition-colors"
          title="Copy amount"
          aria-label={`Copy ${formatted}`}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      )}
    </span>
  );
};
