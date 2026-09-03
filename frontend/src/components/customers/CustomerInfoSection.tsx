import React, { useState } from 'react';
import { CustomerRecord } from '../../types';
import { formatIndianCurrency, formatDateDisplay } from '../../utils/formatters';
import {
  User,
  Phone,
  MapPin,
  Briefcase,
  Building2,
  ShieldCheck,
  Copy,
  Check,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';

interface CustomerInfoSectionProps {
  customer: CustomerRecord;
  onEditClick: () => void;
  canManage?: boolean;
}

export const CustomerInfoSection: React.FC<CustomerInfoSectionProps> = ({
  customer,
  onEditClick,
  canManage = true,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (field: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Calculate age
  const calculateAge = (dob: string) => {
    try {
      const birth = new Date(dob);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      return age > 0 ? `${age} years` : '—';
    } catch {
      return '—';
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Personal Information */}
        <div className="bg-white border border-slate-200 rounded p-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-700" />
              <h3 className="font-semibold text-slate-900 uppercase tracking-wide">
                Personal Information
              </h3>
            </div>
            {canManage && customer.status !== 'ARCHIVED' && (
              <button
                type="button"
                onClick={onEditClick}
                className="text-[11px] font-semibold text-slate-700 hover:text-slate-900"
              >
                Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-y-3 gap-x-4">
            <div>
              <span className="text-slate-500 block text-[11px]">Full Legal Name</span>
              <span className="font-medium text-slate-900">{customer.name}</span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Customer Classification</span>
              <span className="font-medium text-slate-900">
                {customer.customerType === 'BUSINESS' ? 'Corporate / Entity' : 'Individual Retail'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Date of Birth / Age</span>
              <span className="font-medium text-slate-900">
                {formatDateDisplay(customer.dateOfBirth)} ({calculateAge(customer.dateOfBirth)})
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Gender</span>
              <span className="font-medium text-slate-900 capitalize">
                {customer.gender.toLowerCase()}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Marital Status</span>
              <span className="font-medium text-slate-900 capitalize">
                {customer.maritalStatus ? customer.maritalStatus.toLowerCase() : 'Single'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Nationality</span>
              <span className="font-medium text-slate-900">{customer.nationality || 'Indian'}</span>
            </div>
          </div>
        </div>

        {/* 2. Contact Information */}
        <div className="bg-white border border-slate-200 rounded p-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-700" />
              <h3 className="font-semibold text-slate-900 uppercase tracking-wide">
                Contact Information
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-3 gap-x-4">
            <div>
              <span className="text-slate-500 block text-[11px]">Primary Mobile</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono font-medium text-slate-900">{customer.mobile}</span>
                <button
                  type="button"
                  onClick={() => handleCopy('mobile', customer.mobile)}
                  className="text-slate-400 hover:text-slate-700 focus:outline-none"
                  title="Copy mobile"
                >
                  {copiedField === 'mobile' ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Alternate Mobile</span>
              <span className="font-mono font-medium text-slate-900">
                {customer.alternateMobile || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Primary Email</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-medium text-slate-900 truncate">{customer.email || '—'}</span>
                {customer.email && (
                  <button
                    type="button"
                    onClick={() => handleCopy('email', customer.email!)}
                    className="text-slate-400 hover:text-slate-700 focus:outline-none"
                    title="Copy email"
                  >
                    {copiedField === 'email' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Preferred Channel</span>
              <span className="font-medium text-slate-900">
                {customer.preferredContact === 'EMAIL' ? 'Official Email' : 'Mobile SMS / Voice'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Address Information */}
        <div className="bg-white border border-slate-200 rounded p-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-700" />
              <h3 className="font-semibold text-slate-900 uppercase tracking-wide">
                Address Information
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Current Address */}
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1 text-[11px]">
                <span>Current Residential Address</span>
              </div>
              <div className="text-slate-700 leading-relaxed text-xs">
                <div>{customer.currentAddress.addressLine1}</div>
                {customer.currentAddress.addressLine2 && (
                  <div>{customer.currentAddress.addressLine2}</div>
                )}
                <div>
                  {customer.currentAddress.city}, {customer.currentAddress.state} -{' '}
                  <span className="font-mono">{customer.currentAddress.pinCode}</span>
                </div>
              </div>
            </div>

            {/* Permanent Address */}
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <div className="font-semibold text-slate-900 mb-1 flex items-center justify-between text-[11px]">
                <span>Permanent Address</span>
                {customer.sameAsCurrentAddress && (
                  <span className="text-[10px] text-slate-500 font-normal italic">
                    (Same as current)
                  </span>
                )}
              </div>
              <div className="text-slate-700 leading-relaxed text-xs">
                <div>{customer.permanentAddress.addressLine1}</div>
                {customer.permanentAddress.addressLine2 && (
                  <div>{customer.permanentAddress.addressLine2}</div>
                )}
                <div>
                  {customer.permanentAddress.city}, {customer.permanentAddress.state} -{' '}
                  <span className="font-mono">{customer.permanentAddress.pinCode}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Employment & Income */}
        <div className="bg-white border border-slate-200 rounded p-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-700" />
              <h3 className="font-semibold text-slate-900 uppercase tracking-wide">
                Employment & Declared Income
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-y-3 gap-x-4">
            <div>
              <span className="text-slate-500 block text-[11px]">Employment Type</span>
              <span className="font-medium text-slate-900">
                {customer.employmentType.replace('_', ' ')}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Declared Monthly Income</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {formatIndianCurrency(customer.monthlyIncome, true)}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Employer / Business Name</span>
              <span className="font-medium text-slate-900">
                {customer.employerName || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Designation / Occupation</span>
              <span className="font-medium text-slate-900">
                {customer.occupation || '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Employment Since</span>
              <span className="font-medium text-slate-900">
                {customer.employmentSince ? formatDateDisplay(customer.employmentSince) : '—'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block text-[11px]">Underwriting Status</span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>KYC Tier 1 Complete</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Banking & Identification / Verification Row */}
      <div className="bg-white border border-slate-200 rounded p-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-700" />
            <h3 className="font-semibold text-slate-900 uppercase tracking-wide">
              Disbursement Banking & Masked Identity Credentials
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Sensitive identity credentials securely masked per RBI guidelines
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div>
            <span className="text-slate-500 block text-[11px]">Primary Bank</span>
            <span className="font-medium text-slate-900">{customer.bankName || 'HDFC Bank'}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Account Number (Masked)</span>
            <span className="font-mono font-medium text-slate-900">
              {customer.accountNumberMasked || '•••• •••• 8812'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">IFSC Code</span>
            <span className="font-mono font-medium text-slate-900 uppercase">
              {customer.ifscCode || 'HDFC0000084'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">PAN (Masked)</span>
            <span className="font-mono font-medium text-slate-900">
              {customer.panMasked || 'ABCDE••••F'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Aadhaar (Masked)</span>
            <span className="font-mono font-medium text-slate-900">
              {customer.aadhaarMasked || '•••• •••• 1001'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
