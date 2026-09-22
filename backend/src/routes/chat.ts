import { Router, Request, Response } from 'express';

export const chatRouter = Router();

chatRouter.post('/message', async (req: Request, res: Response) => {
  res.json({ message: 'Use WebSocket /chat for real-time chat' });
});

chatRouter.get('/sessions/:sessionId/history', async (req: Request, res: Response) => {
  res.json({ messages: [] });
});