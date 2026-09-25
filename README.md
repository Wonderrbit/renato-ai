# Renato AI — Agente de Crédito Humanizado

> **Renato**, 47 anos, 22 anos de experiência em crédito bancário. Seu gerente digital que conversa como gente, analisa com precisão e recomenda o que cabe no seu bolso.

 Visão Geral

Renato AI é um agente de análise de risco de crédito ao consumidor que combina:

- **Frontend** (GitHub Pages): Vite + Vanilla JS + TensorFlow.js para classificação de intenção client-side
- **Backend** (Node.js/TypeScript): LangChain + RAG + Redis para inteligência profunda e memória persistente
- **Persona Humanizada**: "Renato" usa metacognição, empatia financeira e memória relacional
- **Auto-aprendizado**: Feedback loop contínuo com A/B testing e retreinamento de modelos

 Funcionalidades

 Chat com Renato
- Conversa natural em PT-BR: "Fala! Sou o Renato...", "Bora ver isso aí", "Fechou?"
- Metacognição visível: "Pera, deixa eu processar...", "Hum, isso muda a análise"
- Memória relacional: "Lembra daquela viagem que você planejava?"
- Formulário step-by-step para coleta de dados

 Dashboard Analítico
- Gauge meter SVG animado (0-1000)
- Radar chart dos 8 fatores de scoring (Chart.js)
- KPIs: PD estimada, comprometimento, margem disponível, score
- Tabela de fatores com impactos positivos/negativos
- Produtos recomendados com taxas e limites personalizados

 Simulador What-If
- Sliders em tempo real para todos os 8 fatores
- Delta de score instantâneo
- Stress test: Perda de emprego, Aumento de juros, Nova inadimplência
- Comparação de cenários lado a lado

 Credit Engine (8 Fatores)
| Fator | Peso | Lógica |
|-------|------|--------|
| Score Bureau | 25% | Normalizado linear 0-1000 |
| Comprometimento Renda | 20% | Inverso (<30% = ótimo) |
| Histórico Inadimplência | 20% | 0 = máx, cada registro -25 |
| Tempo Emprego | 10% | <6m = ruim, >60m = ótimo |
| Dívida/Patrimônio | 10% | <0.3 = ótimo, >1.0 = péssimo |
| Idade Conta | 5% | <12m = ruim, >60m = ótimo |
| Tipo Renda | 5% | CLT=90, Aposentado=85, Autônomo=60, Informal=30 |
| Consultas Bureau | 5% | 0-2=ótimo, 3-5=ok, >5=ruim |

 Produtos de Crédito
- Crédito Pessoal (2.5% a.m., score ≥500)
- Cartão de Crédito (14% rotativo, score ≥550)
- Consignado (1.5% a.m., score ≥350)
- Financiamento Imobiliário (0.8% a.m., score ≥700)
- Financiamento Veicular (1.8% a.m., score ≥600)
- CDC (2.2% a.m., score ≥500)

 Quick Start

```bash
# Clone e instale
git clone https://github.com/seu-usuario/renato-ai.git
cd renato-ai
npm install

# Desenvolvimento
npm run dev

# Build produção
npm run build

# Deploy GitHub Pages
npm run deploy
```

 Arquitetura

```
renato-ai/
├── src/
│   ├── engine/           # Motor de crédito (Brain → Classifier → Generator)
│   │   ├── credit-brain.js       # Intent recognition PT-BR
│   │   ├── risk-classifier.js    # Scoring 8 fatores
│   │   ├── report-generator.js   # Parecer textual
│   │   ├── products.js           # Catálogo + elegibilidade
│   │   ├── simulator.js          # What-if + stress test
│   │   ├── psp.js                # Planck Space Protocol
│   │   └── tf-*.js               # TF.js models (Fase 9)
│   ├── components/       # UI Components
│   │   ├── chat.js               # Interface conversacional
│   │   ├── dashboard.js          # Dashboard analítico
│   │   ├── simulator-ui.js       # Simulador visual
│   │   ├── sidebar.js            # Navegação
│   │   ├── gauge.js              # Gauge SVG animado
│   │   └── risk-badge.js         # Risk badges
│   ├── styles/           # Design System (CSS Variables)
│   └── utils/            # Helpers, Store, EventBus
├── backend/              # Node.js + LangChain (Fase 10)
│   ├── agent/renato-core.ts      # Agente com persona
│   ├── agent/metacognition.ts    # Loop metacognitivo
│   ├── rag/                      # RAG Pipeline (Redis Vector)
│   ├── memory/                   # Memória em camadas
│   └── learning/                 # Auto-aprendizado
├── .github/workflows/    # CI/CD
└── public/               # Assets estáticos
```

##  Persona: Renato

```
"Fala! Sou o Renato, 22 anos de balcão de banco, agora por conta.
Como posso te ajudar hoje?"

Estilo:
- Natural, papo de balcão: "Bora ver", "Fechou?", "Olha só"
- Gírias do mercado: "spread", "CET", "margem consignável"
- Perguntas investigativas: "Qual o objetivo REAL desse crédito?"
- Metacognição: "Pera, deixa eu pensar...", "Isso muda a análise"
- Empatia: "Entendo sua preocupação, vou explicar sem economês"
- Memória: "Lembra que você falou da viagem pro Nordeste?"
```

## 🔧 Configuração

### Variáveis de Ambiente (Backend)
```env
OPENAI_API_KEY=sk-...          # Ou OPENROUTER_API_KEY para Kimi K3
REDIS_URL=redis://...          # Upstash / Railway / Redis Cloud
SESSION_SECRET=random-32-chars
NODE_ENV=production
FRONTEND_URL=https://user.github.io/renato-ai
```

### GitHub Secrets (para deploy)
- `OPENAI_API_KEY` / `OPENROUTER_API_KEY`
- `REDIS_URL`
- `SESSION_SECRET`
- `WS_URL` (WebSocket backend URL)

 Deploy

### Frontend (GitHub Pages)
1. Habilite GitHub Pages nas settings do repo
2. Source: GitHub Actions
3. Push na main → deploy automático

### Backend (Railway/Render/Fly.io)
```bash
cd backend
docker build -t renato-ai-backend .
# Deploy na plataforma de escolha
```

## Testes

```bash
# E2E com Playwright
npm run test:e2e

# Lint
npm run lint

# Type check
npm run typecheck
```

##  Documentação

- [Plano Completo](plano.md) — Arquitetura, fases, tarefas detalhadas
- [API Backend](backend/README.md) — Endpoints, WebSocket, ferramentas
- [TF.js Models](src/engine/tf-*.js) — Modelos neurais client-side

##  Contribuindo

1. Fork o projeto
2. Crie branch: `git checkout -b feat/nova-funcionalidade`
3. Commit: `git commit -m 'feat: descrição'`
4. Push: `git push origin feat/nova-funcionalidade`
5. Abra Pull Request

##  Licença

MIT — Veja [LICENSE](LICENSE) para detalhes.

---

**Desenvolvido com**  **e**  **para democratizar crédito justo e transparente.**

> *"Crédito não é favor, é ferramenta. Usada com inteligência, realiza sonhos."* — Renato
