export const OIDC_ERRORS = {
  ACCESS_DENIED: 'access_denied',
  USER_ABORTED: 'End-user aborted interaction',
  UNHANDLED_PROMPT_PREFIX: 'Unhandled interaction prompt: ',
} as const;

export const OIDC_MESSAGES = {
  SESSION_EXPIRED:
    'Your authentication session has expired or is invalid. Please start over from the application.',
  INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
  REGISTRATION_FAILED: 'Registration failed. Please try again.',
} as const;
