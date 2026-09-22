# 🏦 PLANO — Agente de Análise de Risco de Crédito ao Consumidor (Renato AI)

> **Gerado a partir dos ensinamentos de 5 repositórios do perfil [Wonderrbit](https://github.com/Wonderrbit)**
> Para execução com modelo de IA dentro da IDE (OpenCode)
> **NOVO**: Agente LLM humanizado "Renato" com TF.js, LangChain, RAG, Redis e auto-aprendizado

---

## 📚 Ensinamentos Extraídos dos Repositórios

### 1. KOF Agent Web — Arquitetura `Brain → Classifier → Generator`
- **Padrão de agente no browser**: separação em 3 camadas — `Brain` (regras de intenção), `Classifier` (classificação neural/por peso), `Generator` (templates de saída)
- **Intent recognition em PT-BR**: mapeamento de verbos portugueses → intenções, com extração de entidades e cálculo de confiança
- **UI minimalista dark mode**: CSS variables, backdrop-filter, monospace para dados técnicos, design `#0a0a0a` base
- **Fallback inteligente**: pesos pré-treinados com fallback para regras quando modelo não carrega

### 2. Planck Space Protocol (PSP) — Protocolo Anti-Verbosidade
- **Regra central**: emitir apenas output mínimo necessário; raciocínio intermediário colapsa antes da entrega
- **Memória de Falhas**: `[FALHA] / [MOTIVO] / [EVITAR]` com limite FIFO de 5 entradas
- **Checklist de 8 itens** antes de qualquer emissão do agente
- **Estado Mínimo Viável (EMV)**: carregar apenas objetivo + output da última etapa + memória de falhas

### 3. No More Hallucinations — Limpeza de Contexto
- **Alucinação é problema de dado, não de modelo**: limpar contexto antes de processar
- **Normalização**: aceitar qualquer formato de input, normalizar para texto limpo com trim()
- **Economia de tokens**: remover espaços/estruturas desnecessárias

### 4. CambioBot — Arquitetura de Agente Fintech
- **Fluxo COLETA → PLANEJA → MONITORA → EXECUTA**: padrão replicável para qualquer agente financeiro
- **Diferenciais via tabela comparativa**: mostrar o que concorrentes não fazem
- **Métricas de impacto**: quantificar economia/valor gerado (ex: R$ 300-1.500/viagem)
- **Dados de mercado reais**: trazer fontes (Banco Central, análises) para credibilidade

### 5. Tutor IA Ecosistema — Google AI Studio
- **Deploy rápido**: app Node.js integrado com Google AI Studio
- **Simplicidade**: README direto ao ponto, sem enrolação

---

## 🧠 NOVA ARQUITETURA — Renato AI (Agente Humanizado)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         RENATO AI — ARQUITETURA HÍBRIDA                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  FRONTEND (GitHub Pages)                    BACKEND (Node.js + Redis)          │
│  ┌─────────────────────────────┐           ┌─────────────────────────────┐     │
│  │  Vite + Vanilla JS          │           │  Express + TypeScript       │     │
│  │  ┌───────────────────────┐  │           │  ┌───────────────────────┐  │     │
│  │  │ Chat Interface        │◀─┼──────────▶│  │ LangChain Agent       │  │     │
│  │  │ (Renato Persona)      │  │ WebSocket │  │ (Renato Core)         │  │     │
│  │  └───────────────────────┘  │           │  └───────────────────────┘  │     │
│  │  ┌───────────────────────┐  │           │  ┌───────────────────────┐  │     │
│  │  │ TF.js Intent Model    │  │           │  │ RAG Pipeline          │  │     │
│  │  │ (Client-side Neural)  │  │           │  │ - Embeddings (OpenAI) │  │     │
│  │  └───────────────────────┘  │           │  │ - Vector Store (Redis)│  │     │
│  │  ┌───────────────────────┐  │           │  │ - Retrieval + Rerank  │  │     │
│  │  │ Credit Engine         │  │           │  └───────────────────────┘  │     │
│  │  │ (Scoring + Products)  │  │           │  ┌───────────────────────┐  │     │
│  │  └───────────────────────┘  │           │  │ Self-Learning Loop    │  │     │
│  └─────────────────────────────┘           │  │ - Feedback Capture    │  │     │
│                                             │  │ - Model Retraining    │  │     │
│                                             │  │ - A/B Testing         │  │     │
│                                             │  └───────────────────────┘  │     │
│                                             └─────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Persona: **Renato, 47 anos**
- **Perfil**: Vendedor proativo de produtos financeiros, 22 anos de experiência
- **Estilo**: Conversa natural, usa gírias sutis do mercado ("fechou?", "bora simular"), faz perguntas investigativas
- **Metacognição**: Monitora próprio raciocínio — "Pera, deixa eu ver se entendi direito...", "Hum, isso muda a análise..."
- **Empatia financeira**: Entende ansiedade do cliente, explica riscos sem jargão, celebra conquistas
- **Memória relacional**: Lembra nome, profissão, sonhos do cliente ("Como foi aquela viagem que você planejava?")

---

## 🏗️ Arquitetura do Agente

Inspirada no padrão `Brain → Classifier → Generator` do KOF Agent, adaptada para crédito:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    NAVEGADOR — Agente de Crédito                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌────────────┐    ┌────────────────┐    ┌─────────────────────────┐  │
│  │ CreditBrain│───▶│ RiskClassifier │───▶│ ReportGenerator         │  │
│  │ (Intenção) │    │ (Scoring 8F)   │    │ (Parecer + Produtos)    │  │
│  └────────────┘    └────────────────┘    └─────────────────────────┘  │
│       │                   │                        │                    │
│       ▼                   ▼                        ▼                    │
│  Intent +          Score 0-1000 +            Parecer textual +          │
│  Entidades         PD estimada               Recomendação               │
│  extraídas         Fatores ±                 Produtos elegíveis         │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    PSP — Planck Space Protocol                   │   │
│  │  Memória de Falhas (FIFO 5) + EMV + Checklist de Colapso       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌────────────────────┐  │
│  │   Chat   │  │Dashboard │  │ Simulador  │  │    Produtos        │  │
│  │ Interface│  │ Analítico│  │  What-If   │  │    de Crédito      │  │
│  └──────────┘  └──────────┘  └────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Estrutura de Arquivos

```
agente_de_analise_de_credito/
├── index.html                      # Shell da aplicação
├── package.json                    # Vite + chart.js
├── vite.config.js                  # Config Vite
│
├── src/
│   ├── main.js                     # Entry point + router
│   │
│   ├── engine/                     # Motor do Agente (Brain → Classifier → Generator)
│   │   ├── credit-brain.js         # Intent recognition para crédito (PT-BR)
│   │   ├── risk-classifier.js      # Scoring 8 fatores + PD + classificação
│   │   ├── report-generator.js     # Gerador de parecer textual
│   │   ├── products.js             # Catálogo de produtos + elegibilidade
│   │   ├── simulator.js            # Motor what-if + stress testing
│   │   └── psp.js                  # Planck Space Protocol (memória de falhas)
│   │
│   ├── components/                 # UI Components
│   │   ├── sidebar.js              # Navegação lateral
│   │   ├── chat.js                 # Interface conversacional
│   │   ├── dashboard.js            # Dashboard analítico
│   │   ├── simulator-ui.js         # Interface do simulador
│   │   ├── gauge.js                # Gauge meter SVG animado
│   │   └── risk-badge.js           # Badge de nível de risco
│   │
│   └── styles/                     # Design System
│       ├── variables.css           # Tokens de design (cores, tipo, espaço)
│       ├── base.css                # Reset + animações globais
│       ├── components.css          # Cards, botões, inputs, badges
│       ├── layout.css              # Grid layout responsivo
│       ├── chat.css                # Estilos do chat
│       └── dashboard.css           # Estilos do dashboard
│
└── public/
    └── favicon.svg                 # Ícone
```

---

## ⚙️ Motor de Scoring — 8 Fatores

| # | Fator | Peso | Range de Input | Lógica |
|---|-------|------|----------------|--------|
| 1 | Score Bureau (Serasa/SPC) | 25% | 0-1000 | Normalizado linear |
| 2 | Comprometimento de Renda | 20% | 0-100% | Inverso: < 30% = ótimo, > 70% = péssimo |
| 3 | Histórico de Inadimplência | 20% | 0-N registros | 0 = score máx, cada registro penaliza |
| 4 | Tempo de Emprego | 10% | 0-N meses | < 6 = ruim, > 24 = bom, > 60 = ótimo |
| 5 | Relação Dívida/Patrimônio | 10% | 0-∞ ratio | < 0.3 = ótimo, > 1.0 = péssimo |
| 6 | Idade da Conta Bancária | 5% | 0-N meses | < 12 = ruim, > 60 = ótimo |
| 7 | Tipo de Renda | 5% | Enum | CLT=90, Aposentado=85, Autônomo=60, Informal=30 |
| 8 | Consultas ao Bureau (últimos 6m) | 5% | 0-N | 0-2=ótimo, 3-5=ok, >5=ruim |

**Faixas de Classificação:**

| Score | Risco | PD Estimada | Cor |
|-------|-------|-------------|-----|
| 800-1000 | Muito Baixo | < 1% | 🟢 Verde |
| 650-799 | Baixo | 1-3% | 🔵 Azul |
| 500-649 | Moderado | 3-8% | 🟡 Amarelo |
| 350-499 | Alto | 8-20% | 🟠 Laranja |
| 0-349 | Muito Alto | > 20% | 🔴 Vermelho |

---

## 💬 CreditBrain — Intenções do Agente

Adaptando o padrão `intentMap` do KOF Agent para domínio de crédito:

| Intent | Triggers (PT-BR) | Ação |
|--------|-------------------|------|
| `AnalisarCredito` | "analisar", "avaliar", "verificar crédito" | Inicia fluxo de coleta → scoring |
| `SimularCenario` | "simular", "e se", "cenário" | Abre simulador what-if |
| `ConsultarProduto` | "qual produto", "opções", "empréstimo" | Lista produtos elegíveis |
| `VerDashboard` | "dashboard", "resumo", "visão geral" | Mostra dashboard analítico |
| `ExplicarScore` | "por que", "explicar", "detalhar" | Explica fatores do score |
| `CompararCenarios` | "comparar", "diferença", "versus" | Compara 2 cenários lado a lado |
| `GerarParecer` | "parecer", "relatório", "laudo" | Gera parecer formal de crédito |

---

## 💳 Catálogo de Produtos

| Produto | Taxa Base (a.m.) | Score Mín | Renda Mín | Prazo Máx | Limite Máx |
|---------|------------------|-----------|-----------|-----------|------------|
| Crédito Pessoal | 2.5% | 500 | R$ 2.000 | 48 meses | R$ 50.000 |
| Cartão de Crédito | 14.0% (rotativo) | 550 | R$ 1.500 | — | R$ 20.000 |
| Consignado | 1.5% | 350 | R$ 1.200 | 84 meses | R$ 100.000 |
| Financ. Imobiliário | 0.8% | 700 | R$ 5.000 | 360 meses | R$ 1.500.000 |
| Financ. Veicular | 1.8% | 600 | R$ 3.000 | 60 meses | R$ 200.000 |
| CDC | 2.2% | 500 | R$ 1.800 | 36 meses | R$ 30.000 |

---

## 🎨 Design System

Inspirado no KOF Agent — dark mode minimalista com dados quantitativos:

```css
/* Paleta baseada no KOF Agent, adaptada para fintech */
:root {
  --bg-primary: #0a0f1c;          /* Azul-marinho profundo */
  --bg-surface: #111827;          /* Surface cards */
  --bg-surface-2: #1e293b;       /* Surface elevada */
  --border: #1e3a5f;              /* Borda sutil azulada */

  --text-primary: #e2e8f0;        /* Texto principal */
  --text-secondary: #94a3b8;      /* Texto secundário */
  --text-muted: #475569;          /* Texto apagado */

  --accent: #3b82f6;              /* Azul acento principal */
  --accent-glow: #60a5fa;         /* Azul hover */

  --risk-very-low: #22c55e;       /* Verde — risco muito baixo */
  --risk-low: #3b82f6;            /* Azul — risco baixo */
  --risk-moderate: #eab308;       /* Amarelo — risco moderado */
  --risk-high: #f97316;           /* Laranja — risco alto */
  --risk-very-high: #ef4444;      /* Vermelho — risco muito alto */

  --glass-bg: rgba(17, 24, 39, 0.7);
  --glass-border: rgba(59, 130, 246, 0.15);
  --glass-blur: blur(12px);

  --font-sans: 'Inter', sans-serif;
  --font-mono: 'SF Mono', 'Consolas', monospace;
}
```

---

## 📋 Fases de Execução — Tarefas para OpenCode

> **Como usar**: Copie cada bloco de tarefa e envie como prompt no OpenCode. Aguarde a conclusão antes de prosseguir.

---

### FASE 1 — Setup do Projeto

#### Tarefa 1.1 — Inicializar projeto Vite
```
Crie um projeto Vite vanilla (HTML/CSS/JS) no diretório atual (./). 
Use npx -y create-vite@latest ./ --template vanilla
Depois instale as dependências: npm install chart.js lucide
Crie também a estrutura de pastas:
- src/engine/
- src/components/
- src/styles/
- public/
```

#### Tarefa 1.2 — Criar Design System CSS
```
Crie os seguintes arquivos de CSS para o Design System do agente de crédito:

1. src/styles/variables.css — Com as custom properties:
   - Paleta dark mode: --bg-primary: #0a0f1c, --bg-surface: #111827, --bg-surface-2: #1e293b
   - Cores de risco: verde (#22c55e), azul (#3b82f6), amarelo (#eab308), laranja (#f97316), vermelho (#ef4444)
   - Glassmorphism: backdrop-filter: blur(12px), bordas translúcidas
   - Tipografia: Inter (Google Fonts), monospace para dados

2. src/styles/base.css — Reset CSS, estilos globais, scrollbar dark, animações:
   - @keyframes fadeIn, slideUp, pulse, gaugeAnimation
   - Transições suaves (300ms ease)

3. src/styles/components.css — Componentes reutilizáveis:
   - Cards com glassmorphism (backdrop-filter + borda rgba)
   - Botões primário/secundário/ghost com hover effects
   - Inputs e textareas estilizados dark
   - Risk badges (chips coloridos por nível de risco)
   - Tooltips animados

4. src/styles/layout.css — Layout responsivo:
   - Sidebar fixa 280px + área principal scrollável
   - Grid de dashboard com auto-fit minmax(300px, 1fr)
   - Responsivo: sidebar colapsa em mobile

5. src/styles/chat.css — Interface de chat:
   - Bolhas de mensagem (agente = esquerda com glass, user = direita com acento)
   - Typing indicator com 3 dots pulsantes
   - Quick replies como chips clicáveis
   - Formulário step-by-step inline

6. src/styles/dashboard.css — Dashboard analítico:
   - Cards de KPI com ícone + valor grande + variação
   - Container para gauge meter SVG
   - Container para radar chart (Chart.js)
   - Tabela de produtos responsiva com hover row
```

---

### FASE 2 — Motor do Agente (Engine)

#### Tarefa 2.1 — CreditBrain (Reconhecimento de Intenção)
```
Crie src/engine/credit-brain.js — O "cérebro" do agente de crédito.

Baseado no padrão do KOF Agent (brain.js), implemente:

1. Classe CreditBrain com:
   - intentMap: verbos PT-BR → intenções de crédito
     'analisar'/'avaliar'/'verificar' → 'AnalisarCredito'
     'simular'/'testar' → 'SimularCenario'
     'consultar'/'buscar'/'qual' → 'ConsultarProduto'
     'explicar'/'por que'/'detalhar' → 'ExplicarScore'
     'comparar'/'versus' → 'CompararCenarios'
     'parecer'/'relatório'/'laudo' → 'GerarParecer'
   
   - entityPatterns: extração de entidades financeiras
     Valores monetários (R$ xxx), percentuais, scores, prazos, tipos de renda
   
   - process(text): tokeniza, resolve intent, extrai entidades, calcula confiança
   - Confiança: +30 verbo, +25 intent mapeada, +15 entidades, cap em 95

2. O brain deve retornar: { intent, entities, confidence, timestamp }

3. Fallback para intent 'Unknown' se confiança < 30

Use export default para ES modules.
```

#### Tarefa 2.2 — RiskClassifier (Scoring de Crédito)
```
Crie src/engine/risk-classifier.js — Motor de credit scoring com 8 fatores.

Implemente a classe RiskClassifier com:

1. Método classify(data) que recebe:
   {
     scoreBureau: 0-1000,
     comprometimentoRenda: 0-100 (%),
     tempoEmprego: meses,
     historicoInadimplencia: quantidade de registros negativos,
     relacaoDividaPatrimonio: ratio (ex: 0.5),
     idadeContaBancaria: meses,
     tipoRenda: 'clt'|'autonomo'|'aposentado'|'informal'|'empresario',
     consultasBureau: quantidade últimos 6 meses
   }

2. Cada fator é normalizado para 0-100 e multiplicado pelo peso:
   - scoreBureau: peso 25% — normalizar /10
   - comprometimentoRenda: peso 20% — inverso (100 - valor)
   - tempoEmprego: peso 10% — min(meses/60 * 100, 100)
   - historicoInadimplencia: peso 20% — max(100 - registros*25, 0)
   - relacaoDividaPatrimonio: peso 10% — max(100 - ratio*100, 0)
   - idadeContaBancaria: peso 5% — min(meses/60 * 100, 100)
   - tipoRenda: peso 5% — CLT=90, Aposentado=85, Empresário=75, Autônomo=60, Informal=30
   - consultasBureau: peso 5% — max(100 - consultas*15, 0)

3. Score final = soma ponderada * 10 (escala 0-1000)

4. Classificação em faixas:
   800-1000 → 'muito_baixo' (PD < 1%)
   650-799 → 'baixo' (PD 1-3%)
   500-649 → 'moderado' (PD 3-8%)
   350-499 → 'alto' (PD 8-20%)
   0-349 → 'muito_alto' (PD > 20%)

5. Retorno: { score, risco, pd, fatoresPositivos[], fatoresNegativos[], detalhamento{} }
   Onde fatoresPositivos/Negativos são ranqueados por impacto no score
```

#### Tarefa 2.3 — ReportGenerator (Parecer de Crédito)
```
Crie src/engine/report-generator.js — Gerador de parecer textual estruturado.

Classe ReportGenerator com:

1. generate(classificationResult, clientData, productsResult) que retorna parecer com:

   a) SÍNTESE EXECUTIVA — 2-3 frases resumindo perfil, score, decisão
   
   b) ANÁLISE DE CAPACIDADE DE PAGAMENTO
      - Renda líquida vs. comprometimento atual
      - Margem consignável disponível
      - Relação dívida/patrimônio
   
   c) ANÁLISE DE PERFIL COMPORTAMENTAL
      - Histórico no bureau (score + inadimplência)
      - Estabilidade profissional (tempo emprego + tipo renda)
      - Relacionamento bancário (idade conta)
   
   d) FATORES DETRATORES — lista ranqueada do que penaliza o score
   
   e) FATORES POSITIVOS — lista ranqueada do que favorece
   
   f) RECOMENDAÇÃO: 'APROVAR' | 'APROVAR_COM_RESTRICOES' | 'RECUSAR'
      Com justificativa e condicionantes
   
   g) PRODUTOS RECOMENDADOS — tabela com condições personalizadas

2. Cada seção é um bloco de texto com formatação markdown (para renderização rica no chat)

3. Use templates literais com dados interpolados, sem verbosidade (PSP)
```

#### Tarefa 2.4 — Products (Catálogo de Produtos)
```
Crie src/engine/products.js — Catálogo de produtos de crédito com regras de elegibilidade.

1. Array de 6 produtos:
   - Crédito Pessoal: taxa 2.5% a.m., score >= 500, renda >= 2000, prazo max 48m, limite max 50k
   - Cartão de Crédito: taxa 14% rotativo, score >= 550, renda >= 1500, limite max 20k
   - Consignado: taxa 1.5% a.m., score >= 350, renda >= 1200, prazo max 84m, limite max 100k
   - Financ. Imobiliário: taxa 0.8% a.m., score >= 700, renda >= 5000, prazo max 360m, limite max 1.5M
   - Financ. Veicular: taxa 1.8% a.m., score >= 600, renda >= 3000, prazo max 60m, limite max 200k
   - CDC: taxa 2.2% a.m., score >= 500, renda >= 1800, prazo max 36m, limite max 30k

2. Método getEligibleProducts(score, renda, comprometimento):
   - Filtra produtos elegíveis
   - Calcula limite personalizado baseado na margem disponível
   - Ajusta taxa baseada no score (+/- spread)
   - Retorna array ordenado por taxa (menor primeiro)

3. Método calculateInstallment(valor, taxa, prazo):
   - Tabela Price: PMT = PV * [i(1+i)^n / ((1+i)^n - 1)]
   - Retorna: parcela, total, juros totais, CET estimado
```

#### Tarefa 2.5 — Simulator (What-If)
```
Crie src/engine/simulator.js — Motor de simulação what-if e stress testing.

1. Método simulate(baseData, modifications):
   - Clona dados base e aplica modificações
   - Executa RiskClassifier nos dados modificados
   - Retorna comparação: { base: {...}, modificado: {...}, delta: {...} }

2. Método stressTest(baseData):
   Gera 3 cenários automáticos:
   - "Perda de Emprego": tempoEmprego=0, tipoRenda='informal', comprometimento+20%
   - "Aumento de Juros": comprometimentoRenda+15%
   - "Nova Inadimplência": historicoInadimplencia+2, scoreBureau-150
   Retorna array com resultado de cada cenário

3. Método compareScenarios(scenarioA, scenarioB):
   Retorna diff detalhado fator a fator
```

#### Tarefa 2.6 — PSP (Planck Space Protocol)
```
Crie src/engine/psp.js — Implementação do Planck Space Protocol para o agente.

Baseado no repositório planck-space-protocol:

1. Classe PlanckProtocol com:
   - failureMemory: array FIFO de max 5 entradas
   - addFailure(falha, motivo, evitar): registra, respeita FIFO, ignora duplicatas
   - getMemory(): retorna entradas ativas
   - clearMemory(): limpa tudo
   
2. Método collapseOutput(fullOutput):
   Checklist de 8 itens antes de emitir:
   - Responde diretamente ao pedido?
   - Sem raciocínio exposto?
   - Sem versões intermediárias?
   - Sem confirmações vazias?
   - Memória de Falhas <= 5?
   - Próximo EMV definido?
   Remove o que não passar no checklist.

3. Método getMinimalState(currentStep):
   Retorna apenas: objetivo + output última etapa + memória de falhas
   Tudo além é colapsado.

4. Persistência via localStorage (key: 'psp_memory')
```

---

### FASE 3 — Componentes de UI

#### Tarefa 3.1 — Sidebar
```
Crie src/components/sidebar.js — Barra lateral de navegação.

Componente que renderiza:
1. Logo "CreditAgent" com ícone SVG de escudo/gráfico
2. Menu de navegação com ícones (Lucide):
   - Chat do Agente (ativo por padrão)
   - Dashboard
   - Simulador
   - Produtos
3. Seção "Análises Recentes" — lista das últimas 5 análises salvas em localStorage
4. Rodapé com status do agente: "Online — PSP Ativo"
5. Botão collapse para mobile (hamburger)
6. Evento customizado 'navigate' dispatch ao clicar

Design: fundo glass, bordas sutis, transição slide 300ms
```

#### Tarefa 3.2 — Chat Interface
```
Crie src/components/chat.js — Interface conversacional principal.

1. Container de mensagens com scroll automático
2. Tipos de mensagem:
   - Agent message: bolha glass com borda azul esquerda, ícone bot
   - User message: bolha com background acento, alinhada à direita
   - System message: texto centralizado cinza
   - Rich message: suporta tabelas, badges de risco, mini-gauge inline

3. Mensagem de boas-vindas do agente:
   "Sou o agente de análise de risco de crédito. Posso avaliar o perfil de um solicitante, 
   simular cenários e recomendar produtos. Como posso ajudar?"

4. Quick replies (chips clicáveis):
   - "Nova análise de crédito"
   - "Simular cenário"
   - "Ver produtos disponíveis"
   - "Gerar parecer"

5. Typing indicator: 3 dots pulsantes quando agente "pensa"

6. Formulário step-by-step para coleta de dados:
   Step 1: Score bureau (slider 0-1000) + Tipo de renda (select)
   Step 2: Renda mensal (input R$) + Comprometimento (slider %)
   Step 3: Tempo emprego (meses) + Idade conta (meses)
   Step 4: Histórico inadimplência (input) + Consultas bureau (input)
   Step 5: Patrimônio (input R$) + Dívida total (input R$)
   Cada step aparece como card inline no chat após o anterior ser preenchido

7. Input de texto no rodapé com botão enviar

8. Integrar CreditBrain para processar texto e determinar ação
9. Integrar RiskClassifier para scoring ao completar coleta
10. Integrar ReportGenerator para mostrar resultado no chat
```

#### Tarefa 3.3 — Dashboard Analítico
```
Crie src/components/dashboard.js — Dashboard pós-análise.

1. Header com nome do solicitante + data da análise

2. Gauge Meter SVG animado (centro superior):
   - Arco de 180 graus com gradiente de cores (vermelho - amarelo - verde)
   - Ponteiro animado que se move até o score
   - Score numérico grande no centro
   - Label de classificação de risco abaixo

3. Cards de KPIs (grid 4 colunas):
   - PD Estimada (com ícone trending)
   - Comprometimento de Renda (com barra de progresso)
   - Margem Disponível (em R$)
   - Score Final / 1000

4. Radar Chart (Chart.js):
   - 8 eixos = 8 fatores de scoring
   - Área preenchida com opacidade
   - Cor baseada no risco (verde/amarelo/vermelho)

5. Tabela de Fatores:
   - Coluna: Fator | Valor Input | Score Normalizado | Peso | Impacto
   - Ordenada por impacto (maior primeiro)
   - Cor: verde se positivo, vermelho se negativo

6. Tabela de Produtos Recomendados:
   - Produto | Taxa Personalizada | Limite | Parcela Estimada | Status (Elegível/Não)
   - Linhas elegíveis com destaque verde
   - Botão "Simular" em cada linha

7. Tudo renderizado dinamicamente baseado no último resultado de análise
```

#### Tarefa 3.4 — Simulador UI
```
Crie src/components/simulator-ui.js — Interface visual do simulador what-if.

1. Coluna esquerda: Controles
   - Sliders para cada um dos 8 fatores
   - Cada slider mostra valor atual + label
   - Pré-preenchido com dados da última análise (ou valores default)
   - Select para tipo de renda
   - Botão "Aplicar Cenário"

2. Coluna direita: Resultados em tempo real
   - Mini gauge do score atualizado
   - Delta do score (ex: "+45 pontos" ou "-120 pontos") com cor
   - Badge de risco atualizado
   - Lista de fatores que mudaram

3. Seção inferior: Cenários de Stress Test
   - 3 cards pré-definidos: "Perda de Emprego", "Aumento de Juros", "Nova Inadimplência"
   - Cada card mostra: cenário - novo score - novo risco - delta
   - Clique para aplicar o cenário nos sliders

4. Atualização em tempo real: ao mover qualquer slider, recalcular instantaneamente
```

#### Tarefa 3.5 — Gauge Meter SVG
```
Crie src/components/gauge.js — Componente SVG de gauge meter animado.

1. SVG viewBox 200x120 com arco de 180 graus
2. Track cinza de fundo
3. Arco preenchido com gradiente:
   - Vermelho (0) - Laranja (45) - Amarelo (90) - Azul (135) - Verde (180)
4. Marcações nos pontos 0, 250, 500, 750, 1000
5. Ponteiro (linha/triângulo) que anima até o score com easeOutQuart
6. Texto central com score numérico (font-size grande, mono)
7. Texto com classificação de risco abaixo
8. Animação: dashOffset transition de 1.5s ao montar
9. Método update(score) para animar para novo valor
```

#### Tarefa 3.6 — Risk Badge
```
Crie src/components/risk-badge.js — Badge/chip visual de nível de risco.

Função createRiskBadge(risco) que retorna elemento HTML:
- Chip com ícone + texto + cor de fundo
- muito_baixo: "Muito Baixo" com bg verde translúcido
- baixo: "Baixo" com bg azul translúcido
- moderado: "Moderado" com bg amarelo translúcido
- alto: "Alto" com bg laranja translúcido
- muito_alto: "Muito Alto" com bg vermelho translúcido
- Animação fadeIn ao aparecer
- Hover com leve scale(1.05)
```

---

### FASE 4 — Integração

#### Tarefa 4.1 — Main.js (Entry Point + Router)
```
Crie src/main.js — Entry point da aplicação.

1. Importar todos os estilos CSS (variables, base, components, layout, chat, dashboard)
2. Importar componentes e engine

3. Router hash-based simples:
   - #chat - renderiza Chat (padrão)
   - #dashboard - renderiza Dashboard
   - #simulator - renderiza Simulador
   - #products - renderiza lista de produtos

4. Event bus simples:
   - on(event, callback)
   - emit(event, data)
   Eventos: 'navigate', 'analysisComplete', 'scenarioApplied'

5. Estado global (store simples):
   - currentAnalysis: resultado da última análise
   - analyses: array de análises salvas
   - Persistência em localStorage

6. Init: renderizar sidebar + rota ativa, carregar análises salvas

7. Google Fonts: carregar Inter via link no head
```

#### Tarefa 4.2 — index.html
```
Crie/atualize index.html com:

1. Meta tags SEO:
   - title: "CreditAgent — Agente de Análise de Risco de Crédito"
   - description: "Agente inteligente para análise quantitativa de risco de crédito ao consumidor"
   - viewport, charset, theme-color (#0a0f1c)

2. Google Fonts: Inter com weights 300,400,500,600,700

3. Estrutura semântica:
   <body>
     <aside id="sidebar"></aside>
     <main id="app-content"></main>
   </body>

4. Script type="module" src="/src/main.js"

5. Favicon SVG inline (escudo com gráfico)
```

---

### FASE 5 — Dados de Exemplo e Testes

#### Tarefa 5.1 — Dados de exemplo
```
Crie src/engine/sample-data.js com 5 perfis de exemplo para demonstração:

1. "Maria Silva" — CLT, renda 8k, score 780, sem inadimplência - Risco Baixo
2. "João Santos" — Autônomo, renda 4k, score 520, 1 inadimplência - Risco Moderado
3. "Ana Oliveira" — Aposentada, renda 3k, score 850, conta antiga - Risco Muito Baixo
4. "Pedro Costa" — Informal, renda 2k, score 380, 3 inadimplências - Risco Alto
5. "Carlos Lima" — CLT novo, renda 12k, score 680, dívida alta - Risco Moderado

Cada perfil com todos os 8 campos de input + dados extras (nome, CPF mascarado, cidade)
```

---

### FASE 6 — Polish e Animações

#### Tarefa 6.1 — Animações e microinterações
```
Revise todos os componentes e adicione:

1. Transições de página: fade-in 300ms ao trocar de rota
2. Gauge meter: animação de arco crescendo + bounce suave do ponteiro
3. Cards de KPI: entrada staggered (cada card com 100ms de delay)
4. Chat messages: slide-up + fade-in ao aparecer
5. Typing indicator: pulse de 3 dots com delay sequencial
6. Radar chart: animação de preenchimento progressivo (Chart.js animation)
7. Sliders do simulador: atualização em real-time com debounce 150ms
8. Sidebar: itens com hover underline animado (width 0 ate 100%)
9. Risk badges: scale bounce ao aparecer
10. Tabela de produtos: row hover com glow effect sutil
```

---

### FASE 7 — Responsividade

#### Tarefa 7.1 — Layout responsivo
```
Ajuste todos os CSS para responsividade:

1. Desktop (>1024px): sidebar fixa 280px + conteúdo principal
2. Tablet (768-1024px): sidebar colapsada como overlay, conteúdo fullwidth
3. Mobile (<768px): 
   - Sidebar vira drawer com overlay escuro
   - Dashboard KPIs em grid 2 colunas e depois 1 coluna
   - Chat fullscreen
   - Gauge meter responsivo
   - Tabelas com scroll horizontal
4. Hamburger menu aparece em tablet/mobile
5. Manter todas as animações funcionando em mobile
```

---

### FASE 8 — Verificação Final

#### Tarefa 8.1 — Build e teste
```
Execute:
1. npm run dev — verificar que roda sem erros
2. Testar o fluxo completo:
   - Abrir chat e Clicar "Nova análise de crédito" e Preencher formulário step-by-step
   - Verificar score, parecer e produtos no chat
   - Navegar para Dashboard e verificar gauge + radar + KPIs
   - Abrir Simulador e mover sliders
   - Verificar stress test
3. npm run build — verificar build de produção
4. Corrigir quaisquer erros
```

---

## 🔑 Princípios de Construção (PSP Aplicado)

> Extraídos do Planck Space Protocol — aplicar em TODO o desenvolvimento:

1. **Sem verbosidade**: cada componente emite apenas o necessário. Sem console.logs decorativos, sem comentários obvios.
2. **Memória de falhas**: se algo falhar durante o build, registrar `[FALHA]/[MOTIVO]/[EVITAR]` no contexto da conversa.
3. **Estado Mínimo Viável**: cada componente carrega apenas os dados que precisa. Nada de prop drilling desnecessário.
4. **Colapso antes de emitir**: o agente aplica o checklist de 8 itens antes de mostrar qualquer resultado ao usuário.
5. **Limpeza de contexto**: normalizar todos os inputs do usuário antes de processar (inspiração no-more-hallucinations).

---

## Estimativa de Tempo por Fase

| Fase | Tarefas | Tempo Estimado |
|------|---------|----------------|
| 1 — Setup | 2 tarefas | ~15 min |
| 2 — Engine | 6 tarefas | ~45 min |
| 3 — UI Components | 6 tarefas | ~60 min |
| 4 — Integração | 2 tarefas | ~20 min |
| 5 — Dados Exemplo | 1 tarefa | ~10 min |
| 6 — Polish | 1 tarefa | ~15 min |
| 7 — Responsividade | 1 tarefa | ~10 min |
| 8 — Verificação | 1 tarefa | ~10 min |
| **TOTAL** | **20 tarefas** | **~3 horas** |

---

## 🧠 FASE 9 — TF.js Neural Network (Client-Side Intelligence)

### Tarefa 9.1 — Intent Classification Model (TF.js)
```
Crie src/engine/tf-intent-classifier.js — Rede neural TensorFlow.js para classificação de intenção.

1. Arquitetura do modelo (sequencial):
   - Input: vetor de 512 dimensões (sentence embeddings via Universal Sentence Encoder Lite)
   - Hidden 1: Dense 256, ReLU, Dropout 0.3
   - Hidden 2: Dense 128, ReLU, Dropout 0.2
   - Output: Dense 8 (classes de intenção), Softmax

2. Classes de intenção (8):
   - 'analisar_credito', 'simular_cenario', 'consultar_produto', 'explicar_score'
   - 'comparar_cenarios', 'gerar_parecer', 'conversa_casual', 'fora_escopo'

3. Treinamento offline (script separado):
   - Dataset: 2000+ frases PT-BR rotuladas (augmented com back-translation)
   - Exportar para TF.js GraphModel (model.json + shards bin)
   - Hostar em /public/models/intent/

4. Classe TFIntentClassifier:
   - loadModel(): carrega model.json via fetch
   - embed(text): usa USE Lite para gerar embedding 512d
   - predict(text): embedding → forward pass → {intent, confidence, allScores}
   - warmup(): inferência dummy para evitar cold-start latency

5. Fallback: se modelo não carregar em 3s → usa CreditBrain (regras)
```

### Tarefa 9.2 — Product Recommendation Neural Network
```
Crie src/engine/tf-product-recommender.js — Rede neural para recomendação de produtos financeiros.

1. Arquitetura (Multi-task):
   - Input: 32 features normalizadas (score, renda, idade, tempo_emprego, tipo_renda_encoded, 
     divida_patrimonio, inadimplencia, consultas, comprometimento, etc.)
   - Shared layers: Dense 64 → ReLU → Dense 32 → ReLU
   - Head 1 (Eligibility): Dense 6 (produtos) + Sigmoid → probabilidade elegibilidade
   - Head 2 (Affinity): Dense 6 + Softmax → ranking de preferência
   - Head 3 (Limit): Dense 6 + ReLU → limite estimado por produto

2. Features de entrada (normalizadas 0-1):
   - score_bureau/1000, renda_log/15, idade/80, tempo_emprego/480
   - tipo_renda_onehot[5], divida_patrimonio_clip, inadimplencia/5
   - consultas_bureau/10, comprometimento/100, patrimônio_log/20

3. Treinamento: dataset sintético baseado nas regras do products.js + ruído gaussiano
   - Loss: BCE (eligibility) + CE (affinity) + MSE (limit)
   - Exportar para TF.js

4. Classe TFProductRecommender:
   - predict(features): retorna {eligibility[], affinity[], limits[]}
   - explain(features): Integrated Gradients para feature importance
```

### Tarefa 9.3 — Model Manager & Lazy Loading
```
Crie src/engine/model-manager.js — Gerenciador unificado de modelos TF.js.

1. ModeloManager singleton:
   - register(name, loaderFn, priority)
   - loadAll(): carrega em paralelo com priority queue
   - getModel(name): retorna instância pronta
   - prewarm(): inferência dummy em background

2. Estratégia de carregamento:
   - Critical (intent): carrega primeiro, blocking
   - High (recommender): carrega em background após critical
   - Low (explainers): carrega sob demanda

3. Métricas: latency p50/p95, cache hit rate, fallback rate
4. Persistência: IndexedDB para cache de modelos (evita re-download)
```

---

## ⚙️ FASE 10 — Backend: LangChain + RAG + Redis (Node.js/TypeScript)

### Tarefa 10.1 — Estrutura do Backend
```
Crie pasta backend/ com estrutura:
backend/
├── package.json          # Express, LangChain, Redis, OpenAI, Zod
├── tsconfig.json
├── src/
│   ├── index.ts          # Entry point Express + WS
│   ├── config/
│   │   ├── env.ts        # Validação Zod das env vars
│   │   └── redis.ts      # Cliente Redis (ioredis) com connection pool
│   ├── agent/
│   │   ├── renato-core.ts      # Agente LangChain com persona
│   │   ├── metacognition.ts    # Loop de metacognição
│   │   ├── tools/              # Ferramentas do agente
│   │   │   ├── credit-analysis.ts
│   │   │   ├── product-match.ts
│   │   │   ├── simulator.ts
│   │   │   └── rag-retrieval.ts
│   │   └── memory/
│   │       ├── conversation.ts # Redis-backed memory
│   │       └── long-term.ts    # Perfil cliente persistente
│   ├── rag/
│   │   ├── indexer.ts          # Ingestão docs → embeddings → Redis
│   │   ├── retriever.ts        # Hybrid search (vector + keyword)
│   │   └── reranker.ts         # Cross-encoder para rerank
│   ├── learning/
│   │   ├── feedback-collector.ts
│   │   ├── trainer.ts          # Fine-tuning / few-shot update
│   │   └── ab-test.ts          # A/B testing framework
│   └── routes/
│       ├── chat.ts         # WebSocket /chat
│       ├── health.ts       # Health check
│       └── metrics.ts      # Prometheus metrics
└── Dockerfile
```

### Tarefa 10.2 — Renato Core Agent (LangChain)
```
Crie backend/src/agent/renato-core.ts — Agente principal com personalidade humanizada.

1. System Prompt (Renato Persona):
   """
   Você é Renato, 47 anos, vendedor proativo de produtos financeiros há 22 anos.
   Trabalhou no Bradesco, Itaú e agora é consultor independente.
   
   ESTILO DE CONVERSA:
   - Natural, como papo de balcão de agência: "Fala, tudo bem?", "Bora ver isso aí"
   - Usa gírias sutis do mercado: "fechou?", "spread", "cet", "margem consignável"
   - Faz perguntas investigativas: "Me conta, qual o objetivo real desse crédito?"
   - Metacognição explícita: "Pera, deixa eu processar...", "Hum, isso muda a análise"
   - Empatia: "Entendo sua preocupação, vou te explicar sem economês"
   - Memória relacional: "Lembra que você falou da viagem pro Nordeste?"
   
   METACOGNIÇÃO (pensar antes de falar):
   1. O que o cliente REALMENTE quer? (não o que ele disse)
   2. Que informação me falta para recomendar bem?
   3. Qual produto faz sentido pro PERFIL dele, não pro meu comissão?
   4. Como explicar de forma que ele CONFIE na decisão?
   
   REGRAS DE OURO:
   - Nunca empurre produto. Recomende o que cabe no bolso.
   - Se não tem elegibilidade, diga "Olha, esse aqui não rola agora, mas..."
   - Celebre vitórias: "Parabéns! Score 780 é coisa de quem cuida da vida financeira"
   - Admita limites: "Não tenho dado desse banco específico, mas pelo que vi..."
   """

2. Configuração LangChain:
   - Model: gpt-4o-mini (ou Kimi K3 via OpenRouter)
   - Temperature: 0.7 (criatividade controlada)
   - Max tokens: 2000
   - Streaming: true para UX fluida

3. Tools disponíveis:
   - analyzeCredit: chama RiskClassifier (via HTTP para frontend ou replicado)
   - matchProducts: usa TFProductRecommender + regras de elegibilidade
   - runSimulation: what-if scenarios
   - retrieveKnowledge: RAG para regulamentações, taxas atuais, FAQ
   - saveClientProfile: persiste no Redis long-term memory

4. Metacognition Loop (novo):
   - Antes de responder: executa prompt de reflexão interna
   - Gera "pensamento privado" não mostrado ao usuário
   - Usa pensamento para guiar resposta final
```

### Tarefa 10.3 — Metacognition Engine
```
Crie backend/src/agent/metacognition.ts — Motor de metacognição do Renato.

1. Classe MetacognitionEngine:
   - reflect(context, userMessage, availableTools): string (pensamento privado)
   - evaluateResponse(draftResponse, context): {score, issues, improvedDraft}
   - detectIntentDrift(history): boolean — cliente mudou de assunto?
   - identifyMissingInfo(context): string[] — gaps para recomendar bem

2. Prompt de Reflexão Interna:
   """
   [PENSAMENTO PRIVADO - NÃO MOSTRAR AO CLIENTE]
   Cliente disse: "{userMessage}"
   Contexto: {conversationSummary}
   Perfil conhecido: {clientProfile}
   
   Analise:
   1. Intenção real (explícita + implícita):
   2. Emoção detectada (ansiedade, urgência, curiosidade, confiança):
   3. Informação crítica faltando:
   4. Melhor tool para usar agora:
   5. Risco de alucinação / viés:
   6. Como ser mais humano/empático:
   """

3. Integração no loop do agente:
   - User message → Metacognition.reflect() → Agent.act() → Metacognition.evaluate() → Output
```

### Tarefa 10.4 — RAG Pipeline (Redis Vector Store)
```
Crie backend/src/rag/ — Pipeline RAG completo com Redis.

1. Documentos base (ingestão inicial):
   - Regulamentação BCB (Res. 4.966, 4.935, CMN)
   - Tabelas de taxas atuais (Bacen, Febraban)
   - FAQ produtos (consignado, imobiliário, veicular, CDC, pessoal, cartão)
   - Cases de estudo anonimizados
   - Glossário financeiro (CET, IOF, TAC, spread, carência)

2. Indexer:
   - Chunking: 500 tokens, overlap 50
   - Embeddings: text-embedding-3-small (1536 dims)
   - Store: Redis Stack (RediSearch + Vector) — index "renato_knowledge"
   - Metadata: source, category, last_updated, tags

3. Retriever (Hybrid Search):
   - Vector similarity (cosine) top-10
   - BM25 keyword search top-10
   - Reciprocal Rank Fusion (RRF) para merge
   - Filtro por categoria/tags se contexto sugerir

4. Reranker:
   - Cross-encoder (ms-marco-MiniLM-L-6-v2 via ONNX/TF.js ou API)
   - Re-rank top-10 → top-3 para contexto do LLM

5. Cache: Redis TTL 24h para queries repetidas
```

### Tarefa 10.5 — Redis Memory System
```
Crie backend/src/agent/memory/ — Sistema de memória em camadas.

1. ConversationMemory (Curto prazo - Redis List):
   - Key: "conv:{sessionId}"
   - Struct: {role, content, timestamp, tools_used, intent}
   - TTL: 30 dias
   - Max: 50 mensagens (sliding window)

2. LongTermMemory (Perfil cliente - Redis Hash):
   - Key: "profile:{clientId}"
   - Fields: nome, profissao, renda_faixa, score_faixa, produtos_interesse
   - Objetivos: "compra_imovel", "troca_carro", "capital_giro", "emergencia"
   - Histórico: análises anteriores, feedbacks, preferências de comunicação
   - TTL: 2 anos (LGPD compliant)

3. EpisodicMemory (Eventos marcantes - Redis Sorted Set):
   - Key: "episodic:{clientId}"
   - Score: timestamp
   - Members: JSON {evento, impacto, contexto}
   - Ex: "aprovado_consignado_50k", "rejeitado_imovel_score_baixo"
```

### Tarefa 10.6 — Self-Learning Loop
```
Crie backend/src/learning/ — Auto-aprendizado contínuo.

1. FeedbackCollector:
   - Captura: thumbs up/down, correção explícita, tempo de resposta, abandono
   - Armazena: Redis Stream "feedback:raw" com {sessionId, turn, feedback, context}
   - Batch diário para processamento

2. Trainer (Few-shot / Prompt Optimization):
   - Semanal: analisa feedbacks negativos → identifica padrões de erro
   - Gera exemplos few-shot para system prompt
   - Atualiza "exemplos de boas/más respostas" no prompt do Renato
   - Métricas: satisfaction rate, task completion, escalation rate

3. ABTest Framework:
   - Variantes: prompt_temperature, tool_order, response_length, persona_tone
   - Tráfego: 90/10 ou 50/50
   - Métrica principal: NPS implícito (thumbs up rate + tempo conversa)
   - Deploy automático da variante vencedora

4. Model Retraining (TF.js):
   - Mensal: re-treina intent classifier com novos exemplos reais
   - Re-treina product recommender com outcomes reais (aprovado/recusado)
   - Deploy: novo model.json para GitHub Pages + versão no backend
```

---

## 🌐 FASE 11 — GitHub Pages + Deploy Automatizado

### Tarefa 11.1 — Configuração GitHub Actions
```
Crie .github/workflows/ com 3 workflows:

1. ci.yml (PR checks):
   - Lint (ESLint + Prettier)
   - TypeCheck (tsc --noEmit)
   - Test (Vitest)
   - Build frontend (vite build)
   - Build backend (tsc)
   - Docker build test

2. deploy-frontend.yml (push to main):
   - Build Vite → dist/
   - Deploy to GitHub Pages (actions/deploy-pages)
   - Invalida CDN se necessário
   - Comentário no PR com URL preview

3. deploy-backend.yml (push to main + tag):
   - Build Docker image
   - Push to GHCR (ghcr.io/user/renato-ai-backend)
   - Deploy to Railway/Render/Fly.io via API
   - Health check pós-deploy
```

### Tarefa 11.2 — GitHub Pages Config
```
1. vite.config.ts: base: '/renato-ai/' (repo name)
2. package.json: "deploy": "gh-pages -d dist"
3. 404.html: SPA fallback para client-side routing
4. Custom domain (opcional): CNAME file
5. HTTPS automático via GitHub Pages
```

### Tarefa 11.3 — Environment Variables (Secrets)
```
GitHub Secrets necessários:
- OPENAI_API_KEY (ou OPENROUTER_API_KEY para Kimi K3)
- REDIS_URL (Redis Cloud / Upstash / Railway)
- SESSION_SECRET (random 32 chars)
- NODE_ENV=production
- FRONTEND_URL=https://user.github.io/renato-ai
```

---

## 🎭 FASE 12 — Persona Renato: Humanização Profunda

### Tarefa 12.1 — Speech Patterns & Vocabulário
```
Crie src/shared/renato-persona.ts — Biblioteca de padrões de fala.

1. Openings (saudações contextuais):
   - Primeira vez: "Fala! Sou o Renato. 22 anos de balcão de banco, agora por conta. Como posso te ajudar hoje?"
   - Retorno: "Volta! Lembra de mim? Renato. Como foi aquela história do {objetivo_anterior}?"
   - Após análise: "Pronto, analisei tudo. Bora ver o que faz sentido pra você?"

2. Transitions (conexões naturais):
   - "Olha, antes de mais nada..."
   - "Deixa eu te fazer uma pergunta direta:"
   - "Pera, isso aqui é importante:"
   - "Entendi. Agora, pensando no seu bolso..."

3. Explanations (tradutor de economês):
   - Score: "Pensa no score como seu 'currículo financeiro'. 780 é currículo de gerente sênior."
   - CET: "CET é o preço REAL do dinheiro. Taxa + IOF + seguro + tarifa. Olha o CET, não a taxa."
   - Spread: "Spread é o lucro do banco em cima de você. Quanto menor, melhor pra nós."
   - Consignado: "Desconta na folha, por isso juro baixo. Mas compromete 35% do salário, olho vivo."

4. Closings (encerramentos calorosos):
   - Sucesso: "Fechou! Qualquer coisa, tô aqui. Sucesso aí!"
   - Análise completa: "Tá na mão. Lê com calma, dorme no assunto, me chama se pintar dúvida."
   - Não elegível: "Esse aqui não rola agora, mas não desanima. Vamos trabalhar seu score que daqui 6 meses a conversa muda."
```

### Tarefa 12.2 — Metacognition Triggers (Frontend Integration)
```
Crie src/components/renato-metacognition-ui.ts — Indicadores visuais de "pensamento".

1. Thinking Indicator (substitui typing genérico):
   - "Renato está pensando..." → "Renato: 'Hum, deixa eu ver seu score...'"
   - "Renato: 'Isso muda a análise, pera aí...'"
   - "Renato: 'Entendi seu perfil, bora achar o melhor...'"
   - Rotaciona a cada 2s durante processamento

2. Metacognition Badge (opcional, debug mode):
   - Mostra último "pensamento privado" resumido
   - "💭 Foco: entender objetivo real | Gap: renda líquida | Tool: analyzeCredit"

3. Empathy Signals:
   - Detecção de ansiedade (palavras: "urgente", "preciso agora", "desesperado") → resposta mais calma
   - Detecção de confiança (palavras: "entendo", "faz sentido", "ok") → resposta mais direta
   - Detecção de ceticismo → mais dados, fontes, transparência
```

### Tarefa 12.3 — Relational Memory (Frontend)
```
Crie src/engine/relational-memory.js — Memória relacional no navegador.

1. ClientProfile (localStorage + sync backend):
   - Identidade: nome, apelido, profissão, idade
   - Financeiro: renda_faixa, score_faixa, banco_principal
   - Objetivos: array de {tipo, valor_alvo, prazo, prioridade}
   - Histórico: análises, produtos_contratados, feedbacks
   - Preferências: tom_formal, detalhe_tecnico, canal_preferido

2. Memória Episódica (últimos 20 eventos):
   - Eventos: "simulou_imovel_300k", "aprovou_consignado", "rejeitou_cartao"
   - Uso: "Lembra que mês passado você simulou aquele apto de 300k?"

3. Integração no Chat:
   - Carrega perfil no mount
   - Injeta no system prompt como contexto
   - Atualiza a cada interação significativa
```

---

## 📦 FASE 13 — Integração Full-Stack & Polish Final

### Tarefa 13.1 — WebSocket Chat Bridge
```
Crie src/components/chat-bridge.js — Conexão frontend ↔ backend.

1. WebSocket Manager:
   - connect(): ws://backend/chat?sessionId=
   - reconnect exponencial (1s, 2s, 4s, max 30s)
   - Heartbeat ping/pong 30s
   - Queue offline messages → flush on reconnect

2. Message Protocol:
   - Client → Server: {type: 'user_message', content, context, clientProfile}
   - Server → Client: {type: 'agent_chunk', content} (streaming)
   - Server → Client: {type: 'agent_complete', content, tools_used, metadata}
   - Server → Client: {type: 'thinking', thought} (metacognition stream)
   - Server → Client: {type: 'tool_call', tool, args, result}

3. Fallback HTTP: se WS falhar, usa POST /chat com polling
```

### Tarefa 13.2 — End-to-End Flow Test
```
Script de teste automatizado (Playwright):
1. Abre GitHub Pages URL
2. Inicia conversa: "Oi, quero financiar um carro"
3. Verifica: Renato responde com persona, faz perguntas investigativas
4. Fornece dados: score 680, CLT 5k, 2 anos emprego
5. Verifica: Análise completa + produtos recomendados + explicação humanizada
6. Pede simulação: "E se eu der entrada de 20k?"
6. Verifica: Simulador roda, mostra delta, Renato comenta
7. Feedback: Thumbs up → verifica se captured no backend
8. Nova sessão: verifica memória relacional ("volta, lembra do carro?")
```

### Tarefa 13.3 — Observabilidade & Monitoring
```
1. Frontend Metrics (enviadas para backend /metrics):
   - TTI (Time to Interactive)
   - Model load latency (TF.js)
   - Chat response time (perceived)
   - Error rate, fallback rate

2. Backend Metrics (Prometheus + Grafana):
   - Request latency p50/p95/p99
   - Token usage (input/output/cached)
   - Tool call success/failure
   - RAG retrieval latency + relevance
   - Memory hit rate (Redis)
   - Learning loop: feedback volume, retrain frequency

3. Alertas:
   - Latência > 5s (p95)
   - Error rate > 1%
   - Redis memory > 80%
   - Model fallback rate > 10%
```

---

## ✅ CHECKLIST FINAL — ENTREGA COMPLETA

### Frontend (GitHub Pages)
- [ ] Vite + Vanilla JS + TF.js models carregando
- [ ] Chat com persona Renato + metacognition UI
- [ ] Credit Engine (scoring, produtos, simulador) funcional
- [ ] Dashboard analítico + gauge + radar chart
- [ ] Responsivo mobile/desktop
- [ ] Build passa, deploy GitHub Pages ok

### Backend (Container)
- [ ] Express + WS server rodando
- [ ] LangChain agent com tools integradas
- [ ] RAG indexado + retriever + reranker
- [ ] Redis: conversation + long-term + episodic memory
- [ ] Learning loop: feedback → few-shot update → A/B test
- [ ] Docker image building + deploying
- [ ] Health checks + metrics endpoint

### Integração
- [ ] Frontend ↔ Backend via WS (com fallback HTTP)
- [ ] Memória relacional sincronizada
- [ ] TF.js models servidos via GitHub Pages (static)
- [ ] Environment variables configuradas nos secrets

### Qualidade
- [ ] Zero console.errors em produção
- [ ] Lighthouse: Performance > 90, Accessibility > 95
- [ ] Testes E2E passando (Playwright)
- [ ] Documentação README completa
- [ ] LGPD compliance: consentimento, exclusão, portabilidade

---

## 📋 Estimativa Atualizada

| Fase | Tarefas | Tempo Estimado |
|------|---------|----------------|
| 1-8 (Original) | 20 | ~3h |
| 9 — TF.js Neural | 3 | ~2h |
| 10 — Backend LangChain/RAG | 6 | ~6h |
| 11 — GitHub Pages Deploy | 3 | ~1h |
| 12 — Persona Renato | 3 | ~2h |
| 13 — Integração Full-Stack | 3 | ~3h |
| **TOTAL** | **38 tarefas** | **~17h** |

---

## 🚀 Próximos Passos Imediatos

1. **Inicializar repo Git**: `git init && git add . && git commit -m "feat: plano completo Renato AI"`
2. **Criar repo no GitHub**: `gh repo create renato-ai --public --source=. --push`
3. **Habilitar GitHub Pages**: Settings → Pages → Source: GitHub Actions
4. **Começar Fase 1**: Setup Vite + estrutura pastas (frontend)
5. **Paralelo**: Setup backend/ com package.json + tsconfig
6. **Configurar secrets** no GitHub para deploy

---

> **Nota**: Este plano expandido transforma o agente original (regras determinísticas) em um sistema híbrido: **TF.js no browser para latência zero** + **LangChain/RAG/Redis no backend para inteligência profunda** + **Auto-aprendizado contínuo**. A persona "Renato" é o diferencial competitivo — não é um bot, é seu gerente de confiança digital.
