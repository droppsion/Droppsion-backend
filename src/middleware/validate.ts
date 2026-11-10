import { Response } from 'express';

export interface ValidationErrorItem {
  field: string;
  message: string;
  value?: any;
}

export const sendValidationError = (res: Response, errors: ValidationErrorItem[]) => {
  const summaryMessage =
    errors.length === 1
      ? errors[0].message
      : `Validation failed: ${errors.map((e) => e.message).join('; ')}`;

  return res.status(400).json({
    success: false,
    message: summaryMessage,
    errors,
  });
};

export const isObject = (val: any): boolean => {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
};

export const isNonEmptyString = (val: any, minLength = 1, maxLength?: number): boolean => {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (trimmed.length < minLength) return false;
  if (maxLength !== undefined && trimmed.length > maxLength) return false;
  return true;
};

export const parseNumeric = (val: any): number | null => {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') {
    return isNaN(val) || !isFinite(val) ? null : val;
  }
  if (typeof val === 'string' && val.trim() !== '') {
    const num = Number(val);
    return isNaN(num) || !isFinite(num) ? null : num;
  }
  return null;
};

export const isValidEmail = (email: any): boolean => {
  if (typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

