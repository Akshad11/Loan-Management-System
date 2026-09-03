import React, { useState, useMemo } from 'react';
import { DocumentItem, DocumentCategory } from '../../types';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import {
  Search,
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Plus,
  Filter,
} from 'lucide-react';

interface DocumentVaultTableProps {
  documents: DocumentItem[];
  onOpenViewer: (doc: DocumentItem) => void;
  onOpenUpload?: () => void;
  onVerify?: (docId: string) => void;
  onDelete?: (docId: string) => void;
  onSendReminder?: (docId: string) => void;
  title?: string;
  showCustomerName?: boolean;
}

export const DocumentVaultTable: React.FC<DocumentVaultTableProps> = ({
  documents,
  onOpenViewer,
  onOpenUpload,
  onVerify,
  onDelete,
  onSendReminder,
  title = 'Document Vault & Repository',
  showCustomerName = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      // Search
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        doc.documentTitle.toLowerCase().includes(term) ||
        doc.fileName.toLowerCase().includes(term) ||
        doc.documentType.toLowerCase().includes(term) ||
        (doc.customerName && doc.customerName.toLowerCase().includes(term)) ||
        (doc.documentNumberMasked && doc.documentNumberMasked.toLowerCase().includes(term));

      if (!matchesSearch) return false;

      // Category
      if (categoryFilter !== 'ALL' && doc.category !== categoryFilter) return false;

      // Status
      if (statusFilter !== 'ALL' && doc.status !== statusFilter) return false;

      return true;
    });
  }, [documents, searchTerm, categoryFilter, statusFilter]);

  const categories: { key: string; label: string }[] = [
    { key: 'ALL', label: 'All Categories' },
    { key: 'IDENTITY_PROOF', label: 'Identity Proof' },
    { key: 'ADDRESS_PROOF', label: 'Address Proof' },
    { key: 'INCOME_PROOF', label: 'Income Proof' },
    { key: 'BANKING_PROOF', label: 'Banking Statements' },
    { key: 'BUSINESS_INCORPORATION', label: 'Business & Reg.' },
    { key: 'COLLATERAL_PROPERTY', label: 'Property Title' },
    { key: 'PHOTOGRAPH_SIGNATURE', label: 'Photo & Signature' },
  ];

  return (
    <div className="bg-white border border-slate-200 rounded text-xs space-y-3 p-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Encrypted file storage, automated OCR extraction, version history, and statutory expiry tracking.
          </p>
        </div>

        {onOpenUpload && (
          <button
            type="button"
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white font-semibold rounded hover:bg-slate-800 transition-colors self-start sm:self-auto text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
        )}
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setCategoryFilter(cat.key)}
            className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
              categoryFilter === cat.key
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Search & Status Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-2.5 rounded border border-slate-200">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-2.5 top-2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search document title, file name, masked ID..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-semibold text-[11px]">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800"
          >
            <option value="ALL">All Verification Statuses</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING_VERIFICATION">Pending Verification</option>
            <option value="ACTION_REQUIRED">Action Required</option>
            <option value="REJECTED">Rejected</option>
            <option value="EXPIRED">Expired</option>
            <option value="WAIVED">Waived</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="border border-slate-200 rounded overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-600 text-[11px] font-bold uppercase border-b border-slate-200">
              <th className="p-3">Document Title & Details</th>
              {showCustomerName && <th className="p-3">Borrower</th>}
              <th className="p-3">Category</th>
              <th className="p-3">Status</th>
              <th className="p-3">OCR & Quality</th>
              <th className="p-3">Validity / Expiry</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDocs.length === 0 ? (
              <tr>
                <td
                  colSpan={showCustomerName ? 7 : 6}
                  className="p-6 text-center text-slate-500"
                >
                  No documents found in vault matching current criteria.
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                  {/* Title & File Info */}
                  <td className="p-3">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 bg-slate-100 text-slate-700 rounded mt-0.5 shrink-0 border border-slate-200">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{doc.documentTitle}</span>
                          <span className="px-1 py-0.2 bg-slate-100 text-slate-600 font-mono text-[10px] rounded border border-slate-200">
                            v{doc.version}
                          </span>
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          <span className="font-mono">{doc.fileName}</span> • {doc.fileSizeKb} KB • {doc.fileFormat}
                        </div>
                        {doc.documentNumberMasked && (
                          <div className="text-[10px] font-mono text-slate-600 mt-0.5">
                            ID: {doc.documentNumberMasked}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Optional Borrower Name column */}
                  {showCustomerName && (
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{doc.customerName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{doc.customerNumber}</div>
                    </td>
                  )}

                  {/* Category */}
                  <td className="p-3">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-semibold rounded text-[11px]">
                      {doc.category.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="p-3">
                    <DocumentStatusBadge status={doc.status} size="sm" />
                    {doc.rejectionReason && (
                      <span className="block text-[10px] text-rose-700 mt-0.5 max-w-xs truncate" title={doc.rejectionNotes}>
                        {doc.rejectionReason}
                      </span>
                    )}
                  </td>

                  {/* OCR & Quality */}
                  <td className="p-3">
                    {doc.ocrExtractedData ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-800">
                          <span>OCR:</span>
                          <span className="text-emerald-700">{doc.ocrExtractedData.confidenceScore}%</span>
                        </div>
                        {doc.tamperScore !== undefined && (
                          <div className="text-[10px] text-slate-500">
                            Tamper check:{' '}
                            <span className={doc.tamperScore > 50 ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                              {doc.tamperScore}%
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">No OCR scan</span>
                    )}
                  </td>

                  {/* Validity / Expiry */}
                  <td className="p-3">
                    {doc.isLifetimeValid ? (
                      <span className="inline-flex items-center gap-1 text-slate-700 font-semibold text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Lifetime Valid
                      </span>
                    ) : doc.expiryDate ? (
                      <div>
                        <span className="font-mono text-slate-900 font-semibold text-[11px]">
                          {doc.expiryDate}
                        </span>
                        <span className="block text-[10px] text-slate-500">
                          Issued: {doc.issuedDate || 'N/A'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Standard Valid</span>
                    )}
                  </td>

                  {/* Action Buttons */}
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenViewer(doc)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-xs flex items-center gap-1 transition-colors"
                        title="Open Document Inspector & OCR Viewer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect</span>
                      </button>

                      {onVerify && doc.status === 'PENDING_VERIFICATION' && (
                        <button
                          type="button"
                          onClick={() => onVerify(doc.id)}
                          className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-semibold text-xs flex items-center gap-1 transition-colors"
                          title="Quick Approve Document"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                        </button>
                      )}

                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(doc.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
