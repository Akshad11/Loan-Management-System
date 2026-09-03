import React from 'react';
import { CreditAssessmentRecord, AssessmentTimelineEvent } from '../../types/creditTypes';
import { Clock, CheckCircle2, User, FileText, ArrowRight, ShieldCheck } from 'lucide-react';

interface AssessmentTimelineTabProps {
  assessment: CreditAssessmentRecord;
}

export const AssessmentTimelineTab: React.FC<AssessmentTimelineTabProps> = ({
  assessment,
}) => {
  const events: AssessmentTimelineEvent[] = assessment.history || [];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
        <Clock className="w-4 h-4 text-slate-600" />
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Immutable Credit Assessment Audit Trail & History
        </h3>
      </div>

      {events.length > 0 ? (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {events.map((evt) => (
            <div key={evt.id} className="relative group">
              {/* Dot */}
              <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              </div>

              {/* Card */}
              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                  <span className="font-bold text-slate-900 text-sm">
                    {evt.eventTitle || evt.eventType}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {evt.timestamp}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-600 mb-2">
                  <span className="font-medium text-slate-800">{evt.actor}</span>
                  <span>({evt.actorRole})</span>
                  {evt.previousState && evt.newState && (
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {evt.previousState} <ArrowRight className="w-2.5 h-2.5" /> {evt.newState}
                    </span>
                  )}
                </div>

                {evt.notes && (
                  <p className="text-slate-700 bg-white p-2.5 rounded border border-slate-200">
                    {evt.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-slate-400">
          No historical timeline events recorded for this assessment.
        </div>
      )}
    </div>
  );
};
