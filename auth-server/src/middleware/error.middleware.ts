import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, logger } from '../utils/index.ts';
import { env } from '#config';

interface CustomError {
  name?: string;
  message?: string;
  stack?: string;
  code?: string | number;
  path?: string;
}

export const errorHandler = (
  err: Error | AppError | unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred. Please try again later.';
  let details: unknown = undefined;

  const errorObj = (typeof err === 'object' && err !== null ? err : {}) as CustomError;

  // 1. Handled Operational Errors (AppError instances)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
  }
  // 2. Zod Schema Validation Errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Request validation failed';
    details = err.flatten().fieldErrors;
  }
  // 3. Multer / File Upload Errors
  else if (errorObj.name === 'MulterError' || errorObj.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    errorCode = 'FILE_UPLOAD_ERROR';
    message =
      errorObj.code === 'LIMIT_FILE_SIZE'
        ? 'File is too large. Maximum allowed size is 5MB.'
        : `File upload error: ${errorObj.message || 'Upload failed'}`;
  }
  // 4. Mongoose CastError (Invalid MongoDB ObjectId format)
  else if (errorObj.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_ID';
    message = 'Resource not found (invalid identifier format)';
  }
  // 5. Mongoose Duplicate Key Error (Unique Constraint Violation)
  else if (errorObj.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_RESOURCE';
    message = 'A resource with that identifier already exists';
  }
  // 6. Node File System I/O Errors
  else if (errorObj.code === 'ENOENT') {
    logger.error('File system error (File Not Found):', { path: errorObj.path });
    statusCode = 500;
    errorCode = 'FILE_NOT_FOUND';
    message = 'A required system file was not found.';
  }
  // 7. Unhandled / Programmer Errors
  else {
    const errorStack = err instanceof Error ? err.stack : undefined;
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error('Unhandled Error Caught in Global Middleware:', {
      message: errorMessage,
      stack: errorStack,
      path: req.originalUrl,
      method: req.method,
    });
  }

  const stack = err instanceof Error ? err.stack : undefined;

  // Structured API Error Response
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details ? { details } : {}),
    },
    ...(env.NODE_ENV === 'development' && stack ? { stack } : {}),
  });
};
