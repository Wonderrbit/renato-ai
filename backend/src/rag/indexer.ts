import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { getRedisClient, REDIS_KEYS } from '../config/redis.js';
import { getEnv } from '../config/env.js';
import { logger } from '../utils/logger.js';

const KNOWLEDGE_DOCS = [
  {
    id: 'bcb_4966',
    title: 'Resolução BCB nº 4.966 - Crédito Consignado',
    content: `A Resolução BCB nº 4.966 estabelece as regras para operações de crédito consignado.
    Principais pontos:
    - Margem consignável: até 35% da remuneração líquida (30% para empréstimos + 5% para cartão consignado)
    - Prazo máximo: 84 meses para servidores públicos, 72 meses para INSS
    - Taxa de juros máxima: definida pelo CMN, atualmente ~1,8% a.m. para INSS
    - Portabilidade: permitida a qualquer tempo sem custo
    - Seguro prestamista: opcional, não pode ser condição para concessão`,
    category: 'regulamentacao',
    tags: ['consignado', 'margem', 'portabilidade', 'bcb'],
    source: 'Banco Central do Brasil'
  },
  {
    id: 'bcb_4935',
    title: 'Resolução BCB nº 4.935 - Crédito Rural',
    content: `Resolução BCB nº 4.935 dispõe sobre o crédito rural.
    - Taxas de juros controladas pelo governo
    - Subvenção econômica para pequenos produtores
    - Garantias: hipoteca, penhor, alienação fiduciária
    - Pronaf, Pronamp, Moderfrota, Inovagro`,
    category: 'regulamentacao',
    tags: ['rural', 'pronaf', 'taxas', 'subvencao'],
    source: 'Banco Central do Brasil'
  },
  {
    id: 'febraban_tarifas',
    title: 'Tabela de Tarifas Bancárias - Febraban',
    content: `Principais tarifas padronizadas (valores aproximados 2024):
    - TAC (Tarifa de Abertura de Crédito): até 3% do valor, mínimo R$ 50
    - Tarifa de cadastro: R$ 25-50
    - Tarifa de liquidação antecipada: até 2% do saldo devedor
    - Seguro prestamista: 0,5-1,5% ao ano sobre saldo
    - IOF: 0,38% na contratação + 0,0041% ao dia`,
    category: 'tarifas',
    tags: ['tac', 'iof', 'seguro', 'tarifas', 'febraban'],
    source: 'Febraban'
  },
  {
    id: 'produtos_consignado',
    title: 'Crédito Consignado - Detalhes',
    content: `Produto: Crédito Consignado
    Público: Servidores públicos, aposentados/pensionistas INSS, militares, empregados de empresas conveniadas
    Taxa: 1,3% a 2,1% a.m. (conforme convênio)
    Prazo: até 96 meses (servidores) / 84 meses (INSS)
    Limite: até 10x a renda líquida (servidores) / margem consignável
    Vantagens: Menor taxa, desconto em folha, sem consulta SPC/Serasa para alguns convênios
    Cuidados: Compromete renda futura, portabilidade pode ter custos ocultos`,
    category: 'produto',
    tags: ['consignado', 'servidor', 'inss', 'taxa', 'prazo'],
    source: 'Catálogo interno'
  },
  {
    id: 'produtos_imobiliario',
    title: 'Financiamento Imobiliário - SFH/SFI',
    content: `Financiamento Imobiliário
    SFH (Sistema Financeiro da Habitação): até R$ 1,5M, taxa TR + 3,5% a 8% a.a., FGTS permitido
    SFI (Sistema Financeiro Imobiliário): acima de R$ 1,5M, taxa livre, FGTS não permitido
    Tipos de taxa: PRICE (parcelas fixas), SAC (parcelas decrescentes), IPCA+ (atualização pela inflação)
    Entrada mínima: 20% (pode chegar a 10% em alguns bancos)
    Prazo: até 35 anos (420 meses)
    CET: inclui taxa + seguro MIP + seguro DFI + tarifa de administração`,
    category: 'produto',
    tags: ['imobiliario', 'sfh', 'sfi', 'fgts', 'price', 'sac', 'ipca'],
    source: 'Catálogo interno'
  },
  {
    id: 'produtos_veicular',
    title: 'Financiamento Veicular - CDC/Leasing',
    content: `Financiamento Veicular
    CDC (Crédito Direto ao Consumidor): bem em nome do cliente, alienação fiduciária
    Leasing: arrendamento mercantil, opção de compra no final
    Taxas: 1,2% a 2,5% a.m. (novo) / 1,5% a 3% a.m. (usado)
    Prazo: 12 a 60 meses (novo) / 12 a 48 meses (usado)
    Entrada: mínima 20% (pode ser 0% em promoções)
    CET: taxa + IOF + seguro + tarifa + registro`,
    category: 'produto',
    tags: ['veicular', 'cdc', 'leasing', 'alienacao', 'entrada'],
    source: 'Catálogo interno'
  },
  {
    id: 'glossario',
    title: 'Glossário Financeiro Essencial',
    content: `CET (Custo Efetivo Total): taxa + todas as despesas (IOF, seguro, tarifas). É o preço REAL do crédito.
    Spread: diferença entre taxa de captação do banco e taxa cobrada do cliente. Lucro do banco.
    IOF: Imposto sobre Operações Financeiras. 0,38% na contratação + 0,0041% ao dia.
    TAC: Tarifa de Abertura de Crédito. Cobrança única na contratação.
    Carência: período sem pagamento de principal (apenas juros ou nada).
    Alienação Fiduciária: bem fica em garantia até quitação. Banco tem posse indireta.
    Margem Consignável: % da renda que pode ser comprometido com consignado (35% total).
    Score de Crédito: 0-1000. >700 bom, >800 excelente. Serasa, Boa Vista, SPC.`,
    category: 'glossario',
    tags: ['cet', 'spread', 'iof', 'tac', 'carencia', 'alienacao', 'margem', 'score'],
    source: 'Glossário interno'
  },
  {
    id: 'cases_estudo',
    title: 'Cases de Estudo Anonimizados',
    content: `Case 1: Servidor público, score 720, renda R$ 12k, queria imóvel R$ 600k. Aprovado SFH com 20% entrada, taxa TR+5,5% a.a., parcela R$ 3.200.
    Case 2: Autônomo, score 580, renda R$ 6k, queria carro R$ 120k. Score baixo para CDC. Solução: consignado não disponível. CDC com taxa 2,2% a.m., entrada 30%, parcela R$ 2.800.
    Case 3: Aposentada INSS, score 810, renda R$ 3,5k, precisava R$ 15k emergência. Consignado INSS taxa 1,5% a.m., parcela R$ 320 (margem 35% = R$ 1.225 disp).
    Case 4: Jovem CLT 6 meses, score 650, renda R$ 4k, queria celular R$ 3k. CDC loja taxa 3,5% a.m. Alternativa: cartão sem anuidade parcelado 10x sem juros.`,
    category: 'cases',
    tags: ['cases', 'servidor', 'autonomo', 'aposentado', 'jovem', 'aprovado'],
    source: 'Base de conhecimento'
  }
];

