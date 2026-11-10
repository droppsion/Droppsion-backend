import { RequestHandler } from 'express';
import {
  ValidationErrorItem,
  sendValidationError,
  isObject,
  isNonEmptyString,
  parseNumeric,
} from './validate';

/**
 * Validates the `id` param for product lookup, update, delete, and status patch.
 */
export const validateProductId: RequestHandler = (req, res, next) => {
  const { id } = req.params;
  if (!id || typeof id !== 'string' || id.trim() === '') {
    return sendValidationError(res, [
      { field: 'id', message: 'Product ID parameter is required and cannot be empty' },
    ]);
  }
  req.params.id = id.trim();
  next();
};

/**
 * Validates the `slug` param for product lookup.
 */
export const validateProductSlug: RequestHandler = (req, res, next) => {
  const { slug } = req.params;
  if (!slug || typeof slug !== 'string' || slug.trim() === '') {
    return sendValidationError(res, [
      { field: 'slug', message: 'Product slug parameter is required and cannot be empty' },
    ]);
  }
  req.params.slug = slug.trim();
  next();
};

/**
 * Validates request payload for creating a product (POST /api/products).
 */
export const validateCreateProduct: RequestHandler = (req, res, next) => {
  const errors: ValidationErrorItem[] = [];
  const body = req.body;

  if (!isObject(body)) {
    return sendValidationError(res, [
      { field: 'body', message: 'Request body must be a valid JSON object' },
    ]);
  }

  // Required: title (string, 2 - 200 chars)
  if (!isNonEmptyString(body.title, 2, 200)) {
    errors.push({
      field: 'title',
      message: 'Title is required and must be between 2 and 200 characters',
    });
  }

  // Required: price (non-negative number)
  const price = parseNumeric(body.price);
  if (price === null || price < 0) {
    errors.push({
      field: 'price',
      message: 'Price is required and must be a non-negative number',
    });
  } else {
    body.price = price;
  }

  // Required: category (non-empty string)
  if (!isNonEmptyString(body.category, 1, 100)) {
    errors.push({
      field: 'category',
      message: 'Category is required and cannot be empty',
    });
  }

  // Optional: originalPrice (number >= 0)
  if (body.originalPrice !== undefined && body.originalPrice !== null && body.originalPrice !== '') {
    const origPrice = parseNumeric(body.originalPrice);
    if (origPrice === null || origPrice < 0) {
      errors.push({
        field: 'originalPrice',
        message: 'Original price must be a non-negative number',
      });
    } else {
      body.originalPrice = origPrice;
    }
  }

  // Optional: stockQuantity (integer >= 0)
  if (body.stockQuantity !== undefined && body.stockQuantity !== null && body.stockQuantity !== '') {
    const stock = parseNumeric(body.stockQuantity);
    if (stock === null || stock < 0 || !Number.isInteger(stock)) {
      errors.push({
        field: 'stockQuantity',
        message: 'Stock quantity must be an integer greater than or equal to 0',
      });
    } else {
      body.stockQuantity = stock;
    }
  }

  // Optional: badge
  if (body.badge !== undefined && body.badge !== null && body.badge !== '') {
    if (!['NEW', 'SALE', 'BESTSELLER'].includes(body.badge)) {
      errors.push({
        field: 'badge',
        message: "Badge must be one of 'NEW', 'SALE', 'BESTSELLER', or null",
      });
    }
  }

  // Optional: rating (0 to 5)
  if (body.rating !== undefined && body.rating !== null && body.rating !== '') {
    const rating = parseNumeric(body.rating);
    if (rating === null || rating < 0 || rating > 5) {
      errors.push({
        field: 'rating',
        message: 'Rating must be a number between 0 and 5',
      });
    } else {
      body.rating = rating;
    }
  }

  // Optional: reviewCount (integer >= 0)
  if (body.reviewCount !== undefined && body.reviewCount !== null && body.reviewCount !== '') {
    const revCount = parseNumeric(body.reviewCount);
    if (revCount === null || revCount < 0 || !Number.isInteger(revCount)) {
      errors.push({
        field: 'reviewCount',
        message: 'Review count must be an integer >= 0',
      });
    } else {
      body.reviewCount = revCount;
    }
  }

  // Optional: inStock (boolean)
  if (body.inStock !== undefined && typeof body.inStock !== 'boolean') {
    errors.push({ field: 'inStock', message: 'inStock must be a boolean' });
  }

  // Optional: isActive (boolean)
  if (body.isActive !== undefined && typeof body.isActive !== 'boolean') {
    errors.push({ field: 'isActive', message: 'isActive must be a boolean' });
  }

  // Optional: images (array of strings)
  if (body.images !== undefined) {
    if (!Array.isArray(body.images)) {
      errors.push({ field: 'images', message: 'Images must be an array of image URL strings' });
    } else {
      const hasInvalid = body.images.some((img: any) => typeof img !== 'string' || img.trim() === '');
      if (hasInvalid) {
        errors.push({ field: 'images', message: 'All items in images array must be non-empty strings' });
      }
    }
  }

  // Optional: variants (array of variant objects)
  if (body.variants !== undefined) {
    if (!Array.isArray(body.variants)) {
      errors.push({ field: 'variants', message: 'Variants must be an array of objects' });
    } else {
      body.variants.forEach((v: any, index: number) => {
        if (!isObject(v)) {
          errors.push({ field: `variants[${index}]`, message: 'Variant must be an object' });
          return;
        }
        if (!isNonEmptyString(v.name)) {
          errors.push({ field: `variants[${index}].name`, message: 'Variant name is required' });
        }
        if (!['color', 'size', 'material'].includes(v.type)) {
          errors.push({
            field: `variants[${index}].type`,
            message: "Variant type must be 'color', 'size', or 'material'",
          });
        }
        if (!isNonEmptyString(v.value)) {
          errors.push({ field: `variants[${index}].value`, message: 'Variant value is required' });
        }
        if (v.priceModifier !== undefined) {
          const mod = parseNumeric(v.priceModifier);
          if (mod === null) {
            errors.push({
              field: `variants[${index}].priceModifier`,
              message: 'Variant priceModifier must be a number',
            });
          } else {
            v.priceModifier = mod;
          }
        }
        if (v.inStock !== undefined && typeof v.inStock !== 'boolean') {
          errors.push({
            field: `variants[${index}].inStock`,
            message: 'Variant inStock must be a boolean',
          });
        }
      });
    }
  }

  // Optional: tags (array of strings)
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags) || body.tags.some((t: any) => typeof t !== 'string')) {
      errors.push({ field: 'tags', message: 'Tags must be an array of strings' });
    }
  }

  // Optional: features (array of strings)
  if (body.features !== undefined) {
    if (!Array.isArray(body.features) || body.features.some((f: any) => typeof f !== 'string')) {
      errors.push({ field: 'features', message: 'Features must be an array of strings' });
    }
  }

  // Optional: dropship details
  if (body.dropship !== undefined) {
    if (!isObject(body.dropship)) {
      errors.push({ field: 'dropship', message: 'Dropship details must be an object' });
    } else {
      if (body.dropship.supplierCost !== undefined) {
        const cost = parseNumeric(body.dropship.supplierCost);
        if (cost === null || cost < 0) {
          errors.push({
            field: 'dropship.supplierCost',
            message: 'Supplier cost must be a non-negative number',
          });
        } else {
          body.dropship.supplierCost = cost;
        }
      }
      if (body.dropship.marginPercentage !== undefined) {
        const margin = parseNumeric(body.dropship.marginPercentage);
        if (margin === null) {
          errors.push({
            field: 'dropship.marginPercentage',
            message: 'Margin percentage must be a number',
          });
        }
      }
      if (
        body.dropship.syncStatus !== undefined &&
        !['active', 'syncing', 'delayed'].includes(body.dropship.syncStatus)
      ) {
        errors.push({
          field: 'dropship.syncStatus',
          message: "Sync status must be 'active', 'syncing', or 'delayed'",
        });
      }
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};

/**
 * Validates request payload for updating a product (PUT /api/products/:id).
 */
export const validateUpdateProduct: RequestHandler = (req, res, next) => {
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
  if ('id' in body && body.id !== req.params.id) {
    errors.push({
      field: 'id',
      message: 'Product ID cannot be modified via update endpoint',
    });
  }

  // title: if provided, must be string 2 - 200 chars
  if (body.title !== undefined) {
    if (!isNonEmptyString(body.title, 2, 200)) {
      errors.push({
        field: 'title',
        message: 'Title must be between 2 and 200 characters',
      });
    }
  }

  // price: if provided, must be number >= 0
  if (body.price !== undefined) {
    const price = parseNumeric(body.price);
    if (price === null || price < 0) {
      errors.push({
        field: 'price',
        message: 'Price must be a non-negative number',
      });
    } else {
      body.price = price;
    }
  }

  // category: if provided, must be non-empty string
  if (body.category !== undefined) {
    if (!isNonEmptyString(body.category, 1, 100)) {
      errors.push({
        field: 'category',
        message: 'Category cannot be empty',
      });
    }
  }

  // originalPrice: if provided, must be number >= 0
  if (body.originalPrice !== undefined && body.originalPrice !== null && body.originalPrice !== '') {
    const origPrice = parseNumeric(body.originalPrice);
    if (origPrice === null || origPrice < 0) {
      errors.push({
        field: 'originalPrice',
        message: 'Original price must be a non-negative number',
      });
    } else {
      body.originalPrice = origPrice;
    }
  }

  // stockQuantity: if provided, must be integer >= 0
  if (body.stockQuantity !== undefined && body.stockQuantity !== null && body.stockQuantity !== '') {
    const stock = parseNumeric(body.stockQuantity);
    if (stock === null || stock < 0 || !Number.isInteger(stock)) {
      errors.push({
        field: 'stockQuantity',
        message: 'Stock quantity must be an integer >= 0',
      });
    } else {
      body.stockQuantity = stock;
    }
  }

  // badge: if provided
  if (body.badge !== undefined && body.badge !== null && body.badge !== '') {
    if (!['NEW', 'SALE', 'BESTSELLER'].includes(body.badge)) {
      errors.push({
        field: 'badge',
        message: "Badge must be one of 'NEW', 'SALE', 'BESTSELLER', or null",
      });
    }
  }

  // rating: if provided, 0 to 5
  if (body.rating !== undefined && body.rating !== null && body.rating !== '') {
    const rating = parseNumeric(body.rating);
    if (rating === null || rating < 0 || rating > 5) {
      errors.push({
        field: 'rating',
        message: 'Rating must be a number between 0 and 5',
      });
    } else {
      body.rating = rating;
    }
  }

  // reviewCount: if provided, integer >= 0
  if (body.reviewCount !== undefined && body.reviewCount !== null && body.reviewCount !== '') {
    const revCount = parseNumeric(body.reviewCount);
    if (revCount === null || revCount < 0 || !Number.isInteger(revCount)) {
      errors.push({
        field: 'reviewCount',
        message: 'Review count must be an integer >= 0',
      });
    } else {
      body.reviewCount = revCount;
    }
  }

  // inStock: if provided, must be boolean
  if (body.inStock !== undefined && typeof body.inStock !== 'boolean') {
    errors.push({ field: 'inStock', message: 'inStock must be a boolean' });
  }

  // isActive: if provided, must be boolean
  if (body.isActive !== undefined && typeof body.isActive !== 'boolean') {
    errors.push({ field: 'isActive', message: 'isActive must be a boolean' });
  }

  // images: if provided, must be array of strings
  if (body.images !== undefined) {
    if (!Array.isArray(body.images)) {
      errors.push({ field: 'images', message: 'Images must be an array of image URL strings' });
    } else {
      const hasInvalid = body.images.some((img: any) => typeof img !== 'string' || img.trim() === '');
      if (hasInvalid) {
        errors.push({ field: 'images', message: 'All items in images array must be non-empty strings' });
      }
    }
  }

  // variants: if provided
  if (body.variants !== undefined) {
    if (!Array.isArray(body.variants)) {
      errors.push({ field: 'variants', message: 'Variants must be an array of objects' });
    } else {
      body.variants.forEach((v: any, index: number) => {
        if (!isObject(v)) {
          errors.push({ field: `variants[${index}]`, message: 'Variant must be an object' });
          return;
        }
        if (v.name !== undefined && !isNonEmptyString(v.name)) {
          errors.push({ field: `variants[${index}].name`, message: 'Variant name cannot be empty' });
        }
        if (v.type !== undefined && !['color', 'size', 'material'].includes(v.type)) {
          errors.push({
            field: `variants[${index}].type`,
            message: "Variant type must be 'color', 'size', or 'material'",
          });
        }
        if (v.value !== undefined && !isNonEmptyString(v.value)) {
          errors.push({ field: `variants[${index}].value`, message: 'Variant value cannot be empty' });
        }
        if (v.priceModifier !== undefined) {
          const mod = parseNumeric(v.priceModifier);
          if (mod === null) {
            errors.push({
              field: `variants[${index}].priceModifier`,
              message: 'Variant priceModifier must be a number',
            });
          } else {
            v.priceModifier = mod;
          }
        }
        if (v.inStock !== undefined && typeof v.inStock !== 'boolean') {
          errors.push({
            field: `variants[${index}].inStock`,
            message: 'Variant inStock must be a boolean',
          });
        }
      });
    }
  }

  // tags: if provided, array of strings
  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags) || body.tags.some((t: any) => typeof t !== 'string')) {
      errors.push({ field: 'tags', message: 'Tags must be an array of strings' });
    }
  }

  // features: if provided, array of strings
  if (body.features !== undefined) {
    if (!Array.isArray(body.features) || body.features.some((f: any) => typeof f !== 'string')) {
      errors.push({ field: 'features', message: 'Features must be an array of strings' });
    }
  }

  // dropship: if provided
  if (body.dropship !== undefined) {
    if (!isObject(body.dropship)) {
      errors.push({ field: 'dropship', message: 'Dropship details must be an object' });
    } else {
      if (body.dropship.supplierCost !== undefined) {
        const cost = parseNumeric(body.dropship.supplierCost);
        if (cost === null || cost < 0) {
          errors.push({
            field: 'dropship.supplierCost',
            message: 'Supplier cost must be a non-negative number',
          });
        } else {
          body.dropship.supplierCost = cost;
        }
      }
      if (body.dropship.marginPercentage !== undefined) {
        const margin = parseNumeric(body.dropship.marginPercentage);
        if (margin === null) {
          errors.push({
            field: 'dropship.marginPercentage',
            message: 'Margin percentage must be a number',
          });
        }
      }
      if (
        body.dropship.syncStatus !== undefined &&
        !['active', 'syncing', 'delayed'].includes(body.dropship.syncStatus)
      ) {
        errors.push({
          field: 'dropship.syncStatus',
          message: "Sync status must be 'active', 'syncing', or 'delayed'",
        });
      }
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};

/**
 * Validates request payload for toggling product status (PATCH /api/products/:id/status).
 */
export const validateToggleProductStatus: RequestHandler = (req, res, next) => {
  const errors: ValidationErrorItem[] = [];
  const body = req.body;

  if (body && isObject(body)) {
    if (body.isActive !== undefined && typeof body.isActive !== 'boolean') {
      errors.push({ field: 'isActive', message: 'isActive must be a boolean' });
    }
    if (body.inStock !== undefined && typeof body.inStock !== 'boolean') {
      errors.push({ field: 'inStock', message: 'inStock must be a boolean' });
    }
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};

