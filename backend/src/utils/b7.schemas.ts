import { z } from 'zod';
import { ComplaintCategory, ComplaintPriority } from '../types/index.js';

export const aiClassificationOutputSchema = z.object({
  category: z.nativeEnum(ComplaintCategory, {
    errorMap: () => ({ message: 'Invalid complaint category returned by AI' }),
  }),
  priority: z.nativeEnum(ComplaintPriority, {
    errorMap: () => ({ message: 'Invalid complaint priority returned by AI' }),
  }),
  confidence: z
    .number()
    .min(0, 'Confidence must be at least 0')
    .max(1, 'Confidence cannot exceed 1'),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason is too long'),
});

export type AiClassificationOutput = z.infer<typeof aiClassificationOutputSchema>;

export const aiApplyClassificationSchema = {
  body: z.object({
    category: z.nativeEnum(ComplaintCategory).optional(),
    priority: z.nativeEnum(ComplaintPriority).optional(),
  }),
};
