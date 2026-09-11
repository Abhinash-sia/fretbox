import { Router } from 'express';
import {
  createHostel,
  getHostels,
  getHostelById,
  updateHostel,
  createBlock,
  getBlocksByHostel,
  getBlockById,
  updateBlock,
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  allocateRoom,
  vacateRoom,
  getMyAllocation,
  getAllocations,
} from '../controllers/hostel.controller.js';
import { authenticate } from '../../../middlewares/auth.middleware.js';
import { authorize } from '../../../middlewares/rbac.middleware.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { UserRole } from '../../../types/index.js';
import {
  createHostelSchema,
  updateHostelSchema,
  createBlockSchema,
  updateBlockSchema,
  createRoomSchema,
  updateRoomSchema,
  allocateRoomSchema,
  vacateRoomSchema,
} from '../schemas/b3.schemas.js';

const router = Router();

router.use(authenticate);

// --- Hostels ---
router.post(
  '/',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN),
  validate(createHostelSchema),
  createHostel,
);
router.get('/', getHostels);
router.get('/:id', getHostelById);
router.patch(
  '/:id',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN),
  validate(updateHostelSchema),
  updateHostel,
);

// --- Hostel Blocks ---
router.post(
  '/blocks',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN),
  validate(createBlockSchema),
  createBlock,
);
router.get('/:hostelId/blocks', getBlocksByHostel);
router.get('/blocks/:id', getBlockById);
router.patch(
  '/blocks/:id',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN),
  validate(updateBlockSchema),
  updateBlock,
);

// --- Rooms ---
router.post(
  '/rooms',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN),
  validate(createRoomSchema),
  createRoom,
);
router.get('/rooms/all', getRooms);
router.get('/rooms/:id', getRoomById);
router.patch(
  '/rooms/:id',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN),
  validate(updateRoomSchema),
  updateRoom,
);

// --- Allocations ---
router.post(
  '/allocations',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN),
  validate(allocateRoomSchema),
  allocateRoom,
);
router.patch(
  '/allocations/:id/vacate',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN),
  validate(vacateRoomSchema),
  vacateRoom,
);
router.get('/allocations/my', authorize(UserRole.STUDENT), getMyAllocation);
router.get(
  '/allocations',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN, UserRole.STAFF),
  getAllocations,
);

export default router;
