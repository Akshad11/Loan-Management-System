import React, { useState } from 'react';
import {
  CustomerRecord,
  CustomerType,
  Gender,
  MaritalStatus,
  EmploymentType,
  Branch,
  AddressInfo,
} from '../../types';
import {
  validateRequired,
  validateIndianMobile,
  validateDOB,
  validateOptionalEmail,
  validateIndianPinCode,
  validateIFSC,
  validateIncome,
} from '../../utils/validation';
import {
  User,
  Phone,
  MapPin,
  Briefcase,
  Building2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface CustomerFormProps {
  initialData?: Partial<CustomerRecord>;
  branches: Branch[];
  onSubmit: (formData: any) => void;
  onCancel: () => void;
  isEditing?: boolean;
  onCheckDuplicate?: (data: {
    mobile?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
  }) => CustomerRecord[];
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  initialData,
  branches,
  onSubmit,
  onCancel,
  isEditing = false,
  onCheckDuplicate,
}) => {
  // Form State
  const [firstName, setFirstName] = useState(initialData?.firstName || '');
  const [middleName, setMiddleName] = useState(initialData?.middleName || '');
  const [lastName, setLastName] = useState(initialData?.lastName || '');
  const [dateOfBirth, setDateOfBirth] = useState(initialData?.dateOfBirth || '');
  const [gender, setGender] = useState<Gender>(initialData?.gender || 'MALE');
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus>(initialData?.maritalStatus || 'SINGLE');
  const [nationality, setNationality] = useState(initialData?.nationality || 'Indian');
  const [customerType, setCustomerType] = useState<CustomerType>(initialData?.customerType || 'INDIVIDUAL');

  const [mobile, setMobile] = useState(initialData?.mobile ? initialData.mobile.replace('+91 ', '') : '');
  const [alternateMobile, setAlternateMobile] = useState(
    initialData?.alternateMobile ? initialData.alternateMobile.replace('+91 ', '') : ''
  );
  const [email, setEmail] = useState(initialData?.email || '');
  const [preferredContact, setPreferredContact] = useState<'MOBILE' | 'EMAIL'>(
    initialData?.preferredContact || 'MOBILE'
  );

  const [currentAddress, setCurrentAddress] = useState<AddressInfo>({
    addressLine1: initialData?.currentAddress?.addressLine1 || '',
    addressLine2: initialData?.currentAddress?.addressLine2 || '',
    city: initialData?.currentAddress?.city || '',
    state: initialData?.currentAddress?.state || 'Goa',
    pinCode: initialData?.currentAddress?.pinCode || '',
  });

  const [sameAsCurrent, setSameAsCurrent] = useState<boolean>(
    initialData?.sameAsCurrentAddress !== undefined ? initialData.sameAsCurrentAddress : true
  );

  const [permanentAddress, setPermanentAddress] = useState<AddressInfo>({
    addressLine1: initialData?.permanentAddress?.addressLine1 || '',
    addressLine2: initialData?.permanentAddress?.addressLine2 || '',
    city: initialData?.permanentAddress?.city || '',
    state: initialData?.permanentAddress?.state || 'Goa',
    pinCode: initialData?.permanentAddress?.pinCode || '',
  });

  const [employmentType, setEmploymentType] = useState<EmploymentType>(
    initialData?.employmentType || 'SALARIED'
  );
  const [employerName, setEmployerName] = useState(initialData?.employerName || '');
  const [occupation, setOccupation] = useState(initialData?.occupation || '');
  const [monthlyIncome, setMonthlyIncome] = useState<string>(
    initialData?.monthlyIncome !== undefined ? String(initialData.monthlyIncome) : ''
  );
  const [employmentSince, setEmploymentSince] = useState(initialData?.employmentSince || '');

  const [bankName, setBankName] = useState(initialData?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(initialData?.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(initialData?.ifscCode || '');
  const [branchId, setBranchId] = useState(
    initialData?.branchId || (branches.length > 0 ? branches[0].id : 'br_panjim')
  );

  // Errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSameAsCurrentChange = (checked: boolean) => {
    setSameAsCurrent(checked);
    if (checked) {
      setPermanentAddress({ ...currentAddress });
    }
  };

  const handleCurrentAddressChange = (field: keyof AddressInfo, val: string) => {
    const updated = { ...currentAddress, [field]: val };
    setCurrentAddress(updated);
    if (sameAsCurrent) {
      setPermanentAddress({ ...updated });
    }
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. Personal
    const fnCheck = validateRequired(firstName, 'First name');
    if (!fnCheck.isValid) newErrors.firstName = fnCheck.error!;

    const lnCheck = validateRequired(lastName, 'Last name');
    if (!lnCheck.isValid) newErrors.lastName = lnCheck.error!;

    const dobCheck = validateDOB(dateOfBirth);
    if (!dobCheck.isValid) newErrors.dateOfBirth = dobCheck.error!;

    const natCheck = validateRequired(nationality, 'Nationality');
    if (!natCheck.isValid) newErrors.nationality = natCheck.error!;

    // 2. Contact
    const mobCheck = validateIndianMobile(mobile);
    if (!mobCheck.isValid) newErrors.mobile = mobCheck.error!;

    if (alternateMobile.trim()) {
      const altMobCheck = validateIndianMobile(alternateMobile);
      if (!altMobCheck.isValid) newErrors.alternateMobile = altMobCheck.error!;
    }

    const emailCheck = validateOptionalEmail(email);
    if (!emailCheck.isValid) newErrors.email = emailCheck.error!;

    // 3. Address
    const curA1Check = validateRequired(currentAddress.addressLine1, 'Current address line 1');
    if (!curA1Check.isValid) newErrors.currentAddressLine1 = curA1Check.error!;

    const curCityCheck = validateRequired(currentAddress.city, 'City');
    if (!curCityCheck.isValid) newErrors.currentCity = curCityCheck.error!;

    const curStateCheck = validateRequired(currentAddress.state, 'State');
    if (!curStateCheck.isValid) newErrors.currentState = curStateCheck.error!;

    const curPinCheck = validateIndianPinCode(currentAddress.pinCode);
    if (!curPinCheck.isValid) newErrors.currentPinCode = curPinCheck.error!;

    if (!sameAsCurrent) {
      const permA1Check = validateRequired(permanentAddress.addressLine1, 'Permanent address line 1');
      if (!permA1Check.isValid) newErrors.permanentAddressLine1 = permA1Check.error!;

      const permCityCheck = validateRequired(permanentAddress.city, 'Permanent city');
      if (!permCityCheck.isValid) newErrors.permanentCity = permCityCheck.error!;

      const permStateCheck = validateRequired(permanentAddress.state, 'Permanent state');
      if (!permStateCheck.isValid) newErrors.permanentState = permStateCheck.error!;

      const permPinCheck = validateIndianPinCode(permanentAddress.pinCode);
      if (!permPinCheck.isValid) newErrors.permanentPinCode = permPinCheck.error!;
    }

    // 4. Income
    if (monthlyIncome.trim()) {
      const incCheck = validateIncome(monthlyIncome);
      if (!incCheck.isValid) newErrors.monthlyIncome = incCheck.error!;
    }

    // 5. Bank
    if (ifscCode.trim()) {
      const ifscCheck = validateIFSC(ifscCode);
      if (!ifscCheck.isValid) newErrors.ifscCode = ifscCheck.error!;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) {
      return;
    }

    const payload = {
      firstName: firstName.trim(),
      middleName: middleName.trim() || undefined,
      lastName: lastName.trim(),
      dateOfBirth,
      gender,
      maritalStatus,
      nationality: nationality.trim(),
      customerType,
      mobile: `+91 ${mobile.replace(/[^0-9]/g, '')}`,
      alternateMobile: alternateMobile.trim() ? `+91 ${alternateMobile.replace(/[^0-9]/g, '')}` : undefined,
      email: email.trim() || undefined,
      preferredContact,
      currentAddress,
      permanentAddress: sameAsCurrent ? currentAddress : permanentAddress,
      sameAsCurrentAddress: sameAsCurrent,
      employmentType,
      employerName: employerName.trim() || undefined,
      occupation: occupation.trim() || undefined,
      monthlyIncome: parseFloat(monthlyIncome.replace(/[^0-9.]/g, '')) || 0,
      employmentSince: employmentSince || undefined,
      bankName: bankName.trim() || undefined,
      accountNumber: accountNumber.trim() || undefined,
      ifscCode: ifscCode.trim().toUpperCase() || undefined,
      branchId,
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Branch & Profile Header */}
      <div className="bg-slate-50 border border-slate-200 rounded p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-200 text-slate-800 rounded">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-slate-900">Branch Jurisdiction</div>
            <div className="text-[11px] text-slate-500">
              Assign the customer relationship to an operational branch.
            </div>
          </div>
        </div>

        <div className="w-full sm:w-64">
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-800"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SECTION 1: Personal Information */}
      <div className="bg-white border border-slate-200 rounded p-4 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <User className="w-4 h-4 text-slate-700" />
          <h3 className="font-semibold text-xs text-slate-900 tracking-wide uppercase">
            Section 1 — Personal Information
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              First Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                if (errors.firstName) setErrors({ ...errors, firstName: '' });
              }}
              placeholder="Enter first name"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
            {errors.firstName && <p className="text-[11px] text-rose-600 mt-1">{errors.firstName}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Middle Name</label>
            <input
              type="text"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              placeholder="Enter middle name"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Last Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                if (errors.lastName) setErrors({ ...errors, lastName: '' });
              }}
              placeholder="Enter last name"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
            {errors.lastName && <p className="text-[11px] text-rose-600 mt-1">{errors.lastName}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Date of Birth <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => {
                setDateOfBirth(e.target.value);
                if (errors.dateOfBirth) setErrors({ ...errors, dateOfBirth: '' });
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
            {errors.dateOfBirth && <p className="text-[11px] text-rose-600 mt-1">{errors.dateOfBirth}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Gender <span className="text-rose-500">*</span>
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Marital Status</label>
            <select
              value={maritalStatus}
              onChange={(e) => setMaritalStatus(e.target.value as MaritalStatus)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
            >
              <option value="SINGLE">Single</option>
              <option value="MARRIED">Married</option>
              <option value="DIVORCED">Divorced</option>
              <option value="WIDOWED">Widowed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nationality <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              placeholder="Indian"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: Contact Information */}
      <div className="bg-white border border-slate-200 rounded p-4 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Phone className="w-4 h-4 text-slate-700" />
          <h3 className="font-semibold text-xs text-slate-900 tracking-wide uppercase">
            Section 2 — Contact Information
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Primary Mobile Number <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-mono text-xs text-slate-500 pointer-events-none">
                +91
              </span>
              <input
                type="text"
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  if (errors.mobile) setErrors({ ...errors, mobile: '' });
                }}
                maxLength={10}
                placeholder="98765 43210"
                className="w-full pl-12 pr-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
            </div>
            {errors.mobile && <p className="text-[11px] text-rose-600 mt-1">{errors.mobile}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Alternate Mobile Number</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-mono text-xs text-slate-500 pointer-events-none">
                +91
              </span>
              <input
                type="text"
                value={alternateMobile}
                onChange={(e) => setAlternateMobile(e.target.value)}
                maxLength={10}
                placeholder="Optional 10-digit number"
                className="w-full pl-12 pr-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
            </div>
            {errors.alternateMobile && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.alternateMobile}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              placeholder="e.g. name@domain.com"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
            {errors.email && <p className="text-[11px] text-rose-600 mt-1">{errors.email}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Preferred Communication Channel</label>
          <div className="flex items-center gap-4 text-xs text-slate-800">
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="prefContact"
                value="MOBILE"
                checked={preferredContact === 'MOBILE'}
                onChange={() => setPreferredContact('MOBILE')}
                className="text-slate-900 focus:ring-slate-800"
              />
              <span>Mobile SMS & Calls</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="prefContact"
                value="EMAIL"
                checked={preferredContact === 'EMAIL'}
                onChange={() => setPreferredContact('EMAIL')}
                className="text-slate-900 focus:ring-slate-800"
              />
              <span>Official Email</span>
            </label>
          </div>
        </div>
      </div>

      {/* SECTION 3: Residential Address */}
      <div className="bg-white border border-slate-200 rounded p-4 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <MapPin className="w-4 h-4 text-slate-700" />
          <h3 className="font-semibold text-xs text-slate-900 tracking-wide uppercase">
            Section 3 — Residential Address
          </h3>
        </div>

        {/* Current Address */}
        <div className="space-y-3">
          <div className="font-semibold text-xs text-slate-800">Current Address</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Address Line 1 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={currentAddress.addressLine1}
                onChange={(e) => handleCurrentAddressChange('addressLine1', e.target.value)}
                placeholder="House/Flat No, Building, Street"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
              {errors.currentAddressLine1 && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.currentAddressLine1}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Address Line 2 (Optional)</label>
              <input
                type="text"
                value={currentAddress.addressLine2}
                onChange={(e) => handleCurrentAddressChange('addressLine2', e.target.value)}
                placeholder="Landmark, Area, Sector"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                City <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={currentAddress.city}
                onChange={(e) => handleCurrentAddressChange('city', e.target.value)}
                placeholder="e.g. Panaji"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
              {errors.currentCity && <p className="text-[11px] text-rose-600 mt-1">{errors.currentCity}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                State <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={currentAddress.state}
                onChange={(e) => handleCurrentAddressChange('state', e.target.value)}
                placeholder="e.g. Goa"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
              {errors.currentState && <p className="text-[11px] text-rose-600 mt-1">{errors.currentState}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                PIN Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={currentAddress.pinCode}
                onChange={(e) => handleCurrentAddressChange('pinCode', e.target.value)}
                maxLength={6}
                placeholder="403001"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
              {errors.currentPinCode && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.currentPinCode}</p>
              )}
            </div>
          </div>
        </div>

        {/* Permanent Address with "Same as current" toggle */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-xs text-slate-800">Permanent Address</span>
            <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={sameAsCurrent}
                onChange={(e) => handleSameAsCurrentChange(e.target.checked)}
                className="rounded border-slate-300 text-slate-900 focus:ring-slate-800"
              />
              <span>Same as current address</span>
            </label>
          </div>

          {!sameAsCurrent && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Permanent Address Line 1 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={permanentAddress.addressLine1}
                    onChange={(e) => setPermanentAddress({ ...permanentAddress, addressLine1: e.target.value })}
                    placeholder="House/Flat No, Building, Street"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
                  />
                  {errors.permanentAddressLine1 && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.permanentAddressLine1}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Permanent Address Line 2</label>
                  <input
                    type="text"
                    value={permanentAddress.addressLine2}
                    onChange={(e) => setPermanentAddress({ ...permanentAddress, addressLine2: e.target.value })}
                    placeholder="Landmark, Area, Sector"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Permanent City</label>
                  <input
                    type="text"
                    value={permanentAddress.city}
                    onChange={(e) => setPermanentAddress({ ...permanentAddress, city: e.target.value })}
                    placeholder="City"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
                  />
                  {errors.permanentCity && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.permanentCity}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Permanent State</label>
                  <input
                    type="text"
                    value={permanentAddress.state}
                    onChange={(e) => setPermanentAddress({ ...permanentAddress, state: e.target.value })}
                    placeholder="State"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
                  />
                  {errors.permanentState && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.permanentState}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Permanent PIN Code</label>
                  <input
                    type="text"
                    value={permanentAddress.pinCode}
                    onChange={(e) => setPermanentAddress({ ...permanentAddress, pinCode: e.target.value })}
                    maxLength={6}
                    placeholder="6-digit PIN"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
                  />
                  {errors.permanentPinCode && (
                    <p className="text-[11px] text-rose-600 mt-1">{errors.permanentPinCode}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4: Employment & Income */}
      <div className="bg-white border border-slate-200 rounded p-4 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Briefcase className="w-4 h-4 text-slate-700" />
          <h3 className="font-semibold text-xs text-slate-900 tracking-wide uppercase">
            Section 4 — Employment & Income
          </h3>
        </div>

        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex items-start gap-2 text-[11px] text-slate-600">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
          <span>
            Income fields represent customer-declared figures until formally verified by credit underwriting and banking bureau analysis.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Employment Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
            >
              <option value="SALARIED">Salaried Employee</option>
              <option value="SELF_EMPLOYED">Self-Employed Individual</option>
              <option value="BUSINESS_OWNER">Business Owner / Partner</option>
              <option value="PROFESSIONAL">Professional (Doctor, CA, Lawyer)</option>
              <option value="RETIRED">Retired / Pensioner</option>
              <option value="OTHER">Other Income Source</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Employer / Business Name</label>
            <input
              type="text"
              value={employerName}
              onChange={(e) => setEmployerName(e.target.value)}
              placeholder="e.g. Tata Consultancy Services"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Designation / Occupation</label>
            <input
              type="text"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="e.g. Lead Solutions Architect"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Declared Monthly Income (₹ INR)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-mono text-xs text-slate-500 pointer-events-none">
                ₹
              </span>
              <input
                type="number"
                step="1000"
                min="0"
                value={monthlyIncome}
                onChange={(e) => {
                  setMonthlyIncome(e.target.value);
                  if (errors.monthlyIncome) setErrors({ ...errors, monthlyIncome: '' });
                }}
                placeholder="85000.00"
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
            </div>
            {errors.monthlyIncome && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.monthlyIncome}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Employment / Business Since</label>
            <input
              type="date"
              value={employmentSince}
              onChange={(e) => setEmploymentSince(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>
        </div>
      </div>

      {/* SECTION 5: Banking Information */}
      <div className="bg-white border border-slate-200 rounded p-4 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Building2 className="w-4 h-4 text-slate-700" />
          <h3 className="font-semibold text-xs text-slate-900 tracking-wide uppercase">
            Section 5 — Banking Information (Optional)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Bank Name</label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. HDFC Bank Ltd"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Bank Account Number</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Enter customer A/C number"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">IFSC Code</label>
            <input
              type="text"
              value={ifscCode}
              onChange={(e) => {
                setIfscCode(e.target.value.toUpperCase());
                if (errors.ifscCode) setErrors({ ...errors, ifscCode: '' });
              }}
              maxLength={11}
              placeholder="HDFC0000084"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded text-xs font-mono uppercase text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
            {errors.ifscCode && <p className="text-[11px] text-rose-600 mt-1">{errors.ifscCode}</p>}
          </div>
        </div>
      </div>

      {/* Footer Action Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-slate-300 text-xs font-semibold text-slate-700 rounded hover:bg-slate-100 focus:outline-none transition-colors"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="px-5 py-2 bg-slate-900 text-xs font-semibold text-white rounded hover:bg-slate-800 focus:outline-none transition-colors"
        >
          {isEditing ? 'Save Changes' : 'Create Customer'}
        </button>
      </div>
    </form>
  );
};
