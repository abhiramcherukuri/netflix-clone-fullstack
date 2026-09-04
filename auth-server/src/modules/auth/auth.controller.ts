import type { Request, Response } from 'express';
import { authService } from './auth.service.ts';

export const authController = {
  /**
   * GET /api/v1/auth/verify-email/:token
   */
  verifyEmail: async (req: Request, res: Response): Promise<void> => {
    const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
    const result = await authService.verifyEmail(token);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  },

  /**
   * POST /api/v1/auth/forgot-password
   */
  forgotPassword: async (req: Request, res: Response): Promise<void> => {
    const result = await authService.forgotPassword(req.body);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  },

  /**
   * POST /api/v1/auth/reset-password/:token
   */
  resetPassword: async (req: Request, res: Response): Promise<void> => {
    const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
    const result = await authService.resetPassword(token, req.body);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  },

  /**
   * POST /api/v1/auth/resend-verification
   */
  resendVerification: async (req: Request, res: Response): Promise<void> => {
    const result = await authService.resendVerification(req.body);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  },
};
