import { Request, Response, NextFunction } from 'express';
import { authorsService } from './authors.service';
import { sendSuccess } from '../../utils/apiResponse';

export class AuthorsController {
  public async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authors = await authorsService.listAll();
      sendSuccess({ res, data: authors });
    } catch (error) {
      next(error);
    }
  }

  public async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const author = await authorsService.getById(req.params.id);
      sendSuccess({ res, data: author });
    } catch (error) {
      next(error);
    }
  }

  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const author = await authorsService.create(req.body);
      sendSuccess({ res, statusCode: 201, message: 'Author created', data: author });
    } catch (error) {
      next(error);
    }
  }

  public async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const author = await authorsService.update(req.params.id, req.body);
      sendSuccess({ res, message: 'Author updated', data: author });
    } catch (error) {
      next(error);
    }
  }

  public async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authorsService.delete(req.params.id);
      sendSuccess({ res, message: 'Author deleted' });
    } catch (error) {
      next(error);
    }
  }
}

export const authorsController = new AuthorsController();
