import { Types } from 'mongoose';
import { Notification, INotificationDocument } from '../models/notification.model.js';
import { emitToUser } from './realtime.service.js';
import {
  AnnouncementPriority,
  BadRequestError,
  NotFoundError,
  NotificationDeliveryStatus,
  NotificationType,
} from '../../../types/index.js';

export class NotificationService {
  /**
   * Bulk creates notification records for announcement recipients using ordered: false for idempotency.
   */
  public static async createNotificationsForAnnouncement(
    announcementId: Types.ObjectId,
    title: string,
    body: string,
    priority: AnnouncementPriority,
    recipientIds: Types.ObjectId[],
  ): Promise<INotificationDocument[]> {
    if (recipientIds.length === 0) {
      return [];
    }

    const docs = recipientIds.map((recipientId) => ({
      recipientId,
      announcementId,
      type: NotificationType.ANNOUNCEMENT,
      title,
      body,
      priority,
      deliveryStatus: NotificationDeliveryStatus.PENDING,
    }));

    try {
      // ordered: false allows successful inserts while ignoring duplicate key errors
      const inserted = await Notification.insertMany(docs, { ordered: false });
      return inserted as unknown as INotificationDocument[];
    } catch {
      // Mongoose bulkWrite error with code 11000 for duplicate keys can be handled gracefully
      const notifications = await Notification.find({
        announcementId,
        type: NotificationType.ANNOUNCEMENT,
      });
      return notifications;
    }
  }

  /**
   * Attempts real-time Socket.IO delivery for pending notifications.
   */
  public static async attemptRealtimeDelivery(
    notifications: INotificationDocument[],
  ): Promise<void> {
    const now = new Date();

    for (const notif of notifications) {
      const isConnected = emitToUser(notif.recipientId.toString(), 'notification:new', {
        notificationId: notif._id.toString(),
        announcementId: notif.announcementId?.toString(),
        type: notif.type,
        title: notif.title,
        body: notif.body,
        priority: notif.priority,
        createdAt: notif.createdAt,
      });

      if (isConnected) {
        await Notification.findByIdAndUpdate(notif._id, {
          $set: {
            deliveryStatus: NotificationDeliveryStatus.DELIVERED,
            deliveredAt: now,
          },
        });
      }
    }
  }

  /**
   * Lists notifications for current user with filtering & pagination.
   */
  public static async listNotificationsForUser(
    recipientId: string,
    query: {
      unreadOnly?: string;
      type?: NotificationType;
      priority?: AnnouncementPriority;
      page?: string;
      limit?: string;
    },
  ) {
    const pageNum = parseInt(query.page || '1', 10);
    const limitNum = Math.min(parseInt(query.limit || '20', 10), 100);
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = {
      recipientId: new Types.ObjectId(recipientId),
    };

    if (query.unreadOnly === 'true') {
      filter.readAt = null;
    }
    if (query.type) {
      filter.type = query.type;
    }
    if (query.priority) {
      filter.priority = query.priority;
    }

    const [notifications, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Notification.countDocuments(filter),
    ]);

    return {
      notifications,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Returns total unread notification count for current user.
   */
  public static async getUnreadCount(recipientId: string): Promise<number> {
    return Notification.countDocuments({
      recipientId: new Types.ObjectId(recipientId),
      readAt: null,
    });
  }

  /**
   * Marks notification as read idempotently (first read wins).
   */
  public static async markAsRead(
    notificationId: string,
    recipientId: string,
  ): Promise<INotificationDocument> {
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new BadRequestError('Invalid notification ID format');
    }

    const notif = await Notification.findOne({
      _id: new Types.ObjectId(notificationId),
      recipientId: new Types.ObjectId(recipientId),
    });

    if (!notif) {
      throw new NotFoundError('Notification not found');
    }

    if (!notif.readAt) {
      notif.readAt = new Date();
      await notif.save();

      // Emit real-time read acknowledgment event to user's room
      emitToUser(recipientId, 'notification:read', {
        notificationId: notif._id.toString(),
        readAt: notif.readAt,
      });
    }

    return notif;
  }

  /**
   * Marks notification as actioned idempotently (first action wins).
   */
  public static async markAsActioned(
    notificationId: string,
    recipientId: string,
  ): Promise<INotificationDocument> {
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new BadRequestError('Invalid notification ID format');
    }

    const notif = await Notification.findOne({
      _id: new Types.ObjectId(notificationId),
      recipientId: new Types.ObjectId(recipientId),
    });

    if (!notif) {
      throw new NotFoundError('Notification not found');
    }

    if (!notif.actionAt) {
      notif.actionAt = new Date();
      // If not already read, set readAt as well
      if (!notif.readAt) {
        notif.readAt = notif.actionAt;
      }
      await notif.save();

      // Emit real-time action acknowledgment event to user's room
      emitToUser(recipientId, 'notification:action', {
        notificationId: notif._id.toString(),
        actionAt: notif.actionAt,
      });
    }

    return notif;
  }
}
