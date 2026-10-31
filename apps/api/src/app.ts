import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import { requestIdMiddleware } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import { healthRouter } from './modules/health/healthRoutes';
import { chatRouter } from './modules/chat/chatRoutes';
import { conversationRouter } from './modules/conversations/conversationRoutes';

export const createApp = (): Application => {
  const app = express();

  // Security and utilities
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like curl, mobile, or same-origin)
        if (!origin) return callback(null, true);
        const allowedOrigins = config.corsOrigin.split(',').map((o) => o.trim());
        if (allowedOrigins.includes(origin) || !config.isProduction) {
          callback(null, true);
        } else {
          callback(new Error('Blocked by CORS policy'));
        }
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(requestIdMiddleware);

  // Mount API v1 router on both /api/v1 (standard) and /v1 (when /api prefix is stripped)
  const apiRouter = express.Router();
  apiRouter.use(healthRouter);
  apiRouter.use(chatRouter);
  apiRouter.use(conversationRouter);

  app.use('/api/v1', apiRouter);
  app.use('/v1', apiRouter);

  // 404 Not Found handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${req.method} ${req.path} tidak ditemukan.`,
        request_id: req.id || 'unknown',
      },
    });
  });

  // Central error handler
  app.use(errorHandler);

  return app;
};

