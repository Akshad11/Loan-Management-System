'use client';

import React from 'react';
import Link from 'next/link';
import { Landmark, Compass, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-slate-800/80 border border-slate-700/60 backdrop-blur-sm rounded-2xl p-8 shadow-2xl space-y-6">
        {/* Brand Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-700/50 border border-slate-600 text-slate-200 mb-2">
          <Landmark className="w-8 h-8 text-blue-400" />
        </div>

        <div className="space-y-2">
          <span className="inline-block text-xs font-mono font-bold tracking-widest text-blue-400 uppercase bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded">
            HTTP 404 — Page Not Found
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Resource Unavailable
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            The banking portal page or document you are looking for does not exist, has been relocated, or requires authenticated authorization.
          </p>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg border border-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>

        <div className="pt-4 border-t border-slate-700/40 text-[11px] text-slate-400">
          FinTech Loan Management System • Secure Enterprise Banking
        </div>
      </div>
    </div>
  );
}
