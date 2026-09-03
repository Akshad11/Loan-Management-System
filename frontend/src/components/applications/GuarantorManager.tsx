import React, { useState } from 'react';
import { ShieldCheck, ShieldPlus, Trash2, AlertCircle } from 'lucide-react';
import { GuarantorRecord, GuarantorRelationship } from '../../types/applicationTypes';
import { CustomerRecord } from '../../types';
import { GuarantorModal } from './GuarantorModal';
import { formatCurrencyINR } from '../../utils/formatters';

interface GuarantorManagerProps {
  applicationId: string;
  primaryApplicantId: string;
  guarantors: GuarantorRecord[];
  allCustomers: CustomerRecord[];
  onAddGuarantor: (payload: {
    customerId: string;
    relationship: GuarantorRelationship;
    guaranteeType: 'INDIVIDUAL' | 'BUSINESS';
    netWorthEstimated?: number;
    notes?: string;
  }) => void;
  onRemoveGuarantor: (guarantorId: string) => void;
  isDraft: boolean;
  canManageParties?: boolean;
}

export const GuarantorManager: React.FC<GuarantorManagerProps> = ({
  applicationId,
  primaryApplicantId,
  guarantors,
  allCustomers,
  onAddGuarantor,
  onRemoveGuarantor,
  isDraft,
  canManageParties = true,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div
      id="guarantor-manager-section"
      className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            Guarantors ({guarantors.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Secondary obligors providing personal or corporate guarantees to mitigate credit risk.
          </p>
        </div>

        {isDraft && canManageParties && (
          <button
            id="add-guarantor-btn"
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm"
          >
            <ShieldPlus className="w-3.5 h-3.5" />
            Add Guarantor
          </button>
        )}
      </div>

      {guarantors.length === 0 ? (
        <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-300 text-xs text-slate-500">
          <ShieldCheck className="w-6 h-6 text-slate-400 mx-auto mb-2" />
          No guarantors assigned to this application.
          {isDraft && canManageParties && (
            <p className="text-slate-400 mt-1">
              Guarantors are optional but strengthen high-exposure and business loan profiles.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {guarantors.map((guar) => {
            const isKycVerified = guar.kycStatus === 'VERIFIED';
            return (
              <div
                key={guar.id}
                id={`guar-card-${guar.id}`}
                className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-800 font-bold flex items-center justify-center text-xs shrink-0">
                    {guar.customerName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{guar.customerName}</span>
                      <span className="text-[11px] font-mono px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600">
                        {guar.customerNumber}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded">
                        {guar.guaranteeType} Guarantee
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-1">
                      <span>Relation: <strong className="text-slate-800">{guar.relationship}</strong></span>
                      <span>•</span>
                      <span>PAN: <strong className="font-mono text-slate-700">{guar.panMasked}</strong></span>
                      {guar.netWorthEstimated ? (
                        <>
                          <span>•</span>
                          <span>Est. Net Worth: <strong className="text-slate-800">{formatCurrencyINR(guar.netWorthEstimated)}</strong></span>
                        </>
                      ) : null}
                    </div>

                    {guar.notes && (
                      <p className="text-[11px] text-slate-600 mt-1 italic">
                        Terms: {guar.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      isKycVerified
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    {isKycVerified ? (
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                    )}
                    KYC {guar.kycStatus}
                  </span>

                  {isDraft && canManageParties && (
                    <button
                      onClick={() => onRemoveGuarantor(guar.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      title="Remove Guarantor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <GuarantorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddGuarantor={onAddGuarantor}
          customers={allCustomers}
          primaryApplicantId={primaryApplicantId}
          existingCoApplicantIds={[]}
          existingGuarantorIds={guarantors.map((g) => g.customerId)}
        />
      )}
    </div>
  );
};
