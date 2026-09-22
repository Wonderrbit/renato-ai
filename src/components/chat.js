import { createIcons } from '../utils/icons.js';
import { eventBus } from '../utils/event-bus.js';
import { store } from '../utils/store.js';
import { creditBrain, riskClassifier, reportGenerator, productsEngine, PlanckProtocol } from '../engine/index.js';

const QUICK_REPLIES = [
  'Nova análise de crédito',
  'Simular cenário',
  'Ver produtos disponíveis',
  'Gerar parecer'
];

const FORM_STEPS = [
  {
    id: 'step1',
    title: 'Perfil de Crédito',
    fields: [
      { name: 'scoreBureau', label: 'Score Bureau (Serasa/SPC)', type: 'range', min: 0, max: 1000, step: 10, default: 600 },
      { name: 'tipoRenda', label: 'Tipo de Renda', type: 'select', options: [
        { value: 'clt', label: 'CLT / Efetivo' },
        { value: 'autonomo', label: 'Autônomo / Freelancer' },
        { value: 'aposentado', label: 'Aposentado / Pensionista' },
        { value: 'informal', label: 'Informal' },
        { value: 'empresario', label: 'Empresário / Sócio / MEI' }
      ]}
    ]
  },
  {
    id: 'step2',
    title: 'Renda e Comprometimento',
    fields: [
      { name: 'renda', label: 'Renda Mensal (R$)', type: 'number', min: 0, step: 100, default: 5000 },
      { name: 'comprometimentoRenda', label: 'Comprometimento Atual (%)', type: 'range', min: 0, max: 100, step: 1, default: 25 }
    ]
  },
  {
    id: 'step3',
    title: 'Estabilidade e Relacionamento',
    fields: [
      { name: 'tempoEmprego', label: 'Tempo no Emprego Atual (meses)', type: 'number', min: 0, step: 1, default: 24 },
      { name: 'idadeContaBancaria', label: 'Idade da Conta Bancária (meses)', type: 'number', min: 0, step: 1, default: 36 }
    ]
  },
  {
    id: 'step4',
    title: 'Histórico e Consultas',
    fields: [
      { name: 'historicoInadimplencia', label: 'Registros de Inadimplência', type: 'number', min: 0, step: 1, default: 0 },
      { name: 'consultasBureau', label: 'Consultas ao Bureau (últimos 6 meses)', type: 'number', min: 0, step: 1, default: 1 }
    ]
  },
  {
    id: 'step5',
    title: 'Patrimônio e Dívidas',
    fields: [
      { name: 'patrimonio', label: 'Patrimônio Total (R$)', type: 'number', min: 0, step: 1000, default: 50000 },
      { name: 'dividaTotal', label: 'Dívida Total (R$)', type: 'number', min: 0, step: 1000, default: 10000 }
    ]
  }
];

export class ChatComponent {
  constructor() {
    this.element = null;
    this.messages = [];
    this.currentStep = 0;
    this.formData = {};
    this.isTyping = false;
    this.icons = createIcons();
    this.psp = new PlanckProtocol();
    this.clientProfile = store.getClientProfile();
    this.ws = null;
    this.useBackend = false;
  }

  mount(container) {
    this.element = document.createElement('div');
    this.element.className = 'chat-container';
    this.render();
    container.appendChild(this.element);
    this.bindEvents();
    this.loadWelcomeMessage();
    this.connectBackend();
  }

  connectBackend() {
    const wsUrl = (import.meta.env.VITE_WS_URL || 'ws://localhost:3001').replace('http', 'ws') + '/chat';
    try {
      this.ws = new WebSocket(wsUrl);
      this.ws.onopen = () => { this.useBackend = true; console.log('WS connected'); };
      this.ws.onmessage = (e) => this.handleBackendMessage(JSON.parse(e.data));
      this.ws.onclose = () => { this.useBackend = false; console.log('WS disconnected, using local engine'); };
      this.ws.onerror = () => { this.useBackend = false; };
    } catch (e) {
      this.useBackend = false;
    }
  }

  handleBackendMessage(msg) {
    if (msg.type === 'agent_chunk') {
      this.appendAgentChunk(msg.content);
    } else if (msg.type === 'agent_complete') {
      this.finishAgentMessage(msg.content, msg.metadata);
    } else if (msg.type === 'thinking') {
      this.showThinking(msg.thought);
    } else if (msg.type === 'tool_call') {
      this.showToolCall(msg.tool, msg.args);
    }
  }

