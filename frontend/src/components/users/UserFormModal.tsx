import React, { useState, useEffect } from 'react';
import { Modal } from '../shared/Modal';
import { FormField } from '../shared/FormField';
import { SelectField } from '../shared/SelectField';
import { LMSUser, Role, Branch, UserStatus } from '../../types';
import {
  validateRequired,
  validateEmail,
  validateIndianMobile,
  validateEmployeeId,
  validateUsername,
} from '../../utils/validation';
import { Eye, EyeOff, ShieldCheck, UserCheck } from 'lucide-react';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: any) => void;
  userToEdit?: LMSUser | null;
  roles: Role[];
  branches: Branch[];
  existingUsers: LMSUser[];
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  userToEdit,
  roles,
  branches,
  existingUsers,
}) => {
  const isEditMode = !!userToEdit;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [mobile, setMobile] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [roleId, setRoleId] = useState('');
  const [branchId, setBranchId] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState<UserStatus>('ACTIVE');
  const [reason, setReason] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (userToEdit) {
      setFirstName(userToEdit.firstName || (userToEdit.name ? userToEdit.name.split(' ')[0] : ''));
      setLastName(userToEdit.lastName || (userToEdit.name ? userToEdit.name.split(' ').slice(1).join(' ') : ''));
      setEmployeeId(userToEdit.employeeId || '');
      setMobile(userToEdit.mobile || '');
      setUsername(userToEdit.username || '');
      setEmail(userToEdit.email || '');
      setPassword('••••••••••••');
      setRoleId(userToEdit.roleId || roles[0]?.id || '');
      setBranchId(userToEdit.branchId || branches[0]?.id || '');
      setDepartment(userToEdit.department || '');
      setStatus(userToEdit.status || 'ACTIVE');
      setReason('');
    } else {
      // Defaults for create
      const nextEmpNum = 1000 + existingUsers.length + 1;
      setFirstName('');
      setLastName('');
      setEmployeeId(`EMP-00${nextEmpNum}`);
      setMobile('');
      setUsername('');
      setEmail('');
      setPassword('TempSecure#2026');
      setRoleId(roles[0]?.id || '');
      setBranchId(branches[0]?.id || '');
      setDepartment('Retail Loan Origination');
      setStatus('ACTIVE');
      setReason('');
    }
    setErrors({});
  }, [userToEdit, isOpen, roles, branches, existingUsers.length]);

  const handleAutoFillUsername = (first: string, last: string) => {
    if (!isEditMode && (!username || username === '')) {
      const generated = `${first.toLowerCase()}.${last.toLowerCase()}`.replace(/[^a-z0-9.]/g, '');
      setUsername(generated);
      if (!email || email === '') {
        setEmail(`${generated}@fintechlms.in`);
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const fnRes = validateRequired(firstName, 'First Name');
    if (!fnRes.isValid) newErrors.firstName = fnRes.error!;

    const lnRes = validateRequired(lastName, 'Last Name');
    if (!lnRes.isValid) newErrors.lastName = lnRes.error!;

    const existingEmpIds = existingUsers.map((u) => u.employeeId);
    const empRes = validateEmployeeId(employeeId, existingEmpIds, userToEdit?.employeeId);
    if (!empRes.isValid) newErrors.employeeId = empRes.error!;

    const mobRes = validateIndianMobile(mobile);
    if (!mobRes.isValid) newErrors.mobile = mobRes.error!;

    const existingUsernames = existingUsers.map((u) => u.username);
    const uRes = validateUsername(username, existingUsernames, userToEdit?.username);
    if (!uRes.isValid) newErrors.username = uRes.error!;

    const emailRes = validateEmail(email);
    if (!emailRes.isValid) newErrors.email = emailRes.error!;

    if (!roleId) newErrors.roleId = 'Please select a system role.';
    if (!branchId) newErrors.branchId = 'Please select an assigned branch.';

    if (isEditMode && !reason.trim()) {
      newErrors.reason = 'Please state an administrative reason for this modification.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSave({
      firstName,
      lastName,
      employeeId,
      mobile,
      username,
      email,
      roleId,
      branchId,
      department,
      status,
      reason: isEditMode ? reason : undefined,
    });
    onClose();
  };

  const roleOptions = roles.map((r) => {
    const count = (r.permissionIds || (r as any).permissions || []).length;
    return {
      value: r.id,
      label: `${r.name} (${count} permissions)`,
    };
  });

  const branchOptions = branches.map((b) => ({
    value: b.id,
    label: `${b.name} - ${b.city} (${b.code})`,
  }));

  const statusOptions = [
    { value: 'ACTIVE', label: 'ACTIVE - Account enabled and active' },
    { value: 'INACTIVE', label: 'INACTIVE - Account disabled' },
    { value: 'SUSPENDED', label: 'SUSPENDED - Security hold' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit Staff Account — ${userToEdit.name}` : 'Provision New Staff User Account'}
      subtitle={
        isEditMode
          ? `Modify organizational assignments and credential attributes for ${userToEdit.employeeId}.`
          : 'Create a new employee profile with role-based access control and branch assignment.'
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
            id="save-user-form-btn"
            onClick={handleSubmit}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 border border-slate-900 rounded hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{isEditMode ? 'Save User Changes' : 'Provision User Account'}</span>
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-left" noValidate>
        {/* Section 1: Personal Information */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 pb-1 border-b border-slate-200">
            1. Personal & Identity Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="user-first-name"
              label="First Name"
              value={firstName}
              onChange={(val) => {
                setFirstName(val);
                handleAutoFillUsername(val, lastName);
              }}
              placeholder="e.g. Siddharth"
              required
              error={errors.firstName}
            />

            <FormField
              id="user-last-name"
              label="Last Name"
              value={lastName}
              onChange={(val) => {
                setLastName(val);
                handleAutoFillUsername(firstName, val);
              }}
              placeholder="e.g. Rao"
              required
              error={errors.lastName}
            />

            <FormField
              id="user-employee-id"
              label="Employee ID"
              value={employeeId}
              onChange={setEmployeeId}
              placeholder="e.g. EMP-001001"
              required
              helperText="Unique organizational employee identifier."
              error={errors.employeeId}
            />

            <FormField
              id="user-mobile"
              label="Mobile Number (India)"
              type="tel"
              value={mobile}
              onChange={setMobile}
              placeholder="e.g. 9820144520"
              prefix={<span className="text-slate-500 font-mono">+91</span>}
              required
              helperText="10-digit Indian mobile number for 2FA."
              error={errors.mobile}
            />
          </div>
        </div>

        {/* Section 2: Account & Credentials */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 pb-1 border-b border-slate-200">
            2. System Account & Credentials
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="user-username"
              label="Username"
              value={username}
              onChange={setUsername}
              placeholder="e.g. siddharth.rao"
              required
              helperText="Lowercase letters, numbers, and periods only."
              error={errors.username}
            />

            <FormField
              id="user-email"
              label="Official Email Address"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="e.g. siddharth.rao@fintechlms.in"
              required
              error={errors.email}
            />

            {!isEditMode && (
              <div className="sm:col-span-2">
                <FormField
                  id="user-initial-password"
                  label="Initial Temporary Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={setPassword}
                  required
                  helperText="User will be prompted to reset password upon first interactive login."
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-700 p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Organization & Role */}
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 pb-1 border-b border-slate-200">
            3. Organizational Role & Branch Assignment
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField
              id="user-role-select"
              label="System Role (RBAC)"
              value={roleId}
              onChange={setRoleId}
              options={roleOptions}
              required
              helperText="Determines permissions and operational workqueue routing."
              error={errors.roleId}
            />

            <SelectField
              id="user-branch-select"
              label="Primary Branch Assignment"
              value={branchId}
              onChange={setBranchId}
              options={branchOptions}
              required
              helperText="Restricts geographic lending jurisdiction."
              error={errors.branchId}
            />

            <FormField
              id="user-department"
              label="Department / Unit"
              value={department}
              onChange={setDepartment}
              placeholder="e.g. Retail Loan Origination"
              helperText="Organizational business unit."
            />

            <SelectField
              id="user-status-select"
              label="Account Status"
              value={status}
              onChange={(val) => setStatus(val as UserStatus)}
              options={statusOptions}
              required
            />
          </div>
        </div>

        {/* Section 4: Audit Reason (Required when editing) */}
        {isEditMode && (
          <div className="bg-slate-50 border border-slate-200 p-3 rounded">
            <FormField
              id="user-edit-reason"
              label="Administrative Reason for Modification"
              value={reason}
              onChange={setReason}
              placeholder="e.g. Transfer to new branch / Promotion to Credit Officer role..."
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
