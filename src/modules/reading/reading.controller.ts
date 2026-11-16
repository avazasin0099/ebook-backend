import { Request, Response, NextFunction } from 'express';
import { readingService } from './reading.service';
import { sendSuccess } from '../../utils/apiResponse';

export class ReadingController {
  public async saveProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const progress = await readingService.saveProgress(req.user!.id, req.body);
      sendSuccess({ res, message: 'Reading progress synced', data: progress });
    } catch (error) {
      next(error);
    }
  }

  public async getProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const progress = await readingService.getProgress(req.user!.id, req.params.bookId);
      sendSuccess({ res, data: progress });
    } catch (error) {
      next(error);
    }
  }

  public async createBookmark(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookmark = await readingService.createBookmark(req.user!.id, req.body);
      sendSuccess({ res, statusCode: 201, message: 'Bookmark created', data: bookmark });
    } catch (error) {
      next(error);
    }
  }

  public async getBookmarks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookmarks = await readingService.getBookmarks(req.user!.id, req.params.bookId);
      sendSuccess({ res, data: bookmarks });
    } catch (error) {
      next(error);
    }
  }

  public async deleteBookmark(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await readingService.deleteBookmark(req.user!.id, req.params.id);
      sendSuccess({ res, message: 'Bookmark removed' });
    } catch (error) {
      next(error);
    }
  }
}

export const readingController = new ReadingController();
