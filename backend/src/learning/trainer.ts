import { FeedbackCollector, FeedbackEntry } from './feedback-collector.js';
import { getRedisClient, REDIS_KEYS } from '../config/redis.js';
import { getEnv } from '../config/env.js';
import { logger } from '../utils/logger.js';

export class Trainer {
  private feedbackCollector = FeedbackCollector.getInstance();

  async analyzeAndUpdateFewShots(): Promise<{ updated: number; patterns: string[] }> {
    const negativeFeedback = await this.feedbackCollector.getNegativeFeedback(50);
    if (negativeFeedback.length < 5) {
      return { updated: 0, patterns: [] };
    }

    const patterns = this.extractErrorPatterns(negativeFeedback);
    const fewShots = await this.generateFewShots(patterns);

    const redis = getRedisClient();
    await redis.set(REDIS_KEYS.fewShot, JSON.stringify(fewShots));
    await redis.expire(REDIS_KEYS.fewShot, 60 * 60 * 24 * 7); // 1 week TTL

    logger.info({ patterns: patterns.length, fewShots: fewShots.length }, 'Few-shots updated from feedback');
    return { updated: fewShots.length, patterns };
  }

  private extractErrorPatterns(feedback: FeedbackEntry[]): string[] {
    const patterns: Map<string, number> = new Map();

    for (const f of feedback) {
      const key = `${f.context.intent}:${f.type}`;
      patterns.set(key, (patterns.get(key) || 0) + 1);
    }

    return Array.from(patterns.entries())
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([pattern]) => pattern);
  }

  private async generateFewShots(patterns: string[]): Promise<Array<{ input: string; output: string }>> {
    const fewShots: Array<{ input: string; output: string }> = [];

    for (const pattern of patterns) {
      const [intent, type] = pattern.split(':');

      if (type === 'thumbs_down') {
        switch (intent) {
          case 'analisar_credito':
            fewShots.push({
              input: 'Cliente: Quero financiar um carro\nRenato: [resposta muito técnica sem empatia]',
              output: 'Fala! Financiar carro é um sonho, bora ver o que cabe no bolso. Me conta: qual o valor do carro, quanto você tem de entrada e qual sua renda?'
            });
            break;
          case 'explicar_score':
            fewShots.push({
              input: 'Cliente: Por que meu score é baixo?\nRenato: Seu score é 520 porque... [explicação técnica]',
              output: 'Olha, score 520 não é o fim do mundo. Pensa nele como seu "currículo financeiro". O que pesa: atrasos passados, pouco tempo de conta, consultas recentes. Bora ver como melhorar?'
            });
            break;
          case 'consultar_produto':
            fewShots.push({
              input: 'Cliente: Qual o melhor cartão?\nRenato: O cartão X tem taxa Y... [empurra produto]',
              output: 'Melhor cartão depende do SEU perfil. Me diz: você paga a fatura todo mês ou usa rotativo? Quer milhas, cashback ou isenção de anuidade?'
            });
            break;
        }
      }
    }

    return fewShots;
  }

  async retrainIntentClassifier(): Promise<void> {
    logger.info('Intent classifier retraining scheduled (requires TF.js training script)');
  }

  async retrainProductRecommender(): Promise<void> {
    logger.info('Product recommender retraining scheduled (requires TF.js training script)');
  }
}

export async function scheduleWeeklyRetraining(): Promise<void> {
  const env = getEnv();
  const intervalMs = env.RETRAIN_INTERVAL_HOURS * 60 * 60 * 1000;

  setInterval(async () => {
    const trainer = new Trainer();
    await trainer.analyzeAndUpdateFewShots();
    await trainer.retrainIntentClassifier();
    await trainer.retrainProductRecommender();
  }, intervalMs);

  logger.info(`Weekly retraining scheduled every ${env.RETRAIN_INTERVAL_HOURS}h`);
}