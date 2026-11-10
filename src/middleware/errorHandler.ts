import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  // Only log detailed stack traces in non-test environments
  if (process.env.NODE_ENV !== 'test') {
    console.error('[API Error]:', err.message || err);
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const key = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
    const val = err.keyValue ? err.keyValue[key] : '';
    return res.status(409).json({
      success: false,
      message: `A record with ${key} '${val}' already exists. Please choose a different ${key}.`,
      field: key,
    });
  }

  // Mongoose CastError (invalid ObjectId or value type)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid value '${err.value}' for field '${err.path}'.`,
      field: err.path,
    });
  }

  // Mongoose Schema ValidationError
  if (err.name === 'ValidationError') {
    const details = Object.keys(err.errors || {}).map((field) => ({
      field,
      message: err.errors[field].message,
    }));

    return res.status(400).json({
      success: false,
      message: 'Database schema validation failed',
      errors: details,
    });
  }

  // Standard or custom HTTP error
  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
  const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred on the server. Please try again later.'
    : (err.message || 'Internal Server Error');

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
