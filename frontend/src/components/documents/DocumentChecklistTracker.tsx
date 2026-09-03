import React, { useMemo } from 'react';
import { CustomerRecord, DocumentItem, ChecklistRequirement } from '../../types';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  UploadCloud,
  ShieldCheck,
  Plus,
} from 'lucide-react';

interface DocumentChecklistTrackerProps {
  customer: CustomerRecord;
  documents: DocumentItem[];
  requirements: ChecklistRequirement[];
  onOpenUploadForRequirement?: (req: ChecklistRequirement) => void;
}

export const DocumentChecklistTracker: React.FC<DocumentChecklistTrackerProps> = ({
  customer,
  documents,
  requirements,
  onOpenUploadForRequirement,
}) => {
  // Filter requirements applicable to this customer type
  const applicableReqs = useMemo(() => {
    return requirements.filter((req) =>
      req.applicableCustomerTypes.includes(customer.customerType)
    );
  }, [requirements, customer.customerType]);

  // Match documents to requirements
  const checklistStatus = useMemo(() => {
    return applicableReqs.map((req) => {
      const matchingDocs = documents.filter(
        (doc) => doc.documentType === req.documentType || doc.category === req.category
      );
      const verifiedDoc = matchingDocs.find((d) => d.status === 'VERIFIED');
      const pendingDoc = matchingDocs.find((d) => d.status === 'PENDING_VERIFICATION');
      const actionDoc = matchingDocs.find((d) => d.status === 'ACTION_REQUIRED');
      const rejectedDoc = matchingDocs.find((d) => d.status === 'REJECTED');
      const expiredDoc = matchingDocs.find((d) => d.status === 'EXPIRED');

      let status: 'VERIFIED' | 'PENDING' | 'ACTION_REQUIRED' | 'REJECTED' | 'EXPIRED' | 'MISSING' = 'MISSING';
      let docRef: DocumentItem | undefined = undefined;

      if (verifiedDoc) {
        status = 'VERIFIED';
        docRef = verifiedDoc;
      } else if (pendingDoc) {
        status = 'PENDING';
        docRef = pendingDoc;
      } else if (actionDoc) {
        status = 'ACTION_REQUIRED';
        docRef = actionDoc;
      } else if (rejectedDoc) {
        status = 'REJECTED';
        docRef = rejectedDoc;
      } else if (expiredDoc) {
        status = 'EXPIRED';
        docRef = expiredDoc;
      }

      return {
        requirement: req,
        status,
        matchedDoc: docRef,
      };
    });
  }, [applicableReqs, documents]);

  const mandatoryTotal = checklistStatus.filter((c) => c.requirement.isMandatory).length;
  const mandatorySatisfied = checklistStatus.filter(
    (c) => c.requirement.isMandatory && c.status === 'VERIFIED'
  ).length;
  const completionPercent = mandatoryTotal > 0 ? Math.round((mandatorySatisfied / mandatoryTotal) * 100) : 100;

  return (
    <div className="bg-white border border-slate-200 rounded p-4 text-xs space-y-4">
      {/* Header & Progress Bar */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-slate-800" />
            <h2 className="text-sm font-bold text-slate-900">Document Checklist & Mandatory Compliance</h2>
          </div>
          <span className="font-bold text-xs text-slate-800">
            {mandatorySatisfied} of {mandatoryTotal} Mandatory Verified ({completionPercent}%)
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2 border border-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              completionPercent === 100
                ? 'bg-emerald-600'
                : completionPercent >= 50
                ? 'bg-amber-600'
                : 'bg-slate-700'
            }`}
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      {/* Checklist Items List */}
      <div className="border border-slate-200 rounded overflow-hidden divide-y divide-slate-100">
        {checklistStatus.map(({ requirement, status, matchedDoc }) => (
          <div
            key={requirement.id}
            className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 shrink-0">
                {status === 'VERIFIED' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : status === 'PENDING' ? (
                  <Clock className="w-4 h-4 text-amber-600" />
                ) : status === 'ACTION_REQUIRED' ? (
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-bold" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-xs">{requirement.title}</span>
                  {requirement.isMandatory ? (
                    <span className="px-1.5 py-0.2 bg-rose-50 text-rose-800 font-bold text-[10px] rounded border border-rose-200">
                      Mandatory
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 font-semibold text-[10px] rounded border border-slate-200">
                      Optional
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-xs mt-0.5">{requirement.description}</p>
                {matchedDoc && (
                  <p className="text-[11px] font-mono text-slate-700 mt-1">
                    Linked: {matchedDoc.fileName} (v{matchedDoc.version})
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {status === 'VERIFIED' ? (
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 font-semibold rounded text-[11px] border border-emerald-200">
                  Verified
                </span>
              ) : status === 'PENDING' ? (
                <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-semibold rounded text-[11px] border border-amber-200">
                  Pending Verification
                </span>
              ) : status === 'ACTION_REQUIRED' ? (
                <span className="px-2 py-0.5 bg-orange-50 text-orange-800 font-semibold rounded text-[11px] border border-orange-200">
                  Action Required
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenUploadForRequirement?.(requirement)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 text-white font-semibold rounded hover:bg-slate-800 text-xs transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Upload Now</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
