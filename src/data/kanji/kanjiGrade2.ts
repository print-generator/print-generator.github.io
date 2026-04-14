import type { KanjiGradeSourceRow } from './sourceRow';
import { sourceRowsToKanjiEntries } from './sourceRow';
import type { KanjiEntry } from './types';

/**
 * 小学2年生漢字（サンプル）
 * - 例文は原則、対象漢字1字のみを漢字表記（他はひらがな）
 * - reading / writing は現時点では同一プールを使用
 */
export const kanjiGrade2SampleRows: KanjiGradeSourceRow[] = [
  { grade: 2, kanji: '引', entries: [
    { sentence: 'くじを 引きます', reading: 'ひ' },
    { sentence: 'てを 引いて ください', reading: 'ひ' },
  ]},
  { grade: 2, kanji: '羽', entries: [
    { sentence: 'とりの 羽です', reading: 'はね' },
    { sentence: 'しろい 羽が あります', reading: 'はね' },
  ]},
  { grade: 2, kanji: '雲', entries: [
    { sentence: '雲が でています', reading: 'くも' },
    { sentence: 'しろい 雲です', reading: 'くも' },
  ]},
  { grade: 2, kanji: '遠', entries: [
    { sentence: '遠くを みます', reading: 'とお' },
    { sentence: '遠い ばしょです', reading: 'とお' },
  ]},
  { grade: 2, kanji: '何', entries: [
    { sentence: '何を たべますか', reading: 'なに' },
    { sentence: '何を しますか', reading: 'なに' },
  ]},
  { grade: 2, kanji: '科', entries: [
    { sentence: 'りかは 科の なまえです', reading: 'か' },
    { sentence: 'この 科を べんきょうします', reading: 'か' },
  ]},
  { grade: 2, kanji: '歌', entries: [
    { sentence: '歌を うたいます', reading: 'うた' },
    { sentence: 'たのしい 歌です', reading: 'うた' },
  ]},
  { grade: 2, kanji: '画', entries: [
    { sentence: '画ようしに えを かきます', reading: 'が' },
    { sentence: 'この 画は きれいです', reading: 'が' },
  ]},
];

const GRADE_2_KANJI_BASE: KanjiEntry[] = sourceRowsToKanjiEntries(kanjiGrade2SampleRows);

export const GRADE_2_KANJI_READING: KanjiEntry[] = GRADE_2_KANJI_BASE;
export const GRADE_2_KANJI_WRITING: KanjiEntry[] = GRADE_2_KANJI_BASE;
