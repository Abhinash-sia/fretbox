import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  testStudent,
  testFaculty,
  testAdmin,
} from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  logoutSchema,
} from '../utils/validation.schemas.js';
import { UserRole } from '../types/index.js';

const router = Router();

// Public Authentication Routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/logout', validate(logoutSchema), logout);

// Authenticated User Route
router.get('/me', authenticate, getMe);

// Role-Based Authorization Demonstration Endpoints
router.get('/test/student', authenticate, authorize(UserRole.STUDENT), testStudent);
router.get('/test/faculty', authenticate, authorize(UserRole.FACULTY), testFaculty);
router.get('/test/admin', authenticate, authorize(UserRole.ADMINISTRATOR), testAdmin);

export default router;
