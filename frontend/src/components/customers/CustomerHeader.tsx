import React, { useState } from 'react';
import { CustomerRecord } from '../../types';
import { CustomerStatusBadge } from './CustomerStatusBadge';
import { formatIndianCurrency } from '../../utils/formatters';
import {
  Copy,
  Check,
  Edit2,
  Building2,
  Phone,
  Mail,
  Archive,
  RotateCcw,
  ArrowLeft,
  FileText,
  History,
  ShieldCheck,
  FolderOpen,
} from 'lucide-react';

interface CustomerHeaderProps {
  customer: CustomerRecord;
  onBack: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onRestore?: () => void;
  canManage?: boolean;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const CustomerHeader: React.FC<CustomerHeaderProps> = ({
  customer,
  onBack,
  onEdit,
  onArchive,
  onRestore,
  canManage = true,
  activeTab,
  onTabChange,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(customer.customerNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded text-xs space-y-3">
      {/* Top action / back bar */}
      <div className="px-4 pt-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Customers List</span>
          </button>

          <div className="h-4 w-px bg-slate-200" />

          {/* Customer Number with quick copy */}
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            <span>{customer.customerNumber}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="text-slate-500 hover:text-slate-900 focus:outline-none"
              title="Copy Customer ID"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          <CustomerStatusBadge status={customer.status} />

          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 font-medium text-[11px]">
            {customer.customerType === 'BUSINESS' ? 'Corporate / Business' : 'Individual'}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {canManage && customer.status !== 'ARCHIVED' && (
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded hover:bg-slate-50 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Customer</span>
            </button>
          )}

          {canManage && customer.status === 'ARCHIVED' && onRestore && (
            <button
              type="button"
              onClick={onRestore}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded hover:bg-emerald-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Customer</span>
            </button>
          )}

          {canManage && customer.status !== 'ARCHIVED' && (
            <button
              type="button"
              onClick={onArchive}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-200 text-amber-800 font-semibold rounded hover:bg-amber-50 transition-colors"
            >
              <Archive className="w-3.5 h-3.5 text-amber-600" />
              <span>Archive</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Profile Info Row */}
      <div className="px-4 py-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{customer.name}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 text-xs mt-1">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{customer.branchName}</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1 font-mono">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{customer.mobile}</span>
            </span>
            {customer.email && (
              <>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{customer.email}</span>
                </span>
              </>
            )}
            {customer.cibilScore && (
              <>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 font-semibold text-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>CIBIL Score: {customer.cibilScore}</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Snapshot metric badges */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-right">
            <div className="text-[10px] uppercase font-semibold text-slate-500">Active Exposure</div>
            <div className="text-sm font-bold font-mono text-slate-900">
              {formatIndianCurrency(customer.totalOutstanding, true)}
            </div>
          </div>

          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-right">
            <div className="text-[10px] uppercase font-semibold text-slate-500">Active Loans</div>
            <div className="text-sm font-bold font-mono text-slate-900 text-center">
              {customer.activeLoanCount}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-4 border-t border-slate-100 flex items-center gap-4 overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => onTabChange('overview')}
          className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Customer Overview</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('kyc')}
          className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'kyc'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>KYC & Identity</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('documents')}
          className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'documents'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Documents & Vault</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('applications')}
          className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'applications'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Applications</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('loans')}
          className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'loans'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Loan Accounts</span>
          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[10px] rounded font-mono">
            {customer.activeLoanCount + customer.closedLoanCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('history')}
          className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Activity Timeline</span>
        </button>
      </div>
    </div>
  );
};
