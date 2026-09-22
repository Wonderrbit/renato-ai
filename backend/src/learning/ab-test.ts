import { getRedisClient, REDIS_KEYS } from '../config/redis.js';
import { getEnv } from '../config/env.js';
import { logger } from '../utils/logger.js';

export interface ABTestVariant {
  id: string;
  name: string;
  config: Record<string, any>;
  trafficSplit: number;
}

export interface ABTestResult {
  variantId: string;
  impressions: number;
  conversions: number;
  conversionRate: number;
  avgResponseTime: number;
  satisfactionScore: number;
}

export class ABTestFramework {
  private static instance: ABTestFramework;
  private activeTest: ABTestVariant[] = [];

  static getInstance(): ABTestFramework {
    if (!ABTestFramework.instance) {
      ABTestFramework.instance = new ABTestFramework();
    }
    return ABTestFramework.instance;
  }

  async createTest(testId: string, variants: ABTestVariant[]): Promise<void> {
    const redis = getRedisClient();
    const testData = { testId, variants, createdAt: Date.now(), status: 'running' };
    await redis.set(`${REDIS_KEYS.abTest}:${testId}`, JSON.stringify(testData));
    this.activeTest = variants;
    logger.info({ testId, variants: variants.length }, 'A/B test created');
  }

  async getVariant(testId: string, sessionId: string): Promise<ABTestVariant | null> {
    const redis = getRedisClient();
    const testData = await redis.get(`${REDIS_KEYS.abTest}:${testId}`);
    if (!testData) return null;

    const { variants } = JSON.parse(testData);
    const hash = this.hashSession(sessionId + testId);
    let cumulative = 0;

    for (const variant of variants) {
      cumulative += variant.trafficSplit;
      if (hash < cumulative) {
        await this.recordImpression(testId, variant.id);
        return variant;
      }
    }

    return variants[variants.length - 1];
  }

  async recordImpression(testId: string, variantId: string): Promise<void> {
    const redis = getRedisClient();
    await redis.hincrby(`${REDIS_KEYS.abTest}:${testId}:metrics`, `${variantId}:impressions`, 1);
  }

  async recordConversion(testId: string, variantId: string, metadata: { responseTime?: number; satisfaction?: number } = {}): Promise<void> {
    const redis = getRedisClient();
    const pipe = redis.pipeline();
    pipe.hincrby(`${REDIS_KEYS.abTest}:${testId}:metrics`, `${variantId}:conversions`, 1);
    if (metadata.responseTime) pipe.hincrbyfloat(`${REDIS_KEYS.abTest}:${testId}:metrics`, `${variantId}:total_response_time`, metadata.responseTime);
    if (metadata.satisfaction !== undefined) pipe.hincrbyfloat(`${REDIS_KEYS.abTest}:${testId}:metrics`, `${variantId}:total_satisfaction`, metadata.satisfaction);
    await pipe.exec();
  }

  async getResults(testId: string): Promise<ABTestResult[]> {
    const redis = getRedisClient();
    const testData = await redis.get(`${REDIS_KEYS.abTest}:${testId}`);
    if (!testData) return [];

    const { variants } = JSON.parse(testData);
    const metrics = await redis.hgetall(`${REDIS_KEYS.abTest}:${testId}:metrics`);

    return variants.map(v => {
      const impressions = parseInt(metrics[`${v.id}:impressions`] || '0');
      const conversions = parseInt(metrics[`${v.id}:conversions`] || '0');
      const totalResponseTime = parseFloat(metrics[`${v.id}:total_response_time`] || '0');
      const totalSatisfaction = parseFloat(metrics[`${v.id}:total_satisfaction`] || '0');

      return {
        variantId: v.id,
        impressions,
        conversions,
        conversionRate: impressions > 0 ? conversions / impressions : 0,
        avgResponseTime: conversions > 0 ? totalResponseTime / conversions : 0,
        satisfactionScore: conversions > 0 ? totalSatisfaction / conversions : 0
      };
    });
  }

  async declareWinner(testId: string): Promise<ABTestVariant | null> {
    const results = await this.getResults(testId);
    if (results.length < 2) return null;

    const winner = results.reduce((best, current) => {
      const bestScore = best.conversionRate * 0.6 + (best.satisfactionScore || 0) * 0.4;
      const currentScore = current.conversionRate * 0.6 + (current.satisfactionScore || 0) * 0.4;
      return currentScore > bestScore ? current : best;
    });

    const redis = getRedisClient();
    await redis.set(`${REDIS_KEYS.abTest}:${testId}:winner`, JSON.stringify(winner));
    logger.info({ testId, winner: winner.variantId }, 'A/B test winner declared');
    return winner;
  }

  private hashSession(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) / 2147483647;
  }
}

export const defaultTests = [
  {
    testId: 'persona_tone',
    variants: [
      { id: 'renato_classic', name: 'Renato Clássico', config: { temperature: 0.7, persona: 'classic' }, trafficSplit: 0.5 },
      { id: 'renato_direct', name: 'Renato Direto', config: { temperature: 0.5, persona: 'direct' }, trafficSplit: 0.5 }
    ]
  },
  {
    testId: 'response_length',
    variants: [
      { id: 'detailed', name: 'Detalhado', config: { maxTokens: 2000 }, trafficSplit: 0.5 },
      { id: 'concise', name: 'Conciso', config: { maxTokens: 800 }, trafficSplit: 0.5 }
    ]
  },
  {
    testId: 'tool_order',
    variants: [
      { id: 'analyze_first', name: 'Analisa Primeiro', config: { toolOrder: ['analyze', 'match', 'simulate'] }, trafficSplit: 0.5 },
      { id: 'match_first', name: 'Match Primeiro', config: { toolOrder: ['match', 'analyze', 'simulate'] }, trafficSplit: 0.5 }
    ]
  }
];