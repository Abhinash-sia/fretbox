import { Types } from 'mongoose';
import { Announcement, IAnnouncementDocument } from '../models/announcement.model.js';
import { Notification } from '../models/notification.model.js';
import { AudienceService } from './audience.service.js';
import { NotificationService } from './notification.service.js';
import { emitToRole } from './realtime.service.js';
import {
  AnnouncementPriority,
  AnnouncementStats,
  AnnouncementStatus,
  AnnouncementTarget,
  AuthUserContext,
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UserRole,
} from '../../../types/index.js';

export class AnnouncementService {
  /**
   * Creates a draft announcement.
   */
  public static async createAnnouncement(
    creator: AuthUserContext,
    data: {
      title: string;
      body: string;
      target?: AnnouncementTarget;
      priority?: AnnouncementPriority;
      publishAt?: string;
      expiresAt?: string;
    },
  ): Promise<IAnnouncementDocument> {
    if (creator.role !== UserRole.ADMINISTRATOR && creator.role !== UserRole.WARDEN) {
      throw new ForbiddenError('Only Administrators and Wardens can create announcements');
    }

    const announcement = await Announcement.create({
      title: data.title,
      body: data.body,
      createdBy: new Types.ObjectId(creator.id),
      target: data.target || { all: true },
      priority: data.priority || AnnouncementPriority.NORMAL,
      status: AnnouncementStatus.DRAFT,
      publishAt: data.publishAt ? new Date(data.publishAt) : undefined,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    });

    return announcement;
  }

