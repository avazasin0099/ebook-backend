import { Router } from 'express';
import { libraryController } from './library.controller';
import { authenticateJwt } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJwt);

router.get('/', libraryController.getMyLibrary);
router.get('/:bookId', libraryController.getBook);

export default router;
