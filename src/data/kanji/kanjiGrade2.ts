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
    { sentence: '線を 引きます', reading: 'ひ' },
    { sentence: 'ドアを 引いて あけます', reading: 'ひ' },
  ]},
  { grade: 2, kanji: '羽', entries: [
    { sentence: '鳥の 羽です', reading: 'はね' },
    { sentence: '白い 羽が あります', reading: 'はね' },
  ]},
  { grade: 2, kanji: '雲', entries: [
    { sentence: '雲が 出ています', reading: 'くも' },
    { sentence: '空に 雲が あります', reading: 'くも' },
  ]},
  { grade: 2, kanji: '遠', entries: [
    { sentence: '遠くの 山が 見えます', reading: 'とお' },
    { sentence: '遠い 道を あるきます', reading: 'とお' },
  ]},
  { grade: 2, kanji: '何', entries: [
    { sentence: '何を 食べますか', reading: 'なに' },
    { sentence: '何いろが すきですか', reading: 'なに' },
  ]},
  { grade: 2, kanji: '科', entries: [
    { sentence: '理科の 時間です', reading: 'か' },
    { sentence: '教科書を よみます', reading: 'か' },
  ]},
  { grade: 2, kanji: '歌', entries: [
    { sentence: '歌を うたいます', reading: 'うた' },
    { sentence: '歌が すきです', reading: 'うた' },
  ]},
  { grade: 2, kanji: '画', entries: [
    { sentence: '映画を みました', reading: 'が' },
    { sentence: '画用紙を つかいます', reading: 'が' },
  ]},
  { grade: 2, kanji: '会', entries: [
    { sentence: '友だちに 会いました', reading: 'あ' },
    { sentence: 'また 会おうね', reading: 'あ' },
  ]},
  { grade: 2, kanji: '海', entries: [
    { sentence: '海で およぎます', reading: 'うみ' },
    { sentence: '海が ひかっています', reading: 'うみ' },
  ]},
  { grade: 2, kanji: '絵', entries: [
    { sentence: '絵を かきます', reading: 'え' },
    { sentence: '絵を 見せます', reading: 'え' },
  ]},
  { grade: 2, kanji: '活', entries: [
    { sentence: '生活を ととのえます', reading: 'かつ' },
    { sentence: '生活は たいせつです', reading: 'かつ' },
  ]},
  { grade: 2, kanji: '汽', entries: [
    { sentence: '汽車が はしります', reading: 'き' },
    { sentence: '汽てきが なりました', reading: 'き' },
  ]},
  { grade: 2, kanji: '計', entries: [
    { sentence: '計画を たてます', reading: 'けい' },
    { sentence: '計画どおりに します', reading: 'けい' },
  ]},
  { grade: 2, kanji: '元', entries: [
    { sentence: '元気に あそびます', reading: 'もと' },
    { sentence: '元気な 声です', reading: 'もと' },
  ]},
  { grade: 2, kanji: '語', entries: [
    { sentence: '国語を よみます', reading: 'ご' },
    { sentence: '語いを ふやします', reading: 'ご' },
  ]},
  { grade: 2, kanji: '工', entries: [
    { sentence: '工作を します', reading: 'く' },
    { sentence: '工ふうして つくります', reading: 'く' },
  ]},
  { grade: 2, kanji: '公', entries: [
    { sentence: '公園で あそびます', reading: 'こう' },
    { sentence: '公園へ いきます', reading: 'こう' },
  ]},
  { grade: 2, kanji: '広', entries: [
    { sentence: '広い へやです', reading: 'ひろ' },
    { sentence: 'へやを 広く つかいます', reading: 'ひろ' },
  ]},
  { grade: 2, kanji: '考', entries: [
    { sentence: '答えを 考えます', reading: 'かんが' },
    { sentence: 'よく 考えて みます', reading: 'かんが' },
  ]},
  { grade: 2, kanji: '行', entries: [
    { sentence: '前へ 行きます', reading: 'い' },
    { sentence: '学校へ 行きます', reading: 'い' },
  ]},
  { grade: 2, kanji: '高', entries: [
    { sentence: '高い 木です', reading: 'たか' },
    { sentence: '高く とびます', reading: 'たか' },
  ]},
  { grade: 2, kanji: '黄', entries: [
    { sentence: '黄色の かさです', reading: 'き' },
    { sentence: '黄色い 花が さきます', reading: 'き' },
  ]},
  { grade: 2, kanji: '黒', entries: [
    { sentence: '黒い ねこです', reading: 'くろ' },
    { sentence: '黒い ぼうしです', reading: 'くろ' },
  ]},
  { grade: 2, kanji: '今', entries: [
    { sentence: '今から はじめます', reading: 'いま' },
    { sentence: '今は 休み時間です', reading: 'いま' },
  ]},
  { grade: 2, kanji: '才', entries: [
    { sentence: 'わたしは 6才です', reading: 'さい' },
    { sentence: 'いもうとは 7才です', reading: 'さい' },
  ]},
  { grade: 2, kanji: '細', entries: [
    { sentence: '細い 道です', reading: 'ほそ' },
    { sentence: '細く きって ください', reading: 'ほそ' },
  ]},
  { grade: 2, kanji: '作', entries: [
    { sentence: '作ぶんを かきます', reading: 'さく' },
    { sentence: '作った ものを みせます', reading: 'さく' },
  ]},
];

const GRADE_2_KANJI_BASE: KanjiEntry[] = sourceRowsToKanjiEntries(kanjiGrade2SampleRows);

export const GRADE_2_KANJI_READING: KanjiEntry[] = GRADE_2_KANJI_BASE;
export const GRADE_2_KANJI_WRITING: KanjiEntry[] = GRADE_2_KANJI_BASE;
