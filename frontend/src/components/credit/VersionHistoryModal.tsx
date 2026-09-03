import React from 'react';
import { CreditAssessmentRecord, AssessmentVersionSnapshot } from '../../types/creditTypes';
import { CreditStatusBadge } from './CreditStatusBadge';
import { History, Calendar, User, ArrowRight } from 'lucide-react';

interface VersionHistoryModalProps {
  assessment: CreditAssessmentRecord;
  onClose: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  assessment,
  onClose,
}) => {
  const versions: AssessmentVersionSnapshot[] = assessment.versions || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-2xl w-full p-6 text-xs max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase">
              Credit Decision Version History & Snapshots
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
          >
            &times;
          </button>
        </div>

        <div className="overflow-y-auto space-y-4 pr-1">
          {versions.length > 0 ? (
            versions.map((ver) => (
              <div
                key={ver.versionNumber}
                className="p-4 rounded-lg border border-slate-200 bg-slate-50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-600 text-white font-bold px-2 py-0.5 rounded text-xs font-mono">
                      v{ver.versionNumber}
                    </span>
                    <CreditStatusBadge recommendation={ver.recommendation} size="sm" />
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {ver.timestamp}
                  </span>
                </div>

                <div className="text-slate-600 flex items-center gap-2 text-[11px]">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>By: <strong className="text-slate-800">{ver.actor}</strong> ({ver.actorRole})</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 rounded border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Recommended Quantum</span>
                    <span className="font-bold text-slate-900">
                      ₹{ver.recommendedAmount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Tenure & Rate</span>
                    <span className="font-semibold text-slate-800">
                      {ver.recommendedTenureMonths}m @ {ver.recommendedInterestRate}%
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Considered Income</span>
                    <span className="font-semibold text-slate-800">
                      ₹{ver.consideredIncome.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[11px]">Post-Loan FOIR</span>
                    <span className="font-bold text-indigo-700">
                      {ver.postApplicationObligationRatio.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {ver.decisionNotes && (
                  <div className="text-[11px] text-slate-700">
                    <strong className="text-slate-800">Sanction Rationale:</strong> {ver.decisionNotes}
                  </div>
                )}

                {ver.changeReason && (
                  <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                    <strong>Adjustment Rationale:</strong> {ver.changeReason}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No previous version snapshots exist. Current assessment is in initial draft.
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end flex-shrink-0 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
