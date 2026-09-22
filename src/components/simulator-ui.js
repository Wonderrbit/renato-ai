import { createIcons } from '../utils/icons.js';
import { eventBus } from '../utils/event-bus.js';
import { store } from '../utils/store.js';
import { simulator, riskClassifier } from '../engine/index.js';
import { formatCurrency } from '../utils/helpers.js';

const FACTOR_CONFIG = [
  { key: 'scoreBureau', label: 'Score Bureau', min: 0, max: 1000, step: 10, unit: '' },
  { key: 'comprometimentoRenda', label: 'Comprometimento Renda (%)', min: 0, max: 100, step: 1, unit: '%' },
  { key: 'tempoEmprego', label: 'Tempo Emprego (meses)', min: 0, max: 480, step: 1, unit: 'm' },
  { key: 'historicoInadimplencia', label: 'Inadimplências', min: 0, max: 10, step: 1, unit: '' },
  { key: 'relacaoDividaPatrimonio', label: 'Dívida/Patrimônio', min: 0, max: 2, step: 0.05, unit: '' },
  { key: 'idadeContaBancaria', label: 'Idade Conta (meses)', min: 0, max: 360, step: 1, unit: 'm' },
  { key: 'tipoRenda', label: 'Tipo de Renda', type: 'select', options: [
    { value: 'clt', label: 'CLT (90)' },
    { value: 'empresario', label: 'Empresário (75)' },
    { value: 'aposentado', label: 'Aposentado (85)' },
    { value: 'autonomo', label: 'Autônomo (60)' },
    { value: 'informal', label: 'Informal (30)' }
  ]},
  { key: 'consultasBureau', label: 'Consultas Bureau (6m)', min: 0, max: 20, step: 1, unit: '' }
];

export class SimulatorUI {
  constructor() {
    this.element = null;
    this.icons = createIcons();
    this.baseData = {};
    this.currentData = {};
    this.debounceTimer = null;
  }

  mount(container) {
    this.element = document.createElement('div');
    this.element.className = 'simulator page';
    container.appendChild(this.element);
    this.loadBaseData();
    eventBus.on('analysisComplete', (data) => this.loadBaseData(data));
    eventBus.on('analysisLoaded', (data) => this.loadBaseData(data));
  }

  loadBaseData(analysis) {
    if (analysis) {
      this.baseData = { ...analysis.clientData };
    } else {
      const stored = store.getCurrentAnalysis();
      if (stored) this.baseData = { ...stored.clientData };
    }
    this.currentData = { ...this.baseData };
    this.render();
  }

  render() {
    if (Object.keys(this.baseData).length === 0) {
      this.element.innerHTML = this.renderEmptyState();
      return;
    }

    this.element.innerHTML = `
      <header class="page-header">
        <div>
          <h1 class="page-title">${this.icons.slidersHorizontal} Simulador What-If</h1>
          <p class="page-subtitle">Ajuste os fatores e veja o impacto no score em tempo real</p>
        </div>
        <button class="btn btn-secondary" id="reset-sim">${this.icons.refreshCw} Resetar</button>
      </header>
      <div class="simulator-grid">
        <aside class="simulator-controls card">
          <h3 class="section-title">${this.icons.target} Fatores de Entrada</h3>
          <form id="sim-form">
            ${FACTOR_CONFIG.map(f => this.renderFactorControl(f)).join('')}
            <div class="form-actions">
              <button type="button" class="btn btn-primary" id="apply-scenario">${this.icons.check} Aplicar Cenário</button>
            </div>
          </form>
        </aside>
        <section class="simulator-results card">
          <h3 class="section-title">${this.icons.trendingUp} Resultado em Tempo Real</h3>
          ${this.renderResultPanel()}
        </section>
      </div>
      <section class="card stress-section">
        <h3 class="section-title">${this.icons.alertCircle} Stress Test - Cenários Críticos</h3>
        <div class="stress-test-grid" id="stress-grid">
          ${this.renderStressCards()}
        </div>
      </section>
    `;

    this.bindEvents();
    this.updateResults();
  }

  renderEmptyState() {
    return `
      <div class="empty-state">
        ${this.icons.slidersHorizontal}
        <h2>Nenhum dado base</h2>
        <p>Faça uma análise no Chat primeiro para usar o simulador com dados reais.</p>
        <button class="btn btn-primary" id="go-chat-sim">${this.icons.messageSquare} Ir para o Chat</button>
      </div>
    `;
  }

