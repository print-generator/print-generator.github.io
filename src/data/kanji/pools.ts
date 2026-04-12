import type { KanjiGrade } from '../../types';
import type { KanjiEntry } from './types';
import { GRADE_1_KANJI } from './kanjiGrade1';
// 2年生追加時: import { GRADE_2_KANJI } from './kanjiGrade2';

/**
 * 学年ごとの漢字プール。`kanjiGradeN.ts` を追加したらここに登録する。
 */
const KANJI_POOL_BY_GRADE: Partial<Record<KanjiGrade, KanjiEntry[]>> = {
  1: GRADE_1_KANJI,
  // 2: GRADE_2_KANJI,
};

export function getKanjiPool(grade: KanjiGrade): KanjiEntry[] {
  return KANJI_POOL_BY_GRADE[grade] ?? [];
}
