import { Router, Request, Response } from 'express';
import { ragClient } from '../../integrations/rag/ragClient';

export const healthRouter = Router();

// Liveness check
healthRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Readiness check
healthRouter.get('/ready', async (req: Request, res: Response) => {
  const isRagConnected = await ragClient.checkHealth();

  res.status(isRagConnected ? 200 : 503).json({
    status: isRagConnected ? 'ready' : 'degraded',
    rag_service: isRagConnected ? 'connected' : 'unreachable',
    timestamp: new Date().toISOString(),
  });
});

