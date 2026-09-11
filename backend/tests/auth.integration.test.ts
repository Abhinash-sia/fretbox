import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { User } from '../src/modules/auth/models/user.model.js';
import { RefreshToken } from '../src/modules/auth/models/refreshToken.model.js';
import { UserRole } from '../src/types/index.js';

describe('Authentication & RBAC Integration API Tests', () => {
  const app = createApp();

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fretbox';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { dbName: 'fretbox_test_auth_integration' });
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db?.dropDatabase();
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await RefreshToken.deleteMany({});
  });

  it('POST /api/v1/auth/register should create user and return 201 without passwordHash', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      name: 'Integration Student',
      email: 'student.int@example.com',
      password: 'Password123!',
      role: UserRole.STUDENT,
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe('student.int@example.com');
    expect(response.body.data.role).toBe('student');
    expect(response.body.data.passwordHash).toBeUndefined();
  });

  it('POST /api/v1/auth/login should return access and refresh tokens for valid credentials', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Integration Admin',
      email: 'admin.int@example.com',
      password: 'Password123!',
      role: UserRole.ADMINISTRATOR,
    });

    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'admin.int@example.com',
      password: 'Password123!',
    });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.tokens).toHaveProperty('accessToken');
    expect(response.body.data.tokens).toHaveProperty('refreshToken');
    expect(response.body.data.user.role).toBe('administrator');
  });

  it('GET /api/v1/auth/me should return authenticated user profile when Bearer token is provided', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Profile User',
      email: 'profile@example.com',
      password: 'Password123!',
      role: UserRole.FACULTY,
    });

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'profile@example.com',
      password: 'Password123!',
    });

    const accessToken = loginRes.body.data.tokens.accessToken;

    const meResponse = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.success).toBe(true);
    expect(meResponse.body.data.email).toBe('profile@example.com');
  });

  it('GET /api/v1/auth/me should return 401 Unauthorized if Authorization header is missing', async () => {
    const response = await request(app).get('/api/v1/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('AUTH_UNAUTHORIZED');
  });

  it('RBAC Middleware: Should allow Student to access Student route (200) and block Faculty route (403)', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Student User',
      email: 'student.rbac@example.com',
      password: 'Password123!',
      role: UserRole.STUDENT,
    });

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'student.rbac@example.com',
      password: 'Password123!',
    });

    const studentToken = loginRes.body.data.tokens.accessToken;

    // Student accessing Student endpoint -> 200 OK
    const studentRes = await request(app)
      .get('/api/v1/auth/test/student')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(studentRes.status).toBe(200);

    // Student accessing Faculty endpoint -> 403 Forbidden
    const facultyRes = await request(app)
      .get('/api/v1/auth/test/faculty')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(facultyRes.status).toBe(403);
    expect(facultyRes.body.error.code).toBe('AUTH_FORBIDDEN');
  });

  it('RBAC Middleware: Should allow Administrator to access Admin route', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Admin User',
      email: 'admin.rbac@example.com',
      password: 'Password123!',
      role: UserRole.ADMINISTRATOR,
    });

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'admin.rbac@example.com',
      password: 'Password123!',
    });

    const adminToken = loginRes.body.data.tokens.accessToken;

    const adminRes = await request(app)
      .get('/api/v1/auth/test/admin')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminRes.status).toBe(200);
  });

  it('POST /api/v1/auth/refresh & logout lifecycle', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Refresh User',
      email: 'refresh.test@example.com',
      password: 'Password123!',
    });

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'refresh.test@example.com',
      password: 'Password123!',
    });

    const refreshToken = loginRes.body.data.tokens.refreshToken;

    // Refresh access token
    const refreshRes = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.tokens).toHaveProperty('accessToken');

    // Logout
    const logoutRes = await request(app).post('/api/v1/auth/logout').send({ refreshToken });
    expect(logoutRes.status).toBe(200);

    // Attempting to reuse revoked refresh token should fail with 401
    const revokedRefreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });
    expect(revokedRefreshRes.status).toBe(401);
  });
});
