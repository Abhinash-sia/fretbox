import { Router } from 'express';
import { getGateEvents, getGateEventById } from '../controllers/gateEvent.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { UserRole } from '../types/index.js';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.SECURITY, UserRole.WARDEN, UserRole.ADMINISTRATOR));

router.get('/', getGateEvents);
router.get('/:id', getGateEventById);

export default router;
