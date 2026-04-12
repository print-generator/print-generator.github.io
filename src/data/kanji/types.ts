import type { KanjiGrade, KanjiMode } from '../../types';

export type { KanjiGrade, KanjiMode };

/**
 * 学年別漢字（教育漢字）1件
 * 2〜6年は同じ形で data/kanji/grade2.ts … を追加
 */
export interface KanjiEntry {
  /** 漢字1字 */
  char: string;
  /** 代表よみ（ひらがな） */
  yomi: string;
  grade: KanjiGrade;
}