export async function indexKnowledgeBase(): Promise<void> {
  const env = getEnv();
  const redis = getRedisClient();

  const embeddings = new OpenAIEmbeddings({
    modelName: env.EMBEDDING_MODEL,
    apiKey: env.OPENAI_API_KEY || env.OPENROUTER_API_KEY,
    configuration: env.OPENROUTER_API_KEY ? { baseURL: 'https://openrouter.ai/api/v1' } : undefined
  });

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 50,
    separators: ['\n\n', '\n', '. ', ' ', '']
  });

  const pipeline = redis.pipeline();

  for (const doc of KNOWLEDGE_DOCS) {
    const chunks = await splitter.splitText(doc.content);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await embeddings.embedQuery(chunk);
      const chunkId = `${doc.id}_chunk_${i}`;

      const data = {
        id: chunkId,
        docId: doc.id,
        title: doc.title,
        content: chunk,
        category: doc.category,
        tags: doc.tags,
        source: doc.source,
        embedding: JSON.stringify(embedding),
        indexedAt: Date.now()
      };

      pipeline.hset(`${REDIS_KEYS.knowledge}:${chunkId}`, data);
      pipeline.sadd(`${REDIS_KEYS.knowledge}:by_category:${doc.category}`, chunkId);
      doc.tags.forEach(tag => pipeline.sadd(`${REDIS_KEYS.knowledge}:by_tag:${tag}`, chunkId));
    }
  }

  await pipeline.exec();
  logger.info({ docs: KNOWLEDGE_DOCS.length }, 'Knowledge base indexed');
}

export async function searchKnowledge(query: string, category?: string, topK: number = 10): Promise<any[]> {
  const env = getEnv();
  const redis = getRedisClient();
  const embeddings = new OpenAIEmbeddings({
    modelName: env.EMBEDDING_MODEL,
    apiKey: env.OPENAI_API_KEY || env.OPENROUTER_API_KEY
  });

  const queryEmbedding = await embeddings.embedQuery(query);

  let candidateIds: string[];

  if (category) {
    candidateIds = await redis.smembers(`${REDIS_KEYS.knowledge}:by_category:${category}`);
  } else {
    candidateIds = await redis.keys(`${REDIS_KEYS.knowledge}:*`);
    candidateIds = candidateIds.filter(id => !id.includes(':by_category:') && !id.includes(':by_tag:'));
  }

  if (candidateIds.length === 0) return [];

  const pipeline = redis.pipeline();
  candidateIds.forEach(id => pipeline.hgetall(id));
  const results = await pipeline.exec();

  const scored = results
    .filter(([err, data]) => !err && data && data.embedding)
    .map(([_, data]) => {
      const docEmbedding = JSON.parse(data.embedding);
      const similarity = cosineSimilarity(queryEmbedding, docEmbedding);
      return { ...data, similarity, embedding: undefined };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return scored;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}