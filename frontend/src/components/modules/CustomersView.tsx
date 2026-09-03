import React, { useState, useMemo } from 'react';
import {
  CustomerRecord,
  CustomerFilterState,
  DEFAULT_CUSTOMER_FILTERS,
} from '../../types';
import { useMockLMSStore } from '../../services/mockService';
import { CustomerTable } from '../customers/CustomerTable';
import { CustomerSearch } from '../customers/CustomerSearch';
import { CustomerFilters } from '../customers/CustomerFilters';
import { CustomerForm } from '../customers/CustomerForm';
import { CustomerHeader } from '../customers/CustomerHeader';
import { CustomerSummary } from '../customers/CustomerSummary';
import { CustomerInfoSection } from '../customers/CustomerInfoSection';
import { CustomerApplications } from '../customers/CustomerApplications';
import { CustomerLoans } from '../customers/CustomerLoans';
import { CustomerTimeline } from '../customers/CustomerTimeline';
import { CustomerKycSection } from '../customers/CustomerKycSection';
import { CustomerDocumentSection } from '../customers/CustomerDocumentSection';
import { DuplicateCustomerDialog } from '../customers/DuplicateCustomerDialog';
import { CustomerArchiveDialog } from '../customers/CustomerArchiveDialog';
import { formatIndianCurrency } from '../../utils/formatters';
import {
  UserPlus,
  Users,
  ShieldCheck,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface CustomersViewProps {
  initialCustomerId?: string;
  onNavigate?: (moduleName: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ initialCustomerId, onNavigate }) => {
  const store = useMockLMSStore();
  const {
    customers,
    branches,
    createCustomer,
    updateCustomer,
    archiveCustomer,
    restoreCustomer,
    findPossibleDuplicates,
    getCustomerApplications,
    getCustomerLoans,
    getCustomerHistory,
    kycRecords,
    documents,
    checklistRequirements,
    verifyKyc,
    rejectKyc,
    requestKycAction,
    updateKycRisk,
    triggerGovernmentApiVerification,
    uploadDocument,
    verifyDocument,
    rejectDocument,
    waiveDocument,
    deleteDocument,
    renewDocument,
    sendDocumentExpiryReminder,
  } = store;

  // View state
  const [viewMode, setViewMode] = useState<'LIST' | 'DETAILS' | 'CREATE' | 'EDIT'>('LIST');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    initialCustomerId || null
  );
  const [activeDetailTab, setActiveDetailTab] = useState<string>('overview');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState<CustomerFilterState>(DEFAULT_CUSTOMER_FILTERS);
  const [isFilterExpanded, setIsFilterExpanded] = useState<boolean>(false);

  // Dialogs State
  const [archiveTargetCustomer, setArchiveTargetCustomer] = useState<CustomerRecord | null>(null);
  const [duplicateMatches, setDuplicateMatches] = useState<CustomerRecord[]>([]);
  const [pendingCustomerPayload, setPendingCustomerPayload] = useState<any | null>(null);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Selected customer
  const selectedCustomer = useMemo(() => {
    if (!selectedCustomerId) return null;
    return customers.find((c) => c.id === selectedCustomerId || c.customerNumber === selectedCustomerId) || null;
  }, [selectedCustomerId, customers]);

  // Filtered customers list
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const numMatch = customer.customerNumber.toLowerCase().includes(query);
        const nameMatch = customer.name.toLowerCase().includes(query);
        const phoneMatch = customer.mobile.replace(/\s+/g, '').includes(query.replace(/\s+/g, ''));
        const emailMatch = customer.email?.toLowerCase().includes(query);
        const branchMatch = customer.branchName.toLowerCase().includes(query);
        if (!numMatch && !nameMatch && !phoneMatch && !emailMatch && !branchMatch) {
          return false;
        }
      }

      // 2. Status Filter
      if (filters.status !== 'ALL' && customer.status !== filters.status) {
        return false;
      }

      // 3. Customer Type Filter
      if (filters.customerType !== 'ALL' && customer.customerType !== filters.customerType) {
        return false;
      }

      // 4. Branch Filter
      if (filters.branchId !== 'ALL' && customer.branchId !== filters.branchId) {
        return false;
      }

      // 5. Existing Loan Filter
      if (filters.hasExistingLoan === 'YES' && customer.activeLoanCount === 0 && customer.closedLoanCount === 0) {
        return false;
      }
      if (filters.hasExistingLoan === 'NO' && (customer.activeLoanCount > 0 || customer.closedLoanCount > 0)) {
        return false;
      }

      // 6. Loan Status Filter
      if (filters.loanStatus === 'ACTIVE' && customer.activeLoanCount === 0) {
        return false;
      }
      if (filters.loanStatus === 'OVERDUE' && customer.totalOverdue === 0) {
        return false;
      }
      if (filters.loanStatus === 'CLOSED' && customer.closedLoanCount === 0) {
        return false;
      }

      // 7. Date Range Filter
      if (filters.createdDateFrom && customer.createdDate < filters.createdDateFrom) {
        return false;
      }
      if (filters.createdDateTo && customer.createdDate > filters.createdDateTo) {
        return false;
      }

      return true;
    });
  }, [customers, searchQuery, filters]);

  // Aggregate Metrics
  const activeCount = customers.filter((c) => c.status === 'ACTIVE').length;
  const totalSystemExposure = customers.reduce((sum, c) => sum + (c.totalOutstanding || 0), 0);
  const totalActiveLoans = customers.reduce((sum, c) => sum + (c.activeLoanCount || 0), 0);

  // Handlers
  const handleOpenDetails = (customer: CustomerRecord, defaultTab: string = 'overview') => {
    setSelectedCustomerId(customer.id);
    setActiveDetailTab(defaultTab);
    setViewMode('DETAILS');
  };

  const handleOpenEdit = (customer: CustomerRecord) => {
    setSelectedCustomerId(customer.id);
    setViewMode('EDIT');
  };

  const handleOpenCreate = () => {
    setViewMode('CREATE');
  };

  const handleBackToList = () => {
    setViewMode('LIST');
  };

  const handleCreateCustomerSubmit = (formData: any) => {
    // Perform duplicate search first
    const duplicates = findPossibleDuplicates({
      mobile: formData.mobile,
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      dateOfBirth: formData.dateOfBirth,
    });

    if (duplicates.length > 0) {
      setDuplicateMatches(duplicates);
      setPendingCustomerPayload(formData);
      setIsDuplicateDialogOpen(true);
      return;
    }

    // Save directly
    try {
      const created = createCustomer(formData);
      showToast(`Customer ${created.name} (${created.customerNumber}) created successfully.`);
      setSelectedCustomerId(created.id);
      setActiveDetailTab('overview');
      setViewMode('DETAILS');
    } catch (err: any) {
      showToast(err.message || 'Failed to create customer.', 'error');
    }
  };

  const handleDuplicateDialogContinue = () => {
    if (!pendingCustomerPayload) return;
    try {
      const created = createCustomer(pendingCustomerPayload);
      setIsDuplicateDialogOpen(false);
      setPendingCustomerPayload(null);
      showToast(`Customer ${created.name} (${created.customerNumber}) created successfully.`);
      setSelectedCustomerId(created.id);
      setActiveDetailTab('overview');
      setViewMode('DETAILS');
    } catch (err: any) {
      showToast(err.message || 'Failed to create customer.', 'error');
    }
  };

  const handleEditCustomerSubmit = (formData: any) => {
    if (!selectedCustomerId) return;
    try {
      const updated = updateCustomer(selectedCustomerId, formData);
      showToast(`Customer ${updated.customerNumber} updated successfully.`);
      setViewMode('DETAILS');
    } catch (err: any) {
      showToast(err.message || 'Failed to update customer.', 'error');
    }
  };

  const handleArchiveConfirm = (reason: string) => {
    if (!archiveTargetCustomer) return;
    try {
      archiveCustomer(archiveTargetCustomer.id, reason);
      showToast(`Customer ${archiveTargetCustomer.customerNumber} archived successfully.`);
      setArchiveTargetCustomer(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to archive customer.', 'error');
    }
  };

  const handleRestoreConfirm = (customer: CustomerRecord) => {
    try {
      restoreCustomer(customer.id, 'Administrative reactivation');
      showToast(`Customer ${customer.customerNumber} restored to active status.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to restore customer.', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded shadow-lg border text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
            toastMessage.type === 'error'
              ? 'bg-rose-900 text-white border-rose-800'
              : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW: LIST (DEFAULT) */}
      {/* ========================================================= */}
      {viewMode === 'LIST' && (
        <div className="space-y-4">
          {/* Header Card */}
          <div className="bg-white border border-slate-200 rounded p-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-slate-700" />
                  <span>Customer Workspace</span>
                </h1>
                <p className="text-slate-500 text-xs mt-0.5">
                  Centralized customer master data, KYC profile management, and multi-facility loan exposure.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white font-semibold rounded hover:bg-slate-800 focus:outline-none transition-colors text-xs self-start sm:self-auto"
              >
                <UserPlus className="w-4 h-4" />
                <span>Onboard New Customer</span>
              </button>
            </div>

            {/* Quick Metrics Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
              <div className="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-200 rounded">
                <div className="p-2 bg-slate-200 text-slate-800 rounded">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold text-slate-500">
                    Active Customers
                  </div>
                  <div className="font-mono text-sm font-bold text-slate-900">
                    {activeCount} <span className="text-xs font-normal text-slate-500">of {customers.length}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-200 rounded">
                <div className="p-2 bg-slate-200 text-slate-800 rounded">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold text-slate-500">
                    Running Loan Accounts
                  </div>
                  <div className="font-mono text-sm font-bold text-slate-900">
                    {totalActiveLoans} Active Accounts
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-200 rounded">
                <div className="p-2 bg-slate-200 text-slate-800 rounded">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-semibold text-slate-500">
                    Total Active Book Exposure
                  </div>
                  <div className="font-mono text-sm font-bold text-slate-900">
                    {formatIndianCurrency(totalSystemExposure, true)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <CustomerSearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by ID (CUS-...), Name, Mobile (+91...), or Email"
                className="flex-1"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                  className={`px-3 py-2 border rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isFilterExpanded || filters.status !== 'ALL' || filters.branchId !== 'ALL'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span>Filter Parameters</span>
                </button>
              </div>
            </div>

            <CustomerFilters
              filters={filters}
              onFilterChange={setFilters}
              branches={branches}
              onReset={() => setFilters(DEFAULT_CUSTOMER_FILTERS)}
              isExpanded={isFilterExpanded}
              onToggleExpand={() => setIsFilterExpanded(!isFilterExpanded)}
            />
          </div>

          {/* Customer Records Table */}
          <CustomerTable
            customers={filteredCustomers}
            onViewCustomer={(cust) => handleOpenDetails(cust, 'overview')}
            onEditCustomer={handleOpenEdit}
            onViewHistory={(cust) => handleOpenDetails(cust, 'history')}
            onViewLoans={(cust) => handleOpenDetails(cust, 'loans')}
            onArchiveCustomer={(cust) => setArchiveTargetCustomer(cust)}
            onRestoreCustomer={handleRestoreConfirm}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW: CREATE CUSTOMER */}
      {/* ========================================================= */}
      {viewMode === 'CREATE' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded p-4 text-xs flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold text-slate-900">Onboard New Customer</h1>
              <p className="text-slate-500 text-xs">
                Register master customer profile, residential demographics, declared income, and banking details.
              </p>
            </div>

            <button
              type="button"
              onClick={handleBackToList}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
            >
              Cancel & Return
            </button>
          </div>

          <CustomerForm
            branches={branches}
            onSubmit={handleCreateCustomerSubmit}
            onCancel={handleBackToList}
            onCheckDuplicate={findPossibleDuplicates}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW: EDIT CUSTOMER */}
      {/* ========================================================= */}
      {viewMode === 'EDIT' && selectedCustomer && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded p-4 text-xs flex items-center justify-between">
            <div>
              <h1 className="text-base font-bold text-slate-900">
                Edit Profile — {selectedCustomer.name} ({selectedCustomer.customerNumber})
              </h1>
              <p className="text-slate-500 text-xs">
                Update demographic, address, employment, or contact information for this customer record.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setViewMode('DETAILS')}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
            >
              Cancel & Return
            </button>
          </div>

          <CustomerForm
            initialData={selectedCustomer}
            branches={branches}
            onSubmit={handleEditCustomerSubmit}
            onCancel={() => setViewMode('DETAILS')}
            isEditing={true}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW: CUSTOMER DETAILS (OVERVIEW, APPLICATIONS, LOANS, HISTORY) */}
      {/* ========================================================= */}
      {viewMode === 'DETAILS' && selectedCustomer && (
        <div className="space-y-4">
          {/* Header */}
          <CustomerHeader
            customer={selectedCustomer}
            onBack={handleBackToList}
            onEdit={() => handleOpenEdit(selectedCustomer)}
            onArchive={() => setArchiveTargetCustomer(selectedCustomer)}
            onRestore={() => handleRestoreConfirm(selectedCustomer)}
            activeTab={activeDetailTab}
            onTabChange={setActiveDetailTab}
          />

          {/* TAB 1: OVERVIEW */}
          {activeDetailTab === 'overview' && (
            <div className="space-y-4">
              <CustomerSummary customer={selectedCustomer} />
              <CustomerInfoSection
                customer={selectedCustomer}
                onEditClick={() => handleOpenEdit(selectedCustomer)}
              />
            </div>
          )}

          {/* TAB: KYC & IDENTITY */}
          {activeDetailTab === 'kyc' && (
            <CustomerKycSection
              customer={selectedCustomer}
              kyc={kycRecords.find((k) => k.customerId === selectedCustomer.id)}
              currentUser="Alex Morgan"
              onVerifyKyc={(payload) => {
                verifyKyc(selectedCustomer.id, payload);
                showToast(`KYC for ${selectedCustomer.name} verified & approved.`);
              }}
              onRejectKyc={(payload) => {
                rejectKyc(selectedCustomer.id, payload);
                showToast(`KYC for ${selectedCustomer.name} rejected.`, 'error');
              }}
              onRequestAction={(payload) => {
                requestKycAction(selectedCustomer.id, payload);
                showToast(`Action requested for ${selectedCustomer.name}.`, 'info');
              }}
              onUpdateRisk={(risk) => {
                updateKycRisk(selectedCustomer.id, risk);
                showToast(`Risk tier updated to ${risk}.`);
              }}
              onTriggerApiSync={(idType) => {
                triggerGovernmentApiVerification(selectedCustomer.id, idType);
                showToast(`Live ${idType} database sync completed with green match.`);
              }}
            />
          )}

          {/* TAB: DOCUMENTS & VAULT */}
          {activeDetailTab === 'documents' && (
            <CustomerDocumentSection
              customer={selectedCustomer}
              documents={documents.filter((d) => d.customerId === selectedCustomer.id)}
              requirements={checklistRequirements}
              currentUser="Alex Morgan"
              onUploadDocument={(payload) => {
                uploadDocument(selectedCustomer.id, payload);
                showToast(`Document "${payload.documentTitle}" uploaded & cataloged.`);
              }}
              onVerifyDocument={(docId, notes) => {
                verifyDocument(docId, { verifiedBy: 'Alex Morgan', notes });
                showToast('Document verified successfully.');
              }}
              onRejectDocument={(docId, reason, notes) => {
                rejectDocument(docId, { rejectedBy: 'Alex Morgan', reason, notes });
                showToast('Document rejected and flagged for correction.', 'error');
              }}
              onWaiveDocument={(docId, reason) => {
                waiveDocument(docId, reason, 'Alex Morgan');
                showToast('Document requirement waived under credit authority.');
              }}
              onDeleteDocument={(docId) => {
                deleteDocument(docId, 'Customer document removal', 'Alex Morgan');
                showToast('Document removed from vault.');
              }}
              onRenewDocument={(docId, newDate) => {
                renewDocument(docId, newDate, 'Alex Morgan');
                showToast(`Document validity renewed to ${newDate}.`);
              }}
              onSendExpiryReminder={(docId) => {
                sendDocumentExpiryReminder(docId);
                showToast('Renewal notification sent to borrower mobile & email.', 'info');
              }}
            />
          )}

          {/* TAB 2: APPLICATIONS */}
          {activeDetailTab === 'applications' && (
            <CustomerApplications
              applications={getCustomerApplications(selectedCustomer.id)}
              customerName={selectedCustomer.name}
            />
          )}

          {/* TAB 3: LOANS & PORTFOLIO */}
          {activeDetailTab === 'loans' && (
            <CustomerLoans
              loans={getCustomerLoans(selectedCustomer.id)}
              customerName={selectedCustomer.name}
            />
          )}

          {/* TAB 4: HISTORY / AUDIT */}
          {activeDetailTab === 'history' && (
            <CustomerTimeline
              history={getCustomerHistory(selectedCustomer.id)}
              customerName={selectedCustomer.name}
            />
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* DIALOGS */}
      {/* ========================================================= */}

      {/* Duplicate Customer Match Dialog */}
      <DuplicateCustomerDialog
        isOpen={isDuplicateDialogOpen}
        onClose={() => {
          setIsDuplicateDialogOpen(false);
          setPendingCustomerPayload(null);
        }}
        matches={duplicateMatches}
        onViewCustomer={(cust) => {
          setIsDuplicateDialogOpen(false);
          setPendingCustomerPayload(null);
          handleOpenDetails(cust, 'overview');
        }}
        onContinueAnyway={handleDuplicateDialogContinue}
      />

      {/* Archive Customer Confirmation Dialog */}
      <CustomerArchiveDialog
        isOpen={!!archiveTargetCustomer}
        onClose={() => setArchiveTargetCustomer(null)}
        customer={archiveTargetCustomer}
        onConfirm={handleArchiveConfirm}
      />
    </div>
  );
};
