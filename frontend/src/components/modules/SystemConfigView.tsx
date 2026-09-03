import React from 'react';
import { PageHeader } from '../shared/PageHeader';
import { Settings, Shield, Server, Lock, Database, BellRing, Save } from 'lucide-react';

export const SystemConfigView: React.FC<{ onNavigate: (mod: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="System Configuration & Parameters"
        subtitle="Global banking parameters, interest rate benchmark settings, settlement rules, and API gateways."
        breadcrumbs={[{ label: 'Configuration' }, { label: 'System Configuration', active: true }]}
        onHomeClick={() => onNavigate('dashboard')}
        primaryAction={{
          label: 'Save Configuration',
          icon: <Save className="w-4 h-4" />,
          onClick: () => alert('System parameters saved and synchronized to core banking services.'),
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Core Parameters */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Server className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">General Lending & Accounting Parameters</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Base Lending Rate (MCLR Benchmark %)</label>
              <input
                type="text"
                defaultValue="8.25%"
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Grace Period for Overdue (Days)</label>
              <input
                type="number"
                defaultValue={3}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cheque / NACH Bounce Penalty Fee (INR)</label>
              <input
                type="text"
                defaultValue="₹500.00"
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Security & Token Policy */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Lock className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Security, Session & Auth Rules</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Session Inactivity Timeout (Minutes)</label>
              <input
                type="number"
                defaultValue={15}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Maximum Consecutive Failed Sign-ins Before Lockout</label>
              <input
                type="number"
                defaultValue={5}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Two-Factor Authentication Enforcement</label>
              <select className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900 bg-white">
                <option>Mandatory for all Branch Staff & Management</option>
                <option>Mandatory for Credit Approvers Only</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
