import { Request, Response, NextFunction } from 'express';
import { publishersService } from './publishers.service';
import { sendSuccess } from '../../utils/apiResponse';

export class PublishersController {
  public async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const publishers = await publishersService.listAll();
      sendSuccess({ res, data: publishers });
    } catch (error) {
      next(error);
    }
  }

  public async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const publisher = await publishersService.getById(req.params.id);
      sendSuccess({ res, data: publisher });
    } catch (error) {
      next(error);
    }
  }

  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const publisher = await publishersService.create(req.body);
      sendSuccess({ res, statusCode: 201, message: 'Publisher created', data: publisher });
    } catch (error) {
      next(error);
    }
  }

  public async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const publisher = await publishersService.update(req.params.id, req.body);
      sendSuccess({ res, message: 'Publisher updated', data: publisher });
    } catch (error) {
      next(error);
    }
  }

  public async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await publishersService.delete(req.params.id);
      sendSuccess({ res, message: 'Publisher deleted' });
    } catch (error) {
      next(error);
    }
  }
}

export const publishersController = new PublishersController();
