import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  RefreshCw,
  TrendingUp,
  Clock,
  Send,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { useMockLMSStore } from '../../services/mockService';
import {
  ApplicationToolbarFilters,
  ApplicationFilters,
} from '../applications/ApplicationFilters';
import { ApplicationTable } from '../applications/ApplicationTable';
import { ApplicationFormModal } from '../applications/ApplicationFormModal';
import { ApplicationDetailsDrawer } from '../applications/ApplicationDetailsDrawer';
import { ApplicationSubmissionModal } from '../applications/ApplicationSubmissionModal';
import { ApplicationCancelModal } from '../applications/ApplicationCancelModal';
import {
  LoanApplicationRecord,
  SubmissionDeclarationState,
} from '../../types/applicationTypes';
import { formatCurrencyINR } from '../../utils/formatters';

interface ApplicationsViewProps {
  onNavigateToCustomer?: (customerId: string) => void;
}

export const ApplicationsView: React.FC<ApplicationsViewProps> = ({
  onNavigateToCustomer,
}) => {
  const {
    applications,
    loanProductsConfig,
    customers,
    branches,
    documents,
    createApplication,
    updateApplication,
    addCoApplicant,
    removeCoApplicant,
    addGuarantor,
    removeGuarantor,
    linkCustomerKycDocument,
    uploadApplicationDocument,
    verifyApplicationDocument,
    rejectApplicationDocument,
    removeApplicationDocument,
    validateApplicationForSubmission,
    submitApplication,
    cancelApplication,
  } = useMockLMSStore();

  // Filters State
  const [filters, setFilters] = useState<ApplicationToolbarFilters>({
    searchQuery: '',
    status: 'ALL',
    productCode: 'ALL',
    branchId: 'ALL',
    dateRange: 'ALL',
  });

  // Modal & Drawer State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<LoanApplicationRecord | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [submittingApp, setSubmittingApp] = useState<LoanApplicationRecord | null>(null);
  const [cancellingApp, setCancellingApp] = useState<LoanApplicationRecord | null>(null);

  // Active selected application
  const selectedApplication = useMemo(() => {
    return applications.find((a) => a.id === selectedApplicationId) || null;
  }, [applications, selectedApplicationId]);

  // Filtered Applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Search query
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesQuery =
          app.applicationNumber.toLowerCase().includes(q) ||
          app.customerName.toLowerCase().includes(q) ||
          app.customerNumber.toLowerCase().includes(q) ||
          app.customerMobile.includes(q) ||
          app.productName.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      // Status filter
      if (filters.status !== 'ALL' && app.status !== filters.status) {
        return false;
      }

      // Product filter
      if (filters.productCode !== 'ALL' && app.productCode !== filters.productCode) {
        return false;
      }

      // Branch filter
      if (filters.branchId !== 'ALL' && app.branchId !== filters.branchId) {
        return false;
      }

      return true;
    });
  }, [applications, filters]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalCount = applications.length;
    const totalRequested = applications.reduce((sum, a) => sum + a.requestedAmount, 0);

    const drafts = applications.filter((a) => a.status === 'DRAFT');
    const draftCount = drafts.length;
    const draftVolume = drafts.reduce((sum, a) => sum + a.requestedAmount, 0);

    const submitted = applications.filter((a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW');
    const submittedCount = submitted.length;
    const submittedVolume = submitted.reduce((sum, a) => sum + a.requestedAmount, 0);

    const pendingDocsCount = applications.filter((a) =>
      a.documents.some((d) => d.isMandatory && d.status !== 'VERIFIED')
    ).length;

    return {
      totalCount,
      totalRequested,
      draftCount,
      draftVolume,
      submittedCount,
      submittedVolume,
      pendingDocsCount,
    };
  }, [applications]);

  // Reset Filters
  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      status: 'ALL',
      productCode: 'ALL',
      branchId: 'ALL',
      dateRange: 'ALL',
    });
  };

  // Export to CSV simulation
  const handleExportCSV = () => {
    const headers = [
      'Application Number',
      'Date',
      'Customer Number',
      'Customer Name',
      'Product',
      'Requested Amount (INR)',
      'Tenure (Months)',
      'Interest Rate (%)',
      'Co-Applicants Count',
      'Guarantors Count',
      'Status',
    ];
    const rows = filteredApplications.map((a) => [
      a.applicationNumber,
      a.applicationDate,
      a.customerNumber,
      `"${a.customerName}"`,
      `"${a.productName}"`,
      a.requestedAmount,
      a.requestedTenureMonths,
      a.interestRate,
      a.coApplicants.length,
      a.guarantors.length,
      a.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Loan_Applications_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="loan-applications-view-root" className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-slate-800" />
            Loan Application Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Batch 5 Module: Origination, Multi-Party Co-Borrowers & Guarantors, Document Checklist Workbench, and Submission Gates.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="originate-app-btn"
            onClick={() => {
              setEditingApplication(null);
              setIsFormModalOpen(true);
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Originate Loan Application
          </button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Applications */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Pipeline Originations</span>
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-slate-600" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
            {metrics.totalCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Total Capital: <strong>{formatCurrencyINR(metrics.totalRequested)}</strong>
          </div>
        </div>

        {/* Draft Stage */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Draft & Assembling</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-2">
            {metrics.draftCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Draft Capital: <strong>{formatCurrencyINR(metrics.draftVolume)}</strong>
          </div>
        </div>

        {/* Under Review */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Submitted / Under Review</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <Send className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-blue-700 mt-2">
            {metrics.submittedCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Active Review: <strong>{formatCurrencyINR(metrics.submittedVolume)}</strong>
          </div>
        </div>

        {/* Action Required / Pending Docs */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Action Needed (Docs)</span>
            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700 mt-2">
            {metrics.pendingDocsCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Applications with pending mandatory items
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <ApplicationFilters
        filters={filters}
        onFilterChange={setFilters}
        branches={branches}
        products={loanProductsConfig.map((p) => ({ code: p.code, name: p.name }))}
        onReset={handleResetFilters}
        onExport={handleExportCSV}
        canExport={true}
      />

      {/* APPLICATION TABLE */}
      <ApplicationTable
        applications={filteredApplications}
        onSelectApplication={(app) => setSelectedApplicationId(app.id)}
        onEditApplication={(app) => {
          setEditingApplication(app);
          setIsFormModalOpen(true);
        }}
        onSubmitApplication={(app) => setSubmittingApp(app)}
        onCancelApplication={(app) => setCancellingApp(app)}
        canEdit={true}
        canSubmit={true}
        canCancel={true}
      />

      {/* CREATE / EDIT APPLICATION MODAL */}
      {isFormModalOpen && (
        <ApplicationFormModal
          isOpen={isFormModalOpen}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingApplication(null);
          }}
          onSubmit={(data) => {
            if (editingApplication) {
              updateApplication(editingApplication.id, data);
            } else {
              createApplication(data);
            }
          }}
          products={loanProductsConfig}
          customers={customers}
          branches={branches}
          editingApplication={editingApplication}
        />
      )}

      {/* FULL DETAILS DRAWER (WORKBENCH) */}
      {selectedApplication && (
        <ApplicationDetailsDrawer
          isOpen={!!selectedApplication}
          onClose={() => setSelectedApplicationId(null)}
          application={selectedApplication}
          products={loanProductsConfig}
          allCustomers={customers}
          branches={branches}
          customerVaultDocuments={documents.filter((d) => d.customerId === selectedApplication.customerId)}
          onEditTerms={(app) => {
            setEditingApplication(app);
            setIsFormModalOpen(true);
          }}
          onAddCoApplicant={(appId, payload) => addCoApplicant(appId, payload)}
          onRemoveCoApplicant={(appId, coAppId) => removeCoApplicant(appId, coAppId)}
          onAddGuarantor={(appId, payload) => addGuarantor(appId, payload)}
          onRemoveGuarantor={(appId, guarId) => removeGuarantor(appId, guarId)}
          onUploadDocument={(appId, payload) => uploadApplicationDocument(appId, payload)}
          onLinkKycDocument={(appId, docType, vaultDocId) => linkCustomerKycDocument(appId, docType, vaultDocId)}
          onVerifyDocument={(appId, docId, notes) => verifyApplicationDocument(appId, docId, 'Anita Deshmukh', notes || '')}
          onRejectDocument={(appId, docId, reason) => rejectApplicationDocument(appId, docId, 'Anita Deshmukh', reason)}
          onRemoveDocument={(appId, docId) => removeApplicationDocument(appId, docId)}
          onSubmitApplication={(appId, declarations) => {
            submitApplication(appId, declarations);
            setSelectedApplicationId(null);
          }}
          onCancelApplication={(appId, reason) => {
            cancelApplication(appId, reason);
            setSelectedApplicationId(null);
          }}
          onViewCustomerProfile={onNavigateToCustomer}
          validateForSubmission={(appId) => validateApplicationForSubmission(appId)}
        />
      )}

      {/* DIRECT SUBMISSION MODAL FROM TABLE */}
      {submittingApp && (
        <ApplicationSubmissionModal
          isOpen={!!submittingApp}
          onClose={() => setSubmittingApp(null)}
          application={submittingApp}
          validationResult={validateApplicationForSubmission(submittingApp.id)}
          onSubmit={(declarations) => {
            submitApplication(submittingApp.id, declarations);
            setSubmittingApp(null);
          }}
        />
      )}

      {/* DIRECT CANCELLATION MODAL FROM TABLE */}
      {cancellingApp && (
        <ApplicationCancelModal
          isOpen={!!cancellingApp}
          onClose={() => setCancellingApp(null)}
          application={cancellingApp}
          onConfirmCancel={(reason) => {
            cancelApplication(cancellingApp.id, reason);
            setCancellingApp(null);
          }}
        />
      )}
    </div>
  );
};
