import React, { useEffect, useRef } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { cn } from '../../utils/formatters';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'warning';
  isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  isLoading = false,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      button: 'bg-rose-700 text-white hover:bg-rose-800 focus:ring-rose-700',
      icon: 'text-rose-600 bg-rose-50 border-rose-200',
    },
    primary: {
      button: 'bg-slate-900 text-white hover:bg-slate-800 focus:ring-slate-900',
      icon: 'text-slate-800 bg-slate-100 border-slate-200',
    },
    warning: {
      button: 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-600',
      icon: 'text-amber-600 bg-amber-50 border-amber-200',
    },
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 flex items-center justify-center p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-md w-full p-5 sm:p-6 relative text-left"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 disabled:opacity-50 p-1"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className={cn(
              'w-10 h-10 rounded-full border flex items-center justify-center shrink-0 mt-0.5',
              variantStyles[variant].icon
            )}
          >
            <AlertCircle className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 id="dialog-title" className="text-base font-bold text-slate-900 leading-6">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-50 transition-colors"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'px-4 py-2 text-xs sm:text-sm font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 transition-colors inline-flex items-center',
              variantStyles[variant].button
            )}
          >
            {isLoading && (
              <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin mr-2" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
