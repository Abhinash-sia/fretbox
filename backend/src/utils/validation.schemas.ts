import { z } from 'zod';
import { UserRole } from '../types/index.js';

export const registerSchema = {
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(2, 'Name must be at least 2 characters long')
      .max(100, 'Name cannot exceed 100 characters'),
    email: z
      .string({ required_error: 'Email is required' })
      .email('Please provide a valid email address'),
    password: z
      .string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters long'),
    role: z.nativeEnum(UserRole, { errorMap: () => ({ message: 'Invalid user role' }) }).optional(),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Please provide a valid email address'),
    password: z.string({ required_error: 'Password is required' }),
  }),
};

export const refreshSchema = {
  body: z.object({
    refreshToken: z.string({ required_error: 'Refresh token is required' }),
  }),
};

export const logoutSchema = {
  body: z.object({
    refreshToken: z.string().optional(),
  }),
};
