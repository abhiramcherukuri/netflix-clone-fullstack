import type { Request, Response, NextFunction } from 'express';
import { logger } from '#utils';

/**
 * Detailed HTTP Request Logging Middleware
 *
 * Tracks every incoming request, measures precise response latency,
 * and logs the outcome with appropriate severity based on status code.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = process.hrtime.bigint();

  // Listen for the response finish event (when all bytes have been sent to client)
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1_000_000;
    const roundedDuration = durationMs.toFixed(2);

    const { method, originalUrl, ip } = req;
    const { statusCode } = res;

    const logMessage = `${method} ${originalUrl} ${statusCode} - ${roundedDuration}ms [IP: ${ip || 'unknown'}]`;

    if (statusCode >= 500) {
      logger.error(`❌ ${logMessage}`);
    } else if (statusCode >= 400) {
      logger.warn(`⚠️ ${logMessage}`);
    } else {
      logger.info(`✅ ${logMessage}`);
    }
  });

  next();
};
