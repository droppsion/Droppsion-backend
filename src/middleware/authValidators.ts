import { RequestHandler } from 'express';
import {
  ValidationErrorItem,
  sendValidationError,
  isObject,
  isNonEmptyString,
  isValidEmail,
} from './validate';

const VALID_ADMIN_ROLES = ['super_admin', 'store_manager', 'logistics_operator'];
const VALID_ADMIN_STATUSES = ['active', 'deactivated'];

/**
 * Validates admin user ID parameter.
 */
export const validateAdminUserId: RequestHandler = (req, res, next) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || id.trim() === '') {
    return sendValidationError(res, [
      { field: 'id', message: 'Admin user ID parameter is required and cannot be empty' },
    ]);
  }
  req.params.id = id.trim();
  next();
};

/**
 * Validates admin login credentials.
 */
export const validateAdminLogin: RequestHandler = (req, res, next) => {
  const errors: ValidationErrorItem[] = [];
  const body = req.body;

  if (!isObject(body)) {
    return sendValidationError(res, [
      { field: 'body', message: 'Request body must be a valid JSON object' },
    ]);
  }

  if (!isValidEmail(body.email)) {
    errors.push({
      field: 'email',
      message: 'A valid admin email address is required',
    });
  }

  if (!isNonEmptyString(body.password, 4, 128)) {
    errors.push({
      field: 'password',
      message: 'Password is required and must be at least 4 characters long',
    });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};

/**
 * Validates request payload for creating an admin user.
 */
export const validateCreateAdminUser: RequestHandler = (req, res, next) => {
  const errors: ValidationErrorItem[] = [];
  const body = req.body;

  if (!isObject(body)) {
    return sendValidationError(res, [
      { field: 'body', message: 'Request body must be a valid JSON object' },
    ]);
  }

  if (!isNonEmptyString(body.name, 2, 100)) {
    errors.push({
      field: 'name',
      message: 'Admin staff name is required and must be between 2 and 100 characters',
    });
  }

  if (!isValidEmail(body.email)) {
    errors.push({
      field: 'email',
      message: 'A valid email address is required for admin staff',
    });
  }

  if (body.role !== undefined && !VALID_ADMIN_ROLES.includes(body.role)) {
    errors.push({
      field: 'role',
      message: 'Role must be one of: ' + VALID_ADMIN_ROLES.join(', '),
    });
  }

  if (body.status !== undefined && !VALID_ADMIN_STATUSES.includes(body.status)) {
    errors.push({
      field: 'status',
      message: 'Status must be one of: ' + VALID_ADMIN_STATUSES.join(', '),
    });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};

/**
 * Validates request payload for updating an admin user.
 */
export const validateUpdateAdminUser: RequestHandler = (req, res, next) => {
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
  if ('id' in body) delete body.id;

  if (body.name !== undefined && !isNonEmptyString(body.name, 2, 100)) {
    errors.push({
      field: 'name',
      message: 'Name must be between 2 and 100 characters',
    });
  }

  if (body.email !== undefined && !isValidEmail(body.email)) {
    errors.push({
      field: 'email',
      message: 'Email must be a valid email address',
    });
  }

  if (body.role !== undefined && !VALID_ADMIN_ROLES.includes(body.role)) {
    errors.push({
      field: 'role',
      message: 'Role must be one of: ' + VALID_ADMIN_ROLES.join(', '),
    });
  }

  if (body.status !== undefined && !VALID_ADMIN_STATUSES.includes(body.status)) {
    errors.push({
      field: 'status',
      message: 'Status must be one of: ' + VALID_ADMIN_STATUSES.join(', '),
    });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};

/**
 * Validates customer login payload.
 */
export const validateCustomerLogin: RequestHandler = (req, res, next) => {
  const errors: ValidationErrorItem[] = [];
  const body = req.body;

  if (!isObject(body)) {
    return sendValidationError(res, [
      { field: 'body', message: 'Request body must be a valid JSON object' },
    ]);
  }

  if (!isValidEmail(body.email)) {
    errors.push({
      field: 'email',
      message: 'A valid email address is required',
    });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};

/**
 * Validates customer registration payload.
 */
export const validateCustomerRegister: RequestHandler = (req, res, next) => {
  const errors: ValidationErrorItem[] = [];
  const body = req.body;

  if (!isObject(body)) {
    return sendValidationError(res, [
      { field: 'body', message: 'Request body must be a valid JSON object' },
    ]);
  }

  if (!isNonEmptyString(body.name, 2, 100)) {
    errors.push({
      field: 'name',
      message: 'Name is required and must be between 2 and 100 characters',
    });
  }

  if (!isValidEmail(body.email)) {
    errors.push({
      field: 'email',
      message: 'A valid email address is required',
    });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};
