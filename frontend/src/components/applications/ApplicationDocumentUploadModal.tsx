import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, RefreshCw } from 'lucide-react';
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
  const [documentType] = useState(initialDocumentType);
  const [documentTitle] = useState(initialDocumentTitle);
  const [fileName, setFileName] = useState('');
  const [fileFormat, setFileFormat] = useState<'PDF' | 'JPG' | 'PNG' | 'DOCX'>('PDF');
  const [fileSizeKb, setFileSizeKb] = useState<number>(1450);
  const [notes, setNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto generate file name suggestion if empty
  React.useEffect(() => {
    if (!fileName && documentTitle) {
      const sanitized = documentTitle.replace(/[^a-zA-Z0-9]/g, '_');
      setFileName(`${sanitized}_Verified.${fileFormat.toLowerCase()}`);
    }
  }, [documentTitle, fileFormat, fileName]);

  const handleFilePicked = (file: File) => {
    setFileName(file.name);
    setFileSizeKb(Math.round(file.size / 1024) || 250);
    const lower = file.name.toLowerCase();
    if (lower.endsWith('.pdf')) setFileFormat('PDF');
    else if (lower.endsWith('.png')) setFileFormat('PNG');
    else if (lower.endsWith('.docx')) setFileFormat('DOCX');
    else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) setFileFormat('JPG');
  };

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
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 flex items-center justify-between">
            <span>{documentTitle}</span>
            <span className="font-mono text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-700 font-bold">
              {documentType}
            </span>
          </div>
        </div>

        {/* Drag & drop file input */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.[0]) {
              handleFilePicked(e.dataTransfer.files[0]);
            }
          }}
          className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-blue-600 bg-blue-50/80 ring-4 ring-blue-500/20'
              : fileName
              ? 'border-emerald-300 bg-emerald-50/30 hover:border-emerald-400'
              : 'border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30'
          }`}
        >
          {fileName ? (
            <div className="flex items-center justify-between gap-3 text-left">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[200px] block">
                      {fileName}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                      {fileFormat}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>File selected ({fileSizeKb} KB)</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-xs flex items-center space-x-1 shrink-0"
              >
                <RefreshCw className="w-3 h-3 text-slate-500" />
                <span>Change</span>
              </button>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-900 mb-0.5">
                Click to browse or drag & drop file
              </div>
              <p className="text-[11px] text-slate-500">
                Supports PDF, JPG, PNG, DOCX up to 15MB
              </p>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.docx"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFilePicked(e.target.files[0]);
              }
              e.target.value = '';
            }}
            className="hidden"
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
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-medium"
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
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white font-mono"
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
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!fileName.trim()}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-md shadow-blue-500/20"
          >
            Attach Document
          </button>
        </div>
      </form>
    </Modal>
  );
};
