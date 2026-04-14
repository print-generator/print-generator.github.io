/**
 * 小学2年生漢字（印刷エンジン用サンプル）
 * src/data/kanji/kanjiGrade2.ts と同期すること。
 */
(function (g) {
  g.KANJI_GRADE_2_READING = [
    { char: '引', grade: 2, entries: [
      { sentence: 'せんを 引きます', reading: 'ひ' },
      { sentence: 'ドアを 引いて あけます', reading: 'ひ' },
    ]},
    { char: '羽', grade: 2, entries: [
      { sentence: 'はとに 羽が あります', reading: 'はね' },
      { sentence: '羽を ひろいました', reading: 'はね' },
    ]},
    { char: '雲', grade: 2, entries: [
      { sentence: '雲が ゆっくり うごきます', reading: 'くも' },
      { sentence: '雲が おおい ひです', reading: 'くも' },
    ]},
    { char: '遠', grade: 2, entries: [
      { sentence: '遠くの うみが みえます', reading: 'とお' },
      { sentence: '遠い みちを あるきます', reading: 'とお' },
    ]},
    { char: '何', grade: 2, entries: [
      { sentence: '何を たべますか', reading: 'なに' },
      { sentence: '何いろが すきですか', reading: 'なに' },
    ]},
    { char: '科', grade: 2, entries: [
      { sentence: 'り科の じかんです', reading: 'か' },
      { sentence: 'きょう科しょを よみます', reading: 'か' },
    ]},
    { char: '歌', grade: 2, entries: [
      { sentence: '歌を うたいます', reading: 'うた' },
      { sentence: '歌が すきです', reading: 'うた' },
    ]},
    { char: '画', grade: 2, entries: [
      { sentence: 'えい画を みました', reading: 'が' },
      { sentence: 'まん画を よみます', reading: 'が' },
    ]},
    { char: '会', grade: 2, entries: [
      { sentence: 'ともだちに 会いました', reading: 'あ' },
      { sentence: 'また 会おうね', reading: 'あ' },
    ]},
    { char: '海', grade: 2, entries: [
      { sentence: '海で およぎます', reading: 'うみ' },
      { sentence: '海が きらきら しています', reading: 'うみ' },
    ]},
    { char: '絵', grade: 2, entries: [
      { sentence: '絵を かきます', reading: 'え' },
      { sentence: 'きれいな 絵です', reading: 'え' },
    ]},
    { char: '活', grade: 2, entries: [
      { sentence: '活どうを します', reading: 'かつ' },
      { sentence: '活やくしました', reading: 'かつ' },
    ]},
    { char: '汽', grade: 2, entries: [
      { sentence: '汽しゃが はしります', reading: 'き' },
      { sentence: '汽てきが なりました', reading: 'き' },
    ]},
    { char: '計', grade: 2, entries: [
      { sentence: '計かくを たてます', reading: 'けい' },
      { sentence: '計さんが はやいです', reading: 'けい' },
    ]},
    { char: '元', grade: 2, entries: [
      { sentence: '元から あそびます', reading: 'げん' },
      { sentence: '元の ばしょに もどります', reading: 'げん' },
    ]},
    { char: '語', grade: 2, entries: [
      { sentence: 'えい語を よみます', reading: 'ご' },
      { sentence: '語くを ふやします', reading: 'ご' },
    ]},
    { char: '工', grade: 2, entries: [
      { sentence: '工ふうして つくります', reading: 'く' },
      { sentence: 'くふう工さくを します', reading: 'く' },
    ]},
    { char: '公', grade: 2, entries: [
      { sentence: '公えんで あそびます', reading: 'こう' },
      { sentence: '公えんへ いきます', reading: 'こう' },
    ]},
    { char: '広', grade: 2, entries: [
      { sentence: '広い へやです', reading: 'ひろ' },
      { sentence: '広く つかいます', reading: 'ひろ' },
    ]},
    { char: '考', grade: 2, entries: [
      { sentence: 'こたえを 考えます', reading: 'かんが' },
      { sentence: 'よく 考えて みます', reading: 'かんが' },
    ]},
    { char: '行', grade: 2, entries: [
      { sentence: 'まえへ 行きます', reading: 'い' },
      { sentence: 'いっしょに 行こう', reading: 'い' },
    ]},
    { char: '高', grade: 2, entries: [
      { sentence: '高い きです', reading: 'たか' },
      { sentence: '高く とびます', reading: 'たか' },
    ]},
    { char: '黄', grade: 2, entries: [
      { sentence: '黄いろの かさです', reading: 'き' },
      { sentence: '黄いろい はなが さきます', reading: 'き' },
    ]},
    { char: '黒', grade: 2, entries: [
      { sentence: '黒い ねこです', reading: 'くろ' },
      { sentence: '黒い ぼうしです', reading: 'くろ' },
    ]},
    { char: '今', grade: 2, entries: [
      { sentence: '今から はじめます', reading: 'いま' },
      { sentence: '今は やすみじかんです', reading: 'いま' },
    ]},
    { char: '才', grade: 2, entries: [
      { sentence: 'なな才です', reading: 'さい' },
      { sentence: 'はち才に なりました', reading: 'さい' },
    ]},
    { char: '細', grade: 2, entries: [
      { sentence: '細い みちです', reading: 'ほそ' },
      { sentence: '細く きって ください', reading: 'ほそ' },
    ]},
    { char: '作', grade: 2, entries: [
      { sentence: '作ぶんを かきます', reading: 'さく' },
      { sentence: '作ひんを みせます', reading: 'さく' },
    ]},
  ];

  g.KANJI_GRADE_2_WRITING = g.KANJI_GRADE_2_READING;
  g.KANJI_GRADE_CATALOG = g.KANJI_GRADE_CATALOG || {};
  g.KANJI_GRADE_CATALOG[2] = {
    reading: g.KANJI_GRADE_2_READING,
    writing: g.KANJI_GRADE_2_WRITING,
  };
})(typeof window !== 'undefined' ? window : globalThis);
