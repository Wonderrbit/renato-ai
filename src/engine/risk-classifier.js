const FACTOR_WEIGHTS = {
  scoreBureau: 0.25,
  comprometimentoRenda: 0.20,
  tempoEmprego: 0.10,
  historicoInadimplencia: 0.20,
  relacaoDividaPatrimonio: 0.10,
  idadeContaBancaria: 0.05,
  tipoRenda: 0.05,
  consultasBureau: 0.05
};

const TIPO_RENDA_SCORES = {
  clt: 90,
  empresario: 75,
  aposentado: 85,
  autonomo: 60,
  informal: 30
};

const RISK_BANDS = [
  { min: 800, max: 1000, risco: 'muito_baixo', pd: '< 1%', label: 'Muito Baixo', color: '#22c55e' },
  { min: 650, max: 799, risco: 'baixo', pd: '1-3%', label: 'Baixo', color: '#3b82f6' },
  { min: 500, max: 649, risco: 'moderado', pd: '3-8%', label: 'Moderado', color: '#eab308' },
  { min: 350, max: 499, risco: 'alto', pd: '8-20%', label: 'Alto', color: '#f97316' },
  { min: 0, max: 349, risco: 'muito_alto', pd: '> 20%', label: 'Muito Alto', color: '#ef4444' }
];

function normalizeScoreBureau(value) {
  return Math.min(Math.max(value / 10, 0), 100);
}

function normalizeComprometimentoRenda(value) {
  return Math.min(Math.max(100 - value, 0), 100);
}

function normalizeTempoEmprego(value) {
  return Math.min(value / 60 * 100, 100);
}

function normalizeHistoricoInadimplencia(value) {
  return Math.max(100 - value * 25, 0);
}

function normalizeRelacaoDividaPatrimonio(value) {
  return Math.max(100 - value * 100, 0);
}

function normalizeIdadeContaBancaria(value) {
  return Math.min(value / 60 * 100, 100);
}

function normalizeTipoRenda(value) {
  return TIPO_RENDA_SCORES[value] || 30;
}

function normalizeConsultasBureau(value) {
  return Math.max(100 - value * 15, 0);
}

const NORMALIZERS = {
  scoreBureau: normalizeScoreBureau,
  comprometimentoRenda: normalizeComprometimentoRenda,
  tempoEmprego: normalizeTempoEmprego,
  historicoInadimplencia: normalizeHistoricoInadimplencia,
  relacaoDividaPatrimonio: normalizeRelacaoDividaPatrimonio,
  idadeContaBancaria: normalizeIdadeContaBancaria,
  tipoRenda: normalizeTipoRenda,
  consultasBureau: normalizeConsultasBureau
};

export class RiskClassifier {
  classify(data) {
    const normalized = {};
    const detalhamento = {};
    const fatoresPositivos = [];
    const fatoresNegativos = [];

    for (const [factor, weight] of Object.entries(FACTOR_WEIGHTS)) {
      const rawValue = data[factor];
      const normalizer = NORMALIZERS[factor];
      const normalizedValue = normalizer ? normalizer(rawValue) : 0;
      const weightedScore = normalizedValue * weight * 100;

      normalized[factor] = normalizedValue;
      detalhamento[factor] = {
        raw: rawValue,
        normalized: Math.round(normalizedValue),
        weight: Math.round(weight * 100),
        impact: Math.round(weightedScore)
      };

      if (normalizedValue >= 70) {
        fatoresPositivos.push({ factor, label: this.getFactorLabel(factor), impact: Math.round(weightedScore), value: rawValue });
      } else if (normalizedValue < 40) {
        fatoresNegativos.push({ factor, label: this.getFactorLabel(factor), impact: Math.round(weightedScore), value: rawValue });
      }
    }

    const score = Math.round(Object.values(normalized).reduce((sum, v, i) => sum + v * Object.values(FACTOR_WEIGHTS)[i], 0) * 10);
    const finalScore = Math.min(Math.max(score, 0), 1000);

    const band = RISK_BANDS.find(b => finalScore >= b.min && finalScore <= b.max) || RISK_BANDS[RISK_BANDS.length - 1];

    fatoresPositivos.sort((a, b) => b.impact - a.impact);
    fatoresNegativos.sort((a, b) => a.impact - b.impact);

    return {
      score: finalScore,
      risco: band.risco,
      pd: band.pd,
      label: band.label,
      color: band.color,
      fatoresPositivos,
      fatoresNegativos,
      detalhamento,
      timestamp: Date.now()
    };
  }

  getFactorLabel(factor) {
    const labels = {
      scoreBureau: 'Score Bureau',
      comprometimentoRenda: 'Comprometimento de Renda',
      tempoEmprego: 'Tempo de Emprego',
      historicoInadimplencia: 'Histórico de Inadimplência',
      relacaoDividaPatrimonio: 'Relação Dívida/Patrimônio',
      idadeContaBancaria: 'Idade da Conta Bancária',
      tipoRenda: 'Tipo de Renda',
      consultasBureau: 'Consultas ao Bureau (6m)'
    };
    return labels[factor] || factor;
  }
}

export default RiskClassifier;