  sendToBackend(content, context) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'user_message',
        content,
        context,
        clientProfile: this.clientProfile
      }));
      return true;
    }
    return false;
  }

  render() {
    this.element.innerHTML = `
      <header class="chat-header">
        <div class="chat-header-info">
          <div class="chat-avatar">
            <div class="avatar">R</div>
            <span class="chat-status"></span>
          </div>
          <div>
            <div class="chat-title">Renato</div>
            <div class="chat-subtitle">Gerente de Crédito • 22 anos de experiência</div>
          </div>
        </div>
        <div class="chat-actions">
          <button class="btn btn-ghost btn-icon" data-tooltip="Limpar conversa" id="clear-chat">${this.icons.refreshCw}</button>
          <button class="btn btn-ghost btn-icon" data-tooltip="Configurações" id="chat-settings">${this.icons.settings}</button>
        </div>
      </header>
      <div class="chat-messages" id="chat-messages" role="log" aria-live="polite"></div>
      <div class="typing-indicator-container" id="typing-indicator" style="display: none;">
        <div class="typing-bubble">
          <div class="typing-indicator"><span></span><span></span><span></span></div>
        </div>
      </div>
      <div class="quick-replies" id="quick-replies"></div>
      <div class="chat-input-area">
        <div class="chat-input-wrapper">
          <textarea class="chat-input" id="chat-input" placeholder="Digite sua mensagem..." rows="1" aria-label="Mensagem"></textarea>
          <button class="chat-send-btn" id="send-btn" aria-label="Enviar">${this.icons.send}</button>
        </div>
      </div>
    `;
  }

  bindEvents() {
    const input = this.element.querySelector('#chat-input');
    const sendBtn = this.element.querySelector('#send-btn');
    const messagesEl = this.element.querySelector('#chat-messages');

    input.addEventListener('input', () => this.autoResize(input));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    sendBtn.addEventListener('click', () => this.sendMessage());

    this.element.querySelector('#clear-chat').addEventListener('click', () => this.clearChat());
    this.element.querySelector('#chat-settings').addEventListener('click', () => this.openSettings());

    messagesEl.addEventListener('click', (e) => {
      const quickReply = e.target.closest('.quick-reply');
      if (quickReply) this.handleQuickReply(quickReply.dataset.action);
    });

    eventBus.on('analysisComplete', (data) => this.handleAnalysisComplete(data));
  }

  autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
  }

  loadWelcomeMessage() {
    const welcome = this.clientProfile?.nome
      ? `Volta, ${this.clientProfile.nome.split(' ')[0]}! Lembra de mim? Renato. Como foi aquela história do ${this.clientProfile.objetivos?.[0] || 'crédito'}?`
      : "Fala! Sou o Renato, 22 anos de balcão de banco, agora por conta. Como posso te ajudar hoje?";

    this.addMessage({
      type: 'agent',
      content: welcome,
      timestamp: Date.now()
    });

    this.renderQuickReplies();
  }

  renderQuickReplies() {
    const container = this.element.querySelector('#quick-replies');
    container.innerHTML = QUICK_REPLIES.map(action => `
      <button class="quick-reply chip" data-action="${action}">${action}</button>
    `).join('');
  }

  handleQuickReply(action) {
    const messages = {
      'Nova análise de crédito': 'Quero fazer uma nova análise de crédito',
      'Simular cenário': 'Quero simular um cenário',
      'Ver produtos disponíveis': 'Quais produtos tenho disponível?',
      'Gerar parecer': 'Gere um parecer de crédito'
    };
    this.sendMessage(messages[action]);
  }

  async sendMessage(content) {
    const text = content || this.element.querySelector('#chat-input').value.trim();
    if (!text) return;

    this.element.querySelector('#chat-input').value = '';
    this.element.querySelector('#chat-input').style.height = 'auto';
    this.element.querySelector('#send-btn').disabled = true;

    this.addMessage({ type: 'user', content: text, timestamp: Date.now() });
    this.showTyping(true);

    if (this.currentStep < FORM_STEPS.length) {
      await this.processFormStep(text);
    } else {
      await this.processMessage(text);
    }

    this.showTyping(false);
    this.element.querySelector('#send-btn').disabled = false;
    this.element.querySelector('#chat-input').focus();
  }

  async processFormStep(text) {
    const step = FORM_STEPS[this.currentStep];
    const field = step.fields.find(f => f.name === Object.keys(this.formData).length ? null : step.fields[Object.keys(this.formData).length % step.fields.length].name);

    const parsed = this.parseFormInput(text, step.fields);
    if (parsed) {
      Object.assign(this.formData, parsed);
    }

    const allFields = step.fields.flatMap(f => [f.name]);
    const filled = allFields.every(f => this.formData[f] !== undefined);

    if (filled) {
      this.currentStep++;
      if (this.currentStep < FORM_STEPS.length) {
        this.showNextFormStep();
      } else {
        await this.runAnalysis();
      }
    } else {
      this.promptNextField(step);
    }
  }

  parseFormInput(text, fields) {
    const result = {};
    const numbers = text.match(/\d+(?:[.,]\d+)?/g);
    if (!numbers) return null;

    for (const field of fields) {
      if (this.formData[field.name] !== undefined) continue;
      const num = numbers.shift();
      if (num) {
        let val = parseFloat(num.replace(',', '.'));
        if (field.type === 'select') {
          const idx = Math.min(Math.max(parseInt(val) - 1, 0), field.options.length - 1);
          val = field.options[idx].value;
        }
        result[field.name] = val;
        return result;
      }
    }
    return null;
  }

  showNextFormStep() {
    const step = FORM_STEPS[this.currentStep];
    this.addMessage({
      type: 'form',
      stepId: step.id,
      title: step.title,
      fields: step.fields,
      timestamp: Date.now()
    });
  }

  promptNextField(step) {
    const unfilled = step.fields.find(f => this.formData[f.name] === undefined);
    if (unfilled) {
      this.addMessage({
        type: 'agent',
        content: `Beleza. Agora me diz: **${unfilled.label}**${unfilled.type === 'range' ? ` (0 a ${unfilled.max})` : ''}`,
        timestamp: Date.now()
      });
    }
  }

  async runAnalysis() {
    const data = {
      ...this.formData,
      relacaoDividaPatrimonio: this.formData.patrimonio > 0 ? this.formData.dividaTotal / this.formData.patrimonio : 1
    };

    const classification = riskClassifier.classify(data);
    const products = productsEngine.getEligibleProducts(classification.score, data.renda, data.comprometimentoRenda);
    const report = reportGenerator.generate(classification, data, products);

    const analysisResult = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      clientData: data,
      classification,
      products,
      report
    };

    store.addAnalysis(analysisResult);
    store.setCurrentAnalysis(analysisResult);

    this.addMessage({
      type: 'analysis',
      content: report,
      data: analysisResult,
      timestamp: Date.now()
    });

    this.currentStep = 0;
    this.formData = {};
    this.renderQuickReplies();

    eventBus.emit('analysisComplete', analysisResult);
  }

  async processMessage(text) {
    const brainResult = creditBrain.process(text);

    if (this.useBackend) {
      const sent = this.sendToBackend(text, { brainResult, formData: this.formData, clientProfile: this.clientProfile });
      if (sent) return;
    }

    switch (brainResult.intent) {
      case 'analisar_credito':
        this.startNewAnalysis();
        break;
      case 'simular_cenario':
        this.handleSimulation(text);
        break;
      case 'consultar_produto':
        this.showProducts();
        break;
      case 'explicar_score':
        this.explainScore();
        break;
      case 'gerar_parecer':
        this.generateReport();
        break;
      case 'conversa_casual':
        this.handleCasual(text);
        break;
      default:
        this.handleFallback(text);
    }
  }

  startNewAnalysis() {
    this.currentStep = 0;
    this.formData = {};
    this.showNextFormStep();
  }

  handleSimulation(text) {
    const analysis = store.getCurrentAnalysis();
    if (!analysis) {
      this.addMessage({ type: 'agent', content: 'Primeiro precisamos fazer uma análise. Bora começar?', timestamp: Date.now() });
      this.startNewAnalysis();
      return;
    }
    this.addMessage({ type: 'agent', content: 'Entendi. Me conta o que você quer simular: "E se eu der entrada de 20k?", "E se minha renda subir 10%?", "E se eu perder o emprego?"...', timestamp: Date.now() });
  }

  showProducts() {
    const analysis = store.getCurrentAnalysis();
    if (!analysis) {
      this.addMessage({ type: 'agent', content: 'Faz uma análise primeiro que eu te mostro o que se encaixa no seu bolso.', timestamp: Date.now() });
      return;
    }
    const eligible = analysis.products.filter(p => p.elegivel);
    if (!eligible.length) {
      this.addMessage({ type: 'agent', content: 'Olha, com seu perfil atual nenhum produto se encaixa. Mas não desanima — vamos trabalhar seu score que a conversa muda.', timestamp: Date.now() });
      return;
    }
    let msg = 'Bora ver o que cabe no seu bolso:\n\n';
    eligible.forEach(p => {
      const inst = productsEngine.calculateInstallment(p.limiteEstimado, p.taxaPersonalizada / 100, p.prazoMax || 12);
      msg += `• **${p.nome}**: ${p.taxaPersonalizada}% a.m. • Limite até R$ ${p.limiteEstimado.toLocaleString('pt-BR')} • Parcela ~R$ ${inst.parcela.toLocaleString('pt-BR')} (${p.prazoMax}x)\n`;
    });
    msg += '\nQual te interessa mais?';
    this.addMessage({ type: 'agent', content: msg, timestamp: Date.now() });
  }

  explainScore() {
    const analysis = store.getCurrentAnalysis();
    if (!analysis) {
      this.addMessage({ type: 'agent', content: 'Preciso de uma análise primeiro pra te explicar o score, combinado?', timestamp: Date.now() });
      return;
    }
    const { classification } = analysis;
    let msg = `Te explico seu score de **${classification.score}/1000 (${classification.label})**:\n\n`;
    msg += `**O que pesa a favor:**\n`;
    classification.fatoresPositivos.slice(0, 3).forEach(f => msg += `✅ ${f.label}: ${f.value} (+${f.impact} pts)\n`);
    msg += `\n**O que pesa contra:**\n`;
    classification.fatoresNegativos.slice(0, 3).forEach(f => msg += `❌ ${f.label}: ${f.value} (${f.impact} pts)\n`);
    msg += `\nResumindo: seu risco é **${classification.label}** (PD: ${classification.pd}). `;
    msg += classification.score >= 650 ? 'Tá tranquilo, aprovamos fácil.' : classification.score >= 500 ? 'Dá pra aprovar com uns ajustes.' : 'Complicado, precisa melhorar o perfil.';
    this.addMessage({ type: 'agent', content: msg, timestamp: Date.now() });
  }

  generateReport() {
    const analysis = store.getCurrentAnalysis();
    if (!analysis) {
      this.addMessage({ type: 'agent', content: 'Sem análise não tem parecer, né? Bora fazer uma primeiro.', timestamp: Date.now() });
      return;
    }
    this.addMessage({ type: 'agent', content: analysis.report, timestamp: Date.now() });
  }

  handleCasual(text) {
    const responses = [
      "Beleza! E aí, como posso te ajudar com crédito hoje?",
      "Tudo certo! Quer simular algo ou fazer uma análise?",
      "Fala! Tô aqui pra te ajudar a achar o melhor produto pro seu bolso."
    ];
    this.addMessage({ type: 'agent', content: responses[Math.floor(Math.random() * responses.length)], timestamp: Date.now() });
  }

  handleFallback(text) {
    this.addMessage({ type: 'agent', content: "Não peguei bem... Quer fazer uma análise, simular um cenário ou ver produtos? É só falar.", timestamp: Date.now() });
  }

  showTyping(show) {
    this.isTyping = show;
    const el = this.element.querySelector('#typing-indicator');
    el.style.display = show ? 'flex' : 'none';
    if (show) this.scrollToBottom();
  }

  appendAgentChunk(chunk) {
    let lastMsg = this.messages[this.messages.length - 1];
    if (!lastMsg || lastMsg.type !== 'agent_stream') {
      lastMsg = { type: 'agent_stream', content: '', timestamp: Date.now(), element: null };
      this.messages.push(lastMsg);
      this.renderMessage(lastMsg);
    }
    lastMsg.content += chunk;
    if (lastMsg.element) {
      lastMsg.element.querySelector('.message-text').textContent = lastMsg.content;
    }
    this.scrollToBottom();
  }

  finishAgentMessage(content, metadata) {
    this.messages = this.messages.filter(m => m.type !== 'agent_stream');
    this.addMessage({ type: 'agent', content, timestamp: Date.now(), metadata });
  }

  showThinking(thought) {
    const el = this.element.querySelector('#typing-indicator .typing-indicator');
    el.innerHTML = `<span>${thought}</span>`;
  }

  showToolCall(tool, args) {
    this.addMessage({ type: 'system', content: `🔧 ${tool}(${JSON.stringify(args)})`, timestamp: Date.now() });
  }

  addMessage(message) {
    message.id = message.id || crypto.randomUUID();
    this.messages.push(message);
    this.renderMessage(message);
    this.scrollToBottom();
  }

  renderMessage(message) {
    const container = this.element.querySelector('#chat-messages');
    const div = document.createElement('div');
    div.className = `message ${message.type === 'user' ? 'own' : ''} ${message.type}`;
    div.dataset.id = message.id;

    if (message.type === 'user') {
      div.innerHTML = `
        <div class="message-content">
          <div class="message-bubble">
            <div class="message-text">${this.escapeHtml(message.content)}</div>
            <div class="message-time">${this.formatTime(message.timestamp)}</div>
          </div>
        </div>
        <div class="message-avatar"><div class="avatar">${this.clientProfile?.nome?.[0] || 'V'}</div></div>
      `;
    } else if (message.type === 'agent' || message.type === 'agent_stream') {
      div.innerHTML = `
        <div class="message-avatar"><div class="avatar">R</div></div>
        <div class="message-content">
          <div class="message-bubble">
            <div class="message-text">${this.formatMessage(message.content)}</div>
            <div class="message-time">${this.formatTime(message.timestamp)}</div>
          </div>
        </div>
      `;
    } else if (message.type === 'analysis') {
      div.innerHTML = `
        <div class="message-avatar"><div class="avatar">R</div></div>
        <div class="message-content">
          <div class="message-bubble message-rich">
            <div class="message-rich-header">Análise de Crédito Concluída</div>
            <div class="message-rich-body">${this.formatMessage(message.content)}</div>
            <div class="message-rich-footer">
              <button class="btn btn-primary btn-sm" data-action="dashboard">Ver Dashboard</button>
              <button class="btn btn-secondary btn-sm" data-action="simulate">Simular Cenário</button>
            </div>
          </div>
          <div class="message-time">${this.formatTime(message.timestamp)}</div>
        </div>
      `;
      setTimeout(() => {
        div.querySelector('[data-action="dashboard"]')?.addEventListener('click', () => eventBus.emit('navigate', { route: 'dashboard' }));
        div.querySelector('[data-action="simulate"]')?.addEventListener('click', () => this.handleSimulation(''));
      }, 0);
    } else if (message.type === 'form') {
      div.innerHTML = this.renderFormStep(message);
    } else {
      div.innerHTML = `<div class="message system">${this.escapeHtml(message.content)}</div>`;
    }

    message.element = div;
    container.appendChild(div);
  }

  renderFormStep(message) {
    const fieldsHtml = message.fields.map(f => `
      <div class="input-group">
        <label class="input-label">${f.label}</label>
        ${f.type === 'range' ? `
          <input type="range" class="slider" name="${f.name}" min="${f.min}" max="${f.max}" step="${f.step}" value="${this.formData[f.name] || f.default}">
          <span class="slider-value" id="val-${f.name}">${this.formData[f.name] || f.default}</span>
        ` : f.type === 'select' ? `
          <select class="input select" name="${f.name}">
            ${f.options.map(o => `<option value="${o.value}" ${this.formData[f.name] === o.value ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
        ` : `
          <input type="number" class="input" name="${f.name}" min="${f.min}" step="${f.step}" value="${this.formData[f.name] || f.default || ''}" placeholder="${f.default || ''}">
        `}
      </div>
    `).join('');

    return `
      <div class="message-avatar"><div class="avatar">R</div></div>
      <div class="message-content">
        <div class="form-step">
          <div class="form-step-title">${this.icons.target} ${message.title} (${this.currentStep + 1}/${FORM_STEPS.length})</div>
          <div class="form-step-fields">${fieldsHtml}</div>
        </div>
      </div>
    `;
  }

  formatMessage(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  formatTime(ts) {
    return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  scrollToBottom() {
    const container = this.element.querySelector('#chat-messages');
    container.scrollTop = container.scrollHeight;
  }

  clearChat() {
    this.messages = [];
    this.currentStep = 0;
    this.formData = {};
    this.element.querySelector('#chat-messages').innerHTML = '';
    this.loadWelcomeMessage();
  }

  openSettings() {
    alert('Configurações em breve!');
  }

  handleAnalysisComplete(data) {
    this.renderQuickReplies();
  }

  destroy() {
    this.ws?.close();
    eventBus.off('analysisComplete', this.handleAnalysisComplete);
  }
}

export function createChat() {
  return new ChatComponent();
}