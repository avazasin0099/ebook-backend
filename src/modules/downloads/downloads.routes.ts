import { Router } from 'express';
import { downloadsController } from './downloads.controller';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { authorizeDownloadSchema } from './downloads.validator';
import { drmLimiter } from '../../middlewares/rateLimiter';

const router = Router();

// Token streaming endpoint (the download token itself validates the request)
router.get('/stream', drmLimiter, downloadsController.streamFile);

// Authorize download (requires customer JWT + device authorization)
router.post(
  '/authorize',
  authenticateJwt,
  drmLimiter,
  validate(authorizeDownloadSchema),
  downloadsController.authorize
);

export default router;
