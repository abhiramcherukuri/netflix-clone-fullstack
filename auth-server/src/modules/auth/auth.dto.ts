import { z } from 'zod';

// 1. Schema for Forgot Password Request
export const ForgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .trim()
    .toLowerCase(),
});

// 2. Schema for Reset Password Request (with Password Confirmation)
export const ResetPasswordSchema = z
  .object({
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z
      .string({ required_error: 'Please confirm your password' })
      .min(1, 'Confirm password cannot be empty'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// 3. Schema for URL Token Parameter
export const TokenParamSchema = z.object({
  token: z
    .string({ required_error: 'Token is required' })
    .length(64, 'Invalid token length: must be a 64-character hexadecimal string')
    .regex(/^[a-f0-9]+$/i, 'Token must contain only hexadecimal characters'),
});

// 4. Inferred TypeScript Types
export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;
export type TokenParamDto = z.infer<typeof TokenParamSchema>;
