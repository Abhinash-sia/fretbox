import { z } from 'zod';
import { ComplaintCategory, ComplaintPriority, ComplaintStatus } from '../types/index.js';

const mongoIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

export const analyticsTimeRangeSchema = {
  query: z
    .object({
      from: z.string().datetime({ offset: true }).or(z.string().datetime()).optional(),
      to: z.string().datetime({ offset: true }).or(z.string().datetime()).optional(),
    })
    .refine(
      (data) => {
        if (data.from && data.to) {
          return new Date(data.from) <= new Date(data.to);
        }
        return true;
      },
      {
        message: "'from' date must be less than or equal to 'to' date",
        path: ['from'],
      },
    ) as unknown as z.AnyZodObject,
};

export const complaintAnalyticsQuerySchema = {
  query: z
    .object({
      from: z.string().datetime({ offset: true }).or(z.string().datetime()).optional(),
      to: z.string().datetime({ offset: true }).or(z.string().datetime()).optional(),
      hostelId: mongoIdSchema.optional(),
      blockId: mongoIdSchema.optional(),
      category: z.nativeEnum(ComplaintCategory).optional(),
      priority: z.nativeEnum(ComplaintPriority).optional(),
      status: z.nativeEnum(ComplaintStatus).optional(),
      assignedStaffId: mongoIdSchema.optional(),
    })
    .refine(
      (data) => {
        if (data.from && data.to) {
          return new Date(data.from) <= new Date(data.to);
        }
        return true;
      },
      {
        message: "'from' date must be less than or equal to 'to' date",
        path: ['from'],
      },
    ) as unknown as z.AnyZodObject,
};

export const attendanceAnalyticsQuerySchema = {
  query: z
    .object({
      from: z.string().datetime({ offset: true }).or(z.string().datetime()).optional(),
      to: z.string().datetime({ offset: true }).or(z.string().datetime()).optional(),
      academicYear: mongoIdSchema.optional(),
      semester: mongoIdSchema.optional(),
      program: mongoIdSchema.optional(),
      course: mongoIdSchema.optional(),
      section: mongoIdSchema.optional(),
    })
    .refine(
      (data) => {
        if (data.from && data.to) {
          return new Date(data.from) <= new Date(data.to);
        }
        return true;
      },
      {
        message: "'from' date must be less than or equal to 'to' date",
        path: ['from'],
      },
    ) as unknown as z.AnyZodObject,
};

export const lowAttendanceQuerySchema = {
  query: z.object({
    threshold: z
      .string()
      .regex(/^\d+(\.\d+)?$/)
      .transform((val) => parseFloat(val))
      .refine((val) => val >= 0 && val <= 100, {
        message: 'Threshold must be between 0 and 100',
      })
      .optional(),
    academicYear: mongoIdSchema.optional(),
    semester: mongoIdSchema.optional(),
    program: mongoIdSchema.optional(),
    section: mongoIdSchema.optional(),
    course: mongoIdSchema.optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
};

export const recurringIssuesQuerySchema = {
  query: z.object({
    windowDays: z
      .string()
      .regex(/^\d+$/)
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0 && val <= 365, {
        message: 'Window days must be between 1 and 365',
      })
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/)
      .transform((val) => parseInt(val, 10))
      .optional(),
  }),
};
