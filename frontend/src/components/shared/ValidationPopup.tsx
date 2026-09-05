import React, { useEffect } from 'react';
import { AlertTriangle, AlertCircle, X, CheckCircle2 } from 'lucide-react';

interface ValidationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  errors: string[] | Record<string, string>;
  onFixErrors?: () => void;
  fixLabel?: string;
}

export const ValidationPopup: React.FC<ValidationPopupProps> = ({
  isOpen,
  onClose,
  title = 'Validation Incomplete',
  subtitle = 'Please resolve the following requirements before proceeding:',
  errors,
  onFixErrors,
  fixLabel = 'Review & Fix Fields',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const errorList: string[] = Array.isArray(errors)
    ? errors.filter(Boolean)
    : Object.values(errors).filter(Boolean);

  if (errorList.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="validation-popup-title"
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-rose-200 overflow-hidden transform transition-all animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with prominent alert styling */}
        <div className="bg-rose-50 border-b border-rose-100 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl shadow-xs">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 id="validation-popup-title" className="text-sm font-bold text-rose-950">
                {title}
              </h3>
              <p className="text-xs text-rose-700 mt-0.5">
                {errorList.length} issue{errorList.length > 1 ? 's' : ''} detected
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-rose-100/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error list body */}
        <div className="p-6 space-y-3.5 overflow-y-auto flex-1">
          <p className="text-xs text-slate-600 font-medium">
            {subtitle}
          </p>

          <ul className="space-y-2.5">
            {errorList.map((errMsg, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-xs text-rose-800 bg-rose-50/80 p-3 rounded-xl border border-rose-100/80 shadow-xs"
              >
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{errMsg}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-lg border border-slate-300 transition-colors"
          >
            Dismiss
          </button>

          <button
            type="button"
            onClick={() => {
              if (onFixErrors) {
                onFixErrors();
              }
              onClose();
            }}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1 transition-all"
          >
            {fixLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
