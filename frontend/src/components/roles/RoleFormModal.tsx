import React, { useState, useEffect } from 'react';
import { Modal } from '../shared/Modal';
import { FormField } from '../shared/FormField';
import { SelectField } from '../shared/SelectField';
import { RolePermissionMatrix } from './RolePermissionMatrix';
import { Role, RoleStatus } from '../../types';
import { validateRoleName } from '../../utils/validation';
import { Shield, Check } from 'lucide-react';

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (roleData: { name: string; description: string; status: RoleStatus; permissionIds: string[] }) => void;
  roleToEdit?: Role | null;
  existingRoles: Role[];
}

export const RoleFormModal: React.FC<RoleFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  roleToEdit,
  existingRoles,
}) => {
  const isEditMode = !!roleToEdit;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<RoleStatus>('ACTIVE');
  const [permissionIds, setPermissionIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (roleToEdit) {
      setName(roleToEdit.name || '');
      setDescription(roleToEdit.description || '');
      setStatus(roleToEdit.status || 'ACTIVE');
      setPermissionIds(roleToEdit.permissionIds || (roleToEdit as any).permissions || []);
    } else {
      setName('');
      setDescription('');
      setStatus('ACTIVE');
      setPermissionIds([]);
    }
    setErrors({});
  }, [roleToEdit, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const existingNames = existingRoles.map((r) => r.name);
    const nameRes = validateRoleName(name, existingNames, roleToEdit?.name);
    if (!nameRes.isValid) newErrors.name = nameRes.error!;

    if (!description.trim()) {
      newErrors.description = 'Please provide an operational description for this role.';
    }

    if (permissionIds.length === 0) {
      newErrors.permissions = 'Please select at least one granted permission for this role.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSave({
      name,
      description,
      status,
      permissionIds,
    });
    onClose();
  };

  const statusOptions = [
    { value: 'ACTIVE', label: 'ACTIVE - Available for assignment' },
    { value: 'INACTIVE', label: 'INACTIVE - Disabled' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit Role — ${roleToEdit.name}` : 'Create New System Role'}
      subtitle={
        isEditMode
          ? `Modify permissions and details for role ${roleToEdit.code}.`
          : 'Define a new RBAC role and assign granular operational permissions.'
      }
      maxWidth="4xl"
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
            id="save-role-form-btn"
            onClick={handleSubmit}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 border border-slate-900 rounded hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{isEditMode ? 'Proceed to Save Changes' : 'Create System Role'}</span>
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-left" noValidate>
        {/* Basic Role Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            id="role-name-input"
            label="Role Name"
            value={name}
            onChange={setName}
            placeholder="e.g. Senior Underwriter / Zonal Credit Approver"
            required
            helperText="Clear, descriptive role title."
            error={errors.name}
          />

          <SelectField
            id="role-status-select"
            label="Role Status"
            value={status}
            onChange={(val) => setStatus(val as RoleStatus)}
            options={statusOptions}
            required
          />

          <div className="sm:col-span-2">
            <FormField
              id="role-description-input"
              label="Operational Description & Responsibilities"
              type="textarea"
              rows={2}
              value={description}
              onChange={setDescription}
              placeholder="Describe what operational functions, approval thresholds, or workflows users with this role perform..."
              required
              error={errors.description}
            />
          </div>
        </div>

        {/* Permission Matrix */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Granular Permissions Matrix
              </h4>
              <p className="text-xs text-slate-500">
                Check operational actions and high-risk financial permissions granted to this role.
              </p>
            </div>
            {errors.permissions && (
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                {errors.permissions}
              </span>
            )}
          </div>

          <RolePermissionMatrix
            selectedPermissionIds={permissionIds}
            onChange={setPermissionIds}
          />
        </div>
      </form>
    </Modal>
  );
};
