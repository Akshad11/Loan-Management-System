import React, { useState } from 'react';
import { X, Plus, CheckCircle2, AlertTriangle, Layers, Percent, DollarSign, Calendar } from 'lucide-react';
import { LoanProductRecord, ProductCategory } from '../../types/formBuilderTypes';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { id: string; name: string; roleName: string };
  initialProduct?: LoanProductRecord | null;
  onSubmit: (productData: any) => Promise<void>;
}

export const CreateProductModal: React.FC<CreateProductModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialProduct,
  onSubmit,
}) => {
  const [code, setCode] = useState<string>(initialProduct?.code || '');
  const [name, setName] = useState<string>(initialProduct?.name || '');
  const [category, setCategory] = useState<ProductCategory>(initialProduct?.category || 'HOUSING');
  const [description, setDescription] = useState<string>(initialProduct?.description || '');
  const [minAmount, setMinAmount] = useState<number>(initialProduct?.minAmount || 100000);
  const [maxAmount, setMaxAmount] = useState<number>(initialProduct?.maxAmount || 5000000);
  const [minTenureMonths, setMinTenureMonths] = useState<number>(initialProduct?.minTenureMonths || 12);
  const [maxTenureMonths, setMaxTenureMonths] = useState<number>(initialProduct?.maxTenureMonths || 120);
  const [baseInterestRate, setBaseInterestRate] = useState<number>(initialProduct?.baseInterestRate || 9.5);
  const [maxInterestRate, setMaxInterestRate] = useState<number>(initialProduct?.maxInterestRate || 14.0);
  const [processingFeePercent, setProcessingFeePercent] = useState<number>(initialProduct?.processingFeePercent || 1.0);
  const [minCreditScore, setMinCreditScore] = useState<number>(initialProduct?.minCreditScore || 650);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setErrorMsg('Product code and name are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await onSubmit({
        code: code.toUpperCase().trim(),
        name: name.trim(),
        category,
        description,
        minAmount,
        maxAmount,
        minTenureMonths,
        maxTenureMonths,
        baseInterestRate,
        maxInterestRate,
        processingFeePercent,
        minCreditScore,
        createdBy: currentUser.name,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create loan product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {initialProduct ? 'Edit Loan Product Policy' : 'Create New Loan Product'}
              </h2>
              <p className="text-xs text-blue-200">Configure lending parameters, ticket limits, and underwriting thresholds</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-800 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Product Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                placeholder="e.g. HL-PRIME"
                disabled={!!initialProduct}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Product Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-blue-500"
              >
                <option value="HOUSING">Housing / Home Loan</option>
                <option value="PERSONAL">Personal Loan</option>
                <option value="VEHICLE">Auto / Vehicle Loan</option>
                <option value="BUSINESS">SME / Business Loan</option>
                <option value="GOLD">Gold Loan</option>
                <option value="EDUCATION">Education Loan</option>
                <option value="RETAIL">General Retail</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Product Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              placeholder="e.g. Home Loan Prime Scheme"
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Min Amount (₹)
              </label>
              <input
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Max Amount (₹)
              </label>
              <input
                type="number"
                value={maxAmount}
                onChange={(e) => setMaxAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Min Tenure (Mos)
              </label>
              <input
                type="number"
                value={minTenureMonths}
                onChange={(e) => setMinTenureMonths(parseInt(e.target.value) || 12)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Max Tenure (Mos)
              </label>
              <input
                type="number"
                value={maxTenureMonths}
                onChange={(e) => setMaxTenureMonths(parseInt(e.target.value) || 60)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Benchmark ROI (%)
              </label>
              <input
                type="number"
                step={0.25}
                value={baseInterestRate}
                onChange={(e) => setBaseInterestRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-blue-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Processing Fee (%)
              </label>
              <input
                type="number"
                step={0.1}
                value={processingFeePercent}
                onChange={(e) => setProcessingFeePercent(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Min CIBIL Score
              </label>
              <input
                type="number"
                value={minCreditScore}
                onChange={(e) => setMinCreditScore(parseInt(e.target.value) || 650)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description & Underwriting Purpose
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-bold hover:text-slate-900"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl font-bold shadow-md flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : initialProduct ? 'Update Product' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
