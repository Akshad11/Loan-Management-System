// Core Form Engine for Schema Validation, Conditional Logic, and Dynamic Calculations
import {
  FormFieldDefinition,
  FormSchemaDefinition,
  FormPageDefinition,
  SignatureCaptureData,
} from '../types/formBuilderTypes';

/**
 * Evaluates whether a field should be visible based on configured conditional logic.
 */
export function evaluateFieldVisibility(
  field: FormFormFieldDefinitionLike,
  responses: Record<string, any>
): boolean {
  if (field.hidden) return false;
  if (!field.condition || !field.condition.dependentFieldId) return true;

  const { dependentFieldId, operator, triggerValue, action } = field.condition;
  const currentValue = responses[dependentFieldId];

  let conditionMet = false;

  switch (operator) {
    case 'EQUALS':
      conditionMet = String(currentValue ?? '').toLowerCase() === String(triggerValue ?? '').toLowerCase();
      break;
    case 'NOT_EQUALS':
      conditionMet = String(currentValue ?? '').toLowerCase() !== String(triggerValue ?? '').toLowerCase();
      break;
    case 'GREATER_THAN':
      conditionMet = Number(currentValue || 0) > Number(triggerValue || 0);
      break;
    case 'LESS_THAN':
      conditionMet = Number(currentValue || 0) < Number(triggerValue || 0);
      break;
    case 'IN':
      if (Array.isArray(triggerValue)) {
        conditionMet = triggerValue.includes(currentValue);
      } else {
        const parts = String(triggerValue || '').split(',').map((s) => s.trim().toLowerCase());
        conditionMet = parts.includes(String(currentValue || '').toLowerCase());
      }
      break;
    case 'NOT_IN':
      if (Array.isArray(triggerValue)) {
        conditionMet = !triggerValue.includes(currentValue);
      } else {
        const parts = String(triggerValue || '').split(',').map((s) => s.trim().toLowerCase());
        conditionMet = !parts.includes(String(currentValue || '').toLowerCase());
      }
      break;
    case 'IS_EMPTY':
      conditionMet = currentValue === undefined || currentValue === null || currentValue === '' || (Array.isArray(currentValue) && currentValue.length === 0);
      break;
    case 'IS_NOT_EMPTY':
      conditionMet = currentValue !== undefined && currentValue !== null && currentValue !== '' && (!Array.isArray(currentValue) || currentValue.length > 0);
      break;
    default:
      conditionMet = true;
  }

  if (action === 'SHOW') return conditionMet;
  if (action === 'HIDE') return !conditionMet;
  return true;
}

type FormFormFieldDefinitionLike = FormFieldDefinition;

/**
 * Validates responses against form schema.
 */
