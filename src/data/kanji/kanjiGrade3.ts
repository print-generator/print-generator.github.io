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
    { sentence: '安い 本です', reading: 'やす' },
    { sentence: 'この 店は 安いです', reading: 'やす' },
  ]},
  { grade: 3, kanji: '暗', entries: [
    { sentence: '暗い 道です', reading: 'くら' },
    { sentence: 'へやが 暗いです', reading: 'くら' },
  ]},
  { grade: 3, kanji: '医', entries: [
    { sentence: 'お医者さんに みてもらいます', reading: 'い' },
    { sentence: 'お医者さんに ききます', reading: 'い' },
  ]},
  { grade: 3, kanji: '委', entries: [
    { sentence: '委員会活動を します', reading: 'い' },
    { sentence: '委員会で はなします', reading: 'い' },
  ]},
  { grade: 3, kanji: '育', entries: [
    { sentence: 'はなを 育てます', reading: 'そだ' },
    { sentence: 'やさいを 育てます', reading: 'そだ' },
  ]},
  { grade: 3, kanji: '員', entries: [
    { sentence: '係員です', reading: 'いん' },
    { sentence: '係員に しつもんします', reading: 'いん' },
  ]},
  { grade: 3, kanji: '院', entries: [
    { sentence: 'びょう院へ いきます', reading: 'いん' },
    { sentence: 'びょう院で みてもらいます', reading: 'いん' },
  ]},
  { grade: 3, kanji: '飲', entries: [
    { sentence: 'みずを 飲みます', reading: 'の' },
    { sentence: '牛乳を 飲みます', reading: 'の' },
  ]},
  { grade: 3, kanji: '運', entries: [
    { sentence: '荷物を 運びます', reading: 'はこ' },
    { sentence: 'はこを 運びます', reading: 'はこ' },
  ]},
  { grade: 3, kanji: '泳', entries: [
    { sentence: 'うみで 泳ぎます', reading: 'およ' },
    { sentence: 'かわで 泳ぎます', reading: 'およ' },
  ]},
  { grade: 3, kanji: '駅', entries: [
    { sentence: '駅で 電車を 待ちます', reading: 'えき' },
    { sentence: '駅まで 歩きます', reading: 'えき' },
  ]},
  { grade: 3, kanji: '温', entries: [
    { sentence: '温かい スープです', reading: 'あたた' },
    { sentence: '温かい お湯です', reading: 'あたた' },
  ]},
];

const GRADE_3_KANJI_BASE: KanjiEntry[] = sourceRowsToKanjiEntries(kanjiGrade3SampleRows);

export const GRADE_3_KANJI_READING: KanjiEntry[] = GRADE_3_KANJI_BASE;
export const GRADE_3_KANJI_WRITING: KanjiEntry[] = GRADE_3_KANJI_BASE;
