const STORAGE_KEYS = {
  currentAnalysis: 'renato_current_analysis',
  analyses: 'renato_analyses',
  clientProfile: 'renato_client_profile',
  settings: 'renato_settings'
};

class Store {
  constructor() {
    this.listeners = new Set();
    this.state = {
      currentAnalysis: null,
      analyses: [],
      clientProfile: null,
      settings: { theme: 'dark', language: 'pt-BR' }
    };
    this.load();
  }

  load() {
    try {
      this.state.currentAnalysis = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentAnalysis) || 'null');
      this.state.analyses = JSON.parse(localStorage.getItem(STORAGE_KEYS.analyses) || '[]');
      this.state.clientProfile = JSON.parse(localStorage.getItem(STORAGE_KEYS.clientProfile) || 'null');
      this.state.settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.settings) || '{}');
    } catch (e) {
      console.warn('Store: Failed to load from localStorage', e);
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEYS.currentAnalysis, JSON.stringify(this.state.currentAnalysis));
      localStorage.setItem(STORAGE_KEYS.analyses, JSON.stringify(this.state.analyses));
      localStorage.setItem(STORAGE_KEYS.clientProfile, JSON.stringify(this.state.clientProfile));
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(this.state.settings));
    } catch (e) {
      console.warn('Store: Failed to save to localStorage', e);
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(l => l(this.state));
  }

  getState() {
    return { ...this.state };
  }

  setCurrentAnalysis(analysis) {
    this.state.currentAnalysis = analysis;
    this.save();
    this.notify();
  }

  getCurrentAnalysis() {
    return this.state.currentAnalysis;
  }

  addAnalysis(analysis) {
    const newAnalysis = { ...analysis, id: analysis.id || crypto.randomUUID(), timestamp: analysis.timestamp || Date.now() };
    this.state.analyses.unshift(newAnalysis);
    if (this.state.analyses.length > 50) this.state.analyses = this.state.analyses.slice(0, 50);
    this.save();
    this.notify();
    return newAnalysis;
  }

  getAnalyses(limit) {
    return limit ? this.state.analyses.slice(0, limit) : [...this.state.analyses];
  }

  getAnalysis(id) {
    return this.state.analyses.find(a => a.id === id);
  }

  getRecentAnalyses(limit = 5) {
    return this.state.analyses.slice(0, limit);
  }

  setClientProfile(profile) {
    this.state.clientProfile = { ...this.state.clientProfile, ...profile };
    this.save();
    this.notify();
  }

  getClientProfile() {
    return this.state.clientProfile;
  }

  updateSettings(settings) {
    this.state.settings = { ...this.state.settings, ...settings };
    this.save();
    this.notify();
  }

  getSettings() {
    return { ...this.state.settings };
  }

  clearAll() {
    this.state = {
      currentAnalysis: null,
      analyses: [],
      clientProfile: null,
      settings: this.state.settings
    };
    this.save();
    this.notify();
  }
}

export const store = new Store();