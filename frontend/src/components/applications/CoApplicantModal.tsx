import React, { useState, useMemo } from 'react';
import { UserPlus, Search, AlertCircle, ShieldCheck } from 'lucide-react';
import { Modal } from '../shared/Modal';
import { CustomerRecord } from '../../types';
import { CoApplicantRelationship } from '../../types/applicationTypes';
import { formatCurrencyINR } from '../../utils/formatters';

interface CoApplicantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCoApplicant: (payload: {
    customerId: string;
    relationship: CoApplicantRelationship;
    notes?: string;
  }) => void;
  customers: CustomerRecord[];
  primaryApplicantId: string;
  existingCoApplicantIds: string[];
  existingGuarantorIds: string[];
}

export const CoApplicantModal: React.FC<CoApplicantModalProps> = ({
  isOpen,
  onClose,
  onAddCoApplicant,
  customers,
  primaryApplicantId,
  existingCoApplicantIds,
  existingGuarantorIds,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [relationship, setRelationship] = useState<CoApplicantRelationship>('SPOUSE');
  const [notes, setNotes] = useState('');

  // Eligible customers (exclude primary applicant, already linked co-applicants, and guarantors)
  const eligibleCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (c.status === 'ARCHIVED') return false;
      if (c.id === primaryApplicantId) return false;
      if (existingCoApplicantIds.includes(c.id)) return false;
      if (existingGuarantorIds.includes(c.id)) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (c.name || '').toLowerCase().includes(q) ||
        (c.customerNumber || '').toLowerCase().includes(q) ||
        (c.mobile || '').includes(q) ||
        (c.panMasked || '').toLowerCase().includes(q)
      );
    });
  }, [customers, primaryApplicantId, existingCoApplicantIds, existingGuarantorIds, searchQuery]);

  // Set default selection when list changes
  React.useEffect(() => {
    if (eligibleCustomers.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(eligibleCustomers[0].id);
    }
  }, [eligibleCustomers, selectedCustomerId]);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;

    onAddCoApplicant({
      customerId: selectedCustomerId,
      relationship,
      notes,
    });
    setNotes('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Link Co-Applicant to Loan"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Search Customer Directory
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, ID, mobile, or PAN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-slate-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Select Customer Record <span className="text-rose-500">*</span>
          </label>
          {eligibleCustomers.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
              No eligible customers found to link as co-applicant.
            </div>
          ) : (
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white font-medium"
            >
              {eligibleCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.customerNumber}) — {c.employmentType} — Income: {formatCurrencyINR(c.monthlyIncome)}/mo
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedCustomer && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-500 block">Mobile:</span>
              <span className="font-mono text-slate-900">{selectedCustomer.mobile}</span>
            </div>
            <div>
              <span className="text-slate-500 block">PAN Card:</span>
              <span className="font-mono text-slate-900">{selectedCustomer.panMasked}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Monthly Income:</span>
              <span className="font-bold text-slate-900">{formatCurrencyINR(selectedCustomer.monthlyIncome)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Active Exposure:</span>
              <span className="font-bold text-slate-900">{formatCurrencyINR(selectedCustomer.totalOutstanding)}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Relationship to Primary Applicant <span className="text-rose-500">*</span>
            </label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value as CoApplicantRelationship)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
            >
              <option value="SPOUSE">Spouse</option>
              <option value="PARENT">Parent (Father / Mother)</option>
              <option value="SIBLING">Sibling (Brother / Sister)</option>
              <option value="CHILD">Child (Son / Daughter)</option>
              <option value="BUSINESS_PARTNER">Business Partner / Director</option>
              <option value="OTHER">Other Co-borrower</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Underwriting Justification Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Income clubbing for debt service ratio..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
            />
          </div>
        </div>

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
            disabled={!selectedCustomerId || eligibleCustomers.length === 0}
            className="px-5 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-md"
          >
            Link Co-Applicant
          </button>
        </div>
      </form>
    </Modal>
  );
};
