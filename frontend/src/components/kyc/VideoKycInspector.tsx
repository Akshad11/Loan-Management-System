import React from 'react';
import { VideoKycRecord } from '../../types';
import { Video, MapPin, CheckCircle2, AlertTriangle, ShieldCheck, X, FileText, Camera, ShieldAlert } from 'lucide-react';

interface VideoKycInspectorProps {
  videoRecord: VideoKycRecord;
  customerName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const VideoKycInspector: React.FC<VideoKycInspectorProps> = ({
  videoRecord,
  customerName,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col text-xs">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-white rounded">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Video KYC (V-KYC) Session Inspector
              </h2>
              <p className="text-slate-500 text-xs">
                Session ID: <span className="font-mono font-bold text-slate-700">{videoRecord.sessionId}</span> • {customerName}
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

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Video Session Frame Simulation */}
          <div className="bg-slate-900 text-white rounded p-4 relative overflow-hidden border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-xs font-semibold uppercase text-slate-300">Recorded Live Stream Archive</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">{videoRecord.completedAt}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 my-2">
              {/* Simulated Face Frame */}
              <div className="bg-slate-800/80 border border-slate-700 rounded p-3 text-center flex flex-col items-center justify-center min-h-[140px]">
                <Camera className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-200">Borrower Live Portrait</span>
                <span className="text-[10px] text-emerald-400 mt-1 font-mono">
                  Liveness: {videoRecord.livenessConfidence}% (Active Blinking/Turn Passed)
                </span>
              </div>

              {/* Simulated ID Card Capture */}
              <div className="bg-slate-800/80 border border-slate-700 rounded p-3 text-center flex flex-col items-center justify-center min-h-[140px]">
                <ShieldCheck className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-200">Live PAN Card Capture</span>
                <span className="text-[10px] text-emerald-400 mt-1 font-mono">
                  Hologram & Microprint Verified
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Geo-Coordinates: {videoRecord.geoLatitude}, {videoRecord.geoLongitude}</span>
              <span>Encrypted SHA-256 Signature Valid</span>
            </div>
          </div>

          {/* Verification Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[10px] uppercase font-bold text-slate-500">Status</span>
              <p className="font-bold text-emerald-700 text-xs mt-0.5">{videoRecord.status}</p>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[10px] uppercase font-bold text-slate-500">Facial Match Score</span>
              <p className="font-mono font-bold text-slate-900 text-xs mt-0.5">
                {videoRecord.faceMatchScore}% Match
              </p>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[10px] uppercase font-bold text-slate-500">Liveness Confidence</span>
              <p className="font-mono font-bold text-slate-900 text-xs mt-0.5">
                {videoRecord.livenessConfidence}% High
              </p>
            </div>

            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[10px] uppercase font-bold text-slate-500">Conducting Officer</span>
              <p className="font-semibold text-slate-900 text-xs mt-0.5 truncate">
                {videoRecord.officerName}
              </p>
            </div>
          </div>

          {/* Geo Location Verification */}
          <div className="p-3 border border-slate-200 rounded bg-white flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-slate-700 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 text-xs">Geo-Fencing & IP Location Tag</span>
              <p className="text-xs text-slate-600 mt-0.5">
                Coordinates: {videoRecord.geoLatitude}, {videoRecord.geoLongitude} (Confirmed within Indian Territory per RBI V-CIP Guidelines).
              </p>
            </div>
          </div>

          {/* Audit Notes */}
          <div className="p-3 border border-slate-200 rounded bg-slate-50 space-y-1">
            <span className="font-bold text-slate-900 text-xs">Compliance Audit Remarks</span>
            <p className="text-xs text-slate-700">{videoRecord.notes}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded font-bold hover:bg-slate-800 text-xs"
          >
            Close Session View
          </button>
        </div>
      </div>
    </div>
  );
};
