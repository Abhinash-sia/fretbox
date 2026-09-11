import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { z } from 'zod';
import { validate } from '../src/middlewares/validate.middleware.js';
import { errorMiddleware } from '../src/middlewares/error.middleware.js';

describe('Zod Validation Middleware Infrastructure', () => {
  const app = express();
  app.use(express.json());

  const testSchema = {
    body: z.object({
      title: z.string().min(3, 'Title must be at least 3 characters'),
      count: z.number().positive('Count must be positive'),
    }),
  };

  app.post('/test-validate', validate(testSchema), (req, res) => {
    res.json({ success: true, data: req.body });
  });

  app.use(errorMiddleware);

  it('should pass validation when request body meets Zod schema requirements', async () => {
    const validData = { title: 'Test Object', count: 5 };
    const response = await request(app).post('/test-validate').send(validData);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: validData,
    });
  });

  it('should fail validation and return 400 VALIDATION_ERROR when input is invalid', async () => {
    const invalidData = { title: 'ab', count: -1 };
    const response = await request(app).post('/test-validate').send(invalidData);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    expect(response.body.error).toHaveProperty('message', 'Request validation failed');
    expect(response.body.error).toHaveProperty('details');
    expect(Array.isArray(response.body.error.details)).toBe(true);
    expect(response.body.error.details.length).toBeGreaterThan(0);
  });
});
