import { Request, Response, NextFunction } from 'express';
import { categoriesService } from './categories.service';
import { sendSuccess } from '../../utils/apiResponse';

export class CategoriesController {
  public async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await categoriesService.listAll();
      sendSuccess({ res, data: categories });
    } catch (error) {
      next(error);
    }
  }

  public async getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoriesService.getBySlug(req.params.slug);
      sendSuccess({ res, data: category });
    } catch (error) {
      next(error);
    }
  }

  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoriesService.create(req.body);
      sendSuccess({ res, statusCode: 201, message: 'Category created', data: category });
    } catch (error) {
      next(error);
    }
  }

  public async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = await categoriesService.update(req.params.id, req.body);
      sendSuccess({ res, message: 'Category updated', data: category });
    } catch (error) {
      next(error);
    }
  }

  public async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await categoriesService.delete(req.params.id);
      sendSuccess({ res, message: 'Category deleted' });
    } catch (error) {
      next(error);
    }
  }
}

export const categoriesController = new CategoriesController();
