import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { User } from '../src/modules/auth/models/user.model.js';
import { Complaint } from '../src/modules/complaints/models/complaint.model.js';
import { ComplaintAudit } from '../src/modules/complaints/models/complaintAudit.model.js';
import { tokenService } from '../src/modules/auth/services/token.service.js';
import { passwordService } from '../src/modules/auth/services/password.service.js';
import {
  UserRole,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintAuditAction,
  AiClassificationStatus,
} from '../src/types/index.js';

describe('Phase B7 AI Complaint Routing Integration API Tests', () => {
  const app = createApp();
  let studentToken: string;
  let adminToken: string;
  let studentId: string;
  let student2Id: string;
  let adminId: string;

  beforeAll(async () => {
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/fretbox_test_b7_integration';
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
    await ComplaintAudit.deleteMany({});

    const passwordHash = await passwordService.hashPassword('Password123!');

    const student = await User.create({
      name: 'Student One',
      email: 'student1@fretbox.test',
      passwordHash,
      role: UserRole.STUDENT,
    });
    studentId = student._id.toString();
    studentToken = tokenService.generateAccessToken(studentId, UserRole.STUDENT);

    const student2 = await User.create({
      name: 'Student Two',
      email: 'student2@fretbox.test',
      passwordHash,
      role: UserRole.STUDENT,
    });
    student2Id = student2._id.toString();

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@fretbox.test',
      passwordHash,
      role: UserRole.ADMINISTRATOR,
    });
    adminId = admin._id.toString();
    adminToken = tokenService.generateAccessToken(adminId, UserRole.ADMINISTRATOR);
  });

  it('1. Should allow student to create complaint successfully without GEMINI_API_KEY', async () => {
    const res = await request(app)
      .post('/api/v1/complaints')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Broken AC',
        description: 'Air conditioner is making noise and not cooling.',
        category: ComplaintCategory.ELECTRICAL,
        priority: ComplaintPriority.MEDIUM,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.ticketNumber).toBeDefined();
  });

  it('2. Should trigger AI classification and handle missing GEMINI_API_KEY gracefully with UNAVAILABLE status', async () => {
    const complaint = await Complaint.create({
      ticketNumber: 'FBX-TEST-B7-01',
      studentId,
      createdBy: studentId,
      title: 'Water Leakage',
      description: 'Water leaking in washroom tap',
      category: ComplaintCategory.PLUMBING,
      priority: ComplaintPriority.MEDIUM,
    });

    const res = await request(app)
      .post(`/api/v1/complaints/${complaint._id}/ai-classify`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.aiClassification).toBeDefined();
    expect([AiClassificationStatus.UNAVAILABLE, AiClassificationStatus.FAILED]).toContain(
      res.body.data.aiClassification.status,
    );

    const audit = await ComplaintAudit.findOne({
      complaintId: complaint._id,
      action: ComplaintAuditAction.AI_CLASSIFIED,
    });
    expect(audit).not.toBeNull();
  });

  it('3. Should forbid student from triggering AI classification on another student complaint', async () => {
    const complaint = await Complaint.create({
      ticketNumber: 'FBX-TEST-B7-02',
      studentId: student2Id,
      createdBy: student2Id,
      title: 'Broken Chair',
      description: 'Chair leg is broken in Room 102',
      category: ComplaintCategory.FURNITURE,
      priority: ComplaintPriority.LOW,
    });

    const res = await request(app)
      .post(`/api/v1/complaints/${complaint._id}/ai-classify`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('4. Should allow Admin/Warden to apply AI classification recommendations', async () => {
    const complaint = await Complaint.create({
      ticketNumber: 'FBX-TEST-B7-03',
      studentId,
      createdBy: studentId,
      title: 'WiFi Router Dead',
      description: 'Network LED is red and no internet',
      category: ComplaintCategory.OTHER,
      priority: ComplaintPriority.LOW,
      aiClassification: {
        category: ComplaintCategory.NETWORK,
        priority: ComplaintPriority.HIGH,
        confidence: 0.95,
        reason: 'Network outage described',
        provider: 'google-gemini',
        model: 'gemini-2.5-flash',
        status: AiClassificationStatus.CLASSIFIED,
        classifiedAt: new Date(),
      },
    });

    const res = await request(app)
      .post(`/api/v1/complaints/${complaint._id}/ai-apply`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        category: ComplaintCategory.NETWORK,
        priority: ComplaintPriority.HIGH,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.category).toBe(ComplaintCategory.NETWORK);
    expect(res.body.data.priority).toBe(ComplaintPriority.HIGH);
    expect(res.body.data.aiClassification.status).toBe(AiClassificationStatus.APPLIED);

    const audit = await ComplaintAudit.findOne({
      complaintId: complaint._id,
      action: ComplaintAuditAction.AI_APPLIED,
    });
    expect(audit).not.toBeNull();
  });
});
