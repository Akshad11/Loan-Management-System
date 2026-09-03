import React from 'react';
import { User, Phone, CreditCard, Briefcase, IndianRupee, ShieldCheck, AlertCircle } from 'lucide-react';
import { LoanApplicationRecord } from '../../types/applicationTypes';
import { formatCurrencyINR } from '../../utils/formatters';

interface ApplicantSummaryCardProps {
  application: LoanApplicationRecord;
  onViewCustomerProfile?: (customerId: string) => void;
}

export const ApplicantSummaryCard: React.FC<ApplicantSummaryCardProps> = ({
  application,
  onViewCustomerProfile,
}) => {
  const isKycVerified = application.customerKycStatus === 'VERIFIED';

  return (
    <div
      id="primary-applicant-card"
      className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm"
    >
      <div className="flex items-start justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-base">
            {application.customerName
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">{application.customerName}</h3>
              <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                {application.customerNumber}
              </span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {application.customerMobile}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                {application.customerEmploymentType.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
              isKycVerified
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {isKycVerified ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            )}
            KYC {application.customerKycStatus}
          </span>
          {onViewCustomerProfile && (
            <button
              onClick={() => onViewCustomerProfile(application.customerId)}
              className="block text-xs text-blue-600 hover:text-blue-800 font-medium mt-1.5"
            >
              View Full 360° Profile →
            </button>
          )}
        </div>
      </div>

      {/* Financial Snapshot */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-1 text-xs">
        <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
          <span className="text-slate-500 block mb-0.5">Declared Monthly Income</span>
          <span className="text-sm font-bold text-slate-900">
            {formatCurrencyINR(application.customerMonthlyIncome)}
          </span>
        </div>

        <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
          <span className="text-slate-500 block mb-0.5">Existing Active Loans</span>
          <span className="text-sm font-bold text-slate-900">
            {application.customerExistingLoansCount} Account(s)
          </span>
        </div>

        <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
          <span className="text-slate-500 block mb-0.5">Total Existing Exposure</span>
          <span className="text-sm font-bold text-slate-900">
            {formatCurrencyINR(application.customerTotalExposure)}
          </span>
        </div>

        <div className="bg-slate-50 p-3 rounded-md border border-slate-100">
          <span className="text-slate-500 block mb-0.5">Applicant Role</span>
          <span className="text-sm font-bold text-slate-900">
            Primary Borrower (100%)
          </span>
        </div>
      </div>
    </div>
  );
};
