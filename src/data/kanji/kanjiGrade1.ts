import type { KanjiGradeSourceRow } from './sourceRow';
import { sourceRowsToKanjiEntries } from './sourceRow';
import type { KanjiEntry } from './types';

/**
 * 小学1年生漢字（教材データ・ソース・オブ・トゥルース）
 *
 * - 読み／書き・初級／中級／上級の生成は `src/generators/kanji.ts` が
 *   `GRADE_1_KANJI`（本データの変換結果）を参照する。
 * - ブラウザ印刷は `js/data/kanjiGrade1.js` を手元で同期すること（コメント参照）。
 */
export const kanjiGrade1: KanjiGradeSourceRow[] = [
  {
    grade: 1,
    kanji: '日',
    reading: 'ひ',
    sentences: ['きょうはいい日です', '日がのぼりました'],
  },
  {
    grade: 1,
    kanji: '月',
    reading: 'つき',
    sentences: ['よるに月が見えます', '月がきれいです'],
  },
  {
    grade: 1,
    kanji: '火',
    reading: 'ひ',
    sentences: ['火をつけます', '火に気をつけましょう'],
  },
  {
    grade: 1,
    kanji: '水',
    reading: 'みず',
    sentences: ['水をのみます', 'つめたい水です'],
  },
  {
    grade: 1,
    kanji: '木',
    reading: 'き',
    sentences: ['こうえんに大きな木があります', '木の下であそびます'],
  },
  {
    grade: 1,
    kanji: '金',
    reading: 'かね',
    sentences: ['金をたいせつにします', 'お金をつかいます'],
  },
  {
    grade: 1,
    kanji: '土',
    reading: 'つち',
    sentences: ['土をほります', '土であそびます'],
  },
  {
    grade: 1,
    kanji: '人',
    reading: 'ひと',
    sentences: ['たくさんの人がいます', '人にあいさつします'],
  },
  {
    grade: 1,
    kanji: '山',
    reading: 'やま',
    sentences: ['山にのぼります', '大きな山です'],
  },
  {
    grade: 1,
    kanji: '川',
    reading: 'かわ',
    sentences: ['川であそびます', 'きれいな川です'],
  },
  {
    grade: 1,
    kanji: '空',
    reading: 'そら',
    sentences: ['空を見あげます', '青い空です'],
  },
  {
    grade: 1,
    kanji: '雨',
    reading: 'あめ',
    sentences: ['雨がふっています', '雨の日です'],
  },
  {
    grade: 1,
    kanji: '上',
    reading: 'うえ',
    sentences: ['つくえの上にあります', '上を見ます'],
  },
  {
    grade: 1,
    kanji: '下',
    reading: 'した',
    sentences: ['つくえの下にあります', '下を見ます'],
  },
  {
    grade: 1,
    kanji: '中',
    reading: 'なか',
    sentences: ['はこの中にあります', 'なかを見ます'],
  },
  {
    grade: 1,
    kanji: '大',
    reading: 'おお',
    sentences: ['大きないぬです', '大きな木があります'],
  },
  {
    grade: 1,
    kanji: '小',
    reading: 'ちい',
    sentences: ['小さなねこです', '小さなはこです'],
  },
  {
    grade: 1,
    kanji: '学',
    reading: 'がく',
    sentences: ['学校に行きます', 'がくしゅうをします'],
  },
  {
    grade: 1,
    kanji: '校',
    reading: 'こう',
    sentences: ['学校であそびます', '校ていに出ます'],
  },
  {
    grade: 1,
    kanji: '生',
    reading: 'せい',
    sentences: ['1年生です', '生きものを見ます'],
  },
];

/** `kanjiGrade1` を `KanjiEntry[]` に変換したもの（生成器はこれを参照） */
export const GRADE_1_KANJI: KanjiEntry[] = sourceRowsToKanjiEntries(kanjiGrade1);
