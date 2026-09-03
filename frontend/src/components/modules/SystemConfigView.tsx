'use client';

import React from 'react';
import { PageHeader } from '../shared/PageHeader';
import { AppSettingsPanel } from '../admin/AppSettingsPanel';
import { useSettings } from '../../services/settingsContext';

export const SystemConfigView: React.FC<{ onNavigate: (mod: string) => void }> = ({ onNavigate }) => {
  const { getSetting } = useSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="App & System Settings"
        subtitle={`Configure ${getSetting('application.name', 'Loan Management System')} application identity, branding, company details, and security policies.`}
        breadcrumbs={[
          { label: 'Configuration' },
          { label: 'App & System Settings', active: true },
        ]}
        onHomeClick={() => onNavigate('dashboard')}
      />

      <AppSettingsPanel />
    </div>
  );
};

