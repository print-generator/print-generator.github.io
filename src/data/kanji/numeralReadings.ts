/**
 * 漢数字（一〜十）の読みは次の固定表のみを使う。文字列連結や「つ」の自動付与は行わない。
 *
 * - `KANJI_NUMERAL_TSU_READINGS` … 文中が「漢数字＋（空白可）つ」のとき（例：七つ → ななつ）
 * - `KANJI_NUMERAL_SUUJI_READINGS` … 「すうじの ◯ です。」など、漢数字のあとに「つ」が続かないとき（例：七 → なな）
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

/** 「すうじの ◯ です。」系で用いる読み（数として示す文脈。七は「なな」に統一） */
export const KANJI_NUMERAL_SUUJI_READINGS: Record<string, string> = {
  一: 'いち',
  二: 'に',
  三: 'さん',
  四: 'し',
  五: 'ご',
  六: 'ろく',
  七: 'なな',
  八: 'はち',
  九: 'きゅう',
  十: 'じゅう',
};

const NUMERAL_CHARS = '一二三四五六七八九十';

function isNumeralKanji(char: string): boolean {
  return NUMERAL_CHARS.includes(char);
}

/**
 * 漢数字の読みを返す。漢数字以外は dataReading のまま。
 * dataReading は参照のみ（数値の正答には使わず、固定表だけを返す）。
 */
export function resolveKanjiContextReading(char: string, sentence: string, _dataReading: string): string {
  if (!isNumeralKanji(char)) return _dataReading;
  const idx = sentence.indexOf(char);
  if (idx === -1) return _dataReading;
  const after = sentence.slice(idx + char.length);
  if (/^\s*つ/.test(after)) {
    return KANJI_NUMERAL_TSU_READINGS[char] ?? _dataReading;
  }
  return KANJI_NUMERAL_SUUJI_READINGS[char] ?? _dataReading;
}
