import { Response } from 'express';

export interface ApiResponseOptions<T> {
  res: Response;
  statusCode?: number;
  message?: string;
  data?: T;
  meta?: object;
}

export function sendSuccess<T>({
  res,
  statusCode = 200,
  message,
  data,
  meta,
}: ApiResponseOptions<T>): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
  });
}

export function sendError({
  res,
  statusCode = 500,
  message = 'Internal Server Error',
  errors,
  errorCode,
}: {
  res: Response;
  statusCode?: number;
  message?: string;
  errors?: any;
  errorCode?: string;
}): Response {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    errorCode,
  });
}
