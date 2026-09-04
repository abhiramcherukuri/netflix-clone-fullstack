import { z } from 'zod';
import {
  USER_ROLES,
  type UserRole,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from './users.constants.ts';

// 1. Schema for User Registration
export const RegisterUserSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name must be at most 50 characters long')
    .trim(),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .trim()
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  role: z.enum([USER_ROLES.USER, USER_ROLES.ADMIN]).default(USER_ROLES.USER),
});

// 2. Schema for User Login
export const LoginUserSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Invalid email format')
    .trim()
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long'),
});

// 3. Inferred TypeScript DTO Types (Zero duplication!)
export type RegisterUserDto = z.infer<typeof RegisterUserSchema>;
export type LoginUserDto = z.infer<typeof LoginUserSchema>;

// 4. Sanitized User Response DTO (Never exposes passwordHash)
export interface UserResponseDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  subscription: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    startDate?: Date;
    endDate?: Date;
  };
  createdAt?: Date;
}
