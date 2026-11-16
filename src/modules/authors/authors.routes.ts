import { Router } from 'express';
import { authorsController } from './authors.controller';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';

const router = Router();

// Public routes
router.get('/', authorsController.list);
router.get('/:id', authorsController.getById);

// Admin routes
router.post(
  '/',
  authenticateJwt,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  authorsController.create
);

router.put(
  '/:id',
  authenticateJwt,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  authorsController.update
);

router.delete(
  '/:id',
  authenticateJwt,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  authorsController.delete
);

export default router;
