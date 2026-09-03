import React, { useState, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  AlertOctagon,
  Layers,
  UserCheck,
} from 'lucide-react';
import { LoanAccountRecord } from '../../types/loanAccountTypes';
import {
  RecoveryStage,
  RecoveryPriority,
  EscalateToRecoveryPayload,
} from '../../types/recoveryTypes';
import { evaluateRecoveryEligibility } from '../../services/recoveryEngine';
import { formatCurrencyINR } from '../../utils/formatters';

interface EscalateToRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: LoanAccountRecord;
  onSubmit: (payload: EscalateToRecoveryPayload) => void;
  currentUser?: { name: string; id: string; roleName: string };
}

export const EscalateToRecoveryModal: React.FC<EscalateToRecoveryModalProps> = ({
  isOpen,
  onClose,
  loan,
  onSubmit,
  currentUser,
}) => {
  const eligibility = useMemo(() => {
    return evaluateRecoveryEligibility(loan, 0, 0);
  }, [loan]);

  const [targetStage, setTargetStage] = useState<RecoveryStage>(
    eligibility.recommendedStage || 'EARLY_RECOVERY'
  );
  const [priority, setPriority] = useState<RecoveryPriority>(
    eligibility.priority || 'MEDIUM'
  );
  const [reason, setReason] = useState<string>('');
  const [assignedOfficer, setAssignedOfficer] = useState<string>('Rajesh Naik');
  const [assignedTeam, setAssignedTeam] = useState<string>('Field Recovery Team 1');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a mandatory justification for recovery escalation.');
      return;
    }

    const payload: EscalateToRecoveryPayload = {
      loanId: loan.id,
      targetStage,
      reason: reason.trim(),
      assignedOfficerName: assignedOfficer,
      assignedTeam,
      priority,
      targetAmount: loan.overdueAmount,
    };

    onSubmit(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Escalate Loan to Recovery / Remedial
              </h3>
              <p className="text-xs text-slate-500">
                Account: <span className="font-mono font-semibold text-slate-700">{loan.accountNumber}</span> • {loan.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Eligibility Engine Banner */}
          <div
            className={`p-4 rounded-xl border ${
              eligibility.isEligible
                ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold flex items-center gap-1.5 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Server-Side Recovery Eligibility Assessment
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-amber-300">
                Score: {eligibility.score} / 100
              </span>
            </div>

            {eligibility.triggers.length > 0 && (
              <div className="space-y-1 mt-2">
                <span className="text-[11px] font-semibold text-slate-600">Triggers Identified:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-700">
                  {eligibility.triggers.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>
            )}

            {eligibility.blockers.length > 0 && (
              <div className="space-y-1 mt-2 text-rose-700">
                <span className="text-[11px] font-semibold">Blockers:</span>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                  {eligibility.blockers.map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Account Balance Snapshot */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-3 gap-3 text-center">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Overdue Amount</span>
              <span className="font-mono font-bold text-rose-600 text-sm mt-0.5 block">
                {formatCurrencyINR(loan.overdueAmount)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Exposure</span>
              <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">
                {formatCurrencyINR(loan.totalOutstanding)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">DPD Status</span>
              <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
                {loan.dpd} Days ({loan.dpdBucket})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Recovery Stage */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Target Recovery Stage <span className="text-rose-500">*</span>
              </label>
              <select
                value={targetStage}
                onChange={(e) => setTargetStage(e.target.value as RecoveryStage)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="EARLY_RECOVERY">Early Recovery (Soft Follow-Up)</option>
                <option value="HARD_RECOVERY">Hard Recovery (Field Visits & Intensive)</option>
                <option value="PRE_LEGAL">Pre-Legal Notice Stage</option>
                <option value="LEGAL_ACTION">Direct Legal Action</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Recovery Priority <span className="text-rose-500">*</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as RecoveryPriority)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
                <option value="CRITICAL">Critical / Severe Risk</option>
              </select>
            </div>

            {/* Assigned Officer */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Assigned Recovery Officer <span className="text-rose-500">*</span>
              </label>
              <select
                value={assignedOfficer}
                onChange={(e) => setAssignedOfficer(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="Rajesh Naik">Rajesh Naik (Senior Field Officer)</option>
                <option value="Sanjay Deshmukh">Sanjay Deshmukh (Legal & Remedial)</option>
                <option value="Sunita Gaundar">Sunita Gaundar (Recovery Specialist)</option>
              </select>
            </div>

            {/* Assigned Team */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
                Assigned Team
              </label>
              <select
                value={assignedTeam}
                onChange={(e) => setAssignedTeam(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="Field Recovery Team 1">Field Recovery Team 1 (Panaji)</option>
                <option value="Legal & Remedial Unit">Legal & Remedial Unit</option>
                <option value="Commercial Recovery Hub">Commercial Recovery Hub</option>
              </select>
            </div>
          </div>

          {/* Mandatory Reason */}
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-700 mb-1">
              Escalation Justification & Background <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="State reason for escalating from tele-collections to remedial recovery (e.g. Broken PTPs, unreachable borrower, DPD threshold reached)..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="text-rose-500 mt-1">{error}</p>}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-xs">
          <span className="text-slate-500">
            Triggered by: <span className="font-semibold text-slate-700">{currentUser?.name || 'Collection Officer'}</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 font-semibold text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-all"
            >
              Confirm Escalation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
