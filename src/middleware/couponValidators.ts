import { Request, Response, NextFunction, RequestHandler } from 'express';
import {
  ValidationErrorItem,
  sendValidationError,
  isObject,
  isNonEmptyString,
  parseNumeric,
} from './validate';

/**
 * Validates the `:code` parameter.
 */
export const validateCouponCode: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const { code } = req.params;
  if (!code || typeof code !== 'string' || code.trim() === '') {
    return sendValidationError(res, [
      { field: 'code', message: 'Coupon code parameter is required and cannot be empty' },
    ]);
  }
  req.params.code = code.trim().toUpperCase();
  next();
};

/**
 * Validates request payload for checking/applying a coupon (POST /api/coupons/validate).
 */
export const validateValidateCoupon: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const errors: ValidationErrorItem[] = [];
  const body = req.body;

  if (!isObject(body)) {
    return sendValidationError(res, [
      { field: 'body', message: 'Request body must be a valid JSON object' },
    ]);
  }

  if (!isNonEmptyString(body.code, 1, 50)) {
    errors.push({ field: 'code', message: 'Coupon code is required and cannot be empty' });
  }

  if (body.subtotal !== undefined && body.subtotal !== null && body.subtotal !== '') {
    const subtotal = parseNumeric(body.subtotal);
    if (subtotal === null || subtotal < 0) {
      errors.push({ field: 'subtotal', message: 'Cart subtotal must be a non-negative number' });
    } else {
      body.subtotal = subtotal;
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};

/**
 * Validates request payload for creating a coupon (POST /api/coupons).
 */
export const validateCreateCoupon: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const errors: ValidationErrorItem[] = [];
  const body = req.body;

  if (!isObject(body)) {
    return sendValidationError(res, [
      { field: 'body', message: 'Request body must be a valid JSON object' },
    ]);
  }

  // Required: code (string, 2 - 30 chars)
  if (!isNonEmptyString(body.code, 2, 30)) {
    errors.push({
      field: 'code',
      message: 'Coupon code is required and must be between 2 and 30 characters',
    });
  }

  // Required: discountType ('percentage' | 'fixed')
  if (!['percentage', 'fixed'].includes(body.discountType)) {
    errors.push({
      field: 'discountType',
      message: "Discount type must be either 'percentage' or 'fixed'",
    });
  }

  // Required: discountValue (number > 0)
  const discountValue = parseNumeric(body.discountValue);
  if (discountValue === null || discountValue <= 0) {
    errors.push({
      field: 'discountValue',
      message: 'Discount value must be a number greater than 0',
    });
  } else if (body.discountType === 'percentage' && discountValue > 100) {
    errors.push({
      field: 'discountValue',
      message: 'Percentage discount cannot exceed 100%',
    });
  } else {
    body.discountValue = discountValue;
  }

  // Optional: minPurchaseAmount (number >= 0)
  if (body.minPurchaseAmount !== undefined && body.minPurchaseAmount !== null && body.minPurchaseAmount !== '') {
    const minAmount = parseNumeric(body.minPurchaseAmount);
    if (minAmount === null || minAmount < 0) {
      errors.push({
        field: 'minPurchaseAmount',
        message: 'Minimum purchase amount must be a non-negative number',
      });
    } else {
      body.minPurchaseAmount = minAmount;
    }
  }

  // Optional: active (boolean)
  if (body.active !== undefined && typeof body.active !== 'boolean') {
    errors.push({ field: 'active', message: 'Active must be a boolean' });
  }

  // Optional: expiresAt (valid date string)
  if (body.expiresAt !== undefined && body.expiresAt !== null && body.expiresAt !== '') {
    const timestamp = Date.parse(body.expiresAt);
    if (isNaN(timestamp)) {
      errors.push({
        field: 'expiresAt',
        message: 'Expiration date must be a valid ISO date string',
      });
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};

/**
 * Validates request payload for updating a coupon (PUT /api/coupons/:code).
 */
export const validateUpdateCoupon: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const errors: ValidationErrorItem[] = [];
  const body = req.body;

  if (!isObject(body) || Object.keys(body).length === 0) {
    return sendValidationError(res, [
      { field: 'body', message: 'Request body must contain at least one field to update' },
    ]);
  }

  // Strip internal immutable MongoDB / system identifiers
  if ('_id' in body) delete body._id;
  if ('__v' in body) delete body.__v;

  if (body.discountType !== undefined && !['percentage', 'fixed'].includes(body.discountType)) {
    errors.push({
      field: 'discountType',
      message: "Discount type must be either 'percentage' or 'fixed'",
    });
  }

  if (body.discountValue !== undefined) {
    const discountValue = parseNumeric(body.discountValue);
    if (discountValue === null || discountValue <= 0) {
      errors.push({
        field: 'discountValue',
        message: 'Discount value must be a number greater than 0',
      });
    } else if (body.discountType === 'percentage' && discountValue > 100) {
      errors.push({
        field: 'discountValue',
        message: 'Percentage discount cannot exceed 100%',
      });
    } else {
      body.discountValue = discountValue;
    }
  }

  if (body.minPurchaseAmount !== undefined && body.minPurchaseAmount !== null && body.minPurchaseAmount !== '') {
    const minAmount = parseNumeric(body.minPurchaseAmount);
    if (minAmount === null || minAmount < 0) {
      errors.push({
        field: 'minPurchaseAmount',
        message: 'Minimum purchase amount must be a non-negative number',
      });
    } else {
      body.minPurchaseAmount = minAmount;
    }
  }

  if (body.active !== undefined && typeof body.active !== 'boolean') {
    errors.push({ field: 'active', message: 'Active must be a boolean' });
  }

  if (body.expiresAt !== undefined && body.expiresAt !== null && body.expiresAt !== '') {
    const timestamp = Date.parse(body.expiresAt);
    if (isNaN(timestamp)) {
      errors.push({
        field: 'expiresAt',
        message: 'Expiration date must be a valid ISO date string',
      });
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};
