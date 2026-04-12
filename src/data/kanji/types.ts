import type { KanjiGrade, KanjiMode } from '../../types';

export type { KanjiGrade, KanjiMode };

/**
 * 学年別漢字（教育漢字）1件
 * 例文はすべて対象漢字を1字だけ含む自然な短文（1年生向け語彙）
 */
export interface KanjiEntry {
  /** 漢字1字 */
  char: string;
  /** 代表よみ（ひらがな） */
  yomi: string;
  grade: KanjiGrade;
  /** 例文（出題時に1つをランダム選択。読み・書きで同じ文を共用可） */
  sentences: string[];
}
