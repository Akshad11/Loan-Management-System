'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../services/authContext';
import {
  Shield,
  Building,
  Car,
  Coins,
  Cpu,
  Landmark,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Calendar,
  FileCheck,
  Trash2,
  Edit,
  X,
  FileText,
  User,
  MapPin,
  ExternalLink,
} from 'lucide-react';

interface CollateralTabProps {
  applicationId?: string;
  loanId?: string;
  customerId: string;
  loanAmount: number;
  maxProductLtv?: number;
  readOnly?: boolean;
}

export const CollateralTab: React.FC<CollateralTabProps> = ({
  applicationId,
  loanId,
  customerId,
  loanAmount,
  maxProductLtv = 75,
  readOnly = false,
}) => {
  const { user, hasPermission } = useAuth();
  const [collaterals, setCollaterals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isValuationModalOpen, setIsValuationModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [selectedCollateral, setSelectedCollateral] = useState<any | null>(null);

  // Form states for Add Collateral
  const [newType, setNewType] = useState<string>('PROPERTY');
  const [newSubtype, setNewSubtype] = useState<string>('RESIDENTIAL_FLAT');
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newOwnershipType, setNewOwnershipType] = useState<string>('SOLE');
  const [newOwnerName, setNewOwnerName] = useState<string>('');
  const [newOwnerRelationship, setNewOwnerRelationship] = useState<string>('SELF');
  const [newIdentifier, setNewIdentifier] = useState<string>('');
  const [newRegNo, setNewRegNo] = useState<string>('');
  const [newAddress, setNewAddress] = useState<string>('');
  const [newCity, setNewCity] = useState<string>('');
  const [newState, setNewState] = useState<string>('Maharashtra');
  const [newPinCode, setNewPinCode] = useState<string>('');
  const [newMarketValue, setNewMarketValue] = useState<string>('');
  const [newForcedValue, setNewForcedValue] = useState<string>('');
  const [newValuerName, setNewValuerName] = useState<string>('');
  const [newValuerFirm, setNewValuerFirm] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Valuation Form State
  const [valMarketValue, setValMarketValue] = useState<string>('');
  const [valForcedValue, setValForcedValue] = useState<string>('');
  const [valValuerName, setValValuerName] = useState<string>('');
  const [valValuerFirm, setValValuerFirm] = useState<string>('');
  const [valReportNo, setValReportNo] = useState<string>('');
  const [valNotes, setValNotes] = useState<string>('');

  // Verification Form State
  const [verLegalStatus, setVerLegalStatus] = useState<string>('CLEARED');
  const [verLegalAdvocate, setVerLegalAdvocate] = useState<string>('');
  const [verTechStatus, setVerTechStatus] = useState<string>('APPROVED');
  const [verTechEngineer, setVerTechEngineer] = useState<string>('');

  const canCreate = hasPermission('collateral.create') || hasPermission('manage_system_settings');
  const canValuate = hasPermission('collateral.valuation') || hasPermission('manage_system_settings');
  const canVerify = hasPermission('collateral.verify') || hasPermission('manage_system_settings');
  const canDelete = hasPermission('collateral.delete') || hasPermission('manage_system_settings');

  const fetchCollaterals = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const url = new URL('/api/collateral', window.location.origin);
      if (applicationId) url.searchParams.set('applicationId', applicationId);
      if (loanId) url.searchParams.set('loanId', loanId);
      if (customerId && !applicationId && !loanId) url.searchParams.set('customerId', customerId);

      const res = await fetch(url.toString(), {
        headers: { 'x-user-id': user?.id || '' },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch collaterals');
      }
      const data = await res.json();
      setCollaterals(data.collaterals || []);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [applicationId, loanId, customerId, user?.id]);

  useEffect(() => {
    fetchCollaterals();
  }, [fetchCollaterals]);

  // Overall KPIs
  const totalMarketValuation = collaterals.reduce((sum, c) => sum + Number(c.currentMarketValue || 0), 0);
  const totalForcedSaleValuation = collaterals.reduce((sum, c) => sum + Number(c.forcedSaleValue || 0), 0);
  const overallLtv = totalMarketValuation > 0 ? Number(((loanAmount / totalMarketValuation) * 100).toFixed(2)) : 0;
  const isLtvBreached = overallLtv > maxProductLtv;

  const handleCreateCollateral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newMarketValue) {
      setErrorMsg('Asset title and valid market value are required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/collateral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          applicationId,
          loanId,
          customerId,
          collateralType: newType,
          assetSubtype: newSubtype,
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
          ownershipType: newOwnershipType,
          ownerName: newOwnerName.trim() || user?.name || 'Borrower',
          ownerRelationship: newOwnerRelationship,
          assetIdentifier: newIdentifier.trim() || undefined,
          registrationNumber: newRegNo.trim() || undefined,
          addressLine1: newAddress.trim() || undefined,
          city: newCity.trim() || undefined,
          state: newState,
          pinCode: newPinCode.trim() || undefined,
          currentMarketValue: parseFloat(newMarketValue),
          forcedSaleValue: newForcedValue ? parseFloat(newForcedValue) : undefined,
          valuationAmount: parseFloat(newMarketValue),
          valuerName: newValuerName.trim() || undefined,
          valuerFirm: newValuerFirm.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create collateral');
      }

      setSuccessMsg('Collateral asset successfully pledged and recorded!');
      setIsAddModalOpen(false);
      resetAddForm();
      await fetchCollaterals();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddValuation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollateral || !valMarketValue) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/collateral/${selectedCollateral.id}/valuation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          marketValue: parseFloat(valMarketValue),
          forcedSaleValue: valForcedValue ? parseFloat(valForcedValue) : undefined,
          valuerName: valValuerName.trim() || user?.name || 'Certified Valuer',
          valuerFirm: valValuerFirm.trim() || undefined,
          reportNumber: valReportNo.trim() || undefined,
          notes: valNotes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to record valuation');
      }

      setSuccessMsg('Asset revaluation recorded and LTV re-estimated!');
      setIsValuationModalOpen(false);
      setSelectedCollateral(null);
      await fetchCollaterals();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollateral) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/collateral/${selectedCollateral.id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          legalStatus: verLegalStatus,
          legalAdvocateName: verLegalAdvocate.trim() || undefined,
          technicalStatus: verTechStatus,
          technicalEngineerName: verTechEngineer.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update verification');
      }

      setSuccessMsg('Legal & technical inspection status updated!');
      setIsVerifyModalOpen(false);
      setSelectedCollateral(null);
      await fetchCollaterals();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCollateral = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to remove collateral "${title}"?`)) return;

    try {
      const res = await fetch(`/api/collateral/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user?.id || '' },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to remove collateral');
      }

      setSuccessMsg('Collateral asset successfully released/removed.');
      await fetchCollaterals();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const resetAddForm = () => {
    setNewTitle('');
    setNewDescription('');
    setNewMarketValue('');
    setNewForcedValue('');
    setNewIdentifier('');
    setNewRegNo('');
    setNewAddress('');
    setNewCity('');
    setNewValuerName('');
    setNewValuerFirm('');
  };

  const getCollateralIcon = (type: string) => {
    switch (type) {
      case 'PROPERTY':
        return <Building className="w-5 h-5 text-blue-600" />;
      case 'VEHICLE':
        return <Car className="w-5 h-5 text-indigo-600" />;
      case 'GOLD':
        return <Coins className="w-5 h-5 text-amber-600" />;
      case 'EQUIPMENT':
        return <Cpu className="w-5 h-5 text-purple-600" />;
      case 'FINANCIAL_SECURITY':
        return <Landmark className="w-5 h-5 text-emerald-600" />;
      default:
        return <Shield className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* SUMMARY KPI BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Total Collateral Value</div>
          <div className="text-lg font-bold text-slate-900 font-mono mt-1">
            ₹{totalMarketValuation.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Forced Sale: ₹{totalForcedSaleValuation.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Loan Amount</div>
          <div className="text-lg font-bold text-slate-900 font-mono mt-1">
            ₹{loanAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Total Pledged Assets: {collaterals.length}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Overall Loan-to-Value (LTV)</div>
          <div className={`text-lg font-bold font-mono mt-1 ${isLtvBreached ? 'text-rose-600' : 'text-emerald-600'}`}>
            {overallLtv}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Product Max Cap: <strong>{maxProductLtv}%</strong>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs flex flex-col justify-between">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Security Coverage</div>
          <div className="flex items-center gap-1.5 mt-1">
            {isLtvBreached ? (
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> High Risk (LTV {overallLtv}%)
              </span>
            ) : totalMarketValuation > 0 ? (
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Adequately Secured
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                Unsecured / No Assets
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {totalMarketValuation > 0 ? `${Math.round((totalMarketValuation / (loanAmount || 1)) * 100)}% Cover` : 'Zero Coverage'}
          </div>
        </div>
      </div>

      {/* ACTION BAR & ALERTS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900">Pledged Collateral Assets</h3>
          <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 border border-slate-200 text-slate-600 font-mono">
            {collaterals.length}
          </span>
        </div>

        {!readOnly && canCreate && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Collateral Asset</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* COLLATERAL CARDS LIST */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span>Loading collateral records...</span>
        </div>
      ) : collaterals.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center space-y-4 bg-slate-50/50">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">No Collateral Pledged</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              This application has no pledged physical or financial security assets recorded. Click below to add properties, vehicles, equipment, gold, or deposits.
            </p>
          </div>
          {!readOnly && canCreate && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Collateral Asset</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {collaterals.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3.5 transition-all hover:border-slate-300"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg shrink-0">
                    {getCollateralIcon(c.collateralType)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                        {c.collateralType}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {c.collateralNumber}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-0.5">{c.title}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{c.assetSubtype}</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-slate-400 uppercase">Current Value</div>
                  <div className="text-base font-bold text-slate-900 font-mono">
                    ₹{Number(c.currentMarketValue).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Asset Details Grid */}
              <div className="bg-slate-50/70 border border-slate-100 rounded-lg p-2.5 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Owner / Relationship</span>
                  <span className="font-semibold text-slate-800">{c.ownerName}</span>
                  <span className="text-[10px] text-slate-400 ml-1">({c.ownershipType})</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Identifier / Reg</span>
                  <span className="font-mono font-medium text-slate-800 truncate block">
                    {c.assetIdentifier || c.registrationNumber || 'N/A'}
                  </span>
                </div>
                {c.addressLine1 && (
                  <div className="col-span-2 flex items-center gap-1.5 text-[11px] text-slate-600">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{c.addressLine1}, {c.city || ''} {c.state || ''}</span>
                  </div>
                )}
              </div>

              {/* Verification & Valuation Pills */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.legalVerificationStatus === 'CLEARED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    Legal: {c.legalVerificationStatus}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.technicalStatus === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    Tech: {c.technicalStatus}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 font-mono">
                  Valuer: {c.valuerName || 'Self / Inception'}
                </div>
              </div>

              {/* Actions Footer */}
              {!readOnly && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  {canValuate && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCollateral(c);
                        setValMarketValue(c.currentMarketValue?.toString() || '');
                        setValForcedValue(c.forcedSaleValue?.toString() || '');
                        setValValuerName(c.valuerName || '');
                        setValValuerFirm(c.valuerFirm || '');
                        setIsValuationModalOpen(true);
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded hover:bg-slate-50 transition-colors"
                    >
                      Revalue
                    </button>
                  )}

                  {canVerify && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCollateral(c);
                        setVerLegalStatus(c.legalVerificationStatus || 'CLEARED');
                        setVerLegalAdvocate(c.legalAdvocateName || '');
                        setVerTechStatus(c.technicalStatus || 'APPROVED');
                        setVerTechEngineer(c.technicalEngineerName || '');
                        setIsVerifyModalOpen(true);
                      }}
                      className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded hover:bg-blue-100 transition-colors"
                    >
                      Verify
                    </button>
                  )}

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCollateral(c.id, c.title)}
                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                      title="Delete / Release Collateral"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL: ADD COLLATERAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Pledge New Collateral Asset</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCollateral} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Asset Category *</label>
                  <select
                    value={newType}
                    onChange={(e) => {
                      setNewType(e.target.value);
                      if (e.target.value === 'PROPERTY') setNewSubtype('RESIDENTIAL_FLAT');
                      else if (e.target.value === 'VEHICLE') setNewSubtype('COMMERCIAL_VEHICLE');
                      else if (e.target.value === 'GOLD') setNewSubtype('GOLD_ORNAMENTS');
                      else if (e.target.value === 'EQUIPMENT') setNewSubtype('INDUSTRIAL_MACHINERY');
                      else setNewSubtype('FIXED_DEPOSIT');
                    }}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
                  >
                    <option value="PROPERTY">Real Estate Property</option>
                    <option value="VEHICLE">Automobile / Commercial Vehicle</option>
                    <option value="GOLD">Gold / Precious Metals</option>
                    <option value="EQUIPMENT">Plant & Industrial Equipment</option>
                    <option value="FINANCIAL_SECURITY">Financial Security / Term Deposit</option>
                    <option value="OTHER">Other Secured Asset</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Asset Subtype</label>
                  <input
                    type="text"
                    value={newSubtype}
                    onChange={(e) => setNewSubtype(e.target.value)}
                    placeholder="e.g. 2BHK Flat, Sedan, FD"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Asset Title / Identifier Name *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Flat 402, Sai Residency / Tata Nexon EV"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Owner Name *</label>
                  <input
                    type="text"
                    required
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    placeholder="Name of asset owner"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ownership Type</label>
                  <select
                    value={newOwnershipType}
                    onChange={(e) => setNewOwnershipType(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
                  >
                    <option value="SOLE">Sole Proprietorship / Individual</option>
                    <option value="JOINT">Joint Ownership</option>
                    <option value="THIRD_PARTY">Third Party / Guarantor</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Survey No / Chassis / Reg No</label>
                  <input
                    type="text"
                    value={newIdentifier}
                    onChange={(e) => setNewIdentifier(e.target.value)}
                    placeholder="Unique asset identifier"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Current Market Value (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={newMarketValue}
                    onChange={(e) => setNewMarketValue(e.target.value)}
                    placeholder="₹ Market Valuation"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900 font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Forced Sale Value (₹)</label>
                  <input
                    type="number"
                    value={newForcedValue}
                    onChange={(e) => setNewForcedValue(e.target.value)}
                    placeholder="Distress liquidation value"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valuer / Surveyor Name</label>
                  <input
                    type="text"
                    value={newValuerName}
                    onChange={(e) => setNewValuerName(e.target.value)}
                    placeholder="e.g. ABC Valuers Pvt Ltd"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Property Location / Address</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Plot/Flat, Building, Street, Area"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="City"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={newPinCode}
                    onChange={(e) => setNewPinCode(e.target.value)}
                    placeholder="400001"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving Collateral...' : 'Pledge Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REVALUATION */}
      {isValuationModalOpen && selectedCollateral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Revalue Asset: {selectedCollateral.collateralNumber}
              </h3>
              <button
                type="button"
                onClick={() => setIsValuationModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddValuation} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Market Value (₹) *</label>
                <input
                  type="number"
                  required
                  value={valMarketValue}
                  onChange={(e) => setValMarketValue(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Forced Sale Value (₹)</label>
                <input
                  type="number"
                  value={valForcedValue}
                  onChange={(e) => setValForcedValue(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Valuer / Firm *</label>
                <input
                  type="text"
                  required
                  value={valValuerName}
                  onChange={(e) => setValValuerName(e.target.value)}
                  placeholder="Certified Valuer Name"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Report / Valuation Reference No</label>
                <input
                  type="text"
                  value={valReportNo}
                  onChange={(e) => setValReportNo(e.target.value)}
                  placeholder="e.g. VAL-2026-981"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900 font-mono"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsValuationModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Save Revaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VERIFICATION */}
      {isVerifyModalOpen && selectedCollateral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                Legal & Technical Clearance: {selectedCollateral.collateralNumber}
              </h3>
              <button
                type="button"
                onClick={() => setIsVerifyModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateVerification} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Legal Title Clearance</label>
                <select
                  value={verLegalStatus}
                  onChange={(e) => setVerLegalStatus(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
                >
                  <option value="CLEARED">CLEARED — Clean Title Report</option>
                  <option value="PENDING">PENDING — Search In Progress</option>
                  <option value="ISSUES_IDENTIFIED">ISSUES IDENTIFIED — Encumbrance Found</option>
                  <option value="WAIVED">WAIVED — Legal Search Waived</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Empanelled Legal Advocate</label>
                <input
                  type="text"
                  value={verLegalAdvocate}
                  onChange={(e) => setVerLegalAdvocate(e.target.value)}
                  placeholder="Advocate name"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Technical Inspection Status</label>
                <select
                  value={verTechStatus}
                  onChange={(e) => setVerTechStatus(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
                >
                  <option value="APPROVED">APPROVED — Physical Site Verified</option>
                  <option value="PENDING">PENDING — Visit Scheduled</option>
                  <option value="REJECTED">REJECTED — Boundary / Deviation Issues</option>
                  <option value="WAIVED">WAIVED — Inspection Exempt</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Inspecting Engineer</label>
                <input
                  type="text"
                  value={verTechEngineer}
                  onChange={(e) => setVerTechEngineer(e.target.value)}
                  placeholder="Civil Engineer name"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900"
                />
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsVerifyModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Save Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
