import React from 'react';
import { KycRecord, CustomerRecord } from '../../types';
import { KycStatusBadge } from './KycStatusBadge';
import {
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  Fingerprint,
  Video,
  FileCheck2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Calendar,
  UserCheck,
} from 'lucide-react';

interface KycProfileCardProps {
  kyc?: KycRecord;
  customer: CustomerRecord;
  onOpenVerification: () => void;
  onTriggerApiSync?: (idType: 'PAN' | 'AADHAAR') => void;
  onOpenVideoKyc?: () => void;
}

export const KycProfileCard: React.FC<KycProfileCardProps> = ({
  kyc,
  customer,
  onOpenVerification,
  onTriggerApiSync,
  onOpenVideoKyc,
}) => {
  const currentStatus = kyc?.status || 'UNVERIFIED';

  const getRiskBadge = (risk?: string) => {
    switch (risk) {
      case 'LOW':
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 rounded">Low Risk</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-300 rounded">Medium Risk</span>;
      case 'HIGH':
      case 'AML_WATCHLIST':
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-300 rounded">High Risk / Watchlist</span>;
      case 'PEP':
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-purple-50 text-purple-800 border border-purple-300 rounded">PEP Declared</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300 rounded">Standard</span>;
    }
  };

  const getTierLabel = (tier?: string) => {
    switch (tier) {
      case 'TIER_3_FULL_CKYC':
        return 'Tier 3 (Full C-KYC & V-KYC)';
      case 'TIER_2_STANDARD':
        return 'Tier 2 (Standard e-KYC / OTP)';
      case 'TIER_1_BASIC':
        return 'Tier 1 (Minimum Simplified KYC)';
      default:
        return 'Tier 2 (Standard)';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded p-4 text-xs space-y-4">
      {/* Header with Title, Status & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 text-slate-800 rounded border border-slate-200">
            <ShieldCheck className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">KYC & Identity Verification</h2>
              <KycStatusBadge status={currentStatus} />
              {kyc && getRiskBadge(kyc.riskCategory)}
            </div>
            <p className="text-slate-500 text-xs mt-0.5">
              Statutory RBI master directions compliance, central registry (C-KYC), and biometric cross-checks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenVerification}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white font-semibold rounded hover:bg-slate-800 transition-colors text-xs"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Verification Workbench</span>
          </button>
        </div>
      </div>

      {/* Action required banner if applicable */}
      {kyc?.status === 'ACTION_REQUIRED' && kyc.actionRequiredNotes && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded flex items-start gap-2.5 text-orange-900">
          <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
          <div>
            <div className="font-bold text-xs">Action Required / Discrepancy Found</div>
            <p className="text-xs text-orange-800 mt-0.5">{kyc.actionRequiredNotes}</p>
          </div>
        </div>
      )}

      {/* Rejection banner if applicable */}
      {kyc?.status === 'REJECTED' && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded flex items-start gap-2.5 text-rose-900">
          <ShieldAlert className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
          <div>
            <div className="font-bold text-xs">KYC Verification Rejected</div>
            <p className="text-xs text-rose-800 mt-0.5">
              Reason: <span className="font-semibold">{kyc.rejectionReason}</span> — {kyc.rejectionRemarks || 'Does not meet lending policy guidelines.'}
            </p>
          </div>
        </div>
      )}

      {/* Key Metadata Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
          <span className="text-[10px] uppercase font-semibold text-slate-500">KYC Verification Level</span>
          <p className="font-semibold text-slate-900 text-xs mt-0.5">{getTierLabel(kyc?.kycLevel)}</p>
        </div>

        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
          <span className="text-[10px] uppercase font-semibold text-slate-500">C-KYC Reference (KIN)</span>
          <p className="font-mono font-semibold text-slate-900 text-xs mt-0.5">
            {kyc?.cKycNumber || 'Pending C-KYC Sync'}
          </p>
        </div>

        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
          <span className="text-[10px] uppercase font-semibold text-slate-500">AML Screening</span>
          <div className="flex items-center gap-1 mt-0.5">
            <span
              className={`w-2 h-2 rounded-full ${
                kyc?.amlCheckStatus === 'CLEARED'
                  ? 'bg-emerald-500'
                  : kyc?.amlCheckStatus === 'FLAGGED'
                  ? 'bg-rose-500'
                  : 'bg-amber-500'
              }`}
            />
            <p className="font-semibold text-slate-900 text-xs">
              {kyc?.amlCheckStatus === 'CLEARED'
                ? 'Passed / Cleared'
                : kyc?.amlCheckStatus === 'FLAGGED'
                ? 'Flagged for Review'
                : 'Manual Check Needed'}
            </p>
          </div>
        </div>

        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
          <span className="text-[10px] uppercase font-semibold text-slate-500">Last Reviewed / Next Cycle</span>
          <p className="text-slate-900 text-xs mt-0.5">
            {kyc?.lastReviewedAt ? kyc.lastReviewedAt.split(' ')[0] : 'Not reviewed'}
            {kyc?.nextReviewDate && (
              <span className="text-slate-500 text-[11px] block font-mono">
                Due: {kyc.nextReviewDate}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Primary Identity Cards Inspection Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* PAN Card Status */}
        <div className="p-3 border border-slate-200 rounded bg-white space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-slate-700" />
              <span className="font-bold text-slate-900 text-xs">Permanent Account Number (PAN)</span>
            </div>
            {kyc?.panRecord.isVerified ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> NSDL Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <AlertTriangle className="w-3 h-3" /> Verification Pending
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
            <div>
              <span className="text-[10px] text-slate-500 uppercase">Masked PAN</span>
              <p className="font-mono font-bold text-slate-900">
                {kyc?.panRecord.idNumberMasked || customer.panMasked || 'ABCDE••••F'}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase">Name On ITD Record</span>
              <p className="font-semibold text-slate-900">
                {kyc?.panRecord.nameOnId || customer.name.toUpperCase()}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase">Demographic Match</span>
              <p className="font-semibold text-slate-900">
                {kyc?.panRecord.nameMatchPercentage || 98}% match score
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase">Verification Source</span>
              <p className="text-slate-600 truncate" title={kyc?.panRecord.verificationSource}>
                {kyc?.panRecord.verificationSource || 'NSDL Taxpayer API v2.4'}
              </p>
            </div>
          </div>

          {onTriggerApiSync && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => onTriggerApiSync('PAN')}
                className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Re-verify via NSDL API</span>
              </button>
            </div>
          )}
        </div>

        {/* Aadhaar Card Status */}
        <div className="p-3 border border-slate-200 rounded bg-white space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-slate-700" />
              <span className="font-bold text-slate-900 text-xs">UIDAI Aadhaar (e-KYC / XML)</span>
            </div>
            {kyc?.aadhaarRecord.isVerified ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> UIDAI Validated
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <AlertTriangle className="w-3 h-3" /> OTP / XML Pending
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
            <div>
              <span className="text-[10px] text-slate-500 uppercase">Masked UIDAI Reference</span>
              <p className="font-mono font-bold text-slate-900">
                {kyc?.aadhaarRecord.idNumberMasked || customer.aadhaarMasked || '•••• •••• 1001'}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase">Name On Aadhaar</span>
              <p className="font-semibold text-slate-900">
                {kyc?.aadhaarRecord.nameOnId || customer.name}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase">Address Token Status</span>
              <p className="font-semibold text-emerald-700">e-KYC Pin Code Match</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase">Verification Source</span>
              <p className="text-slate-600 truncate" title={kyc?.aadhaarRecord.verificationSource}>
                {kyc?.aadhaarRecord.verificationSource || 'DigiLocker Paperless XML'}
              </p>
            </div>
          </div>

          {onTriggerApiSync && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => onTriggerApiSync('AADHAAR')}
                className="text-[11px] font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Sync DigiLocker Token</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Video KYC (V-KYC) Record Banner if completed */}
      {kyc?.videoKycRecord && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-200 text-slate-800 rounded">
              <Video className="w-4 h-4 text-slate-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">Video In-Person Verification (V-KYC)</span>
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                  {kyc.videoKycRecord.status}
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                Session {kyc.videoKycRecord.sessionId} • Liveness Score: {kyc.videoKycRecord.livenessConfidence}% • Face Match: {kyc.videoKycRecord.faceMatchScore}% • Officer: {kyc.videoKycRecord.officerName}
              </p>
            </div>
          </div>

          {onOpenVideoKyc && (
            <button
              type="button"
              onClick={onOpenVideoKyc}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-2.5 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 transition-colors self-start sm:self-auto"
            >
              View Session Audit Log
            </button>
          )}
        </div>
      )}
    </div>
  );
};
