import { Router } from 'express';
import { readingController } from './reading.controller';
import { authenticateJwt } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { readingProgressSchema, bookmarkSchema } from './reading.validator';

const router = Router();

router.use(authenticateJwt);

// Reading Progress
router.post('/progress', validate(readingProgressSchema), readingController.saveProgress);
router.get('/progress/:bookId', readingController.getProgress);

// Bookmarks
router.post('/bookmarks', validate(bookmarkSchema), readingController.createBookmark);
router.get('/bookmarks/:bookId', readingController.getBookmarks);
router.delete('/bookmarks/:id', readingController.deleteBookmark);

export default router;
