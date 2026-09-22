const RISK_CONFIG = {
  muito_baixo: { label: 'Muito Baixo', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
  baixo: { label: 'Baixo', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  moderado: { label: 'Moderado', color: '#eab308', bg: 'rgba(234, 179, 8, 0.15)' },
  alto: { label: 'Alto', color: '#f97316', bg: 'rgba(249, 115, 22, 0.15)' },
  muito_alto: { label: 'Muito Alto', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' }
};

export function createRiskBadge(risco, options = {}) {
  const config = RISK_CONFIG[risco] || RISK_CONFIG.moderado;
  const size = options.size || 'md';

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const badge = document.createElement('span');
  badge.className = `risk-badge risk-${risco} ${sizeClasses[size]}`;
  badge.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    border-radius: 9999px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: ${config.bg};
    color: ${config.color};
    animation: scaleIn 300ms ease forwards;
    opacity: 0;
  `;
  badge.textContent = config.label;

  requestAnimationFrame(() => {
    badge.style.opacity = '1';
  });

  badge.addEventListener('mouseenter', () => {
    badge.style.transform = 'scale(1.05)';
  });
  badge.addEventListener('mouseleave', () => {
    badge.style.transform = 'scale(1)';
  });

  return badge;
}

export class RiskBadge {
  constructor(container, risco, options = {}) {
    this.container = container;
    this.risco = risco;
    this.options = options;
    this.badge = null;
    this.render();
  }

  render() {
    this.badge = createRiskBadge(this.risco, this.options);
    this.container.appendChild(this.badge);
  }

  update(risco) {
    this.risco = risco;
    if (this.badge) {
      this.badge.remove();
    }
    this.render();
  }

  destroy() {
    this.badge?.remove();
  }
}