import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  Save,
  AlertTriangle,
  Upload,
  FileCheck,
  Building,
  DollarSign,
  HelpCircle,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  FormSchemaDefinition,
  FormFieldDefinition,
  SignatureCaptureData,
} from '../../types/formBuilderTypes';
import {
  evaluateFieldVisibility,
  validateFormResponses,
  calculateFormProgress,
  evaluateCalculatedField,
} from '../../services/formEngine';
import { SignaturePad } from './SignaturePad';
import { formatCurrencyINR } from '../../utils/formatters';

const DEFAULT_EMPTY_RESPONSES: Record<string, any> = {};
const DEFAULT_EMPTY_SIGNATURES: Record<string, SignatureCaptureData> = {};

interface DynamicFormRendererProps {
  schema: FormSchemaDefinition;
  initialResponses?: Record<string, any>;
  initialSignatures?: Record<string, SignatureCaptureData>;
  initialPageIndex?: number;
  onAutoSaveDraft?: (responses: Record<string, any>, signatures: Record<string, SignatureCaptureData>, pageIndex: number) => Promise<void>;
  onSubmitForm: (responses: Record<string, any>, signatures: Record<string, SignatureCaptureData>) => Promise<void>;
  readOnly?: boolean;
}

export const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  schema,
  initialResponses = DEFAULT_EMPTY_RESPONSES,
  initialSignatures = DEFAULT_EMPTY_SIGNATURES,
  initialPageIndex = 0,
  onAutoSaveDraft,
  onSubmitForm,
  readOnly = false,
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(initialPageIndex);
  const [responses, setResponses] = useState<Record<string, any>>(initialResponses);
  const [signatures, setSignatures] = useState<Record<string, SignatureCaptureData>>(initialSignatures);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isAutoSaving, setIsAutoSaving] = useState<boolean>(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('Draft saved');

  const isFirstMount = useRef(true);
  const prevResponsesRef = useRef(JSON.stringify(initialResponses));
  const prevSignaturesRef = useRef(JSON.stringify(initialSignatures));

  // Sync initial responses only if genuinely changed externally (avoids infinite loops on newly allocated object references)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const currentResponsesStr = JSON.stringify(initialResponses);
    if (currentResponsesStr !== prevResponsesRef.current) {
      prevResponsesRef.current = currentResponsesStr;
      if (initialResponses && Object.keys(initialResponses).length > 0) {
        setResponses((prev) => ({ ...initialResponses, ...prev }));
      }
    }

    const currentSignaturesStr = JSON.stringify(initialSignatures);
    if (currentSignaturesStr !== prevSignaturesRef.current) {
      prevSignaturesRef.current = currentSignaturesStr;
      if (initialSignatures && Object.keys(initialSignatures).length > 0) {
        setSignatures((prev) => ({ ...initialSignatures, ...prev }));
      }
    }
  }, [initialResponses, initialSignatures]);

  // Handle field change
  const handleFieldChange = (fieldId: string, value: any) => {
    if (readOnly) return;
    const updatedResponses = { ...responses, [fieldId]: value };

    // Re-evaluate calculated fields if any
    schema.pages.forEach((p) => {
      p.sections.forEach((s) => {
        s.fields.forEach((f) => {
          if (f.type === 'CALCULATED' && f.calculationFormula) {
            const calcVal = evaluateCalculatedField(f.calculationFormula, updatedResponses);
            updatedResponses[f.id] = calcVal;
          }
        });
      });
    });

    setResponses(updatedResponses);

    // Clear field-specific error
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }

    // Trigger auto-save with updated responses
    if (onAutoSaveDraft) {
      setIsAutoSaving(true);
      setAutoSaveStatus('Saving draft...');
      onAutoSaveDraft(updatedResponses, signatures, currentPageIndex)
        .then(() => {
          setAutoSaveStatus('Draft saved');
          setIsAutoSaving(false);
        })
        .catch(() => {
          setAutoSaveStatus('Save error');
          setIsAutoSaving(false);
        });
    }
  };

  const handleSignatureChange = (fieldId: string, data: SignatureCaptureData | null) => {
    if (readOnly) return;
    setSignatures((prev) => {
      const next = { ...prev };
      if (data) next[fieldId] = data;
      else delete next[fieldId];
      return next;
    });

    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  // Multi-page navigation
  const activePage = schema.pages[currentPageIndex] || schema.pages[0];
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex === schema.pages.length - 1;

  const progress = calculateFormProgress({
    schema,
    responses,
    signatures,
  });

  const handleNextPage = () => {
    // Validate current page before advancing
    const validation = validateFormResponses({
      schema,
      responses,
      signatures,
      targetPageIndex: currentPageIndex,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    if (currentPageIndex < schema.pages.length - 1) {
      setCurrentPageIndex((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    setErrors({});
    if (currentPageIndex > 0) {
      setCurrentPageIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    const validation = validateFormResponses({
      schema,
      responses,
      signatures,
      isFinalSubmit: true,
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      // Auto jump to the first page with an error
      const firstErrorFieldId = Object.keys(validation.errors)[0];
      const targetPageIdx = schema.pages.findIndex((p) =>
        p.sections.some((s) => s.fields.some((f) => f.id === firstErrorFieldId))
      );
      if (targetPageIdx !== -1) {
        setCurrentPageIndex(targetPageIdx);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitForm(responses, signatures);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWidthClass = (width: string) => {
    switch (width) {
      case '1_COL':
        return 'col-span-12 md:col-span-4';
      case '2_COL':
        return 'col-span-12 md:col-span-6';
      case '3_COL':
        return 'col-span-12 md:col-span-8';
      case 'FULL_WIDTH':
      default:
        return 'col-span-12';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Stepper & Progress Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-900">
              Page {currentPageIndex + 1} of {schema.pages.length}: {activePage?.title}
            </span>
            <span className="text-slate-400">|</span>
            <span className="text-blue-700 font-semibold">{progress.overallPercentage}% Complete</span>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{autoSaveStatus}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.overallPercentage}%` }}
          />
        </div>

        {/* Step Indicator Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
          {schema.pages.map((p, idx) => {
            const isCompleted = idx < currentPageIndex;
            const isCurrent = idx === currentPageIndex;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  // Allow clicking previous pages or current
                  if (idx <= currentPageIndex) setCurrentPageIndex(idx);
                }}
                className={`px-2.5 py-1.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center space-x-2 ${
                  isCurrent
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : isCompleted
                    ? 'bg-blue-50/80 text-blue-900 border-blue-200'
                    : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                    isCurrent
                      ? 'bg-white text-blue-600'
                      : isCompleted
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="truncate">{p.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Page Form Content */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-black text-slate-900">{activePage?.title}</h2>
          {activePage?.description && (
            <p className="text-xs text-slate-500 mt-0.5">{activePage.description}</p>
          )}
        </div>

        {/* Global Errors summary if any */}
        {Object.keys(errors).length > 0 && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-800 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span>Please complete all required fields highlighted in red before proceeding.</span>
          </div>
        )}

        {/* Render Sections */}
        {activePage?.sections?.map((section) => (
          <div key={section.id} className="space-y-4">
            {section.title && (
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider pb-1 border-b border-slate-100">
                {section.title}
              </h3>
            )}

            <div className="grid grid-cols-12 gap-4">
              {section.fields.map((field) => {
                if (!evaluateFieldVisibility(field, responses)) return null;

                const widthClass = getWidthClass(field.width);
                const hasError = !!errors[field.id];
                const value = responses[field.id] ?? field.defaultValue ?? '';

                // Layout non-input fields
                if (field.type === 'HEADING') {
                  return (
                    <div key={field.id} className="col-span-12 pt-2">
                      <h4 className="text-sm font-bold text-slate-900">{field.label}</h4>
                      {field.description && <p className="text-xs text-slate-500">{field.description}</p>}
                    </div>
                  );
                }

                if (field.type === 'DESCRIPTION') {
                  return (
                    <div key={field.id} className="col-span-12 p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-xs text-slate-700">
                      <span className="font-bold text-blue-900 block mb-0.5">{field.label}</span>
                      <p>{field.description}</p>
                    </div>
                  );
                }

                if (field.type === 'DIVIDER') {
                  return <div key={field.id} className="col-span-12 border-t border-slate-200 my-2" />;
                }

                // Digital Signature Field
                if (field.type === 'SIGNATURE') {
                  return (
                    <div key={field.id} className="col-span-12">
                      <SignaturePad
                        label={field.label}
                        description={field.description}
                        value={signatures[field.id]}
                        required={field.required}
                        disabled={readOnly}
                        onChange={(sigData) => handleSignatureChange(field.id, sigData)}
                      />
                      {hasError && (
                        <span className="text-[11px] text-rose-600 font-medium block mt-1">
                          {errors[field.id]}
                        </span>
                      )}
                    </div>
                  );
                }

                return (
                  <div key={field.id} className={`${widthClass} space-y-1.5`}>
                    <label
                      htmlFor={`field-${field.id}`}
                      className="block text-xs font-bold text-slate-800 break-words leading-relaxed whitespace-normal"
                    >
                      {field.label}
                      {field.required && <span className="text-rose-500 font-bold ml-1">*</span>}
                    </label>

                    {field.description && (
                      <p className="text-[11px] text-slate-500 break-words leading-normal">{field.description}</p>
                    )}

                    {/* Field Input Control */}
                    {field.type === 'TEXTAREA' ? (
                      <textarea
                        id={`field-${field.id}`}
                        rows={3}
                        value={value}
                        disabled={readOnly}
                        placeholder={field.placeholder}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className={`w-full px-3 py-2 bg-white border rounded-xl text-xs font-medium focus:ring-2 focus:outline-none ${
                          hasError ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                        }`}
                      />
                    ) : field.type === 'SELECT' ? (
                      <select
                        id={`field-${field.id}`}
                        value={value}
                        disabled={readOnly}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className={`w-full px-3 py-2 bg-white border rounded-xl text-xs font-semibold focus:ring-2 focus:outline-none ${
                          hasError ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                        }`}
                      >
                        <option value="">{field.placeholder || '-- Select Option --'}</option>
                        {(field.options || []).map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'YES_NO' ? (
                      <div className="flex space-x-2">
                        {['Yes', 'No'].map((choice) => (
                          <button
                            key={choice}
                            type="button"
                            disabled={readOnly}
                            onClick={() => handleFieldChange(field.id, choice)}
                            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all border ${
                              value === choice
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {choice}
                          </button>
                        ))}
                      </div>
                    ) : field.type === 'RADIO' ? (
                      <div className="space-y-1.5 pt-1">
                        {(field.options || []).map((opt) => (
                          <label key={opt} className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                            <input
                              type="radio"
                              name={field.id}
                              value={opt}
                              checked={value === opt}
                              disabled={readOnly}
                              onChange={() => handleFieldChange(field.id, opt)}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : field.type === 'CHECKBOX' ? (
                      <label className="flex items-start space-x-2 text-xs font-medium text-slate-800 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={!!value}
                          disabled={readOnly}
                          onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                          className="mt-0.5 text-blue-600 focus:ring-blue-500 rounded"
                        />
                        <span>{field.label}</span>
                      </label>
                    ) : field.type === 'CALCULATED' ? (
                      <div className="px-3 py-2 bg-purple-50 border border-purple-200 rounded-xl text-xs font-mono font-bold text-purple-900">
                        {formatCurrencyINR(value || 0)}
                      </div>
                    ) : field.type === 'FILE' || field.type === 'MULTI_FILE' ? (
                      <div className="p-3 border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl bg-slate-50/50 flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-xs text-slate-600">
                          <Upload className="w-4 h-4 text-blue-600" />
                          <span>{value ? `File uploaded: ${String(value)}` : 'Select document file (PDF / Image)'}</span>
                        </div>
                        <input
                          type="file"
                          disabled={readOnly}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFieldChange(field.id, file.name);
                          }}
                          className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                        />
                      </div>
                    ) : (
                      <input
                        id={`field-${field.id}`}
                        type={field.type === 'NUMBER' || field.type === 'CURRENCY' || field.type === 'PERCENTAGE' ? 'number' : field.type === 'DATE' ? 'date' : 'text'}
                        value={value}
                        disabled={readOnly}
                        placeholder={field.placeholder}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className={`w-full px-3 py-2 bg-white border rounded-xl text-xs font-medium focus:ring-2 focus:outline-none ${
                          hasError ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                        }`}
                      />
                    )}

                    {hasError && (
                      <span className="text-[11px] text-rose-600 font-medium block">
                        {errors[field.id]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-4 rounded-2xl">
        <button
          type="button"
          onClick={handlePrevPage}
          disabled={isFirstPage}
          className="px-4 py-2 bg-white hover:bg-slate-100 disabled:opacity-30 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition-colors flex items-center space-x-1"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </button>

        <div className="flex items-center space-x-3">
          {!isLastPage ? (
            <button
              type="button"
              onClick={handleNextPage}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center space-x-1.5"
            >
              <span>Next Step</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || readOnly}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting Application...' : 'Submit Application'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
