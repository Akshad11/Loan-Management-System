import React, { useState } from 'react';
import { useMockLMSStore } from '../../services/mockService';
import { KycQueueTable } from '../kyc/KycQueueTable';
import { KycVerificationWorkbench } from '../kyc/KycVerificationWorkbench';
import { KycRecord } from '../../types';
import { ShieldCheck, UserCheck, AlertOctagon, CheckCircle2, Clock } from 'lucide-react';

interface KycViewProps {
  currentUser: string;
  onNavigateToCustomer: (customerId: string) => void;
}

export const KycView: React.FC<KycViewProps> = ({
  currentUser,
  onNavigateToCustomer,
}) => {
  const {
    kycRecords,
    customers,
    verifyKyc,
    rejectKyc,
    requestKycAction,
    updateKycRisk,
  } = useMockLMSStore();

  const [selectedRecordForWorkbench, setSelectedRecordForWorkbench] = useState<KycRecord | null>(null);

  const selectedCustomer = selectedRecordForWorkbench
    ? customers.find((c) => c.id === selectedRecordForWorkbench.customerId)
    : undefined;

  // Aggregate metrics
  const totalProfiles = kycRecords.length;
  const verifiedCount = kycRecords.filter((r) => r.status === 'VERIFIED').length;
  const pendingCount = kycRecords.filter((r) => r.status === 'PENDING_REVIEW').length;
  const actionCount = kycRecords.filter((r) => r.status === 'ACTION_REQUIRED').length;
  const highRiskCount = kycRecords.filter((r) => r.riskCategory === 'HIGH' || r.riskCategory === 'AML_WATCHLIST').length;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-white rounded">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900">
                KYC Management & Verification Operations Hub
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Centralized KYC queue, C-KYC repository ingestion, NSDL/UIDAI biometric validation, and statutory risk profiling.
              </p>
            </div>
          </div>
        </div>

        {/* Quick KPI stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded">
            <span className="text-[10px] uppercase font-bold text-slate-500">Total Profiles</span>
            <p className="text-lg font-mono font-bold text-slate-900 mt-0.5">{totalProfiles}</p>
          </div>

          <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded">
            <span className="text-[10px] uppercase font-bold text-emerald-800">Verified & Approved</span>
            <p className="text-lg font-mono font-bold text-emerald-900 mt-0.5">{verifiedCount}</p>
          </div>

          <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded">
            <span className="text-[10px] uppercase font-bold text-amber-800">Pending Review</span>
            <p className="text-lg font-mono font-bold text-amber-900 mt-0.5">{pendingCount}</p>
          </div>

          <div className="p-2.5 bg-orange-50/70 border border-orange-200 rounded">
            <span className="text-[10px] uppercase font-bold text-orange-800">Action Required</span>
            <p className="text-lg font-mono font-bold text-orange-900 mt-0.5">{actionCount}</p>
          </div>

          <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded">
            <span className="text-[10px] uppercase font-bold text-rose-800">High Risk / Watchlist</span>
            <p className="text-lg font-mono font-bold text-rose-900 mt-0.5">{highRiskCount}</p>
          </div>
        </div>
      </div>

      {/* Main KYC Table */}
      <KycQueueTable
        kycRecords={kycRecords}
        onSelectCustomer={onNavigateToCustomer}
        onOpenWorkbench={(record) => setSelectedRecordForWorkbench(record)}
      />

      {/* Verification Workbench Modal */}
      {selectedRecordForWorkbench && selectedCustomer && (
        <KycVerificationWorkbench
          customer={selectedCustomer}
          kyc={selectedRecordForWorkbench}
          currentUser={currentUser}
          isOpen={!!selectedRecordForWorkbench}
          onClose={() => setSelectedRecordForWorkbench(null)}
          onApprove={(payload) => {
            verifyKyc(selectedCustomer.id, payload);
            setSelectedRecordForWorkbench(null);
          }}
          onReject={(payload) => {
            rejectKyc(selectedCustomer.id, payload);
            setSelectedRecordForWorkbench(null);
          }}
          onRequestAction={(payload) => {
            requestKycAction(selectedCustomer.id, payload);
            setSelectedRecordForWorkbench(null);
          }}
          onUpdateRisk={(risk) => {
            updateKycRisk(selectedCustomer.id, risk);
          }}
        />
      )}
    </div>
  );
};
