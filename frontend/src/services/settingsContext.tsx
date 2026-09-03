'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { fetchPublicSettings, invalidateSettingsCache } from './settingsService';

interface SettingsContextType {
  /** Get a public setting value by key. Returns fallback if not loaded yet. */
  getSetting: (key: string, fallback?: string) => string;
  /** All loaded public settings */
  publicSettings: Record<string, string>;
  /** Whether settings have been loaded */
  isLoaded: boolean;
  /** Force refresh settings from API */
  refreshSettings: () => Promise<void>;
}

const DEFAULTS: Record<string, string> = {
  'application.name': 'Loan Management System',
  'application.shortName': 'LMS',
  'company.name': 'ABC Finance Pvt Ltd',
  'branding.primaryColor': '#2563eb',
  'branding.loginTagline': 'Empowering Financial Decisions',
  'localization.currency': 'INR',
  'localization.currencySymbol': '₹',
};

const SettingsContext = createContext<SettingsContextType>({
  getSetting: (key: string, fallback = '') => DEFAULTS[key] ?? fallback,
  publicSettings: DEFAULTS,
  isLoaded: false,
  refreshSettings: async () => {},
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [publicSettings, setPublicSettings] = useState<Record<string, string>>(DEFAULTS);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const settings = await fetchPublicSettings();
      setPublicSettings({ ...DEFAULTS, ...settings });
    } catch {
      // Keep defaults
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    invalidateSettingsCache();
    await loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const getSetting = useCallback(
    (key: string, fallback = '') => {
      return publicSettings[key] ?? DEFAULTS[key] ?? fallback;
    },
    [publicSettings]
  );

  return (
    <SettingsContext.Provider value={{ getSetting, publicSettings, isLoaded, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
