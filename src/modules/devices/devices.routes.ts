import { Router } from 'express';
import { devicesController } from './devices.controller';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { registerDeviceSchema } from './devices.validator';

const router = Router();

router.use(authenticateJwt);

router.post('/register', validate(registerDeviceSchema), devicesController.register);
router.get('/', devicesController.list);
router.delete('/:id', devicesController.revoke);

export default router;
