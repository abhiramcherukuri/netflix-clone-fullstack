import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import {
  env,
  connectDatabase,
  disconnectDatabase,
  getDatabaseStatus,
  connectRedis,
  disconnectRedis,
  getRedisStatus,
} from './config/index.ts';
import { logger, NotFoundError } from './utils/index.ts';
import { errorHandler } from './middleware/index.ts';

const app = express();

// 1. Security Headers & CORS
app.use(helmet());
app.use(
  cors({
    origin: ['http://localhost:4200'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// 2. Request Body Parsers & Global Rate Limiting
const MAX_REQUEST_BODY_SIZE = '1mb';
const SHUTDOWN_TIMEOUT_MS = 10_000;

app.use(express.json({ limit: MAX_REQUEST_BODY_SIZE }));
app.use(express.urlencoded({ extended: false, limit: MAX_REQUEST_BODY_SIZE }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again after 15 minutes',
    },
  },
});
app.use(globalLimiter);

// 3. Health Check Endpoint
app.get('/health', (_req: Request, res: Response) => {
  const dbStatus = getDatabaseStatus();
  const redisStatus = getRedisStatus();
  const isHealthy = dbStatus === 'connected' && redisStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    service: 'api-server',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    database: dbStatus,
    redis: redisStatus,
  });
});

// 4. 404 Catch-All Route
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
});

// 5. Global Error Handling Middleware (must be registered last)
app.use(errorHandler);

// 6. Bootstrap Server & Graceful Shutdown
const bootstrap = async () => {
  try {
    // Connect to external infrastructure
    await connectDatabase();
    await connectRedis();

    const server = app.listen(env.API_PORT, () => {
      logger.info(
        `🚀 API Server running at http://localhost:${env.API_PORT} in [${env.NODE_ENV}] mode`,
      );
    });

    // Graceful Shutdown Logic

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down API Server gracefully...`);
      server.closeIdleConnections?.();
      server.close(async () => {
        await Promise.all([disconnectDatabase(), disconnectRedis()]);
        logger.info('API Server connections closed. Exiting process.');
        process.exit(0);
      });

      // Force exit after timeout if graceful shutdown hangs
      setTimeout(() => {
        logger.error('Forced termination due to shutdown timeout.');
        process.exit(1);
      }, SHUTDOWN_TIMEOUT_MS).unref();
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection:', { reason });
    });
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', { error: error.stack || error });
    });
  } catch (error) {
    logger.error('Failed to bootstrap API Server:', { error });
    process.exit(1);
  }
};

bootstrap();
