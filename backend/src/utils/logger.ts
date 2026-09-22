import pino from 'pino';
import { getEnv } from '../config/env.js';

const env = getEnv();

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: env.NODE_ENV !== 'production' ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
  base: { service: 'renato-ai-backend' }
});

export function createChildLogger(bindings: Record<string, any>) {
  return logger.child(bindings);
}