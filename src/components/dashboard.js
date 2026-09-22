import { createIcons } from '../utils/icons.js';
import { eventBus } from '../utils/event-bus.js';
import { store } from '../utils/store.js';
import { formatCurrency } from '../utils/helpers.js';

export class DashboardComponent {
  constructor() {
    this.element = null;
    this.analysis = null;
    this.icons = createIcons();
    this.chart = null;
  }

  mount(container) {
    this.element = document.createElement('div');
    this.element.className = 'dashboard page';
    container.appendChild(this.element);
    this.loadAnalysis();
    eventBus.on('analysisComplete', (data) => this.updateAnalysis(data));
    eventBus.on('analysisLoaded', (data) => this.updateAnalysis(data));
  }

  loadAnalysis() {
    this.analysis = store.getCurrentAnalysis();
    this.render();
  }

  updateAnalysis(analysis) {
    this.analysis = analysis;
    if (this.element) this.render();
  }

  render() {
    if (!this.analysis) {
      this.element.innerHTML = this.renderEmptyState();
      return;
    }

    const { clientData, classification, products } = this.analysis;
    this.element.innerHTML = `
      <header class="dashboard-header">
        <div>
          <h1 class="dashboard-title">Análise: ${clientData.nome || 'Cliente'}</h1>
          <p class="dashboard-subtitle">Score: ${classification.score}/1000 • ${classification.label} • ${new Date(this.analysis.timestamp).toLocaleDateString('pt-BR')}</p>
        </div>
        <div class="dashboard-actions">
          <button class="btn btn-primary" id="new-analysis">${this.icons.plus} Nova Análise</button>
          <button class="btn btn-secondary" id="export-report">${this.icons.download} Exportar</button>
        </div>
      </header>
      <div class="dashboard-grid">
        <section class="card gauge-section">
          ${this.renderGauge(classification)}
        </section>
        <section class="card kpi-section">
          ${this.renderKPIs(clientData, classification)}
        </section>
      </div>
      <div class="dashboard-grid">
        <section class="card chart-section">
          <h3 class="chart-title">${this.icons.activity} Radar dos 8 Fatores</h3>
          <div class="chart-wrapper" id="radar-chart"></div>
        </section>
        <section class="card factors-section">
          <h3 class="chart-title">${this.icons.target} Detalhamento dos Fatores</h3>
          <div class="table-wrapper">${this.renderFactorsTable(classification.detalhamento)}</div>
        </section>
      </div>
      <section class="card products-section">
        <div class="section-header">
          <h3 class="section-title">${this.icons.creditCard} Produtos Recomendados</h3>
        </div>
        <div class="table-wrapper">${this.renderProductsTable(products, clientData)}</div>
      </section>
    `;

    this.bindEvents();
    this.initRadarChart(classification.detalhamento);
    this.animateGauge(classification.score);
  }

  renderEmptyState() {
    return `
      <div class="empty-state">
        ${this.icons.barChart2}
        <h2>Nenhuma análise realizada</h2>
        <p>Vá ao Chat e faça uma nova análise de crédito para ver o dashboard.</p>
        <button class="btn btn-primary" id="go-chat">${this.icons.messageSquare} Ir para o Chat</button>
      </div>
    `;
  }

  renderGauge(c) {
    const circumference = 2 * Math.PI * 45;
    const offset = circumference * (1 - c.score / 1000);
    const riskColors = {
      muito_baixo: 'var(--success)',
      baixo: 'var(--info)',
      moderado: 'var(--warning)',
      alto: 'var(--danger)',
      muito_alto: 'var(--danger)'
    };
    const color = riskColors[c.risco] || 'var(--accent)';

    return `
      <div class="gauge-container">
        <svg class="gauge-svg" viewBox="0 0 100 100">
          <circle class="gauge-bg" cx="50" cy="50" r="45"></circle>
          <circle class="gauge-progress" cx="50" cy="50" r="45"
            stroke="${color}"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${circumference}"
            style="--gauge-offset: ${offset};"></circle>
        </svg>
        <div class="gauge-center">
          <div class="gauge-score" id="gauge-score">0</div>
          <div class="gauge-label">Score de Crédito</div>
          <span class="gauge-risk risk-${c.risco}" style="background: ${color}20; color: ${color};">${c.label}</span>
        </div>
        <div class="gauge-meta">
          <span>PD Estimada: <strong>${c.pd}</strong></span>
        </div>
      </div>
    `;
  }

