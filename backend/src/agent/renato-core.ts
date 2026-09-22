import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { logger } from '../utils/logger.js';

const RENATO_SYSTEM_PROMPT = `
Você é Renato, 47 anos, vendedor proativo de produtos financeiros há 22 anos.
Trabalhou no Bradesco, Itaú e agora é consultor independente.

ESTILO DE CONVERSA:
- Natural, como papo de balcão de agência: "Fala, tudo bem?", "Bora ver isso aí"
- Usa gírias sutis do mercado: "fechou?", "spread", "CET", "margem consignável"
- Faz perguntas investigativas: "Me conta, qual o objetivo real desse crédito?"
- Metacognição explícita: "Pera, deixa eu processar...", "Hum, isso muda a análise"
- Empatia: "Entendo sua preocupação, vou te explicar sem economês"
- Memória relacional: "Lembra que você falou da viagem pro Nordeste?"

METACOGNIÇÃO (pensar antes de falar):
1. O que o cliente REALMENTE quer? (não o que ele disse)
2. Que informação me falta para recomendar bem?
3. Qual produto faz sentido pro PERFIL dele, não pra minha comissão?
4. Como explicar de forma que ele CONFIE na decisão?

REGRAS DE OURO:
- Nunca empurre produto. Recomende o que cabe no bolso.
- Se não tem elegibilidade, diga "Olha, esse aqui não rola agora, mas..."
- Celebre vitórias: "Parabéns! Score 780 é coisa de quem cuida da vida financeira"
- Admita limites: "Não tenho dado desse banco específico, mas pelo que vi..."
`;

interface ProcessInput {
  sessionId: string;
  userMessage: string;
  context?: any;
  clientProfile?: any;
  metacognitionThought?: string;
}

interface ProcessOutput {
  chunks: string[];
  finalContent: string;
  metadata: any;
  toolsUsed: string[];
}

export class RenatoAgent {
  private model: ChatOpenAI;
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
      temperature: env.LLM_TEMPERATURE,
      maxTokens: env.LLM_MAX_TOKENS,
      streaming: true,
      configuration: env.OPENROUTER_API_KEY ? { baseURL: 'https://openrouter.ai/api/v1' } : undefined
    });
  }

  async process(input: ProcessInput): Promise<ProcessOutput> {
    const { sessionId, userMessage, context, clientProfile, metacognitionThought } = input;

    const model = await this.getModel();

    const messages = [
      new SystemMessage(RENATO_SYSTEM_PROMPT),
      ...(metacognitionThought ? [new SystemMessage(`[PENSAMENTO PRIVADO]\n${metacognitionThought}`)] : []),
      ...(context?.history || []).map((m: any) => m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)),
      new HumanMessage(userMessage)
    ];

    const stream = await model.stream(messages);
    const chunks: string[] = [];

    for await (const chunk of stream) {
      const content = chunk.content as string;
      if (content) chunks.push(content);
    }

    const finalContent = chunks.join('');

    this.logger.info({ sessionId, tokensIn: userMessage.length, tokensOut: finalContent.length }, 'Agent response generated');

    return {
      chunks,
      finalContent,
      metadata: { sessionId, model: 'gpt-4o-mini', timestamp: Date.now() },
      toolsUsed: []
    };
  }
}