import type { KanjiGrade, KanjiMode } from '../../types';
import type { KanjiEntry, KanjiGradeCatalog } from './types';
import { GRADE_1_KANJI } from './kanjiGrade1';
import { GRADE_2_KANJI_READING, GRADE_2_KANJI_WRITING } from './kanjiGrade2';

/**
 * 漢字データの学年別カタログ。
 * 各学年で reading / writing を分離できる構造にしている。
 */
export const KANJI_GRADE_CATALOG: KanjiGradeCatalog = {
  1: {
    reading: GRADE_1_KANJI,
    writing: GRADE_1_KANJI,
  },
  2: { reading: GRADE_2_KANJI_READING, writing: GRADE_2_KANJI_WRITING },
  // 3: { reading: GRADE_3_KANJI_READING, writing: GRADE_3_KANJI_WRITING },
  // 4: { reading: GRADE_4_KANJI_READING, writing: GRADE_4_KANJI_WRITING },
  // 5: { reading: GRADE_5_KANJI_READING, writing: GRADE_5_KANJI_WRITING },
  // 6: { reading: GRADE_6_KANJI_READING, writing: GRADE_6_KANJI_WRITING },
};

export function getKanjiPoolByMode(grade: KanjiGrade, mode: KanjiMode): KanjiEntry[] {
  const byGrade = KANJI_GRADE_CATALOG[grade];
  if (!byGrade) return [];
  return mode === 'writing' ? byGrade.writing : byGrade.reading;
}

/**
 * 互換用（従来API）：学年の読み・書き双方をまとめたプール。
 */
export function getKanjiPool(grade: KanjiGrade): KanjiEntry[] {
  const byGrade = KANJI_GRADE_CATALOG[grade];
  if (!byGrade) return [];
  if (byGrade.reading === byGrade.writing) return byGrade.reading;
  return [...byGrade.reading, ...byGrade.writing];
}
