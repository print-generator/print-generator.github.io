/**
 * 小学3年生漢字（印刷エンジン用サンプル）
 * src/data/kanji/kanjiGrade3.ts と同期すること。
 */
(function (g) {
  g.KANJI_GRADE_3_READING = [
    { char: '安', grade: 3, entries: [
      { sentence: '安い ほんです', reading: 'やす' },
      { sentence: 'ねだんが 安いです', reading: 'やす' },
    ]},
    { char: '暗', grade: 3, entries: [
      { sentence: '暗い みちです', reading: 'くら' },
      { sentence: 'へやが 暗いです', reading: 'くら' },
    ]},
    { char: '医', grade: 3, entries: [
      { sentence: '医しゃに みてもらいます', reading: 'い' },
      { sentence: '医いんへ いきます', reading: 'い' },
    ]},
    { char: '委', grade: 3, entries: [
      { sentence: '委いんを きめます', reading: 'い' },
      { sentence: '委いんかいに でます', reading: 'い' },
    ]},
    { char: '育', grade: 3, entries: [
      { sentence: 'やさいを 育てます', reading: 'そだ' },
      { sentence: 'はやく 育って います', reading: 'そだ' },
    ]},
    { char: '員', grade: 3, entries: [
      { sentence: 'かかり員に ききます', reading: 'いん' },
      { sentence: 'いいんかいの 員です', reading: 'いん' },
    ]},
    { char: '院', grade: 3, entries: [
      { sentence: 'びょう院へ いきます', reading: 'いん' },
      { sentence: 'この 院で みてもらいます', reading: 'いん' },
    ]},
    { char: '飲', grade: 3, entries: [
      { sentence: 'みずを 飲みます', reading: 'の' },
      { sentence: 'くすりを 飲みます', reading: 'の' },
    ]},
    { char: '運', grade: 3, entries: [
      { sentence: 'にもつを 運びます', reading: 'はこ' },
      { sentence: 'いすを 運びます', reading: 'はこ' },
    ]},
    { char: '泳', grade: 3, entries: [
      { sentence: 'うみで 泳ぎます', reading: 'およ' },
      { sentence: 'プールで 泳ぎます', reading: 'およ' },
    ]},
    { char: '駅', grade: 3, entries: [
      { sentence: '駅で まちます', reading: 'えき' },
      { sentence: '駅まで あるきます', reading: 'えき' },
    ]},
    { char: '温', grade: 3, entries: [
      { sentence: '温かい スープです', reading: 'あたた' },
      { sentence: 'みずが 温かいです', reading: 'あたた' },
    ]},
  ];

  g.KANJI_GRADE_3_WRITING = g.KANJI_GRADE_3_READING;
  g.KANJI_GRADE_CATALOG = g.KANJI_GRADE_CATALOG || {};
  g.KANJI_GRADE_CATALOG[3] = {
    reading: g.KANJI_GRADE_3_READING,
    writing: g.KANJI_GRADE_3_WRITING,
  };
})(typeof window !== 'undefined' ? window : globalThis);
