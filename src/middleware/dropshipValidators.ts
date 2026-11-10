import { RequestHandler } from 'express';
import {
  ValidationErrorItem,
  sendValidationError,
  isObject,
  isNonEmptyString,
  parseNumeric,
} from './validate';

const VALID_SUPPLIER_STATUSES = ['connected', 'syncing', 'offline'];

/**
 * Validates the supplier `:id` parameter.
 */
export const validateSupplierId: RequestHandler = (req, res, next) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || id.trim() === '') {
    return sendValidationError(res, [
      { field: 'id', message: 'Supplier ID parameter is required and cannot be empty' },
    ]);
  }
  req.params.id = id.trim();
  next();
};

/**
 * Validates request payload for creating a supplier (POST /api/dropship/suppliers).
 */
export const validateCreateSupplier: RequestHandler = (req, res, next) => {
  const errors: ValidationErrorItem[] = [];
  const body = req.body;

  if (!isObject(body)) {
    return sendValidationError(res, [
      { field: 'body', message: 'Request body must be a valid JSON object' },
    ]);
  }

  // Required: name (string, 2 - 100 chars)
  if (!isNonEmptyString(body.name, 2, 100)) {
    errors.push({
      field: 'name',
      message: 'Supplier name is required and must be between 2 and 100 characters',
    });
  }

  // Required: category (string)
  if (!isNonEmptyString(body.category, 1, 100)) {
    errors.push({
      field: 'category',
      message: 'Supplier category is required and cannot be empty',
    });
  }

  // Optional: status ('connected' | 'syncing' | 'offline')
  if (body.status !== undefined && !VALID_SUPPLIER_STATUSES.includes(body.status)) {
    errors.push({
      field: 'status',
      message: `Status must be one of: ${VALID_SUPPLIER_STATUSES.join(', ')}`,
    });
  }

  // Optional: leadTimeHours (number >= 0)
  if (body.leadTimeHours !== undefined && body.leadTimeHours !== null && body.leadTimeHours !== '') {
    const hours = parseNumeric(body.leadTimeHours);
    if (hours === null || hours < 0) {
      errors.push({
        field: 'leadTimeHours',
        message: 'Lead time hours must be a non-negative number',
      });
    } else {
      body.leadTimeHours = hours;
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};

/**
 * Validates request payload for updating a supplier (PUT /api/dropship/suppliers/:id).
 */
export const validateUpdateSupplier: RequestHandler = (req, res, next) => {
  const errors: ValidationErrorItem[] = [];
  const body = req.body;

  if (!isObject(body) || Object.keys(body).length === 0) {
    return sendValidationError(res, [
      { field: 'body', message: 'Request body must contain at least one field to update' },
    ]);
  }

  // Strip internal immutable identifiers
  if ('_id' in body) delete body._id;
  if ('__v' in body) delete body.__v;

  if (body.name !== undefined && !isNonEmptyString(body.name, 2, 100)) {
    errors.push({
      field: 'name',
      message: 'Supplier name must be between 2 and 100 characters',
    });
  }

  if (body.category !== undefined && !isNonEmptyString(body.category, 1, 100)) {
    errors.push({
      field: 'category',
      message: 'Supplier category cannot be empty',
    });
  }

  if (body.status !== undefined && !VALID_SUPPLIER_STATUSES.includes(body.status)) {
    errors.push({
      field: 'status',
      message: `Status must be one of: ${VALID_SUPPLIER_STATUSES.join(', ')}`,
    });
  }

  if (body.leadTimeHours !== undefined && body.leadTimeHours !== null && body.leadTimeHours !== '') {
    const hours = parseNumeric(body.leadTimeHours);
    if (hours === null || hours < 0) {
      errors.push({
        field: 'leadTimeHours',
        message: 'Lead time hours must be a non-negative number',
      });
    } else {
      body.leadTimeHours = hours;
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};

