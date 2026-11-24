import { Request, Response, NextFunction } from 'express';
import { contactsService } from './contacts.service';
import { sendSuccess } from '../../utils/apiResponse';

export class ContactsController {
  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const contact = await contactsService.create(req.body);
      sendSuccess({
        res,
        statusCode: 201,
        message: 'Contact inquiry submitted successfully',
        data: contact,
      });
    } catch (error) {
      next(error);
    }
  }

  public async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await contactsService.list(req.query as any);
      sendSuccess({
        res,
        data: result.contacts,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const contact = await contactsService.getById(req.params.id);
      sendSuccess({ res, data: contact });
    } catch (error) {
      next(error);
    }
  }

  public async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, adminNotes } = req.body;
      const updated = await contactsService.updateStatus(req.params.id, status, adminNotes);
      sendSuccess({
        res,
        message: 'Contact inquiry status updated',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  public async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await contactsService.delete(req.params.id);
      sendSuccess({
        res,
        message: 'Contact inquiry deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const contactsController = new ContactsController();
