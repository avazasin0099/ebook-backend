import { Router } from 'express';
import { categoriesController } from './categories.controller';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';

const router = Router();

// Public routes
router.get('/', categoriesController.list);
router.get('/:slug', categoriesController.getBySlug);

// Admin-only management routes
router.post(
  '/',
  authenticateJwt,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  categoriesController.create
);

router.put(
  '/:id',
  authenticateJwt,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  categoriesController.update
);

router.delete(
  '/:id',
  authenticateJwt,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  categoriesController.delete
);

export default router;
