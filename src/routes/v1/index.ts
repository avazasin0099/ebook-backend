import { Router } from 'express';
import authRoutes from '../../modules/auth/auth.routes';
import booksRoutes from '../../modules/books/books.routes';
import categoriesRoutes from '../../modules/categories/categories.routes';
import authorsRoutes from '../../modules/authors/authors.routes';
import publishersRoutes from '../../modules/publishers/publishers.routes';
import ordersRoutes from '../../modules/orders/orders.routes';
import paymentsRoutes from '../../modules/payments/payments.routes';
import devicesRoutes from '../../modules/devices/devices.routes';
import libraryRoutes from '../../modules/library/library.routes';
import drmRoutes from '../../modules/drm/drm.routes';
import downloadsRoutes from '../../modules/downloads/downloads.routes';
import readingRoutes from '../../modules/reading/reading.routes';
import adminRoutes from '../../modules/admin/admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/books', booksRoutes);
router.use('/categories', categoriesRoutes);
router.use('/authors', authorsRoutes);
router.use('/publishers', publishersRoutes);
router.use('/orders', ordersRoutes);
router.use('/payments', paymentsRoutes);
router.use('/devices', devicesRoutes);
router.use('/library', libraryRoutes);
router.use('/drm', drmRoutes);
router.use('/downloads', downloadsRoutes);
router.use('/reading', readingRoutes);
router.use('/admin', adminRoutes);

export default router;
