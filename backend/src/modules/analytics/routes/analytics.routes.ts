import { Router } from 'express';
import {
  getOverview,
  getComplaintAnalytics,
  getWorkloadAnalytics,
  getRecurringIssues,
  getAttendanceAnalytics,
  getLowAttendanceStudents,
  getHostelAnalytics,
  getFacilityAnalytics,
  getMessAnalytics,
  getGateAnalytics,
  getCommunicationAnalytics,
} from '../controllers/analytics.controller.js';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { authorize } from '../../../middlewares/rbac.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { UserRole } from '../../../types/index.js';
import {
  analyticsTimeRangeSchema,
  complaintAnalyticsQuerySchema,
  attendanceAnalyticsQuerySchema,
  lowAttendanceQuerySchema,
  recurringIssuesQuerySchema,
} from '../schemas/b6.schemas.js';

const router = Router();

router.use(authenticate);

// Global overview analytics (Admin, Warden)
router.get(
  '/overview',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN),
  validate(analyticsTimeRangeSchema),
  getOverview,
);

// Complaint analytics (Admin, Warden)
router.get(
  '/complaints',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN),
  validate(complaintAnalyticsQuerySchema),
  getComplaintAnalytics,
);

// Workload analytics (Admin, Warden)
router.get(
  '/workload',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN),
  validate(analyticsTimeRangeSchema),
  getWorkloadAnalytics,
);

// Recurring issues analytics (Admin, Warden)
router.get(
  '/recurring-issues',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN),
  validate(recurringIssuesQuerySchema),
  getRecurringIssues,
);

// Attendance analytics (Admin only)
router.get(
  '/attendance',
  authorize(UserRole.ADMINISTRATOR),
  validate(attendanceAnalyticsQuerySchema),
  getAttendanceAnalytics,
);

// Low attendance analytics (Admin only)
router.get(
  '/attendance/low',
  authorize(UserRole.ADMINISTRATOR),
  validate(lowAttendanceQuerySchema),
  getLowAttendanceStudents,
);

// Hostel analytics (Admin, Warden)
router.get('/hostels', authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN), getHostelAnalytics);

// Facility analytics (Admin, Warden)
router.get('/facilities', authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN), getFacilityAnalytics);

// Mess analytics (Admin, Warden)
router.get(
  '/mess',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN),
  validate(analyticsTimeRangeSchema),
  getMessAnalytics,
);

// Gate analytics (Admin ONLY - Security explicitly forbidden from analytics)
router.get(
  '/gates',
  authorize(UserRole.ADMINISTRATOR),
  validate(analyticsTimeRangeSchema),
  getGateAnalytics,
);

// Communication analytics (Admin only)
router.get(
  '/communication',
  authorize(UserRole.ADMINISTRATOR),
  validate(analyticsTimeRangeSchema),
  getCommunicationAnalytics,
);

export default router;
