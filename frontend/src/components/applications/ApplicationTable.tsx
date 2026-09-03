import React from 'react';
import {
  FileText,
  Users,
  ShieldCheck,
  ChevronRight,
  Eye,
  Edit2,
  Send,
  XCircle,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { LoanApplicationRecord } from '../../types/applicationTypes';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';
import { formatCurrencyINR } from '../../utils/formatters';

interface ApplicationTableProps {
  applications: LoanApplicationRecord[];
  onSelectApplication: (app: LoanApplicationRecord) => void;
  onEditApplication?: (app: LoanApplicationRecord) => void;
  onSubmitApplication?: (app: LoanApplicationRecord) => void;
  onCancelApplication?: (app: LoanApplicationRecord) => void;
  canEdit?: boolean;
  canSubmit?: boolean;
  canCancel?: boolean;
}

export const ApplicationTable: React.FC<ApplicationTableProps> = ({
  applications,
  onSelectApplication,
  onEditApplication,
  onSubmitApplication,
  onCancelApplication,
  canEdit = true,
  canSubmit = true,
  canCancel = true,
}) => {
  if (applications.length === 0) {
    return (
      <div
        id="empty-applications-state"
        className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-sm"
      >
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
          <FileText className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="text-base font-medium text-slate-900 mb-1">
          No Loan Applications Found
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          No loan applications match the specified filter criteria. Try adjusting your search query or originated status.
        </p>
      </div>
    );
  }

  return (
    <div
      id="loan-applications-table-container"
      className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <th className="py-3.5 px-4">Application Details</th>
              <th className="py-3.5 px-4">Applicant & KYC</th>
              <th className="py-3.5 px-4">Loan Product</th>
              <th className="py-3.5 px-4 text-right">Requested Terms</th>
              <th className="py-3.5 px-4 text-center">Parties</th>
              <th className="py-3.5 px-4">Docs Status</th>
              <th className="py-3.5 px-4">Workflow Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {applications.map((app) => {
              const mandatoryDocs = app.documents.filter((d) => d.isMandatory);
              const verifiedMandatory = mandatoryDocs.filter((d) => d.status === 'VERIFIED');
              const hasRejectedDocs = app.documents.some((d) => d.status === 'REJECTED');
              const hasMissingDocs = mandatoryDocs.some((d) => d.status === 'MISSING');

              return (
                <tr
                  key={app.id}
                  id={`app-row-${app.id}`}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  onClick={() => onSelectApplication(app)}
                >
                  {/* Application No & Origination Date */}
                  <td className="py-4 px-4">
                    <div className="font-mono font-medium text-slate-900 text-xs flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
                      {app.applicationNumber}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {app.applicationDate}
                    </div>
                  </td>

                  {/* Applicant Name & KYC */}
                  <td className="py-4 px-4">
                    <div className="font-medium text-slate-900 text-sm">
                      {app.customerName}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[11px]">{app.customerNumber}</span>
                      <span className="text-slate-300">•</span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                          app.customerKycStatus === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        KYC {app.customerKycStatus}
                      </span>
                    </div>
                  </td>

                  {/* Product */}
                  <td className="py-4 px-4">
                    <div className="text-xs font-medium text-slate-800 line-clamp-1" title={app.productName}>
                      {app.productName}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {app.branchName}
                    </div>
                  </td>

                  {/* Financial Terms (INR strictly) */}
                  <td className="py-4 px-4 text-right">
                    <div className="font-semibold text-slate-900 text-sm">
                      {formatCurrencyINR(app.requestedAmount)}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {app.requestedTenureMonths} mos @ {app.interestRate}% p.a.
                    </div>
                  </td>

                  {/* Parties (Co-applicants / Guarantors) */}
                  <td className="py-4 px-4 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      {app.coApplicants.length > 0 ? (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded text-[11px] font-medium"
                          title={`${app.coApplicants.length} Co-applicant(s)`}
                        >
                          <Users className="w-3 h-3" />
                          {app.coApplicants.length}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}

                      {app.guarantors.length > 0 ? (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[11px] font-medium"
                          title={`${app.guarantors.length} Guarantor(s)`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          {app.guarantors.length}
                        </span>
                      ) : null}
                    </div>
                  </td>

                  {/* Document Progress */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 text-xs">
                      {hasRejectedDocs ? (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                          Doc Rejected
                        </span>
                      ) : hasMissingDocs ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          {verifiedMandatory.length}/{mandatoryDocs.length} Mandatory
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          {mandatoryDocs.length}/{mandatoryDocs.length} Ready
                        </span>
                      )}
                    </div>
                    <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          hasRejectedDocs
                            ? 'bg-rose-500'
                            : verifiedMandatory.length === mandatoryDocs.length
                            ? 'bg-emerald-600'
                            : 'bg-amber-500'
                        }`}
                        style={{
                          width: `${
                            mandatoryDocs.length > 0
                              ? (verifiedMandatory.length / mandatoryDocs.length) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-4">
                    <ApplicationStatusBadge status={app.status} size="sm" />
                  </td>

                  {/* Actions */}
                  <td
                    className="py-4 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        id={`view-app-btn-${app.id}`}
                        onClick={() => onSelectApplication(app)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                        title="View Application Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {app.status === 'DRAFT' && canEdit && onEditApplication && (
                        <button
                          id={`edit-app-btn-${app.id}`}
                          onClick={() => onEditApplication(app)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          title="Edit Application Terms"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}

                      {app.status === 'DRAFT' && canSubmit && onSubmitApplication && (
                        <button
                          id={`submit-app-btn-${app.id}`}
                          onClick={() => onSubmitApplication(app)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          title="Validate & Submit Application"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}

                      {app.status === 'DRAFT' && canCancel && onCancelApplication && (
                        <button
                          id={`cancel-app-btn-${app.id}`}
                          onClick={() => onCancelApplication(app)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Cancel Application"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}

                      <ChevronRight className="w-4 h-4 text-slate-400 ml-1 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="py-3 px-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
        <span>
          Showing <strong>{applications.length}</strong> loan applications
        </span>
        <span className="font-mono text-[11px]">LMS Application Engine v2.4</span>
      </div>
    </div>
  );
};
