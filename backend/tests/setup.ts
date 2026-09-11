import { beforeAll } from 'vitest';

beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.PORT = '3000';
  process.env.MONGODB_URI = 'mongodb://localhost:27017/fretbox';
  process.env.REDIS_URL = 'redis://localhost:6379';
  process.env.CORS_ORIGIN = '*';
});
