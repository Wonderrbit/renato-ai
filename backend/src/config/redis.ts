import Redis from 'ioredis';
import { getEnv } from './env.js';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    const env = getEnv();
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: env.REDIS_MAX_RETRIES,
      retryStrategy: (times) => {
        if (times > env.REDIS_MAX_RETRIES) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
      enableReadyCheck: true,
      connectTimeout: 10000,
      maxLoadingTimeout: 5000
    });

    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis connected');
    });

    redisClient.on('ready', () => {
      console.log('Redis ready');
    });
  }
  return redisClient;
}

export async function connectRedis(): Promise<void> {
  const client = getRedisClient();
  await client.connect();
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

export const REDIS_KEYS = {
  conversation: (sessionId: string) => `conv:${sessionId}`,
  profile: (clientId: string) => `profile:${clientId}`,
  episodic: (clientId: string) => `episodic:${clientId}`,
  feedback: 'feedback:raw',
  knowledge: 'renato_knowledge',
  metrics: 'metrics:',
  abTest: (testId: string) => `abtest:${testId}`,
  fewShot: 'fewshot:examples'
} as const;