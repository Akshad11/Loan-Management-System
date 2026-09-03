import React from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'textarea';
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  rows?: number;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  autoComplete?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  disabled,
  error,
  helperText,
  rows = 3,
  prefix,
  suffix,
  autoComplete,
}) => {
  const baseInputClass = `w-full rounded border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors ${
    error
      ? 'border-red-400 bg-red-50/20 focus:border-red-600 focus:ring-1 focus:ring-red-600'
      : 'border-slate-300 bg-white focus:border-slate-800 focus:ring-1 focus:ring-slate-800'
  } ${disabled ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : ''}`;

  return (
    <div className="space-y-1 text-left">
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
        {label} {required && <span className="text-red-600">*</span>}
      </label>

      <div className="relative flex items-center">
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-xs sm:text-sm">
            {prefix}
          </div>
        )}

        {type === 'textarea' ? (
          <textarea
            id={id}
            name={id}
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={`${baseInputClass} ${prefix ? 'pl-9' : ''} ${suffix ? 'pr-9' : ''}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          />
        ) : (
          <input
            id={id}
            name={id}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            autoComplete={autoComplete}
            className={`${baseInputClass} ${prefix ? 'pl-9' : ''} ${suffix ? 'pr-9' : ''}`}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          />
        )}

        {suffix && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-500 text-xs sm:text-sm">
            {suffix}
          </div>
        )}
      </div>

      {error ? (
        <p id={`${id}-error`} className="text-xs text-red-600 font-medium">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${id}-helper`} className="text-xs text-slate-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};
