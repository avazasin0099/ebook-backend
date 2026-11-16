import { Router } from 'express';
import { booksController } from './books.controller';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createBookSchema, updateBookSchema, updateStatusSchema } from './books.validator';
import { uploadCover, uploadManuscript } from '../../middlewares/upload.middleware';

const router = Router();

// Public routes
router.get('/', booksController.listPublic);
router.get('/assets/*', booksController.serveCoverAsset);
router.get('/:id', booksController.getByIdOrSlug);

// Admin-only management routes
router.post(
  '/',
  authenticateJwt,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  validate(createBookSchema),
  booksController.create
);

router.put(
  '/:id',
  authenticateJwt,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  validate(updateBookSchema),
  booksController.update
);

router.patch(
  '/:id/status',
  authenticateJwt,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  validate(updateStatusSchema),
  booksController.updateStatus
);

router.post(
  '/:id/cover',
  authenticateJwt,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  uploadCover.single('cover'),
  booksController.uploadCover
);

router.post(
  '/:id/manuscript',
  authenticateJwt,
  requireRole('SUPER_ADMIN', 'ADMIN'),
  uploadManuscript.single('manuscript'),
  booksController.uploadManuscript
);

export default router;
