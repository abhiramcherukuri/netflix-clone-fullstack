import { Router } from 'express';
import { authController } from './auth.controller.ts';
import { validate, authRateLimiter } from '#middleware';
import { ForgotPasswordSchema, ResetPasswordSchema, TokenParamSchema } from './auth.dto.ts';

const router = Router();

// 1. Verify email via link sent to inbox
router.get(
  '/verify-email/:token',
  authRateLimiter,
  validate(TokenParamSchema, 'params'),
  authController.verifyEmail,
);

// 2. Resend verification email (rate-limited)
router.post(
  '/resend-verification',
  authRateLimiter,
  validate(ForgotPasswordSchema),
  authController.resendVerification,
);

// 3. Initiate forgot password request (rate-limited)
router.post(
  '/forgot-password',
  authRateLimiter,
  validate(ForgotPasswordSchema),
  authController.forgotPassword,
);

// 4. Reset password with new credentials (rate-limited)
router.post(
  '/reset-password/:token',
  authRateLimiter,
  validate(TokenParamSchema, 'params'),
  validate(ResetPasswordSchema),
  authController.resetPassword,
);

// Render Forgot Password EJS View in Browser
router.get('/forgot-password', (req, res) => {
  const uid = typeof req.query.uid === 'string' ? req.query.uid : null;
  res.render('forgot-password', {
    error: null,
    message: null,
    email: '',
    uid,
  });
});

// Render Reset Password EJS View in Browser
router.get('/reset-password/:token', validate(TokenParamSchema, 'params'), (req, res) => {
  res.render('reset-password', {
    token: req.params.token,
    error: null,
    message: null,
  });
});

export const authRouter = router;
