import { Router } from 'express';
import { usersController } from './users.controller.ts';
import { RegisterUserSchema, LoginUserSchema } from './users.dto.ts';
import { validate, authRateLimiter } from '#middleware';
const router = Router();

// Validation middleware runs BEFORE the controller
router.post('/register', authRateLimiter, validate(RegisterUserSchema), usersController.register);
router.post('/login', authRateLimiter, validate(LoginUserSchema), usersController.login);
router.get('/:id', usersController.getById);

export const usersRouter = router;
