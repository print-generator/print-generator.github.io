import type { KanjiGrade } from '../../types';
import type { KanjiEntry } from './types';

/**
 * 教材用の行データ（`kanjiGrade1.ts` / 将来の `kanjiGrade2.ts` などで共通）
 * アプリ内部の `KanjiEntry`（char / yomi）へ変換して使う。
 */
export interface KanjiGradeSourceRow {
  grade: KanjiGrade;
  kanji: string;
  reading: string;
  sentences: string[];
}

export function sourceRowToKanjiEntry(row: KanjiGradeSourceRow): KanjiEntry {
  return {
    char: row.kanji,
    yomi: row.reading,
    grade: row.grade,
    sentences: [...row.sentences],
  };
}

export function sourceRowsToKanjiEntries(rows: KanjiGradeSourceRow[]): KanjiEntry[] {
  return rows.map(sourceRowToKanjiEntry);
}
