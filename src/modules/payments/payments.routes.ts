import { Router } from 'express';
import { paymentsController } from './payments.controller';
import { authenticateJwt, optionalAuthenticateJwt } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';

const router = Router();

// Webhook endpoint (unauthenticated JWT, but verified strictly via HMAC-SHA256 signature)
router.post('/cashfree/webhook', paymentsController.webhook);

// Customer status poll / verify endpoint (optional JWT so gateway redirect without headers can still sync)
router.get('/:orderId/status', optionalAuthenticateJwt, paymentsController.verifyStatus);

// Super Admin refund processing
router.post('/refund', authenticateJwt, requireRole('SUPER_ADMIN'), paymentsController.refund);

export default router;
