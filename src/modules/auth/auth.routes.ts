import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middlewares/validate.middleware';
import { registerSchema, loginSchema, refreshSchema } from './auth.validator';
import { authLimiter } from '../../middlewares/rateLimiter';
import { authenticateJwt } from '../../middlewares/auth.middleware';

const router = Router();

// Public routes
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', authController.logout);

// Authenticated routes
router.get('/me', authenticateJwt, authController.me);

export default router;
