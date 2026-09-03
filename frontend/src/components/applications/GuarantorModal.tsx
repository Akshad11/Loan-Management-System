import React, { useState, useMemo } from 'react';
import { ShieldPlus, Search } from 'lucide-react';
import { Modal } from '../shared/Modal';
import { CustomerRecord } from '../../types';
import { GuarantorRelationship } from '../../types/applicationTypes';
import { formatCurrencyINR } from '../../utils/formatters';

interface GuarantorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGuarantor: (payload: {
    customerId: string;
    relationship: GuarantorRelationship;
    guaranteeType: 'INDIVIDUAL' | 'BUSINESS';
    netWorthEstimated?: number;
    notes?: string;
  }) => void;
  customers: CustomerRecord[];
  primaryApplicantId: string;
  existingCoApplicantIds: string[];
  existingGuarantorIds: string[];
}

export const GuarantorModal: React.FC<GuarantorModalProps> = ({
  isOpen,
  onClose,
  onAddGuarantor,
  customers,
  primaryApplicantId,
  existingCoApplicantIds,
  existingGuarantorIds,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [relationship, setRelationship] = useState<GuarantorRelationship>('RELATIVE');
  const [guaranteeType, setGuaranteeType] = useState<'INDIVIDUAL' | 'BUSINESS'>('INDIVIDUAL');
  const [netWorthEstimated, setNetWorthEstimated] = useState<number>(2500000);
  const [notes, setNotes] = useState('');

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

    onAddGuarantor({
      customerId: selectedCustomerId,
      relationship,
      guaranteeType,
      netWorthEstimated,
      notes,
    });
    setNotes('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Link Guarantor to Loan Application"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Search Customer Records
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
            Select Guarantor Entity <span className="text-rose-500">*</span>
          </label>
          {eligibleCustomers.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
              No eligible customers found to link as guarantor.
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
              <span className="text-slate-500 block">PAN:</span>
              <span className="font-mono text-slate-900">{selectedCustomer.panMasked}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Monthly Income:</span>
              <span className="font-bold text-slate-900">{formatCurrencyINR(selectedCustomer.monthlyIncome)}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Outstanding:</span>
              <span className="font-bold text-slate-900">{formatCurrencyINR(selectedCustomer.totalOutstanding)}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Guarantee Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={guaranteeType}
              onChange={(e) => setGuaranteeType(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white font-medium"
            >
              <option value="INDIVIDUAL">Individual / Personal</option>
              <option value="BUSINESS">Corporate / Business</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Relationship <span className="text-rose-500">*</span>
            </label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value as GuarantorRelationship)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
            >
              <option value="FAMILY_MEMBER">Family Member</option>
              <option value="PARENT">Parent</option>
              <option value="SIBLING">Sibling</option>
              <option value="BUSINESS_PARTNER">Business Associate</option>
              <option value="DIRECTOR">Director / Shareholder</option>
              <option value="THIRD_PARTY">Third Party Independent</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Estimated Net Worth (₹)
            </label>
            <input
              type="number"
              step="500000"
              value={netWorthEstimated}
              onChange={(e) => setNetWorthEstimated(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md font-semibold"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Guarantee Terms & Underwriting Remarks
          </label>
          <input
            type="text"
            placeholder="e.g. Unconditional personal guarantee covering principal and interest..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
          />
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
            Link Guarantor
          </button>
        </div>
      </form>
    </Modal>
  );
};
