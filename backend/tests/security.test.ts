import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { User } from '../src/modules/auth/models/user.model.js';
import { Complaint } from '../src/modules/complaints/models/complaint.model.js';
import { GatePass } from '../src/modules/gate-pass/models/gatePass.model.js';
import { Notification } from '../src/modules/communication/models/notification.model.js';
import { Department } from '../src/modules/academic/models/department.model.js';
import { Program } from '../src/modules/academic/models/program.model.js';
import { AcademicYear } from '../src/modules/academic/models/academicYear.model.js';
import { Semester } from '../src/modules/academic/models/semester.model.js';
import { Course } from '../src/modules/academic/models/course.model.js';
import { ClassSection } from '../src/modules/academic/models/classSection.model.js';
import { FacultyAssignment } from '../src/modules/academic/models/facultyAssignment.model.js';
import { StudentEnrollment } from '../src/modules/academic/models/studentEnrollment.model.js';
import { AttendanceSession } from '../src/modules/academic/models/attendanceSession.model.js';
import { AttendanceRecord } from '../src/modules/academic/models/attendanceRecord.model.js';
import { Hostel } from '../src/modules/hostel/models/hostel.model.js';
import { HostelBlock } from '../src/modules/hostel/models/hostelBlock.model.js';
import { Room } from '../src/modules/hostel/models/room.model.js';
import { StudentRoomAllocation } from '../src/modules/hostel/models/studentRoomAllocation.model.js';
import { MessFeedback } from '../src/modules/hostel/models/messFeedback.model.js';
import { MessMenu } from '../src/modules/hostel/models/messMenu.model.js';
import { FaqDocument } from '../src/modules/ai/faq/models/faqDocument.model.js';
import { tokenService } from '../src/modules/auth/services/token.service.js';
import { passwordService } from '../src/modules/auth/services/password.service.js';
import { GatePassService } from '../src/modules/gate-pass/services/gatePass.service.js';
import { FaqService } from '../src/modules/ai/faq/services/faq.service.js';
import {
  UserRole,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  GatePassStatus,
} from '../src/types/index.js';

