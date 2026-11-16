import { Request, Response, NextFunction } from 'express';
import { downloadsService } from './downloads.service';
import { sendSuccess } from '../../utils/apiResponse';
import { BadRequestError } from '../../utils/errors';

export class DownloadsController {
  public async authorize(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await downloadsService.authorizeDownload({
        userId: req.user!.id,
        bookId: req.body.bookId,
        licenseKeyId: req.body.licenseId,
        deviceId: req.body.deviceId,
        format: req.body.format,
        ipAddress: req.ip,
      });

      sendSuccess({
        res,
        message: 'Download authorized successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  public async streamFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.query.token as string;
      if (!token) throw new BadRequestError('Download token is required');

      const fileInfo = await downloadsService.getFileForStream(token);

      res.setHeader('Content-Type', fileInfo.mimeType);
      res.setHeader('Content-Length', fileInfo.fileSize);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${fileInfo.filename}"`
      );
      res.setHeader('Cache-Control', 'no-store, private');

      res.sendFile(fileInfo.fullPath);
    } catch (error) {
      next(error);
    }
  }
}

export const downloadsController = new DownloadsController();
