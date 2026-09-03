'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Intentionally omit sensitive internal stack in production logging
    console.error('Portal Application Error Boundary Caught:', error.digest || error.message);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-slate-800/80 border border-slate-700/60 backdrop-blur-sm rounded-2xl p-8 shadow-2xl space-y-6">
        {/* Warning Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-2">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="inline-block text-xs font-mono font-bold tracking-widest text-rose-400 uppercase bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded">
            System Notice
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            An Unexpected Problem Occurred
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            The banking platform encountered an unhandled exception while rendering this module. Sensitive session details remain protected.
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono text-slate-400 pt-1">
              Ref ID: <span className="text-slate-300">{error.digest}</span>
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = '/';
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg border border-slate-600 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Reload Platform</span>
          </button>
        </div>

        <div className="pt-4 border-t border-slate-700/40 text-[11px] text-slate-400">
          FinTech Loan Management System • Secure Enterprise Banking
        </div>
      </div>
    </div>
  );
}
