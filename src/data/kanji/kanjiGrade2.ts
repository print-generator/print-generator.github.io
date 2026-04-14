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
    { sentence: 'せんを 引きます', reading: 'ひ' },
    { sentence: 'ドアを 引いて あけます', reading: 'ひ' },
  ]},
  { grade: 2, kanji: '羽', entries: [
    { sentence: 'はとに 羽が あります', reading: 'はね' },
    { sentence: '羽を ひろいました', reading: 'はね' },
  ]},
  { grade: 2, kanji: '雲', entries: [
    { sentence: '雲が ゆっくり うごきます', reading: 'くも' },
    { sentence: '雲が おおい ひです', reading: 'くも' },
  ]},
  { grade: 2, kanji: '遠', entries: [
    { sentence: '遠くの うみが みえます', reading: 'とお' },
    { sentence: '遠い みちを あるきます', reading: 'とお' },
  ]},
  { grade: 2, kanji: '何', entries: [
    { sentence: '何を たべますか', reading: 'なに' },
    { sentence: '何いろが すきですか', reading: 'なに' },
  ]},
  { grade: 2, kanji: '科', entries: [
    { sentence: 'り科の じかんです', reading: 'か' },
    { sentence: 'きょう科しょを よみます', reading: 'か' },
  ]},
  { grade: 2, kanji: '歌', entries: [
    { sentence: '歌を うたいます', reading: 'うた' },
    { sentence: '歌が すきです', reading: 'うた' },
  ]},
  { grade: 2, kanji: '画', entries: [
    { sentence: 'えい画を みました', reading: 'が' },
    { sentence: 'まん画を よみます', reading: 'が' },
  ]},
  { grade: 2, kanji: '会', entries: [
    { sentence: 'ともだちに 会いました', reading: 'あ' },
    { sentence: 'また 会おうね', reading: 'あ' },
  ]},
  { grade: 2, kanji: '海', entries: [
    { sentence: '海で およぎます', reading: 'うみ' },
    { sentence: '海が ひかっています', reading: 'うみ' },
  ]},
  { grade: 2, kanji: '絵', entries: [
    { sentence: '絵を かきます', reading: 'え' },
    { sentence: 'きれいな 絵です', reading: 'え' },
  ]},
  { grade: 2, kanji: '活', entries: [
    { sentence: '活どうを します', reading: 'かつ' },
    { sentence: '活どうの じかんです', reading: 'かつ' },
  ]},
  { grade: 2, kanji: '汽', entries: [
    { sentence: '汽しゃが はしります', reading: 'き' },
    { sentence: '汽てきが なりました', reading: 'き' },
  ]},
  { grade: 2, kanji: '計', entries: [
    { sentence: '計さんを します', reading: 'けい' },
    { sentence: '計さんが とくいです', reading: 'けい' },
  ]},
  { grade: 2, kanji: '元', entries: [
    { sentence: '元どおりに ならべます', reading: 'もと' },
    { sentence: '元の ばしょへ もどります', reading: 'もと' },
  ]},
  { grade: 2, kanji: '語', entries: [
    { sentence: 'えい語を べんきょうします', reading: 'ご' },
    { sentence: '語いを ふやします', reading: 'ご' },
  ]},
  { grade: 2, kanji: '工', entries: [
    { sentence: '工ふうして あそびます', reading: 'く' },
    { sentence: '工ふうして かんがえます', reading: 'く' },
  ]},
  { grade: 2, kanji: '公', entries: [
    { sentence: '公えんで あそびます', reading: 'こう' },
    { sentence: '公えんへ いきます', reading: 'こう' },
  ]},
  { grade: 2, kanji: '広', entries: [
    { sentence: '広い へやです', reading: 'ひろ' },
    { sentence: 'へやを 広く つかいます', reading: 'ひろ' },
  ]},
  { grade: 2, kanji: '考', entries: [
    { sentence: 'こたえを 考えます', reading: 'かんが' },
    { sentence: 'よく 考えて みます', reading: 'かんが' },
  ]},
  { grade: 2, kanji: '行', entries: [
    { sentence: 'まえへ 行きます', reading: 'い' },
    { sentence: 'いっしょに 行こう', reading: 'い' },
  ]},
  { grade: 2, kanji: '高', entries: [
    { sentence: '高い きです', reading: 'たか' },
    { sentence: '高く とびます', reading: 'たか' },
  ]},
  { grade: 2, kanji: '黄', entries: [
    { sentence: '黄いろの かさです', reading: 'き' },
    { sentence: '黄いろい はなが さきます', reading: 'き' },
  ]},
  { grade: 2, kanji: '黒', entries: [
    { sentence: '黒い ねこです', reading: 'くろ' },
    { sentence: '黒い ぼうしです', reading: 'くろ' },
  ]},
  { grade: 2, kanji: '今', entries: [
    { sentence: '今から はじめます', reading: 'いま' },
    { sentence: '今は やすみじかんです', reading: 'いま' },
  ]},
  { grade: 2, kanji: '才', entries: [
    { sentence: 'わたしは ろく才です', reading: 'さい' },
    { sentence: 'いもうとは なな才です', reading: 'さい' },
  ]},
  { grade: 2, kanji: '細', entries: [
    { sentence: '細い みちです', reading: 'ほそ' },
    { sentence: '細く きって ください', reading: 'ほそ' },
  ]},
  { grade: 2, kanji: '作', entries: [
    { sentence: '作ぶんを かきます', reading: 'さく' },
    { sentence: '作ひんを みせます', reading: 'さく' },
  ]},
];

const GRADE_2_KANJI_BASE: KanjiEntry[] = sourceRowsToKanjiEntries(kanjiGrade2SampleRows);

export const GRADE_2_KANJI_READING: KanjiEntry[] = GRADE_2_KANJI_BASE;
export const GRADE_2_KANJI_WRITING: KanjiEntry[] = GRADE_2_KANJI_BASE;
