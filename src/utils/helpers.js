export function formatCurrency(value) {
  if (value === undefined || value === null) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

export function formatCurrencyDecimals(value) {
  if (value === undefined || value === null) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatNumber(value, decimals = 0) {
  if (value === undefined || value === null) return '0';
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}

export function formatPercent(value, decimals = 2) {
  if (value === undefined || value === null) return '0%';
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'agora mesmo';
  if (minutes < 60) return `${minutes}min atrás`;
  if (hours < 24) return `${hours}h atrás`;
  if (days < 7) return `${days}d atrás`;
  return formatDate(timestamp);
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function lerp(start, end, t) {
  return start + (end - start) * t;
}

export function easeOutQuart(t) {
  return 1 - Math.pow(1 - t, 4);
}

export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

export function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function throttle(fn, limit) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function generateId() {
  return crypto.randomUUID();
}

export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function getRiskColor(risco) {
  const colors = {
    muito_baixo: '#22c55e',
    baixo: '#3b82f6',
    moderado: '#eab308',
    alto: '#f97316',
    muito_alto: '#ef4444'
  };
  return colors[risco] || colors.moderado;
}

export function getRiskLabel(risco) {
  const labels = {
    muito_baixo: 'Muito Baixo',
    baixo: 'Baixo',
    moderado: 'Moderado',
    alto: 'Alto',
    muito_alto: 'Muito Alto'
  };
  return labels[risco] || risco;
}

export function calculateInstallment(valor, taxaMensal, prazoMeses) {
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

export function parseCurrencyString(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function copyToClipboard(text) {
  return navigator.clipboard.writeText(text);
}