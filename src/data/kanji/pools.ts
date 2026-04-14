import type { KanjiGrade, KanjiMode } from '../../types';
import type { KanjiEntry } from './types';
import { getKanjiPool as getKanjiPoolFromCatalog, getKanjiPoolByMode as getKanjiPoolByModeFromCatalog } from './gradeCatalog';

/**
 * 学年×用途（読み／書き）に対応したプール取得。
 */
export function getKanjiPoolByMode(grade: KanjiGrade, mode: KanjiMode): KanjiEntry[] {
  return getKanjiPoolByModeFromCatalog(grade, mode);
}

/**
 * 互換API（従来の呼び出し口）。
 */
export function getKanjiPool(grade: KanjiGrade): KanjiEntry[] {
  return getKanjiPoolFromCatalog(grade);
}
