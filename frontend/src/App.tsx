'use client';

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './services/authContext';
import { SettingsProvider, useSettings } from './services/settingsContext';
import { LoginView } from './components/auth/LoginView';
import { AppShell } from './components/navigation/AppShell';
import { DashboardView } from './components/dashboard/DashboardView';
import { CustomersView } from './components/modules/CustomersView';
import { KycView } from './components/modules/KycView';
import { DocumentsView } from './components/modules/DocumentsView';
import { ConfigurationLayout } from './components/modules/ConfigurationLayout';
import { ApplicationsView } from './components/modules/ApplicationsView';
import { CreditAssessmentView } from './components/modules/CreditAssessmentView';
import { ApprovalsView } from './components/modules/ApprovalsView';
import { SanctionsView } from './components/modules/SanctionsView';
import { DisbursementsView } from './components/modules/DisbursementsView';
import { LoansView } from './components/modules/LoansView';
import { RepaymentsView } from './components/modules/RepaymentsView';
import { CollectionsView } from './components/modules/CollectionsView';
import { RecoveryView } from './components/modules/RecoveryView';
import { RestructuringView } from './components/modules/RestructuringView';
import { ChargesAdjustmentsView } from './components/modules/ChargesAdjustmentsView';
import { ClosuresNocView } from './components/modules/ClosuresNocView';
import { LoanProductsView } from './components/modules/LoanProductsView';
import { SystemConfigView } from './components/modules/SystemConfigView';
import { ReportsView } from './components/modules/ReportsView';
import { AuditView } from './components/modules/AuditView';
import { AdminView } from './components/modules/AdminView';
import { SessionExpiredState } from './components/shared/AccessDeniedState';

const MODULE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  customers: 'Customers',
  customer: 'Customers',
  kyc: 'KYC Verification',
  documents: 'Document Vault',
  applications: 'Loan Applications',
  application: 'Loan Applications',
  credit_assessment: 'Credit Assessment',
  approvals: 'Approval Matrix',
  approval: 'Approval Matrix',
  sanctions: 'Sanctions & Underwriting',
  sanction: 'Sanctions & Underwriting',
  disbursements: 'Disbursement Management',
  disbursement: 'Disbursement Management',
  loans: 'Active Loans & Portfolios',
  loan: 'Active Loans & Portfolios',
  repayments: 'Repayments & Dues',
  repayment: 'Repayments & Dues',
  collections: 'Collections & Delinquency',
  collection: 'Collections & Delinquency',
  recovery: 'Recovery & Legal Actions',
  restructuring: 'Loan Restructuring',
  charges_adjustments: 'Charges & Waivers',
  closures_noc: 'Settlement & NOC',
  loan_products: 'Loan Products & Form Builder',
  system_config: 'App & System Settings',
  users: 'User Directory',
  roles: 'Roles & Access Control',
  branches: 'Branch Management',
  users_roles: 'Access Management',
  reports: 'Financial Reports & Analytics',
  audit: 'System Audit Trail',
  admin: 'Administration & Master Settings',
};

