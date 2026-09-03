import React, { useState } from 'react';
import { CustomerRecord, DocumentCategory } from '../../types';
import {
  UploadCloud,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

interface DocumentUploadModalProps {
  customer: CustomerRecord;
  isOpen: boolean;
  onClose: () => void;
  currentUser: string;
  onUpload: (payload: {
    category: DocumentCategory;
    documentType: string;
    documentTitle: string;
    documentNumberMasked?: string;
    fileName: string;
    fileFormat: 'PDF' | 'JPG' | 'PNG' | 'TIFF';
    fileSizeKb: number;
    uploadedBy: string;
    uploadedByRole: string;
    issuedDate?: string;
    expiryDate?: string;
    isLifetimeValid: boolean;
    loanApplicationId?: string;
  }) => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  customer,
  isOpen,
  onClose,
  currentUser,
  onUpload,
}) => {
  const [category, setCategory] = useState<DocumentCategory>('IDENTITY_PROOF');
  const [documentType, setDocumentType] = useState('PAN_CARD');
  const [documentTitle, setDocumentTitle] = useState('Permanent Account Number (PAN) Card');
  const [documentNumberMasked, setDocumentNumberMasked] = useState(customer.panMasked || '');
  const [fileName, setFileName] = useState('PAN_CARD_SCAN.pdf');
  const [fileFormat, setFileFormat] = useState<'PDF' | 'JPG' | 'PNG' | 'TIFF'>('PDF');
  const [fileSizeKb, setFileSizeKb] = useState(780);
  const [isLifetimeValid, setIsLifetimeValid] = useState(true);
  const [issuedDate, setIssuedDate] = useState('2022-01-15');
  const [expiryDate, setExpiryDate] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleCategoryChange = (newCat: DocumentCategory) => {
    setCategory(newCat);
    if (newCat === 'IDENTITY_PROOF') {
      setDocumentType('PAN_CARD');
      setDocumentTitle('Permanent Account Number (PAN) Card');
      setIsLifetimeValid(true);
    } else if (newCat === 'ADDRESS_PROOF') {
      setDocumentType('AADHAAR_CARD');
      setDocumentTitle('Aadhaar Card (UIDAI e-KYC)');
      setIsLifetimeValid(true);
    } else if (newCat === 'INCOME_PROOF') {
      setDocumentType('SALARY_SLIPS');
      setDocumentTitle('Recent Salary Slips (Last 3 Months)');
      setIsLifetimeValid(false);
      setExpiryDate('2025-06-30');
    } else if (newCat === 'BANKING_PROOF') {
      setDocumentType('BANK_STATEMENT');
      setDocumentTitle('Bank Statement (6 Months)');
      setIsLifetimeValid(false);
      setExpiryDate('2025-08-30');
    } else if (newCat === 'BUSINESS_INCORPORATION') {
      setDocumentType('GST_UDYAM_CERTIFICATE');
      setDocumentTitle('GST Registration & Udyam MSME Certificate');
      setIsLifetimeValid(true);
    } else if (newCat === 'COLLATERAL_PROPERTY') {
      setDocumentType('TITLE_DEED_NOC');
      setDocumentTitle('Property Title Deed & Non-Encumbrance Certificate');
      setIsLifetimeValid(true);
    }
  };

  const handleSimulatedDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      setFileName(f.name);
      setFileSizeKb(Math.round(f.size / 1024) || 640);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpload({
      category,
      documentType,
      documentTitle,
      documentNumberMasked,
      fileName: fileName || 'DOCUMENT_SCAN.pdf',
      fileFormat,
      fileSizeKb: fileSizeKb || 550,
      uploadedBy: currentUser,
      uploadedByRole: 'Operations Officer',
      issuedDate: issuedDate || undefined,
      expiryDate: isLifetimeValid ? undefined : expiryDate || undefined,
      isLifetimeValid,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col text-xs">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-white rounded">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Upload & Catalog Document</h2>
              <p className="text-slate-500 text-xs">
                Borrower: <span className="font-semibold text-slate-700">{customer.name}</span> ({customer.customerNumber})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3.5 flex-1">
          {/* Dropzone Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleSimulatedDrop}
            className={`border-2 border-dashed rounded p-5 text-center cursor-pointer transition-colors ${
              isDragging ? 'border-blue-600 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <div className="font-bold text-slate-900 text-xs">
              Drag and drop files here, or browse from workstation
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Supports PDF, JPG, PNG up to 15 MB • Automatically encrypted & OCR processed
            </p>
            <div className="mt-2 text-xs font-mono font-semibold text-slate-700 bg-white border border-slate-200 py-1 px-3 rounded inline-block">
              Selected: {fileName} ({fileSizeKb} KB)
            </div>
          </div>

          {/* Category & Document Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Document Category *
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as DocumentCategory)}
                className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-medium"
              >
                <option value="IDENTITY_PROOF">Identity Proof (OVD)</option>
                <option value="ADDRESS_PROOF">Address Proof</option>
                <option value="INCOME_PROOF">Income & Tax Proof</option>
                <option value="BANKING_PROOF">Bank Statement</option>
                <option value="BUSINESS_INCORPORATION">Business & Registration</option>
                <option value="COLLATERAL_PROPERTY">Property Title & Collateral</option>
                <option value="PHOTOGRAPH_SIGNATURE">Photo & Signature Specimen</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Document Format
              </label>
              <select
                value={fileFormat}
                onChange={(e) => setFileFormat(e.target.value as any)}
                className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-medium"
              >
                <option value="PDF">PDF (Portable Document Format)</option>
                <option value="JPG">JPG / JPEG Image</option>
                <option value="PNG">PNG High-Res Image</option>
                <option value="TIFF">TIFF Scanned File</option>
              </select>
            </div>
          </div>

          {/* Document Title */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Document Display Title *
            </label>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              required
              className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-semibold"
              placeholder="e.g. Salary Slips - Oct 2024 to Dec 2024"
            />
          </div>

          {/* Document ID Number (Masked) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Document / Certificate / Reference Number (Masked)
            </label>
            <input
              type="text"
              value={documentNumberMasked}
              onChange={(e) => setDocumentNumberMasked(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-mono"
              placeholder="e.g. ABCDE••••F or Account #•••• 8492"
            />
          </div>

          {/* Validity & Expiry */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2.5">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="lifetimeCheck"
                checked={isLifetimeValid}
                onChange={(e) => setIsLifetimeValid(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <label htmlFor="lifetimeCheck" className="font-bold text-slate-800 text-xs cursor-pointer">
                Lifetime Validity (No Expiration Date)
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">
                  Issued Date
                </label>
                <input
                  type="date"
                  value={issuedDate}
                  onChange={(e) => setIssuedDate(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  disabled={isLifetimeValid}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs disabled:bg-slate-100 disabled:text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <span className="text-[11px] text-slate-500">
              Uploaded by: <strong>{currentUser}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 border border-slate-300 rounded font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded shadow-xs"
              >
                Upload & Register Document
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
