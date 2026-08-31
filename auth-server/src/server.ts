import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env, connectDatabase, disconnectDatabase, getDatabaseStatus, connectRedis, disconnectRedis, getRedisStatus } from "./config/index.ts";
import { logger, NotFoundError } from "./utils/index.ts";
import { errorHandler } from "./middleware/index.ts";

const app = express();

// 1. Security Headers & CORS
app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:4200"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 2. Request Body Parsers & Global Rate Limiting
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests from this IP, please try again after 15 minutes",
    },
  },
});
app.use(globalLimiter);

// 3. Health Check Endpoint
app.get("/health", (_req: Request, res: Response) => {
  const dbStatus = getDatabaseStatus();
  const redisStatus = getRedisStatus();
  const isHealthy = dbStatus === "connected" && redisStatus === "connected";

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "ok" : "degraded",
    service: "auth-server",
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

    const server = app.listen(env.AUTH_PORT, () => {
      logger.info(`🚀 Auth Server running at http://localhost:${env.AUTH_PORT} in [${env.NODE_ENV}] mode`);
    });

    // Graceful Shutdown Logic
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down Auth Server gracefully...`);
      server.close(async () => {
        await Promise.all([disconnectDatabase(), disconnectRedis()]);
        logger.info("Auth Server connections closed. Exiting process.");
        process.exit(0);
      });

      // Force exit after 10 seconds if graceful shutdown hangs
      setTimeout(() => {
        logger.error("Forced termination due to shutdown timeout.");
        process.exit(1);
      }, 10000).unref();
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled Rejection:", { reason });
    });
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception:", { error: error.stack || error });
    });
  } catch (error) {
    logger.error("Failed to bootstrap Auth Server:", { error });
    process.exit(1);
  }
};

bootstrap();