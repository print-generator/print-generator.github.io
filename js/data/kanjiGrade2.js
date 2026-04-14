/**
 * 小学2年生漢字（印刷エンジン用サンプル）
 * src/data/kanji/kanjiGrade2.ts と同期すること。
 */
(function (g) {
  g.KANJI_GRADE_2_READING = [
    { char: '引', grade: 2, entries: [
      { sentence: 'くじを 引きます', reading: 'ひ' },
      { sentence: 'てを 引いて ください', reading: 'ひ' },
    ]},
    { char: '羽', grade: 2, entries: [
      { sentence: 'とりの 羽です', reading: 'はね' },
      { sentence: 'しろい 羽が あります', reading: 'はね' },
    ]},
    { char: '雲', grade: 2, entries: [
      { sentence: '雲が でています', reading: 'くも' },
      { sentence: 'しろい 雲です', reading: 'くも' },
    ]},
    { char: '遠', grade: 2, entries: [
      { sentence: '遠くを みます', reading: 'とお' },
      { sentence: '遠い ばしょです', reading: 'とお' },
    ]},
    { char: '何', grade: 2, entries: [
      { sentence: '何を たべますか', reading: 'なに' },
      { sentence: '何を しますか', reading: 'なに' },
    ]},
    { char: '科', grade: 2, entries: [
      { sentence: 'りかは 科の なまえです', reading: 'か' },
      { sentence: 'この 科を べんきょうします', reading: 'か' },
    ]},
    { char: '歌', grade: 2, entries: [
      { sentence: '歌を うたいます', reading: 'うた' },
      { sentence: 'たのしい 歌です', reading: 'うた' },
    ]},
    { char: '画', grade: 2, entries: [
      { sentence: '画ようしに えを かきます', reading: 'が' },
      { sentence: 'この 画は きれいです', reading: 'が' },
    ]},
  ];

  g.KANJI_GRADE_2_WRITING = g.KANJI_GRADE_2_READING;
  g.KANJI_GRADE_CATALOG = g.KANJI_GRADE_CATALOG || {};
  g.KANJI_GRADE_CATALOG[2] = {
    reading: g.KANJI_GRADE_2_READING,
    writing: g.KANJI_GRADE_2_WRITING,
  };
})(typeof window !== 'undefined' ? window : globalThis);
