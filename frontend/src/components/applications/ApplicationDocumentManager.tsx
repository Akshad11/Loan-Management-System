import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Link,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Eye,
  Trash2,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import {
  ApplicationDocumentRecord,
  ApplicationDocumentTypeConfig,
} from '../../types/applicationTypes';
import { DocumentItem } from '../../types';
import { ApplicationDocumentUploadModal } from './ApplicationDocumentUploadModal';

interface ApplicationDocumentManagerProps {
  applicationId: string;
  documents: ApplicationDocumentRecord[];
  productRequirements?: ApplicationDocumentTypeConfig[];
  customerVaultDocuments?: DocumentItem[];
  onUploadDocument: (payload: {
    documentType: string;
    documentTitle: string;
    fileName: string;
    fileFormat: 'PDF' | 'JPG' | 'PNG' | 'DOCX';
    fileSizeKb: number;
    isMandatory?: boolean;
    notes?: string;
  }) => void;
  onLinkKycDocument: (documentType: string, vaultDocId: string) => void;
  onVerifyDocument: (docId: string, notes?: string) => void;
  onRejectDocument: (docId: string, reason: string) => void;
  onRemoveDocument: (docId: string) => void;
  isDraft: boolean;
  canUploadDocs?: boolean;
  canVerifyDocs?: boolean;
}

