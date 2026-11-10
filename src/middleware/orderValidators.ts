import { RequestHandler } from 'express';
import {
  ValidationErrorItem,
  sendValidationError,
  isObject,
  isNonEmptyString,
  parseNumeric,
  isValidEmail,
} from './validate';

const VALID_ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

/**
 * Validates the `:id` parameter for order lookup, update, and deletion.
 */
export const validateOrderId: RequestHandler = (req, res, next) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || id.trim() === '') {
    return sendValidationError(res, [
      { field: 'id', message: 'Order ID or tracking number parameter is required and cannot be empty' },
    ]);
  }
  req.params.id = id.trim();
  next();
};

/**
 * Validates request payload for creating an order (POST /api/orders).
 */
export const validateCreateOrder: RequestHandler = (req, res, next) => {
  const errors: ValidationErrorItem[] = [];
  const body = req.body;

  if (!isObject(body)) {
    return sendValidationError(res, [
      { field: 'body', message: 'Request body must be a valid JSON object' },
    ]);
  }

  // Required: items (non-empty array)
  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.push({
      field: 'items',
      message: 'Order must contain at least one item',
    });
  } else {
    body.items.forEach((item: any, index: number) => {
      if (!isObject(item)) {
        errors.push({ field: `items[${index}]`, message: 'Order item must be an object' });
        return;
      }
      if (!isNonEmptyString(item.productId)) {
        errors.push({ field: `items[${index}].productId`, message: 'Product ID is required for each order item' });
      }
      if (!isNonEmptyString(item.title)) {
        errors.push({ field: `items[${index}].title`, message: 'Product title is required for each order item' });
      }
      const price = parseNumeric(item.price);
      if (price === null || price < 0) {
        errors.push({ field: `items[${index}].price`, message: 'Item price must be a non-negative number' });
      } else {
        item.price = price;
      }
      const quantity = parseNumeric(item.quantity);
      if (quantity === null || quantity < 1 || !Number.isInteger(quantity)) {
        errors.push({ field: `items[${index}].quantity`, message: 'Item quantity must be an integer >= 1' });
      } else {
        item.quantity = quantity;
      }
    });
  }

  // Required: shippingAddress
  if (!isObject(body.shippingAddress)) {
    errors.push({
      field: 'shippingAddress',
      message: 'Shipping address object is required',
    });
  } else {
    const addr = body.shippingAddress;
    if (!isNonEmptyString(addr.firstName)) {
      errors.push({ field: 'shippingAddress.firstName', message: 'First name is required' });
    }
    if (!isNonEmptyString(addr.lastName)) {
      errors.push({ field: 'shippingAddress.lastName', message: 'Last name is required' });
    }
    if (!isValidEmail(addr.email)) {
      errors.push({ field: 'shippingAddress.email', message: 'Valid email address is required' });
    }
    if (!isNonEmptyString(addr.addressLine1)) {
      errors.push({ field: 'shippingAddress.addressLine1', message: 'Address line 1 is required' });
    }
    if (!isNonEmptyString(addr.city)) {
      errors.push({ field: 'shippingAddress.city', message: 'City is required' });
    }
    if (!isNonEmptyString(addr.country)) {
      errors.push({ field: 'shippingAddress.country', message: 'Country is required' });
    }
  }

  // Optional: numeric totals
  if (body.subtotal !== undefined) {
    const subtotal = parseNumeric(body.subtotal);
    if (subtotal === null || subtotal < 0) {
      errors.push({ field: 'subtotal', message: 'Subtotal must be a non-negative number' });
    } else {
      body.subtotal = subtotal;
    }
  }

  if (body.total !== undefined) {
    const total = parseNumeric(body.total);
    if (total === null || total < 0) {
      errors.push({ field: 'total', message: 'Total must be a non-negative number' });
    } else {
      body.total = total;
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};

/**
 * Validates request payload for updating order status (PATCH /api/orders/:id/status).
 */
export const validateUpdateOrderStatus: RequestHandler = (req, res, next) => {
  const errors: ValidationErrorItem[] = [];
  const body = req.body;

  if (!isObject(body)) {
    return sendValidationError(res, [
      { field: 'body', message: 'Request body must be a valid JSON object' },
    ]);
  }

  if (!isNonEmptyString(body.status)) {
    errors.push({
      field: 'status',
      message: 'Order status is required and cannot be empty',
    });
  } else if (!VALID_ORDER_STATUSES.includes(body.status.toLowerCase())) {
    errors.push({
      field: 'status',
      message: `Invalid order status '${body.status}'. Must be one of: ${VALID_ORDER_STATUSES.join(', ')}`,
    });
  } else {
    body.status = body.status.toLowerCase();
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};

