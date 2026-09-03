import React from 'react';
import { PERMISSION_CATALOG, PERMISSION_MODULES } from '../../config/permissions';
import { ModuleCategory } from '../../types';
import { AlertTriangle, CheckSquare, Square } from 'lucide-react';

interface RolePermissionMatrixProps {
  selectedPermissionIds: string[];
  onChange: (permissionIds: string[]) => void;
  disabled?: boolean;
  readOnly?: boolean;
}

export const RolePermissionMatrix: React.FC<RolePermissionMatrixProps> = ({
  selectedPermissionIds,
  onChange,
  disabled = false,
  readOnly = false,
}) => {
  const selectedSet = new Set(selectedPermissionIds);

  const handleTogglePermission = (id: string) => {
    if (disabled || readOnly) return;
    const next = new Set(selectedSet);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onChange(Array.from(next));
  };

  const handleToggleModule = (moduleKey: ModuleCategory) => {
    if (disabled || readOnly) return;
    const modulePerms = PERMISSION_CATALOG.filter((p) => p.module === moduleKey);
    const allSelected = modulePerms.every((p) => selectedSet.has(p.id));

    const next = new Set(selectedSet);
    if (allSelected) {
      modulePerms.forEach((p) => next.delete(p.id));
    } else {
      modulePerms.forEach((p) => next.add(p.id));
    }
    onChange(Array.from(next));
  };

  const handleSelectAll = () => {
    if (disabled || readOnly) return;
    onChange(PERMISSION_CATALOG.map((p) => p.id));
  };

  const handleClearAll = () => {
    if (disabled || readOnly) return;
    onChange([]);
  };

  return (
    <div className="space-y-4 text-left">
      {/* Top Global Controls */}
      {!readOnly && (
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded p-2.5 text-xs">
          <span className="font-semibold text-slate-700">
            Selected Permissions: <strong className="text-slate-900">{selectedSet.size}</strong> /{' '}
            {PERMISSION_CATALOG.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={disabled}
              className="text-xs font-semibold text-slate-800 hover:text-slate-950 px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50"
            >
              Grant All
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={disabled}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Module Grouped Accordions/Cards */}
      <div className="space-y-3">
        {PERMISSION_MODULES.map((mod) => {
          const modulePerms = PERMISSION_CATALOG.filter((p) => p.module === mod.key);
          const selectedCount = modulePerms.filter((p) => selectedSet.has(p.id)).length;
          const isAllSelected = selectedCount === modulePerms.length;
          const isPartiallySelected = selectedCount > 0 && selectedCount < modulePerms.length;

          return (
            <div
              key={mod.key}
              className="bg-white border border-slate-200 rounded-lg overflow-hidden transition-colors"
            >
              {/* Module Header */}
              <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between select-none">
                <div className="flex items-center gap-2.5">
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleToggleModule(mod.key)}
                      disabled={disabled}
                      className="text-slate-700 hover:text-slate-900 p-0.5 rounded focus:outline-none"
                      aria-label={`Toggle all ${mod.label} permissions`}
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-4 h-4 text-slate-900" />
                      ) : isPartiallySelected ? (
                        <div className="w-4 h-4 rounded border border-slate-900 bg-slate-900 flex items-center justify-center">
                          <span className="w-2 h-0.5 bg-white block" />
                        </div>
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  )}
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">{mod.label}</h5>
                    <p className="text-[11px] text-slate-500">{mod.description}</p>
                  </div>
                </div>

                <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-200 text-slate-700 rounded">
                  {selectedCount} / {modulePerms.length}
                </span>
              </div>

              {/* Permission Checkboxes */}
              <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {modulePerms.map((perm) => {
                  const isChecked = selectedSet.has(perm.id);
                  const isHighRisk = !!perm.isHighRiskFinancial;

                  return (
                    <label
                      key={perm.id}
                      htmlFor={`perm-check-${perm.id}`}
                      className={`flex items-start gap-2.5 p-2.5 rounded border transition-colors cursor-pointer select-none ${
                        isChecked
                          ? isHighRisk
                            ? 'bg-amber-50/50 border-amber-300'
                            : 'bg-slate-50 border-slate-300'
                          : 'bg-white border-slate-200 hover:bg-slate-50/60'
                      } ${disabled || readOnly ? 'cursor-default pointer-events-none' : ''}`}
                    >
                      <input
                        id={`perm-check-${perm.id}`}
                        name={`perm-check-${perm.id}`}
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTogglePermission(perm.id)}
                        disabled={disabled || readOnly}
                        className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />

                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-900">{perm.name}</span>
                          {isHighRisk && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-800 bg-red-100 border border-red-200 px-1.5 py-0.2 rounded">
                              <AlertTriangle className="w-2.5 h-2.5 text-red-700" />
                              High-Risk
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight">{perm.description}</p>
                        <span className="font-mono text-[10px] text-slate-400 block">{perm.code}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
