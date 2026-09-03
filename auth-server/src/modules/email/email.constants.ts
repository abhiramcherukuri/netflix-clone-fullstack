export const EMAIL_SUBJECTS = {
  VERIFY_EMAIL: 'Verify your Netflix email address',
  PASSWORD_RESET: 'Reset your Netflix password',
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
