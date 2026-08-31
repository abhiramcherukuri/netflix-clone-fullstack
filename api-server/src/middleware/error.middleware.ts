import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/app-error.ts";
import { logger } from "../utils/logger.ts";
import { env } from "../config/env.ts";

export const errorHandler = (
  err: Error | AppError | any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let errorCode = "INTERNAL_SERVER_ERROR";
  let message = "An unexpected error occurred. Please try again later.";
  let details: unknown = undefined;

  // 1. Handled Operational Errors (AppError instances)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
  }
  // 2. Zod Schema Validation Errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    errorCode = "VALIDATION_ERROR";
    message = "Request validation failed";
    details = err.flatten().fieldErrors;
  }
  // 3. Multer / File Upload Errors (e.g., profile photo too large)
  else if (err.name === "MulterError" || err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    errorCode = "FILE_UPLOAD_ERROR";
    message = err.code === "LIMIT_FILE_SIZE"
      ? "File is too large. Maximum allowed size is 5MB."
      : `File upload error: ${err.message}`;
  }
  // 4. Mongoose CastError (Invalid MongoDB ObjectId format)
  else if (err.name === "CastError") {
    statusCode = 400;
    errorCode = "INVALID_ID";
    message = "Resource not found (invalid identifier format)";
  }
  // 5. Mongoose Duplicate Key Error (Unique Constraint Violation)
  else if ("code" in err && err.code === 11000) {
    statusCode = 409;
    errorCode = "DUPLICATE_RESOURCE";
    message = "A resource with that identifier already exists";
  }
  // 6. Node File System I/O Errors (e.g. missing template file)
  else if (err.code === "ENOENT") {
    logger.error("File system error (File Not Found):", { path: err.path });
    statusCode = 500;
    errorCode = "FILE_NOT_FOUND";
    message = "A required system file was not found.";
  }
  // 7. Unhandled / Programmer Errors
  else {
    logger.error("Unhandled Error Caught in Global Middleware:", {
      message: err.message,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
    });
  }

  // Structured API Error Response
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details ? { details } : {}),
    },
    ...(env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
};