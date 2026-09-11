import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { GatePass } from '../src/models/gatePass.model.js';
import { GateEvent } from '../src/models/gateEvent.model.js';
import { tokenService } from '../src/services/token.service.js';
import { passwordService } from '../src/services/password.service.js';
import { UserRole } from '../src/types/index.js';

describe('Phase B4 Gate Pass & Security Integration API Tests', () => {
  const app = createApp();
  let wardenToken: string;
  let securityToken: string;
  let studentToken: string;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fretbox';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { dbName: 'fretbox_test_b4_integration' });
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
    await GatePass.deleteMany({});
    await GateEvent.deleteMany({});

    const passwordHash = await passwordService.hashPassword('Password123!');

    const warden = await User.create({
      name: 'Warden',
      email: 'warden@b4.com',
      passwordHash,
      role: UserRole.WARDEN,
    });
    const security = await User.create({
      name: 'Security',
      email: 'security@b4.com',
      passwordHash,
      role: UserRole.SECURITY,
    });
    const student = await User.create({
      name: 'Student',
      email: 'student@b4.com',
      passwordHash,
      role: UserRole.STUDENT,
    });

    wardenToken = tokenService.generateAccessToken(warden._id.toString(), UserRole.WARDEN);
    securityToken = tokenService.generateAccessToken(security._id.toString(), UserRole.SECURITY);
    studentToken = tokenService.generateAccessToken(student._id.toString(), UserRole.STUDENT);
  });

  it('1. Complete Gate Pass Lifecycle & Scan Verification Flow', async () => {
    const outTime = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const returnTime = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

    // 1. Student creates gate pass
    const createRes = await request(app)
      .post('/api/v1/gate-passes')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        reason: 'Weekend Visit',
        destination: 'Home',
        outDateTime: outTime,
        expectedReturnDateTime: returnTime,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.passNumber).toMatch(/^FBX-GP-\d{4}-[A-Z0-9]{6}$/);
    expect(createRes.body.data.status).toBe('pending');
    const passId = createRes.body.data._id;

    // 2. Warden approves gate pass
    const approveRes = await request(app)
      .post(`/api/v1/gate-passes/${passId}/approve`)
      .set('Authorization', `Bearer ${wardenToken}`)
      .send();

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.gatePass.status).toBe('approved');
    expect(approveRes.body.data.qrPayload).toBeDefined();
    const rawToken = approveRes.body.data.qrPayload;

    // 3. Security scans valid token
    const scanRes = await request(app)
      .post('/api/v1/gate-passes/scan')
      .set('Authorization', `Bearer ${securityToken}`)
      .send({
        token: rawToken,
        gateId: 'south-gate',
      });

    expect(scanRes.status).toBe(200);
    expect(scanRes.body.data.gatePass.status).toBe('used');
    expect(scanRes.body.data.gateEvent.eventType).toBe('exit');
    expect(scanRes.body.data.gateEvent.gateId).toBe('south-gate');

    // 4. Verify GateEvent is retrievable
    const eventsRes = await request(app)
      .get('/api/v1/gate-events')
      .set('Authorization', `Bearer ${securityToken}`);

    expect(eventsRes.status).toBe(200);
    expect(eventsRes.body.data.total).toBe(1);

    // 5. Attempt second scan using same token -> Fails with GATE_PASS_ALREADY_USED
    const secondScanRes = await request(app)
      .post('/api/v1/gate-passes/scan')
      .set('Authorization', `Bearer ${securityToken}`)
      .send({
        token: rawToken,
        gateId: 'south-gate',
      });

    expect(secondScanRes.status).toBe(400);
    expect(secondScanRes.body.error.code).toBe('GATE_PASS_ALREADY_USED');
  });

  it('2. Mandatory Concurrent Scan Protection Test', async () => {
    const outTime = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const returnTime = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const createRes = await request(app)
      .post('/api/v1/gate-passes')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        reason: 'Urgent Medical Visit',
        destination: 'Hospital',
        outDateTime: outTime,
        expectedReturnDateTime: returnTime,
      });

    const passId = createRes.body.data._id;

    const approveRes = await request(app)
      .post(`/api/v1/gate-passes/${passId}/approve`)
      .set('Authorization', `Bearer ${wardenToken}`)
      .send();

    const rawToken = approveRes.body.data.qrPayload;

    // Simulate 2 security officers scanning the exact same pass at the same moment
    const [scanAttempt1, scanAttempt2] = await Promise.all([
      request(app)
        .post('/api/v1/gate-passes/scan')
        .set('Authorization', `Bearer ${securityToken}`)
        .send({ token: rawToken, gateId: 'gate-1' }),
      request(app)
        .post('/api/v1/gate-passes/scan')
        .set('Authorization', `Bearer ${securityToken}`)
        .send({ token: rawToken, gateId: 'gate-2' }),
    ]);

    const statuses = [scanAttempt1.status, scanAttempt2.status].sort();

    // Exactly one scan succeeds (200) and second scan fails (409 conflict or 400 bad request)
    expect(statuses[0]).toBe(200);
    expect([400, 409]).toContain(statuses[1]);

    // Exactly one GateEvent created in DB
    const gateEventCount = await GateEvent.countDocuments({ gatePassId: passId });
    expect(gateEventCount).toBe(1);

    // Pass status is used
    const finalPass = await GatePass.findById(passId);
    expect(finalPass?.status).toBe('used');
  });

  it('3. RBAC & Unauthorized Operations Check', async () => {
    // Student trying to scan should get 403
    const studentScanRes = await request(app)
      .post('/api/v1/gate-passes/scan')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ token: 'dummy-token-12345678' });

    expect(studentScanRes.status).toBe(403);
    expect(studentScanRes.body.error.code).toBe('AUTH_FORBIDDEN');

    // Security trying to approve should get 403
    const securityApproveRes = await request(app)
      .post('/api/v1/gate-passes/6aa3b85ccc5d494004b0024e/approve')
      .set('Authorization', `Bearer ${securityToken}`)
      .send();

    expect(securityApproveRes.status).toBe(403);
  });
});
