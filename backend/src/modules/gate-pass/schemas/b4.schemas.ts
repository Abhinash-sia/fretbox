import { z } from 'zod';

const mongoIdSchema = z
  .string({ required_error: 'ID is required' })
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

export const createGatePassSchema = {
  body: z
    .object({
      reason: z
        .string({ required_error: 'Reason is required' })
        .min(3, 'Reason must be at least 3 characters long')
        .max(500),
      destination: z
        .string({ required_error: 'Destination is required' })
        .min(2, 'Destination must be at least 2 characters long')
        .max(200),
      outDateTime: z.string({ required_error: 'Out date time is required' }).datetime(),
      expectedReturnDateTime: z
        .string({ required_error: 'Expected return date time is required' })
        .datetime(),
    })
    .refine((data) => new Date(data.expectedReturnDateTime) > new Date(data.outDateTime), {
      message: 'Expected return time must be strictly after out time',
      path: ['expectedReturnDateTime'],
    }) as unknown as z.AnyZodObject,
};

export const approveGatePassSchema = {
  params: z.object({
    id: mongoIdSchema,
  }),
};

export const rejectGatePassSchema = {
  params: z.object({
    id: mongoIdSchema,
  }),
  body: z.object({
    rejectionReason: z
      .string({ required_error: 'Rejection reason is required' })
      .min(3, 'Rejection reason must be at least 3 characters long')
      .max(500),
  }),
};

export const cancelGatePassSchema = {
  params: z.object({
    id: mongoIdSchema,
  }),
};

export const scanGatePassSchema = {
  body: z.object({
    token: z
      .string({ required_error: 'Token is required' })
      .min(8, 'Token must be a valid opaque token string')
      .max(256),
    gateId: z.string().min(1).max(100).optional().default('main-gate'),
  }),
};
