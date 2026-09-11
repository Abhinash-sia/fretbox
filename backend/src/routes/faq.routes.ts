import { Router } from 'express';
import {
  queryFaq,
  getFaqDocuments,
  createFaqDocument,
  updateFaqDocument,
  deleteFaqDocument,
} from '../controllers/faq.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { UserRole } from '../types/index.js';
import {
  faqQuerySchema,
  createFaqDocumentSchema,
  updateFaqDocumentSchema,
} from '../utils/b8.schemas.js';

const router = Router();

router.use(authenticate);

// Query campus FAQ / RAG (Any authenticated user)
router.post('/query', validate(faqQuerySchema), queryFaq);

// Document Management APIs
router.get('/documents', getFaqDocuments);
router.post(
  '/documents',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN),
  validate(createFaqDocumentSchema),
  createFaqDocument,
);
router.patch(
  '/documents/:id',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN),
  validate(updateFaqDocumentSchema),
  updateFaqDocument,
);
router.delete(
  '/documents/:id',
  authorize(UserRole.ADMINISTRATOR, UserRole.WARDEN),
  deleteFaqDocument,
);

export default router;
