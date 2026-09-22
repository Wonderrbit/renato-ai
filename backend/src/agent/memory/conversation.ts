import { getRedisClient, REDIS_KEYS } from '../config/redis.js';
import { logger } from '../utils/logger.js';

export interface ConversationMessage {
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: number;
  intent?: string;
  toolsUsed?: string[];
  metadata?: any;
}

export class ConversationMemory {
  private static MAX_MESSAGES = 50;
  private static TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

  async addMessage(sessionId: string, message: ConversationMessage): Promise<void> {
    const redis = getRedisClient();
    const key = REDIS_KEYS.conversation(sessionId);

    await redis.lpush(key, JSON.stringify(message));
    await redis.ltrim(key, 0, ConversationMemory.MAX_MESSAGES - 1);
    await redis.expire(key, ConversationMemory.TTL_SECONDS);
  }

  async getHistory(sessionId: string, limit: number = 20): Promise<ConversationMessage[]> {
    const redis = getRedisClient();
    const key = REDIS_KEYS.conversation(sessionId);
    const messages = await redis.lrange(key, 0, limit - 1);
    return messages.map(m => JSON.parse(m)).reverse();
  }

  async clearSession(sessionId: string): Promise<void> {
    const redis = getRedisClient();
    await redis.del(REDIS_KEYS.conversation(sessionId));
  }
}

export interface ClientProfile {
  clientId: string;
  nome?: string;
  apelido?: string;
  profissao?: string;
  idade?: number;
  renda_faixa?: string;
  score_faixa?: string;
  banco_principal?: string;
  objetivos?: Array<{ tipo: string; valor_alvo: number; prazo: number; prioridade: string }>;
  produtos_contratados?: string[];
  preferencias?: { tom_formal: boolean; detalhe_tecnico: boolean; canal_preferido: string };
  historico_analises?: Array<{ id: string; score: number; risco: string; timestamp: number }>;
  feedbacks?: Array<{ tipo: string; timestamp: number }>;
  updatedAt: number;
}

export class LongTermMemory {
  private static TTL_SECONDS = 2 * 365 * 24 * 60 * 60; // 2 years

  async saveProfile(profile: ClientProfile): Promise<void> {
    const redis = getRedisClient();
    const key = REDIS_KEYS.profile(profile.clientId);
    const data = { ...profile, updatedAt: Date.now() };
    await redis.hset(key, data);
    await redis.expire(key, LongTermMemory.TTL_SECONDS);
  }

  async getProfile(clientId: string): Promise<ClientProfile | null> {
    const redis = getRedisClient();
    const key = REDIS_KEYS.profile(clientId);
    const data = await redis.hgetall(key);
    return Object.keys(data).length > 0 ? data as unknown as ClientProfile : null;
  }

  async updateProfile(clientId: string, updates: Partial<ClientProfile>): Promise<void> {
    const redis = getRedisClient();
    const key = REDIS_KEYS.profile(clientId);
    await redis.hset(key, updates);
    await redis.expire(key, LongTermMemory.TTL_SECONDS);
  }

  async addObjective(clientId: string, objective: ClientProfile['objetivos'][0]): Promise<void> {
    const profile = await this.getProfile(clientId);
    const objetivos = profile?.objetivos || [];
    objetivos.push(objective);
    await this.updateProfile(clientId, { objetivos });
  }

  async addAnalysis(clientId: string, analysis: ClientProfile['historico_analises'][0]): Promise<void> {
    const profile = await this.getProfile(clientId);
    const historico = profile?.historico_analises || [];
    historico.unshift(analysis);
    await this.updateProfile(clientId, { historico_analises: historico.slice(0, 20) });
  }
}

export interface EpisodicEvent {
  event: string;
  impact: 'high' | 'medium' | 'low';
  context: any;
  timestamp: number;
}

export class EpisodicMemory {
  async addEvent(clientId: string, event: EpisodicEvent): Promise<void> {
    const redis = getRedisClient();
    const key = REDIS_KEYS.episodic(clientId);
    await redis.zadd(key, event.timestamp, JSON.stringify(event));
    await redis.zremrangebyrank(key, 0, -21); // Keep last 20
  }

  async getRecentEvents(clientId: string, limit: number = 10): Promise<EpisodicEvent[]> {
    const redis = getRedisClient();
    const key = REDIS_KEYS.episodic(clientId);
    const events = await redis.zrevrange(key, 0, limit - 1);
    return events.map(e => JSON.parse(e));
  }

  async findEvents(clientId: string, query: string): Promise<EpisodicEvent[]> {
    const events = await this.getRecentEvents(clientId, 20);
    return events.filter(e =>
      e.event.toLowerCase().includes(query.toLowerCase()) ||
      JSON.stringify(e.context).toLowerCase().includes(query.toLowerCase())
    );
  }
}