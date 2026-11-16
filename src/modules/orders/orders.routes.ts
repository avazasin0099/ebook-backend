import { Router } from 'express';
import { ordersController } from './orders.controller';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createOrderSchema } from './orders.validator';

const router = Router();

// Customer authenticated order endpoints
router.post('/', authenticateJwt, validate(createOrderSchema), ordersController.create);
router.get('/my', authenticateJwt, ordersController.getMyOrders);
router.get('/:id', authenticateJwt, ordersController.getOrderById);

// Admin-only order inspection
router.get('/', authenticateJwt, requireRole('SUPER_ADMIN', 'ADMIN'), ordersController.listAllAdmin);

export default router;
