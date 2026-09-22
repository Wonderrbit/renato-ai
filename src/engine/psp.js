const MAX_FAILURES = 5;
const STORAGE_KEY = 'psp_memory';

export class PlanckProtocol {
  constructor() {
    this.failureMemory = this.loadMemory();
  }

  loadMemory() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveMemory() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.failureMemory));
    } catch (e) {
      console.warn('PSP: Failed to save memory', e);
    }
  }

  addFailure(falha, motivo, evitar) {
    const entry = { falha, motivo, evitar, timestamp: Date.now() };
    const exists = this.failureMemory.some(f => f.falha === falha && f.motivo === motivo);
    if (!exists) {
      this.failureMemory.unshift(entry);
      if (this.failureMemory.length > MAX_FAILURES) {
        this.failureMemory = this.failureMemory.slice(0, MAX_FAILURES);
      }
      this.saveMemory();
    }
  }

  getMemory() {
    return [...this.failureMemory];
  }

  clearMemory() {
    this.failureMemory = [];
    this.saveMemory();
  }

  collapseOutput(fullOutput) {
    const checklist = [
      { check: 'direct_answer', pass: this.checkDirectAnswer(fullOutput) },
      { check: 'no_reasoning_exposed', pass: this.checkNoReasoning(fullOutput) },
      { check: 'no_intermediate_versions', pass: this.checkNoIntermediate(fullOutput) },
      { check: 'no_empty_confirmations', pass: this.checkNoEmptyConfirmations(fullOutput) },
      { check: 'failure_memory_limit', pass: this.failureMemory.length <= MAX_FAILURES },
      { check: 'emv_defined', pass: this.checkEMV(fullOutput) },
      { check: 'no_hallucination', pass: this.checkNoHallucination(fullOutput) },
      { check: 'persona_consistent', pass: this.checkPersona(fullOutput) }
    ];

    const passed = checklist.filter(c => c.pass).length;
    const failed = checklist.filter(c => !c.pass);

    if (failed.length > 0) {
      this.addFailure('checklist_failed', `Checks failed: ${failed.map(f => f.check).join(', ')}`, 'Review output against PSP checklist');
    }

    return passed === checklist.length ? fullOutput : this.minimalOutput(fullOutput);
  }

  checkDirectAnswer(output) {
    return typeof output === 'string' && output.length > 10 && output.length < 5000;
  }

  checkNoReasoning(output) {
    const reasoningMarkers = ['pensando:', 'raciocínio:', 'analisando:', 'processando:', 'vou verificar', 'deixa eu ver'];
    const lower = output.toLowerCase();
    return !reasoningMarkers.some(m => lower.includes(m));
  }

  checkNoIntermediate(output) {
    return !output.includes('versão') && !output.includes('rascunho') && !output.includes('tentativa');
  }

  checkNoEmptyConfirmations(output) {
    const empty = ['ok', 'entendido', 'certo', 'beleza', 'fechado', 'combinado'];
    const trimmed = output.trim().toLowerCase();
    return !empty.includes(trimmed) || output.length > 20;
  }

  checkEMV(output) {
    return output.includes('próximo') || output.includes('próximos') || output.includes('agora') || output.length > 50;
  }

  checkNoHallucination(output) {
    const hallucinationPatterns = ['segundo a wikipedia', 'dados oficiais mostram', 'estatísticas provam', 'estudos comprovam'];
    const lower = output.toLowerCase();
    return !hallucinationPatterns.some(p => lower.includes(p));
  }

  checkPersona(output) {
    const renatoMarkers = ['bora', 'fechou', 'olha', 'perai', 'pera', 'então', 'tá', 'beleza', 'sucesso'];
    const lower = output.toLowerCase();
    return renatoMarkers.some(m => lower.includes(m)) || output.length < 100;
  }

  minimalOutput(output) {
    const sentences = output.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences.slice(0, 3).join('. ') + '.';
  }

  getMinimalState(currentStep) {
    return {
      objetivo: currentStep?.objetivo || 'Análise de crédito',
      ultimaEtapa: currentStep?.output || '',
      memoriaFalhas: this.failureMemory.slice(0, 3)
    };
  }
}

export default new PlanckProtocol();