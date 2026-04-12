import type { KanjiGradeSourceRow } from './sourceRow';
import { sourceRowsToKanjiEntries } from './sourceRow';
import type { KanjiEntry } from './types';

/**
 * 小学1年生漢字（配当表ベース。教材都合で「天」は未収録・「金」は訓「かね」のみ）
 *
 * 各 `entries[]` は { sentence, reading } で、文中のその漢字の読みと一致する。
 * 例文に出す漢字は原則その1字だけ（他はひらがな）。熟語の一部だけ漢字にする場合は「がっ校」「がく生」のように表記する。
 *
 * - 生成: `src/generators/kanji.ts` → `GRADE_1_KANJI`
 * - 印刷: `js/data/kanjiGrade1.js` を本ファイルと同期すること
 */
export const kanjiGrade1: KanjiGradeSourceRow[] = [
  { grade: 1, kanji: '一', entries: [
    { sentence: 'すうじの 一 です。', reading: 'いち' },
    { sentence: 'これは すうじの 一 です。', reading: 'いち' },
  ]},
  { grade: 1, kanji: '右', entries: [
    { sentence: '右に まがります', reading: 'みぎ' },
    { sentence: '右の てです', reading: 'みぎ' },
  ]},
  { grade: 1, kanji: '雨', entries: [
    { sentence: '雨が ふっています', reading: 'あめ' },
    { sentence: '雨の ひです', reading: 'あめ' },
  ]},
  { grade: 1, kanji: '円', entries: [
    { sentence: 'ノートに 円を かきます', reading: 'えん' },
    { sentence: '円を かきます', reading: 'えん' },
  ]},
  { grade: 1, kanji: '王', entries: [
    { sentence: '王さまの はなしです', reading: 'おう' },
    { sentence: '王さまは やさしいです', reading: 'おう' },
  ]},
  { grade: 1, kanji: '音', entries: [
    { sentence: '音が きこえます', reading: 'おと' },
    { sentence: '音を ききます', reading: 'おと' },
  ]},
  { grade: 1, kanji: '下', entries: [
    { sentence: '下に おります', reading: 'した' },
    { sentence: '下を みます', reading: 'した' },
  ]},
  { grade: 1, kanji: '火', entries: [
    { sentence: '火に きをつけます', reading: 'ひ' },
    { sentence: '火が みえます', reading: 'ひ' },
  ]},
  { grade: 1, kanji: '花', entries: [
    { sentence: '花が さいています', reading: 'はな' },
    { sentence: 'きれいな 花です', reading: 'はな' },
  ]},
  { grade: 1, kanji: '貝', entries: [
    { sentence: '貝を ひろいました', reading: 'かい' },
    { sentence: 'きれいな 貝です', reading: 'かい' },
  ]},
  { grade: 1, kanji: '学', entries: [
    { sentence: '学びが たのしいです', reading: 'まな' },
    { sentence: '学びましょう', reading: 'まな' },
  ]},
  { grade: 1, kanji: '気', entries: [
    { sentence: '気を つけます', reading: 'き' },
    { sentence: '気が つきました', reading: 'き' },
  ]},
  { grade: 1, kanji: '九', entries: [
    { sentence: 'すうじの 九 です。', reading: 'きゅう' },
    { sentence: 'これは すうじの 九 です。', reading: 'きゅう' },
  ]},
  { grade: 1, kanji: '休', entries: [
    { sentence: '休みを とります', reading: 'やす' },
    { sentence: '休みの ひです', reading: 'やす' },
  ]},
  { grade: 1, kanji: '玉', entries: [
    { sentence: '玉を なげます', reading: 'たま' },
    { sentence: '玉が ころがります', reading: 'たま' },
  ]},
  { grade: 1, kanji: '金', entries: [
    { sentence: 'お金を つかいます', reading: 'かね' },
    { sentence: 'お金を たいせつに します', reading: 'かね' },
  ]},
  { grade: 1, kanji: '空', entries: [
    { sentence: '空が あおいです', reading: 'そら' },
    { sentence: '空を みあげます', reading: 'そら' },
  ]},
  { grade: 1, kanji: '月', entries: [
    { sentence: '月が でています', reading: 'つき' },
    { sentence: '月が きれいです', reading: 'つき' },
  ]},
  { grade: 1, kanji: '犬', entries: [
    { sentence: '犬が はしっています', reading: 'いぬ' },
    { sentence: '犬が ねています', reading: 'いぬ' },
  ]},
  { grade: 1, kanji: '見', entries: [
    { sentence: 'よく 見ます', reading: 'み' },
    { sentence: 'ちゃんと 見ます', reading: 'み' },
  ]},
  { grade: 1, kanji: '五', entries: [
    { sentence: 'すうじの 五 です。', reading: 'ご' },
    { sentence: 'これは すうじの 五 です。', reading: 'ご' },
  ]},
  { grade: 1, kanji: '口', entries: [
    { sentence: '口を あけます', reading: 'くち' },
    { sentence: '口を ゆすぎます', reading: 'くち' },
  ]},
  { grade: 1, kanji: '校', entries: [
    { sentence: 'がっ校に いきます', reading: 'こう' },
    { sentence: 'がっ校の まえです', reading: 'こう' },
  ]},
  { grade: 1, kanji: '左', entries: [
    { sentence: '左に まがります', reading: 'ひだり' },
    { sentence: '左の てです', reading: 'ひだり' },
  ]},
  { grade: 1, kanji: '三', entries: [
    { sentence: 'すうじの 三 です。', reading: 'さん' },
    { sentence: 'これは すうじの 三 です。', reading: 'さん' },
  ]},
  { grade: 1, kanji: '山', entries: [
    { sentence: 'とおくに 山が みえます', reading: 'やま' },
    { sentence: '山に のぼります', reading: 'やま' },
  ]},
  { grade: 1, kanji: '子', entries: [
    { sentence: '子どもと あそびます', reading: 'こ' },
    { sentence: '子が ねています', reading: 'こ' },
  ]},
  { grade: 1, kanji: '四', entries: [
    { sentence: 'すうじの 四 です。', reading: 'し' },
    { sentence: 'これは すうじの 四 です。', reading: 'し' },
  ]},
  { grade: 1, kanji: '糸', entries: [
    { sentence: '糸を つかいます', reading: 'いと' },
    { sentence: 'ほそい 糸です', reading: 'いと' },
  ]},
  { grade: 1, kanji: '字', entries: [
    { sentence: '字を かきます', reading: 'じ' },
    { sentence: '字が きれいです', reading: 'じ' },
  ]},
  { grade: 1, kanji: '耳', entries: [
    { sentence: '耳を すまします', reading: 'みみ' },
    { sentence: '耳が ちいさいです', reading: 'みみ' },
  ]},
  { grade: 1, kanji: '七', entries: [
    { sentence: 'すうじの 七 です。', reading: 'なな' },
    { sentence: 'これは すうじの 七 です。', reading: 'なな' },
  ]},
  { grade: 1, kanji: '車', entries: [
    { sentence: '車が とおります', reading: 'くるま' },
    { sentence: 'あかい 車です', reading: 'くるま' },
  ]},
  { grade: 1, kanji: '手', entries: [
    { sentence: '手を あらいます', reading: 'て' },
    { sentence: '手を あげて ください', reading: 'て' },
  ]},
  { grade: 1, kanji: '十', entries: [
    { sentence: 'すうじの 十 です。', reading: 'じゅう' },
    { sentence: 'これは すうじの 十 です。', reading: 'じゅう' },
  ]},
  { grade: 1, kanji: '出', entries: [
    { sentence: '出て きました', reading: 'で' },
    { sentence: '出る のを まちます', reading: 'で' },
  ]},
  { grade: 1, kanji: '女', entries: [
    { sentence: '女の こが はしっています', reading: 'おんな' },
    { sentence: 'やさしい 女の ひとです', reading: 'おんな' },
  ]},
  { grade: 1, kanji: '小', entries: [
    { sentence: '小さな ねこです', reading: 'ちい' },
    { sentence: '小さな はこです', reading: 'ちい' },
  ]},
  { grade: 1, kanji: '上', entries: [
    { sentence: '上を みます', reading: 'うえ' },
    { sentence: '上に のぼります', reading: 'うえ' },
  ]},
  { grade: 1, kanji: '森', entries: [
    { sentence: '森が しずかです', reading: 'もり' },
    { sentence: '森を みます', reading: 'もり' },
  ]},
  { grade: 1, kanji: '人', entries: [
    { sentence: '人が います', reading: 'ひと' },
    { sentence: 'やさしい 人です', reading: 'ひと' },
  ]},
  { grade: 1, kanji: '水', entries: [
    { sentence: '水を のみます', reading: 'みず' },
    { sentence: '水が きれいです', reading: 'みず' },
  ]},
  { grade: 1, kanji: '正', entries: [
    { sentence: 'これで 正しいです', reading: 'ただ' },
    { sentence: '正しい こたえです', reading: 'ただ' },
  ]},
  { grade: 1, kanji: '生', entries: [
    { sentence: 'がく生に なります', reading: 'せい' },
    { sentence: '生きています', reading: 'い' },
  ]},
  { grade: 1, kanji: '青', entries: [
    { sentence: '青い いろです', reading: 'あお' },
    { sentence: '青い リボンです', reading: 'あお' },
  ]},
  { grade: 1, kanji: '夕', entries: [
    { sentence: '夕べは ねむいです', reading: 'ゆう' },
    { sentence: '夕べに あいさつします', reading: 'ゆう' },
  ]},
  { grade: 1, kanji: '石', entries: [
    { sentence: '石を けりました', reading: 'いし' },
    { sentence: '石の うえに すわります', reading: 'いし' },
  ]},
  { grade: 1, kanji: '赤', entries: [
    { sentence: '赤い リボンです', reading: 'あか' },
    { sentence: '赤い ぼうしです', reading: 'あか' },
  ]},
  { grade: 1, kanji: '千', entries: [
    { sentence: '千の かずです', reading: 'せん' },
    { sentence: '千まで みえます', reading: 'せん' },
  ]},
  { grade: 1, kanji: '川', entries: [
    { sentence: '川で あそびます', reading: 'かわ' },
    { sentence: 'きれいな 川です', reading: 'かわ' },
  ]},
  { grade: 1, kanji: '先', entries: [
    { sentence: '先に いきます', reading: 'さき' },
    { sentence: '先を あるきます', reading: 'さき' },
  ]},
  { grade: 1, kanji: '早', entries: [
    { sentence: '早いですね', reading: 'はや' },
    { sentence: '早く きます', reading: 'はや' },
  ]},
  { grade: 1, kanji: '草', entries: [
    { sentence: '草が はえています', reading: 'くさ' },
    { sentence: '草の そばを とおります', reading: 'くさ' },
  ]},
  { grade: 1, kanji: '足', entries: [
    { sentence: '足が いたいです', reading: 'あし' },
    { sentence: '足で あるきます', reading: 'あし' },
  ]},
  { grade: 1, kanji: '村', entries: [
    { sentence: '村に いきました', reading: 'むら' },
    { sentence: '村が すきです', reading: 'むら' },
  ]},
  { grade: 1, kanji: '大', entries: [
    { sentence: '大きな ねこです', reading: 'おお' },
    { sentence: '大きな いぬです', reading: 'おお' },
  ]},
  { grade: 1, kanji: '男', entries: [
    { sentence: '男の こが はしっています', reading: 'おとこ' },
    { sentence: '男の ひとです', reading: 'おとこ' },
  ]},
  { grade: 1, kanji: '竹', entries: [
    { sentence: '竹が そだっています', reading: 'たけ' },
    { sentence: '竹の となりです', reading: 'たけ' },
  ]},
  { grade: 1, kanji: '中', entries: [
    { sentence: 'はこの 中に あります', reading: 'なか' },
    { sentence: '中を みます', reading: 'なか' },
  ]},
  { grade: 1, kanji: '虫', entries: [
    { sentence: '虫が とんでいます', reading: 'むし' },
    { sentence: '虫は ちいさいです', reading: 'むし' },
  ]},
  { grade: 1, kanji: '町', entries: [
    { sentence: '町を あるきます', reading: 'まち' },
    { sentence: 'にぎやかな 町です', reading: 'まち' },
  ]},
  { grade: 1, kanji: '田', entries: [
    { sentence: '田んぼの みちを とおります', reading: 'た' },
    { sentence: '田の そばを とおります', reading: 'た' },
  ]},
  { grade: 1, kanji: '土', entries: [
    { sentence: '土で あそびます', reading: 'つち' },
    { sentence: '土の うえを あるきます', reading: 'つち' },
  ]},
  { grade: 1, kanji: '二', entries: [
    { sentence: 'すうじの 二 です。', reading: 'に' },
    { sentence: 'これは すうじの 二 です。', reading: 'に' },
  ]},
  { grade: 1, kanji: '日', entries: [
    { sentence: '日が のぼりました', reading: 'ひ' },
    { sentence: 'きょうは いい 日です', reading: 'ひ' },
  ]},
  { grade: 1, kanji: '入', entries: [
    { sentence: '入って ください', reading: 'はい' },
    { sentence: '入る まえに よういします', reading: 'はい' },
  ]},
  { grade: 1, kanji: '年', entries: [
    { sentence: '年を とります', reading: 'とし' },
    { sentence: '年が あけました', reading: 'とし' },
  ]},
  { grade: 1, kanji: '白', entries: [
    { sentence: '白い ねこです', reading: 'しろ' },
    { sentence: '白い くもです', reading: 'しろ' },
  ]},
  { grade: 1, kanji: '八', entries: [
    { sentence: 'すうじの 八 です。', reading: 'はち' },
    { sentence: 'これは すうじの 八 です。', reading: 'はち' },
  ]},
  { grade: 1, kanji: '百', entries: [
    { sentence: '百まで かぞえます', reading: 'ひゃく' },
    { sentence: '百の かずです', reading: 'ひゃく' },
  ]},
  { grade: 1, kanji: '文', entries: [
    { sentence: '文を かきます', reading: 'ぶん' },
    { sentence: '文が よめます', reading: 'ぶん' },
  ]},
  { grade: 1, kanji: '木', entries: [
    { sentence: '木が たかいです', reading: 'き' },
    { sentence: '木の したで あそびます', reading: 'き' },
  ]},
  { grade: 1, kanji: '本', entries: [
    { sentence: '本を よみます', reading: 'ほん' },
    { sentence: '本が すきです', reading: 'ほん' },
  ]},
  { grade: 1, kanji: '名', entries: [
    { sentence: '名を かきます', reading: 'な' },
    { sentence: '名を よびます', reading: 'な' },
  ]},
  { grade: 1, kanji: '目', entries: [
    { sentence: '目を ふきます', reading: 'め' },
    { sentence: '目を みます', reading: 'め' },
  ]},
  { grade: 1, kanji: '立', entries: [
    { sentence: '立ちます', reading: 'た' },
    { sentence: '立って ください', reading: 'た' },
  ]},
  { grade: 1, kanji: '力', entries: [
    { sentence: '力を いれます', reading: 'ちから' },
    { sentence: '力が はいります', reading: 'ちから' },
  ]},
  { grade: 1, kanji: '林', entries: [
    { sentence: '林を みました', reading: 'はやし' },
    { sentence: '林の そばです', reading: 'はやし' },
  ]},
  { grade: 1, kanji: '六', entries: [
    { sentence: 'すうじの 六 です。', reading: 'ろく' },
    { sentence: 'これは すうじの 六 です。', reading: 'ろく' },
  ]},
];

/** 教材行から変換したプール（問題生成で使用） */
export const GRADE_1_KANJI: KanjiEntry[] = sourceRowsToKanjiEntries(kanjiGrade1);
