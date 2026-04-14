/**
 * 小学3年生漢字（印刷エンジン用サンプル）
 * src/data/kanji/kanjiGrade3.ts と同期すること。
 */
(function (g) {
  g.KANJI_GRADE_3_READING = [
    { char: '安', grade: 3, entries: [
      { sentence: '安い 本です', reading: 'やす' },
      { sentence: 'この 店は 安いです', reading: 'やす' },
    ]},
    { char: '暗', grade: 3, entries: [
      { sentence: '暗い 道です', reading: 'くら' },
      { sentence: 'へやが 暗いです', reading: 'くら' },
    ]},
    { char: '医', grade: 3, entries: [
      { sentence: 'お医者さんに みてもらいます', reading: 'い' },
      { sentence: 'お医者さんに ききます', reading: 'い' },
    ]},
    { char: '委', grade: 3, entries: [
      { sentence: '委員会活動を します', reading: 'い' },
      { sentence: '委員会で はなします', reading: 'い' },
    ]},
    { char: '育', grade: 3, entries: [
      { sentence: 'はなを 育てます', reading: 'そだ' },
      { sentence: 'やさいを 育てます', reading: 'そだ' },
    ]},
    { char: '員', grade: 3, entries: [
      { sentence: '係員です', reading: 'いん' },
      { sentence: '係員に しつもんします', reading: 'いん' },
    ]},
    { char: '院', grade: 3, entries: [
      { sentence: 'びょう院へ いきます', reading: 'いん' },
      { sentence: 'びょう院で みてもらいます', reading: 'いん' },
    ]},
    { char: '飲', grade: 3, entries: [
      { sentence: 'みずを 飲みます', reading: 'の' },
      { sentence: '牛乳を 飲みます', reading: 'の' },
    ]},
    { char: '運', grade: 3, entries: [
      { sentence: '荷物を 運びます', reading: 'はこ' },
      { sentence: 'はこを 運びます', reading: 'はこ' },
    ]},
    { char: '泳', grade: 3, entries: [
      { sentence: 'うみで 泳ぎます', reading: 'およ' },
      { sentence: 'かわで 泳ぎます', reading: 'およ' },
    ]},
    { char: '駅', grade: 3, entries: [
      { sentence: '駅で 電車を 待ちます', reading: 'えき' },
      { sentence: '駅まで 歩きます', reading: 'えき' },
    ]},
    { char: '温', grade: 3, entries: [
      { sentence: '温かい スープです', reading: 'あたた' },
      { sentence: '温かい お湯です', reading: 'あたた' },
    ]},
  ];

  g.KANJI_GRADE_3_WRITING = g.KANJI_GRADE_3_READING;
  g.KANJI_GRADE_CATALOG = g.KANJI_GRADE_CATALOG || {};
  g.KANJI_GRADE_CATALOG[3] = {
    reading: g.KANJI_GRADE_3_READING,
    writing: g.KANJI_GRADE_3_WRITING,
  };
})(typeof window !== 'undefined' ? window : globalThis);
