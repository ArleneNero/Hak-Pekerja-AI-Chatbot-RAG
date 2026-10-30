import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const code = err.code || (statusCode === 400 ? 'VALIDATION_ERROR' : 'INTERNAL_SERVER_ERROR');
  const message = err.message || 'Terjadi kesalahan pada server internal.';
  const requestId = req.id || 'unknown';

  // Do not log sensitive credentials or stack traces in production
  if (statusCode >= 500) {
    console.error(`[Error] [${requestId}] ${statusCode} - ${err.message}`);
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      request_id: requestId,
    },
  });
};

