/**
 * 小学2年生漢字（印刷エンジン用サンプル）
 * src/data/kanji/kanjiGrade2.ts と同期すること。
 */
(function (g) {
  g.KANJI_GRADE_2_READING = [
    { char: '引', grade: 2, entries: [
      { sentence: '線を 引きます', reading: 'ひ' },
      { sentence: 'ドアを 引いて あけます', reading: 'ひ' },
    ]},
    { char: '羽', grade: 2, entries: [
      { sentence: '鳥の 羽です', reading: 'はね' },
      { sentence: '白い 羽が あります', reading: 'はね' },
    ]},
    { char: '雲', grade: 2, entries: [
      { sentence: '雲が 出ています', reading: 'くも' },
      { sentence: '空に 雲が あります', reading: 'くも' },
    ]},
    { char: '遠', grade: 2, entries: [
      { sentence: '遠くの 山が 見えます', reading: 'とお' },
      { sentence: '遠い 道を あるきます', reading: 'とお' },
    ]},
    { char: '何', grade: 2, entries: [
      { sentence: '何を 食べますか', reading: 'なに' },
      { sentence: '何いろが すきですか', reading: 'なに' },
    ]},
    { char: '科', grade: 2, entries: [
      { sentence: '理科の 時間です', reading: 'か' },
      { sentence: '教科書を よみます', reading: 'か' },
    ]},
    { char: '歌', grade: 2, entries: [
      { sentence: '歌を うたいます', reading: 'うた' },
      { sentence: '歌が すきです', reading: 'うた' },
    ]},
    { char: '画', grade: 2, entries: [
      { sentence: '映画を みました', reading: 'が' },
      { sentence: '画用紙を つかいます', reading: 'が' },
    ]},
    { char: '会', grade: 2, entries: [
      { sentence: '友だちに 会いました', reading: 'あ' },
      { sentence: 'また 会おうね', reading: 'あ' },
    ]},
    { char: '海', grade: 2, entries: [
      { sentence: '海で およぎます', reading: 'うみ' },
      { sentence: '海が ひかっています', reading: 'うみ' },
    ]},
    { char: '絵', grade: 2, entries: [
      { sentence: '絵を かきます', reading: 'え' },
      { sentence: '絵を 見せます', reading: 'え' },
    ]},
    { char: '活', grade: 2, entries: [
      { sentence: '生活を ととのえます', reading: 'かつ' },
      { sentence: '生活は たいせつです', reading: 'かつ' },
    ]},
    { char: '汽', grade: 2, entries: [
      { sentence: '汽車が はしります', reading: 'き' },
      { sentence: '汽てきが なりました', reading: 'き' },
    ]},
    { char: '計', grade: 2, entries: [
      { sentence: '計画を たてます', reading: 'けい' },
      { sentence: '計画どおりに します', reading: 'けい' },
    ]},
    { char: '元', grade: 2, entries: [
      { sentence: '元気に あそびます', reading: 'もと' },
      { sentence: '元気な 声です', reading: 'もと' },
    ]},
    { char: '語', grade: 2, entries: [
      { sentence: '国語を よみます', reading: 'ご' },
      { sentence: '語いを ふやします', reading: 'ご' },
    ]},
    { char: '工', grade: 2, entries: [
      { sentence: '工作を します', reading: 'く' },
      { sentence: '工ふうして つくります', reading: 'く' },
    ]},
    { char: '公', grade: 2, entries: [
      { sentence: '公園で あそびます', reading: 'こう' },
      { sentence: '公園へ いきます', reading: 'こう' },
    ]},
    { char: '広', grade: 2, entries: [
      { sentence: '広い へやです', reading: 'ひろ' },
      { sentence: 'へやを 広く つかいます', reading: 'ひろ' },
    ]},
    { char: '考', grade: 2, entries: [
      { sentence: '答えを 考えます', reading: 'かんが' },
      { sentence: 'よく 考えて みます', reading: 'かんが' },
    ]},
    { char: '行', grade: 2, entries: [
      { sentence: '前へ 行きます', reading: 'い' },
      { sentence: '学校へ 行きます', reading: 'い' },
    ]},
    { char: '高', grade: 2, entries: [
      { sentence: '高い 木です', reading: 'たか' },
      { sentence: '高く とびます', reading: 'たか' },
    ]},
    { char: '黄', grade: 2, entries: [
      { sentence: '黄色の かさです', reading: 'き' },
      { sentence: '黄色い 花が さきます', reading: 'き' },
    ]},
    { char: '黒', grade: 2, entries: [
      { sentence: '黒い ねこです', reading: 'くろ' },
      { sentence: '黒い ぼうしです', reading: 'くろ' },
    ]},
    { char: '今', grade: 2, entries: [
      { sentence: '今から はじめます', reading: 'いま' },
      { sentence: '今は 休み時間です', reading: 'いま' },
    ]},
    { char: '才', grade: 2, entries: [
      { sentence: 'わたしは 6才です', reading: 'さい' },
      { sentence: 'いもうとは 7才です', reading: 'さい' },
    ]},
    { char: '細', grade: 2, entries: [
      { sentence: '細い 道です', reading: 'ほそ' },
      { sentence: '細く きって ください', reading: 'ほそ' },
    ]},
    { char: '作', grade: 2, entries: [
      { sentence: '作ぶんを かきます', reading: 'さく' },
      { sentence: '作った ものを みせます', reading: 'さく' },
    ]},
  ];

  g.KANJI_GRADE_2_WRITING = g.KANJI_GRADE_2_READING;
  g.KANJI_GRADE_CATALOG = g.KANJI_GRADE_CATALOG || {};
  g.KANJI_GRADE_CATALOG[2] = {
    reading: g.KANJI_GRADE_2_READING,
    writing: g.KANJI_GRADE_2_WRITING,
  };
})(typeof window !== 'undefined' ? window : globalThis);
