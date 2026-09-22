import './styles/variables.css';
import './styles/base.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/chat.css';
import './styles/dashboard.css';

import { createSidebar } from './components/sidebar.js';
import { createChat } from './components/chat.js';
import { createDashboard } from './components/dashboard.js';
import { createSimulatorUI } from './components/simulator-ui.js';
import { eventBus } from './utils/event-bus.js';
import { store } from './utils/store.js';
import { createIcons } from './utils/icons.js';

class App {
  constructor() {
    this.currentRoute = 'chat';
    this.sidebar = null;
    this.chat = null;
    this.dashboard = null;
    this.simulator = null;
    this.icons = createIcons();
  }

  init() {
    this.setupRouter();
    this.renderSidebar();
    this.renderRoute(this.currentRoute);
    window.addEventListener('hashchange', () => this.handleRouteChange());
    this.handleRouteChange();
  }

  setupRouter() {
    eventBus.on('navigate', ({ route }) => {
      window.location.hash = route;
    });
  }

  handleRouteChange() {
    const hash = window.location.hash.slice(1) || 'chat';
    if (hash !== this.currentRoute) {
      this.currentRoute = hash;
      this.renderRoute(hash);
      this.sidebar?.setActiveRoute(hash);
    }
  }

  renderSidebar() {
    const sidebarContainer = document.getElementById('sidebar');
    if (sidebarContainer && !this.sidebar) {
      this.sidebar = createSidebar();
      this.sidebar.mount(sidebarContainer);
    }
  }

  async renderRoute(route) {
    const container = document.getElementById('app-content');
    container.innerHTML = '';

    this.cleanupPreviousRoute();

    switch (route) {
      case 'chat':
        this.chat = createChat();
        this.chat.mount(container);
        break;
      case 'dashboard':
        this.dashboard = createDashboard();
        this.dashboard.mount(container);
        break;
      case 'simulator':
        this.simulator = createSimulatorUI();
        this.simulator.mount(container);
        break;
      case 'products':
        await this.renderProductsPage(container);
        break;
      default:
        this.currentRoute = 'chat';
        window.location.hash = 'chat';
        this.renderRoute('chat');
    }
  }

  cleanupPreviousRoute() {
    this.chat?.destroy();
    this.dashboard?.destroy();
    this.simulator?.destroy();
    this.chat = null;
    this.dashboard = null;
    this.simulator = null;
  }

  async renderProductsPage(container) {
    const { productsEngine } = await import('./engine/products.js');
    const products = productsEngine.getAllProducts();

    container.innerHTML = `
      <header class="page-header">
        <h1 class="page-title">${this.icons.creditCard} Catálogo de Produtos</h1>
        <p class="page-subtitle">Todos os produtos de crédito disponíveis</p>
      </header>
      <div class="grid grid-auto" style="margin-top: 24px;">
        ${products.map(p => `
          <article class="card product-card">
            <div class="product-header">
              <h3>${p.nome}</h3>
              <span class="badge badge-primary">${(p.taxaBase * 100).toFixed(1)}% a.m.</span>
            </div>
            <p class="product-desc">${p.descricao}</p>
            <div class="product-details">
              <div class="detail"><span class="detail-label">Score Mín</span><span class="detail-value">${p.scoreMin}</span></div>
              <div class="detail"><span class="detail-label">Renda Mín</span><span class="detail-value">${formatCurrency(p.rendaMin)}</span></div>
              <div class="detail"><span class="detail-label">Prazo Max</span><span class="detail-value">${p.prazoMax ? p.prazoMax + 'm' : '—'}</span></div>
              <div class="detail"><span class="detail-label">Limite Max</span><span class="detail-value">${formatCurrency(p.limiteMax)}</span></div>
            </div>
          </article>
        `).join('')}
      </div>
      <style>
        .product-card { display: flex; flex-direction: column; gap: 12px; }
        .product-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .product-header h3 { font-size: 16px; font-weight: 600; }
        .product-desc { color: var(--text-secondary); font-size: 14px; line-height: 1.5; }
        .product-details { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding-top: 12px; border-top: 1px solid var(--border); }
        .detail { display: flex; flex-direction: column; gap: 4px; }
        .detail-label { font-size: 11px; color: var(--text-muted); text-transform: uppercase; }
        .detail-value { font-family: var(--font-mono); font-weight: 500; }
      </style>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
  window.app = app;
});

import { formatCurrency } from './utils/helpers.js';