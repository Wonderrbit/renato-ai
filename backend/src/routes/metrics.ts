import { Router, Request, Response } from 'express';
import { getEnv } from '../config/env.js';
import client, { Registry, Counter, Histogram, Gauge } from 'prom-client';

const env = getEnv();
const register = new Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new Counter({ name: 'http_requests_total', help: 'Total HTTP requests', labelNames: ['method', 'route', 'status'], registers: [register] });
const httpRequestDuration = new Histogram({ name: 'http_request_duration_seconds', help: 'HTTP request duration', labelNames: ['method', 'route'], buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5], registers: [register] });
const wsConnections = new Gauge({ name: 'ws_connections_active', help: 'Active WebSocket connections', registers: [register] });
const agentTokensUsed = new Counter({ name: 'agent_tokens_used_total', help: 'Total tokens used by agent', labelNames: ['type'], registers: [register] });
const agentResponseTime = new Histogram({ name: 'agent_response_time_seconds', help: 'Agent response time', buckets: [0.1, 0.5, 1, 2, 5, 10, 30], registers: [register] });
const ragRetrievalTime = new Histogram({ name: 'rag_retrieval_time_seconds', help: 'RAG retrieval time', buckets: [0.01, 0.05, 0.1, 0.5, 1], registers: [register] });
const feedbackReceived = new Counter({ name: 'feedback_received_total', help: 'Total feedback received', labelNames: ['type'], registers: [register] });
const modelFallbackRate = new Gauge({ name: 'model_fallback_rate', help: 'TF.js model fallback rate', registers: [register] });

export const metricsRouter = Router();

metricsRouter.get('/', async (_req: Request, res: Response) => {
  if (!env.METRICS_ENABLED) {
    return res.status(404).send('Metrics disabled');
  }
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
});

export const metrics = {
  httpRequestsTotal,
  httpRequestDuration,
  wsConnections,
  agentTokensUsed,
  agentResponseTime,
  ragRetrievalTime,
  feedbackReceived,
  modelFallbackRate
};