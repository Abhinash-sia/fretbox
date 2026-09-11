import { z } from 'zod';
import { FaqCategory, UserRole } from '../../../../types/index.js';

export const faqQuerySchema = {
  body: z.object({
    question: z
      .string({ required_error: 'Question string is required' })
      .min(3, 'Question must be at least 3 characters long')
      .max(500, 'Question cannot exceed 500 characters'),
    category: z.nativeEnum(FaqCategory).optional(),
    limit: z.number().int().min(1).max(10).optional().default(5),
  }),
};

export const createFaqDocumentSchema = {
  body: z.object({
    title: z.string().min(3).max(200),
    category: z.nativeEnum(FaqCategory).optional().default(FaqCategory.GENERAL),
    content: z.string().min(10).max(10000),
    tags: z.array(z.string()).optional().default([]),
    isApproved: z.boolean().optional().default(true),
    targetRoles: z.array(z.nativeEnum(UserRole)).optional().default([]),
  }),
};

export const updateFaqDocumentSchema = {
  body: z.object({
    title: z.string().min(3).max(200).optional(),
    category: z.nativeEnum(FaqCategory).optional(),
    content: z.string().min(10).max(10000).optional(),
    tags: z.array(z.string()).optional(),
    isApproved: z.boolean().optional(),
    targetRoles: z.array(z.nativeEnum(UserRole)).optional(),
  }),
};

export const faqAiResponseSchema = z.object({
  answer: z.string().min(1),
  confidence: z.number().min(0).max(1),
  sourcesUsed: z.array(z.string()),
  isGrounded: z.boolean(),
});

export type FaqAiResponse = z.infer<typeof faqAiResponseSchema>;
