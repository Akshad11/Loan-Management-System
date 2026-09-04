'use client';

import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  ArrowRightLeft,
  CreditCard,
  Percent,
} from 'lucide-react';
import { CoApplicantModal } from './CoApplicantModal';
import { formatCurrencyINR } from '../../utils/formatters';

interface CoApplicantManagerProps {
  applicationId: string;
  primaryApplicantId: string;
  primaryApplicantName?: string;
  primaryMonthlyIncome?: number;
  coApplicants: any[];
  onCoApplicantChange: () => void;
  onViewBureau?: (applicantId: string, applicantType: 'PRIMARY' | 'CO_APPLICANT') => void;
  isDraft: boolean;
  canManageParties?: boolean;
}

export const CoApplicantManager: React.FC<CoApplicantManagerProps> = ({
  applicationId,
  primaryApplicantId,
  primaryApplicantName = 'Primary Borrower',
  primaryMonthlyIncome = 0,
  coApplicants = [],
  onCoApplicantChange,
  onViewBureau,
  isDraft,
  canManageParties = true,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const totalCoAppIncome = coApplicants.reduce((sum, c) => sum + Number(c.monthlyIncome || 0), 0);
  const combinedHouseholdIncome = primaryMonthlyIncome + totalCoAppIncome;

  const handleRemove = async (coApplicantId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove co-applicant ${name}?`)) return;

    setIsActionPending(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/co-applicants/${coApplicantId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to remove co-applicant');
      }
      onCoApplicantChange();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleMakePrimary = async (coApplicantId: string, name: string) => {
    if (
      !window.confirm(
        `Designate ${name} as the Primary Borrower? The current primary borrower will become a co-applicant.`
      )
    )
      return;

    setIsActionPending(true);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/applications/${applicationId}/co-applicants/${coApplicantId}/make-primary`,
        { method: 'POST' }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to designate primary applicant');
      }
      onCoApplicantChange();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsActionPending(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-200 gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            Co-Applicants & Household Parties ({coApplicants.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Legally liable co-borrowers contributing to household eligibility and debt servicing.
          </p>
        </div>

        {isDraft && canManageParties && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Co-Applicant</span>
          </button>
        )}
      </div>

      {actionError && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* COMBINED INCOME SUMMARY STRIP */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Primary Income</span>
            <span className="font-bold text-slate-900">{formatCurrencyINR(primaryMonthlyIncome)}/mo</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Co-Applicants Combined</span>
            <span className="font-bold text-blue-700">+{formatCurrencyINR(totalCoAppIncome)}/mo</span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Clubbed Income</span>
            <span className="font-bold text-emerald-700 font-mono text-sm">
              {formatCurrencyINR(combinedHouseholdIncome)}/mo
            </span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 font-medium">
          {coApplicants.length > 0 ? 'Clubbing enhances FOIR debt limits' : 'Single applicant assessment'}
        </div>
      </div>

      {/* CO-APPLICANTS LIST */}
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
            const hasCibil = coApp.cibilScore && coApp.cibilScore > 0;
            return (
              <div
                key={coApp.id}
                className="p-4 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs shrink-0">
                    {coApp.customerName
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{coApp.customerName}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 border border-slate-200 rounded text-slate-600">
                        {coApp.customerNumber}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                        {coApp.relationship}
                      </span>
                      {coApp.ownershipShare && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                          {coApp.ownershipShare}% Share
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                      <span>PAN: <strong className="font-mono text-slate-700">{coApp.panMasked || 'N/A'}</strong></span>
                      <span>•</span>
                      <span>Income: <strong className="text-slate-800">{formatCurrencyINR(coApp.monthlyIncome || 0)}/mo</strong></span>
                      <span>•</span>
                      <span>Obligations: <strong className="text-slate-800">{formatCurrencyINR(coApp.existingObligations || 0)}/mo</strong></span>
                    </div>

                    {coApp.notes && (
                      <p className="text-[11px] text-slate-500 italic">Note: {coApp.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between md:justify-end gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                  {/* Bureau Pill */}
                  <button
                    type="button"
                    onClick={() => onViewBureau?.(coApp.id, 'CO_APPLICANT')}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                      hasCibil
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{hasCibil ? `CIBIL ${coApp.cibilScore}` : 'View Bureau'}</span>
                  </button>

                  {/* Make Primary Action */}
                  {isDraft && canManageParties && (
                    <button
                      type="button"
                      onClick={() => handleMakePrimary(coApp.id, coApp.customerName)}
                      disabled={isActionPending}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors flex items-center gap-1"
                      title="Make Primary Borrower"
                    >
                      <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                      <span>Make Primary</span>
                    </button>
                  )}

                  {/* Remove Action */}
                  {isDraft && canManageParties && (
                    <button
                      type="button"
                      onClick={() => handleRemove(coApp.id, coApp.customerName)}
                      disabled={isActionPending}
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
          applicationId={applicationId}
          primaryApplicantId={primaryApplicantId}
          onCoApplicantAdded={() => {
            onCoApplicantChange();
          }}
        />
      )}
    </div>
  );
};
