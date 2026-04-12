/**
 * 漢数字が「◯つ」と続くときの読み（固定表）。データの reading と二重管理を避け、
 * ここを唯一の参照元にする。`つ` を後ろから連結する処理は行わない。
 */
export const KANJI_NUMERAL_TSU_READINGS: Record<string, string> = {
  一: 'ひとつ',
  二: 'ふたつ',
  三: 'みっつ',
  四: 'よっつ',
  五: 'いつつ',
  六: 'むっつ',
  七: 'ななつ',
  八: 'やっつ',
  九: 'ここのつ',
  十: 'とお',
};

/** 文中が「漢数字＋（空白可）つ」なら固定表の読みを返す。それ以外はデータの reading のまま。 */
export function resolveKanjiContextReading(char: string, sentence: string, dataReading: string): string {
  const fixed = KANJI_NUMERAL_TSU_READINGS[char];
  if (!fixed) return dataReading;
  const idx = sentence.indexOf(char);
  if (idx === -1) return dataReading;
  const after = sentence.slice(idx + char.length);
  return /^\s*つ/.test(after) ? fixed : dataReading;
}
