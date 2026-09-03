import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { cn } from '../../utils/formatters';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  actionLabel?: string;
  inline?: boolean;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Data could not be loaded',
  message = 'An unexpected error occurred while communicating with the service.',
  onRetry,
  actionLabel = 'Retry Request',
  inline = false,
  className = '',
}) => {
  if (inline) {
    return (
      <div
        className={cn(
          'p-4 bg-rose-50/70 border border-rose-200 rounded-lg flex items-center justify-between gap-3 text-xs text-rose-900',
          className
        )}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{message}</span>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1 font-semibold text-rose-800 hover:text-rose-950 underline shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {actionLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-white border border-rose-200 rounded-lg p-8 text-center flex flex-col items-center justify-center max-w-md mx-auto my-8',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-600 mb-5 max-w-sm">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};
