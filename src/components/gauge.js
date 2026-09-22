export class GaugeMeter {
  constructor(container, options = {}) {
    this.container = container;
    this.score = options.score || 0;
    this.maxScore = options.maxScore || 1000;
    this.size = options.size || 200;
    this.strokeWidth = options.strokeWidth || 16;
    this.animationDuration = options.animationDuration || 1500;
    this.colors = options.colors || [
      { stop: 0, color: '#ef4444' },
      { stop: 0.25, color: '#f97316' },
      { stop: 0.5, color: '#eab308' },
      { stop: 0.75, color: '#3b82f6' },
      { stop: 1, color: '#22c55e' }
    ];
    this.svg = null;
    this.progressEl = null;
    this.scoreEl = null;
    this.labelEl = null;
    this.circumference = 2 * Math.PI * (this.size / 2 - this.strokeWidth);
    this.render();
  }

  render() {
    const radius = this.size / 2 - this.strokeWidth;
    const gradientId = `gauge-gradient-${Math.random().toString(36).substr(2, 9)}`;

    const stops = this.colors.map((c, i) =>
      `<stop offset="${c.stop * 100}%" stop-color="${c.color}"/>`
    ).join('');

    this.container.innerHTML = `
      <svg class="gauge-svg" width="${this.size}" height="${this.size / 1.5}" viewBox="0 0 ${this.size} ${this.size / 1.5}">
        <defs>
          <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%">
            ${stops}
          </linearGradient>
        </defs>
        <circle class="gauge-bg" cx="${this.size / 2}" cy="${this.size / 2}" r="${radius}" fill="none" stroke="var(--bg-surface-2)" stroke-width="${this.strokeWidth}"></circle>
        <circle class="gauge-progress" cx="${this.size / 2}" cy="${this.size / 2}" r="${radius}" fill="none" stroke="url(#${gradientId})" stroke-width="${this.strokeWidth}" stroke-linecap="round" stroke-dasharray="${this.circumference}" stroke-dashoffset="${this.circumference}" style="transform: rotate(-90deg); transform-origin: ${this.size / 2}px ${this.size / 2}px; transition: stroke-dashoffset ${this.animationDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94);"></circle>
        ${this.renderMarkers(radius)}
      </svg>
      <div class="gauge-center">
        <div class="gauge-score">0</div>
        <div class="gauge-label"></div>
      </div>
    `;

    this.svg = this.container.querySelector('.gauge-svg');
    this.progressEl = this.container.querySelector('.gauge-progress');
    this.scoreEl = this.container.querySelector('.gauge-score');
    this.labelEl = this.container.querySelector('.gauge-label');

    this.update(this.score);
  }

  renderMarkers(radius) {
    const markers = [0, 250, 500, 750, 1000];
    return markers.map(val => {
      const angle = (val / this.maxScore) * Math.PI - Math.PI / 2;
      const x = this.size / 2 + (radius + 8) * Math.cos(angle);
      const y = this.size / 2 + (radius + 8) * Math.sin(angle);
      return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="var(--text-muted)" font-family="var(--font-mono)">${val}</text>`;
    }).join('');
  }

  update(score) {
    this.score = Math.min(Math.max(score, 0), this.maxScore);
    const offset = this.circumference * (1 - this.score / this.maxScore);

    if (this.progressEl) {
      this.progressEl.style.strokeDashoffset = offset;
    }

    this.animateScore(this.score);
    this.updateLabel(this.score);
  }

  animateScore(target) {
    let current = parseInt(this.scoreEl?.textContent || '0', 10);
    const duration = this.animationDuration;
    const start = performance.now();

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      current = Math.round(target * eased);
      if (this.scoreEl) this.scoreEl.textContent = current;
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  updateLabel(score) {
    const bands = [
      { min: 800, label: 'Muito Baixo', color: '#22c55e' },
      { min: 650, label: 'Baixo', color: '#3b82f6' },
      { min: 500, label: 'Moderado', color: '#eab308' },
      { min: 350, label: 'Alto', color: '#f97316' },
      { min: 0, label: 'Muito Alto', color: '#ef4444' }
    ];
    const band = bands.find(b => score >= b.min) || bands[bands.length - 1];
    if (this.labelEl) {
      this.labelEl.textContent = band.label;
      this.labelEl.style.color = band.color;
    }
  }

  destroy() {
    this.container.innerHTML = '';
  }
}

export function createGauge(container, options) {
  return new GaugeMeter(container, options);
}