  renderKPIs(clientData, classification) {
    const margemDisponivel = clientData.renda * (0.35 - clientData.comprometimentoRenda / 100);
    const comprometimentoAtual = clientData.renda * (clientData.comprometimentoRenda / 100);

    const kpis = [
      { icon: this.icons.target, label: 'PD Estimada', value: classification.pd, delta: null },
      { icon: this.icons.percent, label: 'Comprometimento', value: `${clientData.comprometimentoRenda}%`, delta: { value: clientData.comprometimentoRenda <= 30 ? 'Dentro do ideal' : 'Acima do ideal', positive: clientData.comprometimentoRenda <= 30 } },
      { icon: this.icons.dollarSign, label: 'Margem Disponível', value: formatCurrency(Math.max(margemDisponivel, 0)), delta: null },
      { icon: this.icons.trendingUp, label: 'Score Final', value: `${classification.score}/1000`, delta: null }
    ];

    return `
      <div class="kpi-grid">
        ${kpis.map((kpi, i) => `
          <div class="kpi-card stagger-${i + 1}">
            <div class="kpi-icon" style="background: var(--accent-muted); color: var(--accent);">${kpi.icon}</div>
            <div class="kpi-value">${kpi.value}</div>
            <div class="kpi-label">${kpi.label}</div>
            ${kpi.delta ? `<div class="kpi-delta ${kpi.delta.positive ? 'positive' : 'negative'}">${kpi.delta.value}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  renderFactorsTable(detalhamento) {
    const factorOrder = ['scoreBureau', 'comprometimentoRenda', 'historicoInadimplencia', 'tempoEmprego', 'relacaoDividaPatrimonio', 'tipoRenda', 'idadeContaBancaria', 'consultasBureau'];

    return `
      <table class="factor-table">
        <thead>
          <tr><th>Fator</th><th>Valor</th><th>Normalizado</th><th>Peso</th><th>Impacto</th></tr>
        </thead>
        <tbody>
          ${factorOrder.map(key => {
            const d = detalhamento[key];
            if (!d) return '';
            const impactClass = d.impact > 0 ? 'impact-positive' : d.impact < 0 ? 'impact-negative' : 'impact-neutral';
            return `
              <tr>
                <td class="factor-name">${d.label}</td>
                <td class="factor-value">${this.formatRawValue(key, d.raw)}</td>
                <td class="factor-score">${d.normalized}/100</td>
                <td class="factor-weight">${d.weight}%</td>
                <td class="factor-impact ${impactClass}">${d.impact > 0 ? '+' : ''}${d.impact}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  }

  formatRawValue(key, value) {
    if (value === undefined || value === null) return 'N/A';
    switch (key) {
      case 'scoreBureau': return value;
      case 'comprometimentoRenda': return `${value}%`;
      case 'tempoEmprego': return `${value} meses`;
      case 'historicoInadimplencia': return `${value} registro(s)`;
      case 'relacaoDividaPatrimonio': return `${(value * 100).toFixed(1)}%`;
      case 'tipoRenda': return { clt: 'CLT', autonomo: 'Autônomo', aposentado: 'Aposentado', informal: 'Informal', empresario: 'Empresário' }[value] || value;
      case 'idadeContaBancaria': return `${value} meses`;
      case 'consultasBureau': return `${value} consulta(s)`;
      default: return value;
    }
  }

  renderProductsTable(products, clientData) {
    const eligible = products.filter(p => p.elegivel);
    const ineligible = products.filter(p => !p.elegivel);

    if (!eligible.length && !ineligible.length) {
      return '<p class="empty-state-text">Nenhum produto disponível para este perfil.</p>';
    }

    return `
      <table class="product-table">
        <thead>
          <tr><th>Produto</th><th>Taxa Personalizada</th><th>Limite Estimado</th><th>Parcela Estimada</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          ${eligible.map(p => {
            const inst = this.calcInstallment(p.limiteEstimado, p.taxaPersonalizada / 100, p.prazoMax || 12);
            return `
              <tr class="eligible">
                <td class="product-name">${p.nome}</td>
                <td class="product-rate">${p.taxaPersonalizada}% a.m.</td>
                <td class="product-limit">${formatCurrency(p.limiteEstimado)}</td>
                <td class="product-installment">${formatCurrency(inst.parcela)} (${p.prazoMax}x)</td>
                <td class="product-status"><span class="badge badge-success">Elegível</span></td>
                <td><button class="btn btn-ghost btn-sm btn-simulate" data-product="${p.id}">${this.icons.slidersHorizontal} Simular</button></td>
              </tr>
            `;
          }).join('')}
          ${ineligible.map(p => `
            <tr>
              <td class="product-name">${p.nome}</td>
              <td class="product-rate">${p.taxaBase * 100}% a.m.</td>
              <td class="product-limit">Até ${formatCurrency(p.limiteMax)}</td>
              <td class="product-installment">—</td>
              <td class="product-status"><span class="badge badge-danger">Não elegível</span></td>
              <td><span class="text-muted" style="font-size: 11px;">${p.motivo}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  calcInstallment(valor, taxa, prazo) {
    if (taxa === 0) return { parcela: valor / prazo };
    const fator = (taxa * Math.pow(1 + taxa, prazo)) / (Math.pow(1 + taxa, prazo) - 1);
    return { parcela: Math.round(valor * fator * 100) / 100 };
  }

  initRadarChart(detalhamento) {
    const canvas = document.createElement('canvas');
    canvas.id = 'radar-canvas';
    document.getElementById('radar-chart')?.appendChild(canvas);

    const factorOrder = ['scoreBureau', 'comprometimentoRenda', 'historicoInadimplencia', 'tempoEmprego', 'relacaoDividaPatrimonio', 'tipoRenda', 'idadeContaBancaria', 'consultasBureau'];
    const labels = factorOrder.map(k => detalhamento[k]?.label || k);
    const data = factorOrder.map(k => detalhamento[k]?.normalized || 0);

    const riskColors = {
      muito_baixo: 'rgba(34, 197, 94, 0.3)',
      baixo: 'rgba(59, 130, 246, 0.3)',
      moderado: 'rgba(234, 179, 8, 0.3)',
      alto: 'rgba(249, 115, 22, 0.3)',
      muito_alto: 'rgba(239, 68, 68, 0.3)'
    };
    const bgColor = riskColors[this.analysis.classification.risco] || 'rgba(59, 130, 246, 0.3)';
    const borderColor = riskColors[this.analysis.classification.risco]?.replace('0.3', '1') || 'rgba(59, 130, 246, 1)';

    if (this.chart) this.chart.destroy();

    this.chart = new Chart(canvas, {
      type: 'radar',
      data: {
        labels,
        datasets: [{
          label: 'Score Normalizado',
          data,
          backgroundColor: bgColor,
          borderColor,
          borderWidth: 2,
          pointBackgroundColor: borderColor,
          pointBorderColor: '#fff',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1500, easing: 'easeOutQuart' },
        scales: {
          r: {
            min: 0, max: 100,
            grid: { color: 'rgba(30, 58, 95, 0.5)' },
            angleLines: { color: 'rgba(30, 58, 95, 0.5)' },
            pointLabels: { font: { size: 11, family: 'Inter' }, color: '#94a3b8' },
            ticks: { display: false }
          }
        },
        plugins: { legend: { display: false }, tooltip: { enabled: true } }
      }
    });
  }

  animateGauge(score) {
    const progress = document.querySelector('.gauge-progress');
    const scoreEl = document.getElementById('gauge-score');
    if (!progress || !scoreEl) return;

    const circumference = 2 * Math.PI * 45;
    const targetOffset = circumference * (1 - score / 1000);

    progress.style.transition = 'stroke-dashoffset 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    progress.style.strokeDashoffset = targetOffset;

    let current = 0;
    const duration = 1500;
    const start = performance.now();

    function animate(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      current = Math.round(score * eased);
      scoreEl.textContent = current;
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }

  bindEvents() {
    this.element.querySelector('#new-analysis')?.addEventListener('click', () => eventBus.emit('navigate', { route: 'chat' }));
    this.element.querySelector('#go-chat')?.addEventListener('click', () => eventBus.emit('navigate', { route: 'chat' }));
    this.element.querySelector('#export-report')?.addEventListener('click', () => this.exportReport());
    this.element.querySelectorAll('.btn-simulate').forEach(btn => {
      btn.addEventListener('click', () => eventBus.emit('navigate', { route: 'simulator' }));
    });
  }

  exportReport() {
    if (!this.analysis) return;
    const blob = new Blob([this.analysis.report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parecer-credito-${this.analysis.clientData.nome || 'cliente'}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  destroy() {
    this.chart?.destroy();
    eventBus.off('analysisComplete', this.updateAnalysis);
    eventBus.off('analysisLoaded', this.updateAnalysis);
  }
}

export function createDashboard() {
  return new DashboardComponent();
}