'use client';

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './services/authContext';
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

const MainAppRouter: React.FC = () => {
  const { authState, resetToDefaultLogin } = useAuth();
  const [currentModule, setCurrentModule] = useState<string>('dashboard');

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
        return <CustomersView onNavigate={(mod) => setCurrentModule(mod)} />;
      case 'kyc':
        return (
          <KycView
            currentUser="Alex Morgan"
            onNavigateToCustomer={(custId) => {
              setCurrentModule('customers');
            }}
          />
        );
      case 'documents':
        return (
          <DocumentsView
            currentUser="Alex Morgan"
            onNavigateToCustomer={(custId) => {
              setCurrentModule('customers');
            }}
          />
        );
      case 'applications':
        return (
          <ApplicationsView
            onNavigateToCustomer={(custId) => {
              setCurrentModule('customers');
            }}
          />
        );
      case 'loans':
        return <LoansView onNavigate={(mod) => setCurrentModule(mod)} />;
      case 'repayments':
        return <RepaymentsView onNavigate={(mod) => setCurrentModule(mod)} />;
      case 'collections':
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
            onNavigateToApproval={(apprId) => {
              setCurrentModule('approvals');
            }}
          />
        );
      case 'approvals':
        return (
          <ApprovalsView
            onNavigateToCreditAssessment={(caId) => {
              setCurrentModule('credit_assessment');
            }}
            onNavigateToApplication={(appId) => {
              setCurrentModule('applications');
            }}
          />
        );
      case 'sanctions':
        return <SanctionsView onNavigate={(mod) => setCurrentModule(mod)} />;
      case 'disbursements':
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
    <AuthProvider>
      <MainAppRouter />
    </AuthProvider>
  );
}
