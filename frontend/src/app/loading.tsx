import React from 'react';
import { Landmark } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center shadow-lg">
            <Landmark className="w-8 h-8 text-blue-400 animate-pulse" />
          </div>
          <div className="absolute -inset-1 rounded-2xl border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-bold text-white tracking-tight">FinTech Banking Portal</p>
          <p className="text-xs text-slate-400">Loading enterprise session & workspace...</p>
        </div>
      </div>
    </div>
  );
}
