/**
 * ブラウザグローバル PlanCore（IIFE バンドル）
 * 依存: js/data.js → js/generator.js（PrintGenerator）の後に読み込む
 */
export { generateProblems } from './core/generateProblems';
export { buildPrintHtml } from './core/buildPrintHtml';
export { genreConfig, getGenreDefinition } from './config/genreConfig';
export {
  validatePlan,
  validateGenerationGate,
  resolveQuestionCount,
  normalizeGenerateOptions,
  FREE_GENERATION_LIMIT,
  PRO_QUESTION_COUNT_OPTIONS,
  PlanRuleError,
} from './config/planRules';
export { default as generators } from './generators';
