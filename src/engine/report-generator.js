import { ProductsEngine } from './products.js';

const productsEngine = new ProductsEngine();

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatPercent(value) {
  return `${value.toFixed(2)}%`;
}

function getRecommendation(score, risco) {
  if (score >= 650) return { decision: 'APROVAR', justificativa: 'Perfil de risco baixo a muito baixo. Capacidade de pagamento demonstrada.' };
  if (score >= 500) return { decision: 'APROVAR_COM_RESTRICOES', justificativa: 'Risco moderado. Aprovação com garantias adicionais ou taxa ajustada.' };
  return { decision: 'RECUSAR', justificativa: 'Risco alto a muito alto. Perfil não atende aos critérios mínimos de crédito.' };
}

function generateFactorAnalysis(detalhamento, fatoresPositivos, fatoresNegativos) {
  const lines = [];
  for (const [factor, data] of Object.entries(detalhamento)) {
    const label = data.raw !== undefined ? `${data.raw}` : 'N/A';
    lines.push(`- **${data.label}**: ${label} (normalizado: ${data.normalized}/100, peso: ${data.weight}%, impacto: ${data.impact > 0 ? '+' : ''}${data.impact})`);
  }
  return lines.join('\n');
}

export class ReportGenerator {
  generate(classification, clientData, productsResult) {
    const { score, risco, pd, label, color, fatoresPositivos, fatoresNegativos, detalhamento } = classification;
    const { decision, justificativa } = getRecommendation(score, risco);
    const eligibleProducts = productsResult.filter(p => p.elegivel);
    const margemDisponivel = clientData.renda * (0.35 - clientData.comprometimentoRenda / 100);

    const sections = [];

    sections.push(this.renderExecutiveSummary(clientData, score, label, decision));
    sections.push(this.renderPaymentCapacity(clientData, margemDisponivel));
    sections.push(this.renderBehavioralProfile(clientData, detalhamento));
    sections.push(this.renderDetractors(fatoresNegativos));
    sections.push(this.renderPositives(fatoresPositivos));
    sections.push(this.renderRecommendation(decision, justificativa, score, risco));
    sections.push(this.renderProducts(eligibleProducts, clientData));

    return sections.join('\n\n---\n\n');
  }

  renderExecutiveSummary(clientData, score, label, decision) {
    return `## Síntese Executiva

**Solicitante**: ${clientData.nome || 'Cliente'}
**Score Final**: ${score}/1000 (${label})
**Decisão**: ${decision}

${decision === 'APROVAR' ? '✅ Perfil aprovado para contratação imediata.' : decision === 'APROVAR_COM_RESTRICOES' ? '⚠️ Perfil aprovado com condições.' : '❌ Perfil não aprovado no momento.'}`;
  }

  renderPaymentCapacity(clientData, margemDisponivel) {
    const comprometimentoAtual = clientData.renda * (clientData.comprometimentoRenda / 100);
    return `## Análise de Capacidade de Pagamento

- **Renda Mensal**: ${formatCurrency(clientData.renda)}
- **Comprometimento Atual**: ${formatCurrency(comprometimentoAtual)} (${clientData.comprometimentoRenda}%)
- **Margem Consignável Disponível**: ${formatCurrency(Math.max(margemDisponivel, 0))} (até 35% da renda)
- **Relação Dívida/Patrimônio**: ${(clientData.relacaoDividaPatrimonio * 100).toFixed(1)}%`;
  }

  renderBehavioralProfile(clientData, detalhamento) {
    const scoreBureau = detalhamento.scoreBureau?.raw || 'N/A';
    const inadimplencia = detalhamento.historicoInadimplencia?.raw || 0;
    const tempoEmprego = detalhamento.tempoEmprego?.raw || 0;
    const idadeConta = detalhamento.idadeContaBancaria?.raw || 0;
    const tipoRenda = clientData.tipoRenda || 'não informado';

    return `## Análise de Perfil Comportamental

- **Score Bureau (Serasa/SPC)**: ${scoreBureau}
- **Histórico de Inadimplência**: ${inadimplencia} registro(s) negativo(s)
- **Estabilidade Profissional**: ${tempoEmprego} meses (${tipoRenda})
- **Relacionamento Bancário**: ${idadeConta} meses de conta`;
  }

  renderDetractors(fatoresNegativos) {
    if (!fatoresNegativos.length) return '## Fatores Detratores\n\nNenhum fator detrator significativo identificado.';

    const items = fatoresNegativos.slice(0, 5).map((f, i) =>
      `${i + 1}. **${f.label}**: ${f.value} (impacto: ${f.impact} pontos)`
    ).join('\n');

    return `## Fatores Detratores (Ordenados por Impacto)

${items}`;
  }

  renderPositives(fatoresPositivos) {
    if (!fatoresPositivos.length) return '## Fatores Positivos\n\nNenhum fator positivo destacado.';

    const items = fatoresPositivos.slice(0, 5).map((f, i) =>
      `${i + 1}. **${f.label}**: ${f.value} (impacto: +${f.impact} pontos)`
    ).join('\n');

    return `## Fatores Positivos (Ordenados por Impacto)

${items}`;
  }

  renderRecommendation(decision, justificativa, score, risco) {
    const condicionantes = [];
    if (decision === 'APROVAR_COM_RESTRICOES') {
      condicionantes.push('Taxa com spread de risco aplicado');
      condicionantes.push('Limite reduzido a 70% do elegível');
      condicionantes.push('Exigência de avalista ou garantia real para valores > R$ 20.000');
    }

    return `## Recomendação

**${decision}**

**Justificativa**: ${justificativa}

${condicionantes.length ? `**Condicionantes**:\n${condicionantes.map(c => `- ${c}`).join('\n')}` : ''}`;
  }

  renderProducts(products, clientData) {
    if (!products.length) return '## Produtos Recomendados\n\nNenhum produto elegível para o perfil atual.';

    const rows = products.map(p => {
      const installment = productsEngine.calculateInstallment(p.limiteEstimado, p.taxaPersonalizada, p.prazoMax || 12);
      return `| ${p.nome} | ${p.taxaPersonalizada}% a.m. | ${formatCurrency(p.limiteEstimado)} | ${formatCurrency(installment.parcela)} (${p.prazoMax || 12}x) | ✅ Elegível |`;
    }).join('\n');

    return `## Produtos Recomendados

| Produto | Taxa Personalizada | Limite Estimado | Parcela (prazo) | Status |
|---------|-------------------|-----------------|-----------------|--------|
${rows}

*Taxas e limites simulados com base no perfil. CET e condições finais sujeitas à análise cadastral completa.`;
  }
}

export default new ReportGenerator();