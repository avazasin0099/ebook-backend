import { Router } from 'express';
import { publishersController } from './publishers.controller';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';

const router = Router();

// Public routes
router.get('/', publishersController.list);
router.get('/:id', publishersController.getById);

// Admin routes
router.post(
  '/',
  authenticateJwt,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  publishersController.create
);

router.put(
  '/:id',
  authenticateJwt,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  publishersController.update
);

router.delete(
  '/:id',
  authenticateJwt,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  publishersController.delete
);

export default router;
