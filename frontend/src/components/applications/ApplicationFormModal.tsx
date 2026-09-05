import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  DollarSign,
  User,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Calculator,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { Modal } from '../shared/Modal';
import { ValidationPopup } from '../shared/ValidationPopup';
import {
  LoanProductConfig,
  LoanApplicationRecord,
  LoanPurposeCategory,
  LoanRepaymentFrequency,
} from '../../types/applicationTypes';
import { CustomerRecord, Branch } from '../../types';
import { formatCurrencyINR } from '../../utils/formatters';

interface ApplicationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    customerId: string;
    productCode: string;
    requestedAmount: number;
    requestedTenureMonths: number;
    repaymentFrequency: LoanRepaymentFrequency;
    preferredRepaymentDate?: number;
    purpose: string;
    purposeCategory: LoanPurposeCategory;
    branchId: string;
    loanOfficer: string;
    notes?: string;
  }) => void;
  products: LoanProductConfig[];
  customers: CustomerRecord[];
  branches: Branch[];
  editingApplication?: LoanApplicationRecord | null;
  initialCustomerId?: string;
}

export const ApplicationFormModal: React.FC<ApplicationFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  products,
  customers,
  branches,
  editingApplication,
  initialCustomerId,
}) => {
  const isEdit = !!editingApplication;

  // Selected customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    editingApplication?.customerId || initialCustomerId || (customers[0]?.id ?? '')
  );
  const [customerSearch, setCustomerSearch] = useState<string>('');

  // Selected product
  const [selectedProductCode, setSelectedProductCode] = useState<string>(
    editingApplication?.productCode || products[0]?.code || ''
  );

  // Financial terms
  const [requestedAmount, setRequestedAmount] = useState<number>(
    editingApplication?.requestedAmount || 500000
  );
  const [requestedTenureMonths, setRequestedTenureMonths] = useState<number>(
    editingApplication?.requestedTenureMonths || 36
  );
  const [repaymentFrequency, setRepaymentFrequency] = useState<LoanRepaymentFrequency>(
    editingApplication?.repaymentFrequency || 'MONTHLY'
  );
  const [preferredRepaymentDate, setPreferredRepaymentDate] = useState<number>(
    editingApplication?.preferredRepaymentDate || 5
  );

  // Purpose & Admin
  const [purposeCategory, setPurposeCategory] = useState<LoanPurposeCategory>(
    editingApplication?.purposeCategory || 'PERSONAL'
  );
  const [purpose, setPurpose] = useState<string>(editingApplication?.purpose || '');
  const [branchId, setBranchId] = useState<string>(
    editingApplication?.branchId || branches[0]?.id || ''
  );
  const [loanOfficer, setLoanOfficer] = useState<string>(
    editingApplication?.loanOfficer || 'Siddharth Rao'
  );
  const [notes, setNotes] = useState<string>(editingApplication?.notes || '');
  const [isValidationPopupOpen, setIsValidationPopupOpen] = useState<boolean>(false);

  // Reset or initialize on open
  useEffect(() => {
    if (editingApplication) {
      setSelectedCustomerId(editingApplication.customerId);
      setSelectedProductCode(editingApplication.productCode);
      setRequestedAmount(editingApplication.requestedAmount);
      setRequestedTenureMonths(editingApplication.requestedTenureMonths);
      setRepaymentFrequency(editingApplication.repaymentFrequency);
      setPreferredRepaymentDate(editingApplication.preferredRepaymentDate || 5);
      setPurposeCategory(editingApplication.purposeCategory);
      setPurpose(editingApplication.purpose);
      setBranchId(editingApplication.branchId);
      setLoanOfficer(editingApplication.loanOfficer);
      setNotes(editingApplication.notes || '');
    } else {
      if (initialCustomerId) {
        setSelectedCustomerId(initialCustomerId);
      }
    }
  }, [editingApplication, initialCustomerId, isOpen]);

  // Current customer profile
  const currentCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // Current product config
  const currentProduct = useMemo(() => {
    return products.find((p) => p.code === selectedProductCode) || products[0];
  }, [products, selectedProductCode]);

  // Filtered customer list for search dropdown
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.filter((c) => c.status !== 'ARCHIVED');
    const q = customerSearch.toLowerCase();
    return customers
      .filter((c) => c.status !== 'ARCHIVED')
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.customerNumber.toLowerCase().includes(q) ||
          (c.mobile || '').includes(q) ||
          (c.panMasked || '').toLowerCase().includes(q)
      );
  }, [customers, customerSearch]);

  // Handle product switch: clamp amount and tenure
  const handleProductChange = (prodCode: string) => {
    setSelectedProductCode(prodCode);
    const prod = products.find((p) => p.code === prodCode);
    if (prod) {
      if (requestedAmount < prod.minAmount) setRequestedAmount(prod.minAmount);
      if (requestedAmount > prod.maxAmount) setRequestedAmount(prod.maxAmount);
      if (requestedTenureMonths < prod.minTenureMonths)
        setRequestedTenureMonths(prod.minTenureMonths);
      if (requestedTenureMonths > prod.maxTenureMonths)
        setRequestedTenureMonths(prod.maxTenureMonths);
    }
  };

  // Estimated Monthly EMI calculation (Reducing Balance Method)
  const estimatedEMI = useMemo(() => {
    if (!currentProduct || requestedAmount <= 0 || requestedTenureMonths <= 0) return 0;
    const monthlyRate = currentProduct.baseInterestRate / 12 / 100;
    const emi =
      (requestedAmount *
        monthlyRate *
        Math.pow(1 + monthlyRate, requestedTenureMonths)) /
      (Math.pow(1 + monthlyRate, requestedTenureMonths) - 1);
    return Math.round(emi);
  }, [currentProduct, requestedAmount, requestedTenureMonths]);

  // Validation
  const errors = useMemo(() => {
    const errs: string[] = [];
    if (!selectedCustomerId) errs.push('Primary applicant must be selected.');
    if (!selectedProductCode) errs.push('Loan product must be selected.');

    if (currentProduct) {
      if (requestedAmount < currentProduct.minAmount || requestedAmount > currentProduct.maxAmount) {
        errs.push(
          `Requested amount must be between ${formatCurrencyINR(
            currentProduct.minAmount
          )} and ${formatCurrencyINR(currentProduct.maxAmount)}.`
        );
      }
      if (
        requestedTenureMonths < currentProduct.minTenureMonths ||
        requestedTenureMonths > currentProduct.maxTenureMonths
      ) {
        errs.push(
          `Tenure must be between ${currentProduct.minTenureMonths} and ${currentProduct.maxTenureMonths} months.`
        );
      }
    }

    if (!purpose || purpose.trim().length < 10) {
      errs.push('Please describe the loan purpose in at least 10 characters.');
    }

    return errs;
  }, [selectedCustomerId, selectedProductCode, currentProduct, requestedAmount, requestedTenureMonths, purpose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (errors.length > 0) {
      setIsValidationPopupOpen(true);
      return;
    }

    onSubmit({
      customerId: selectedCustomerId,
      productCode: selectedProductCode,
      requestedAmount,
      requestedTenureMonths,
      repaymentFrequency,
      preferredRepaymentDate,
      purpose,
      purposeCategory,
      branchId: branchId || currentCustomer?.branchName || 'br_panjim',
      loanOfficer,
      notes,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Terms — ${editingApplication.applicationNumber}` : 'Originate New Loan Application'}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: APPLICANT SELECTION */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-600" />
              1. Primary Applicant
            </label>
            {currentCustomer && (
              <span className="text-xs text-slate-500 font-mono">
                {currentCustomer.customerNumber}
              </span>
            )}
          </div>

          {!isEdit ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter applicant by name, mobile or PAN..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded bg-white"
                />
              </div>

              <select
                id="applicant-select-dropdown"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white text-slate-900 font-medium"
              >
                {filteredCustomers.map((cust) => (
                  <option key={cust.id} value={cust.id}>
                    {cust.name} ({cust.customerNumber}) — {cust.employmentType} — Income: {formatCurrencyINR(cust.monthlyIncome)}/mo
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="font-semibold text-slate-900 text-sm">
              {editingApplication.customerName} ({editingApplication.customerNumber})
            </div>
          )}

          {currentCustomer && (
            <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block">Mobile:</span>
                <span className="font-mono text-slate-800">{currentCustomer.mobile}</span>
              </div>
              <div>
                <span className="text-slate-500 block">PAN Card:</span>
                <span className="font-mono text-slate-800">{currentCustomer.panMasked}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Monthly Income:</span>
                <span className="font-semibold text-slate-900">{formatCurrencyINR(currentCustomer.monthlyIncome)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Active Exposure:</span>
                <span className="font-semibold text-slate-800">{formatCurrencyINR(currentCustomer.totalOutstanding)}</span>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: LOAN PRODUCT SELECTION */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 mb-3">
            <FileText className="w-4 h-4 text-slate-600" />
            2. Loan Product
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {products.map((prod) => {
              const isSelected = selectedProductCode === prod.code;
              return (
                <div
                  key={prod.code}
                  onClick={() => handleProductChange(prod.code)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-slate-900 bg-white ring-1 ring-slate-900 shadow-sm'
                      : 'border-slate-200 bg-white/60 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{prod.name}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {prod.description}
                      </div>
                    </div>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-800 rounded">
                      {prod.baseInterestRate}% p.a.
                    </span>
                  </div>

                  <div className="mt-2 text-[11px] text-slate-600 flex justify-between border-t border-slate-100 pt-1.5">
                    <span>
                      Limit: {formatCurrencyINR(prod.minAmount)} – {formatCurrencyINR(prod.maxAmount)}
                    </span>
                    <span>Tenure: {prod.minTenureMonths}–{prod.maxTenureMonths}m</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: REQUESTED TERMS & ESTIMATED EMI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Requested Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Requested Amount (₹ INR) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-500">₹</span>
              <input
                id="requested-amount-input"
                type="number"
                step="10000"
                min={currentProduct?.minAmount}
                max={currentProduct?.maxAmount}
                value={requestedAmount}
                onChange={(e) => setRequestedAmount(Number(e.target.value))}
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-slate-900 font-semibold"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Limits for {currentProduct?.name}: {formatCurrencyINR(currentProduct?.minAmount || 0)} to {formatCurrencyINR(currentProduct?.maxAmount || 0)}
            </p>
          </div>

          {/* Requested Tenure */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Requested Tenure (Months) <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                id="requested-tenure-input"
                type="number"
                min={currentProduct?.minTenureMonths}
                max={currentProduct?.maxTenureMonths}
                value={requestedTenureMonths}
                onChange={(e) => setRequestedTenureMonths(Number(e.target.value))}
                className="w-28 px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-slate-900 font-semibold"
              />
              <span className="text-xs text-slate-500">
                ({(requestedTenureMonths / 12).toFixed(1)} Years)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Allowed: {currentProduct?.minTenureMonths} – {currentProduct?.maxTenureMonths} months
            </p>
          </div>
        </div>

        {/* EMI ESTIMATION CARD */}
        <div className="bg-slate-900 text-white rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="text-xs text-slate-300 uppercase tracking-wider">Estimated Monthly EMI</div>
              <div className="text-2xl font-bold font-mono text-white">
                {formatCurrencyINR(estimatedEMI)}
                <span className="text-xs font-normal text-slate-400"> / month</span>
              </div>
            </div>
          </div>

          <div className="text-right text-xs text-slate-300 space-y-0.5">
            <div>Base Interest Rate: <strong>{currentProduct?.baseInterestRate}% p.a.</strong></div>
            <div>Total Interest Approx: <strong>{formatCurrencyINR(Math.max(0, estimatedEMI * requestedTenureMonths - requestedAmount))}</strong></div>
          </div>
        </div>

        {/* SECTION 4: REPAYMENT & PURPOSE */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Repayment Frequency
            </label>
            <select
              value={repaymentFrequency}
              onChange={(e) => setRepaymentFrequency(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
            >
              <option value="MONTHLY">Monthly</option>
              <option value="BI_WEEKLY">Bi-Weekly</option>
              <option value="WEEKLY">Weekly</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Preferred Due Date of Month
            </label>
            <select
              value={preferredRepaymentDate}
              onChange={(e) => setPreferredRepaymentDate(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
            >
              <option value={5}>5th of every month</option>
              <option value={7}>7th of every month</option>
              <option value={10}>10th of every month</option>
              <option value={15}>15th of every month</option>
              <option value={20}>20th of every month</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Purpose Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={purposeCategory}
              onChange={(e) => setPurposeCategory(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
            >
              <option value="PERSONAL">Personal Financing</option>
              <option value="HOME_PURCHASE">Home Purchase</option>
              <option value="HOME_IMPROVEMENT">Home Improvement / Renovation</option>
              <option value="BUSINESS_EXPANSION">Business Expansion</option>
              <option value="WORKING_CAPITAL">Working Capital</option>
              <option value="VEHICLE_PURCHASE">Vehicle Purchase</option>
              <option value="MEDICAL_EMERGENCY">Medical Emergency</option>
              <option value="EDUCATION">Higher Education</option>
              <option value="DEBT_CONSOLIDATION">Debt Consolidation</option>
              <option value="OTHER">Other Purpose</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Branch & Assigned Officer
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="px-2 py-2 text-xs border border-slate-300 rounded-md bg-white"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={loanOfficer}
                onChange={(e) => setLoanOfficer(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-md"
                placeholder="Officer name"
              />
            </div>
          </div>
        </div>

        {/* Purpose Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Detailed Purpose & Justification <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Explain the specific purpose, end-use of funds, and repayment source..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-slate-900 focus:border-slate-900"
          />
        </div>

        {/* Errors view */}
        {errors.length > 0 && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 space-y-1">
            {errors.map((err, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>{err}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md border border-slate-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={(e) => {
              if (errors.length > 0) {
                e.preventDefault();
                setIsValidationPopupOpen(true);
              }
            }}
            className="px-5 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-sm transition-colors cursor-pointer"
          >
            {isEdit ? 'Save Application Terms' : 'Originate Draft Application'}
          </button>
        </div>

        {/* Validation Warning Popup */}
        <ValidationPopup
          isOpen={isValidationPopupOpen}
          onClose={() => setIsValidationPopupOpen(false)}
          title="Application Validation Required"
          subtitle="Please resolve the following criteria before originating or saving this application:"
          errors={errors}
          fixLabel="Back to Application Form"
        />
      </form>
    </Modal>
  );
};
