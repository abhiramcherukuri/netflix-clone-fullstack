import rateLimit from 'express-rate-limit';

export const RATE_LIMIT_CONFIG = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  GLOBAL_MAX_REQUESTS: 100,
  AUTH_MAX_REQUESTS: 10,
  ERROR_CODES: {
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    TOO_MANY_AUTH_ATTEMPTS: 'TOO_MANY_AUTH_ATTEMPTS',
  },
} as const;

// 1. General Rate Limiter (Applied globally to all routes)
export const globalRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
  max: RATE_LIMIT_CONFIG.GLOBAL_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: RATE_LIMIT_CONFIG.ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Too many requests from this IP, please try again after 15 minutes',
    },
  },
});

// 2. Strict Auth Rate Limiter (Applied specifically to /login and /register)
export const authRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
  max: RATE_LIMIT_CONFIG.AUTH_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: RATE_LIMIT_CONFIG.ERROR_CODES.TOO_MANY_AUTH_ATTEMPTS,
      message:
        'Too many login/registration attempts from this IP. Please try again after 15 minutes.',
    },
  },
});