export const ApplicationDocumentManager: React.FC<ApplicationDocumentManagerProps> = ({
  applicationId,
  documents,
  productRequirements = [],
  customerVaultDocuments = [],
  onUploadDocument,
  onLinkKycDocument,
  onVerifyDocument,
  onRejectDocument,
  onRemoveDocument,
  isDraft,
  canUploadDocs = true,
  canVerifyDocs = true,
}) => {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [activeUploadTarget, setActiveUploadTarget] = useState<{
    type: string;
    title: string;
    isMandatory: boolean;
  } | null>(null);

  const [rejectPromptDocId, setRejectPromptDocId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');

  const mandatoryCount = documents.filter((d) => d.isMandatory).length;
  const verifiedMandatoryCount = documents.filter((d) => d.isMandatory && d.status === 'VERIFIED').length;
  const missingCount = documents.filter((d) => d.status === 'MISSING').length;
  const rejectedCount = documents.filter((d) => d.status === 'REJECTED').length;

  const handleOpenUploadFor = (type: string, title: string, isMandatory: boolean) => {
    setActiveUploadTarget({ type, title, isMandatory });
    setUploadModalOpen(true);
  };

  const handleConfirmReject = (docId: string) => {
    if (!rejectionReasonInput.trim()) return;
    onRejectDocument(docId, rejectionReasonInput);
    setRejectPromptDocId(null);
    setRejectionReasonInput('');
  };

  return (
    <div
      id="application-document-manager-section"
      className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4"
    >
      {/* Checklist Header & Metric Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-700" />
            Application Document Checklist ({documents.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Mandatory KYC, income proofs, bank statements, and product-specific securities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
              {verifiedMandatoryCount}/{mandatoryCount} Mandatory Verified
            </span>
            {rejectedCount > 0 && (
              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded font-medium border border-rose-200">
                {rejectedCount} Rejected
              </span>
            )}
            {missingCount > 0 && (
              <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded font-medium border border-amber-200">
                {missingCount} Missing
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Document Items List */}
      <div className="space-y-3">
        {documents.map((doc) => {
          const isVerified = doc.status === 'VERIFIED';
          const isMissing = doc.status === 'MISSING';
          const isRejected = doc.status === 'REJECTED';
          const isUnderReview = doc.status === 'UNDER_REVIEW' || doc.status === 'UPLOADED';

          // Check if eligible customer KYC document exists in vault to offer instant 1-click link
          const matchedVaultDoc =
            isMissing &&
            customerVaultDocuments.find((cd) => {
              if (doc.documentType === 'IDENTITY_PROOF' && cd.category === 'IDENTITY_PROOF') {
                return cd.status === 'VERIFIED';
              }
              if (doc.documentType === 'ADDRESS_PROOF' && cd.category === 'ADDRESS_PROOF') {
                return cd.status === 'VERIFIED';
              }
              return false;
            });

          return (
            <div
              key={doc.id}
              id={`appdoc-row-${doc.id}`}
              className={`p-4 rounded-lg border transition-all ${
                isVerified
                  ? 'bg-emerald-50/40 border-emerald-200'
                  : isRejected
                  ? 'bg-rose-50/40 border-rose-200'
                  : isMissing
                  ? 'bg-amber-50/40 border-amber-200'
                  : 'bg-slate-50/60 border-slate-200'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isVerified
                        ? 'bg-emerald-100 text-emerald-800'
                        : isRejected
                        ? 'bg-rose-100 text-rose-800'
                        : isMissing
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {isVerified ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    ) : isRejected ? (
                      <XCircle className="w-5 h-5 text-rose-700" />
                    ) : isMissing ? (
                      <Clock className="w-5 h-5 text-amber-700" />
                    ) : (
                      <FileText className="w-5 h-5 text-blue-700" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">
                        {doc.documentTitle}
                      </span>
                      {doc.isMandatory ? (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded">
                          Mandatory
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-medium tracking-wider px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded">
                          Optional
                        </span>
                      )}

                      <span className="text-[11px] font-mono text-slate-500">
                        ({doc.source === 'CUSTOMER_KYC' ? 'Linked KYC Vault' : 'App Upload'})
                      </span>
                    </div>

                    {doc.fileName ? (
                      <div className="text-xs text-slate-600 flex items-center gap-3 mt-1 font-mono">
                        <span>{doc.fileName}</span>
                        {doc.fileSizeKb ? <span>• {doc.fileSizeKb} KB</span> : null}
                        {doc.uploadedAt ? <span>• Uploaded: {doc.uploadedAt}</span> : null}
                      </div>
                    ) : (
                      <div className="text-xs text-amber-700 mt-1 flex items-center gap-1 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Document not yet submitted or linked.
                      </div>
                    )}

                    {doc.rejectionReason && (
                      <div className="mt-1.5 p-2 bg-rose-100/70 border border-rose-200 rounded text-xs text-rose-800 font-medium">
                        <strong>Rejection Reason:</strong> {doc.rejectionReason}
                      </div>
                    )}

                    {doc.notes && !doc.rejectionReason && (
                      <div className="text-[11px] text-slate-500 mt-1 italic">
                        Note: {doc.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side status badge and actions */}
                <div className="flex items-center justify-between md:justify-end gap-2 shrink-0">
                  {/* Match & Link from KYC */}
                  {matchedVaultDoc && isDraft && canUploadDocs && (
                    <button
                      onClick={() => onLinkKycDocument(doc.documentType, matchedVaultDoc.id)}
                      className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold flex items-center gap-1 shadow-sm"
                      title="Link already verified KYC document from customer repository"
                    >
                      <Link className="w-3.5 h-3.5" />
                      Link KYC Vault ({matchedVaultDoc.fileName})
                    </button>
                  )}

                  {/* Upload / Re-upload Button */}
                  {isDraft && canUploadDocs && (
                    <button
                      onClick={() =>
                        handleOpenUploadFor(doc.documentType, doc.documentTitle, doc.isMandatory)
                      }
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded text-xs font-medium flex items-center gap-1 shadow-sm"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-500" />
                      {doc.fileName ? 'Replace' : 'Upload File'}
                    </button>
                  )}

                  {/* Operations Verification Actions */}
                  {canVerifyDocs && isUnderReview && doc.fileName && (
                    <>
                      <button
                        onClick={() => onVerifyDocument(doc.id, 'Verified by operations examiner')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium flex items-center gap-1 shadow-sm"
                        title="Mark Document as Verified"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Verify
                      </button>

                      <button
                        onClick={() => setRejectPromptDocId(doc.id)}
                        className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded text-xs font-medium flex items-center gap-1"
                        title="Reject Document with Reason"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </>
                  )}

                  {/* Re-verify if rejected */}
                  {canVerifyDocs && isRejected && (
                    <button
                      onClick={() => onVerifyDocument(doc.id, 'Re-examined and verified')}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium flex items-center gap-1 shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Accept Re-examination
                    </button>
                  )}

                  {/* Remove action */}
                  {isDraft && doc.fileName && (
                    <button
                      onClick={() => onRemoveDocument(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                      title="Remove / Unlink Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* In-place Rejection Prompt Form */}
              {rejectPromptDocId === doc.id && (
                <div className="mt-3 pt-3 border-t border-rose-200 space-y-2">
                  <label className="block text-xs font-bold text-rose-900 uppercase">
                    Provide Specific Rejection Reason:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bank statement password protected or missing last 2 months credits..."
                    value={rejectionReasonInput}
                    onChange={(e) => setRejectionReasonInput(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-rose-300 rounded bg-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setRejectPromptDocId(null);
                        setRejectionReasonInput('');
                      }}
                      className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded border border-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleConfirmReject(doc.id)}
                      disabled={!rejectionReasonInput.trim()}
                      className="px-3 py-1 text-xs bg-rose-600 text-white font-medium hover:bg-rose-700 rounded disabled:opacity-50"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {uploadModalOpen && activeUploadTarget && (
        <ApplicationDocumentUploadModal
          isOpen={uploadModalOpen}
          onClose={() => {
            setUploadModalOpen(false);
            setActiveUploadTarget(null);
          }}
          onUpload={onUploadDocument}
          initialDocumentType={activeUploadTarget.type}
          initialDocumentTitle={activeUploadTarget.title}
          isMandatory={activeUploadTarget.isMandatory}
        />
      )}
    </div>
  );
};
