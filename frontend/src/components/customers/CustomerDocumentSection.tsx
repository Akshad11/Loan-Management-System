import React, { useState } from 'react';
import { CustomerRecord, DocumentItem, ChecklistRequirement, DocumentCategory } from '../../types';
import { DocumentVaultTable } from '../documents/DocumentVaultTable';
import { DocumentChecklistTracker } from '../documents/DocumentChecklistTracker';
import { DocumentExpiryTracker } from '../documents/DocumentExpiryTracker';
import { DocumentViewerModal } from '../documents/DocumentViewerModal';
import { DocumentUploadModal } from '../documents/DocumentUploadModal';
import { FileText, CheckSquare, Clock } from 'lucide-react';

interface CustomerDocumentSectionProps {
  customer: CustomerRecord;
  documents: DocumentItem[];
  requirements: ChecklistRequirement[];
  currentUser: string;
  onUploadDocument: (payload: any) => void;
  onVerifyDocument: (docId: string, notes?: string) => void;
  onRejectDocument: (docId: string, reason: string, notes: string) => void;
  onWaiveDocument: (docId: string, reason: string) => void;
  onDeleteDocument: (docId: string) => void;
  onRenewDocument: (docId: string, newDate: string) => void;
  onSendExpiryReminder: (docId: string) => void;
}

export const CustomerDocumentSection: React.FC<CustomerDocumentSectionProps> = ({
  customer,
  documents,
  requirements,
  currentUser,
  onUploadDocument,
  onVerifyDocument,
  onRejectDocument,
  onWaiveDocument,
  onDeleteDocument,
  onRenewDocument,
  onSendExpiryReminder,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'VAULT' | 'CHECKLIST' | 'EXPIRY'>('VAULT');
  const [selectedDocForViewing, setSelectedDocForViewing] = useState<DocumentItem | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Sub-tab navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('VAULT')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-semibold text-xs transition-colors ${
            activeSubTab === 'VAULT'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Document Vault ({documents.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('CHECKLIST')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-semibold text-xs transition-colors ${
            activeSubTab === 'CHECKLIST'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          <span>Mandatory Checklist</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('EXPIRY')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-semibold text-xs transition-colors ${
            activeSubTab === 'EXPIRY'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Expiry & Renewals</span>
        </button>
      </div>

      {/* Sub-tab Views */}
      {activeSubTab === 'VAULT' && (
        <DocumentVaultTable
          documents={documents}
          onOpenViewer={(doc) => setSelectedDocForViewing(doc)}
          onOpenUpload={() => setIsUploadModalOpen(true)}
          onVerify={(docId) => onVerifyDocument(docId, 'Verified from quick action')}
          onDelete={onDeleteDocument}
          onSendReminder={onSendExpiryReminder}
        />
      )}

      {activeSubTab === 'CHECKLIST' && (
        <DocumentChecklistTracker
          customer={customer}
          documents={documents}
          requirements={requirements}
          onOpenUploadForRequirement={() => setIsUploadModalOpen(true)}
        />
      )}

      {activeSubTab === 'EXPIRY' && (
        <DocumentExpiryTracker
          documents={documents}
          onOpenViewer={(doc) => setSelectedDocForViewing(doc)}
          onSendReminder={onSendExpiryReminder}
          onRenewDocument={onRenewDocument}
        />
      )}

      {/* Document Inspector Modal */}
      <DocumentViewerModal
        document={selectedDocForViewing}
        isOpen={!!selectedDocForViewing}
        onClose={() => setSelectedDocForViewing(null)}
        currentUser={currentUser}
        onApprove={onVerifyDocument}
        onReject={onRejectDocument}
        onWaive={onWaiveDocument}
      />

      {/* Document Upload Modal */}
      <DocumentUploadModal
        customer={customer}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        currentUser={currentUser}
        onUpload={onUploadDocument}
      />
    </div>
  );
};