  renderFactorControl(factor) {
    const value = this.currentData[factor.key] ?? factor.default ?? (factor.min + factor.max) / 2;
    if (factor.type === 'select') {
      return `
        <div class="input-group">
          <label class="input-label">${factor.label}</label>
          <select class="input select" name="${factor.key}" data-factor="${factor.key}">
            ${factor.options.map(o => `<option value="${o.value}" ${value === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
        </div>
      `;
    }
    return `
      <div class="input-group">
        <label class="input-label">
          ${factor.label}
          <span class="slider-value" id="val-${factor.key}">${value}${factor.unit}</span>
        </label>
        <input type="range" class="slider" name="${factor.key}" min="${factor.min}" max="${factor.max}" step="${factor.step}" value="${value}" data-factor="${factor.key}">
      </div>
    `;
  }

  renderResultPanel() {
    const baseResult = riskClassifier.classify(this.baseData);
    const currentResult = riskClassifier.classify(this.currentData);
    const delta = currentResult.score - baseResult.score;
    const deltaClass = delta > 0 ? 'positive' : delta < 0 ? 'negative' : '';

    return `
      <div class="result-gauge">
        <div class="gauge-container mini" id="mini-gauge">
          <svg class="gauge-svg" viewBox="0 0 100 100">
            <circle class="gauge-bg" cx="50" cy="50" r="45"></circle>
            <circle class="gauge-progress" cx="50" cy="50" r="45" stroke="var(--accent)" stroke-dasharray="${2 * Math.PI * 45}" stroke-dashoffset="${2 * Math.PI * 45}"></circle>
          </svg>
          <div class="gauge-center">
            <div class="gauge-score" id="mini-score">${currentResult.score}</div>
            <div class="gauge-label">Score Atual</div>
          </div>
        </div>
        <div class="result-delta ${deltaClass}" id="score-delta">
          ${delta >= 0 ? '+' : ''}${delta} pontos vs. base (${baseResult.score})
        </div>
        <div class="result-risk">
          <span class="risk-badge ${currentResult.risco}" style="background: ${currentResult.color}20; color: ${currentResult.color};">${currentResult.label}</span>
          <span class="risk-badge ${baseResult.risco}" style="background: ${baseResult.color}20; color: ${baseResult.color}; opacity: 0.6;">Base: ${baseResult.label}</span>
        </div>
        <div class="result-changes" id="changes-list">
          ${this.renderChangesList(baseResult, currentResult)}
        </div>
      </div>
    `;
  }

  renderChangesList(base, current) {
    const factors = Object.keys(base.detalhamento);
    const changes = factors
      .map(key => {
        const b = base.detalhamento[key];
        const c = current.detalhamento[key];
        if (!b || !c) return null;
        const delta = c.normalized - b.normalized;
        if (Math.abs(delta) < 1) return null;
        return { label: b.label, delta, current: c.normalized };
      })
      .filter(Boolean)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    if (!changes.length) return '<p class="empty-state-text">Nenhuma mudança significativa</p>';

    return changes.map(c => `
      <div class="change-item ${c.delta > 0 ? 'positive' : 'negative'}">
        <span>${c.label}</span>
        <span>${c.delta > 0 ? '+' : ''}${c.delta} (${c.current}/100)</span>
      </div>
    `).join('');
  }

  renderStressCards() {
    const stressResults = simulator.stressTest(this.baseData);
    return stressResults.map(s => {
      const deltaClass = s.deltaScore < 0 ? 'negative' : 'positive';
      const severity = s.deltaScore < -100 ? 'critical' : s.deltaScore < -50 ? 'warning' : 'ok';
      return `
        <div class="stress-card ${severity}" data-scenario="${s.id}">
          <div class="stress-header">
            <span class="stress-title">${s.nome}</span>
            <span class="stress-score ${deltaClass}">${s.deltaScore >= 0 ? '+' : ''}${s.deltaScore}</span>
          </div>
          <p class="stress-desc">${s.descricao}</p>
          <div class="stress-meta">
            <span>Score: <strong>${s.novoScore}</strong> (base: ${s.baseScore})</span>
            <span class="stress-risk risk-${s.novoRisco}">${s.novoRisco.replace('_', ' ')}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  bindEvents() {
    this.element.querySelector('#reset-sim')?.addEventListener('click', () => this.reset());
    this.element.querySelector('#go-chat-sim')?.addEventListener('click', () => eventBus.emit('navigate', { route: 'chat' }));
    this.element.querySelector('#apply-scenario')?.addEventListener('click', () => this.applyScenario());

    this.element.querySelectorAll('.slider').forEach(slider => {
      slider.addEventListener('input', (e) => this.handleSliderChange(e));
    });

    this.element.querySelectorAll('select[name]').forEach(select => {
      select.addEventListener('change', (e) => this.handleSelectChange(e));
    });

    this.element.querySelectorAll('.stress-card').forEach(card => {
      card.addEventListener('click', () => this.applyStressScenario(card.dataset.scenario));
    });
  }

  handleSliderChange(e) {
    const key = e.target.dataset.factor;
    const value = parseFloat(e.target.value);
    this.currentData[key] = value;
    this.element.querySelector(`#val-${key}`).textContent = `${value}${FACTOR_CONFIG.find(f => f.key === key)?.unit || ''}`;
    this.debouncedUpdate();
  }

  handleSelectChange(e) {
    const key = e.target.dataset.factor;
    this.currentData[key] = e.target.value;
    this.debouncedUpdate();
  }

  debouncedUpdate() {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.updateResults(), 150);
  }

  updateResults() {
    const currentResult = riskClassifier.classify(this.currentData);
    const baseResult = riskClassifier.classify(this.baseData);
    const delta = currentResult.score - baseResult.score;

    const progress = this.element.querySelector('#mini-gauge .gauge-progress');
    const scoreEl = this.element.querySelector('#mini-score');
    const deltaEl = this.element.querySelector('#score-delta');
    const riskEl = this.element.querySelector('.result-risk');
    const changesEl = this.element.querySelector('#changes-list');

    if (progress) {
      const circumference = 2 * Math.PI * 45;
      const offset = circumference * (1 - currentResult.score / 1000);
      progress.style.strokeDashoffset = offset;
      progress.style.stroke = currentResult.color;
    }
    if (scoreEl) scoreEl.textContent = currentResult.score;
    if (deltaEl) {
      deltaEl.textContent = `${delta >= 0 ? '+' : ''}${delta} pontos vs. base (${baseResult.score})`;
      deltaEl.className = `result-delta ${delta > 0 ? 'positive' : delta < 0 ? 'negative' : ''}`;
    }
    if (riskEl) {
      riskEl.innerHTML = `
        <span class="risk-badge ${currentResult.risco}" style="background: ${currentResult.color}20; color: ${currentResult.color};">${currentResult.label}</span>
        <span class="risk-badge ${baseResult.risco}" style="background: ${baseResult.color}20; color: ${baseResult.color}; opacity: 0.6;">Base: ${baseResult.label}</span>
      `;
    }
    if (changesEl) {
      changesEl.innerHTML = this.renderChangesList(baseResult, currentResult);
    }
  }

  applyScenario() {
    const result = simulator.simulate(this.baseData, this.currentData);
    this.addMessage({ type: 'agent', content: `Cenário aplicado! Score foi de ${result.base.score} para ${result.modificado.score} (${result.delta.score >= 0 ? '+' : ''}${result.delta.score}). ${result.delta.risco ? 'Risco mudou!' : 'Risco mantido.'}`, timestamp: Date.now() });
  }

  applyStressScenario(id) {
    const scenario = simulator.getStressScenarios().find(s => s.id === id);
    if (!scenario) return;
    const modifiedData = scenario.modifications(this.baseData);
    this.currentData = { ...modifiedData };
    this.syncFormInputs();
    this.updateResults();
    this.addMessage({ type: 'agent', content: `Stress test "${scenario.nome}" aplicado. Score caiu para ${modifiedData.score || 'N/A'}. Quer ver como recuperar?`, timestamp: Date.now() });
  }

  syncFormInputs() {
    FACTOR_CONFIG.forEach(f => {
      const input = this.element.querySelector(`[name="${f.key}"]`);
      const val = this.currentData[f.key];
      if (input && val !== undefined) {
        input.value = val;
        const display = this.element.querySelector(`#val-${f.key}`);
        if (display) display.textContent = `${val}${f.unit || ''}`;
      }
    });
  }

  reset() {
    this.currentData = { ...this.baseData };
    this.syncFormInputs();
    this.updateResults();
  }

  addMessage(message) {
    eventBus.emit('simulatorMessage', message);
  }

  destroy() {
    eventBus.off('analysisComplete', this.loadBaseData);
    eventBus.off('analysisLoaded', this.loadBaseData);
  }
}

export function createSimulatorUI() {
  return new SimulatorUI();
}