import { getRedisClient, REDIS_KEYS } from '../config/redis.js';
import { logger } from '../utils/logger.js';

export interface FeedbackEntry {
  sessionId: string;
  turn: number;
  type: 'thumbs_up' | 'thumbs_down' | 'correction' | 'abandon' | 'completion';
  content?: string;
  context: {
    userMessage: string;
    agentResponse: string;
    intent: string;
    toolsUsed: string[];
    clientProfile?: any;
  };
  timestamp: number;
}

export class FeedbackCollector {
  private static instance: FeedbackCollector;

  static getInstance(): FeedbackCollector {
    if (!FeedbackCollector.instance) {
      FeedbackCollector.instance = new FeedbackCollector();
    }
    return FeedbackCollector.instance;
  }

  async collect(feedback: Omit<FeedbackEntry, 'timestamp'>): Promise<void> {
    const redis = getRedisClient();
    const entry: FeedbackEntry = { ...feedback, timestamp: Date.now() };

    await redis.xadd(REDIS_KEYS.feedback, '*', 'data', JSON.stringify(entry));
    await redis.ltrim(REDIS_KEYS.feedback, -10000, -1);

    logger.info({ sessionId: feedback.sessionId, type: feedback.type }, 'Feedback collected');
  }

  async getRecentFeedback(limit: number = 100): Promise<FeedbackEntry[]> {
    const redis = getRedisClient();
    const entries = await redis.xrevrange(REDIS_KEYS.feedback, '+', '-', 'COUNT', limit);
    return entries.map(([_, data]) => JSON.parse(data.data));
  }

  async getNegativeFeedback(limit: number = 50): Promise<FeedbackEntry[]> {
    const all = await this.getRecentFeedback(limit * 3);
    return all.filter(f => f.type === 'thumbs_down' || f.type === 'correction').slice(0, limit);
  }

  async getFeedbackStats(): Promise<{ total: number; byType: Record<string, number>; satisfactionRate: number }> {
    const all = await this.getRecentFeedback(1000);
    const byType: Record<string, number> = {};
    let positive = 0, negative = 0;

    for (const f of all) {
      byType[f.type] = (byType[f.type] || 0) + 1;
      if (f.type === 'thumbs_up' || f.type === 'completion') positive++;
      if (f.type === 'thumbs_down' || f.type === 'correction') negative++;
    }

    return {
      total: all.length,
      byType,
      satisfactionRate: positive + negative > 0 ? positive / (positive + negative) : 0
    };
  }
}