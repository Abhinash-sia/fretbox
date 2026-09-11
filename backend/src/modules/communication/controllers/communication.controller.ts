import { Request, Response, NextFunction } from 'express';
import { AnnouncementService } from '../services/announcement.service.js';
import { NotificationService } from '../services/notification.service.js';
import { sendSuccess } from '../../../utils/response.js';
import {
  AuthUserContext,
  NotificationType,
  AnnouncementPriority,
  AnnouncementStatus,
} from '../../../types/index.js';

export const createAnnouncement = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user as AuthUserContext;
    const announcement = await AnnouncementService.createAnnouncement(user, req.body);
    sendSuccess(res, announcement, 201, 'Announcement created successfully');
  } catch (err) {
    next(err);
  }
};

export const updateAnnouncement = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user as AuthUserContext;
    const { id } = req.params;
    const announcement = await AnnouncementService.updateDraft(id!, user, req.body);
    sendSuccess(res, announcement, 200, 'Announcement updated successfully');
  } catch (err) {
    next(err);
  }
};

export const getAnnouncementById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user as AuthUserContext;
    const { id } = req.params;
    const announcement = await AnnouncementService.getAnnouncementById(id!, user);
    sendSuccess(res, announcement);
  } catch (err) {
    next(err);
  }
};

export const listAnnouncements = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user as AuthUserContext;
    const result = await AnnouncementService.listAnnouncements(user, {
      page: req.query.page as string,
      limit: req.query.limit as string,
      status: req.query.status as AnnouncementStatus,
    });
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const publishAnnouncement = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user as AuthUserContext;
    const { id } = req.params;
    const announcement = await AnnouncementService.publishAnnouncement(id!, user);
    sendSuccess(res, announcement, 200, 'Announcement published successfully');
  } catch (err) {
    next(err);
  }
};

export const cancelAnnouncement = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user as AuthUserContext;
    const { id } = req.params;
    const announcement = await AnnouncementService.cancelAnnouncement(id!, user);
    sendSuccess(res, announcement, 200, 'Announcement cancelled successfully');
  } catch (err) {
    next(err);
  }
};

export const getAnnouncementStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user as AuthUserContext;
    const { id } = req.params;
    const stats = await AnnouncementService.getAnnouncementStats(id!, user);
    sendSuccess(res, stats);
  } catch (err) {
    next(err);
  }
};

export const listNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user as AuthUserContext;
    const result = await NotificationService.listNotificationsForUser(user.id, {
      unreadOnly: req.query.unreadOnly as string,
      type: req.query.type as NotificationType,
      priority: req.query.priority as AnnouncementPriority,
      page: req.query.page as string,
      limit: req.query.limit as string,
    });
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

export const getUnreadNotificationCount = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = req.user as AuthUserContext;
    const count = await NotificationService.getUnreadCount(user.id);
    sendSuccess(res, { unreadCount: count });
  } catch (err) {
    next(err);
  }
};

export const markNotificationAsRead = async (
  req: Request,
  res: Response,
  next: import('express').NextFunction,
): Promise<void> => {
  try {
    const user = req.user as AuthUserContext;
    const { id } = req.params;
    const notification = await NotificationService.markAsRead(id!, user.id);
    sendSuccess(res, notification, 200, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
};

export const markNotificationAsActioned = async (
  req: Request,
  res: Response,
  next: import('express').NextFunction,
): Promise<void> => {
  try {
    const user = req.user as AuthUserContext;
    const { id } = req.params;
    const notification = await NotificationService.markAsActioned(id!, user.id);
    sendSuccess(res, notification, 200, 'Notification marked as actioned');
  } catch (err) {
    next(err);
  }
};
