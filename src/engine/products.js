const PRODUCTS = [
  {
    id: 'credito_pessoal',
    nome: 'Crédito Pessoal',
    taxaBase: 0.025,
    scoreMin: 500,
    rendaMin: 2000,
    prazoMax: 48,
    limiteMax: 50000,
    tipo: 'pessoal',
    descricao: 'Liberdade para usar como quiser, sem necessidade de comprovação de destino.'
  },
  {
    id: 'cartao_credito',
    nome: 'Cartão de Crédito',
    taxaBase: 0.14,
    scoreMin: 550,
    rendaMin: 1500,
    prazoMax: null,
    limiteMax: 20000,
    tipo: 'rotativo',
    descricao: 'Para compras do dia a dia e emergências. Cuidado com o rotativo!'
  },
  {
    id: 'consignado',
    nome: 'Consignado',
    taxaBase: 0.015,
    scoreMin: 350,
    rendaMin: 1200,
    prazoMax: 84,
    limiteMax: 100000,
    tipo: 'consignado',
    descricao: 'Descontado na folha, menor taxa. Compromete até 35% da renda líquida.'
  },
  {
    id: 'financiamento_imobiliario',
    nome: 'Financiamento Imobiliário',
    taxaBase: 0.008,
    scoreMin: 700,
    rendaMin: 5000,
    prazoMax: 360,
    limiteMax: 1500000,
    tipo: 'imobiliario',
    descricao: 'Seu imóvel próprio. Longo prazo, taxa atrelada à poupança/IPCA.'
  },
  {
    id: 'financiamento_veicular',
    nome: 'Financiamento Veicular',
    taxaBase: 0.018,
    scoreMin: 600,
    rendaMin: 3000,
    prazoMax: 60,
    limiteMax: 200000,
    tipo: 'veicular',
    descricao: 'Carro novo ou usado. O bem fica alienado até quitar.'
  },
  {
    id: 'cdc',
    nome: 'CDC (Crédito Direto ao Consumidor)',
    taxaBase: 0.022,
    scoreMin: 500,
    rendaMin: 1800,
    prazoMax: 36,
    limiteMax: 30000,
    tipo: 'cdc',
    descricao: 'Para bens duráveis (móveis, eletros). Taxa fixa, parcelas iguais.'
  }
];

function calculateInstallment(valor, taxaMensal, prazoMeses) {
  if (taxaMensal === 0) return { parcela: valor / prazoMeses, total: valor, juros: 0, cet: 0 };
  const i = taxaMensal;
  const n = prazoMeses;
  const fator = (i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1);
  const parcela = valor * fator;
  const total = parcela * n;
  const juros = total - valor;
  const cet = Math.pow(1 + taxaMensal, 12) - 1;
  return { parcela: Math.round(parcela * 100) / 100, total: Math.round(total * 100) / 100, juros: Math.round(juros * 100) / 100, cet: Math.round(cet * 10000) / 100 };
}

function calculateSpread(score) {
  if (score >= 800) return -0.003;
  if (score >= 650) return -0.001;
  if (score >= 500) return 0;
  if (score >= 350) return 0.005;
  return 0.01;
}

export class ProductsEngine {
  getAllProducts() {
    return PRODUCTS.map(p => ({ ...p }));
  }

  getEligibleProducts(score, renda, comprometimento) {
    const margemDisponivel = renda * (0.35 - comprometimento / 100);
    const spread = calculateSpread(score);

    return PRODUCTS
      .filter(p => score >= p.scoreMin && renda >= p.rendaMin)
      .map(p => {
        const taxaPersonalizada = Math.max(p.taxaBase + spread, 0.005);
        const limiteMaximo = Math.min(p.limiteMax, Math.max(margemDisponivel * (p.tipo === 'consignado' ? 60 : 24), 1000));
        const prazo = p.prazoMax || 12;

        return {
          ...p,
          taxaPersonalizada: Math.round(taxaPersonalizada * 10000) / 100,
          limiteEstimado: Math.round(limiteMaximo / 100) * 100,
          elegivel: true,
          spreadAplicado: Math.round(spread * 10000) / 100
        };
      })
      .sort((a, b) => a.taxaPersonalizada - b.taxaPersonalizada);
  }

  getIneligibleProducts(score, renda) {
    return PRODUCTS
      .filter(p => score < p.scoreMin || renda < p.rendaMin)
      .map(p => ({
        ...p,
        elegivel: false,
        motivo: score < p.scoreMin ? `Score mínimo: ${p.scoreMin}` : `Renda mínima: R$ ${p.rendaMin.toLocaleString('pt-BR')}`
      }));
  }

  calculateInstallment(valor, taxa, prazo) {
    return calculateInstallment(valor, taxa / 100, prazo);
  }

  getProductById(id) {
    return PRODUCTS.find(p => p.id === id);
  }
}

export default new ProductsEngine();