import { Router } from 'express';
import {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
} from '../controllers/facility.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { UserRole } from '../types/index.js';
import { createAssetSchema, updateAssetSchema } from '../utils/b3.schemas.js';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN, UserRole.STAFF),
  validate(createAssetSchema),
  createAsset,
);
router.get('/', getAssets);
router.get('/:id', getAssetById);
router.patch(
  '/:id',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN, UserRole.STAFF),
  validate(updateAssetSchema),
  updateAsset,
);
router.delete('/:id', authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN), deleteAsset);

export default router;
