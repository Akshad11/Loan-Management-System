'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  RotateCcw,
  User,
  Users,
  DollarSign,
  Scale,
  Building,
  Check,
  X,
  ChevronRight,
  RefreshCw,
  FileCheck,
  Sliders,
  Send,
  Lock,
} from 'lucide-react';
import { BureauAnalysisTab } from '../bureau/BureauAnalysisTab';
import { CollateralTab } from '../collateral/CollateralTab';
import { CoApplicantManager } from '../applications/CoApplicantManager';

interface CreditReviewWorkbenchProps {
  applicationId: string;
  onBack?: () => void;
  currentUser?: {
    id: string;
    name: string;
    roleName: string;
    permissions: string[];
    isSystemAdmin?: boolean;
  };
}

export const CreditReviewWorkbench: React.FC<CreditReviewWorkbenchProps> = ({
  applicationId,
  onBack,
  currentUser = {
    id: 'user_1',
    name: 'Sunita Patel',
    roleName: 'Senior Credit Underwriter',
    permissions: ['*'],
  },
}) => {
  const [activeTab, setActiveTab] = useState<string>('CHECKLIST');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Application & Related Data State
  const [application, setApplication] = useState<any>(null);
  const [workflowState, setWorkflowState] = useState<any>(null);
  const [checklist, setChecklist] = useState<any>(null);
  const [documentHub, setDocumentHub] = useState<any>(null);
  const [deviationsData, setDeviationsData] = useState<any>(null);
  const [decisionsData, setDecisionsData] = useState<any>(null);
  const [preDisbResult, setPreDisbResult] = useState<any>(null);

  // Modals
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState('DOCUMENT_DEFICIENCY');
  const [returnComments, setReturnComments] = useState('');
  const [returnCorrections, setReturnCorrections] = useState<string>('Provide updated 3 months payslips and signed KYC consent form');

  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionType, setDecisionType] = useState<'APPROVE' | 'REJECT' | 'APPROVE_WITH_CONDITIONS'>('APPROVE');
  const [approvedAmount, setApprovedAmount] = useState<number>(0);
  const [approvedTenure, setApprovedTenure] = useState<number>(36);
  const [approvedRoi, setApprovedRoi] = useState<number>(10.5);
  const [decisionRemarks, setDecisionRemarks] = useState('');
  const [newConditionText, setNewConditionText] = useState('');
  const [decisionConditions, setDecisionConditions] = useState<string[]>([]);

  const [showDeviationModal, setShowDeviationModal] = useState(false);
  const [newDevTitle, setNewDevTitle] = useState('');
  const [newDevCategory, setNewDevCategory] = useState<'POLICY' | 'FOIR' | 'LTV' | 'CIBIL' | 'ROI'>('POLICY');
  const [newDevReason, setNewDevReason] = useState('');
  const [newDevMitigant, setNewDevMitigant] = useState('');
  const [newDevSeverity, setNewDevSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');

  const [rejectDocModal, setRejectDocModal] = useState<{ id: string; title: string } | null>(null);
  const [docRejectReason, setDocRejectReason] = useState('');

  const loadAllWorkbenchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [appRes, wfRes, chkRes, docRes, devRes, decRes, preRes] = await Promise.all([
        fetch(`/api/applications/${applicationId}`),
        fetch(`/api/applications/${applicationId}/workflow`),
        fetch(`/api/applications/${applicationId}/checklist`),
        fetch(`/api/applications/${applicationId}/documents/requirements`),
        fetch(`/api/applications/${applicationId}/deviations`),
        fetch(`/api/applications/${applicationId}/decisions`),
        fetch(`/api/applications/${applicationId}/pre-disbursement-check`),
      ]);

      if (!appRes.ok) throw new Error('Failed to load application details.');

      const appData = await appRes.json();
      setApplication(appData);
      setApprovedAmount(Number(appData.requestedAmount || 0));
      setApprovedTenure(Number(appData.requestedTenureMonths || 36));
      setApprovedRoi(Number(appData.interestRate || 10.5));

      if (wfRes.ok) setWorkflowState(await wfRes.json());
      if (chkRes.ok) setChecklist(await chkRes.json());
      if (docRes.ok) setDocumentHub(await docRes.json());
      if (devRes.ok) setDeviationsData(await devRes.json());
      if (decRes.ok) setDecisionsData(await decRes.json());
      if (preRes.ok) setPreDisbResult(await preRes.json());
    } catch (err: any) {
      console.error('Error loading workbench:', err);
      setError(err.message || 'Failed to initialize credit review workbench.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllWorkbenchData();
  }, [applicationId]);

  // Stage Transition Handler
  const handleTransitionStage = async (targetStage: string) => {
    try {
      const res = await fetch(`/api/applications/${applicationId}/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetStage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update workflow stage.');

      setSuccessMsg(`Workflow stage progressed to ${targetStage}`);
      setTimeout(() => setSuccessMsg(null), 4000);
      loadAllWorkbenchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Checklist Item Update Handler
  const handleUpdateChecklist = async (itemId: string, status: 'PASSED' | 'FAILED' | 'WAIVED') => {
    try {
      const res = await fetch(`/api/applications/${applicationId}/checklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, status }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update checklist item');
      }
      loadAllWorkbenchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Document Verification / Rejection
  const handleVerifyDocument = async (docId: string) => {
    try {
      const res = await fetch(`/api/applications/${applicationId}/documents/${docId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'VERIFY' }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to verify document');
      }
      loadAllWorkbenchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRejectDocument = async () => {
    if (!rejectDocModal || !docRejectReason) return;
    try {
      const res = await fetch(`/api/applications/${applicationId}/documents/${rejectDocModal.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT', reason: docRejectReason }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to reject document');
      }
      setRejectDocModal(null);
      setDocRejectReason('');
      loadAllWorkbenchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Create Deviation
  const handleCreateDeviation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/applications/${applicationId}/deviations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newDevTitle,
          category: newDevCategory,
          deviationReason: newDevReason,
          mitigantNotes: newDevMitigant,
          severity: newDevSeverity,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create deviation');
      }
      setShowDeviationModal(false);
      setNewDevTitle('');
      setNewDevReason('');
      setNewDevMitigant('');
      loadAllWorkbenchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Approve / Reject Deviation
  const handleDeviationAction = async (devId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      const res = await fetch(`/api/applications/${applicationId}/deviations/${devId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: action === 'REJECT' ? 'Rejected by underwriter' : undefined }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to execute deviation action');
      }
      loadAllWorkbenchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Return for Correction
  const handleReturnForCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const corrections = returnCorrections
        .split('\n')
        .map((c) => c.trim())
        .filter(Boolean);

      const res = await fetch(`/api/applications/${applicationId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnReason,
          comments: returnComments,
          requiredCorrections: corrections,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to return application');
      }

      setShowReturnModal(false);
      setSuccessMsg('Application successfully returned for correction.');
      setTimeout(() => setSuccessMsg(null), 4000);
      loadAllWorkbenchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Submit Credit Decision
  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/applications/${applicationId}/decisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: decisionType,
          approvedAmount: Number(approvedAmount),
          approvedTenureMonths: Number(approvedTenure),
          approvedRoi: Number(approvedRoi),
          conditions: decisionConditions,
          remarks: decisionRemarks,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit credit decision');
      }

      setShowDecisionModal(false);
      setSuccessMsg(`Decision ${decisionType} recorded successfully.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      loadAllWorkbenchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-700">Loading Credit Review Workbench...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-8 text-center bg-red-50 rounded-xl border border-red-200">
        <p className="text-red-700 font-semibold">Application details could not be found.</p>
        {onBack && (
          <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-md text-xs font-semibold">
            Go Back
          </button>
        )}
      </div>
    );
  }

  // Maker-checker check: has the current user authored the proposal?
  const makerName = application.assignedOfficerId || application.loanOfficer || application.submittedBy;
  const isMakerSelf = makerName && makerName.trim().toLowerCase() === currentUser.name.trim().toLowerCase();

  const STAGES_PIPELINE = [
    'SUBMITTED',
    'DOCUMENT_REVIEW',
    'BUREAU_REVIEW',
    'ELIGIBILITY_REVIEW',
    'CREDIT_REVIEW',
    'DEVIATION_REVIEW',
    'APPROVAL',
    'APPROVED',
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Sticky Action Area */}
      <div className="bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
                {application.productName} ({application.productCode})
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-white">{application.applicationNumber}</h1>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                  application.status === 'APPROVED' || application.status === 'SANCTIONED'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : application.status === 'REJECTED'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    : application.status === 'RETURNED_FOR_CORRECTION'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}
              >
                {application.status.replace(/_/g, ' ')}
              </span>
            </div>

            <p className="text-slate-400 text-sm mt-1">
              Primary Borrower:{' '}
              <strong className="text-slate-200">
                {application.customer?.name || application.customerName}
              </strong>{' '}
              ({application.customer?.panNumberMasked || 'PAN Verified'}) • Branch:{' '}
              <span className="text-slate-300">{application.branchName || 'Main'}</span>
            </p>
          </div>

          {/* Quick Stats & Action Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700">
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                Requested Exposure
              </span>
              <span className="text-lg font-black text-emerald-400">
                ₹{Number(application.requestedAmount).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700">
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                Maker Underwriter
              </span>
              <span className="text-sm font-semibold text-slate-200">
                {application.loanOfficer || 'Unassigned'}
              </span>
            </div>

            <button
              onClick={() => setShowReturnModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/50 rounded-lg transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Return for Correction
            </button>

            <button
              onClick={() => setShowDecisionModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow transition"
            >
              <FileCheck className="w-4 h-4" />
              Make Credit Decision
            </button>
          </div>
        </div>

        {/* Workflow Stage Progression Stepper */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 overflow-x-auto">
          <div className="flex items-center min-w-max gap-2 text-xs">
            {STAGES_PIPELINE.map((st, idx) => {
              const currentIdx = STAGES_PIPELINE.indexOf(application.status);
              const isPast = currentIdx > idx;
              const isCurrent = application.status === st;

              return (
                <div key={st} className="flex items-center gap-2">
                  <button
                    onClick={() => handleTransitionStage(st)}
                    disabled={isCurrent}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-sm font-bold ring-2 ring-blue-400/40'
                        : isPast
                        ? 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
                        : 'bg-slate-800/40 text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                    }`}
                  >
                    {isPast ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[9px]">
                        {idx + 1}
                      </span>
                    )}
                    {st.replace(/_/g, ' ')}
                  </button>
                  {idx < STAGES_PIPELINE.length - 1 && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error & Success Alerts */}
      {error && (
        <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Maker-Checker Warning */}
      {isMakerSelf && !currentUser.isSystemAdmin && (
        <div className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-medium">
          <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>
            <strong>Maker-Checker Policy:</strong> You are recorded as the loan officer / maker for this proposal. Under segregation of duties, formal approval decisions must be signed off by a separate checker/credit manager.
          </span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-1.5 overflow-x-auto">
        <nav className="flex space-x-1 min-w-max">
          {[
            { id: 'CHECKLIST', label: `Checklist (${checklist?.passed || 0}/${checklist?.total || 0})`, icon: FileCheck },
            { id: 'DOCUMENTS', label: `Documents (${documentHub?.verified || 0}/${documentHub?.mandatoryTotal || 0})`, icon: FileText },
            { id: 'DEVIATIONS', label: `Deviations (${deviationsData?.pending || 0} Open)`, icon: Sliders },
            { id: 'BUREAU', label: 'Credit Bureau', icon: ShieldCheck },
            { id: 'COLLATERAL', label: 'Collateral & LTV', icon: Building },
            { id: 'PARTIES', label: 'Borrowers & Co-Applicants', icon: Users },
            { id: 'DECISIONS', label: `Decisions & Returns (${decisionsData?.decisions?.length || 0})`, icon: CheckCircle2 },
            { id: 'READINESS', label: 'Pre-Disbursement Gates', icon: Scale },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg transition ${
                  isActive
                    ? 'bg-slate-900 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB CONTENT: 1. CHECKLIST */}
      {activeTab === 'CHECKLIST' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Underwriting & Credit Review Checklist</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every mandatory item must be marked PASSED or WAIVED before an approval stage transition is permitted.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">
                Completion: {checklist?.completionPercentage || 0}%
              </span>
              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    checklist?.isCompliant ? 'bg-emerald-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${checklist?.completionPercentage || 0}%` }}
                />
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {(checklist?.items || []).map((item: any) => (
              <div key={item.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {item.status === 'PASSED' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : item.status === 'WAIVED' ? (
                      <Check className="w-4 h-4 text-blue-600" />
                    ) : item.status === 'FAILED' ? (
                      <XCircle className="w-4 h-4 text-rose-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{item.title}</span>
                      {item.isRequired && (
                        <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                          MANDATORY
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">[{item.category}]</span>
                    </div>
                    {item.reviewedAt && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Reviewed by {item.reviewerName || 'Officer'} on{' '}
                        {new Date(item.reviewedAt).toLocaleDateString()}
                        {item.remarks && ` — "${item.remarks}"`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <button
                    onClick={() => handleUpdateChecklist(item.id, 'PASSED')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded border transition ${
                      item.status === 'PASSED'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300'
                    }`}
                  >
                    Pass
                  </button>
                  <button
                    onClick={() => handleUpdateChecklist(item.id, 'WAIVED')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded border transition ${
                      item.status === 'WAIVED'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300'
                    }`}
                  >
                    Waive
                  </button>
                  <button
                    onClick={() => handleUpdateChecklist(item.id, 'FAILED')}
                    className={`px-2.5 py-1 text-xs font-semibold rounded border transition ${
                      item.status === 'FAILED'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300'
                    }`}
                  >
                    Fail
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. DOCUMENTS */}
      {activeTab === 'DOCUMENTS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Document Completeness & Verification Hub</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configured requirements for primary borrower, co-applicants, and pledged collateral.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-700">
                {documentHub?.mandatoryVerified || 0} / {documentHub?.mandatoryTotal || 0} Mandatory Verified
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {['primary', 'coApplicants', 'collateral'].map((grpKey) => {
              const docs = documentHub?.groups?.[grpKey] || [];
              if (docs.length === 0) return null;

              const title =
                grpKey === 'primary'
                  ? 'Primary Applicant Documents'
                  : grpKey === 'coApplicants'
                  ? 'Co-Applicant Documents'
                  : 'Collateral & Property Documents';

              return (
                <div key={grpKey} className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h3>
                  <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100">
                    {docs.map((doc: any) => (
                      <div key={doc.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">{doc.documentTitle}</span>
                            {doc.isMandatory && (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded">
                                REQUIRED
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                doc.status === 'VERIFIED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : doc.status === 'REJECTED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {doc.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {doc.notes || 'Standard verification file.'}
                            {doc.verifiedBy && ` • Verified by ${doc.verifiedBy}`}
                            {doc.rejectionReason && (
                              <span className="text-rose-600 block mt-0.5">
                                Reason for rejection: {doc.rejectionReason}
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {doc.status !== 'VERIFIED' && (
                            <button
                              onClick={() => handleVerifyDocument(doc.id)}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded shadow-sm"
                            >
                              Verify
                            </button>
                          )}
                          {doc.status !== 'REJECTED' && (
                            <button
                              onClick={() => setRejectDocModal({ id: doc.id, title: doc.documentTitle })}
                              className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. DEVIATIONS & ROI */}
      {activeTab === 'DEVIATIONS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Policy Deviations & ROI Negotiation</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Log exception proposals for FOIR, LTV, CIBIL waivers, or rate concessions.
              </p>
            </div>
            <button
              onClick={() => setShowDeviationModal(true)}
              className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-500 shadow-sm"
            >
              + Raise Deviation
            </button>
          </div>

          <div className="space-y-3">
            {(deviationsData?.deviations || []).length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center bg-slate-50 rounded-lg">
                No policy deviations logged for this application.
              </p>
            ) : (
              deviationsData.deviations.map((dev: any) => (
                <div key={dev.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700">{dev.deviationNumber}</span>
                      <span className="text-xs font-bold text-slate-900">{dev.title}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          dev.severity === 'CRITICAL' || dev.severity === 'HIGH'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {dev.severity}
                      </span>
                      <span className="text-[10px] bg-slate-200 text-slate-800 font-bold px-1.5 py-0.5 rounded">
                        {dev.category}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        dev.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : dev.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {dev.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700">{dev.deviationReason}</p>
                  {dev.mitigantNotes && (
                    <p className="text-xs text-slate-500 italic">
                      <strong>Mitigant:</strong> {dev.mitigantNotes}
                    </p>
                  )}

                  {dev.status === 'PENDING' && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 justify-end">
                      <button
                        onClick={() => handleDeviationAction(dev.id, 'APPROVE')}
                        className="px-3 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded"
                      >
                        Approve Deviation
                      </button>
                      <button
                        onClick={() => handleDeviationAction(dev.id, 'REJECT')}
                        className="px-3 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. BUREAU ANALYSIS */}
      {activeTab === 'BUREAU' && (
        <BureauAnalysisTab
          applicationId={applicationId}
          primaryApplicant={{
            id: application.customerId,
            name: application.customer?.name || application.customerName,
            panMasked: application.customer?.panMasked,
          }}
          coApplicants={application.coApplicants || []}
        />
      )}

      {/* TAB CONTENT: 5. COLLATERAL */}
      {activeTab === 'COLLATERAL' && (
        <CollateralTab
          applicationId={applicationId}
          customerId={application.customerId}
          loanAmount={Number(application.requestedAmount)}
        />
      )}

      {/* TAB CONTENT: 6. BORROWERS & CO-APPLICANTS */}
      {activeTab === 'PARTIES' && (
        <CoApplicantManager
          applicationId={applicationId}
          primaryApplicantId={application.customerId}
          primaryApplicantName={application.customer?.name || application.customerName}
          primaryMonthlyIncome={Number(application.customerMonthlyIncome || 0)}
          coApplicants={application.coApplicants || []}
          onCoApplicantChange={loadAllWorkbenchData}
          isDraft={application.status === 'DRAFT'}
        />
      )}

      {/* TAB CONTENT: 7. DECISIONS & RETURNS */}
      {activeTab === 'DECISIONS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Credit Decisions & Return History Trail</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical decisions and return-for-correction cycles are recorded immutably.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase text-slate-400">Formal Decision Records</h3>
            {(decisionsData?.decisions || []).length === 0 ? (
              <p className="text-xs text-slate-500 py-4 bg-slate-50 rounded-lg text-center">
                No formal decisions recorded yet.
              </p>
            ) : (
              decisionsData.decisions.map((dec: any) => (
                <div key={dec.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50/60 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-700">{dec.decisionNumber}</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        dec.decision.includes('APPROVE')
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {dec.decision}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 font-semibold">
                    Decided by {dec.decisionMakerName} ({dec.decisionMakerRole}) on{' '}
                    {new Date(dec.decisionDate).toLocaleDateString()}
                  </p>
                  {dec.approvedAmount && (
                    <p className="text-xs text-emerald-700 font-bold">
                      Sanctioned Amount: ₹{Number(dec.approvedAmount).toLocaleString('en-IN')} • Tenure:{' '}
                      {dec.approvedTenureMonths} Mos • Rate: {dec.approvedRoi}%
                    </p>
                  )}
                  {dec.remarks && <p className="text-xs text-slate-600 mt-1">"{dec.remarks}"</p>}
                </div>
              ))
            )}

            <h3 className="text-xs font-bold uppercase text-slate-400 pt-4">Return for Correction Cycles</h3>
            {(decisionsData?.returnHistory || []).length === 0 ? (
              <p className="text-xs text-slate-500 py-4 bg-slate-50 rounded-lg text-center">
                No return cycles recorded.
              </p>
            ) : (
              decisionsData.returnHistory.map((ret: any) => (
                <div key={ret.id} className="p-4 border border-amber-200 bg-amber-50/40 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900">
                      Cycle {ret.cycleNumber} Return — {ret.returnReason}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(ret.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700">{ret.comments}</p>
                  {Array.isArray(ret.requiredCorrections) && ret.requiredCorrections.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[11px] font-bold text-slate-700">Required Corrections:</span>
                      <ul className="list-disc list-inside text-xs text-slate-600 pl-2">
                        {ret.requiredCorrections.map((rc: string, i: number) => (
                          <li key={i}>{rc}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 8. PRE-DISBURSEMENT READINESS */}
      {activeTab === 'READINESS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Pre-Disbursement Compliance Gates</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated 10-point server-side validation. Fund disbursement is locked until 100% compliant.
              </p>
            </div>
            <div className="text-right">
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  preDisbResult?.isEligible
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {preDisbResult?.isEligible ? 'READY FOR DISBURSEMENT' : 'DISBURSEMENT BLOCKED'}
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {(preDisbResult?.checks || []).map((chk: any) => (
              <div key={chk.id} className="py-3 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {chk.status === 'PASS' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-slate-900">{chk.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono ml-2">[{chk.category}]</span>
                    {chk.reason && <p className="text-xs text-rose-600 mt-0.5">{chk.reason}</p>}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    chk.status === 'PASS' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {chk.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: RETURN FOR CORRECTION */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Return Application for Correction</h3>
              <button onClick={() => setShowReturnModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReturnForCorrection} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Return Reason</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                >
                  <option value="DOCUMENT_DEFICIENCY">Document Deficiency / Incomplete KYC</option>
                  <option value="INCOME_OBLIGATION_MISMATCH">Income / Obligation Mismatch</option>
                  <option value="COLLATERAL_VALUATION_DISPUTE">Collateral Valuation Dispute</option>
                  <option value="CO_APPLICANT_CLARIFICATION">Co-Applicant Liability Clarification</option>
                  <option value="CREDIT_POLICY_VIOLATION">Credit Policy Deviation Required</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Comments & Underwriter Notes</label>
                <textarea
                  rows={3}
                  value={returnComments}
                  onChange={(e) => setReturnComments(e.target.value)}
                  required
                  placeholder="Explain the specific deficiency to the loan officer..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Required Corrections (1 per line)
                </label>
                <textarea
                  rows={3}
                  value={returnCorrections}
                  onChange={(e) => setReturnCorrections(e.target.value)}
                  placeholder="Upload latest salary slip&#10;Verify property address"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow"
                >
                  Confirm Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREDIT DECISION */}
      {showDecisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Formal Credit Decision Form</h3>
              <button onClick={() => setShowDecisionModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDecision} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Decision Action</label>
                <select
                  value={decisionType}
                  onChange={(e: any) => setDecisionType(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-bold"
                >
                  <option value="APPROVE">Approve Proposal</option>
                  <option value="APPROVE_WITH_CONDITIONS">Approve with Sanction Covenants</option>
                  <option value="REJECT">Reject Proposal</option>
                </select>
              </div>

              {decisionType !== 'REJECT' && (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Sanction Amount (₹)</label>
                    <input
                      type="number"
                      value={approvedAmount}
                      onChange={(e) => setApprovedAmount(Number(e.target.value))}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Tenure (Mos)</label>
                    <input
                      type="number"
                      value={approvedTenure}
                      onChange={(e) => setApprovedTenure(Number(e.target.value))}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Sanction ROI (%)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={approvedRoi}
                      onChange={(e) => setApprovedRoi(Number(e.target.value))}
                      className="w-full text-xs p-2 border border-slate-300 rounded-lg font-semibold"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Underwriter Remarks</label>
                <textarea
                  rows={2}
                  value={decisionRemarks}
                  onChange={(e) => setDecisionRemarks(e.target.value)}
                  placeholder="Rationale or committee approval notes..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                />
              </div>

              {decisionType === 'APPROVE_WITH_CONDITIONS' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Pre-Disbursement Covenants</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newConditionText}
                      onChange={(e) => setNewConditionText(e.target.value)}
                      placeholder="e.g. Provide original title deed before disbursement"
                      className="flex-1 text-xs p-2 border border-slate-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newConditionText.trim()) {
                          setDecisionConditions([...decisionConditions, newConditionText.trim()]);
                          setNewConditionText('');
                        }
                      }}
                      className="px-3 py-1 bg-slate-800 text-white text-xs font-bold rounded-lg"
                    >
                      Add
                    </button>
                  </div>

                  {decisionConditions.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded border border-slate-200">
                      <span>{c}</span>
                      <button
                        type="button"
                        onClick={() => setDecisionConditions(decisionConditions.filter((_, idx) => idx !== i))}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDecisionModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow"
                >
                  Submit Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DOCUMENT REJECTION */}
      {rejectDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">Reject Document: {rejectDocModal.title}</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Rejection</label>
              <textarea
                rows={3}
                value={docRejectReason}
                onChange={(e) => setDocRejectReason(e.target.value)}
                placeholder="Blurry image, expired document, or name mismatch..."
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectDocModal(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectDocument}
                disabled={!docRejectReason}
                className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded disabled:opacity-50"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE DEVIATION */}
      {showDeviationModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Raise Policy / Rate Deviation</h3>
              <button onClick={() => setShowDeviationModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDeviation} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deviation Title</label>
                <input
                  type="text"
                  required
                  value={newDevTitle}
                  onChange={(e) => setNewDevTitle(e.target.value)}
                  placeholder="e.g. CIBIL score 680 waiver"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newDevCategory}
                    onChange={(e: any) => setNewDevCategory(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  >
                    <option value="POLICY">Policy Deviation</option>
                    <option value="FOIR">FOIR / DTI Threshold</option>
                    <option value="LTV">LTV Cap</option>
                    <option value="CIBIL">CIBIL Threshold</option>
                    <option value="ROI">ROI Pricing Spread</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Severity</label>
                  <select
                    value={newDevSeverity}
                    onChange={(e: any) => setNewDevSeverity(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deviation Rationale</label>
                <textarea
                  rows={2}
                  required
                  value={newDevReason}
                  onChange={(e) => setNewDevReason(e.target.value)}
                  placeholder="Explain why this deviation is requested..."
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Compensating Mitigant</label>
                <textarea
                  rows={2}
                  value={newDevMitigant}
                  onChange={(e) => setNewDevMitigant(e.target.value)}
                  placeholder="e.g. Additional collateral pledged, high disposable income..."
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDeviationModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded shadow"
                >
                  Submit Deviation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
