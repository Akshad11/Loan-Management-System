'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../services/authContext';
import { fetchAllSettings, updateSettings, invalidateSettingsCache } from '../../services/settingsService';
import { useSettings } from '../../services/settingsContext';
import {
  Settings, Building2, Palette, Globe, Shield, Save, RefreshCw,
  CheckCircle2, AlertCircle, Loader2, Upload, X
} from 'lucide-react';

type SettingsTab = 'general' | 'company' | 'branding' | 'localization' | 'security';

const TABS: { id: SettingsTab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'company', label: 'Company', icon: Building2 },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'localization', label: 'Localization', icon: Globe },
  { id: 'security', label: 'Security', icon: Shield },
];

interface FieldConfig {
  key: string;
  label: string;
  description?: string;
  type?: 'text' | 'email' | 'url' | 'tel' | 'number' | 'color' | 'password' | 'select';
  options?: { value: string; label: string }[];
  placeholder?: string;
  sensitive?: boolean;
}

const FIELD_GROUPS: Record<SettingsTab, { title: string; fields: FieldConfig[] }[]> = {
  general: [
    {
      title: 'Application Identity',
      fields: [
        { key: 'application.name', label: 'Application Name', description: 'Full name shown in browser title and headers', placeholder: 'Loan Management System' },
        { key: 'application.shortName', label: 'Short Name', description: 'Abbreviated name for sidebar and compact views', placeholder: 'LMS' },
        { key: 'application.version', label: 'Version', description: 'Current application version', placeholder: '2.4.0' },
        { key: 'application.supportEmail', label: 'Support Email', type: 'email', description: 'Contact email shown to users', placeholder: 'support@example.com' },
        { key: 'application.supportPhone', label: 'Support Phone', type: 'tel', description: 'Support helpline number', placeholder: '+91 98765 43210' },
        { key: 'application.website', label: 'Website URL', type: 'url', description: 'Organization website', placeholder: 'https://example.com' },
      ],
    },
  ],
  company: [
    {
      title: 'Company Information',
      fields: [
        { key: 'company.name', label: 'Company Name', description: 'Trading/commercial name', placeholder: 'ABC Finance Pvt Ltd' },
        { key: 'company.legalName', label: 'Legal Company Name', description: 'Full legal registered name', placeholder: 'ABC Finance Private Limited' },
        { key: 'company.registrationNumber', label: 'Registration / CIN Number', description: 'Company registration number', placeholder: 'CIN/U65923/MH/2018/PTC123456' },
        { key: 'company.gstNumber', label: 'GST Number', description: 'Goods and Services Tax identification', placeholder: 'GSTIN27AABCA1234C1Z5' },
        { key: 'company.panNumber', label: 'PAN Number', description: 'Permanent Account Number', placeholder: 'AABCA1234C' },
        { key: 'company.email', label: 'Company Email', type: 'email', description: 'Primary contact email', placeholder: 'info@example.com' },
        { key: 'company.phone', label: 'Company Phone', type: 'tel', description: 'Primary contact phone', placeholder: '+91 22 6789 0123' },
      ],
    },
    {
      title: 'Registered Office Address',
      fields: [
        { key: 'company.addressLine1', label: 'Address Line 1', placeholder: 'Building, Street' },
        { key: 'company.addressLine2', label: 'Address Line 2', placeholder: 'Area / Locality' },
        { key: 'company.city', label: 'City', placeholder: 'Mumbai' },
        { key: 'company.state', label: 'State', placeholder: 'Maharashtra' },
        { key: 'company.pincode', label: 'PIN Code', placeholder: '400001' },
        { key: 'company.country', label: 'Country', placeholder: 'India' },
      ],
    },
  ],
  branding: [
    {
      title: 'Visual Identity',
      fields: [
        { key: 'branding.primaryColor', label: 'Primary Color', type: 'color', description: 'Main brand color used in accents and buttons' },
        { key: 'branding.loginTagline', label: 'Login Page Tagline', description: 'Shown below the company name on the sign-in page', placeholder: 'Empowering Financial Decisions' },
      ],
    },
  ],
  localization: [
    {
      title: 'Regional Settings',
      fields: [
        { key: 'localization.currency', label: 'Currency Code', type: 'select', options: [{ value: 'INR', label: 'INR — Indian Rupee' }, { value: 'USD', label: 'USD — US Dollar' }, { value: 'EUR', label: 'EUR — Euro' }] },
        { key: 'localization.currencySymbol', label: 'Currency Symbol', placeholder: '₹' },
        { key: 'localization.timezone', label: 'Timezone', type: 'select', options: [{ value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST +5:30)' }, { value: 'UTC', label: 'UTC' }, { value: 'America/New_York', label: 'America/New_York (ET)' }] },
        { key: 'localization.dateFormat', label: 'Date Format', type: 'select', options: [{ value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' }, { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' }, { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' }] },
        { key: 'localization.language', label: 'Language', type: 'select', options: [{ value: 'en-IN', label: 'English (India)' }, { value: 'en-US', label: 'English (US)' }] },
      ],
    },
  ],
  security: [
    {
      title: 'Session & Authentication',
      fields: [
        { key: 'security.sessionTimeoutMinutes', label: 'Session Timeout (minutes)', type: 'number', description: 'Auto-logout after inactivity period', placeholder: '30' },
        { key: 'security.maxFailedLogins', label: 'Max Failed Login Attempts', type: 'number', description: 'Account is locked after this many consecutive failures', placeholder: '5' },
        { key: 'security.passwordMinLength', label: 'Minimum Password Length', type: 'number', description: 'Minimum character count for user passwords', placeholder: '8' },
        { key: 'security.requireMfa', label: 'Require Multi-Factor Authentication', type: 'select', options: [{ value: 'false', label: 'Disabled' }, { value: 'true', label: 'Enabled (all users)' }], description: 'Enforce MFA for all logins' },
      ],
    },
  ],
};

export const AppSettingsPanel: React.FC = () => {
  const { user } = useAuth();
  const { refreshSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [values, setValues] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [logoPreview, setLogoPreview] = useState<string>('');

  const loadSettings = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { flat } = await fetchAllSettings(user.id);
      const flatMap: Record<string, string> = {};
      for (const s of flat) {
        flatMap[s.key] = s.value;
      }
      setValues(flatMap);
      if (flatMap['branding.logo']) setLogoPreview(flatMap['branding.logo']);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setDirty((prev) => ({ ...prev, [key]: true }));
    setSaveStatus('idle');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, SVG).');
      return;
    }
    if (file.size > 500 * 1024) {
      setErrorMsg('Logo file size must be under 500KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setLogoPreview(dataUrl);
      handleChange('branding.logo', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user?.id) return;
    const dirtyUpdates: Record<string, string> = {};
    for (const [key, isDirty] of Object.entries(dirty)) {
      if (isDirty && values[key] !== undefined) {
        dirtyUpdates[key] = values[key];
      }
    }

    if (Object.keys(dirtyUpdates).length === 0) {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
      return;
    }

    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await updateSettings(user.id, dirtyUpdates);
      setDirty({});
      setSaveStatus('success');
      await refreshSettings(); // Propagate to context
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err: any) {
      setSaveStatus('error');
      setErrorMsg(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const hasDirtyFields = Object.values(dirty).some(Boolean);
  const currentGroups = FIELD_GROUPS[activeTab];

  return (
    <div className="space-y-0">
      {/* Tab Bar */}
      <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1 border border-slate-200 overflow-x-auto mb-5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="ml-2 text-sm text-slate-500">Loading settings...</span>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Branding logo special panel */}
          {activeTab === 'branding' && (
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">Logo & Favicon</h3>
                <p className="text-xs text-slate-500 mt-1">Upload your organization logo. Recommended: PNG or SVG, max 500KB.</p>
              </div>
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  {logoPreview ? (
                    <div className="relative w-24 h-24 border border-slate-200 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center">
                      <img src={logoPreview} alt="Logo preview" className="max-w-full max-h-full object-contain p-2" />
                      <button
                        type="button"
                        onClick={() => { setLogoPreview(''); handleChange('branding.logo', ''); }}
                        className="absolute top-1 right-1 bg-red-100 rounded-full p-0.5 hover:bg-red-200"
                      >
                        <X className="w-3 h-3 text-red-600" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50">
                      <span className="text-xs text-slate-400 text-center px-2">No logo</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg cursor-pointer hover:bg-slate-700 transition-colors w-fit">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Logo
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                  <p className="text-xs text-slate-500">Accepted formats: PNG, JPG, SVG. Max size: 500KB.<br />The logo will be displayed in the navigation sidebar and login page.</p>
                </div>
              </div>
            </div>
          )}

          {/* Field groups */}
          {currentGroups.map((group) => (
            <div key={group.title} className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">{group.title}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.fields.map((field) => (
                  <div key={field.key} className={field.key.includes('address') || field.key === 'application.name' || field.key === 'company.legalName' ? 'md:col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {field.label}
                      {dirty[field.key] && (
                        <span className="ml-2 text-[10px] text-amber-600 font-medium">Unsaved</span>
                      )}
                    </label>
                    {field.description && (
                      <p className="text-[11px] text-slate-400 mb-1">{field.description}</p>
                    )}
                    {field.type === 'select' ? (
                      <select
                        value={values[field.key] ?? ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      >
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    ) : field.type === 'color' ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={values[field.key] ?? '#2563eb'}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          className="w-10 h-8 border border-slate-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={values[field.key] ?? '#2563eb'}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        />
                      </div>
                    ) : (
                      <input
                        type={field.type || 'text'}
                        value={values[field.key] ?? ''}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Save Bar */}
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-5 py-3">
            <div className="flex items-center gap-2">
              {saveStatus === 'success' && (
                <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Settings saved successfully
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-1.5 text-red-600 text-xs font-medium">
                  <AlertCircle className="w-4 h-4" />
                  {errorMsg || 'Failed to save settings'}
                </div>
              )}
              {hasDirtyFields && saveStatus === 'idle' && (
                <span className="text-xs text-amber-600 font-medium">You have unsaved changes</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadSettings}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !hasDirtyFields}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving...</>
                ) : (
                  <><Save className="w-3.5 h-3.5" />Save Changes</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
