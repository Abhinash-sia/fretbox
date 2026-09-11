import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('Health and Readiness Endpoints', () => {
  const app = createApp();

  it('GET /api/v1/health should return 200 with standard success structure', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('status', 'ok');
    expect(response.body.data).toHaveProperty('timestamp');
    expect(response.body.data).toHaveProperty('uptimeSeconds');
  });

  it('GET /api/v1/health/readiness should report dependency readiness status', async () => {
    const response = await request(app).get('/api/v1/health/readiness');

    expect([200, 503]).toContain(response.status);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('status');
    expect(response.body.data).toHaveProperty('details');
    expect(response.body.data.details).toHaveProperty('mongodb');
    expect(response.body.data.details).toHaveProperty('redis');
  });
});
