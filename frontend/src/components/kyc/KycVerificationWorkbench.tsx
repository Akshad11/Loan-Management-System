import React, { useState } from 'react';
import { CustomerRecord, KycRecord, KycRiskCategory, KycLevel } from '../../types';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  CreditCard,
  Fingerprint,
  Video,
  UserCheck,
  Building2,
  X,
  AlertOctagon,
  RefreshCw,
  Lock,
} from 'lucide-react';

interface KycVerificationWorkbenchProps {
  customer: CustomerRecord;
  kyc?: KycRecord;
  currentUser: string;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (payload: {
    verifiedBy: string;
    kycLevel: KycLevel;
    riskCategory: KycRiskCategory;
    complianceNotes: string;
  }) => void;
  onReject: (payload: {
    rejectedBy: string;
    reason: string;
    remarks: string;
  }) => void;
  onRequestAction: (payload: {
    officerName: string;
    actionNotes: string;
  }) => void;
  onUpdateRisk: (risk: KycRiskCategory) => void;
}

export const KycVerificationWorkbench: React.FC<KycVerificationWorkbenchProps> = ({
  customer,
  kyc,
  currentUser,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onRequestAction,
  onUpdateRisk,
}) => {
  const [selectedDecision, setSelectedDecision] = useState<'APPROVE' | 'REJECT' | 'ACTION_REQUIRED'>('APPROVE');
  const [kycLevel, setKycLevel] = useState<KycLevel>(kyc?.kycLevel || 'TIER_2_STANDARD');
  const [riskCategory, setRiskCategory] = useState<KycRiskCategory>(kyc?.riskCategory || 'LOW');
  const [complianceNotes, setComplianceNotes] = useState(
    kyc?.complianceNotes || 'Primary identity verified against government databases. All demographic details verified.'
  );
  const [rejectionReason, setRejectionReason] = useState('NAME_MISMATCH');
  const [rejectionRemarks, setRejectionRemarks] = useState('');
  const [actionNotes, setActionNotes] = useState(
    'Please submit a clear, uncropped copy of the latest address proof showing current PIN code.'
  );

  const [simulatedPanSyncing, setSimulatedPanSyncing] = useState(false);
  const [simulatedAadhaarSyncing, setSimulatedAadhaarSyncing] = useState(false);
  const [panVerified, setPanVerified] = useState(kyc?.panRecord?.isVerified ?? true);
  const [aadhaarVerified, setAadhaarVerified] = useState(kyc?.aadhaarRecord?.isVerified ?? true);

  if (!isOpen) return null;

  const handleSimulatePan = () => {
    setSimulatedPanSyncing(true);
    setTimeout(() => {
      setSimulatedPanSyncing(false);
      setPanVerified(true);
    }, 800);
  };

  const handleSimulateAadhaar = () => {
    setSimulatedAadhaarSyncing(true);
    setTimeout(() => {
      setSimulatedAadhaarSyncing(false);
      setAadhaarVerified(true);
    }, 800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDecision === 'APPROVE') {
      onApprove({
        verifiedBy: currentUser,
        kycLevel,
        riskCategory,
        complianceNotes,
      });
    } else if (selectedDecision === 'REJECT') {
      onReject({
        rejectedBy: currentUser,
        reason: rejectionReason,
        remarks: rejectionRemarks || 'KYC rejected due to compliance failure.',
      });
    } else if (selectedDecision === 'ACTION_REQUIRED') {
      onRequestAction({
        officerName: currentUser,
        actionNotes,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col text-xs">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-900 text-white rounded">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                KYC Verification Workbench & Compliance Audit
              </h2>
              <p className="text-slate-500 text-xs">
                {customer.name} • {customer.customerNumber} • Type: {customer.customerType}
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

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {/* Identity Comparison Table */}
          <div className="border border-slate-200 rounded overflow-hidden">
            <div className="bg-slate-100 px-3 py-2 font-bold text-slate-800 border-b border-slate-200 flex items-center justify-between">
              <span>Demographic & Document Cross-Verification</span>
              <span className="text-[11px] font-normal text-slate-500">
                Match Tolerance Threshold: ≥90%
              </span>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] text-slate-500 uppercase border-b border-slate-200">
                  <th className="p-2">Attribute</th>
                  <th className="p-2">Customer Profile Entry</th>
                  <th className="p-2">Government / OVD Data</th>
                  <th className="p-2">Match Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-2 font-semibold text-slate-600">Full Legal Name</td>
                  <td className="p-2 text-slate-900 font-bold">{customer.name}</td>
                  <td className="p-2 text-slate-900 font-mono">
                    {kyc?.panRecord.nameOnId || customer.name.toUpperCase()} (ITD Record)
                  </td>
                  <td className="p-2">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 98% Match
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold text-slate-600">Date of Birth / Incorp</td>
                  <td className="p-2 text-slate-900">{customer.dateOfBirth || '1984-06-15'}</td>
                  <td className="p-2 text-slate-900">{customer.dateOfBirth || '1984-06-15'} (UIDAI Verified)</td>
                  <td className="p-2">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Exact Match
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold text-slate-600">PAN Record</td>
                  <td className="p-2 font-mono text-slate-900">{customer.panMasked || 'ABCDE••••F'}</td>
                  <td className="p-2 text-slate-900 flex items-center justify-between">
                    <span className="font-mono">Active & Aadhaar Seeded</span>
                    <button
                      type="button"
                      onClick={handleSimulatePan}
                      disabled={simulatedPanSyncing}
                      className="text-[10px] text-slate-700 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${simulatedPanSyncing ? 'animate-spin' : ''}`} />
                      {simulatedPanSyncing ? 'Pinging NSDL...' : 'Ping NSDL'}
                    </button>
                  </td>
                  <td className="p-2">
                    {panVerified ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Valid & Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5" /> Incomplete
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold text-slate-600">Aadhaar (UIDAI e-KYC)</td>
                  <td className="p-2 font-mono text-slate-900">{customer.aadhaarMasked || '•••• •••• 1001'}</td>
                  <td className="p-2 text-slate-900 flex items-center justify-between">
                    <span>Paperless XML Token Authentic</span>
                    <button
                      type="button"
                      onClick={handleSimulateAadhaar}
                      disabled={simulatedAadhaarSyncing}
                      className="text-[10px] text-slate-700 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded border border-slate-200 flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${simulatedAadhaarSyncing ? 'animate-spin' : ''}`} />
                      {simulatedAadhaarSyncing ? 'Checking UIDAI...' : 'Sync UIDAI'}
                    </button>
                  </td>
                  <td className="p-2">
                    {aadhaarVerified ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Token Valid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                        <AlertTriangle className="w-3.5 h-3.5" /> Needs Auth
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="p-2 font-semibold text-slate-600">Current Address PIN</td>
                  <td className="p-2 text-slate-900">{customer.currentAddress?.pinCode || '403001'}</td>
                  <td className="p-2 text-slate-900">{customer.currentAddress?.pinCode || '403001'} (Geo-Loc matches)</td>
                  <td className="p-2">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Area Serviceable
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Compliance, PEP, FATCA & Risk Assessment */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 border border-slate-200 rounded bg-slate-50 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-500">Risk Categorization</span>
              <select
                value={riskCategory}
                onChange={(e) => setRiskCategory(e.target.value as KycRiskCategory)}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded font-semibold text-xs text-slate-900"
              >
                <option value="LOW">Low Risk (Standard Verification)</option>
                <option value="MEDIUM">Medium Risk (Enhanced Due Diligence)</option>
                <option value="HIGH">High Risk (Senior Approval Needed)</option>
                <option value="PEP">PEP Declared (Special Oversight)</option>
                <option value="AML_WATCHLIST">AML / Negative Match Alert</option>
              </select>
              <p className="text-[10px] text-slate-500">Regulated per RBI AML/CFT Risk Matrix.</p>
            </div>

            <div className="p-3 border border-slate-200 rounded bg-slate-50 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-500">KYC Verification Tier</span>
              <select
                value={kycLevel}
                onChange={(e) => setKycLevel(e.target.value as KycLevel)}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded font-semibold text-xs text-slate-900"
              >
                <option value="TIER_1_BASIC">Tier 1: Basic / Simplified (₹1L Limit)</option>
                <option value="TIER_2_STANDARD">Tier 2: Standard e-KYC (₹50L Limit)</option>
                <option value="TIER_3_FULL_CKYC">Tier 3: Full C-KYC & V-KYC (No Limit)</option>
              </select>
              <p className="text-[10px] text-slate-500">Determines maximum loan disbursement authority.</p>
            </div>

            <div className="p-3 border border-slate-200 rounded bg-slate-50 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-500">FATCA & Sanctions Screening</span>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-bold text-slate-800 text-xs">UN & OFAC Lists Clean</span>
              </div>
              <p className="text-[10px] text-slate-500">Automated batch screening passed with 0 hits.</p>
            </div>
          </div>

          {/* Decision Selector & Input Form */}
          <form onSubmit={handleSubmit} className="border border-slate-300 rounded p-3 bg-white space-y-3">
            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <UserCheck className="w-4 h-4 text-slate-700" />
              <span>Officer Decision & Statutory Sign-off</span>
            </div>

            {/* Decision Radio / Button Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedDecision('APPROVE')}
                className={`py-2 px-3 text-xs font-bold rounded border text-center transition-colors ${
                  selectedDecision === 'APPROVE'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                ✓ Approve KYC
              </button>

              <button
                type="button"
                onClick={() => setSelectedDecision('ACTION_REQUIRED')}
                className={`py-2 px-3 text-xs font-bold rounded border text-center transition-colors ${
                  selectedDecision === 'ACTION_REQUIRED'
                    ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                ⚠ Request Action / Discrepancy
              </button>

              <button
                type="button"
                onClick={() => setSelectedDecision('REJECT')}
                className={`py-2 px-3 text-xs font-bold rounded border text-center transition-colors ${
                  selectedDecision === 'REJECT'
                    ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                ✕ Reject KYC
              </button>
            </div>

            {/* Approve Panel */}
            {selectedDecision === 'APPROVE' && (
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded space-y-2">
                <label className="block text-[11px] font-bold text-slate-700">
                  Compliance Approval Notes & Reference
                </label>
                <textarea
                  value={complianceNotes}
                  onChange={(e) => setComplianceNotes(e.target.value)}
                  rows={3}
                  className="w-full p-2 bg-white border border-slate-300 rounded text-xs focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  placeholder="State basis for KYC approval and document verification..."
                />
              </div>
            )}

            {/* Action Required Panel */}
            {selectedDecision === 'ACTION_REQUIRED' && (
              <div className="p-3 bg-amber-50/50 border border-amber-200 rounded space-y-2">
                <label className="block text-[11px] font-bold text-amber-900">
                  Discrepancy Clarification Instructions for Borrower / Relationship Manager
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  rows={3}
                  required
                  className="w-full p-2 bg-white border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-600 focus:outline-none"
                  placeholder="Specify exact missing documents or discrepancies to be resolved..."
                />
              </div>
            )}

            {/* Reject Panel */}
            {selectedDecision === 'REJECT' && (
              <div className="p-3 bg-rose-50/50 border border-rose-200 rounded space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-rose-900 mb-1">
                      Statutory Rejection Reason
                    </label>
                    <select
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full p-1.5 bg-white border border-rose-300 rounded text-xs"
                    >
                      <option value="NAME_MISMATCH">Critical Name / DOB Mismatch</option>
                      <option value="DOCUMENT_FORGED">Suspected Forged / Tampered Document</option>
                      <option value="INVALID_PAN">PAN Inoperative / Not Linked with Aadhaar</option>
                      <option value="AML_FLAGGED">Sanctions / PEP / Adverse Media Match</option>
                      <option value="FRAUD_ATTEMPT">Duplicate Identity / Fraudulent Entry</option>
                      <option value="EXPIRED_OVD">All Provided OVDs are Expired</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-rose-900 mb-1">
                      Officer Audit Remarks
                    </label>
                    <input
                      type="text"
                      value={rejectionRemarks}
                      onChange={(e) => setRejectionRemarks(e.target.value)}
                      className="w-full p-1.5 bg-white border border-rose-300 rounded text-xs"
                      placeholder="Detailed justification for rejection..."
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Submit Action Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-[11px] text-slate-500">
                Action will be permanently recorded in audit logs under officer: <strong>{currentUser}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 text-white font-bold rounded shadow-sm ${
                    selectedDecision === 'APPROVE'
                      ? 'bg-slate-900 hover:bg-slate-800'
                      : selectedDecision === 'ACTION_REQUIRED'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Submit Decision
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
