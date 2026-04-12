import type { KanjiGrade } from '../../types';
import type { KanjiEntry, KanjiSentenceEntry } from './types';

/**
 * 教材ファイル（kanjiGrade1.ts 等）の1字分。将来2〜6年も同形で追加。
 */
export interface KanjiGradeSourceRow {
  grade: KanjiGrade;
  kanji: string;
  entries: KanjiSentenceEntry[];
}

export function sourceRowToKanjiEntry(row: KanjiGradeSourceRow): KanjiEntry {
  return {
    char: row.kanji,
    grade: row.grade,
    entries: row.entries.map((e) => ({ sentence: e.sentence, reading: e.reading })),
  };
}

export function sourceRowsToKanjiEntries(rows: KanjiGradeSourceRow[]): KanjiEntry[] {
  return rows.map(sourceRowToKanjiEntry);
}
