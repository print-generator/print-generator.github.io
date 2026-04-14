import type { KanjiGrade, KanjiMode } from '../../types';

export type { KanjiGrade, KanjiMode };

/**
 * 1文ごとの「文中での正しい読み」（単独の音訓と一致させる）
 */
export interface KanjiSentenceEntry {
  sentence: string;
  reading: string;
}

/**
 * 学年別漢字（教育漢字）1字分
 * 例文は対象漢字が1文に1字だけ現れ、reading はその文脈での読み
 */
export interface KanjiEntry {
  char: string;
  grade: KanjiGrade;
  entries: KanjiSentenceEntry[];
}

/** 学年ごとの用途別プール（読み／書き） */
export interface KanjiGradeModePool {
  reading: KanjiEntry[];
  writing: KanjiEntry[];
}

/** 1〜6年の学年別カタログ */
export type KanjiGradeCatalog = Partial<Record<KanjiGrade, KanjiGradeModePool>>;
