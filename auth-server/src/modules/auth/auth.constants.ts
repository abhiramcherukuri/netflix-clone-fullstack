export const AUTH_MESSAGES = {
  FORGOT_PASSWORD_SUCCESS:
    'If an account exists with this email, a password reset link has been sent.',
  RESEND_VERIFICATION_SUCCESS:
    'If an account exists with this email and requires verification, a new link has been sent.',
  EMAIL_VERIFIED_SUCCESS: 'Email verified successfully. Your account is now active.',
  PASSWORD_RESET_SUCCESS:
    'Password has been reset successfully. You can now log in with your new password.',
  INVALID_OR_EXPIRED_TOKEN: 'Invalid or expired token link.',
  USER_NOT_FOUND: 'User account associated with this token was not found.',
  PASSWORD_RESET_FAILED: 'Failed to reset password. Please try again.',
  FORGOT_PASSWORD_FAILED: 'Failed to request reset. Please try again.',
  EMAIL_VERIFICATION_FAILED: 'Email verification failed or token expired.',
} as const;
