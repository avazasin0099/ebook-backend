import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';

const router = Router();

router.use(authenticateJwt);

// Analytics & Reports (Admins & Super Admin)
router.get('/analytics', requireRole('SUPER_ADMIN', 'ADMIN'), adminController.getAnalytics);
router.get('/reports/sales/excel', requireRole('SUPER_ADMIN', 'ADMIN'), adminController.exportSalesReport);

// Customer oversight (Admins & Super Admin)
router.get('/customers', requireRole('SUPER_ADMIN', 'ADMIN'), adminController.listCustomers);
router.patch('/customers/:id/status', requireRole('SUPER_ADMIN', 'ADMIN'), adminController.setCustomerStatus);

// Admin Account Management (Super Admin only!)
router.post('/admins', requireRole('SUPER_ADMIN'), adminController.createAdmin);

export default router;
