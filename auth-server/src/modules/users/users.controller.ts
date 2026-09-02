import type { Request, Response } from 'express';
import { userService } from './users.service.ts';
import { setAuthCookies } from '#utils';

export const usersController = {
  /**
   * POST /api/v1/users/register
   */
  register: async (req: Request, res: Response): Promise<void> => {
    const newUser = await userService.register(req.body);
    setAuthCookies(res);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: newUser,
    });
  },

  /**
   * POST /api/v1/users/login
   */
  login: async (req: Request, res: Response): Promise<void> => {
    const user = await userService.authenticate(req.body);
    setAuthCookies(res);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        subscription: user.subscription,
      },
    });
  },

  /**
   * GET /api/v1/users/:id
   */
  getById: async (req: Request, res: Response): Promise<void> => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const user = await userService.getById(id);
    res.status(200).json({
      success: true,
      data: user,
    });
  },
};
