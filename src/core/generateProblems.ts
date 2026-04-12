import { normalizeGenerateOptions, validatePlan } from '../config/planRules';
import { runCoreGenerator } from '../generators';
import type { AppGenre, GenerateOptions, Problem } from '../types';

/**
 * 共通入口：プラン検証 → ジャンル別生成 → Problem[]
 * （プリントHTMLは buildPrintHtml が担当）
 */
export function generateProblems(options: GenerateOptions): Problem[] {
  const normalized = normalizeGenerateOptions(options);
  validatePlan(normalized);
  return runCoreGenerator(normalized.genre as AppGenre, normalized);
}
