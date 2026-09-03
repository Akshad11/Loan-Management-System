import React, { useState, useEffect } from 'react';
import { Modal } from '../shared/Modal';
import { FormField } from '../shared/FormField';
import { SelectField } from '../shared/SelectField';
import { Branch, LMSUser, BranchStatus } from '../../types';
import {
  validateRequired,
  validateEmail,
  validateIndianPinCode,
  validateBranchCode,
} from '../../utils/validation';
import { Building, MapPin } from 'lucide-react';

interface BranchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (branchData: any) => void;
  branchToEdit?: Branch | null;
  existingBranches: Branch[];
  users: LMSUser[];
}

export const BranchFormModal: React.FC<BranchFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  branchToEdit,
  existingBranches,
  users,
}) => {
  const isEditMode = !!branchToEdit;

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Goa');
  const [pinCode, setPinCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [managerId, setManagerId] = useState('');
  const [status, setStatus] = useState<BranchStatus>('ACTIVE');
  const [reason, setReason] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (branchToEdit) {
      setCode(branchToEdit.code || '');
      setName(branchToEdit.name || '');
      setAddressLine1(branchToEdit.addressLine1 || '');
      setAddressLine2(branchToEdit.addressLine2 || '');
      setCity(branchToEdit.city || '');
      setState(branchToEdit.state || 'Goa');
      setPinCode(branchToEdit.pinCode || '');
      setPhone(branchToEdit.phone || '');
      setEmail(branchToEdit.email || '');
      setManagerId(branchToEdit.managerId || '');
      setStatus(branchToEdit.status || 'ACTIVE');
      setReason('');
    } else {
      const nextNum = existingBranches.length + 1;
      setCode(`BR-GOA-00${nextNum}`);
      setName('');
      setAddressLine1('');
      setAddressLine2('');
      setCity('Panaji');
      setState('Goa');
      setPinCode('403001');
      setPhone('0832-2400000');
      setEmail('');
      setManagerId('');
      setStatus('ACTIVE');
      setReason('');
    }
    setErrors({});
  }, [branchToEdit, isOpen, existingBranches.length]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const existingCodes = existingBranches.map((b) => b.code);
    const codeRes = validateBranchCode(code, existingCodes, branchToEdit?.code);
    if (!codeRes.isValid) newErrors.code = codeRes.error!;

    const nameRes = validateRequired(name, 'Branch Name');
    if (!nameRes.isValid) newErrors.name = nameRes.error!;

    const addrRes = validateRequired(addressLine1, 'Address Line 1');
    if (!addrRes.isValid) newErrors.addressLine1 = addrRes.error!;

    const cityRes = validateRequired(city, 'City');
    if (!cityRes.isValid) newErrors.city = cityRes.error!;

    const pinRes = validateIndianPinCode(pinCode);
    if (!pinRes.isValid) newErrors.pinCode = pinRes.error!;

    const emailRes = validateEmail(email);
    if (!emailRes.isValid) newErrors.email = emailRes.error!;

    const phoneRes = validateRequired(phone, 'Branch Phone Number');
    if (!phoneRes.isValid) newErrors.phone = phoneRes.error!;

    if (isEditMode && !reason.trim()) {
      newErrors.reason = 'Please state an administrative reason for this branch record update.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSave({
      code,
      name,
      addressLine1,
      addressLine2,
      city,
      state,
      pinCode,
      phone,
      email,
      managerId: managerId || undefined,
      status,
      reason: isEditMode ? reason : undefined,
    });
    onClose();
  };

  const managerOptions = [
    { value: '', label: '-- No Manager Assigned --' },
    ...users
      .filter((u) => u.status === 'ACTIVE')
      .map((u) => ({
        value: u.id,
        label: `${u.name} (${u.roleName} - ${u.employeeId})`,
      })),
  ];

  const stateOptions = [
    { value: 'Goa', label: 'Goa' },
    { value: 'Maharashtra', label: 'Maharashtra' },
    { value: 'Karnataka', label: 'Karnataka' },
    { value: 'Delhi', label: 'Delhi' },
    { value: 'Gujarat', label: 'Gujarat' },
    { value: 'Tamil Nadu', label: 'Tamil Nadu' },
    { value: 'Telangana', label: 'Telangana' },
  ];

  const statusOptions = [
    { value: 'ACTIVE', label: 'ACTIVE - Operational branch' },
    { value: 'INACTIVE', label: 'INACTIVE - Temporarily suspended / closed' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit Branch — ${branchToEdit.name}` : 'Register New Branch Location'}
      subtitle={
        isEditMode
          ? `Modify physical location and management assignments for ${branchToEdit.code}.`
          : 'Create a new lending branch office in the operational network.'
      }
      maxWidth="3xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="save-branch-form-btn"
            onClick={handleSubmit}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 border border-slate-900 rounded hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <Building className="w-3.5 h-3.5" />
            <span>{isEditMode ? 'Save Branch Changes' : 'Register Branch'}</span>
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-left" noValidate>
        {/* Section 1: Branch Identification */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 pb-1 border-b border-slate-200">
            1. Branch Code & Identity
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="branch-code-input"
              label="Branch Code"
              value={code}
              onChange={setCode}
              placeholder="e.g. BR-PNJ-001"
              required
              helperText="Unique branch code format BR-XXX-001."
              error={errors.code}
            />

            <FormField
              id="branch-name-input"
              label="Branch Official Name"
              value={name}
              onChange={setName}
              placeholder="e.g. Panaji Head Office Branch"
              required
              error={errors.name}
            />

            <SelectField
              id="branch-status-select"
              label="Operational Status"
              value={status}
              onChange={(val) => setStatus(val as BranchStatus)}
              options={statusOptions}
              required
            />

            <SelectField
              id="branch-manager-select"
              label="Branch Manager"
              value={managerId}
              onChange={setManagerId}
              options={managerOptions}
              helperText="Staff user designated with branch administrative leadership."
            />
          </div>
        </div>

        {/* Section 2: Physical Address */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 pb-1 border-b border-slate-200">
            2. Physical Premises & Postal Address
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <FormField
                id="branch-address1-input"
                label="Address Line 1 (Building / Street)"
                value={addressLine1}
                onChange={setAddressLine1}
                placeholder="e.g. Ground Floor, EDC Complex, Dr. Atmaram Borkar Road"
                required
                error={errors.addressLine1}
              />
            </div>

            <div className="sm:col-span-2">
              <FormField
                id="branch-address2-input"
                label="Address Line 2 (Area / Landmark)"
                value={addressLine2}
                onChange={setAddressLine2}
                placeholder="e.g. Near Kadamba Bus Stand, Patto Plaza"
              />
            </div>

            <FormField
              id="branch-city-input"
              label="City / Town"
              value={city}
              onChange={setCity}
              placeholder="e.g. Panaji"
              required
              error={errors.city}
            />

            <SelectField
              id="branch-state-select"
              label="State / Union Territory"
              value={state}
              onChange={setState}
              options={stateOptions}
              required
            />

            <FormField
              id="branch-pincode-input"
              label="PIN Code"
              value={pinCode}
              onChange={setPinCode}
              placeholder="e.g. 403001"
              required
              helperText="6-digit Indian postal code."
              error={errors.pinCode}
            />
          </div>
        </div>

        {/* Section 3: Official Contact */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 pb-1 border-b border-slate-200">
            3. Branch Contact Channels
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="branch-phone-input"
              label="Branch Landline / Telephone"
              type="tel"
              value={phone}
              onChange={setPhone}
              placeholder="e.g. 0832-2420101"
              required
              helperText="Official landline with STD code."
              error={errors.phone}
            />

            <FormField
              id="branch-email-input"
              label="Branch Official Desk Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="e.g. panaji.branch@fintechlms.in"
              required
              error={errors.email}
            />
          </div>
        </div>

        {/* Audit Reason if Edit */}
        {isEditMode && (
          <div className="bg-slate-50 border border-slate-200 p-3 rounded">
            <FormField
              id="branch-edit-reason"
              label="Administrative Reason for Modification"
              value={reason}
              onChange={setReason}
              placeholder="e.g. Relocated to new commercial complex / Manager reassignment..."
              required
              helperText="Mandatory reason logged into the immutable audit record."
              error={errors.reason}
            />
          </div>
        )}
      </form>
    </Modal>
  );
};