const MainAppRouter: React.FC = () => {
  const { authState, resetToDefaultLogin } = useAuth();
  const { getSetting } = useSettings();
  const [currentModule, setCurrentModule] = useState<string>('dashboard');

  const appName = getSetting('application.name', 'FinTech LMS');

  // Synchronize dynamic browser title with branding & current module
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (authState === 'unauthenticated' || authState === 'authenticating') {
        document.title = `Corporate Sign In | ${appName}`;
      } else if (authState === 'session_expired') {
        document.title = `Session Expired | ${appName}`;
      } else {
        const title = MODULE_TITLES[currentModule] || 'Dashboard';
        document.title = `${title} | ${appName}`;
      }
    }
  }, [currentModule, authState, appName]);

  if (authState === 'unauthenticated' || authState === 'authenticating') {
    return <LoginView />;
  }

  if (authState === 'session_expired') {
    return <SessionExpiredState onSignIn={resetToDefaultLogin} />;
  }

  const renderModuleView = () => {
    switch (currentModule) {
      case 'dashboard':
        return <DashboardView onNavigate={(mod) => setCurrentModule(mod)} />;
      case 'customers':
      case 'customer':
        return <CustomersView onNavigate={(mod) => setCurrentModule(mod)} />;
      case 'kyc':
        return (
          <KycView
            currentUser="Alex Morgan"
            onNavigateToCustomer={() => {
              setCurrentModule('customers');
            }}
          />
        );
      case 'documents':
      case 'document':
        return (
          <DocumentsView
            currentUser="Alex Morgan"
            onNavigateToCustomer={() => {
              setCurrentModule('customers');
            }}
          />
        );
      case 'applications':
      case 'application':
        return (
          <ApplicationsView
            onNavigateToCustomer={() => {
              setCurrentModule('customers');
            }}
          />
        );
      case 'loans':
      case 'loan':
        return <LoansView onNavigate={(mod) => setCurrentModule(mod)} />;
      case 'repayments':
      case 'repayment':
        return <RepaymentsView onNavigate={(mod) => setCurrentModule(mod)} />;
      case 'collections':
      case 'collection':
        return <CollectionsView onNavigate={(mod) => setCurrentModule(mod)} />;
      case 'recovery':
        return <RecoveryView />;
      case 'restructuring':
        return <RestructuringView />;
      case 'charges_adjustments':
        return <ChargesAdjustmentsView />;
      case 'closures_noc':
        return <ClosuresNocView />;
      case 'credit_assessment':
        return (
          <CreditAssessmentView
            onNavigate={(mod) => setCurrentModule(mod)}
            onNavigateToApproval={() => {
              setCurrentModule('approvals');
            }}
          />
        );
      case 'approvals':
      case 'approval':
        return (
          <ApprovalsView
            onNavigateToCreditAssessment={() => {
              setCurrentModule('credit_assessment');
            }}
            onNavigateToApplication={() => {
              setCurrentModule('applications');
            }}
          />
        );
      case 'sanctions':
      case 'sanction':
        return <SanctionsView onNavigate={(mod) => setCurrentModule(mod)} />;
      case 'disbursements':
      case 'disbursement':
        return <DisbursementsView onNavigate={(mod) => setCurrentModule(mod)} />;
      case 'loan_products':
        return <LoanProductsView onNavigate={(mod) => setCurrentModule(mod)} />;
      case 'system_config':
        return <SystemConfigView onNavigate={(mod) => setCurrentModule(mod)} />;
      case 'users':
        return <ConfigurationLayout initialTab="users" onNavigateGlobal={(mod) => setCurrentModule(mod)} />;
      case 'roles':
        return <ConfigurationLayout initialTab="roles" onNavigateGlobal={(mod) => setCurrentModule(mod)} />;
      case 'branches':
        return <ConfigurationLayout initialTab="branches" onNavigateGlobal={(mod) => setCurrentModule(mod)} />;
      case 'users_roles':
        return <ConfigurationLayout initialTab="users" onNavigateGlobal={(mod) => setCurrentModule(mod)} />;
      case 'reports':
        return <ReportsView onNavigate={(mod) => setCurrentModule(mod)} />;
      case 'audit':
        return <AuditView onNavigate={(mod) => setCurrentModule(mod)} />;
      case 'admin':
        return <AdminView onNavigateGlobal={(mod) => setCurrentModule(mod)} />;
      default:
        return <DashboardView onNavigate={(mod) => setCurrentModule(mod)} />;
    }
  };

  return (
    <AppShell currentModule={currentModule} onSelectModule={setCurrentModule}>
      {renderModuleView()}
    </AppShell>
  );
};

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <MainAppRouter />
      </AuthProvider>
    </SettingsProvider>
  );
}