  /**
   * Updates a draft announcement.
   */
  public static async updateDraft(
    id: string,
    creator: AuthUserContext,
    data: {
      title?: string;
      body?: string;
      target?: AnnouncementTarget;
      priority?: AnnouncementPriority;
      publishAt?: string;
      expiresAt?: string;
    },
  ): Promise<IAnnouncementDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid announcement ID format');
    }

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      throw new NotFoundError('Announcement not found');
    }

    if (announcement.status !== AnnouncementStatus.DRAFT) {
      throw new BadRequestError('Only draft announcements can be edited');
    }

    if (
      creator.role !== UserRole.ADMINISTRATOR &&
      announcement.createdBy.toString() !== creator.id
    ) {
      throw new ForbiddenError('You can only edit your own draft announcements');
    }

    if (data.title) announcement.title = data.title;
    if (data.body) announcement.body = data.body;
    if (data.target) announcement.target = data.target;
    if (data.priority) announcement.priority = data.priority;
    if (data.publishAt) announcement.publishAt = new Date(data.publishAt);
    if (data.expiresAt) announcement.expiresAt = new Date(data.expiresAt);

    await announcement.save();
    return announcement;
  }

  /**
   * Gets announcement details by ID with role-aware visibility.
   */
  public static async getAnnouncementById(
    id: string,
    user: AuthUserContext,
  ): Promise<IAnnouncementDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid announcement ID format');
    }

    const announcement = await Announcement.findById(id).populate('createdBy', 'name email role');
    if (!announcement) {
      throw new NotFoundError('Announcement not found');
    }

    // Students/Security/Staff can only view published & non-expired announcements
    if (
      user.role === UserRole.STUDENT ||
      user.role === UserRole.SECURITY ||
      user.role === UserRole.STAFF
    ) {
      if (announcement.status !== AnnouncementStatus.PUBLISHED) {
        throw new NotFoundError('Announcement not found');
      }
      if (announcement.expiresAt && new Date() > announcement.expiresAt) {
        throw new NotFoundError('Announcement has expired');
      }
    }

    return announcement;
  }

  /**
   * Lists announcements with role-aware filters & pagination.
   */
  public static async listAnnouncements(
    user: AuthUserContext,
    query: { page?: string; limit?: string; status?: AnnouncementStatus },
  ) {
    const pageNum = parseInt(query.page || '1', 10);
    const limitNum = Math.min(parseInt(query.limit || '20', 10), 100);
    const skip = (pageNum - 1) * limitNum;

    const filter: Record<string, unknown> = {};

    if (
      user.role === UserRole.STUDENT ||
      user.role === UserRole.SECURITY ||
      user.role === UserRole.STAFF
    ) {
      filter.status = AnnouncementStatus.PUBLISHED;
      const now = new Date();
      filter.$or = [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: now } },
      ];
    } else if (query.status) {
      filter.status = query.status;
    }

    const [announcements, total] = await Promise.all([
      Announcement.find(filter)
        .populate('createdBy', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Announcement.countDocuments(filter),
    ]);

    return {
      announcements,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Publishes an announcement, resolves target recipients, creates notifications idempotently,
   * dispatches real-time Socket.IO events, and updates status to PUBLISHED.
   */
  public static async publishAnnouncement(
    id: string,
    creator: AuthUserContext,
  ): Promise<IAnnouncementDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid announcement ID format');
    }

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      throw new NotFoundError('Announcement not found');
    }

    if (announcement.status === AnnouncementStatus.PUBLISHED) {
      // Idempotency: if already published, return existing announcement without error or duplicate notifications
      return announcement;
    }

    if (announcement.status === AnnouncementStatus.CANCELLED) {
      throw new BadRequestError('Cannot publish a cancelled announcement');
    }

    if (announcement.status === AnnouncementStatus.EXPIRED) {
      throw new BadRequestError('Cannot publish an expired announcement');
    }

    if (
      creator.role !== UserRole.ADMINISTRATOR &&
      announcement.createdBy.toString() !== creator.id
    ) {
      throw new ForbiddenError('You can only publish your own announcements');
    }

    // 1. Resolve Target Recipients
    const recipientIds = await AudienceService.resolveRecipients(announcement.target, creator);

    // 2. Create Notification Records Idempotently
    const notifications = await NotificationService.createNotificationsForAnnouncement(
      announcement._id as Types.ObjectId,
      announcement.title,
      announcement.body,
      announcement.priority,
      recipientIds,
    );

    // 3. Update Announcement State to PUBLISHED
    const now = new Date();
    announcement.status = AnnouncementStatus.PUBLISHED;
    announcement.publishedAt = now;
    await announcement.save();

    // 4. Attempt Real-time Socket.IO Delivery
    await NotificationService.attemptRealtimeDelivery(notifications);

    // 5. Broadcast real-time announcement event to relevant role room
    emitToRole(UserRole.STUDENT, 'announcement:published', {
      announcementId: announcement._id.toString(),
      title: announcement.title,
      priority: announcement.priority,
      publishedAt: now,
    });

    return announcement;
  }

  /**
   * Cancels a draft or published announcement.
   */
  public static async cancelAnnouncement(
    id: string,
    creator: AuthUserContext,
  ): Promise<IAnnouncementDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid announcement ID format');
    }

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      throw new NotFoundError('Announcement not found');
    }

    if (announcement.status === AnnouncementStatus.CANCELLED) {
      return announcement;
    }

    if (announcement.status === AnnouncementStatus.EXPIRED) {
      throw new BadRequestError('Cannot cancel an expired announcement');
    }

    if (
      creator.role !== UserRole.ADMINISTRATOR &&
      announcement.createdBy.toString() !== creator.id
    ) {
      throw new ForbiddenError('You can only cancel your own announcements');
    }

    announcement.status = AnnouncementStatus.CANCELLED;
    announcement.cancelledAt = new Date();
    await announcement.save();

    return announcement;
  }

  /**
   * Aggregates notification stats for an announcement.
   */
  public static async getAnnouncementStats(
    id: string,
    user: AuthUserContext,
  ): Promise<AnnouncementStats> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid announcement ID format');
    }

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      throw new NotFoundError('Announcement not found');
    }

    if (user.role !== UserRole.ADMINISTRATOR && announcement.createdBy.toString() !== user.id) {
      throw new ForbiddenError('You can only view statistics for your own announcements');
    }

    const annId = new Types.ObjectId(id);

    const [totalRecipients, deliveredCount, pendingCount, failedCount, readCount, actionCount] =
      await Promise.all([
        Notification.countDocuments({ announcementId: annId }),
        Notification.countDocuments({ announcementId: annId, deliveryStatus: 'delivered' }),
        Notification.countDocuments({ announcementId: annId, deliveryStatus: 'pending' }),
        Notification.countDocuments({ announcementId: annId, deliveryStatus: 'failed' }),
        Notification.countDocuments({ announcementId: annId, readAt: { $ne: null } }),
        Notification.countDocuments({ announcementId: annId, actionAt: { $ne: null } }),
      ]);

    const readPercentage =
      totalRecipients > 0 ? Math.round((readCount / totalRecipients) * 10000) / 100 : 0;

    return {
      totalRecipients,
      deliveredCount,
      pendingCount,
      failedCount,
      readCount,
      actionCount,
      readPercentage,
    };
  }
}
