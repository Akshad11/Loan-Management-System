import React, { useState } from 'react';
import { Users, UserPlus, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import { CoApplicantRecord, CoApplicantRelationship } from '../../types/applicationTypes';
import { CustomerRecord } from '../../types';
import { CoApplicantModal } from './CoApplicantModal';
import { formatCurrencyINR } from '../../utils/formatters';

interface CoApplicantManagerProps {
  applicationId: string;
  primaryApplicantId: string;
  coApplicants: CoApplicantRecord[];
  allCustomers: CustomerRecord[];
  onAddCoApplicant: (payload: {
    customerId: string;
    relationship: CoApplicantRelationship;
    notes?: string;
  }) => void;
  onRemoveCoApplicant: (coApplicantId: string) => void;
  isDraft: boolean;
  canManageParties?: boolean;
}

export const CoApplicantManager: React.FC<CoApplicantManagerProps> = ({
  applicationId,
  primaryApplicantId,
  coApplicants,
  allCustomers,
  onAddCoApplicant,
  onRemoveCoApplicant,
  isDraft,
  canManageParties = true,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div
      id="co-applicant-manager-section"
      className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-600" />
            Co-Applicants ({coApplicants.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Additional borrowers legally liable for repayment and eligible for income clubbing.
          </p>
        </div>

        {isDraft && canManageParties && (
          <button
            id="add-coapplicant-btn"
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-medium flex items-center gap-1.5 shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Co-Applicant
          </button>
        )}
      </div>

      {coApplicants.length === 0 ? (
        <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-300 text-xs text-slate-500">
          <Users className="w-6 h-6 text-slate-400 mx-auto mb-2" />
          No co-applicants added to this application.
          {isDraft && canManageParties && (
            <p className="text-slate-400 mt-1">
              Click &quot;Add Co-Applicant&quot; above to link a spouse, parent, or business partner.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {coApplicants.map((coApp) => {
            const isKycVerified = coApp.kycStatus === 'VERIFIED';
            return (
              <div
                key={coApp.id}
                id={`coapp-card-${coApp.id}`}
                className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs shrink-0">
                    {coApp.customerName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{coApp.customerName}</span>
                      <span className="text-[11px] font-mono px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600">
                        {coApp.customerNumber}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded">
                        {coApp.relationship}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-1">
                      <span>PAN: <strong className="font-mono text-slate-700">{coApp.panMasked}</strong></span>
                      <span>•</span>
                      <span>Income: <strong className="text-slate-800">{formatCurrencyINR(coApp.monthlyIncome || 0)}/mo</strong></span>
                      <span>•</span>
                      <span>Active Debt: <strong className="text-slate-800">{formatCurrencyINR(coApp.totalOutstanding || 0)}</strong></span>
                    </div>

                    {coApp.notes && (
                      <p className="text-[11px] text-slate-600 mt-1 italic">
                        Note: {coApp.notes}
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
                    KYC {coApp.kycStatus}
                  </span>

                  {isDraft && canManageParties && (
                    <button
                      onClick={() => onRemoveCoApplicant(coApp.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      title="Remove Co-Applicant"
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
        <CoApplicantModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAddCoApplicant={onAddCoApplicant}
          customers={allCustomers}
          primaryApplicantId={primaryApplicantId}
          existingCoApplicantIds={coApplicants.map((c) => c.customerId)}
          existingGuarantorIds={[]}
        />
      )}
    </div>
  );
};
