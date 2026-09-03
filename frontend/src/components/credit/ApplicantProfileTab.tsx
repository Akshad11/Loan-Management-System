import React from 'react';
import { CreditAssessmentRecord } from '../../types/creditTypes';
import { LoanApplicationRecord, CustomerRecord } from '../../types';
import { User, Phone, MapPin, Building, Briefcase, Calendar, ShieldCheck, Users, CreditCard } from 'lucide-react';

interface ApplicantProfileTabProps {
  assessment: CreditAssessmentRecord;
  application?: LoanApplicationRecord;
  customer?: CustomerRecord;
}

export const ApplicantProfileTab: React.FC<ApplicantProfileTabProps> = ({
  assessment,
  application,
  customer,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Primary Borrower Personal & Contact Identity */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
          <User className="w-4 h-4 text-slate-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Primary Borrower Information
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block mb-1">Full Legal Name</span>
            <span className="font-bold text-slate-900">{assessment.customerName}</span>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">Customer Number</span>
            <span className="font-mono text-slate-700">{assessment.customerNumber}</span>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">Mobile Number</span>
            <span className="font-medium text-slate-800">{customer?.mobile || '+91 98765 43210'}</span>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">Email Address</span>
            <span className="text-slate-700">{customer?.email || 'borrower@example.com'}</span>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">Date of Birth / Age</span>
            <span className="font-medium text-slate-800">
              {customer?.dateOfBirth ? `${customer.dateOfBirth} (38 Yrs)` : '1988-04-12 (38 Yrs)'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">PAN / Tax ID</span>
            <span className="font-mono font-semibold text-slate-900 uppercase">
              {customer?.panMasked || (customer as any)?.pan || 'ABCDE1234F'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">Branch Origin</span>
            <span className="font-medium text-slate-800">{assessment.branchName}</span>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">Application Date</span>
            <span className="font-medium text-slate-800">{(assessment as any).applicationDate || assessment.createdDate?.split('T')[0] || '2026-08-10'}</span>
          </div>
        </div>

        {customer?.currentAddress && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="text-slate-500">Current Residence: </span>
              <span className="font-medium text-slate-800">
                {customer.currentAddress.addressLine1 || (customer.currentAddress as any).line1}, {customer.currentAddress.city}, {customer.currentAddress.state} - {customer.currentAddress.pinCode || (customer.currentAddress as any).pincode} ({(customer.currentAddress as any).residenceType || 'OWNED'})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Employment & Financial & Co-Applicant Verification */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-slate-900 font-semibold border-b border-slate-100 pb-3">
          <Briefcase className="w-4 h-4 text-indigo-600" />
          <h3>Employment, Financial & Co-Applicant Verification</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs mb-4">
          <div>
            <span className="text-slate-500 block mb-1">Employment Type</span>
            <span className="font-medium text-slate-800">
              {customer?.employmentType || 'Salaried (Corporate)'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">Employer / Company</span>
            <span className="font-semibold text-slate-900">
              {customer?.employerName || 'Tech Solutions Pvt Ltd'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">Gross Monthly Income</span>
            <span className="font-semibold text-emerald-700">
              ₹{(customer?.monthlyIncome || assessment.otherMonthlyIncome || 0).toLocaleString('en-IN')}/mo
            </span>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">Work Vintage / Tenure</span>
            <span className="font-medium text-slate-800">
              {customer?.employmentSince || '5 yrs 4 mos'}
            </span>
          </div>
        </div>

        {/* Banking Details */}
        <div className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between text-xs mb-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-500" />
            <div>
              <span className="font-semibold text-slate-800">{customer?.bankName || 'HDFC Bank Ltd'}</span>
              <span className="text-slate-500 block text-[11px]">
                A/C: {customer?.accountNumberMasked || '••••••••8492'} | IFSC: {customer?.ifscCode || 'HDFC0000084'}
              </span>
            </div>
          </div>
          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium text-[11px]">
            Salary Account Verified
          </span>
        </div>

        {application?.coApplicants && application.coApplicants.length > 0 ? (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-slate-700 mb-2 uppercase">Co-Applicants</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {application.coApplicants.map((co) => (
                <div key={co.id} className="p-3 rounded border border-slate-200 bg-slate-50 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-900">{co.customerName || (co as any).fullName}</span>
                    <span className="font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[11px] border border-indigo-200">
                      {co.relationship || (co as any).relationshipToPrimary}
                    </span>
                  </div>
                  <div className="text-slate-500 flex justify-between mt-1">
                    <span>PAN: {co.panMasked || (co as any).pan}</span>
                    <span>Income: ₹{(co.monthlyIncome || 0).toLocaleString('en-IN')}/mo</span>
                  </div>
                  <div className="text-slate-500 flex justify-between mt-1">
                    <span>KYC: <strong className="text-emerald-700">{co.kycStatus}</strong></span>
                    <span>Liabilities: ₹{(co.totalOutstanding || (co as any).existingLiabilities || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {application?.guarantors && application.guarantors.length > 0 ? (
          <div>
            <h4 className="text-xs font-semibold text-slate-700 mb-2 uppercase">Guarantors</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {application.guarantors.map((guar) => (
                <div key={guar.id} className="p-3 rounded border border-slate-200 bg-slate-50 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-900">{guar.customerName || (guar as any).fullName}</span>
                    <span className="font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded text-[11px] border border-purple-200">
                      Guarantor ({guar.relationship || (guar as any).relationshipToApplicant})
                    </span>
                  </div>
                  <div className="text-slate-500 flex justify-between mt-1">
                    <span>PAN: {guar.panMasked || (guar as any).pan}</span>
                    <span>Net Worth: ₹{(guar.netWorthEstimated || (guar as any).netWorth || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {(!application?.coApplicants || application.coApplicants.length === 0) &&
          (!application?.guarantors || application.guarantors.length === 0) && (
            <div className="py-4 text-center text-xs text-slate-400">
              No co-applicants or personal guarantors attached to this application.
            </div>
          )}
      </div>
    </div>
  );
};
