import { createIcons } from '../utils/icons.js';
import { eventBus } from '../utils/event-bus.js';
import { store } from '../utils/store.js';

const NAV_ITEMS = [
  { id: 'chat', label: 'Chat do Renato', icon: 'message-square' },
  { id: 'dashboard', label: 'Dashboard', icon: 'bar-chart-2' },
  { id: 'simulator', label: 'Simulador', icon: 'sliders-horizontal' },
  { id: 'products', label: 'Produtos', icon: 'credit-card' }
];

export class Sidebar {
  constructor() {
    this.element = null;
    this.collapsed = false;
    this.activeRoute = 'chat';
    this.recentAnalyses = [];
  }

  mount(container) {
    this.element = document.createElement('aside');
    this.element.id = 'sidebar';
    this.element.className = 'sidebar';
    this.render();
    container.appendChild(this.element);
    this.bindEvents();
    this.loadRecentAnalyses();
  }

  render() {
    const icons = createIcons();
    this.element.innerHTML = `
      <div class="sidebar-header">
        <div class="sidebar-logo" data-tooltip="Renato AI">
          <div class="logo-icon">${icons.shield}</div>
          <span class="logo-text">Renato AI</span>
        </div>
        <button class="btn btn-ghost btn-icon sidebar-toggle" aria-label="Colapsar sidebar" data-tooltip="Colapsar">
          ${icons.chevronLeft}
        </button>
      </div>
      <nav class="sidebar-nav" role="navigation" aria-label="Navegação principal">
        ${NAV_ITEMS.map(item => `
          <button class="nav-item ${item.id === this.activeRoute ? 'active' : ''}" data-route="${item.id}" ${this.collapsed ? `aria-label="${item.label}"` : ''}>
            ${icons[item.icon]}
            <span class="nav-label">${item.label}</span>
          </button>
        `).join('')}
      </nav>
      <div class="sidebar-section recent-analyses">
        <h3 class="section-title">Análises Recentes</h3>
        <div class="recent-list" id="recent-list">
          ${this.recentAnalyses.length ? this.recentAnalyses.map(a => this.renderRecentItem(a)).join('') : '<p class="empty-state-text">Nenhuma análise ainda</p>'}
        </div>
      </div>
      <div class="sidebar-footer">
        <div class="agent-status">
          <span class="status-dot online"></span>
          <span>Online — PSP Ativo</span>
        </div>
        <div class="sidebar-version">v1.0.0</div>
      </div>
    `;
  }

  renderRecentItem(analysis) {
    const riskColors = {
      muito_baixo: 'var(--success)',
      baixo: 'var(--info)',
      moderado: 'var(--warning)',
      alto: 'var(--danger)',
      muito_alto: 'var(--danger)'
    };
    const color = riskColors[analysis.risco] || 'var(--text-muted)';
    const date = new Date(analysis.timestamp).toLocaleDateString('pt-BR');
    return `
      <button class="recent-item" data-analysis-id="${analysis.id}">
        <div class="recent-info">
          <span class="recent-name">${analysis.nome}</span>
          <span class="recent-date">${date}</span>
        </div>
        <span class="risk-badge ${analysis.risco}" style="background: ${color}20; color: ${color};">${analysis.label}</span>
      </button>
    `;
  }

  bindEvents() {
    this.element.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => this.navigate(btn.dataset.route));
    });

    this.element.querySelector('.sidebar-toggle').addEventListener('click', () => this.toggleCollapse());

    this.element.querySelectorAll('.recent-item').forEach(btn => {
      btn.addEventListener('click', () => this.loadAnalysis(btn.dataset.analysisId));
    });

    window.addEventListener('analysisComplete', (e) => this.addRecentAnalysis(e.detail));
  }

  navigate(route) {
    this.activeRoute = route;
    this.element.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.route === route);
    });
    eventBus.emit('navigate', { route });
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;
    this.element.classList.toggle('collapsed', this.collapsed);
    const toggle = this.element.querySelector('.sidebar-toggle');
    const icons = createIcons();
    toggle.innerHTML = this.collapsed ? icons.chevronRight : icons.chevronLeft;
    toggle.setAttribute('aria-label', this.collapsed ? 'Expandir sidebar' : 'Colapsar sidebar');
  }

  loadRecentAnalyses() {
    this.recentAnalyses = store.getRecentAnalyses(5);
    const list = this.element.querySelector('#recent-list');
    if (list) {
      list.innerHTML = this.recentAnalyses.length
        ? this.recentAnalyses.map(a => this.renderRecentItem(a)).join('')
        : '<p class="empty-state-text">Nenhuma análise ainda</p>';
      list.querySelectorAll('.recent-item').forEach(btn => {
        btn.addEventListener('click', () => this.loadAnalysis(btn.dataset.analysisId));
      });
    }
  }

  addRecentAnalysis(analysis) {
    this.recentAnalyses.unshift(analysis);
    this.recentAnalyses = this.recentAnalyses.slice(0, 5);
    this.loadRecentAnalyses();
  }

  loadAnalysis(id) {
    const analysis = store.getAnalysis(id);
    if (analysis) {
      store.setCurrentAnalysis(analysis);
      eventBus.emit('analysisLoaded', analysis);
      this.navigate('dashboard');
    }
  }

  setActiveRoute(route) {
    this.activeRoute = route;
    this.element.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.route === route);
    });
  }
}

export function createSidebar() {
  return new Sidebar();
}