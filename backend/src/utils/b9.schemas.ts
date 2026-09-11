import { z } from 'zod';

export const predictionQuerySchema = z.object({
  horizonDays: z.coerce.number().int().min(1).max(30).default(7),
  historyDays: z.coerce.number().int().min(14).max(365).default(180),
});

export const forecastItemSchema = z.object({
  date: z.string(),
  predictedComplaints: z.number().int().min(0),
});

export const modelMetricsSchema = z.object({
  name: z.string(),
  mae: z.number(),
  rmse: z.number(),
});

export const pythonPredictionResponseSchema = z.object({
  status: z.enum(['success', 'insufficient_data']),
  message: z.string().optional(),
  forecast: z.array(forecastItemSchema).default([]),
  model: modelMetricsSchema.nullable().optional(),
  baseline: modelMetricsSchema.nullable().optional(),
  featuresUsed: z.array(z.string()).default([]),
  trainingObservations: z.number().default(0),
  testObservations: z.number().default(0),
  selectedModel: z.string().nullable().optional(),
});

export type PredictionQueryInput = z.infer<typeof predictionQuerySchema>;
export type PythonPredictionResponse = z.infer<typeof pythonPredictionResponseSchema>;
