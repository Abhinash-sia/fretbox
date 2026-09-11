import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { UserRole } from '../types/index.js';
import { predictionController } from '../controllers/prediction.controller.js';
import { predictionQuerySchema } from '../utils/b9.schemas.js';

const router = Router();

router.use(authenticate);
router.use(authorize(UserRole.ADMINISTRATOR));

router.get(
  '/complaints',
  validate({ query: predictionQuerySchema }),
  predictionController.getComplaintDemandPredictions,
);

export default router;
