import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  WS_PORT: z.coerce.number().default(3002),

  // LLM
  OPENAI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().default('gpt-4o-mini'),
  LLM_TEMPERATURE: z.coerce.number().default(0.7),
  LLM_MAX_TOKENS: z.coerce.number().default(2000),

  // Redis
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  REDIS_MAX_RETRIES: z.coerce.number().default(3),

  // Session
  SESSION_SECRET: z.string().min(32),
  SESSION_TTL_DAYS: z.coerce.number().default(30),

  // Frontend
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // RAG
  EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  RERANKER_MODEL: z.string().default('ms-marco-MiniLM-L-6-v2'),
  RAG_TOP_K: z.coerce.number().default(10),
  RAG_RERANK_TOP_K: z.coerce.number().default(3),

  // Learning
  FEEDBACK_BATCH_SIZE: z.coerce.number().default(100),
  RETRAIN_INTERVAL_HOURS: z.coerce.number().default(168), // weekly
  AB_TEST_TRAFFIC_SPLIT: z.coerce.number().default(0.1),

  // Metrics
  METRICS_ENABLED: z.coerce.boolean().default(true),
  METRICS_PORT: z.coerce.number().default(9090)
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (!cachedEnv) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      console.error('❌ Invalid environment variables:', result.error.flatten().fieldErrors);
      process.exit(1);
    }
    cachedEnv = result.data;
  }
  return cachedEnv;
}