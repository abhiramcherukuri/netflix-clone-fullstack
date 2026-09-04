import { APP_CONFIG } from '#config';

export const EMAIL_SUBJECTS = {
  VERIFY_EMAIL: `Verify your ${APP_CONFIG.APP_TITLE_SUFFIX} email address`,
  PASSWORD_RESET: `Reset your ${APP_CONFIG.APP_TITLE_SUFFIX} password`,
} as const;

export const EMAIL_TEMPLATES = {
  VERIFY_EMAIL: 'verify-email',
  PASSWORD_RESET: 'password-reset',
} as const;

export const EMAIL_TOKEN_EXPIRIES_SECONDS = {
  VERIFICATION: 24 * 60 * 60, // 24 hours
  PASSWORD_RESET: 15 * 60, // 15 minutes
} as const;

export const EMAIL_REDIS_PREFIXES = {
  VERIFY: 'auth:verify:',
  RESET: 'auth:reset:',
} as const;

export const EMAIL_TOKEN_BYTES = 32;
