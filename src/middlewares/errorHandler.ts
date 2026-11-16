import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/apiResponse';
import logger from '../utils/logger';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(`[AppError] ${err.statusCode} - ${err.message}`, { stack: err.stack });
    } else {
      logger.warn(`[ClientError] ${err.statusCode} - ${err.message}`);
    }

    sendError({
      res,
      statusCode: err.statusCode,
      message: err.message,
      errorCode: err.errorCode,
      errors: err.errors,
    });
    return;
  }

  // Unhandled internal server errors
  if ((err as any).errors) {
    console.error('Sequelize ValidationError Details:', (err as any).errors);
  }
  logger.error(`[UnhandledError] ${err.message}`, {
    stack: err.stack,
    errors: (err as any).errors,
  });
  sendError({
    res,
    statusCode: 500,
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
    errorCode: 'INTERNAL_SERVER_ERROR',
  });
}