export function validateFormResponses(params: {
  schema: FormSchemaDefinition;
  responses: Record<string, any>;
  signatures?: Record<string, SignatureCaptureData>;
  targetPageIndex?: number; // Validate specific page or all pages
  isFinalSubmit?: boolean;
}): {
  isValid: boolean;
  errors: Record<string, string>;
} {
  const { schema, responses, signatures = {}, targetPageIndex, isFinalSubmit = false } = params;
  const errors: Record<string, string> = {};

  const pagesToValidate =
    targetPageIndex !== undefined
      ? [schema.pages[targetPageIndex]].filter(Boolean)
      : schema.pages;

  for (const page of pagesToValidate) {
    for (const section of page.sections || []) {
      for (const field of section.fields || []) {
        // Skip hidden / conditionally hidden fields
        const isVisible = evaluateFieldVisibility(field, responses);
        if (!isVisible) continue;

        // Skip non-input layout fields
        if (['HEADING', 'DESCRIPTION', 'DIVIDER'].includes(field.type)) continue;

        const value = responses[field.id];
        const valRules = field.validation || {};
        const isRequired = field.required || valRules.required;

        // Signature validation
        if (field.type === 'SIGNATURE') {
          if (isRequired && isFinalSubmit) {
            const sig = signatures[field.id];
            if (!sig || !sig.signatureDataUrl) {
              errors[field.id] = `${field.label} requires an official digital signature.`;
            }
          }
          continue;
        }

        // Required check
        const isEmpty =
          value === undefined ||
          value === null ||
          value === '' ||
          (Array.isArray(value) && value.length === 0);

        if (isRequired && isEmpty) {
          errors[field.id] = valRules.customErrorMessage || `${field.label} is required.`;
          continue;
        }

        if (isEmpty) continue; // If optional and empty, skip further value validation

        // String length checks
        if (typeof value === 'string') {
          if (valRules.minLength && value.trim().length < valRules.minLength) {
            errors[field.id] = `${field.label} must be at least ${valRules.minLength} characters.`;
          }
          if (valRules.maxLength && value.trim().length > valRules.maxLength) {
            errors[field.id] = `${field.label} cannot exceed ${valRules.maxLength} characters.`;
          }
          if (valRules.regexPattern) {
            try {
              const regex = new RegExp(valRules.regexPattern);
              if (!regex.test(value)) {
                errors[field.id] = valRules.customErrorMessage || `Invalid format for ${field.label}.`;
              }
            } catch (e) {
              // Ignore malformed regex pattern
            }
          }
        }

        // Numeric checks
        if (['NUMBER', 'CURRENCY', 'PERCENTAGE'].includes(field.type)) {
          const num = Number(value);
          if (isNaN(num)) {
            errors[field.id] = `${field.label} must be a valid number.`;
          } else {
            if (valRules.minValue !== undefined && num < valRules.minValue) {
              errors[field.id] = `${field.label} cannot be less than ${valRules.minValue}.`;
            }
            if (valRules.maxValue !== undefined && num > valRules.maxValue) {
              errors[field.id] = `${field.label} cannot exceed ${valRules.maxValue}.`;
            }
          }
        }
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Calculates page-by-page and overall form completion percentage.
 */
export function calculateFormProgress(params: {
  schema: FormSchemaDefinition;
  responses: Record<string, any>;
  signatures?: Record<string, SignatureCaptureData>;
}): {
  overallPercentage: number;
  pageProgress: { pageIndex: number; title: string; completed: number; total: number; percentage: number }[];
} {
  const { schema, responses, signatures = {} } = params;

  let totalRequiredFields = 0;
  let totalCompletedFields = 0;

  const pageProgress = (schema.pages || []).map((page, pageIndex) => {
    let pageRequired = 0;
    let pageCompleted = 0;

    for (const section of page.sections || []) {
      for (const field of section.fields || []) {
        if (!evaluateFieldVisibility(field, responses)) continue;
        if (['HEADING', 'DESCRIPTION', 'DIVIDER'].includes(field.type)) continue;

        if (field.required || field.validation?.required) {
          pageRequired++;
          totalRequiredFields++;

          if (field.type === 'SIGNATURE') {
            if (signatures[field.id]?.signatureDataUrl) {
              pageCompleted++;
              totalCompletedFields++;
            }
          } else {
            const val = responses[field.id];
            if (val !== undefined && val !== null && val !== '' && (!Array.isArray(val) || val.length > 0)) {
              pageCompleted++;
              totalCompletedFields++;
            }
          }
        }
      }
    }

    const percentage = pageRequired > 0 ? Math.round((pageCompleted / pageRequired) * 100) : 100;
    return {
      pageIndex,
      title: page.title,
      completed: pageCompleted,
      total: pageRequired,
      percentage,
    };
  });

  const overallPercentage =
    totalRequiredFields > 0
      ? Math.round((totalCompletedFields / totalRequiredFields) * 100)
      : 100;

  return {
    overallPercentage,
    pageProgress,
  };
}

/**
 * Evaluates dynamic calculated field formula (e.g. "{prop_value} * 0.8" or "{monthly_salary} * 12").
 */
export function evaluateCalculatedField(
  formula: string,
  responses: Record<string, any>
): number {
  if (!formula) return 0;
  try {
    let evaluatedExpr = formula;
    const matches = formula.match(/\{([a-zA-Z0-9_]+)\}/g) || [];

    for (const match of matches) {
      const fieldId = match.slice(1, -1);
      const val = Number(responses[fieldId] || 0);
      evaluatedExpr = evaluatedExpr.replace(new RegExp(match, 'g'), String(val));
    }

    // Safe mathematical evaluation (only numbers, operators, parens allowed)
    if (/^[0-9+\-*/().\s]+$/.test(evaluatedExpr)) {
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${evaluatedExpr})`)();
      return typeof result === 'number' && !isNaN(result) ? Math.round(result * 100) / 100 : 0;
    }
    return 0;
  } catch (e) {
    return 0;
  }
}
