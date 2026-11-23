import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { booksService } from './books.service';
import { sendSuccess } from '../../utils/apiResponse';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { storageService } from '../../services/storage.service';

export class BooksController {
  public async listPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as Record<string, any>;
      const params: Record<string, any> = {
        ...query,
        // subject can come from the route (/books/subject/:subject) or the query (?subject=)
        subject: req.params.subject ?? query.subject,
        className: query.class ?? query.className,
      };

      // Logged-in students only see books for their own class by default
      const isAdmin = req.user?.roleName === 'SUPER_ADMIN' || req.user?.roleName === 'ADMIN';
      if (req.user && !isAdmin && req.user.className) {
        params.className = req.user.className;
      }

      const result = await booksService.listPublic(params);
      sendSuccess({
        res,
        data: result.books,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getByIdOrSlug(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const book = await booksService.getPublicByIdOrSlug(req.params.id);
      sendSuccess({ res, data: book });
    } catch (error) {
      next(error);
    }
  }

  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const book = await booksService.createBook(req.body);
      sendSuccess({
        res,
        statusCode: 201,
        message: 'Book created successfully as DRAFT',
        data: book,
      });
    } catch (error) {
      next(error);
    }
  }

  public async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const book = await booksService.updateBook(req.params.id, req.body);
      sendSuccess({
        res,
        message: 'Book updated successfully',
        data: book,
      });
    } catch (error) {
      next(error);
    }
  }

  public async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const book = await booksService.updateStatus(req.params.id, req.body.status);
      sendSuccess({
        res,
        message: `Book status changed to ${req.body.status}`,
        data: book,
      });
    } catch (error) {
      next(error);
    }
  }

  public async uploadCover(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new BadRequestError('Cover image file is required');
      }

      const result = await booksService.attachCover(
        req.params.id,
        req.file.buffer,
        req.file.originalname
      );

      sendSuccess({
        res,
        message: 'Cover image uploaded successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async uploadManuscript(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new BadRequestError('Publication file is required');
      }

      const ext = path.extname(req.file.originalname).toLowerCase();
      const format = ext === '.epub' ? 'EPUB' : ext === '.pdf' ? 'PDF' : null;

      if (!format) {
        throw new BadRequestError('Publication must be .epub or .pdf');
      }

      const bookFile = await booksService.attachManuscript(
        req.params.id,
        req.file.buffer,
        req.file.originalname,
        format
      );

      sendSuccess({
        res,
        message: 'Manuscript uploaded to private storage and queued for DRM encryption',
        data: {
          fileId: bookFile.id,
          format: bookFile.format,
          fileSizeBytes: bookFile.fileSizeBytes,
          isProcessed: bookFile.isProcessed,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  public async serveCoverAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const assetPath = req.params[0];
      // Only permit serving from covers and previews publicly
      if (!assetPath.startsWith('covers/') && !assetPath.startsWith('previews/')) {
        throw new NotFoundError('Asset not accessible');
      }

      const fullPath = storageService.getAbsolutePath(assetPath);
      if (!fs.existsSync(fullPath)) {
        throw new NotFoundError('File not found');
      }

      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day cache
      res.sendFile(fullPath);
    } catch (error) {
      next(error);
    }
  }
}

export const booksController = new BooksController();
