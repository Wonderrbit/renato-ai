import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import pino from 'pino';
import { getEnv } from './config/env.js';
import { connectRedis, disconnectRedis, getRedisClient } from './config/redis.js';
import { chatRouter } from './routes/chat.js';
import { healthRouter } from './routes/health.js';
import { metricsRouter } from './routes/metrics.js';
import { RenatoAgent } from './agent/renato-core.js';
import { MetacognitionEngine } from './agent/metacognition.js';

const env = getEnv();
const logger = pino({ level: env.NODE_ENV === 'production' ? 'info' : 'debug', transport: env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined });

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/chat' });

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info({ method: req.method, url: req.url, status: res.statusCode, duration: Date.now() - start }, 'HTTP request');
  });
  next();
});

app.use('/health', healthRouter);
app.use('/metrics', metricsRouter);

const renatoAgent = new RenatoAgent(logger);
const metacognition = new MetacognitionEngine(logger);

wss.on('connection', async (ws: WebSocket, req) => {
  const sessionId = new URL(req.url || '', `http://${req.headers.host}`).searchParams.get('sessionId') || crypto.randomUUID();
  logger.info({ sessionId }, 'WebSocket connected');

  ws.send(JSON.stringify({ type: 'connected', sessionId }));

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      if (message.type === 'user_message') {
        await handleUserMessage(ws, sessionId, message);
      }
    } catch (err) {
      logger.error({ err, sessionId }, 'WebSocket message error');
      ws.send(JSON.stringify({ type: 'error', message: 'Erro ao processar mensagem' }));
    }
  });

  ws.on('close', () => {
    logger.info({ sessionId }, 'WebSocket disconnected');
  });

  ws.on('error', (err) => {
    logger.error({ err, sessionId }, 'WebSocket error');
  });
});

async function handleUserMessage(ws: WebSocket, sessionId: string, message: any) {
  const { content, context, clientProfile } = message;

  ws.send(JSON.stringify({ type: 'thinking', thought: 'Analisando sua mensagem...' }));

  const thought = await metacognition.reflect({ content, context, clientProfile, sessionId });
  ws.send(JSON.stringify({ type: 'thinking', thought }));

  const response = await renatoAgent.process({
    sessionId,
    userMessage: content,
    context,
    clientProfile,
    metacognitionThought: thought
  });

  for (const chunk of response.chunks) {
    ws.send(JSON.stringify({ type: 'agent_chunk', content: chunk }));
  }

  ws.send(JSON.stringify({
    type: 'agent_complete',
    content: response.finalContent,
    metadata: response.metadata,
    toolsUsed: response.toolsUsed
  }));
}

async function start() {
  try {
    await connectRedis();

    app.listen(env.PORT, () => {
      logger.info({ port: env.PORT }, 'HTTP server started');
    });

    server.listen(env.WS_PORT, () => {
      logger.info({ port: env.WS_PORT }, 'WebSocket server started');
    });
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

const shutdown = async () => {
  logger.info('Shutting down...');
  await disconnectRedis();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();