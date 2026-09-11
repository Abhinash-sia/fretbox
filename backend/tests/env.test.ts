import { describe, it, expect } from 'vitest';
import { validateEnv } from '../src/config/env.js';

describe('Environment Configuration Validation', () => {
  it('should successfully parse valid environment configuration', () => {
    const validEnv = {
      NODE_ENV: 'development',
      PORT: '3000',
      MONGODB_URI: 'mongodb://localhost:27017/fretbox',
      REDIS_URL: 'redis://localhost:6379',
      CORS_ORIGIN: '*',
    };

    const config = validateEnv(validEnv);

    expect(config.NODE_ENV).toBe('development');
    expect(config.PORT).toBe(3000);
    expect(config.MONGODB_URI).toBe('mongodb://localhost:27017/fretbox');
    expect(config.REDIS_URL).toBe('redis://localhost:6379');
    expect(config.CORS_ORIGIN).toBe('*');
  });

  it('should use safe default values for NODE_ENV, PORT, and CORS_ORIGIN if omitted', () => {
    const minimalEnv = {
      MONGODB_URI: 'mongodb://localhost:27017/fretbox',
      REDIS_URL: 'redis://localhost:6379',
    };

    const config = validateEnv(minimalEnv);

    expect(config.NODE_ENV).toBe('development');
    expect(config.PORT).toBe(3000);
    expect(config.CORS_ORIGIN).toBe('*');
  });

  it('should throw an error when required MONGODB_URI is missing', () => {
    const invalidEnv = {
      REDIS_URL: 'redis://localhost:6379',
    };

    expect(() => validateEnv(invalidEnv)).toThrow('Invalid environment configuration');
  });

  it('should throw an error when required REDIS_URL is missing', () => {
    const invalidEnv = {
      MONGODB_URI: 'mongodb://localhost:27017/fretbox',
    };

    expect(() => validateEnv(invalidEnv)).toThrow('Invalid environment configuration');
  });

  it('should throw an error when PORT is not a valid positive number', () => {
    const invalidEnv = {
      PORT: 'invalid_port',
      MONGODB_URI: 'mongodb://localhost:27017/fretbox',
      REDIS_URL: 'redis://localhost:6379',
    };

    expect(() => validateEnv(invalidEnv)).toThrow('Invalid environment configuration');
  });
});
