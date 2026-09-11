import { Router } from 'express';
import {
  createGatePass,
  getGatePasses,
  getGatePassById,
  cancelGatePass,
  approveGatePass,
  rejectGatePass,
  scanGatePass,
} from '../controllers/gatePass.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { UserRole } from '../types/index.js';
import {
  createGatePassSchema,
  approveGatePassSchema,
  rejectGatePassSchema,
  cancelGatePassSchema,
  scanGatePassSchema,
} from '../utils/b4.schemas.js';

const router = Router();

router.use(authenticate);

// Scan endpoint (Security / Admin) - Place BEFORE /:id to prevent route collision
router.post(
  '/scan',
  authorize(UserRole.SECURITY, UserRole.ADMINISTRATOR),
  validate(scanGatePassSchema),
  scanGatePass,
);

// General Pass Endpoints
router.post('/', authorize(UserRole.STUDENT), validate(createGatePassSchema), createGatePass);
router.get('/', getGatePasses);
router.get('/:id', getGatePassById);

// Student Cancellation
router.post(
  '/:id/cancel',
  authorize(UserRole.STUDENT),
  validate(cancelGatePassSchema),
  cancelGatePass,
);

// Warden Approval & Rejection
router.post(
  '/:id/approve',
  authorize(UserRole.WARDEN, UserRole.ADMINISTRATOR),
  validate(approveGatePassSchema),
  approveGatePass,
);
router.post(
  '/:id/reject',
  authorize(UserRole.WARDEN, UserRole.ADMINISTRATOR),
  validate(rejectGatePassSchema),
  rejectGatePass,
);

export default router;
