import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Copy,
  Edit,
  Power,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { LoanProductRecord, ProductCategory } from '../../types/formBuilderTypes';
import { INITIAL_LOAN_PRODUCTS } from '../../data/loanProductData';
import { useMockLMSStore } from '../../services/mockService';
import { CreateProductModal } from '../products/CreateProductModal';
import { FormBuilderModal } from '../form-builder/FormBuilderModal';
import { formatCurrencyINR } from '../../utils/formatters';

import { useAuth } from '../../services/authContext';

export const LoanProductsView: React.FC<{ onNavigate?: (mod: string) => void }> = ({ onNavigate }) => {
  const store = useMockLMSStore();
  const { user } = useAuth();
  const currentUser = {
    id: user?.id || 'usr_admin_01',
    name: user?.name || 'Admin Officer',
    roleName: user?.roleTitle || 'System Administrator',
  };

  const [products, setProducts] = useState<LoanProductRecord[]>(INITIAL_LOAN_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<LoanProductRecord | null>(null);
  const [builderProduct, setBuilderProduct] = useState<LoanProductRecord | null>(null);
  const [bannerMessage, setBannerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/loan-products');
      if (res.ok) {
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          setProducts(data.products);
        }
      }
    } catch (e) {
      // Local fallback
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreateOrUpdate = async (productData: any) => {
    try {
      if (editingProduct) {
        const res = await fetch(`/api/loan-products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });
        if (!res.ok) throw new Error('Failed to update product');
        setBannerMessage({ type: 'success', text: `Product ${productData.name} updated successfully.` });
      } else {
        const res = await fetch('/api/loan-products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create product');
        }
        setBannerMessage({ type: 'success', text: `Product ${productData.name} created with custom Form Builder!` });
      }
      fetchProducts();
    } catch (err: any) {
      setBannerMessage({ type: 'error', text: err.message });
      throw err;
    }
  };

  const handleToggleStatus = async (product: LoanProductRecord) => {
    try {
      const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const res = await fetch(`/api/loan-products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Status update failed');
      setBannerMessage({
        type: 'success',
        text: `Product ${product.code} marked as ${newStatus}.`,
      });
      fetchProducts();
    } catch (err: any) {
      setBannerMessage({ type: 'error', text: err.message });
    }
  };

  const handleDuplicate = async (product: LoanProductRecord) => {
    try {
      const newCode = `${product.code}_COPY_${Date.now().toString().slice(-3)}`;
      const res = await fetch('/api/loan-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          code: newCode,
          name: `${product.name} (Copy)`,
          createdBy: currentUser.name,
        }),
      });
      if (!res.ok) throw new Error('Failed to duplicate product');
      setBannerMessage({ type: 'success', text: `Duplicated product ${newCode} successfully.` });
      fetchProducts();
    } catch (err: any) {
      setBannerMessage({ type: 'error', text: err.message });
    }
  };

  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Loan Products & Custom Form Builder
            </h1>
            <span className="bg-blue-100 text-blue-800 text-xs font-black px-2.5 py-0.5 rounded-full border border-blue-300">
              Configurable Engine
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Configure lending schemes, ticket limits, interest benchmarks & bespoke multi-page application forms
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setIsCreateModalOpen(true);
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/20 transition-all flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Loan Product</span>
        </button>
      </div>

      {/* Banner message */}
      {bannerMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold ${
            bannerMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center space-x-2">
            {bannerMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{bannerMessage.text}</span>
          </div>
          <button onClick={() => setBannerMessage(null)} className="font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Products
          </span>
          <div className="text-2xl font-black text-slate-900">{products.length}</div>
          <span className="text-[10px] text-blue-600 font-semibold">Configured schemes</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Active for Application
          </span>
          <div className="text-2xl font-black text-emerald-600">
            {products.filter((p) => p.status === 'ACTIVE').length}
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold">Live in borrower portal</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Min ROI Benchmark
          </span>
          <div className="text-2xl font-black text-indigo-900">8.50%</div>
          <span className="text-[10px] text-indigo-700 font-semibold">Housing prime tier</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Max Ticket Size
          </span>
          <div className="text-2xl font-black text-slate-900">₹5.00 Cr</div>
          <span className="text-[10px] text-slate-500 font-semibold">Secured limits</span>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs w-64 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Categories</option>
              <option value="HOUSING">Housing</option>
              <option value="PERSONAL">Personal</option>
              <option value="VEHICLE">Vehicle</option>
              <option value="BUSINESS">Business</option>
              <option value="GOLD">Gold</option>
              <option value="EDUCATION">Education</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        {/* Product Grid / Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Product Code & Scheme</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Ticket Size Range</th>
                <th className="px-4 py-3">Tenure (Mos)</th>
                <th className="px-4 py-3">Benchmark ROI</th>
                <th className="px-4 py-3">Form Builder</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold text-blue-900 block">{p.code}</span>
                    <span className="font-bold text-slate-900 text-xs">{p.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-lg border border-slate-200 text-[10px]">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {formatCurrencyINR(p.minAmount)} – {formatCurrencyINR(p.maxAmount)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-medium">
                    {p.minTenureMonths} – {p.maxTenureMonths} Mos
                  </td>
                  <td className="px-4 py-3 font-black text-indigo-950">
                    {Number(p.baseInterestRate).toFixed(2)}%
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setBuilderProduct(p)}
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 transition-all"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Configure Form</span>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button
                      onClick={() => {
                        setEditingProduct(p);
                        setIsCreateModalOpen(true);
                      }}
                      title="Edit Policy"
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDuplicate(p)}
                      title="Duplicate Product Template"
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleToggleStatus(p)}
                      title={p.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      className={`p-1.5 rounded-lg transition-colors ${
                        p.status === 'ACTIVE'
                          ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                          : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Create / Edit Modal */}
      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        currentUser={currentUser}
        initialProduct={editingProduct}
        onSubmit={handleCreateOrUpdate}
      />

      {/* Visual Multi-Page Form Builder Modal */}
      {builderProduct && (
        <FormBuilderModal
          isOpen={!!builderProduct}
          onClose={() => setBuilderProduct(null)}
          product={builderProduct}
          currentUser={currentUser}
          onPublishSuccess={() => {
            fetchProducts();
            setBuilderProduct(null);
          }}
        />
      )}
    </div>
  );
};
