'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Search, Building2, ShieldCheck, AlertCircle, UserCheck, PlusCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from '../shared/Modal';
import { formatCurrencyINR } from '../../utils/formatters';

interface CoApplicantModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  primaryApplicantId: string;
  onCoApplicantAdded: () => void;
}

export const CoApplicantModal: React.FC<CoApplicantModalProps> = ({
  isOpen,
  onClose,
  applicationId,
  primaryApplicantId,
  onCoApplicantAdded,
}) => {
  const [activeTab, setActiveTab] = useState<'EXISTING' | 'NEW'>('EXISTING');

  // Existing Customer Tab State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);

  // New Customer Tab State
  const [newName, setNewName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPan, setNewPan] = useState('');
  const [newDob, setNewDob] = useState('');
  const [newGender, setNewGender] = useState('MALE');
  const [newEmploymentType, setNewEmploymentType] = useState('SALARIED');
  const [newEmployerName, setNewEmployerName] = useState('');
  const [newIncome, setNewIncome] = useState('');
  const [newObligations, setNewObligations] = useState('');

  // Common fields
  const [relationship, setRelationship] = useState('SPOUSE');
  const [ownershipShare, setOwnershipShare] = useState('50');
  const [notes, setNotes] = useState('');
  const [consentObtained, setConsentObtained] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search existing customers
  useEffect(() => {
    if (activeTab !== 'EXISTING') return;
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/customers/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          // Exclude primary applicant
          const filtered = (data.customers || []).filter((c: any) => c.id !== primaryApplicantId);
          setSearchResults(filtered);
        }
      } catch (err) {
        console.error('Customer search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, primaryApplicantId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (activeTab === 'EXISTING' && !selectedCustomer) {
      setErrorMsg('Please select an existing customer from the directory search.');
      return;
    }

    if (activeTab === 'NEW') {
      if (!newName.trim() || !newMobile.trim()) {
        setErrorMsg('Full name and mobile number are required.');
        return;
      }
      if (newPan && newPan.trim().length !== 10) {
        setErrorMsg('PAN must be exactly 10 characters.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        relationship,
        ownershipShare: ownershipShare ? parseFloat(ownershipShare) : undefined,
        notes: notes.trim() || undefined,
      };

      if (activeTab === 'EXISTING') {
        payload.existingCustomerId = selectedCustomer.id;
      } else {
        payload.customerData = {
          name: newName.trim(),
          mobile: newMobile.trim(),
          email: newEmail.trim() || undefined,
          pan: newPan.trim().toUpperCase() || undefined,
          dob: newDob || undefined,
          gender: newGender,
          employmentType: newEmploymentType,
          employerName: newEmployerName.trim() || undefined,
          monthlyIncome: newIncome ? parseFloat(newIncome) : 0,
          existingObligations: newObligations ? parseFloat(newObligations) : 0,
        };
      }

      const res = await fetch(`/api/applications/${applicationId}/co-applicants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add co-applicant');
      }

      onCoApplicantAdded();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Co-Applicant / Co-Borrower" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* TAB SELECTOR */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab('EXISTING');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-md font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'EXISTING'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Link Existing Customer</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('NEW');
              setErrorMsg(null);
            }}
            className={`flex-1 py-1.5 rounded-md font-semibold text-xs flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'NEW'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create New Customer Profile</span>
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: EXISTING CUSTOMER */}
        {activeTab === 'EXISTING' && (
          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">
                Search Customer (Mobile / PAN / ID / Name)
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type 2+ letters (e.g. Sharma, 9820, PAN)..."
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded text-slate-900"
                />
              </div>
            </div>

            {/* Results dropdown/list */}
            {isSearching ? (
              <div className="p-3 text-center text-slate-400">Searching directory...</div>
            ) : searchResults.length > 0 ? (
              <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto divide-y divide-slate-100 bg-white">
                {searchResults.map((cust) => {
                  const isSelected = selectedCustomer?.id === cust.id;
                  return (
                    <button
                      key={cust.id}
                      type="button"
                      onClick={() => setSelectedCustomer(cust)}
                      className={`w-full text-left p-2.5 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-blue-50/80 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{cust.name}</span>
                          <span className="font-mono text-[10px] text-slate-400">({cust.customerNumber})</span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          Mobile: {cust.mobile} • PAN: {cust.panMasked || 'N/A'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-800">
                          {formatCurrencyINR(cust.monthlyIncome)}/mo
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                          KYC {cust.kycStatus}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : searchQuery.length >= 2 ? (
              <div className="p-3 text-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                No existing customer matched &quot;{searchQuery}&quot;. Switch to &quot;Create New Customer Profile&quot; to onboard.
              </div>
            ) : null}

            {selectedCustomer && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3 text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Selected: {selectedCustomer.name} ({selectedCustomer.customerNumber})
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    Mobile: {selectedCustomer.mobile} • Monthly Income: {formatCurrencyINR(selectedCustomer.monthlyIncome)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Change
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: NEW CUSTOMER PROFILE */}
        {activeTab === 'NEW' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="As per PAN card"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={newMobile}
                  onChange={(e) => setNewMobile(e.target.value)}
                  placeholder="10-digit mobile"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">PAN Card Number</label>
                <input
                  type="text"
                  maxLength={10}
                  value={newPan}
                  onChange={(e) => setNewPan(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900 font-mono uppercase"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="coapplicant@example.com"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Employment Type</label>
                <select
                  value={newEmploymentType}
                  onChange={(e) => setNewEmploymentType(e.target.value)}
                  className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
                >
                  <option value="SALARIED">Salaried</option>
                  <option value="SELF_EMPLOYED_PROFESSIONAL">Self-Employed (SEP)</option>
                  <option value="SELF_EMPLOYED_NON_PROFESSIONAL">Self-Employed (SENP)</option>
                  <option value="HOMEMAKER">Homemaker</option>
                  <option value="RETIRED">Retired</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Monthly Income (₹)</label>
                <input
                  type="number"
                  value={newIncome}
                  onChange={(e) => setNewIncome(e.target.value)}
                  placeholder="₹ 50,000"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-900 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Existing EMI (₹)</label>
                <input
                  type="number"
                  value={newObligations}
                  onChange={(e) => setNewObligations(e.target.value)}
                  placeholder="₹ 10,000"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-900 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* SHARED FIELDS */}
        <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Relationship to Primary *</label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
            >
              <option value="SPOUSE">Spouse</option>
              <option value="PARENT">Parent (Father / Mother)</option>
              <option value="CHILD">Child (Son / Daughter)</option>
              <option value="SIBLING">Sibling (Brother / Sister)</option>
              <option value="BUSINESS_PARTNER">Business Partner / Director</option>
              <option value="CO_BORROWER">Co-Borrower / Other</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Ownership / Property Share (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={ownershipShare}
              onChange={(e) => setOwnershipShare(e.target.value)}
              placeholder="e.g. 50"
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Underwriting Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Income combined for debt service ratio eligibility..."
            className="w-full px-3 py-1.5 border border-slate-300 rounded text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="coapp-consent"
            checked={consentObtained}
            onChange={(e) => setConsentObtained(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="coapp-consent" className="text-slate-600">
            Co-applicant consent obtained for credit evaluation and bureau inquiry.
          </label>
        </div>

        {/* SUBMIT BUTTONS */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-slate-300 rounded-md font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || (activeTab === 'EXISTING' && !selectedCustomer)}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold disabled:opacity-50"
          >
            {isSubmitting ? 'Linking...' : 'Add Co-Applicant'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
