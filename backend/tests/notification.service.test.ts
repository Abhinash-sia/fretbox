import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import mongoose, { Types } from 'mongoose';
import { Notification } from '../src/models/notification.model.js';
import { NotificationService } from '../src/services/notification.service.js';
import { AnnouncementPriority, NotFoundError, NotificationType } from '../src/types/index.js';

describe('NotificationService Unit Tests', () => {
  const recipientId = new Types.ObjectId().toString();
  const announcementId = new Types.ObjectId();

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fretbox';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, { dbName: 'fretbox_test_notification_service' });
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db?.dropDatabase();
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await Notification.deleteMany({});
    await Notification.syncIndexes();
  });

  it('should create notification records idempotently and prevent duplicates', async () => {
    const recId = new Types.ObjectId();
    const created1 = await NotificationService.createNotificationsForAnnouncement(
      announcementId,
      'Test Title',
      'Test Body',
      AnnouncementPriority.NORMAL,
      [recId],
    );

    expect(created1.length).toBe(1);

    // Second call for same announcement & recipient should not duplicate
    await NotificationService.createNotificationsForAnnouncement(
      announcementId,
      'Test Title',
      'Test Body',
      AnnouncementPriority.NORMAL,
      [recId],
    );

    const allNotifs = await Notification.find({ recipientId: recId, announcementId });
    expect(allNotifs.length).toBe(1);
  });

  it('should mark notification as read idempotently', async () => {
    const notif = await Notification.create({
      recipientId: new Types.ObjectId(recipientId),
      type: NotificationType.ANNOUNCEMENT,
      title: 'Title',
      body: 'Body',
    });

    const readNotif = await NotificationService.markAsRead(notif._id.toString(), recipientId);
    expect(readNotif.readAt).toBeDefined();

    const firstReadTime = readNotif.readAt!.getTime();

    // Second read call should return same state without overwriting timestamp
    const secondRead = await NotificationService.markAsRead(notif._id.toString(), recipientId);
    expect(secondRead.readAt!.getTime()).toBe(firstReadTime);
  });

  it('should mark notification as actioned idempotently', async () => {
    const notif = await Notification.create({
      recipientId: new Types.ObjectId(recipientId),
      type: NotificationType.ANNOUNCEMENT,
      title: 'Title',
      body: 'Body',
    });

    const actioned = await NotificationService.markAsActioned(notif._id.toString(), recipientId);
    expect(actioned.actionAt).toBeDefined();
    expect(actioned.readAt).toBeDefined();
  });

  it('should isolate notification ownership and forbid foreign user reads', async () => {
    const foreignUser = new Types.ObjectId().toString();
    const notif = await Notification.create({
      recipientId: new Types.ObjectId(recipientId),
      type: NotificationType.ANNOUNCEMENT,
      title: 'Private',
      body: 'Private body',
    });

    await expect(NotificationService.markAsRead(notif._id.toString(), foreignUser)).rejects.toThrow(
      NotFoundError,
    );
  });

  it('should calculate unread notification count correctly', async () => {
    const userObjId = new Types.ObjectId(recipientId);
    await Notification.create([
      { recipientId: userObjId, title: 'N1', body: 'B1', readAt: null },
      { recipientId: userObjId, title: 'N2', body: 'B2', readAt: null },
      { recipientId: userObjId, title: 'N3', body: 'B3', readAt: new Date() },
    ]);

    const unreadCount = await NotificationService.getUnreadCount(recipientId);
    expect(unreadCount).toBe(2);
  });
});
