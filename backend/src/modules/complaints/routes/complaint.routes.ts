import { Router } from 'express';
import {
  createComplaint,
  getComplaints,
  getComplaintById,
  assignComplaint,
  updateComplaintStatus,
  getComplaintMetrics,
  getRecurringIssues,
  classifyComplaintWithAi,
  applyAiClassification,
} from '../controllers/complaint.controller.js';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { authorize } from '../../../middlewares/rbac.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { UserRole } from '../../../types/index.js';
import {
  createComplaintSchema,
  assignComplaintSchema,
  updateComplaintStatusSchema,
} from '../../hostel/schemas/b3.schemas.js';
import { aiApplyClassificationSchema } from '../../ai/complaint-classification/schemas/b7.schemas.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createComplaintSchema), createComplaint);
router.get('/', getComplaints);
router.get(
  '/metrics',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN, UserRole.STAFF),
  getComplaintMetrics,
);
router.get(
  '/recurring',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN, UserRole.STAFF),
  getRecurringIssues,
);
router.get('/:id', getComplaintById);
router.post('/:id/ai-classify', classifyComplaintWithAi);
router.post(
  '/:id/ai-apply',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN),
  validate(aiApplyClassificationSchema),
  applyAiClassification,
);
router.patch(
  '/:id/assign',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN),
  validate(assignComplaintSchema),
  assignComplaint,
);
router.patch('/:id/status', validate(updateComplaintStatusSchema), updateComplaintStatus);

export default router;
