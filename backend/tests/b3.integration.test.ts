import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { User } from '../src/modules/auth/models/user.model.js';
import { Hostel } from '../src/modules/hostel/models/hostel.model.js';
import { HostelBlock } from '../src/modules/hostel/models/hostelBlock.model.js';
import { Room } from '../src/modules/hostel/models/room.model.js';
import { StudentRoomAllocation } from '../src/modules/hostel/models/studentRoomAllocation.model.js';
import { FacilityAsset } from '../src/modules/hostel/models/facilityAsset.model.js';
import { Complaint } from '../src/modules/complaints/models/complaint.model.js';
import { ComplaintAssignment } from '../src/modules/complaints/models/complaintAssignment.model.js';
import { ComplaintAudit } from '../src/modules/complaints/models/complaintAudit.model.js';
import { MessMenu } from '../src/modules/hostel/models/messMenu.model.js';
import { MessFeedback } from '../src/modules/hostel/models/messFeedback.model.js';
import { tokenService } from '../src/modules/auth/services/token.service.js';
import { passwordService } from '../src/modules/auth/services/password.service.js';
import {
  UserRole,
  HostelCategory,
  AssetCategory,
  ComplaintCategory,
  MealType,
} from '../src/types/index.js';

describe('Phase B3 Operations Domain API Integration Tests', () => {
  const app = createApp();
  let adminToken: string;
  let wardenToken: string;
  let staffToken: string;
  let studentToken: string;
  let studentId: string;
  let staffId: string;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fretbox';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { dbName: 'fretbox_test_b3_integration' });
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
    await Hostel.deleteMany({});
    await HostelBlock.deleteMany({});
    await Room.deleteMany({});
    await StudentRoomAllocation.deleteMany({});
    await FacilityAsset.deleteMany({});
    await Complaint.deleteMany({});
    await ComplaintAssignment.deleteMany({});
    await ComplaintAudit.deleteMany({});
    await MessMenu.deleteMany({});
    await MessFeedback.deleteMany({});

    const passwordHash = await passwordService.hashPassword('Password123!');

    const admin = await User.create({
      name: 'Admin',
      email: 'admin@b3.com',
      passwordHash,
      role: UserRole.ADMINISTRATOR,
    });
    const warden = await User.create({
      name: 'Warden',
      email: 'warden@b3.com',
      passwordHash,
      role: UserRole.WARDEN,
    });
    const staff = await User.create({
      name: 'Staff',
      email: 'staff@b3.com',
      passwordHash,
      role: UserRole.STAFF,
    });
    const student = await User.create({
      name: 'Student',
      email: 'student@b3.com',
      passwordHash,
      role: UserRole.STUDENT,
    });

    studentId = student._id.toString();
    staffId = staff._id.toString();

    adminToken = tokenService.generateAccessToken(admin._id.toString(), UserRole.ADMINISTRATOR);
    wardenToken = tokenService.generateAccessToken(warden._id.toString(), UserRole.WARDEN);
    staffToken = tokenService.generateAccessToken(staff._id.toString(), UserRole.STAFF);
    studentToken = tokenService.generateAccessToken(student._id.toString(), UserRole.STUDENT);
  });

  it('1. Hostel & Room Allocation Flow', async () => {
    // Create Hostel (Admin)
    const hostelRes = await request(app)
      .post('/api/v1/hostels')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Nilgiri Hostel',
        code: 'NIL',
        category: HostelCategory.BOYS,
        capacity: 50,
      });

    expect(hostelRes.status).toBe(201);
    const hostelId = hostelRes.body.data._id;

    // Create Block (Warden)
    const blockRes = await request(app)
      .post('/api/v1/hostels/blocks')
      .set('Authorization', `Bearer ${wardenToken}`)
      .send({
        hostelId,
        name: 'Block A',
        code: 'A',
        floors: 2,
      });

    expect(blockRes.status).toBe(201);
    const blockId = blockRes.body.data._id;

    // Create Room
    const roomRes = await request(app)
      .post('/api/v1/hostels/rooms')
      .set('Authorization', `Bearer ${wardenToken}`)
      .send({
        blockId,
        roomNumber: '101',
        floorNumber: 1,
        capacity: 2,
      });

    expect(roomRes.status).toBe(201);
    const roomId = roomRes.body.data._id;

    // Allocate Room to Student
    const allocRes = await request(app)
      .post('/api/v1/hostels/allocations')
      .set('Authorization', `Bearer ${wardenToken}`)
      .send({
        studentId,
        roomId,
        remarks: 'Fall Semester',
      });

    expect(allocRes.status).toBe(201);
    const allocId = allocRes.body.data._id;

    // Student GET /hostels/allocations/my
    const myAllocRes = await request(app)
      .get('/api/v1/hostels/allocations/my')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(myAllocRes.status).toBe(200);
    expect(myAllocRes.body.data.roomId._id).toBe(roomId);

    // Vacate Room
    const vacateRes = await request(app)
      .patch(`/api/v1/hostels/allocations/${allocId}/vacate`)
      .set('Authorization', `Bearer ${wardenToken}`)
      .send({ remarks: 'Vacated early' });

    expect(vacateRes.status).toBe(200);
    expect(vacateRes.body.data.status).toBe('vacated');
  });

  it('2. Facility Asset CRUD Flow', async () => {
    const createRes = await request(app)
      .post('/api/v1/facilities')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        name: 'Common Room TV',
        assetTag: 'TV-001',
        category: AssetCategory.APPLIANCE,
        locationText: 'Main Hall',
      });

    expect(createRes.status).toBe(201);
    const assetId = createRes.body.data._id;

    const getRes = await request(app)
      .get('/api/v1/facilities')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.total).toBe(1);

    const updateRes = await request(app)
      .patch(`/api/v1/facilities/${assetId}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ condition: 'fair' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.condition).toBe('fair');
  });

  it('3. Complaint Lifecycle & Metrics Flow', async () => {
    // Create Complaint (Student)
    const createRes = await request(app)
      .post('/api/v1/complaints')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'WiFi Router Offline',
        description: 'No internet access in corridor B',
        category: ComplaintCategory.NETWORK,
      });

    expect(createRes.status).toBe(201);
    const complaintId = createRes.body.data._id;
    expect(createRes.body.data.ticketNumber).toBeDefined();

    // Assign Complaint (Warden)
    const assignRes = await request(app)
      .patch(`/api/v1/complaints/${complaintId}/assign`)
      .set('Authorization', `Bearer ${wardenToken}`)
      .send({
        assignedToStaffId: staffId,
        notes: 'Check network switch',
      });

    expect(assignRes.status).toBe(200);
    expect(assignRes.body.data.status).toBe('assigned');

    // Update Status to RESOLVED (Staff)
    const statusRes = await request(app)
      .patch(`/api/v1/complaints/${complaintId}/status`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        status: 'resolved',
        resolutionNotes: 'Rebooted main access point',
      });

    expect(statusRes.status).toBe(200);
    expect(statusRes.body.data.status).toBe('resolved');

    // Get Metrics (Admin)
    const metricsRes = await request(app)
      .get('/api/v1/complaints/metrics')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(metricsRes.status).toBe(200);
    expect(metricsRes.body.data.statusCounts.resolved).toBe(1);
  });

  it('4. Mess Menu & Feedback Flow', async () => {
    // Create Mess Menu (Warden)
    const menuRes = await request(app)
      .post('/api/v1/mess/menus')
      .set('Authorization', `Bearer ${wardenToken}`)
      .send({
        date: new Date().toISOString(),
        mealType: MealType.DINNER,
        items: ['Kadai Paneer', 'Naan', 'Dal Makhani', 'Rice', 'Kheer'],
        description: 'Dinner Menu',
      });

    expect(menuRes.status).toBe(201);
    const menuId = menuRes.body.data._id;

    // Student Submits Feedback
    const fbRes = await request(app)
      .post(`/api/v1/mess/menus/${menuId}/feedback`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        rating: 5,
        comments: 'Awesome dinner!',
      });

    expect(fbRes.status).toBe(201);

    // Get Summary
    const summaryRes = await request(app)
      .get(`/api/v1/mess/menus/${menuId}/feedback/summary`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.data.averageRating).toBe(5);
  });

  it('5. RBAC Forbidden Access Check', async () => {
    // Student trying to create hostel block should get 403
    const forbiddenRes = await request(app)
      .post('/api/v1/hostels')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        name: 'Unauthorized Hostel',
        code: 'UNAUTH',
        category: HostelCategory.COED,
      });

    expect(forbiddenRes.status).toBe(403);
    expect(forbiddenRes.body.error.code).toBe('AUTH_FORBIDDEN');
  });
});
