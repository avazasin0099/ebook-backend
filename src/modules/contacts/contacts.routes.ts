import { Router } from 'express';
import { contactsController } from './contacts.controller';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createContactSchema, updateContactStatusSchema } from './contacts.validator';
import { apiLimiter } from '../../middlewares/rateLimiter';

const router = Router();

// Public route to submit contact inquiry
router.post(
  '/',
  apiLimiter,
  validate(createContactSchema),
  contactsController.create
);

// Admin-only management routes
router.get(
  '/',
  authenticateJwt,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  contactsController.list
);

router.get(
  '/:id',
  authenticateJwt,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  contactsController.getById
);

router.patch(
  '/:id',
  authenticateJwt,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  validate(updateContactStatusSchema),
  contactsController.updateStatus
);

router.delete(
  '/:id',
  authenticateJwt,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  contactsController.delete
);

export default router;
