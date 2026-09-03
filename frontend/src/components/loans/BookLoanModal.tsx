import React, { useState, useEffect } from 'react';
import { CustomerRecord } from '../../types/customerTypes';
import { Branch } from '../../types';
import { LoanProductConfig } from '../../types/applicationTypes';
import { LoanRepaymentFrequency } from '../../types/loanAccountTypes';
import { Landmark, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface BookLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: CustomerRecord[];
  products: LoanProductConfig[];
  branches: Branch[];
  onBookLoan: (payload: {
    customerId: string;
    productCode: string;
    amount: number;
    tenureMonths: number;
    interestRate?: number;
    repaymentFrequency?: LoanRepaymentFrequency;
    branchId?: string;
    notes?: string;
  }) => void;
}

export const BookLoanModal: React.FC<BookLoanModalProps> = ({
  isOpen,
  onClose,
  customers,
  products,
  branches,
  onBookLoan,
}) => {
  const [customerId, setCustomerId] = useState('');
  const [productCode, setProductCode] = useState('');
  const [amount, setAmount] = useState(500000);
  const [tenureMonths, setTenureMonths] = useState(36);
  const [interestRate, setInterestRate] = useState(14.5);
  const [repaymentFrequency, setRepaymentFrequency] = useState<LoanRepaymentFrequency>('MONTHLY');
  const [branchId, setBranchId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (customers.length > 0 && !customerId) {
      setCustomerId(customers[0].id);
    }
    if (products.length > 0 && !productCode) {
      setProductCode(products[0].code);
      setInterestRate(products[0].baseInterestRate || 14.5);
    }
    if (branches.length > 0 && !branchId) {
      setBranchId(branches[0].id);
    }
  }, [customers, products, branches]);

  if (!isOpen) return null;

  const handleProductChange = (code: string) => {
    setProductCode(code);
    const prod = products.find((p) => p.code === code);
    if (prod) {
      if (prod.baseInterestRate) setInterestRate(prod.baseInterestRate);
      if (prod.minTenureMonths) setTenureMonths(prod.minTenureMonths);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId && customers.length > 0) {
      setError('Please select a customer.');
      return;
    }
    if (amount <= 0) {
      setError('Please enter a valid loan amount.');
      return;
    }
    if (tenureMonths <= 0) {
      setError('Please enter a valid tenure.');
      return;
    }

    onBookLoan({
      customerId: customerId || (customers[0]?.id ?? 'cus_001'),
      productCode: productCode || 'PERS_LOAN',
      amount: Number(amount),
      tenureMonths: Number(tenureMonths),
      interestRate: Number(interestRate),
      repaymentFrequency,
      branchId: branchId || 'br_panjim',
      notes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto">
      <div className="bg-white border border-slate-300 rounded-xl shadow-2xl max-w-lg w-full p-6 text-xs space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Book New Loan Account</h2>
              <p className="text-[11px] text-slate-500">Direct loan facility origination and account activation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Customer */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Borrower / Customer *</label>
            {customers.length > 0 ? (
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                required
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.customerNumber}) - {c.branchName}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="Enter Customer ID or Name"
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs"
              />
            )}
          </div>

          {/* Product */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Loan Product *</label>
            <select
              value={productCode}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
              required
            >
              {products.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name} ({p.code}) - {p.baseInterestRate}% p.a.
                </option>
              ))}
            </select>
          </div>

          {/* Amount & Tenure */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Principal Amount (₹) *</label>
              <input
                type="number"
                min={10000}
                step={10000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tenure (Months) *</label>
              <input
                type="number"
                min={3}
                max={360}
                value={tenureMonths}
                onChange={(e) => setTenureMonths(Number(e.target.value))}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono"
                required
              />
            </div>
          </div>

          {/* Interest Rate & Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Interest Rate (% p.a.) *</label>
              <input
                type="number"
                step="0.05"
                min="1"
                max="36"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs font-mono"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Repayment Frequency</label>
              <select
                value={repaymentFrequency}
                onChange={(e) => setRepaymentFrequency(e.target.value as any)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs"
              >
                <option value="MONTHLY">Monthly EMI</option>
                <option value="WEEKLY">Weekly</option>
                <option value="BI_WEEKLY">Bi-Weekly</option>
                <option value="QUARTERLY">Quarterly</option>
              </select>
            </div>
          </div>

          {/* Branch */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Servicing Branch</label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Remarks / Reference</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Sanction ref, special rate approval..."
              className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Book Loan & Generate Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
