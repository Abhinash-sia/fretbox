import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { User } from '../src/modules/auth/models/user.model.js';
import { Complaint } from '../src/modules/complaints/models/complaint.model.js';
import { tokenService } from '../src/modules/auth/services/token.service.js';
import { passwordService } from '../src/modules/auth/services/password.service.js';
import {
  UserRole,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
} from '../src/types/index.js';

describe('Phase B9 Demand Prediction & Forecasting API Tests', () => {
  const app = createApp();
  let adminToken: string;
  let studentToken: string;
  let wardenToken: string;
  let staffToken: string;
  let securityToken: string;
  let adminId: string;
  let studentId: string;

  beforeAll(async () => {
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/fretbox_test_b9_integration';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
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
    await Complaint.deleteMany({});

    const passwordHash = await passwordService.hashPassword('Password123!');

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@fretbox.test',
      passwordHash,
      role: UserRole.ADMINISTRATOR,
    });
    adminId = admin._id.toString();
    adminToken = tokenService.generateAccessToken(adminId, UserRole.ADMINISTRATOR);

    const student = await User.create({
      name: 'Student User',
      email: 'student@fretbox.test',
      passwordHash,
      role: UserRole.STUDENT,
    });
    studentId = student._id.toString();
    studentToken = tokenService.generateAccessToken(studentId, UserRole.STUDENT);

    const warden = await User.create({
      name: 'Warden User',
      email: 'warden@fretbox.test',
      passwordHash,
      role: UserRole.WARDEN,
    });
    wardenToken = tokenService.generateAccessToken(warden._id.toString(), UserRole.WARDEN);

    const staff = await User.create({
      name: 'Staff User',
      email: 'staff@fretbox.test',
      passwordHash,
      role: UserRole.STAFF,
    });
    staffToken = tokenService.generateAccessToken(staff._id.toString(), UserRole.STAFF);

    const security = await User.create({
      name: 'Security User',
      email: 'security@fretbox.test',
      passwordHash,
      role: UserRole.SECURITY,
    });
    securityToken = tokenService.generateAccessToken(security._id.toString(), UserRole.SECURITY);
  });

  it('1. Should enforce RBAC: Only Administrator can access prediction endpoint (403 for non-admins)', async () => {
    const rolesToTest = [
      { token: studentToken, role: 'Student' },
      { token: wardenToken, role: 'Warden' },
      { token: staffToken, role: 'Staff' },
      { token: securityToken, role: 'Security' },
    ];

    for (const testRole of rolesToTest) {
      const res = await request(app)
        .get('/api/v1/admin/predictions/complaints')
        .set('Authorization', `Bearer ${testRole.token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTH_FORBIDDEN');
    }
  });

  it('2. Should validate query parameters (horizonDays & historyDays)', async () => {
    // Test invalid horizonDays > 30
    const resInvalidHorizon = await request(app)
      .get('/api/v1/admin/predictions/complaints?horizonDays=50')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(resInvalidHorizon.status).toBe(400);
    expect(resInvalidHorizon.body.success).toBe(false);
    expect(resInvalidHorizon.body.error.code).toBe('VALIDATION_ERROR');

    // Test invalid historyDays < 14
    const resInvalidHistory = await request(app)
      .get('/api/v1/admin/predictions/complaints?historyDays=5')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(resInvalidHistory.status).toBe(400);
    expect(resInvalidHistory.body.success).toBe(false);
  });

  it('3. Should handle Python AI service success response gracefully when mocked', async () => {
    // Seed 35 days of complaint data
    const baseDate = new Date();
    const complaintsToInsert = [];
    for (let i = 35; i >= 1; i--) {
      const dt = new Date(baseDate.getTime() - i * 24 * 60 * 60 * 1000);
      complaintsToInsert.push({
        ticketNumber: `FBX-B9-${i}`,
        studentId,
        createdBy: studentId,
        title: `Test Issue ${i}`,
        description: 'Test description',
        category: ComplaintCategory.PLUMBING,
        priority: ComplaintPriority.MEDIUM,
        status: ComplaintStatus.OPEN,
        createdAt: dt,
        updatedAt: dt,
      });
    }
    await Complaint.insertMany(complaintsToInsert);

    // Mock global fetch response from Python AI microservice
    const mockPythonPayload = {
      status: 'success',
      message: 'Demand prediction generated successfully.',
      forecast: [
        { date: '2026-09-12', predictedComplaints: 4 },
        { date: '2026-09-13', predictedComplaints: 5 },
        { date: '2026-09-14', predictedComplaints: 3 },
      ],
      model: { name: 'RandomForestRegressor', mae: 1.2, rmse: 1.5 },
      baseline: { name: '7-day-seasonal-naive', mae: 2.1, rmse: 2.8 },
      featuresUsed: ['day_of_week', 'lag_1', 'lag_7'],
      trainingObservations: 24,
      testObservations: 6,
      selectedModel: 'RandomForestRegressor',
    };

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockPythonPayload,
    } as unknown as Response);

    try {
      const res = await request(app)
        .get('/api/v1/admin/predictions/complaints?horizonDays=3&historyDays=60')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('success');
      expect(res.body.data.forecast.length).toBe(3);
      expect(res.body.data.model.name).toBe('RandomForestRegressor');
      expect(res.body.data.baseline.name).toBe('7-day-seasonal-naive');
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('4. Should handle Python AI service unavailability gracefully without crashing Node (503 status)', async () => {
    // Mock global fetch to simulate connection refusal / offline Python service
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('fetch failed / connection refused'));

    try {
      const res = await request(app)
        .get('/api/v1/admin/predictions/complaints')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PREDICTION_SERVICE_UNAVAILABLE');
    } finally {
      global.fetch = originalFetch;
    }
  });
});
