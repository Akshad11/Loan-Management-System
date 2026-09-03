import React from 'react';
import {
  Sliders,
  X,
  CheckSquare,
  HelpCircle,
  Eye,
  Lock,
  Columns,
  ListPlus,
  Trash2,
  Workflow,
  Calculator,
} from 'lucide-react';
import {
  FormFieldDefinition,
  FormFieldLayout,
  ConditionOperator,
  ConditionAction,
} from '../../types/formBuilderTypes';

interface FieldConfigPanelProps {
  field: FormFieldDefinition | null;
  allFieldIds: { id: string; label: string }[];
  onChange: (updatedField: FormFieldDefinition) => void;
  onClose: () => void;
}

export const FieldConfigPanel: React.FC<FieldConfigPanelProps> = ({
  field,
  allFieldIds,
  onChange,
  onClose,
}) => {
  if (!field) {
    return (
      <div className="w-80 border-l border-slate-200 bg-slate-50/50 p-6 flex flex-col items-center justify-center text-center text-slate-400">
        <Sliders className="w-8 h-8 text-slate-300 mb-2 stroke-1" />
        <span className="text-xs font-semibold text-slate-500">No Field Selected</span>
        <p className="text-[11px] text-slate-400 mt-1">
          Click on any field in the canvas to inspect and configure its label, validation, layout & conditional rules.
        </p>
      </div>
    );
  }

  const isOptionField = ['SELECT', 'RADIO', 'MULTI_SELECT'].includes(field.type);
  const isNumericField = ['NUMBER', 'CURRENCY', 'PERCENTAGE'].includes(field.type);
  const isTextField = ['TEXT', 'TEXTAREA', 'EMAIL', 'PHONE', 'ADDRESS'].includes(field.type);
  const isFileField = ['FILE', 'MULTI_FILE', 'IMAGE'].includes(field.type);
  const isCalculatedField = field.type === 'CALCULATED';

  const handleUpdate = (updates: Partial<FormFieldDefinition>) => {
    onChange({ ...field, ...updates });
  };

  const handleValidationUpdate = (valUpdates: any) => {
    onChange({
      ...field,
      validation: { ...field.validation, ...valUpdates },
    });
  };

  const handleAddOption = () => {
    const currentOptions = field.options || [];
    handleUpdate({ options: [...currentOptions, `Option ${currentOptions.length + 1}`] });
  };

  const handleRemoveOption = (index: number) => {
    const currentOptions = field.options || [];
    handleUpdate({ options: currentOptions.filter((_, i) => i !== index) });
  };

  const handleOptionChange = (index: number, val: string) => {
    const currentOptions = [...(field.options || [])];
    currentOptions[index] = val;
    handleUpdate({ options: currentOptions });
  };

  return (
    <div className="w-80 border-l border-slate-200 bg-white p-4 overflow-y-auto space-y-5">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Field Inspector
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Field Identification */}
      <div className="space-y-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Field Unique ID <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={field.id}
            onChange={(e) => handleUpdate({ id: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
            className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <span className="text-[10px] text-slate-400 mt-0.5 block">Used for response binding</span>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Field Label <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={field.label}
            onChange={(e) => handleUpdate({ label: e.target.value })}
            rows={2}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Placeholder Text
          </label>
          <input
            type="text"
            value={field.placeholder || ''}
            onChange={(e) => handleUpdate({ placeholder: e.target.value })}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Help Text / Description
          </label>
          <textarea
            value={field.description || ''}
            onChange={(e) => handleUpdate({ description: e.target.value })}
            rows={2}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-600"
          />
        </div>
      </div>

      {/* Layout & Width */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Column Width Layout
        </label>
        <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
          {[
            { id: '1_COL', label: '1/3 Col' },
            { id: '2_COL', label: '1/2 Col' },
            { id: '3_COL', label: '2/3 Col' },
            { id: 'FULL_WIDTH', label: 'Full' },
          ].map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => handleUpdate({ width: w.id as FormFieldLayout })}
              className={`py-1.5 rounded-lg border text-center text-[10px] font-bold transition-all ${
                field.width === w.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* Validation Rules */}
      <div className="space-y-3 pt-2 border-t border-slate-100">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
          Validation Rules
        </span>

        <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
          <input
            type="checkbox"
            checked={!!field.required}
            onChange={(e) => handleUpdate({ required: e.target.checked })}
            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
          />
          <span>Mandatory / Required Field</span>
        </label>

        {isTextField && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-slate-500">Min Length</label>
              <input
                type="number"
                value={field.validation?.minLength || ''}
                onChange={(e) => handleValidationUpdate({ minLength: parseInt(e.target.value) || undefined })}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-slate-500">Max Length</label>
              <input
                type="number"
                value={field.validation?.maxLength || ''}
                onChange={(e) => handleValidationUpdate({ maxLength: parseInt(e.target.value) || undefined })}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
        )}

        {isNumericField && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-slate-500">Min Value</label>
              <input
                type="number"
                value={field.validation?.minValue ?? ''}
                onChange={(e) => handleValidationUpdate({ minValue: parseFloat(e.target.value) || undefined })}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-slate-500">Max Value</label>
              <input
                type="number"
                value={field.validation?.maxValue ?? ''}
                onChange={(e) => handleValidationUpdate({ maxValue: parseFloat(e.target.value) || undefined })}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
        )}

        {isTextField && (
          <div>
            <label className="block text-[10px] font-medium text-slate-500">Regex Pattern Validation</label>
            <input
              type="text"
              placeholder="^[A-Z]{5}[0-9]{4}[A-Z]{1}$"
              value={field.validation?.regexPattern || ''}
              onChange={(e) => handleValidationUpdate({ regexPattern: e.target.value })}
              className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono"
            />
          </div>
        )}

        {isFileField && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-slate-500">Max File Size (MB)</label>
              <input
                type="number"
                value={field.validation?.maxFileSizeMB || 10}
                onChange={(e) => handleValidationUpdate({ maxFileSizeMB: parseInt(e.target.value) || 10 })}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-slate-500">Max Files</label>
              <input
                type="number"
                value={field.validation?.maxFilesCount || 1}
                onChange={(e) => handleValidationUpdate({ maxFilesCount: parseInt(e.target.value) || 1 })}
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Options Editor for Select / Radio / MultiSelect */}
      {isOptionField && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Choices & Options
            </span>
            <button
              type="button"
              onClick={handleAddOption}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <ListPlus className="w-3 h-3" />
              <span>+ Add Option</span>
            </button>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {(field.options || []).map((opt, idx) => (
              <div key={idx} className="flex items-center space-x-1">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(idx, e.target.value)}
                  className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveOption(idx)}
                  className="p-1 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calculated Field Formula */}
      {isCalculatedField && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center space-x-1 text-purple-700">
            <Calculator className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Calculation Formula</span>
          </div>
          <input
            type="text"
            placeholder="{prop_value} * 0.8"
            value={field.calculationFormula || ''}
            onChange={(e) => handleUpdate({ calculationFormula: e.target.value })}
            className="w-full px-2.5 py-1.5 bg-white border border-purple-300 rounded-lg text-xs font-mono"
          />
          <p className="text-[10px] text-slate-400">
            Use curly braces for field IDs (e.g. &#123;annual_income&#125; / 12)
          </p>
        </div>
      )}

      {/* Conditional Visibility Engine */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1 text-amber-800">
            <Workflow className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Conditional Logic</span>
          </div>
          {field.condition && (
            <button
              type="button"
              onClick={() => handleUpdate({ condition: undefined })}
              className="text-[10px] text-rose-600 font-bold hover:underline"
            >
              Clear Rule
            </button>
          )}
        </div>

        <div className="space-y-2 p-2.5 bg-amber-50/50 border border-amber-200/60 rounded-xl text-xs">
          <div>
            <label className="block text-[10px] text-slate-500 font-medium mb-1">
              Action Rule
            </label>
            <select
              value={field.condition?.action || 'SHOW'}
              onChange={(e) =>
                handleUpdate({
                  condition: {
                    dependentFieldId: field.condition?.dependentFieldId || '',
                    operator: field.condition?.operator || 'EQUALS',
                    triggerValue: field.condition?.triggerValue || '',
                    action: e.target.value as ConditionAction,
                  },
                })
              }
              className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
            >
              <option value="SHOW">SHOW this field only IF</option>
              <option value="HIDE">HIDE this field only IF</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-slate-500 font-medium mb-1">
              When Field
            </label>
            <select
              value={field.condition?.dependentFieldId || ''}
              onChange={(e) =>
                handleUpdate({
                  condition: {
                    dependentFieldId: e.target.value,
                    operator: field.condition?.operator || 'EQUALS',
                    triggerValue: field.condition?.triggerValue || '',
                    action: field.condition?.action || 'SHOW',
                  },
                })
              }
              className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
            >
              <option value="">-- Select Dependency Field --</option>
              {allFieldIds
                .filter((f) => f.id !== field.id)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label} ({f.id})
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-500 font-medium mb-1">Operator</label>
              <select
                value={field.condition?.operator || 'EQUALS'}
                onChange={(e) =>
                  handleUpdate({
                    condition: {
                      dependentFieldId: field.condition?.dependentFieldId || '',
                      operator: e.target.value as ConditionOperator,
                      triggerValue: field.condition?.triggerValue || '',
                      action: field.condition?.action || 'SHOW',
                    },
                  })
                }
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
              >
                <option value="EQUALS">Equals (==)</option>
                <option value="NOT_EQUALS">Not Equals (!=)</option>
                <option value="GREATER_THAN">Greater (&gt;)</option>
                <option value="LESS_THAN">Less (&lt;)</option>
                <option value="IS_EMPTY">Is Empty</option>
                <option value="IS_NOT_EMPTY">Is Not Empty</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 font-medium mb-1">Value</label>
              <input
                type="text"
                placeholder="e.g. Yes / Salaried"
                value={field.condition?.triggerValue ?? ''}
                onChange={(e) =>
                  handleUpdate({
                    condition: {
                      dependentFieldId: field.condition?.dependentFieldId || '',
                      operator: field.condition?.operator || 'EQUALS',
                      triggerValue: e.target.value,
                      action: field.condition?.action || 'SHOW',
                    },
                  })
                }
                className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
