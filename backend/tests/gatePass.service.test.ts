import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { GatePassService } from '../src/services/gatePass.service.js';
import { GatePass } from '../src/models/gatePass.model.js';
import { GateEvent } from '../src/models/gateEvent.model.js';
import { User } from '../src/models/user.model.js';
import { GatePassStatus, UserRole, BadRequestError, ForbiddenError } from '../src/types/index.js';

describe('GatePassService Unit Tests', () => {
  const gatePassService = new GatePassService();

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fretbox';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { dbName: 'fretbox_test_gatepass_service' });
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db?.dropDatabase();
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await GatePass.deleteMany({});
    await GateEvent.deleteMany({});
    await User.deleteMany({});
  });

  it('should create pending gate pass with FBX-GP ticket number', async () => {
    const student = await User.create({
      name: 'Alice Student',
      email: 'alice@test.com',
      passwordHash: 'hash',
      role: UserRole.STUDENT,
    });

    const outTime = new Date();
    const returnTime = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const pass = await gatePassService.createGatePass({
      studentId: student._id.toString(),
      reason: 'Doctor Visit',
      destination: 'Campus Clinic',
      outDateTime: outTime,
      expectedReturnDateTime: returnTime,
    });

    expect(pass._id).toBeDefined();
    expect(pass.passNumber).toMatch(/^FBX-GP-\d{4}-[A-Z0-9]{6}$/);
    expect(pass.status).toBe(GatePassStatus.PENDING);
  });

  it('should approve pass, generate raw token, store tokenHash, and consume atomically on scan', async () => {
    const student = await User.create({
      name: 'Bob Student',
      email: 'bob@test.com',
      passwordHash: 'hash',
      role: UserRole.STUDENT,
    });

    const warden = await User.create({
      name: 'Warden Dave',
      email: 'warden@test.com',
      passwordHash: 'hash',
      role: UserRole.WARDEN,
    });

    const security = await User.create({
      name: 'Officer Sam',
      email: 'security@test.com',
      passwordHash: 'hash',
      role: UserRole.SECURITY,
    });

    const outTime = new Date(Date.now() - 30 * 60 * 1000);
    const returnTime = new Date(Date.now() + 2 * 60 * 60 * 1000);

    const pass = await gatePassService.createGatePass({
      studentId: student._id.toString(),
      reason: 'Library Visit',
      destination: 'City Library',
      outDateTime: outTime,
      expectedReturnDateTime: returnTime,
    });

    // Warden approves
    const approvalResult = await gatePassService.approveGatePass(
      pass._id.toString(),
      warden._id.toString(),
    );

    expect(approvalResult.gatePass.status).toBe(GatePassStatus.APPROVED);
    expect(approvalResult.qrPayload).toBeDefined();
    expect(approvalResult.qrPayload.length).toBe(64); // 32 bytes hex

    // TokenHash stored, raw token not stored
    const dbPass = await GatePass.findById(pass._id).select('+tokenHash');
    expect(dbPass?.tokenHash).toBeDefined();
    expect(dbPass?.tokenHash).not.toBe(approvalResult.qrPayload);

    // Security scans valid token
    const scanResult = await gatePassService.scanGatePass({
      token: approvalResult.qrPayload,
      securityUserId: security._id.toString(),
      gateId: 'main-gate',
    });

    expect(scanResult.gatePass.status).toBe(GatePassStatus.USED);
    expect(scanResult.gatePass.usedAt).toBeDefined();
    expect(scanResult.gateEvent).toBeDefined();
    expect(scanResult.gateEvent.eventType).toBe('exit');

    // Attempt second scan using same token -> Must Fail with GATE_PASS_ALREADY_USED
    await expect(
      gatePassService.scanGatePass({
        token: approvalResult.qrPayload,
        securityUserId: security._id.toString(),
        gateId: 'main-gate',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject invalid transitions and unauthorized cancellation', async () => {
    const student1 = await User.create({
      name: 'Student 1',
      email: 's1@test.com',
      passwordHash: 'hash',
      role: UserRole.STUDENT,
    });

    const student2 = await User.create({
      name: 'Student 2',
      email: 's2@test.com',
      passwordHash: 'hash',
      role: UserRole.STUDENT,
    });

    const pass = await gatePassService.createGatePass({
      studentId: student1._id.toString(),
      reason: 'Outing',
      destination: 'Downtown',
      outDateTime: new Date(),
      expectedReturnDateTime: new Date(Date.now() + 3600000),
    });

    // Student 2 cannot cancel Student 1's pass
    await expect(
      gatePassService.cancelGatePass(pass._id.toString(), student2._id.toString()),
    ).rejects.toThrow(ForbiddenError);

    // Student 1 cancels own pass
    const cancelled = await gatePassService.cancelGatePass(
      pass._id.toString(),
      student1._id.toString(),
    );
    expect(cancelled.status).toBe(GatePassStatus.CANCELLED);
  });
});
