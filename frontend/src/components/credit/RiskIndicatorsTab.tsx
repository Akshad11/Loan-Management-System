import React from 'react';
import { CreditAssessmentRecord } from '../../types/creditTypes';
import { CreditStatusBadge } from './CreditStatusBadge';
import { ShieldAlert, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface RiskIndicatorsTabProps {
  assessment: CreditAssessmentRecord;
}

export const RiskIndicatorsTab: React.FC<RiskIndicatorsTabProps> = ({
  assessment,
}) => {
  const risks = assessment.riskIndicators || [];

  return (
    <div className="space-y-6">
      {/* Risk Summary Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Comprehensive Underwriting Risk Checklist
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {risks.length} Assessed Risk Categories
          </span>
        </div>

        {risks.length > 0 ? (
          <div className="space-y-3">
            {risks.map((risk) => (
              <div
                key={risk.id}
                className={`p-4 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  risk.severity === 'CRITICAL'
                    ? 'bg-rose-50/70 border-rose-200'
                    : risk.severity === 'HIGH'
                    ? 'bg-orange-50/70 border-orange-200'
                    : risk.severity === 'MEDIUM'
                    ? 'bg-amber-50/70 border-amber-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {risk.title || `${risk.category} Risk Appraisal`}
                    </span>
                    <CreditStatusBadge riskSeverity={risk.severity} size="sm" />
                  </div>
                  <p className="text-slate-700 font-medium">{risk.notes}</p>
                  <span className="text-[11px] text-slate-500 block">
                    Trigger Source: <strong>{risk.source}</strong> • Detected on {risk.detectedDate}
                  </span>
                </div>

                <div className="text-right text-xs">
                  {risk.severity === 'CRITICAL' ? (
                    <span className="text-rose-700 font-bold">Requires Committee Sign-off</span>
                  ) : risk.severity === 'HIGH' ? (
                    <span className="text-orange-700 font-semibold">Special Underwriting Covenant</span>
                  ) : (
                    <span className="text-slate-500 font-medium">Standard Monitoring</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">
            No adverse risk triggers detected for this credit assessment.
          </div>
        )}
      </div>
    </div>
  );
};
