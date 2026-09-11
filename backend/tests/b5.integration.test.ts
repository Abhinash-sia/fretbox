import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { User } from '../src/modules/auth/models/user.model.js';
import { Announcement } from '../src/modules/communication/models/announcement.model.js';
import { Notification } from '../src/modules/communication/models/notification.model.js';
import { passwordService } from '../src/modules/auth/services/password.service.js';
import { tokenService } from '../src/modules/auth/services/token.service.js';
import { AnnouncementStatus, UserRole } from '../src/types/index.js';

describe('Phase B5 Communication Integration API Tests', () => {
  const app = createApp();
  let adminToken: string;
  let studentToken: string;
  let student2Token: string;
  let studentId: string;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fretbox';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { dbName: 'fretbox_test_b5_integration' });
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
    await Announcement.deleteMany({});
    await Notification.deleteMany({});
    await Notification.syncIndexes();

    const passwordHash = await passwordService.hashPassword('Password123!');

    const admin = await User.create({
      name: 'Admin',
      email: 'admin@b5.com',
      passwordHash,
      role: UserRole.ADMINISTRATOR,
    });
    const student1 = await User.create({
      name: 'Student 1',
      email: 's1@b5.com',
      passwordHash,
      role: UserRole.STUDENT,
    });
    const student2 = await User.create({
      name: 'Student 2',
      email: 's2@b5.com',
      passwordHash,
      role: UserRole.STUDENT,
    });

    studentId = student1._id.toString();

    adminToken = tokenService.generateAccessToken(admin._id.toString(), UserRole.ADMINISTRATOR);
    studentToken = tokenService.generateAccessToken(student1._id.toString(), UserRole.STUDENT);
    student2Token = tokenService.generateAccessToken(student2._id.toString(), UserRole.STUDENT);
  });

  it('1. Complete Announcement Lifecycle & Recipient Notification Flow', async () => {
    // Step 1: Admin creates draft announcement
    const createRes = await request(app)
      .post('/api/v1/communication/announcements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'End Semester Exams Schedule',
        body: 'Final exam schedule has been published.',
        priority: 'high',
        target: { roles: ['student'] },
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    const annId = createRes.body.data._id;

    // Step 2: Admin publishes announcement
    const publishRes = await request(app)
      .post(`/api/v1/communication/announcements/${annId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(publishRes.status).toBe(200);
    expect(publishRes.body.data.status).toBe(AnnouncementStatus.PUBLISHED);

    // Step 3: Verify idempotency - publishing again should be a safe no-op
    const republishRes = await request(app)
      .post(`/api/v1/communication/announcements/${annId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(republishRes.status).toBe(200);

    // Verify exactly 1 notification per student exists
    const notifCount = await Notification.countDocuments({ announcementId: annId });
    expect(notifCount).toBe(2);

    // Step 4: Student 1 retrieves notifications
    const getNotifsRes = await request(app)
      .get('/api/v1/communication/notifications?unreadOnly=true')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(getNotifsRes.status).toBe(200);
    expect(getNotifsRes.body.data.notifications.length).toBe(1);
    const notifId = getNotifsRes.body.data.notifications[0]._id;

    // Step 5: Check unread count
    const unreadRes = await request(app)
      .get('/api/v1/communication/notifications/unread-count')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(unreadRes.body.data.unreadCount).toBe(1);

    // Step 6: Student 1 marks notification as read
    const markReadRes = await request(app)
      .patch(`/api/v1/communication/notifications/${notifId}/read`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(markReadRes.status).toBe(200);
    expect(markReadRes.body.data.readAt).toBeDefined();

    // Step 7: Unread count drops to 0
    const updatedUnreadRes = await request(app)
      .get('/api/v1/communication/notifications/unread-count')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(updatedUnreadRes.body.data.unreadCount).toBe(0);

    // Step 8: Student 1 records action
    const actionRes = await request(app)
      .patch(`/api/v1/communication/notifications/${notifId}/action`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(actionRes.status).toBe(200);
    expect(actionRes.body.data.actionAt).toBeDefined();

    // Step 9: Admin inspects announcement stats
    const statsRes = await request(app)
      .get(`/api/v1/communication/announcements/${annId}/stats`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(statsRes.status).toBe(200);
    expect(statsRes.body.data.totalRecipients).toBe(2);
    expect(statsRes.body.data.readCount).toBe(1);
    expect(statsRes.body.data.actionCount).toBe(1);
  });

  it('2. Notification Ownership Protection Isolation', async () => {
    // Admin creates and publishes announcement
    const createRes = await request(app)
      .post('/api/v1/communication/announcements')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Targeted Notice',
        body: 'Targeted Notice Body',
        target: { roles: ['student'] },
      });
    const annId = createRes.body.data._id;
    await request(app)
      .post(`/api/v1/communication/announcements/${annId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`);

    // Student 1 gets their notification ID
    const student1Notif = await Notification.findOne({ recipientId: studentId });
    expect(student1Notif).toBeDefined();

    // Student 2 attempts to mark Student 1's notification as read
    const crossReadRes = await request(app)
      .patch(`/api/v1/communication/notifications/${student1Notif!._id}/read`)
      .set('Authorization', `Bearer ${student2Token}`);

    expect(crossReadRes.status).toBe(404);
    expect(crossReadRes.body.success).toBe(false);
    expect(crossReadRes.body.error.code).toBe('NOT_FOUND');
  });
});
