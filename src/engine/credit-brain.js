const INTENT_MAP = {
  analisar: 'analisar_credito',
  avaliar: 'analisar_credito',
  verificar: 'analisar_credito',
  simular: 'simular_cenario',
  testar: 'simular_cenario',
  'e se': 'simular_cenario',
  cenário: 'simular_cenario',
  consultar: 'consultar_produto',
  buscar: 'consultar_produto',
  qual: 'consultar_produto',
  opções: 'consultar_produto',
  opcoes: 'consultar_produto',
  produto: 'consultar_produto',
  explicar: 'explicar_score',
  'por que': 'explicar_score',
  'porque': 'explicar_score',
  detalhar: 'explicar_score',
  comparar: 'comparar_cenarios',
  versus: 'comparar_cenarios',
  diferença: 'comparar_cenarios',
  diferença: 'comparar_cenarios',
  parecer: 'gerar_parecer',
  relatório: 'gerar_parecer',
  relatorio: 'gerar_parecer',
  laudo: 'gerar_parecer'
};

const ENTITY_PATTERNS = {
  valor: /(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)/gi,
  percentual: /(\d+(?:[.,]\d+)?)\s*%/gi,
  score: /(?:score|pontos?)\s*(?:de\s*)?(\d{3,4})/gi,
  prazo: /(\d+)\s*(?:meses?|anos?)/gi,
  idade: /(\d+)\s*anos?/gi,
  tempo_emprego: /(?:emprego|trabalh[oa])\s*(?:há|faz|de)\s*(\d+)\s*(?:meses?|anos?)/gi,
  renda: /(?:renda|salário|ganho|recebo)\s*(?:de\s*)?(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)/gi,
  tipo_renda: /\b(clt|efetiv[oa]|registrad[oa]|autônom[oa]|freelancer|aposentad[oa]|pensionista|informal|empresárial?|s[oó]cio|mei)\b/gi
};

const TIPO_RENDA_MAP = {
  clt: 'clt', efetiva: 'clt', efetivo: 'clt', registrada: 'clt', registrado: 'clt',
  autônomo: 'autonomo', autonomo: 'autonomo', freelancer: 'autonomo',
  aposentado: 'aposentado', aposentada: 'aposentado', pensionista: 'aposentado',
  informal: 'informal',
  empresário: 'empresario', empresaria: 'empresario', empresarial: 'empresario', sócio: 'empresario', socio: 'empresario', mei: 'empresario'
};

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s.,%$]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text) {
  return normalizeText(text).split(/\s+/).filter(t => t.length > 1);
}

function extractEntities(text) {
  const entities = {};
  const normalized = normalizeText(text);

  for (const [type, pattern] of Object.entries(ENTITY_PATTERNS)) {
    const matches = [...normalized.matchAll(pattern)];
    if (matches.length) {
      entities[type] = matches.map(m => {
        const val = m[1]?.replace('.', '').replace(',', '.') || m[0];
        return type === 'tipo_renda' ? TIPO_RENDA_MAP[val] || val : parseFloat(val) || val;
      });
    }
  }

  return entities;
}

function calculateConfidence(tokens, intent, entities) {
  let confidence = 0;

  const intentTriggers = Object.entries(INTENT_MAP).filter(([_, v]) => v === intent).map(([k]) => k);
  const matchedTriggers = tokens.filter(t => intentTriggers.some(trigger => trigger.includes(t) || t.includes(trigger)));

  if (matchedTriggers.length) confidence += 30;
  if (intent !== 'unknown') confidence += 25;
  if (Object.keys(entities).length) confidence += Math.min(Object.keys(entities).length * 8, 15);
  if (tokens.length > 3) confidence += 10;

  return Math.min(confidence, 95);
}

export class CreditBrain {
  constructor() {
    this.intentMap = INTENT_MAP;
    this.entityPatterns = ENTITY_PATTERNS;
  }

  process(text) {
    const tokens = tokenize(text);
    const entities = extractEntities(text);

    let intent = 'unknown';
    let maxScore = 0;

    for (const [trigger, mappedIntent] of Object.entries(this.intentMap)) {
      if (tokens.some(t => t.includes(trigger) || trigger.includes(t))) {
        const score = trigger.length;
        if (score > maxScore) {
          maxScore = score;
          intent = mappedIntent;
        }
      }
    }

    if (tokens.some(t => ['oi', 'olá', 'ola', 'tudo', 'bem', 'bom', 'dia', 'tarde', 'noite', 'eai', 'e ai', 'fala'].includes(t))) {
      if (intent === 'unknown' || intent === 'conversa_casual') intent = 'conversa_casual';
    }

    const confidence = calculateConfidence(tokens, intent, entities);

    return {
      intent: confidence < 30 ? 'unknown' : intent,
      entities,
      confidence,
      timestamp: Date.now(),
      rawText: text
    };
  }
}

export default CreditBrain;