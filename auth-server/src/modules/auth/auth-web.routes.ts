import { Router } from 'express';
import { authWebController } from './auth-web.controller.ts';
import { authRateLimiter } from '#middleware';

const router = Router();

// Apply auth rate limiter to all recovery web forms
router.use(authRateLimiter);

// 1. Forgot Password Web Page & Submission
router.get('/forgot-password', authWebController.renderForgotPassword);
router.post('/forgot-password', authWebController.handleForgotPassword);

// 2. Reset Password Web Page & Submission
router.get('/reset-password/:token', authWebController.renderResetPassword);
router.post('/reset-password/:token', authWebController.handleResetPassword);

// 3. Email Verification Browser Link
router.get('/verify-email/:token', authWebController.handleVerifyEmail);

export const authWebRouter = router;
