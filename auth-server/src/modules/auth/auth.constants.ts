export const AUTH_MESSAGES = {
  FORGOT_PASSWORD_SUCCESS:
    'If an account exists with this email, a password reset link has been sent.',
  RESEND_VERIFICATION_SUCCESS:
    'If an account exists with this email and requires verification, a new link has been sent.',
  EMAIL_VERIFIED_SUCCESS: 'Email verified successfully. Your account is now active.',
  PASSWORD_RESET_SUCCESS:
    'Password has been reset successfully. You can now log in with your new password.',
  INVALID_OR_EXPIRED_TOKEN: 'Invalid or expired token link.',
} as const;
