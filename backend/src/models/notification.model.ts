import { Schema, model, Document, Types } from 'mongoose';
import {
  AnnouncementPriority,
  NotificationDeliveryStatus,
  NotificationType,
} from '../types/index.js';

export interface INotification {
  recipientId: Types.ObjectId;
  announcementId?: Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  priority: AnnouncementPriority;
  readAt?: Date;
  actionAt?: Date;
  deliveredAt?: Date;
  deliveryStatus: NotificationDeliveryStatus;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface INotificationDocument extends INotification, Document {}

const notificationSchema = new Schema<INotificationDocument>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient User ID is required'],
      index: true,
    },
    announcementId: {
      type: Schema.Types.ObjectId,
      ref: 'Announcement',
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      default: NotificationType.ANNOUNCEMENT,
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    body: {
      type: String,
      required: [true, 'Notification body is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: Object.values(AnnouncementPriority),
      default: AnnouncementPriority.NORMAL,
    },
    readAt: {
      type: Date,
      default: null,
    },
    actionAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    deliveryStatus: {
      type: String,
      enum: Object.values(NotificationDeliveryStatus),
      default: NotificationDeliveryStatus.PENDING,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

// Enforce mandatory idempotency: one notification per recipient per announcement per type
notificationSchema.index(
  { recipientId: 1, announcementId: 1, type: 1 },
  { unique: true, partialFilterExpression: { announcementId: { $type: 'objectId' } } },
);

// Performance index for list querying and unread counts
notificationSchema.index({ recipientId: 1, readAt: 1, createdAt: -1 });

export const Notification = model<INotificationDocument>('Notification', notificationSchema);
