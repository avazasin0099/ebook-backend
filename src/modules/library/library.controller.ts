import { Request, Response, NextFunction } from 'express';
import { libraryService } from './library.service';
import { sendSuccess } from '../../utils/apiResponse';

export class LibraryController {
  public async getMyLibrary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const items = await libraryService.getCustomerLibrary(req.user!.id);
      sendSuccess({ res, data: items });
    } catch (error) {
      next(error);
    }
  }

  public async getBook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const book = await libraryService.getLibraryBook(req.user!.id, req.params.bookId);
      sendSuccess({ res, data: book });
    } catch (error) {
      next(error);
    }
  }
}

export const libraryController = new LibraryController();
