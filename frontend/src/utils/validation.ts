/**
 * Validation utilities for LMS User, Role, and Branch management
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateRequired(value: string | undefined | null, fieldName: string): ValidationResult {
  if (!value || value.trim().length === 0) {
    return { isValid: false, error: `${fieldName} is required.` };
  }
  return { isValid: true };
}

export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'Email address is required.' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Please enter a valid email address (e.g., name@domain.com).' };
  }
  return { isValid: true };
}

export function validateIndianMobile(mobile: string): ValidationResult {
  if (!mobile || mobile.trim().length === 0) {
    return { isValid: false, error: 'Mobile number is required.' };
  }
  // Standard Indian 10-digit mobile starting with 6, 7, 8, or 9
  const cleaned = mobile.replace(/[^0-9]/g, '');
  if (cleaned.length !== 10) {
    return { isValid: false, error: 'Mobile number must be exactly 10 digits.' };
  }
  if (!/^[6-9]/.test(cleaned)) {
    return { isValid: false, error: 'Indian mobile number must start with 6, 7, 8, or 9.' };
  }
  return { isValid: true };
}

export function validateIndianPinCode(pinCode: string): ValidationResult {
  if (!pinCode || pinCode.trim().length === 0) {
    return { isValid: false, error: 'PIN code is required.' };
  }
  const cleaned = pinCode.replace(/[^0-9]/g, '');
  if (cleaned.length !== 6) {
    return { isValid: false, error: 'PIN code must be a 6-digit Indian postal code.' };
  }
  if (/^0/.test(cleaned)) {
    return { isValid: false, error: 'PIN code cannot start with 0.' };
  }
  return { isValid: true };
}

export function validateEmployeeId(empId: string, existingIds: string[], currentEmpId?: string): ValidationResult {
  if (!empId || empId.trim().length === 0) {
    return { isValid: false, error: 'Employee ID is required.' };
  }
  const trimmed = empId.trim().toUpperCase();
  if (!/^EMP-[0-9]{3,8}$/.test(trimmed)) {
    return { isValid: false, error: 'Employee ID must follow standard format (e.g. EMP-001234).' };
  }
  if (existingIds.includes(trimmed) && trimmed !== currentEmpId?.toUpperCase()) {
    return { isValid: false, error: `Employee ID "${trimmed}" is already assigned to another user.` };
  }
  return { isValid: true };
}

export function validateUsername(username: string, existingUsernames: string[], currentUsername?: string): ValidationResult {
  if (!username || username.trim().length === 0) {
    return { isValid: false, error: 'Username is required.' };
  }
  const trimmed = username.trim().toLowerCase();
  if (trimmed.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long.' };
  }
  if (!/^[a-z0-9._-]+$/.test(trimmed)) {
    return { isValid: false, error: 'Username may only contain lowercase letters, numbers, periods, and hyphens.' };
  }
  if (existingUsernames.includes(trimmed) && trimmed !== currentUsername?.toLowerCase()) {
    return { isValid: false, error: `Username "${trimmed}" is already taken.` };
  }
  return { isValid: true };
}

export function validateBranchCode(code: string, existingCodes: string[], currentCode?: string): ValidationResult {
  if (!code || code.trim().length === 0) {
    return { isValid: false, error: 'Branch Code is required.' };
  }
  const trimmed = code.trim().toUpperCase();
  if (!/^BR-[A-Z]{2,4}-[0-9]{3}$/.test(trimmed)) {
    return { isValid: false, error: 'Branch code format must match BR-XXX-001 (e.g. BR-PNJ-001).' };
  }
  if (existingCodes.includes(trimmed) && trimmed !== currentCode?.toUpperCase()) {
    return { isValid: false, error: `Branch Code "${trimmed}" is already in use.` };
  }
  return { isValid: true };
}

export function validateRoleName(name: string, existingNames: string[], currentName?: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Role Name is required.' };
  }
  const trimmed = name.trim();
  if (trimmed.length < 3) {
    return { isValid: false, error: 'Role Name must be at least 3 characters.' };
  }
  const isDuplicate = existingNames.some(
    (n) => n.toLowerCase() === trimmed.toLowerCase() && n.toLowerCase() !== currentName?.toLowerCase()
  );
  if (isDuplicate) {
    return { isValid: false, error: `A role with the name "${trimmed}" already exists.` };
  }
  return { isValid: true };
}

export function validateDOB(dobString: string): ValidationResult {
  if (!dobString || dobString.trim().length === 0) {
    return { isValid: false, error: 'Date of birth is required.' };
  }
  const date = new Date(dobString);
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Please enter a valid date.' };
  }
  const now = new Date();
  if (date > now) {
    return { isValid: false, error: 'Date of birth cannot be in the future.' };
  }
  // Check minimum age of 18
  const age = now.getFullYear() - date.getFullYear();
  const m = now.getMonth() - date.getMonth();
  const exactAge = m < 0 || (m === 0 && now.getDate() < date.getDate()) ? age - 1 : age;
  if (exactAge < 18) {
    return { isValid: false, error: 'Customer must be at least 18 years of age.' };
  }
  if (exactAge > 100) {
    return { isValid: false, error: 'Please enter a realistic date of birth.' };
  }
  return { isValid: true };
}

export function validateOptionalEmail(email?: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return { isValid: true };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Please enter a valid email address (e.g., name@domain.com).' };
  }
  return { isValid: true };
}

export function validateIFSC(ifsc?: string): ValidationResult {
  if (!ifsc || ifsc.trim().length === 0) {
    return { isValid: true };
  }
  const cleaned = ifsc.trim().toUpperCase();
  // Standard RBI IFSC format: 4 alphabets, 5th character '0', 6 alphanumeric
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifscRegex.test(cleaned)) {
    return { isValid: false, error: 'Invalid IFSC format. Expected 11 characters (e.g. HDFC0000084).' };
  }
  return { isValid: true };
}

export function validateIncome(income: number | string): ValidationResult {
  const num = typeof income === 'string' ? parseFloat(income.replace(/[^0-9.]/g, '')) : income;
  if (isNaN(num) || num < 0) {
    return { isValid: false, error: 'Monthly income must be a valid positive number.' };
  }
  return { isValid: true };
}
