import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { logger } from '../utils/logger.js';

const METACOGNITION_PROMPT = `
[PENSAMENTO PRIVADO - NÃO MOSTRAR AO CLIENTE]
Cliente disse: "{userMessage}"
Contexto: {conversationSummary}
Perfil conhecido: {clientProfile}

Analise:
1. Intenção real (explícita + implícita):
2. Emoção detectada (ansiedade, urgência, curiosidade, confiança):
3. Informação crítica faltando:
4. Melhor tool para usar agora:
5. Risco de alucinação / viés:
6. Como ser mais humano/empático:
`;

export class MetacognitionEngine {
  private logger: any;

  constructor(logger: any) {
    this.logger = logger;
  }

  private async getModel() {
    const { getEnv } = await import('../config/env.js');
    const env = getEnv();

    const { ChatOpenAI } = await import('@langchain/openai');
    return new ChatOpenAI({
      openAIApiKey: env.OPENAI_API_KEY || env.OPENROUTER_API_KEY,
      modelName: env.LLM_MODEL,
      temperature: 0.3,
      maxTokens: 500,
      configuration: env.OPENROUTER_API_KEY ? { baseURL: 'https://openrouter.ai/api/v1' } : undefined
    });
  }

  async reflect(context: { content: string; context?: any; clientProfile?: any; sessionId: string }): Promise<string> {
    const { content: userMessage, context: ctx, clientProfile } = context;

    const conversationSummary = ctx?.history
      ? ctx.history.slice(-5).map((m: any) => `${m.role}: ${m.content}`).join('\n')
      : 'Início de conversa';

    const profileSummary = clientProfile
      ? `Nome: ${clientProfile.nome}, Profissão: ${clientProfile.profissao}, Renda: ${clientProfile.renda_faixa}, Score: ${clientProfile.score_faixa}, Objetivos: ${clientProfile.objetivos?.join(', ') || 'não definidos'}`
      : 'Perfil não identificado';

    const prompt = METACOGNITION_PROMPT
      .replace('{userMessage}', userMessage)
      .replace('{conversationSummary}', conversationSummary)
      .replace('{clientProfile}', profileSummary);

    try {
      const model = await this.getModel();
      const response = await model.invoke([new HumanMessage(prompt)]);
      const thought = response.content as string;

      this.logger.debug({ sessionId: context.sessionId, thoughtLength: thought.length }, 'Metacognition reflection');
      return thought;
    } catch (err) {
      this.logger.error({ err, sessionId: context.sessionId }, 'Metacognition error');
      return 'Reflexão indisponível, prosseguindo com resposta padrão.';
    }
  }

  async evaluateResponse(draftResponse: string, context: any): Promise<{ score: number; issues: string[]; improvedDraft: string }> {
    const issues: string[] = [];
    let score = 100;

    if (draftResponse.length < 20) { issues.push('Resposta muito curta'); score -= 20; }
    if (draftResponse.length > 3000) { issues.push('Resposta muito longa'); score -= 15; }
    if (/^(ok|certo|beleza|fechado|entendido)$/i.test(draftResponse.trim())) { issues.push('Confirmação vazia'); score -= 25; }
    if (!/[.!?]$/.test(draftResponse.trim())) { issues.push('Sem pontuação final'); score -= 10; }

    const renatoMarkers = ['bora', 'fechou', 'olha', 'pera', 'então', 'tá', 'beleza', 'sucesso'];
    const hasPersona = renatoMarkers.some(m => draftResponse.toLowerCase().includes(m));
    if (!hasPersona && draftResponse.length > 100) { issues.push('Falta persona Renato'); score -= 15; }

    return { score: Math.max(score, 0), issues, improvedDraft: draftResponse };
  }

  detectIntentDrift(history: any[]): boolean {
    if (history.length < 4) return false;
    const recentIntents = history.slice(-4).map(h => h.intent).filter(Boolean);
    return new Set(recentIntents).size > 2;
  }

  identifyMissingInfo(context: any): string[] {
    const missing: string[] = [];
    const profile = context.clientProfile || {};

    if (!profile.renda_faixa) missing.push('renda');
    if (!profile.score_faixa) missing.push('score');
    if (!profile.objetivos?.length) missing.push('objetivo do crédito');
    if (!profile.tempo_emprego) missing.push('tempo de emprego');

    return missing;
  }
}