import React, { useRef, useState, useEffect } from 'react';
import { PenTool, RotateCcw, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { SignatureCaptureData } from '../../types/formBuilderTypes';

interface SignaturePadProps {
  label?: string;
  description?: string;
  signerName?: string;
  signerRole?: string;
  value?: SignatureCaptureData | null;
  required?: boolean;
  onChange: (data: SignatureCaptureData | null) => void;
  disabled?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  label = 'Applicant Digital Signature',
  description = 'Please draw your official signature in the box below using mouse, touchpad, or touch screen.',
  signerName = 'Primary Applicant',
  signerRole = 'Borrower',
  value,
  required = false,
  onChange,
  disabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasDrawn, setHasDrawn] = useState<boolean>(!!value?.signatureDataUrl);
  const [signedMetadata, setSignedMetadata] = useState<SignatureCaptureData | null>(value || null);

  useEffect(() => {
    if (value && value.signatureDataUrl && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = value.signatureDataUrl;
      }
      setHasDrawn(true);
      setSignedMetadata(value);
    }
  }, [value]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a'; // Slate-900
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const captureData: SignatureCaptureData = {
      signatureDataUrl: dataUrl,
      signedAt: new Date().toISOString(),
      signerName,
      signerRole,
      ipAddress: '127.0.0.1 (Local Session)',
    };
    setSignedMetadata(captureData);
    onChange(captureData);
  };

  const handleClear = () => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setSignedMetadata(null);
    onChange(null);
  };

  return (
    <div className="space-y-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
            <PenTool className="w-3.5 h-3.5 text-blue-600" />
            <span>{label}</span>
            {required && <span className="text-rose-500 font-black">*</span>}
          </label>
          <p className="text-[11px] text-slate-500 mt-0.5">{description}</p>
        </div>

        {hasDrawn && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors flex items-center space-x-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear Signature</span>
          </button>
        )}
      </div>

      {/* Signature Box */}
      <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden shadow-inner flex flex-col items-center justify-center min-h-[140px]">
        <canvas
          ref={canvasRef}
          width={540}
          height={140}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`touch-none cursor-crosshair w-full h-[140px] ${
            disabled ? 'opacity-70 pointer-events-none' : ''
          }`}
        />

        {!hasDrawn && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-300 space-y-1">
            <PenTool className="w-6 h-6 stroke-1 text-slate-300" />
            <span className="text-xs font-medium text-slate-400">Draw signature here</span>
          </div>
        )}
      </div>

      {/* Signer Legal Metadata */}
      {signedMetadata && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
          <div className="flex items-center space-x-1.5 text-emerald-700 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Signed by: {signedMetadata.signerName} ({signedMetadata.signerRole || 'Signer'})</span>
          </div>
          <span className="font-mono text-slate-400">
            {new Date(signedMetadata.signedAt).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
};
