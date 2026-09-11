import { z } from 'zod';
import dotenv from 'dotenv';
import { AppConfig } from '../types/index.js';

// Load .env file into process.env if present
dotenv.config();

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  CORS_ORIGIN: z.string().default('*'),
  JWT_ACCESS_SECRET: z
    .string()
    .default('dev_access_secret_fretbox_2026_super_secure_key_123_change_in_production'),
  JWT_REFRESH_SECRET: z
    .string()
    .default('dev_refresh_secret_fretbox_2026_super_secure_key_456_change_in_production'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  AI_COMPLAINT_CONFIDENCE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.8),
  AI_AUTO_APPLY: z.coerce.boolean().default(false),
});

/**
 * Pure environment validation function.
 * Accepts an environment object (e.g. process.env or custom test object) and validates it against envSchema.
 * Does NOT invoke process.exit directly.
 */
export const validateEnv = (envObj: Record<string, string | undefined>): AppConfig => {
  const result = envSchema.safeParse(envObj);

  if (!result.success) {
    const errorMessages = result.error.errors
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
    throw new Error(`Invalid environment configuration: ${errorMessages}`);
  }

  return result.data;
};

let cachedEnv: AppConfig | null = null;

/**
 * Retrieves validated environment config derived from process.env.
 * Caches validated result for runtime performance.
 */
export const getEnv = (): AppConfig => {
  if (!cachedEnv) {
    cachedEnv = validateEnv(process.env);
  }
  return cachedEnv;
};
