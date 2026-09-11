import { z } from 'zod';
import { AnnouncementPriority, NotificationType, UserRole } from '../../../types/index.js';

const mongoIdSchema = z
  .string({ required_error: 'ID is required' })
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

const announcementTargetSchema = z.object({
  all: z.boolean().optional(),
  roles: z.array(z.nativeEnum(UserRole)).optional(),
  programs: z.array(mongoIdSchema).optional(),
  academicYears: z.array(mongoIdSchema).optional(),
  hostels: z.array(mongoIdSchema).optional(),
  hostelBlocks: z.array(mongoIdSchema).optional(),
});

export const createAnnouncementSchema = {
  body: z
    .object({
      title: z
        .string({ required_error: 'Title is required' })
        .min(3, 'Title must be at least 3 characters long')
        .max(200),
      body: z
        .string({ required_error: 'Body is required' })
        .min(5, 'Body must be at least 5 characters long')
        .max(5000),
      target: announcementTargetSchema.optional(),
      priority: z.nativeEnum(AnnouncementPriority).optional(),
      publishAt: z.string().datetime().optional(),
      expiresAt: z.string().datetime().optional(),
    })
    .refine(
      (data) => {
        if (data.publishAt && data.expiresAt) {
          return new Date(data.expiresAt) > new Date(data.publishAt);
        }
        return true;
      },
      {
        message: 'Expiration date must be strictly after publish date',
        path: ['expiresAt'],
      },
    ) as unknown as z.AnyZodObject,
};

export const updateAnnouncementSchema = {
  params: z.object({
    id: mongoIdSchema,
  }),
  body: z
    .object({
      title: z.string().min(3).max(200).optional(),
      body: z.string().min(5).max(5000).optional(),
      target: announcementTargetSchema.optional(),
      priority: z.nativeEnum(AnnouncementPriority).optional(),
      publishAt: z.string().datetime().optional(),
      expiresAt: z.string().datetime().optional(),
    })
    .refine(
      (data) => {
        if (data.publishAt && data.expiresAt) {
          return new Date(data.expiresAt) > new Date(data.publishAt);
        }
        return true;
      },
      {
        message: 'Expiration date must be strictly after publish date',
        path: ['expiresAt'],
      },
    ) as unknown as z.AnyZodObject,
};

export const announcementIdParamSchema = {
  params: z.object({
    id: mongoIdSchema,
  }),
};

export const listNotificationsQuerySchema = {
  query: z.object({
    unreadOnly: z.enum(['true', 'false']).optional(),
    type: z.nativeEnum(NotificationType).optional(),
    priority: z.nativeEnum(AnnouncementPriority).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
};

export const notificationIdParamSchema = {
  params: z.object({
    id: mongoIdSchema,
  }),
};
