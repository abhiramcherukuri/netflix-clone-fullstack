import type { Response } from 'express';
import crypto from 'node:crypto';
import { env } from '#config';

export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  CSRF_TOKEN: 'XSRF-TOKEN',
} as const;

export const COOKIE_MAX_AGE_MS = {
  ACCESS_TOKEN: 15 * 60 * 1000, // 15 minutes
  REFRESH_TOKEN: 7 * 24 * 60 * 60 * 1000, // 7 days
  CSRF_TOKEN: 15 * 60 * 1000, // 15 minutes
} as const;

export const COOKIE_PATHS = {
  REFRESH_TOKEN: '/oauth',
} as const;

const CSRF_TOKEN_BYTES = 32;

export const setAuthCookies = (
  res: Response,
  tokens?: { accessToken?: string; refreshToken?: string },
): void => {
  const isProd = env.NODE_ENV === 'production';

  // 1. Generate & set Double-Submit Anti-CSRF Cookie (readable by Angular)
  const csrfToken = crypto.randomBytes(CSRF_TOKEN_BYTES).toString('hex');
  res.cookie(COOKIE_NAMES.CSRF_TOKEN, csrfToken, {
    secure: isProd,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_MS.CSRF_TOKEN,
  });

  // 2. Set HttpOnly Access Token (if provided)
  if (tokens?.accessToken) {
    res.cookie(COOKIE_NAMES.ACCESS_TOKEN, tokens.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE_MS.ACCESS_TOKEN,
    });
  }

  // 3. Set HttpOnly Refresh Token (if provided)
  if (tokens?.refreshToken) {
    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, tokens.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      path: COOKIE_PATHS.REFRESH_TOKEN,
      maxAge: COOKIE_MAX_AGE_MS.REFRESH_TOKEN,
    });
  }
};
