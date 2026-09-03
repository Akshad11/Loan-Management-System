import React, { useState } from 'react';
import { ApprovalMatrixRule } from '../../types/approvalTypes';
import { Shield, X, AlertTriangle } from 'lucide-react';

interface ApprovalMatrixRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  ruleToEdit?: ApprovalMatrixRule | null;
  branches: { id: string; name: string }[];
  onSaveRule: (ruleData: Omit<ApprovalMatrixRule, 'id' | 'createdDate' | 'updatedDate'>) => {
    success: boolean;
    message?: string;
  };
}

export const ApprovalMatrixRuleModal: React.FC<ApprovalMatrixRuleModalProps> = ({
  isOpen,
  onClose,
  ruleToEdit,
  branches,
  onSaveRule,
}) => {
  if (!isOpen) return null;

  const isEditing = !!ruleToEdit;

  const [ruleCode, setRuleCode] = useState<string>(ruleToEdit?.ruleCode || `MAT-PL-L1-${Date.now().toString().slice(-4)}`);
  const [ruleDescription, setRuleDescription] = useState<string>(
    ruleToEdit?.ruleDescription || 'Standard Tier 1 Delegation Rule'
  );
  const [productCode, setProductCode] = useState<string>(ruleToEdit?.productCode || 'PL');
  const [productName, setProductName] = useState<string>(ruleToEdit?.productName || 'Personal Loan');
  const [branchId, setBranchId] = useState<string>(ruleToEdit?.branchId || 'ALL');
  const [branchName, setBranchName] = useState<string>(ruleToEdit?.branchName || 'All Branches (National)');
  const [level, setLevel] = useState<number>(ruleToEdit?.level || 1);
  const [levelName, setLevelName] = useState<string>(
    ruleToEdit?.levelName || 'Level 1 — Branch Credit Review'
  );
  const [minAmount, setMinAmount] = useState<number>(ruleToEdit?.minAmount || 0);
  const [maxAmount, setMaxAmount] = useState<number>(ruleToEdit?.maxAmount || 500000);
  const [approverRoleId, setApproverRoleId] = useState<string>(ruleToEdit?.approverRoleId || 'role_approver');
  const [approverRoleName, setApproverRoleName] = useState<string>(
    ruleToEdit?.approverRoleName || 'Branch Credit Manager'
  );
  const [authorityLimit, setAuthorityLimit] = useState<number>(ruleToEdit?.authorityLimit || 500000);
  const [exceptionApproverRoleId, setExceptionApproverRoleId] = useState<string>(
    ruleToEdit?.exceptionApproverRoleId || 'role_reg_credit_mgr'
  );
  const [exceptionApproverRoleName, setExceptionApproverRoleName] = useState<string>(
    ruleToEdit?.exceptionApproverRoleName || 'Regional Credit Manager'
  );
  const [isActive, setIsActive] = useState<boolean>(ruleToEdit ? ruleToEdit.isActive : true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleProductChange = (code: string) => {
    setProductCode(code);
    const names: Record<string, string> = {
      PL: 'Personal Loan',
      BL: 'Business Loan',
      HL: 'Home Loan',
      LAP: 'Loan Against Property',
      VL: 'Vehicle Loan',
      ALL: 'All Loan Products',
    };
    setProductName(names[code] || code);
  };

  const handleBranchChange = (bId: string) => {
    setBranchId(bId);
    if (bId === 'ALL') {
      setBranchName('All Branches (National)');
    } else {
      const found = branches.find((b) => b.id === bId);
      setBranchName(found ? found.name : bId);
    }
  };

  const handleLevelChange = (lvl: number) => {
    setLevel(lvl);
    if (lvl === 1) {
      setLevelName('Level 1 — Branch Credit Review');
      setApproverRoleId('role_approver');
      setApproverRoleName('Branch Credit Manager');
      setAuthorityLimit(500000);
    } else if (lvl === 2) {
      setLevelName('Level 2 — Regional Sanction Authority');
      setApproverRoleId('role_reg_credit_mgr');
      setApproverRoleName('Regional Credit Manager');
      setAuthorityLimit(2500000);
    } else {
      setLevelName('Level 3 — National Sanction Committee');
      setApproverRoleId('role_credit_committee');
      setApproverRoleName('Sanction Committee');
      setAuthorityLimit(100000000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (maxAmount <= minAmount) {
      setErrorMessage('Max amount must be strictly greater than min amount.');
      return;
    }

    if (authorityLimit <= 0) {
      setErrorMessage('Authority limit must be greater than zero.');
      return;
    }

    const res = onSaveRule({
      ruleCode: ruleCode.trim(),
      ruleDescription: ruleDescription.trim(),
      productCode,
      productName,
      branchId,
      branchName,
      level,
      levelName,
      minAmount,
      maxAmount,
      approverRoleId,
      approverRoleName,
      authorityLimit,
      canApproveExceptions: !!exceptionApproverRoleId,
      exceptionApproverRoleId,
      exceptionApproverRoleName,
      isActive,
      updatedBy: 'system',
    });

    if (!res.success) {
      setErrorMessage(res.message || 'Validation error while saving rule.');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-xl rounded-lg border border-slate-200 bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Shield className="h-4 w-4 text-indigo-700" />
            {isEditing ? `Edit Matrix Rule: ${ruleToEdit.ruleCode}` : 'Configure New Approval Matrix Rule'}
          </h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="rounded border border-rose-300 bg-rose-50 p-2.5 text-xs text-rose-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rule Code *</label>
              <input
                id="input-rule-code"
                type="text"
                value={ruleCode}
                onChange={(e) => setRuleCode(e.target.value)}
                className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Product *</label>
              <select
                id="select-rule-product"
                value={productCode}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-900 focus:outline-none"
              >
                <option value="PL">Personal Loan (PL)</option>
                <option value="BL">Business Loan (BL)</option>
                <option value="HL">Home Loan (HL)</option>
                <option value="LAP">Loan Against Property (LAP)</option>
                <option value="VL">Vehicle Loan (VL)</option>
                <option value="ALL">All Products</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Rule Description</label>
            <input
              id="input-rule-description"
              type="text"
              value={ruleDescription}
              onChange={(e) => setRuleDescription(e.target.value)}
              className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Scope</label>
              <select
                id="select-rule-branch"
                value={branchId}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-900 focus:outline-none"
              >
                <option value="ALL">All Branches (National)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Delegation Tier Level *</label>
              <select
                id="select-rule-level"
                value={level}
                onChange={(e) => handleLevelChange(Number(e.target.value))}
                className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-900 focus:outline-none font-bold"
              >
                <option value="1">Level 1 — Branch Credit Review</option>
                <option value="2">Level 2 — Regional Sanction Authority</option>
                <option value="3">Level 3 — National Sanction Committee</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Min Quantum (₹)</label>
              <input
                id="input-rule-min-amount"
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(Number(e.target.value))}
                className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-xs font-mono text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Quantum (₹)</label>
              <input
                id="input-rule-max-amount"
                type="number"
                value={maxAmount}
                onChange={(e) => setMaxAmount(Number(e.target.value))}
                className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-xs font-mono text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Authority Limit (₹)</label>
              <input
                id="input-rule-authority-limit"
                type="number"
                value={authorityLimit}
                onChange={(e) => setAuthorityLimit(Number(e.target.value))}
                className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Approver Role</label>
              <input
                id="input-rule-role"
                type="text"
                value={approverRoleName}
                onChange={(e) => setApproverRoleName(e.target.value)}
                className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Exception Escalation Role</label>
              <input
                id="input-rule-exception-role"
                type="text"
                value={exceptionApproverRoleName}
                onChange={(e) => setExceptionApproverRoleName(e.target.value)}
                className="w-full rounded border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
              <input
                id="input-rule-isactive"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-800"
              />
              <span>Matrix Rule Active for Delegation Evaluation</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-save-matrix-rule"
              className="rounded bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
            >
              Save Matrix Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
