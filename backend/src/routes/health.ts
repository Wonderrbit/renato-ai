import { Router, Request, Response } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'renato-ai-backend' });
});

healthRouter.get('/ready', async (_req: Request, res: Response) => {
  try {
    const { getRedisClient } = await import('../config/redis.js');
    const redis = getRedisClient();
    await redis.ping();
    res.json({ status: 'ready', redis: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'not ready', error: String(err) });
  }
});