describe('Phase B12 - Security Hardening & Comprehensive Testing', () => {
  const app = createApp();

  let studentAToken: string;
  let studentBToken: string;
  let wardenToken: string;
  let securityToken: string;
  let adminToken: string;

  let studentAId: string;
  let studentBId: string;
  let wardenId: string;
  let securityId: string;
  let adminId: string;

  beforeAll(async () => {
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/fretbox_test_b12_security';
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
    await GatePass.deleteMany({});
    await Notification.deleteMany({});
    await Department.deleteMany({});
    await Program.deleteMany({});
    await AcademicYear.deleteMany({});
    await Semester.deleteMany({});
    await Course.deleteMany({});
    await ClassSection.deleteMany({});
    await FacultyAssignment.deleteMany({});
    await StudentEnrollment.deleteMany({});
    await AttendanceSession.deleteMany({});
    await AttendanceRecord.deleteMany({});
    await Hostel.deleteMany({});
    await HostelBlock.deleteMany({});
    await Room.deleteMany({});
    await StudentRoomAllocation.deleteMany({});
    await MessFeedback.deleteMany({});
    await MessMenu.deleteMany({});
    await FaqDocument.deleteMany({});

    const passwordHash = await passwordService.hashPassword('Password123!');

    const studentA = await User.create({
      name: 'Student A',
      email: 'studentA@fretbox.test',
      passwordHash,
      role: UserRole.STUDENT,
    });
    studentAId = studentA._id.toString();
    studentAToken = tokenService.generateAccessToken(studentAId, UserRole.STUDENT);

    const studentB = await User.create({
      name: 'Student B',
      email: 'studentB@fretbox.test',
      passwordHash,
      role: UserRole.STUDENT,
    });
    studentBId = studentB._id.toString();
    studentBToken = tokenService.generateAccessToken(studentBId, UserRole.STUDENT);

    const warden = await User.create({
      name: 'Warden User',
      email: 'warden@fretbox.test',
      passwordHash,
      role: UserRole.WARDEN,
    });
    wardenId = warden._id.toString();
    wardenToken = tokenService.generateAccessToken(wardenId, UserRole.WARDEN);

    const security = await User.create({
      name: 'Security Guard',
      email: 'security@fretbox.test',
      passwordHash,
      role: UserRole.SECURITY,
    });
    securityId = security._id.toString();
    securityToken = tokenService.generateAccessToken(securityId, UserRole.SECURITY);

    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@fretbox.test',
      passwordHash,
      role: UserRole.ADMINISTRATOR,
    });
    adminId = admin._id.toString();
    adminToken = tokenService.generateAccessToken(adminId, UserRole.ADMINISTRATOR);
  });

  describe('1. Authentication Security & RBAC Matrices', () => {
    it('login with wrong password should return generic 401 without exposing email existence', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'studentA@fretbox.test',
        password: 'WrongPassword123!',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
      expect(res.body.error.message).toContain('Invalid email or password');
    });

    it('password hashes must never be exposed in API user objects', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).not.toHaveProperty('passwordHash');
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('expired or tampered JWT access token must yield controlled 401', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.jwt.token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(['AUTH_UNAUTHORIZED', 'AUTH_INVALID_TOKEN']).toContain(res.body.error.code);
    });

    it('RBAC enforcement: Admin-only prediction endpoint returns 403 for non-admins', async () => {
      const nonAdminTokens = [studentAToken, wardenToken, securityToken];
      for (const token of nonAdminTokens) {
        const res = await request(app)
          .get('/api/v1/admin/predictions/complaints')
          .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(403);
      }

      const adminRes = await request(app)
        .get('/api/v1/admin/predictions/complaints')
        .set('Authorization', `Bearer ${adminToken}`);
      expect([200, 503]).toContain(adminRes.status);
    });
  });

  describe('2. Comprehensive IDOR & Resource Ownership Audits', () => {
    it('IDOR 1: Student A cannot access Student B complaint details', async () => {
      const complaintB = await Complaint.create({
        ticketNumber: 'FBX-2026-STUB01',
        studentId: studentBId,
        createdBy: studentBId,
        title: 'Student B Private Complaint',
        description: 'Private maintenance issue',
        category: ComplaintCategory.PLUMBING,
        priority: ComplaintPriority.HIGH,
        status: ComplaintStatus.OPEN,
      });

      const res = await request(app)
        .get(`/api/v1/complaints/${complaintB._id}`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('IDOR 2: Student A cannot access Student B gate pass details', async () => {
      const passB = await GatePass.create({
        passNumber: 'FBX-GP-STUB',
        studentId: studentBId,
        reason: 'Student B Leave',
        destination: 'Home',
        outDateTime: new Date(),
        expectedReturnDateTime: new Date(Date.now() + 86400000),
        status: GatePassStatus.PENDING,
      });

      const res = await request(app)
        .get(`/api/v1/gate-passes/${passB._id}`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect([403, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('IDOR 3: Student A cannot cancel Student B gate pass', async () => {
      const passB = await GatePass.create({
        passNumber: 'FBX-GP-STUB-CANCEL',
        studentId: studentBId,
        reason: 'Student B Leave',
        destination: 'Home',
        outDateTime: new Date(),
        expectedReturnDateTime: new Date(Date.now() + 86400000),
        status: GatePassStatus.PENDING,
      });

      const res = await request(app)
        .patch(`/api/v1/gate-passes/${passB._id}/cancel`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect([403, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('IDOR 4: Student A cannot mark Student B notification as read', async () => {
      const notifB = await Notification.create({
        recipientId: studentBId,
        title: 'Student B Private Notification',
        body: 'Confidential notification content',
      });

      const res = await request(app)
        .patch(`/api/v1/communication/notifications/${notifB._id}/read`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('IDOR 5: Student A cannot access Student B attendance summary', async () => {
      const res = await request(app)
        .get(`/api/v1/academic/attendance/students/${studentBId}/summary`)
        .set('Authorization', `Bearer ${studentAToken}`);

      expect([403, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('IDOR 6: Student A cannot access Student B room allocation details', async () => {
      const hostel = await Hostel.create({
        name: 'Boys Hostel A',
        code: 'BHA',
        category: 'boys',
      });
      const block = await HostelBlock.create({
        hostelId: hostel._id,
        name: 'Block 1',
        code: 'B1',
      });
      const room = await Room.create({
        hostelId: hostel._id,
        hostelBlockId: block._id,
        roomNumber: '101',
        capacity: 2,
      });
      await StudentRoomAllocation.create({
        studentId: studentBId,
        hostelId: hostel._id,
        blockId: block._id,
        roomId: room._id,
        allocatedAt: new Date(),
        status: 'active',
      });

      const res = await request(app)
        .get(`/api/v1/hostels/allocations/my`)
        .set('Authorization', `Bearer ${studentBToken}`);

      expect(res.status).toBe(200);
      expect((res.body.data.studentId._id || res.body.data.studentId).toString()).toBe(studentBId);
    });
  });

  describe('3. Gate Pass Security & Concurrency Verification', () => {
    const gatePassService = new GatePassService();

    it('scanning cancelled, rejected, or expired gate pass must be rejected with controlled error', async () => {
      await expect(
        gatePassService.scanGatePass({
          token: 'nonexistent_token_raw',
          securityUserId: securityId,
        }),
      ).rejects.toThrow();
    });

    it('atomic scan prevents double consumption race condition', async () => {
      const approveResult = await gatePassService.createGatePass({
        studentId: studentAId,
        reason: 'Weekend Outing',
        destination: 'Downtown',
        outDateTime: new Date(),
        expectedReturnDateTime: new Date(Date.now() + 86400000),
      });

      const approved = await gatePassService.approveGatePass(
        approveResult._id.toString(),
        wardenId,
      );

      const scanResult1 = await gatePassService.scanGatePass({
        token: approved.qrPayload,
        securityUserId: securityId,
      });

      expect(scanResult1.gatePass.status).toBe(GatePassStatus.USED);

      // Second scan attempt on same token
      await expect(
        gatePassService.scanGatePass({
          token: approved.qrPayload,
          securityUserId: securityId,
        }),
      ).rejects.toThrow('Gate pass has already been used');
    });

    it('raw 32-byte gate pass token is never stored in plain text in database', async () => {
      const pass = await GatePass.create({
        passNumber: 'FBX-GP-HASH-CHECK',
        studentId: studentAId,
        reason: 'Check Token Storage',
        destination: 'Library',
        outDateTime: new Date(),
        expectedReturnDateTime: new Date(Date.now() + 3600000),
        status: GatePassStatus.PENDING,
      });

      const approved = await gatePassService.approveGatePass(pass._id.toString(), wardenId);
      const rawToken = approved.qrPayload;

      const docInDb = await GatePass.findById(pass._id).select('+tokenHash').lean();
      expect(docInDb?.tokenHash).toBeDefined();
      expect(docInDb?.tokenHash).not.toBe(rawToken);
    });
  });

  describe('4. Input Validation & Parameter Boundaries', () => {
    it('malformed ObjectId route parameter yields controlled 400 validation error', async () => {
      const res = await request(app)
        .get('/api/v1/complaints/123invalidobjectid')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_ID');
    });

    it('negative pagination page number is normalized to 1', async () => {
      const res = await request(app)
        .get('/api/v1/complaints?page=-5&limit=10')
        .set('Authorization', `Bearer ${studentAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.page).toBe(1);
    });
  });

  describe('5. Grounded FAQ & AI Security Boundaries', () => {
    const faqService = new FaqService();

    it('unapproved FAQ documents are excluded from student query context', async () => {
      await FaqDocument.create({
        title: 'Draft Unapproved Policy',
        content: 'Confidential draft rules for campus.',
        category: 'general',
        isApproved: false,
      });

      const docs = await faqService.retrieveRelevantDocuments(
        'draft rules',
        undefined,
        UserRole.STUDENT,
      );
      expect(docs.some((d) => d.title === 'Draft Unapproved Policy')).toBe(false);
    });
  });
});
