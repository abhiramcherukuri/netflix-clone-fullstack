import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import {
  env,
  APP_CONFIG,
  connectDatabase,
  disconnectDatabase,
  getDatabaseStatus,
  connectRedis,
  disconnectRedis,
  getRedisStatus,
} from '#config';
import { logger, NotFoundError } from '#utils';
import { errorHandler, globalRateLimiter, corsMiddleware, requestLogger } from '#middleware';
import { oidcProvider, keystore, interactionRouter } from '#oauth';
import { usersRouter } from '#modules/users';
import { authRouter, authWebRouter } from '#modules/auth';

const app = express();

// 0. Configure EJS View Engine & Static Assets
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/shared', express.static(path.join(__dirname, '../../shared')));

app.locals.app = APP_CONFIG;

// 1. Security Headers & CORS
app.use(helmet());
app.use(corsMiddleware);
app.use(requestLogger);

const MAX_REQUEST_BODY_SIZE = '1mb';
const SHUTDOWN_TIMEOUT_MS = 10_000;

// 2. Cookie & Body Parsers & Global Rate Limiting
app.use(cookieParser());
app.use(express.json({ limit: MAX_REQUEST_BODY_SIZE }));
app.use(express.urlencoded({ extended: false, limit: MAX_REQUEST_BODY_SIZE }));
app.use(globalRateLimiter);

// 3. Health Check Endpoint
app.get('/health', (_req, res) => {
  const dbStatus = getDatabaseStatus();
  const redisStatus = getRedisStatus();
  const isHealthy = dbStatus === 'connected' && redisStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    service: 'auth-server',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    database: dbStatus,
    redis: redisStatus,
  });
});

// Root Route: Redirects to the Netflix Client Application
app.get('/', (_req, res) => {
  res.redirect(env.AUTH_REDIRECT_URI.replace('/callback', ''));
});

// 4. Feature Routes
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/auth', authRouter); //Pure REST API (100% JSON)
app.use('/auth', authWebRouter); //Pure Web UI (100% HTML EJS)
app.use('/interaction', interactionRouter); //OAuth 2.0 PKCE UI

// 5. OAuth & OIDC Public Endpoints
app.get('/oauth/jwks', (_req, res) => {
  res.status(200).json(keystore.getPublicJwks());
});
app.use(oidcProvider.callback());

// 6. 404 Catch-All Route
app.use((req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
});

// 7. Global Error Handling Middleware (must be registered last)
app.use(errorHandler);

// 7. Bootstrap Server & Graceful Shutdown
const bootstrap = async () => {
  try {
    // Connect to external infrastructure
    await connectDatabase();
    await connectRedis();

    const server = app.listen(env.AUTH_PORT, () => {
      logger.info(
        `🚀 Auth Server running at http://localhost:${env.AUTH_PORT} in [${env.NODE_ENV}] mode`,
      );
    });

    // Graceful Shutdown Logic
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down Auth Server gracefully...`);
      server.closeIdleConnections?.();
      server.close(async () => {
        await Promise.all([disconnectDatabase(), disconnectRedis()]);
        logger.info('Auth Server connections closed. Exiting process.');
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
    logger.error('Failed to bootstrap Auth Server:', { error });
    process.exit(1);
  }
};

bootstrap();
