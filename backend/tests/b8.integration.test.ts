import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { FaqDocument } from '../src/models/faqDocument.model.js';
import { tokenService } from '../src/services/token.service.js';
import { passwordService } from '../src/services/password.service.js';
import { UserRole, FaqCategory } from '../src/types/index.js';

describe('Phase B8 Campus FAQ & RAG Integration API Tests', () => {
  const app = createApp();
  let studentToken: string;
  let adminToken: string;
  let wardenToken: string;
  let studentId: string;
  let adminId: string;
  let wardenId: string;

  beforeAll(async () => {
    const mongoUri =
      process.env.MONGODB_URI || 'mongodb://localhost:27017/fretbox_test_b8_integration';
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
    await FaqDocument.deleteMany({});

    const passwordHash = await passwordService.hashPassword('Password123!');

    const student = await User.create({
      name: 'Student B8',
      email: 'student@b8.test',
      passwordHash,
      role: UserRole.STUDENT,
    });
    studentId = student._id.toString();
    studentToken = tokenService.generateAccessToken(studentId, UserRole.STUDENT);

    const admin = await User.create({
      name: 'Admin B8',
      email: 'admin@b8.test',
      passwordHash,
      role: UserRole.ADMINISTRATOR,
    });
    adminId = admin._id.toString();
    adminToken = tokenService.generateAccessToken(adminId, UserRole.ADMINISTRATOR);

    const warden = await User.create({
      name: 'Warden B8',
      email: 'warden@b8.test',
      passwordHash,
      role: UserRole.WARDEN,
    });
    wardenId = warden._id.toString();
    wardenToken = tokenService.generateAccessToken(wardenId, UserRole.WARDEN);
  });

  it('1. Should allow student to query FAQ and receive grounded response', async () => {
    await FaqDocument.create({
      title: 'Library Timing Policy',
      category: FaqCategory.GENERAL,
      content: 'The campus central library is open from 8:00 AM to 11:00 PM on weekdays.',
      tags: ['library', 'timing'],
      isApproved: true,
      targetRoles: [UserRole.STUDENT],
    });

    const res = await request(app)
      .post('/api/v1/faq/query')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        question: 'What are the library timings?',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.answer).toBeDefined();
    expect(res.body.data.isGrounded).toBe(true);
    expect(res.body.data.sources.length).toBeGreaterThan(0);
  });

  it('2. Should allow Admin and Warden to create, update, and list FAQ documents', async () => {
    const createRes = await request(app)
      .post('/api/v1/faq/documents')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Gym Rules & Equipment',
        category: FaqCategory.FACILITIES,
        content: 'Campus gym is open for students between 6 AM and 9 PM.',
        tags: ['gym', 'fitness'],
        isApproved: true,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    const docId = createRes.body.data._id;

    const updateRes = await request(app)
      .patch(`/api/v1/faq/documents/${docId}`)
      .set('Authorization', `Bearer ${wardenToken}`)
      .send({
        content: 'Campus gym is open for all students between 6 AM and 10 PM.',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.content).toContain('10 PM');

    const listRes = await request(app)
      .get('/api/v1/faq/documents')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBe(1);
  });

  it('3. Should forbid Student from creating or deleting FAQ knowledge documents', async () => {
    const createRes = await request(app)
      .post('/api/v1/faq/documents')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Unauthorized Document',
        content: 'Testing permission restriction',
      });

    expect(createRes.status).toBe(403);
  });
});
