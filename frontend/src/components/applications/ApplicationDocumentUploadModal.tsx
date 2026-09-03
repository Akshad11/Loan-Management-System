import React, { useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Modal } from '../shared/Modal';

interface ApplicationDocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (payload: {
    documentType: string;
    documentTitle: string;
    fileName: string;
    fileFormat: 'PDF' | 'JPG' | 'PNG' | 'DOCX';
    fileSizeKb: number;
    isMandatory?: boolean;
    notes?: string;
  }) => void;
  initialDocumentType?: string;
  initialDocumentTitle?: string;
  isMandatory?: boolean;
}

export const ApplicationDocumentUploadModal: React.FC<ApplicationDocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  initialDocumentType = 'BANK_STATEMENT',
  initialDocumentTitle = 'Bank Operating Account Statement',
  isMandatory = true,
}) => {
  const [documentType, setDocumentType] = useState(initialDocumentType);
  const [documentTitle, setDocumentTitle] = useState(initialDocumentTitle);
  const [fileName, setFileName] = useState('');
  const [fileFormat, setFileFormat] = useState<'PDF' | 'JPG' | 'PNG' | 'DOCX'>('PDF');
  const [fileSizeKb, setFileSizeKb] = useState<number>(1450);
  const [notes, setNotes] = useState('');

  // Auto generate file name suggestion if empty
  React.useEffect(() => {
    if (!fileName && documentTitle) {
      const sanitized = documentTitle.replace(/[^a-zA-Z0-9]/g, '_');
      setFileName(`${sanitized}_Verified.${fileFormat.toLowerCase()}`);
    }
  }, [documentTitle, fileFormat, fileName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;

    onUpload({
      documentType,
      documentTitle,
      fileName,
      fileFormat,
      fileSizeKb,
      isMandatory,
      notes,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Upload Application Document — ${documentTitle}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Document Requirement
          </label>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-900">
            {documentTitle} ({documentType})
          </div>
        </div>

        {/* Drag & drop simulated file input */}
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 bg-slate-50/50">
          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <div className="text-xs font-medium text-slate-900 mb-1">
            Simulated Document Attachment
          </div>
          <p className="text-[11px] text-slate-500 mb-3">
            Supports PDF, JPG, PNG, DOCX up to 15MB
          </p>

          <input
            type="text"
            placeholder="File name (e.g. Salary_Slips_Q2_Signed.pdf)"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="w-full max-w-sm mx-auto px-3 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              File Format
            </label>
            <select
              value={fileFormat}
              onChange={(e) => setFileFormat(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white font-medium"
            >
              <option value="PDF">PDF Document</option>
              <option value="JPG">JPG Image</option>
              <option value="PNG">PNG Image</option>
              <option value="DOCX">DOCX Word File</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              File Size (KB)
            </label>
            <input
              type="number"
              value={fileSizeKb}
              onChange={(e) => setFileSizeKb(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Verification Remarks / Notes
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Scanned copy with self-attestation and employer stamp..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-md border border-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!fileName.trim()}
            className="px-5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-md shadow-sm"
          >
            Attach Document
          </button>
        </div>
      </form>
    </Modal>
  );
};
