import type { Response } from 'express';
import crypto from 'node:crypto';
import { env } from '#config';

export const setAuthCookies = (
  res: Response,
  tokens?: { accessToken?: string; refreshToken?: string },
): void => {
  const isProd = env.NODE_ENV === 'production';

  // 1. Generate & set Double-Submit Anti-CSRF Cookie (readable by Angular)
  const csrfToken = crypto.randomBytes(32).toString('hex');
  res.cookie('XSRF-TOKEN', csrfToken, {
    secure: isProd,
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
  });

  // 2. Set HttpOnly Access Token (if provided)
  if (tokens?.accessToken) {
    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
  }

  // 3. Set HttpOnly Refresh Token (if provided)
  if (tokens?.refreshToken) {
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      path: '/oauth',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
};
