import { Request, Response, NextFunction } from 'express';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const existingId = req.headers['x-request-id'] as string;
  const requestId = existingId || `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};

