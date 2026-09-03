import React, { useState } from 'react';
import { CustomerRecord, KycRecord, KycLevel, KycRiskCategory } from '../../types';
import { KycProfileCard } from '../kyc/KycProfileCard';
import { KycVerificationWorkbench } from '../kyc/KycVerificationWorkbench';
import { VideoKycInspector } from '../kyc/VideoKycInspector';

interface CustomerKycSectionProps {
  customer: CustomerRecord;
  kyc?: KycRecord;
  currentUser: string;
  onVerifyKyc: (payload: {
    verifiedBy: string;
    kycLevel: KycLevel;
    riskCategory: KycRiskCategory;
    complianceNotes: string;
  }) => void;
  onRejectKyc: (payload: {
    rejectedBy: string;
    reason: string;
    remarks: string;
  }) => void;
  onRequestAction: (payload: {
    officerName: string;
    actionNotes: string;
  }) => void;
  onUpdateRisk: (risk: KycRiskCategory) => void;
  onTriggerApiSync: (idType: 'PAN' | 'AADHAAR') => void;
}

export const CustomerKycSection: React.FC<CustomerKycSectionProps> = ({
  customer,
  kyc,
  currentUser,
  onVerifyKyc,
  onRejectKyc,
  onRequestAction,
  onUpdateRisk,
  onTriggerApiSync,
}) => {
  const [isWorkbenchOpen, setIsWorkbenchOpen] = useState(false);
  const [isVideoInspectorOpen, setIsVideoInspectorOpen] = useState(false);

  return (
    <div className="space-y-4">
      <KycProfileCard
        kyc={kyc}
        customer={customer}
        onOpenVerification={() => setIsWorkbenchOpen(true)}
        onTriggerApiSync={onTriggerApiSync}
        onOpenVideoKyc={kyc?.videoKycRecord ? () => setIsVideoInspectorOpen(true) : undefined}
      />

      {/* Verification Workbench Modal */}
      <KycVerificationWorkbench
        customer={customer}
        kyc={kyc}
        currentUser={currentUser}
        isOpen={isWorkbenchOpen}
        onClose={() => setIsWorkbenchOpen(false)}
        onApprove={onVerifyKyc}
        onReject={onRejectKyc}
        onRequestAction={onRequestAction}
        onUpdateRisk={onUpdateRisk}
      />

      {/* Video KYC Inspector Modal */}
      {kyc?.videoKycRecord && (
        <VideoKycInspector
          videoRecord={kyc.videoKycRecord}
          customerName={customer.name}
          isOpen={isVideoInspectorOpen}
          onClose={() => setIsVideoInspectorOpen(false)}
        />
      )}
    </div>
  );
};
