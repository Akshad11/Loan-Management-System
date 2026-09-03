import React, { useState } from 'react';
import { DocumentItem } from '../../types';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import {
  FileText,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck2,
  Calendar,
  Lock,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface DocumentViewerModalProps {
  document: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: string;
  onApprove: (docId: string, notes?: string) => void;
  onReject: (docId: string, reason: string, notes: string) => void;
  onWaive: (docId: string, reason: string) => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document,
  isOpen,
  onClose,
  currentUser,
  onApprove,
  onReject,
  onWaive,
}) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [activeTab, setActiveTab] = useState<'PREVIEW' | 'OCR_DATA' | 'AUDIT_TRAIL'>('PREVIEW');
  const [actionDecision, setActionDecision] = useState<'NONE' | 'APPROVE' | 'REJECT' | 'WAIVE'>('NONE');
  const [approvalNotes, setApprovalNotes] = useState('Document inspected and verified against original source.');
  const [rejectionReason, setRejectionReason] = useState('BLURRED_ILLEGIBLE');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [waiverReason, setWaiverReason] = useState('Waived as customer provided alternate audited balance sheet.');

  if (!isOpen || !document) return null;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleApproveSubmit = () => {
    onApprove(document.id, approvalNotes);
    setActionDecision('NONE');
    onClose();
  };

  const handleRejectSubmit = () => {
    onReject(document.id, rejectionReason, rejectionNotes || 'Document does not meet required specifications.');
    setActionDecision('NONE');
    onClose();
  };

  const handleWaiveSubmit = () => {
    onWaive(document.id, waiverReason);
    setActionDecision('NONE');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col text-xs">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-900 text-white rounded">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">{document.documentTitle}</h2>
                <DocumentStatusBadge status={document.status} size="sm" />
                <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 font-mono text-[10px] font-bold rounded">
                  v{document.version}
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                {document.fileName} • {document.fileSizeKb} KB • {document.fileFormat} • Borrower: {document.customerName} ({document.customerNumber})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View mode toggle tabs */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-100 border-b border-slate-200">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('PREVIEW')}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                activeTab === 'PREVIEW'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Document Canvas & Zoom
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('OCR_DATA')}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'OCR_DATA'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              OCR Extracted Entities ({document.ocrExtractedData?.confidenceScore || 96}%)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('AUDIT_TRAIL')}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                activeTab === 'AUDIT_TRAIL'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Metadata & Security Signatures
            </button>
          </div>

          {activeTab === 'PREVIEW' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] px-1.5 text-slate-600">{zoomLevel}%</span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRotate}
                className="p-1 bg-white border border-slate-300 rounded hover:bg-slate-50 text-slate-700 ml-1"
                title="Rotate 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Modal Main Body */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-50/50">
          {activeTab === 'PREVIEW' && (
            <div className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded border border-slate-800 min-h-[380px] overflow-hidden">
              <div
                style={{
                  transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                  transition: 'transform 0.15s ease',
                }}
                className="bg-white text-slate-900 rounded shadow-2xl p-8 max-w-lg w-full border border-slate-200 flex flex-col space-y-4"
              >
                {/* Simulated Document Certificate Representation */}
                <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6 text-slate-800" />
                    <div>
                      <div className="font-bold text-xs uppercase tracking-wider text-slate-900">
                        {document.category.replace('_', ' ')}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        REF: {document.id}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-500 block">SECURE ENCLAVE</span>
                    <span className="font-bold text-slate-900 text-xs">GOVT / BANK SPECIMEN</span>
                  </div>
                </div>

                <div className="space-y-2.5 py-2">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Document Title</span>
                    <p className="font-bold text-slate-900 text-xs mt-0.5">{document.documentTitle}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Borrower Name</span>
                      <p className="font-semibold text-slate-900 text-xs mt-0.5">{document.customerName}</p>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Masked Number</span>
                      <p className="font-mono font-bold text-slate-900 text-xs mt-0.5">
                        {document.documentNumberMasked || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Validity State</span>
                      <p className="font-semibold text-slate-900 text-xs mt-0.5">
                        {document.isLifetimeValid ? 'Permanent / Lifetime' : `Expires: ${document.expiryDate || 'N/A'}`}
                      </p>
                    </div>
                    <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Tamper Audit</span>
                      <p className="font-mono font-bold text-emerald-700 text-xs mt-0.5">
                        Score: {document.tamperScore}% (Clean)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>SHA256: 8f4b...199a</span>
                  <span>DIGITALLY WATERMARKED</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'OCR_DATA' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded">
                  <span className="text-[10px] uppercase font-bold text-slate-500">OCR Engine Confidence</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full"
                        style={{ width: `${document.ocrExtractedData?.confidenceScore || 96}%` }}
                      />
                    </div>
                    <span className="font-mono font-bold text-slate-900 text-xs">
                      {document.ocrExtractedData?.confidenceScore || 96}%
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Digital Tamper Score</span>
                  <p className="font-mono font-bold text-emerald-700 text-xs mt-1">
                    {document.tamperScore !== undefined ? `${document.tamperScore}% (Zero Artifacts)` : '0%'}
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Document Type</span>
                  <p className="font-semibold text-slate-900 text-xs mt-1">{document.documentType}</p>
                </div>
              </div>

              {/* Extracted key-values table */}
              <div className="bg-white border border-slate-200 rounded overflow-hidden">
                <div className="bg-slate-100 px-3 py-2 font-bold text-slate-800 border-b border-slate-200">
                  Extracted Structured Fields
                </div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] text-slate-500 uppercase border-b border-slate-200">
                      <th className="p-2.5">Field Name</th>
                      <th className="p-2.5">Extracted Value</th>
                      <th className="p-2.5">Validation Check</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2.5 font-semibold text-slate-600">Full Name</td>
                      <td className="p-2.5 font-mono text-slate-900 font-bold">
                        {document.ocrExtractedData?.name || document.customerName}
                      </td>
                      <td className="p-2.5">
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Exact match with Profile
                        </span>
                      </td>
                    </tr>
                    {document.ocrExtractedData?.documentNumber && (
                      <tr>
                        <td className="p-2.5 font-semibold text-slate-600">Document ID Number</td>
                        <td className="p-2.5 font-mono text-slate-900 font-bold">
                          {document.ocrExtractedData.documentNumber}
                        </td>
                        <td className="p-2.5">
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Checksum Valid
                          </span>
                        </td>
                      </tr>
                    )}
                    {document.ocrExtractedData?.dob && (
                      <tr>
                        <td className="p-2.5 font-semibold text-slate-600">Date of Birth</td>
                        <td className="p-2.5 font-mono text-slate-900">
                          {document.ocrExtractedData.dob}
                        </td>
                        <td className="p-2.5">
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Matches Aadhaar
                          </span>
                        </td>
                      </tr>
                    )}
                    {document.ocrExtractedData?.incomeAmount && (
                      <tr>
                        <td className="p-2.5 font-semibold text-slate-600">Monthly / Annual Compensation</td>
                        <td className="p-2.5 font-mono text-slate-900 font-bold">
                          ₹{document.ocrExtractedData.incomeAmount.toLocaleString()}
                        </td>
                        <td className="p-2.5">
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Corresponds to Bank Credits
                          </span>
                        </td>
                      </tr>
                    )}
                    {document.ocrExtractedData?.address && (
                      <tr>
                        <td className="p-2.5 font-semibold text-slate-600">Extracted Full Address</td>
                        <td className="p-2.5 text-slate-900">
                          {document.ocrExtractedData.address}
                        </td>
                        <td className="p-2.5">
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Serviceable Locality
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'AUDIT_TRAIL' && (
            <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
              <h3 className="font-bold text-slate-900 text-xs">Security, Upload & Verification Audit Metadata</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] uppercase font-semibold text-slate-500">Uploaded At</span>
                  <p className="font-mono text-slate-900 text-xs mt-0.5">{document.uploadedAt}</p>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] uppercase font-semibold text-slate-500">Uploaded By</span>
                  <p className="font-semibold text-slate-900 text-xs mt-0.5">{document.uploadedBy}</p>
                  <p className="text-[10px] text-slate-500 font-semibold">{document.uploadedByRole}</p>
                </div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] uppercase font-semibold text-slate-500">Verification Officer</span>
                  <p className="font-semibold text-slate-900 text-xs mt-0.5">{document.verifiedBy || 'Pending'}</p>
                  {document.verifiedAt && <p className="font-mono text-[10px] text-slate-500">{document.verifiedAt}</p>}
                </div>
              </div>

              {document.rejectionNotes && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-900">
                  <span className="font-bold block">Rejection / Discrepancy Note</span>
                  <p className="mt-0.5">{document.rejectionNotes}</p>
                </div>
              )}
            </div>
          )}

          {/* Action decision form panels */}
          {actionDecision === 'APPROVE' && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-300 rounded space-y-2">
              <div className="font-bold text-emerald-900 text-xs">Confirm Document Approval</div>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={2}
                className="w-full p-2 bg-white border border-emerald-300 rounded text-xs"
                placeholder="Verification remarks..."
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActionDecision('NONE')}
                  className="px-3 py-1 border border-slate-300 rounded bg-white text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApproveSubmit}
                  className="px-3 py-1 bg-emerald-700 text-white font-bold rounded hover:bg-emerald-800"
                >
                  Sign & Approve
                </button>
              </div>
            </div>
          )}

          {actionDecision === 'REJECT' && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-300 rounded space-y-2">
              <div className="font-bold text-rose-900 text-xs">Reject Document & Request Re-upload</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-rose-900">Reason</label>
                  <select
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full p-1.5 bg-white border border-rose-300 rounded text-xs mt-0.5"
                  >
                    <option value="BLURRED_ILLEGIBLE">Image is Blurred or Illegible</option>
                    <option value="DOCUMENT_EXPIRED_OLD">Document is Expired / Exceeds Age Limit</option>
                    <option value="NAME_MISMATCH">Name / Demographic Mismatch</option>
                    <option value="CUT_OFF_EDGES">Edges Cut-off / Partial Page</option>
                    <option value="SUSPECTED_ALTERATION">Suspected Tampering / Alteration</option>
                    <option value="PASSWORD_PROTECTED">File Password Protected / Inaccessible</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-rose-900">Officer Instructions</label>
                  <input
                    type="text"
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    placeholder="Instructions for borrower..."
                    className="w-full p-1.5 bg-white border border-rose-300 rounded text-xs mt-0.5"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActionDecision('NONE')}
                  className="px-3 py-1 border border-slate-300 rounded bg-white text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectSubmit}
                  className="px-3 py-1 bg-rose-700 text-white font-bold rounded hover:bg-rose-800"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}

          {actionDecision === 'WAIVE' && (
            <div className="mt-4 p-3 bg-purple-50 border border-purple-300 rounded space-y-2">
              <div className="font-bold text-purple-900 text-xs">Credit Waiver for Mandatory Document</div>
              <input
                type="text"
                value={waiverReason}
                onChange={(e) => setWaiverReason(e.target.value)}
                placeholder="Credit Committee Waiver Justification..."
                className="w-full p-1.5 bg-white border border-purple-300 rounded text-xs"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActionDecision('NONE')}
                  className="px-3 py-1 border border-slate-300 rounded bg-white text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleWaiveSubmit}
                  className="px-3 py-1 bg-purple-700 text-white font-bold rounded hover:bg-purple-800"
                >
                  Authorize Waiver
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Action Bar */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {document.status !== 'VERIFIED' && (
              <button
                type="button"
                onClick={() => setActionDecision('APPROVE')}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-xs flex items-center gap-1 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verify & Approve</span>
              </button>
            )}

            {document.status !== 'REJECTED' && (
              <button
                type="button"
                onClick={() => setActionDecision('REJECT')}
                className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded text-xs flex items-center gap-1 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject / Request Action</span>
              </button>
            )}

            {document.status !== 'WAIVED' && (
              <button
                type="button"
                onClick={() => setActionDecision('WAIVE')}
                className="px-3 py-1.5 border border-purple-300 text-purple-800 hover:bg-purple-50 font-semibold rounded text-xs transition-colors"
              >
                <span>Waive Requirement</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
