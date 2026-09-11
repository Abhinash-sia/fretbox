import { Router } from 'express';
import {
  createAnnouncement,
  updateAnnouncement,
  getAnnouncementById,
  listAnnouncements,
  publishAnnouncement,
  cancelAnnouncement,
  getAnnouncementStats,
  listNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markNotificationAsActioned,
} from '../controllers/communication.controller.js';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { authorize } from '../../../middlewares/rbac.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { UserRole } from '../../../types/index.js';
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  announcementIdParamSchema,
  listNotificationsQuerySchema,
  notificationIdParamSchema,
} from '../schemas/b5.schemas.js';

const router = Router();

router.use(authenticate);

// --------------------------------------------------
// Announcement Endpoints
// --------------------------------------------------
router.post(
  '/announcements',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN),
  validate(createAnnouncementSchema),
  createAnnouncement,
);

router.get('/announcements', listAnnouncements);

router.get('/announcements/:id', validate(announcementIdParamSchema), getAnnouncementById);

router.patch(
  '/announcements/:id',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN),
  validate(updateAnnouncementSchema),
  updateAnnouncement,
);

router.post(
  '/announcements/:id/publish',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN),
  validate(announcementIdParamSchema),
  publishAnnouncement,
);

router.post(
  '/announcements/:id/cancel',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN),
  validate(announcementIdParamSchema),
  cancelAnnouncement,
);

router.get(
  '/announcements/:id/stats',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN),
  validate(announcementIdParamSchema),
  getAnnouncementStats,
);

// --------------------------------------------------
// Notification Endpoints (Recipient-scoped)
// --------------------------------------------------
router.get('/notifications', validate(listNotificationsQuerySchema), listNotifications);

router.get('/notifications/unread-count', getUnreadNotificationCount);

router.patch(
  '/notifications/:id/read',
  validate(notificationIdParamSchema),
  markNotificationAsRead,
);

router.patch(
  '/notifications/:id/action',
  validate(notificationIdParamSchema),
  markNotificationAsActioned,
);

export default router;
