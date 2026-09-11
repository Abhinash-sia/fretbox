import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose, { Types } from 'mongoose';
import { createApp } from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Complaint } from '../src/models/complaint.model.js';
import { GateEvent } from '../src/models/gateEvent.model.js';
import { passwordService } from '../src/services/password.service.js';
import { tokenService } from '../src/services/token.service.js';
import {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  GateEventType,
  UserRole,
} from '../src/types/index.js';

describe('Phase B6 Admin Intelligence & Analytics Integration API Tests', () => {
  const app = createApp();
  let adminToken: string;
  let wardenToken: string;
  let studentToken: string;
  let staffToken: string;
  let securityToken: string;

  beforeAll(async () => {
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/fretbox_test_b6_integration';
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
    await GateEvent.deleteMany({});

    const passwordHash = await passwordService.hashPassword('Password123!');

    const admin = await User.create({
      name: 'Admin',
      email: 'admin@b6.com',
      passwordHash,
      role: UserRole.ADMINISTRATOR,
    });
    const warden = await User.create({
      name: 'Warden',
      email: 'warden@b6.com',
      passwordHash,
      role: UserRole.WARDEN,
    });
    const student = await User.create({
      name: 'Student',
      email: 'student@b6.com',
      passwordHash,
      role: UserRole.STUDENT,
    });
    const staff = await User.create({
      name: 'Staff',
      email: 'staff@b6.com',
      passwordHash,
      role: UserRole.STAFF,
    });
    const security = await User.create({
      name: 'Security',
      email: 'security@b6.com',
      passwordHash,
      role: UserRole.SECURITY,
    });

    adminToken = tokenService.generateAccessToken(admin._id.toString(), UserRole.ADMINISTRATOR);
    wardenToken = tokenService.generateAccessToken(warden._id.toString(), UserRole.WARDEN);
    studentToken = tokenService.generateAccessToken(student._id.toString(), UserRole.STUDENT);
    staffToken = tokenService.generateAccessToken(staff._id.toString(), UserRole.STAFF);
    securityToken = tokenService.generateAccessToken(security._id.toString(), UserRole.SECURITY);

    // Seed sample complaints and gate events
    await Complaint.create([
      {
        ticketNumber: 'FBX-B6-001',
        title: 'Broken Light',
        description: 'Light in room 101 flickering',
        category: ComplaintCategory.ELECTRICAL,
        priority: ComplaintPriority.HIGH,
        status: ComplaintStatus.OPEN,
        createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10h old (<24h)
      },
      {
        ticketNumber: 'FBX-B6-002',
        title: 'Water Leakage',
        description: 'Pipe leaking in bathroom',
        category: ComplaintCategory.PLUMBING,
        priority: ComplaintPriority.URGENT,
        status: ComplaintStatus.RESOLVED,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        resolvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24h resolution time
      },
    ]);

    await GateEvent.create({
      gatePassId: new Types.ObjectId(),
      studentId: student._id,
      securityUserId: security._id,
      eventType: GateEventType.EXIT,
      gateId: 'MAIN_GATE',
      scannedAt: new Date(),
    });
  });

  it('1. Administrator receives 200 OK for overview and analytics endpoints', async () => {
    const overviewRes = await request(app)
      .get('/api/v1/admin/analytics/overview')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(overviewRes.status).toBe(200);
    expect(overviewRes.body.success).toBe(true);
    expect(overviewRes.body.data.complaints.total).toBe(2);
    expect(overviewRes.body.data.gate.totalEvents).toBe(1);

    const complaintRes = await request(app)
      .get('/api/v1/admin/analytics/complaints')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(complaintRes.status).toBe(200);
    expect(complaintRes.body.data.activeComplaints.count).toBe(1);
    expect(complaintRes.body.data.activeComplaints.ageingBuckets.under24h).toBe(1);

    const gateRes = await request(app)
      .get('/api/v1/admin/analytics/gates')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(gateRes.status).toBe(200);
    expect(gateRes.body.data.totalEvents).toBe(1);
    expect(gateRes.body.data.exitCount).toBe(1);
  });

  it('2. Warden receives 200 OK for authorized hostel/complaint analytics', async () => {
    const res = await request(app)
      .get('/api/v1/admin/analytics/complaints')
      .set('Authorization', `Bearer ${wardenToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('3. Non-authorized roles (Student, Staff, Security) receive 403 Forbidden', async () => {
    const studentRes = await request(app)
      .get('/api/v1/admin/analytics/overview')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(studentRes.status).toBe(403);

    const staffRes = await request(app)
      .get('/api/v1/admin/analytics/overview')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(staffRes.status).toBe(403);

    const securityGateRes = await request(app)
      .get('/api/v1/admin/analytics/gates')
      .set('Authorization', `Bearer ${securityToken}`);
    expect(securityGateRes.status).toBe(403);
  });

  it('4. Date boundary validation rejects invalid date ranges', async () => {
    const invalidRes = await request(app)
      .get('/api/v1/admin/analytics/overview?from=2026-09-10T00:00:00Z&to=2026-09-01T00:00:00Z')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.success).toBe(false);
  });
});
