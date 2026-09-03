import React, { useState } from 'react';
import { useMockLMSStore } from '../../services/mockService';
import { DocumentVaultTable } from '../documents/DocumentVaultTable';
import { DocumentExpiryTracker } from '../documents/DocumentExpiryTracker';
import { DocumentViewerModal } from '../documents/DocumentViewerModal';
import { DocumentItem } from '../../types';
import { FileText, Clock, CheckCircle2, AlertOctagon, ShieldCheck } from 'lucide-react';

interface DocumentsViewProps {
  currentUser: string;
  onNavigateToCustomer: (customerId: string) => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  currentUser,
  onNavigateToCustomer,
}) => {
  const {
    documents,
    verifyDocument,
    rejectDocument,
    waiveDocument,
    deleteDocument,
    renewDocument,
    sendDocumentExpiryReminder,
  } = useMockLMSStore();

  const [activeTab, setActiveTab] = useState<'VAULT' | 'EXPIRY'>('VAULT');
  const [selectedDocForViewing, setSelectedDocForViewing] = useState<DocumentItem | null>(null);

  // Aggregated KPIs
  const totalDocs = documents.length;
  const verifiedCount = documents.filter((d) => d.status === 'VERIFIED').length;
  const pendingCount = documents.filter((d) => d.status === 'PENDING_VERIFICATION').length;
  const actionCount = documents.filter((d) => d.status === 'ACTION_REQUIRED').length;
  const expiredCount = documents.filter((d) => d.status === 'EXPIRED').length;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-white rounded">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">
                Document Management & Verification Hub
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Multi-tenant document repository, OCR extraction pipeline, credit checklist validation, and statutory expiry monitoring.
              </p>
            </div>
          </div>
        </div>

        {/* Quick KPI stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
            <span className="text-[10px] uppercase font-bold text-slate-500">Total Documents</span>
            <p className="text-lg font-mono font-bold text-slate-900 mt-0.5">{totalDocs}</p>
          </div>

          <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded">
            <span className="text-[10px] uppercase font-bold text-emerald-800">Verified</span>
            <p className="text-lg font-mono font-bold text-emerald-900 mt-0.5">{verifiedCount}</p>
          </div>

          <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded">
            <span className="text-[10px] uppercase font-bold text-amber-800">Pending Verification</span>
            <p className="text-lg font-mono font-bold text-amber-900 mt-0.5">{pendingCount}</p>
          </div>

          <div className="p-2.5 bg-orange-50/70 border border-orange-200 rounded">
            <span className="text-[10px] uppercase font-bold text-orange-800">Action Required</span>
            <p className="text-lg font-mono font-bold text-orange-900 mt-0.5">{actionCount}</p>
          </div>

          <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded">
            <span className="text-[10px] uppercase font-bold text-rose-800">Expired / Renewal Due</span>
            <p className="text-lg font-mono font-bold text-rose-900 mt-0.5">{expiredCount}</p>
          </div>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('VAULT')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-semibold text-xs transition-colors ${
            activeTab === 'VAULT'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>All Borrower Documents ({documents.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('EXPIRY')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-semibold text-xs transition-colors ${
            activeTab === 'EXPIRY'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Document Expiry & Renewals</span>
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'VAULT' && (
        <DocumentVaultTable
          documents={documents}
          onOpenViewer={(doc) => setSelectedDocForViewing(doc)}
          onVerify={(docId) => verifyDocument(docId, { verifiedBy: currentUser, notes: 'Direct approval from hub' })}
          onDelete={(docId) => deleteDocument(docId, 'Admin hub deletion', currentUser)}
          onSendReminder={sendDocumentExpiryReminder}
          showCustomerName={true}
          title="Enterprise Document Repository"
        />
      )}

      {activeTab === 'EXPIRY' && (
        <DocumentExpiryTracker
          documents={documents}
          onOpenViewer={(doc) => setSelectedDocForViewing(doc)}
          onSendReminder={sendDocumentExpiryReminder}
          onRenewDocument={(docId, newDate) => renewDocument(docId, newDate, currentUser)}
        />
      )}

      {/* Document Inspector Modal */}
      <DocumentViewerModal
        document={selectedDocForViewing}
        isOpen={!!selectedDocForViewing}
        onClose={() => setSelectedDocForViewing(null)}
        currentUser={currentUser}
        onApprove={(docId, notes) => verifyDocument(docId, { verifiedBy: currentUser, notes })}
        onReject={(docId, reason, notes) => rejectDocument(docId, { rejectedBy: currentUser, reason, notes })}
        onWaive={(docId, reason) => waiveDocument(docId, reason, currentUser)}
      />
    </div>
  );
};
