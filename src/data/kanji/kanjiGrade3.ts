import type { KanjiGradeSourceRow } from './sourceRow';
import { sourceRowsToKanjiEntries } from './sourceRow';
import type { KanjiEntry } from './types';

/**
 * 小学3年生漢字（サンプル）
 * - 例文は原則、対象漢字1字のみを漢字表記（他はひらがな）
 * - reading / writing は現時点では同一プールを使用
 */
export const kanjiGrade3SampleRows: KanjiGradeSourceRow[] = [
  { grade: 3, kanji: '安', entries: [
    { sentence: '安い ほんです', reading: 'やす' },
    { sentence: 'ねだんが 安いです', reading: 'やす' },
  ]},
  { grade: 3, kanji: '暗', entries: [
    { sentence: '暗い みちです', reading: 'くら' },
    { sentence: 'へやが 暗いです', reading: 'くら' },
  ]},
  { grade: 3, kanji: '医', entries: [
    { sentence: '医しゃに みてもらいます', reading: 'い' },
    { sentence: '医いんへ いきます', reading: 'い' },
  ]},
  { grade: 3, kanji: '委', entries: [
    { sentence: '委いんを きめます', reading: 'い' },
    { sentence: '委いんかいに でます', reading: 'い' },
  ]},
  { grade: 3, kanji: '育', entries: [
    { sentence: 'やさいを 育てます', reading: 'そだ' },
    { sentence: 'はやく 育って います', reading: 'そだ' },
  ]},
  { grade: 3, kanji: '員', entries: [
    { sentence: 'かかり員に ききます', reading: 'いん' },
    { sentence: 'いいんかいの 員です', reading: 'いん' },
  ]},
  { grade: 3, kanji: '院', entries: [
    { sentence: 'びょう院へ いきます', reading: 'いん' },
    { sentence: 'この 院で みてもらいます', reading: 'いん' },
  ]},
  { grade: 3, kanji: '飲', entries: [
    { sentence: 'みずを 飲みます', reading: 'の' },
    { sentence: 'くすりを 飲みます', reading: 'の' },
  ]},
  { grade: 3, kanji: '運', entries: [
    { sentence: 'にもつを 運びます', reading: 'はこ' },
    { sentence: 'いすを 運びます', reading: 'はこ' },
  ]},
  { grade: 3, kanji: '泳', entries: [
    { sentence: 'うみで 泳ぎます', reading: 'およ' },
    { sentence: 'プールで 泳ぎます', reading: 'およ' },
  ]},
  { grade: 3, kanji: '駅', entries: [
    { sentence: '駅で まちます', reading: 'えき' },
    { sentence: '駅まで あるきます', reading: 'えき' },
  ]},
  { grade: 3, kanji: '温', entries: [
    { sentence: '温かい スープです', reading: 'あたた' },
    { sentence: 'みずが 温かいです', reading: 'あたた' },
  ]},
];

const GRADE_3_KANJI_BASE: KanjiEntry[] = sourceRowsToKanjiEntries(kanjiGrade3SampleRows);

export const GRADE_3_KANJI_READING: KanjiEntry[] = GRADE_3_KANJI_BASE;
export const GRADE_3_KANJI_WRITING: KanjiEntry[] = GRADE_3_KANJI_BASE;
