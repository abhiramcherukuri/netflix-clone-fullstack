import type { Request, Response } from 'express';
import { authService } from './auth.service.ts';

export const authWebController = {
  /**
   * GET /auth/forgot-password
   */
  renderForgotPassword: (req: Request, res: Response): void => {
    const uid = typeof req.query.uid === 'string' ? req.query.uid : null;
    res.render('forgot-password', {
      error: null,
      message: null,
      email: '',
      uid,
    });
  },

  /**
   * POST /auth/forgot-password (Browser Form Submission)
   */
  handleForgotPassword: async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await authService.forgotPassword(req.body);
      res.render('forgot-password', {
        error: null,
        message: result.message,
        email: '',
        uid: req.query.uid || null,
      });
    } catch (error) {
      res.status(400).render('forgot-password', {
        error: error instanceof Error ? error.message : 'Failed to request reset',
        message: null,
        email: req.body.email || '',
        uid: req.query.uid || null,
      });
    }
  },

  /**
   * GET /auth/reset-password/:token
   */
  renderResetPassword: (req: Request, res: Response): void => {
    res.render('reset-password', {
      token: req.params.token,
      error: null,
      message: null,
    });
  },

  /**
   * POST /auth/reset-password/:token (Browser Form Submission)
   */
  handleResetPassword: async (req: Request, res: Response): Promise<void> => {
    const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
    try {
      const result = await authService.resetPassword(token, req.body);
      res.render('reset-password', {
        token: '',
        error: null,
        message: result.message,
      });
    } catch (error) {
      res.status(400).render('reset-password', {
        token,
        error: error instanceof Error ? error.message : 'Failed to reset password',
        message: null,
      });
    }
  },

  /**
   * GET /auth/verify-email/:token (Browser Link Click from Email)
   */
  handleVerifyEmail: async (req: Request, res: Response): Promise<void> => {
    const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
    try {
      const result = await authService.verifyEmail(token);
      res.render('login', {
        uid: '',
        error: null,
        success: result.message,
        email: '',
      });
    } catch (error) {
      res.render('login', {
        uid: '',
        error:
          error instanceof Error ? error.message : 'Email verification failed or token expired',
        success: null,
        email: '',
      });
    }
  },
};
