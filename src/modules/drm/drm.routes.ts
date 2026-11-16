import { Router } from 'express';
import { drmController } from './drm.controller';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { issueLicenseSchema, renewLicenseSchema } from './drm.validator';
import { drmLimiter } from '../../middlewares/rateLimiter';

const router = Router();

router.use(authenticateJwt);

// Customer / Android endpoints
router.post('/licenses', drmLimiter, validate(issueLicenseSchema), drmController.issueLicense);
router.post('/licenses/renew', drmLimiter, validate(renewLicenseSchema), drmController.renewLicense);

// Admin-only DRM management
router.get('/admin/licenses', requireRole('SUPER_ADMIN', 'ADMIN'), drmController.listAllAdmin);
router.patch('/admin/licenses/:id/revoke', requireRole('SUPER_ADMIN'), drmController.revokeLicenseAdmin);

export default router;
