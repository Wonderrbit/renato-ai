import { searchKnowledge } from './indexer.js';
import { getEnv } from '../config/env.js';
import { getRedisClient, REDIS_KEYS } from '../config/redis.js';
import { logger } from '../utils/logger.js';

export interface RetrievalResult {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  source: string;
  similarity: number;
}

export async function retrieveContext(
  query: string,
  options: { category?: string; topK?: number; useReranker?: boolean } = {}
): Promise<RetrievalResult[]> {
  const env = getEnv();
  const { category, topK = env.RAG_TOP_K, useReranker = true } = options;

  const results = await searchKnowledge(query, category, topK * 2);

  if (useReranker && results.length > 1) {
    return await rerankResults(query, results, topK);
  }

  return results.slice(0, topK);
}

async function rerankResults(query: string, results: RetrievalResult[], topK: number): Promise<RetrievalResult[]> {
  try {
    const { CrossEncoder } = await import('@langchain/community/cross_encoders');
    const env = getEnv();

    const crossEncoder = new CrossEncoder({
      modelName: env.RERANKER_MODEL,
      // Note: In production, use a local ONNX model or API endpoint
    });

    const pairs = results.map(r => [query, r.content]);
    const scores = await crossEncoder.predict(pairs);

    const reranked = results.map((r, i) => ({ ...r, rerankScore: scores[i] }))
      .sort((a, b) => b.rerankScore - a.rerankScore)
      .slice(0, topK);

    logger.debug({ query, originalCount: results.length, rerankedCount: reranked.length }, 'Reranking complete');
    return reranked;
  } catch (err) {
    logger.warn({ err }, 'Reranker failed, using vector similarity only');
    return results.slice(0, topK);
  }
}

export async function getKnowledgeCategories(): Promise<string[]> {
  const redis = getRedisClient();
  const keys = await redis.keys(`${REDIS_KEYS.knowledge}:by_category:*`);
  return keys.map(k => k.replace(`${REDIS_KEYS.knowledge}:by_category:`, ''));
}