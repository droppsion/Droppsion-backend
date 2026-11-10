import { RequestHandler } from 'express';
import {
  ValidationErrorItem,
  sendValidationError,
  isObject,
  isNonEmptyString,
  parseNumeric,
} from './validate';

export const validateReviewProductId: RequestHandler = (req, res, next) => {
  const { productId } = req.params;
  if (!productId || typeof productId !== 'string' || productId.trim() === '') {
    return sendValidationError(res, [
      { field: 'productId', message: 'Product ID parameter is required' },
    ]);
  }
  req.params.productId = productId.trim();
  next();
};

export const validateCreateReview: RequestHandler = (req, res, next) => {
  const errors: ValidationErrorItem[] = [];
  const body = req.body;

  if (!isObject(body)) {
    return sendValidationError(res, [
      { field: 'body', message: 'Request body must be a valid JSON object' },
    ]);
  }

  if (!isNonEmptyString(body.author, 2, 100)) {
    errors.push({
      field: 'author',
      message: 'Author name is required and must be between 2 and 100 characters',
    });
  }

  const rating = parseNumeric(body.rating);
  if (rating === null || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    errors.push({
      field: 'rating',
      message: 'Rating must be an integer between 1 and 5 stars',
    });
  } else {
    body.rating = rating;
  }

  if (!isNonEmptyString(body.comment, 3, 2000)) {
    errors.push({
      field: 'comment',
      message: 'Review comment is required and must be at least 3 characters',
    });
  }

  if (body.title !== undefined && !isNonEmptyString(body.title, 1, 150)) {
    errors.push({
      field: 'title',
      message: 'Review title must be between 1 and 150 characters',
    });
  }

  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }

  next();
};
