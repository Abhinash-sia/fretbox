import { Router } from 'express';
import {
  createMenu,
  getMenus,
  getMenuById,
  updateMenu,
  deleteMenu,
  submitFeedback,
  getFeedbackSummary,
  getFeedbacksByMenu,
} from '../controllers/mess.controller.js';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { authorize } from '../../../middlewares/rbac.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { UserRole } from '../../../types/index.js';
import {
  createMessMenuSchema,
  updateMessMenuSchema,
  submitMessFeedbackSchema,
} from '../schemas/b3.schemas.js';

const router = Router();

router.use(authenticate);

router.post(
  '/menus',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN),
  validate(createMessMenuSchema),
  createMenu,
);
router.get('/menus', getMenus);
router.get('/menus/:id', getMenuById);
router.patch(
  '/menus/:id',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN),
  validate(updateMessMenuSchema),
  updateMenu,
);
router.delete('/menus/:id', authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN), deleteMenu);

// Feedback
router.post(
  '/menus/:id/feedback',
  authorize(UserRole.STUDENT),
  validate(submitMessFeedbackSchema),
  submitFeedback,
);
router.get('/menus/:id/feedback/summary', getFeedbackSummary);
router.get(
  '/menus/:id/feedback',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN, UserRole.STAFF),
  getFeedbacksByMenu,
);

export default router;
