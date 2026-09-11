import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import mongoose, { Types } from 'mongoose';
import { Announcement } from '../src/modules/communication/models/announcement.model.js';
import { AnnouncementService } from '../src/modules/communication/services/announcement.service.js';
import {
  AnnouncementPriority,
  AnnouncementStatus,
  AuthUserContext,
  BadRequestError,
  ForbiddenError,
  UserRole,
} from '../src/types/index.js';

describe('AnnouncementService Unit Tests', () => {
  const adminUser: AuthUserContext = {
    id: new Types.ObjectId().toString(),
    email: 'admin@test.com',
    role: UserRole.ADMINISTRATOR,
  };

  const studentUser: AuthUserContext = {
    id: new Types.ObjectId().toString(),
    email: 'student@test.com',
    role: UserRole.STUDENT,
  };

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fretbox';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { dbName: 'fretbox_test_announcement_service' });
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db?.dropDatabase();
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await Announcement.deleteMany({});
  });

  it('should allow Administrator to create draft announcement', async () => {
    const announcement = await AnnouncementService.createAnnouncement(adminUser, {
      title: 'Exam Schedule',
      body: 'Midterm exams start next week.',
      priority: AnnouncementPriority.HIGH,
    });

    expect(announcement).toBeDefined();
    expect(announcement.title).toBe('Exam Schedule');
    expect(announcement.status).toBe(AnnouncementStatus.DRAFT);
    expect(announcement.createdBy.toString()).toBe(adminUser.id);
  });

  it('should forbid Student from creating announcements', async () => {
    await expect(
      AnnouncementService.createAnnouncement(studentUser, {
        title: 'Unauthorized',
        body: 'Students cannot create announcements',
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('should update draft announcement correctly', async () => {
    const draft = await AnnouncementService.createAnnouncement(adminUser, {
      title: 'Initial Title',
      body: 'Initial Body',
    });

    const updated = await AnnouncementService.updateDraft(draft._id.toString(), adminUser, {
      title: 'Updated Title',
      body: 'Updated Body',
    });

    expect(updated.title).toBe('Updated Title');
    expect(updated.body).toBe('Updated Body');
  });

  it('should prevent updating non-draft announcements', async () => {
    const draft = await AnnouncementService.createAnnouncement(adminUser, {
      title: 'Draft',
      body: 'Draft body',
    });

    await AnnouncementService.publishAnnouncement(draft._id.toString(), adminUser);

    await expect(
      AnnouncementService.updateDraft(draft._id.toString(), adminUser, {
        title: 'New Title',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should publish announcement and handle lifecycle transitions', async () => {
    const draft = await AnnouncementService.createAnnouncement(adminUser, {
      title: 'Campus Closure',
      body: 'Campus will be closed tomorrow due to weather.',
    });

    const published = await AnnouncementService.publishAnnouncement(
      draft._id.toString(),
      adminUser,
    );

    expect(published.status).toBe(AnnouncementStatus.PUBLISHED);
    expect(published.publishedAt).toBeDefined();

    // Idempotent re-publish check
    const republished = await AnnouncementService.publishAnnouncement(
      draft._id.toString(),
      adminUser,
    );
    expect(republished.status).toBe(AnnouncementStatus.PUBLISHED);
  });

  it('should cancel announcement successfully', async () => {
    const draft = await AnnouncementService.createAnnouncement(adminUser, {
      title: 'Event Cancelled',
      body: 'The annual fest has been postponed.',
    });

    const cancelled = await AnnouncementService.cancelAnnouncement(draft._id.toString(), adminUser);

    expect(cancelled.status).toBe(AnnouncementStatus.CANCELLED);
    expect(cancelled.cancelledAt).toBeDefined();
  });
});
