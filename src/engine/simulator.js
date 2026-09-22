import { RiskClassifier } from './risk-classifier.js';

const riskClassifier = new RiskClassifier();

const STRESS_SCENARIOS = [
  {
    id: 'perda_emprego',
    nome: 'Perda de Emprego',
    descricao: 'Simula desemprego: renda cai para informal, tempo de emprego zera, comprometimento sobe',
    modifications: (base) => ({
      ...base,
      tempoEmprego: 0,
      tipoRenda: 'informal',
      comprometimentoRenda: Math.min(base.comprometimentoRenda + 20, 100)
    })
  },
  {
    id: 'aumento_juros',
    nome: 'Aumento de Juros',
    descricao: 'Simula alta de juros: comprometimento sobe 15pp',
    modifications: (base) => ({
      ...base,
      comprometimentoRenda: Math.min(base.comprometimentoRenda + 15, 100)
    })
  },
  {
    id: 'nova_inadimplencia',
    nome: 'Nova Inadimplência',
    descricao: 'Simula novos registros negativos: +2 inadimplências, score -150',
    modifications: (base) => ({
      ...base,
      historicoInadimplencia: base.historicoInadimplencia + 2,
      scoreBureau: Math.max(base.scoreBureau - 150, 0)
    })
  }
];

export class Simulator {
  simulate(baseData, modifications) {
    const modifiedData = { ...baseData, ...modifications };
    const baseResult = riskClassifier.classify(baseData);
    const modifiedResult = riskClassifier.classify(modifiedData);

    return {
      base: baseResult,
      modificado: modifiedResult,
      delta: {
        score: modifiedResult.score - baseResult.score,
        risco: modifiedResult.risco !== baseResult.risco,
        pd: modifiedResult.pd !== baseResult.pd
      }
    };
  }

  stressTest(baseData) {
    return STRESS_SCENARIOS.map(scenario => {
      const modifiedData = scenario.modifications(baseData);
      const baseResult = riskClassifier.classify(baseData);
      const modifiedResult = riskClassifier.classify(modifiedData);

      return {
        id: scenario.id,
        nome: scenario.nome,
        descricao: scenario.descricao,
        baseScore: baseResult.score,
        novoScore: modifiedResult.score,
        deltaScore: modifiedResult.score - baseResult.score,
        baseRisco: baseResult.risco,
        novoRisco: modifiedResult.risco,
        basePd: baseResult.pd,
        novoPd: modifiedResult.pd
      };
    });
  }

  compareScenarios(scenarioA, scenarioB) {
    const resultA = riskClassifier.classify(scenarioA);
    const resultB = riskClassifier.classify(scenarioB);

    const factors = Object.keys(resultA.detalhamento);
    const diff = {};

    for (const factor of factors) {
      const a = resultA.detalhamento[factor];
      const b = resultB.detalhamento[factor];
      diff[factor] = {
        cenarioA: { raw: a.raw, normalized: a.normalized },
        cenarioB: { raw: b.raw, normalized: b.normalized },
        deltaNormalized: b.normalized - a.normalized,
        deltaImpact: b.impact - a.impact
      };
    }

    return {
      cenarioA: { score: resultA.score, risco: resultA.risco, pd: resultA.pd },
      cenarioB: { score: resultB.score, risco: resultB.risco, pd: resultB.pd },
      delta: {
        score: resultB.score - resultA.score,
        riscoChanged: resultA.risco !== resultB.risco
      },
      fatores: diff
    };
  }

  getStressScenarios() {
    return STRESS_SCENARIOS;
  }
}

export default new Simulator();