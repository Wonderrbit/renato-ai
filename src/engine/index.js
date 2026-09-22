export { CreditBrain } from './credit-brain.js';
export { RiskClassifier } from './risk-classifier.js';
export { ReportGenerator } from './report-generator.js';
export { ProductsEngine } from './products.js';
export { Simulator } from './simulator.js';
export { PlanckProtocol } from './psp.js';
export { SAMPLE_PROFILES, getRandomProfile, getProfileById } from './sample-data.js';

import { CreditBrain } from './credit-brain.js';
import { RiskClassifier } from './risk-classifier.js';
import { ReportGenerator } from './report-generator.js';
import { ProductsEngine } from './products.js';
import { Simulator } from './simulator.js';
import { PlanckProtocol } from './psp.js';

export const creditBrain = new CreditBrain();
export const riskClassifier = new RiskClassifier();
export const reportGenerator = new ReportGenerator();
export const productsEngine = new ProductsEngine();
export const simulator = new Simulator();
export const psp = new PlanckProtocol();