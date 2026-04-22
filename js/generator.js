/**
 * generator.js  —  プリントHTML生成エンジン
 * 家庭学習向けプリント自動生成
 */

/* ── ユーティリティ ── */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * プールから重複なしで最大 n 件（data.js の各プールは最大出題数以上ある想定）
 */
function pickRandom(arr, n) {
  if (!arr || !arr.length || n <= 0) return [];
  const k = Math.min(n, arr.length);
  return shuffle([...arr]).slice(0, k);
}

/**
 * ひらがな初級：beginner_sets を data.js の配列順（あ行→…→わ行→濁音…の教材順）で使用する。
 * ランダムにしない。件数がプール長を超えるときだけ先頭から循環する。
 */
function pickHiraganaBeginnerSetsOrdered(sets, count) {
  if (!sets || !sets.length || count <= 0) return [];
  if (count <= sets.length) return sets.slice(0, count);
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(sets[i % sets.length]);
  }
  return out;
}

function hasKatakana(text) {
  return /[\u30A0-\u30FF]/.test(String(text || ''));
}

function filterOutKatakanaWords(words) {
  return (words || []).filter((w) => !hasKatakana(w.word));
}

function filterOutKatakanaHiraganaIntermediate(items) {
  return (items || []).filter(
    (q) => !hasKatakana(q.word) && !(q.choices || []).some((c) => hasKatakana(c))
  );
}

function filterOutKatakanaHiraganaAdvanced(items) {
  return (items || []).filter(
    (q) => !hasKatakana(q.prompt) && !hasKatakana(q.answer)
  );
}

function hiraToKataChar(c) {
  const code = c.charCodeAt(0);
  if (code >= 0x3041 && code <= 0x3096) {
    return String.fromCharCode(code + 0x60);
  }
  return c;
}

function toKatakanaString(s) {
  return String(s || '')
    .split('')
    .map(hiraToKataChar)
    .join('');
}

function mapBeginnerSetToKatakana(set) {
  return {
    group: toKatakanaString(set.group),
    chars: (set.chars || []).map((c) => toKatakanaString(c)),
  };
}

const SMALL_KANA_HIRA = new Set([...'ぁぃぅぇぉっゃゅょゎゕゖ']);
const SMALL_KANA_KATA = new Set([...'ァィゥェォッャュョヮヵヶ']);

function isSmallKanaChar(ch, katakana) {
  return katakana ? SMALL_KANA_KATA.has(ch) : SMALL_KANA_HIRA.has(ch);
}

/** 拗音など「大文字＋小さいかな」を別マスに分ける */
function expandBeginnerCharSlots(charStr, katakana) {
  const s = String(charStr);
  const parts = [...s];
  if (parts.length === 2 && isSmallKanaChar(parts[1], katakana)) {
    return [
      { ch: parts[0], small: false },
      { ch: parts[1], small: true },
    ];
  }
  return [{ ch: s, small: false }];
}

function buildOneBeginnerCell(slot) {
  const small = slot.small;
  const cellCls = small ? 'hira-cell hira-cell--yo-on-small' : 'hira-cell';
  const traceCls = small ? 'hira-trace hira-trace--small' : 'hira-trace';
  const writeCls = small ? 'hira-write hira-write--small' : 'hira-write';
  const chHtml = escapeHtmlPrint(slot.ch);
  return `<div class="${cellCls}"><div class="${traceCls}">${chHtml}</div><div class="${writeCls}"></div></div>`;
}

/** 拗音は親子を横に密着（.hira-yoon-pair） */
function buildBeginnerTraceCells(charStr, katakana) {
  const slots = expandBeginnerCharSlots(charStr, katakana);
  if (slots.length === 2) {
    return `<div class="hira-yoon-pair">${buildOneBeginnerCell(slots[0])}${buildOneBeginnerCell(slots[1])}</div>`;
  }
  return buildOneBeginnerCell(slots[0]);
}

/** 1セット＝1グリッド列（拗音ペアも1列） */
function beginnerGridClass(groupCount) {
  const base = 'hiragana-grid hiragana-grid--beginner-compact';
  if (groupCount <= 5) {
    if (groupCount === 2) return `${base} hiragana-grid--cols-2`;
    if (groupCount === 3) return `${base} hiragana-grid--cols-3`;
    if (groupCount === 4) return `${base} hiragana-grid--cols-4`;
    return base;
  }
  return `${base} hiragana-grid--cols-${Math.min(groupCount, 10)}`;
}

const LS_LAST_PRINT_SIG = 'homePrint_lastPrintSig';

function readLastPrintSig() {
  try {
    return sessionStorage.getItem(LS_LAST_PRINT_SIG) || '';
  } catch (e) {
    return '';
  }
}

function writeLastPrintSig(sig) {
  try {
    sessionStorage.setItem(LS_LAST_PRINT_SIG, sig);
  } catch (e) {
    /* ignore */
  }
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/* ─────────────────────────────────────────────
   プリントHTML全体を生成して返す
   （print-page 単位で組み、ブラウザ印刷のカード途中改ページを避ける）
───────────────────────────────────────────── */
function generatePrintHTML(content, level, count, showName, showDate, customPayload, includeAnswers, allowKatakana, kanaMode) {
  const meta   = buildMeta(content, level);
  const header = buildPrintHeader(meta, showName, showDate);
  const instr  = buildInstruction(meta);
  const lastSig = readLastPrintSig();
  let result = buildQuestionBodyStructured(content, level, count, customPayload, !!allowKatakana, kanaMode || 'mix');
  for (let attempt = 0; attempt < 24; attempt++) {
    const sig = result.answers.join('\u0001');
    if (sig !== lastSig || attempt === 23) {
      writeLastPrintSig(sig);
      break;
    }
    result = buildQuestionBodyStructured(content, level, count, customPayload, !!allowKatakana, kanaMode || 'mix');
  }
  const { cardHtmls, answers } = result;
  const continuationStrip = buildPrintContinuationStrip(meta);
  const footer = `<div class="print-footer">
    <span>家庭学習プリント工房｜学習プリント自動作成ツール</span>
    <span>${today()}</span>
  </div>`;
  const sizes = measurePrintPackSizes(cardHtmls, header, instr, continuationStrip, footer, {
    content,
    level,
    customPayload: customPayload || {},
  });
  const chunks = chunkCardsBySizes(cardHtmls, sizes);
  const withAnswers = !!includeAnswers && answers.length > 0;

  let html = wrapPrintPagesHtml(chunks, header, instr, continuationStrip, footer, !withAnswers, cardHtmls.length, content);
  if (withAnswers) {
    html += wrapAnswerPagesHtml(answers, meta, footer);
  }
  return html;
}

const PRINT_CARD_COUNT_PRESETS = {
  joshi: {
    beginner: { first: 7, rest: 8 },
    /* 中級：PC実測向け +1 枚／ページ（769px+CSS と整合） */
    intermediate: { first: 10, rest: 11 },
    /* 上級：詰めレイアウトで1ページに多め（フォールバック） */
    advanced: { first: 11, rest: 11 },
  },
  hiragana: {
    beginner: { first: 4, rest: 5 },
    intermediate: { first: 10, rest: 11 },
    /* 上級：印刷/PDF は 1ページ目6問・以降7問（専用レイアウト。自動実測パックは使わない） */
    advanced: { first: 6, rest: 7 },
  },
  kanji: {
    reading: {
      beginner: { first: 12, rest: 12 },
      intermediate: { first: 10, rest: 11 },
      advanced: { first: 12, rest: 12 },
    },
    writing: {
      beginner: { first: 12, rest: 12 },
      intermediate: { first: 7, rest: 8 },
      advanced: { first: 12, rest: 12 },
    },
  },
  sentence: {
    beginner: { first: 9, rest: 10 },
    intermediate: { first: 8, rest: 9 },
    advanced: { first: 11, rest: 11 },
  },
  narabikae: {
    beginner: { first: 9, rest: 10 },
    intermediate: { first: 9, rest: 10 },
    advanced: { first: 9, rest: 10 },
  },
  custom: {
    beginner: { first: 6, rest: 7 },
    intermediate: { first: 5, rest: 6 },
    advanced: { first: 4, rest: 5 },
  },
  maze: {
    beginner: { first: 2, rest: 2 },
    intermediate: { first: 2, rest: 2 },
    advanced: { first: 2, rest: 2 },
  },
  maze_hiragana: {
    beginner: { first: 2, rest: 2 },
    intermediate: { first: 2, rest: 2 },
    advanced: { first: 2, rest: 2 },
  },
};

function getPresetCardsPerPage(content, level, customPayload) {
  if (content === 'kanji') {
    const mode = customPayload && customPayload.kanjiMode === 'writing' ? 'writing' : 'reading';
    return PRINT_CARD_COUNT_PRESETS.kanji[mode][level] || { first: 5, rest: 6 };
  }
  const byGenre = PRINT_CARD_COUNT_PRESETS[content];
  if (!byGenre) return { first: 5, rest: 6 };
  return byGenre[level] || { first: 5, rest: 6 };
}

/**
 * A4 縦・@page margin 12mm 想定の「印字可能領域の高さ」（273mm）を px で取得する。
 */
function getPrintableHeightLimitPx(host) {
  const ruler = document.createElement('div');
  ruler.style.cssText = 'position:absolute;left:0;top:0;height:273mm;width:1px;visibility:hidden;pointer-events:none;';
  host.appendChild(ruler);
  const h = ruler.getBoundingClientRect().height;
  host.removeChild(ruler);
  return h > 8 ? h : 0;
}

/**
 * プレビュー（#printSheet）と同じ祖先構造で測定用シートをぶら下げる。
 * クラスだけを合わせ、インラインの幅・パディングは付けない（style.css の .a4-sheet と一致）。
 */
function appendPreviewLikeMeasureRoot(host, ctx) {
  const content = (ctx && ctx.content) || '';
  const wrapper = document.createElement('div');
  wrapper.className = 'a4-wrapper print-area';
  const sheet = document.createElement('div');
  sheet.className = 'a4-sheet';
  if (content === 'maze' || content === 'maze_hiragana') {
    sheet.classList.add('a4-sheet--maze');
  }
  wrapper.appendChild(sheet);
  host.appendChild(wrapper);
  return { wrapper, sheet };
}

/** プレビュー出力と同系の .print-page クラス（total は wrapPrintPagesHtml の print-page--total-N に合わせる） */
function buildPackMeterPrintPageClass(ctx, isFirstPage, totalQuestions) {
  const content = (ctx && ctx.content) || '';
  const n = Math.max(1, totalQuestions | 0);
  const parts = ['print-page', isFirstPage ? 'print-page--first' : 'print-page--continuation'];
  if (content === 'maze' || content === 'maze_hiragana') {
    parts.push('print-page--maze');
  }
  parts.push(`print-page--total-${n}`);
  return parts.join(' ');
}

/**
 * 連続 len 枚（cardHtmls[start .. start+len-1]）だけを1ページ相当に載せたときの .questions-grid の scrollHeight。
 * wrapPrintPagesHtml と同じ `print-page--cards-{len}` を付与する（5問ページの .print-page--cards-5 詰めを反映）。
 */
function measureSegmentStackPx(
  host,
  cardHtmls,
  ctx,
  start,
  len,
  useFirstTemplate,
  header,
  instr,
  continuationStrip
) {
  if (!len) return 0;
  const { wrapper, sheet } = appendPreviewLikeMeasureRoot(host, ctx);
  const base = buildPackMeterPrintPageClass(ctx, useFirstTemplate, (ctx && ctx.totalQuestions) || 1);
  const page = document.createElement('div');
  page.className = `${base} print-page--cards-${len}`.trim();
  const before = useFirstTemplate ? `${header}${instr}` : `${continuationStrip}`;
  page.innerHTML = `${before}<div class="questions-grid"></div>`;
  const grid = page.querySelector('.questions-grid');
  sheet.appendChild(page);
  const n = cardHtmls.length;
  for (let i = 0; i < len; i++) {
    const idx = start + i;
    if (idx < 0 || idx >= n) continue;
    const w = document.createElement('div');
    w.innerHTML = cardHtmls[idx];
    const card = w.firstElementChild;
    if (card) grid.appendChild(card);
  }
  void wrapper.offsetHeight;
  const h = grid.scrollHeight;
  host.removeChild(wrapper);
  return h;
}

/**
 * 接頭辞差分ではなく「そのページ枚数 L の print-page--cards-L」付きで区間高さを測り、貪欲に分割する。
 * メモで同一 (s,len,first) は1回だけ DOM を組む。
 */
function greedyPrintPackFromSegments(
  host,
  cardHtmls,
  ctxMeasure,
  header,
  instr,
  continuationStrip,
  roomFirstOpen,
  roomFirstClosed,
  roomRestOpen,
  roomRestClosed,
  safetyPx,
  overflowAllowPx,
  kindRoomBonusPx,
  debug
) {
  const n = cardHtmls.length;
  const memo = new Map();
  function spanFor(s, len) {
    if (len <= 0) return 0;
    const useFirst = s === 0;
    const key = `${s}|${len}|${useFirst ? 1 : 0}`;
    if (memo.has(key)) return memo.get(key);
    const h = measureSegmentStackPx(
      host,
      cardHtmls,
      ctxMeasure,
      s,
      len,
      useFirst,
      header,
      instr,
      continuationStrip
    );
    memo.set(key, h);
    return h;
  }

  const sizes = [];
  let s = 0;
  let isFirstPage = true;
  while (s < n) {
    let e = s;
    while (e < n) {
      const nextE = e + 1;
      const len = nextE - s;
      const span = spanFor(s, len);
      const remAfter = n - nextE;
      const isLastPageCandidate = remAfter === 0;
      const kindBonus = getKindRoomBonusPx(kindRoomBonusPx, isFirstPage, isLastPageCandidate);
      const room =
        remAfter === 0
          ? isFirstPage
            ? roomFirstClosed
            : roomRestClosed
          : isFirstPage
            ? roomFirstOpen
            : roomRestOpen;
      const effectiveRoom = room + kindBonus;
      if (span <= effectiveRoom - safetyPx + overflowAllowPx) {
        e = nextE;
      } else {
        if (debug && remAfter > 0 && span <= effectiveRoom && span > effectiveRoom - safetyPx) {
          console.warn('[printPackDebug] segment: next chunk fits ROOM but blocked by safety only', {
            page: sizes.length + 1,
            isFirstPage,
            start0: s,
            len,
            spanPx: Math.round(span * 100) / 100,
            roomPx: Math.round(room * 100) / 100,
            effectiveRoomPx: Math.round(effectiveRoom * 100) / 100,
            kindBonusPx: kindBonus,
            safetyPx,
            overflowAllowPx,
          });
        }
        if (debug && remAfter > 0 && span > effectiveRoom && span <= effectiveRoom + overflowAllowPx + 2.5) {
          console.warn('[printPackDebug] segment: slightly over ROOM', {
            page: sizes.length + 1,
            isFirstPage,
            len,
            spanPx: Math.round(span * 100) / 100,
            roomPx: Math.round(room * 100) / 100,
            effectiveRoomPx: Math.round(effectiveRoom * 100) / 100,
            kindBonusPx: kindBonus,
            safetyPx,
            overflowAllowPx,
          });
        }
        break;
      }
    }
    if (e === s) {
      e = s + 1;
    }
    sizes.push(e - s);
    isFirstPage = false;
    s = e;
  }
  return sizes;
}

function buildPackDebugDiagnostics(
  host,
  cardHtmls,
  ctxMeasure,
  sizes,
  header,
  instr,
  continuationStrip,
  roomFirstOpen,
  roomFirstClosed,
  roomRestOpen,
  roomRestClosed,
  kindRoomBonusPx
) {
  const pages = [];
  let start = 0;
  for (let i = 0; i < sizes.length; i++) {
    const len = sizes[i] | 0;
    const isFirst = i === 0;
    const isLast = i === sizes.length - 1;
    const room = isLast
      ? (isFirst ? roomFirstClosed : roomRestClosed)
      : (isFirst ? roomFirstOpen : roomRestOpen);
    const kindBonus = getKindRoomBonusPx(kindRoomBonusPx, isFirst, isLast);
    const effectiveRoom = room + kindBonus;
    const span = measureSegmentStackPx(
      host,
      cardHtmls,
      ctxMeasure,
      start,
      len,
      isFirst,
      header,
      instr,
      continuationStrip
    );
    pages.push({
      page: i + 1,
      start0: start,
      cards: len,
      cardsClass: `print-page--cards-${len}`,
      kind: isFirst ? (isLast ? 'first+last' : 'first') : (isLast ? 'last' : 'middle'),
      measuredGridPx: Math.round(span * 100) / 100,
      roomPx: Math.round(room * 100) / 100,
      kindBonusPx: Math.round(kindBonus * 100) / 100,
      effectiveRoomPx: Math.round(effectiveRoom * 100) / 100,
      slackPx: Math.round((room - span) * 100) / 100,
      effectiveSlackPx: Math.round((effectiveRoom - span) * 100) / 100,
    });
    start += len;
  }
  return pages;
}

/**
 * ヘッダー＋空グリッド（＋任意でフッター）までの外装高さと空グリッド高さを測る。
 */
function measurePrintPageShell(host, ctx, isFirstPage, beforeGridHtml, withFooter, footerHtml) {
  const { wrapper, sheet } = appendPreviewLikeMeasureRoot(host, ctx);
  const totalQ = (ctx && ctx.totalQuestions) || 1;
  const page = document.createElement('div');
  page.className = buildPackMeterPrintPageClass(ctx, isFirstPage, totalQ);
  page.innerHTML = `${beforeGridHtml}<div class="questions-grid"></div>${withFooter ? footerHtml : ''}`;
  const grid = page.querySelector('.questions-grid');
  sheet.appendChild(page);
  void wrapper.offsetHeight;
  const g0 = grid.getBoundingClientRect().height;
  const baseAssembly = sheet.getBoundingClientRect().height;
  host.removeChild(wrapper);
  return { g0, baseAssembly };
}

/**
 * グリッドに収められるカード列の最大の縦幅（px）。
 * ROOM = H_LIMIT - (固定部分の高さ) + (空グリッドが占めていた分) + epsilonPx
 * epsilonPx … scrollHeight / 小数丸めと印刷時の微差を吸収（過大にしない程度）
 */
function computePrintGridRoomPx(H_LIMIT, baseAssembly, g0, epsilonPx) {
  const eps = Number.isFinite(epsilonPx) ? epsilonPx : 0;
  return H_LIMIT - baseAssembly + g0 + eps;
}

function getPackAggressiveTuning(ctx) {
  const content = (ctx && ctx.content) || '';
  const level = (ctx && ctx.level) || '';
  const kanjiMode =
    ctx && ctx.customPayload && ctx.customPayload.kanjiMode === 'writing' ? 'writing' : 'reading';
  const isJoshiIntermediate = content === 'joshi' && level === 'intermediate';
  const isJoshiAdvanced = content === 'joshi' && level === 'advanced';
  const isHiraganaIntermediate = content === 'hiragana' && level === 'intermediate';
  const isHiraganaAdvanced = content === 'hiragana' && level === 'advanced';
  const isKanjiReadingIntermediate =
    content === 'kanji' && kanjiMode === 'reading' && level === 'intermediate';
  const isSentenceTarget =
    content === 'sentence' && (level === 'beginner' || level === 'intermediate' || level === 'advanced');
  const isNarabikaeTarget =
    content === 'narabikae' && (level === 'beginner' || level === 'intermediate' || level === 'advanced');

  if (isJoshiIntermediate) {
    return {
      safetyPx: 0,
      roomRoundEpsPx: 8,
      overflowAllowPx: 20,
      kindRoomBonusPx: { first: 2.5, middle: 4, last: 1.2 },
    };
  }
  if (isJoshiAdvanced) {
    return {
      safetyPx: 0,
      roomRoundEpsPx: 8.5,
      overflowAllowPx: 24,
      kindRoomBonusPx: { first: 2.8, middle: 5, last: 1.6 },
    };
  }
  if (isSentenceTarget) {
    return {
      safetyPx: 0,
      roomRoundEpsPx: 7.8,
      overflowAllowPx: 20,
      kindRoomBonusPx: { first: 2.4, middle: 4.8, last: 1.2 },
    };
  }
  if (isNarabikaeTarget) {
    return {
      safetyPx: 0,
      roomRoundEpsPx: 6.8,
      overflowAllowPx: 16,
      kindRoomBonusPx: { first: 1.8, middle: 3.8, last: 1 },
    };
  }
  if (isHiraganaIntermediate) {
    return {
      safetyPx: 0,
      roomRoundEpsPx: 6.8,
      overflowAllowPx: 18,
      kindRoomBonusPx: { first: 2, middle: 4, last: 1 },
    };
  }
  if (isHiraganaAdvanced) {
    return {
      safetyPx: 0,
      roomRoundEpsPx: 5.8,
      overflowAllowPx: 14,
      kindRoomBonusPx: { first: 1.8, middle: 3.4, last: 1.1 },
    };
  }
  if (isKanjiReadingIntermediate) {
    return {
      safetyPx: 0,
      roomRoundEpsPx: 5.2,
      overflowAllowPx: 13,
      kindRoomBonusPx: { first: 1.2, middle: 2.5, last: 0.7 },
    };
  }
  const isMazePack = content === 'maze' || content === 'maze_hiragana';
  if (isMazePack) {
    return {
      safetyPx: 0.25,
      roomRoundEpsPx: 2.3,
      overflowAllowPx: 6,
      kindRoomBonusPx: { first: 1.2, middle: 1.8, last: 0.8 },
    };
  }
  return {
    safetyPx: 1.2,
    roomRoundEpsPx: 0.8,
    overflowAllowPx: 2,
    kindRoomBonusPx: { first: 0.6, middle: 1, last: 0.4 },
  };
}

function getKindRoomBonusPx(kindRoomBonusPx, isFirstPage, isLastPage) {
  const map = kindRoomBonusPx || {};
  if (isFirstPage && isLastPage) return Number(map.first || 0);
  if (isFirstPage) return Number(map.first || 0);
  if (isLastPage) return Number(map.last || 0);
  return Number(map.middle || 0);
}

/**
 * 問題カード HTML を「実測高さの合計が 1 枚に収まるところ」で分割するための各ページ枚数配列。
 * document が無い・測定失敗時は従来のジャンル別プリセット（first/rest）にフォールバック。
 */
function measurePrintPackSizes(cardHtmls, header, instr, continuationStrip, footerHtml, ctx) {
  const n = cardHtmls.length;
  if (!n) return [];
  /* 50音上級：ページ枚数はプリセット固定（first:6 / rest:7）。実測貪欲パックは使わない */
  if (ctx && ctx.content === 'hiragana' && ctx.level === 'advanced') {
    return getFallbackPrintChunkSizes(n, ctx.content, ctx.level, ctx.customPayload || {});
  }
  /* 並べ替え：ページ枚数は固定（first:9 / rest:10）。実測貪欲パックは使わない */
  if (ctx && ctx.content === 'narabikae') {
    return getFallbackPrintChunkSizes(n, ctx.content, ctx.level, ctx.customPayload || {});
  }
  if (ctx && (ctx.content === 'maze' || ctx.content === 'maze_hiragana')) {
    return getFallbackPrintChunkSizes(n, ctx.content, ctx.level, ctx.customPayload);
  }
  if (typeof document === 'undefined') {
    return getFallbackPrintChunkSizes(n, ctx.content, ctx.level, ctx.customPayload);
  }

  const host = document.createElement('div');
  host.setAttribute('data-print-pack-meter', '1');
  host.setAttribute('aria-hidden', 'true');
  /* 幅はプレビューと同じ 186mm 相当になるよう確保（中の .a4-sheet は max-width:100% のため） */
  host.style.cssText =
    'position:fixed;left:-9999px;top:0;width:186mm;min-width:186mm;max-width:186mm;height:auto;overflow:visible;pointer-events:none;z-index:-1;opacity:0;visibility:hidden;';

  const tuning = getPackAggressiveTuning(ctx);
  const SAFETY = tuning.safetyPx;
  const ROOM_ROUND_EPS = tuning.roomRoundEpsPx;
  const OVERFLOW_ALLOW = tuning.overflowAllowPx;
  const debug =
    typeof localStorage !== 'undefined' &&
    localStorage.getItem('printPackDebug') === '1';

  try {
    document.body.appendChild(host);
    const H_LIMIT = getPrintableHeightLimitPx(host);
    if (!H_LIMIT) {
      return getFallbackPrintChunkSizes(n, ctx.content, ctx.level, ctx.customPayload);
    }

    const ctxMeasure = {
      content: ctx.content,
      level: ctx.level,
      customPayload: ctx.customPayload,
      totalQuestions: n,
    };

    const shFirstOpen = measurePrintPageShell(host, ctxMeasure, true, `${header}${instr}`, false, footerHtml);
    const shFirstClosed = measurePrintPageShell(host, ctxMeasure, true, `${header}${instr}`, true, footerHtml);
    const shRestOpen = measurePrintPageShell(host, ctxMeasure, false, `${continuationStrip}`, false, footerHtml);
    const shRestClosed = measurePrintPageShell(host, ctxMeasure, false, `${continuationStrip}`, true, footerHtml);

    const roomFirstOpen = computePrintGridRoomPx(H_LIMIT, shFirstOpen.baseAssembly, shFirstOpen.g0, ROOM_ROUND_EPS);
    const roomFirstClosed = computePrintGridRoomPx(H_LIMIT, shFirstClosed.baseAssembly, shFirstClosed.g0, ROOM_ROUND_EPS);
    const roomRestOpen = computePrintGridRoomPx(H_LIMIT, shRestOpen.baseAssembly, shRestOpen.g0, ROOM_ROUND_EPS);
    const roomRestClosed = computePrintGridRoomPx(H_LIMIT, shRestClosed.baseAssembly, shRestClosed.g0, ROOM_ROUND_EPS);

    if (
      roomFirstOpen < 48 ||
      roomFirstClosed < 48 ||
      roomRestOpen < 48 ||
      roomRestClosed < 48 ||
      roomFirstClosed > roomFirstOpen ||
      roomRestClosed > roomRestOpen
    ) {
      return getFallbackPrintChunkSizes(n, ctx.content, ctx.level, ctx.customPayload);
    }

    const sizes = greedyPrintPackFromSegments(
      host,
      cardHtmls,
      ctxMeasure,
      header,
      instr,
      continuationStrip,
      roomFirstOpen,
      roomFirstClosed,
      roomRestOpen,
      roomRestClosed,
      SAFETY,
      OVERFLOW_ALLOW,
      tuning.kindRoomBonusPx,
      debug
    );

    const sum = sizes.reduce((a, b) => a + b, 0);
    if (!sizes.length || sum !== n) {
      return getFallbackPrintChunkSizes(n, ctx.content, ctx.level, ctx.customPayload);
    }
    if (debug) {
      const k0 = sizes[0] | 0;
      let firstPageSegH = 0;
      if (k0 > 0) {
        firstPageSegH = measureSegmentStackPx(
          host,
          cardHtmls,
          ctxMeasure,
          0,
          k0,
          true,
          header,
          instr,
          continuationStrip
        );
      }
      try {
        const pageDiagnostics = buildPackDebugDiagnostics(
          host,
          cardHtmls,
          ctxMeasure,
          sizes,
          header,
          instr,
          continuationStrip,
          roomFirstOpen,
          roomFirstClosed,
          roomRestOpen,
          roomRestClosed,
          tuning.kindRoomBonusPx
        );
        globalThis.__PRINT_PACK_LAST = {
          firstPageCardsClass: k0,
          firstPageGridHeightPx: Math.round(firstPageSegH * 100) / 100,
          totalQuestions: n,
          pageDiagnostics,
          /* app.js 互換: 先頭1枚の getBoundingClientRect と比べる用途 */
          firstCardStackDeltaPx: Math.round(
            measureSegmentStackPx(
              host,
              cardHtmls,
              ctxMeasure,
              0,
              1,
              true,
              header,
              instr,
              continuationStrip
            ) * 100
          ) / 100,
        };
      } catch (e) {
        /* ignore */
      }
      console.warn('[printPackDebug] plan', {
        sizes,
        H_LIMIT: Math.round(H_LIMIT * 100) / 100,
        firstPageCardsClass: k0,
        firstPageGridHeightPx: Math.round(firstPageSegH * 100) / 100,
        rooms: {
          roomFirstOpen: Math.round(roomFirstOpen * 100) / 100,
          roomFirstClosed: Math.round(roomFirstClosed * 100) / 100,
          roomRestOpen: Math.round(roomRestOpen * 100) / 100,
          roomRestClosed: Math.round(roomRestClosed * 100) / 100,
        },
        SAFETY,
        ROOM_ROUND_EPS,
        OVERFLOW_ALLOW,
        KIND_ROOM_BONUS: tuning.kindRoomBonusPx,
      });
      try {
        if (globalThis.__PRINT_PACK_LAST && globalThis.__PRINT_PACK_LAST.pageDiagnostics) {
          console.table(globalThis.__PRINT_PACK_LAST.pageDiagnostics);
        }
      } catch (eTable) {
        /* ignore */
      }
      console.warn(
        '[printPackDebug] compare after preview: 1ページ目グリッド高さは firstPageGridHeightPx（print-page--cards-' +
          k0 +
          '）。先頭1枚だけなら firstCardStackDeltaPx。'
      );
    }
    return sizes;
  } catch (e) {
    return getFallbackPrintChunkSizes(n, ctx.content, ctx.level, ctx.customPayload);
  } finally {
    if (host.parentNode) host.parentNode.removeChild(host);
  }
}

/** measurePrintPackSizes 用：sizes から cardHtmls を分割 */
function chunkCardsBySizes(cardHtmls, sizes) {
  if (!cardHtmls.length || !sizes || !sizes.length) return [];
  const out = [];
  let i = 0;
  for (let p = 0; p < sizes.length; p++) {
    const sz = Math.max(0, sizes[p] | 0);
    if (sz === 0) continue;
    out.push(cardHtmls.slice(i, i + sz));
    i += sz;
  }
  if (i < cardHtmls.length) {
    if (out.length) {
      const last = out[out.length - 1];
      out[out.length - 1] = last.concat(cardHtmls.slice(i));
    } else {
      out.push(cardHtmls.slice(i));
    }
  }
  return out.filter((ch) => ch.length);
}

/** document 非存在時・測定失敗時：従来の first/rest 固定分割 */
function getFallbackPrintChunkSizes(totalCards, content, level, customPayload) {
  const n = Math.max(0, totalCards | 0);
  if (n === 0) return [];
  const lv = level || 'intermediate';
  const plan = getPresetCardsPerPage(content, lv, customPayload || {});
  const sizes = [];
  const first = Math.max(1, plan.first | 0);
  const rest = Math.max(1, plan.rest | 0);
  const firstSize = Math.min(first, n);
  sizes.push(firstSize);
  let remaining = n - firstSize;
  while (remaining > 0) {
    const sz = Math.min(rest, remaining);
    sizes.push(sz);
    remaining -= sz;
  }
  return sizes;
}

function escapeHtmlPrint(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 解答専用ページ（問題ページの後ろに追加） */
function wrapAnswerPagesHtml(answers, meta, footer) {
  const items = answers
    .map(
      (a, i) =>
        `<li class="answer-sheet-item"><span class="answer-sheet-qnum">${i + 1}</span> ${escapeHtmlPrint(a)}</li>`
    )
    .join('');
  const head = `${meta.emoji} ${escapeHtmlPrint(meta.label)}`;
  return `<div class="print-page print-page--answer print-page--last">
    <div class="answer-sheet">
      <h2 class="answer-sheet-title">📋 解答（${head}）</h2>
      <ol class="answer-sheet-list">${items}</ol>
    </div>
    ${footer}
  </div>`;
}

/**
 * 1 print-page あたりの問題数（HTML 単位の改ページ。カード途中分割はしない）
 * ※ 通常モードは「各ページ5問」（usesFirstFourRestFiveLayout）で chunk するため、
 *    ここはめいろ系など可変レイアウト向けのフォールバック。
 */
function getCardsPerPage(content, level) {
  if (content === 'maze' || content === 'maze_hiragana') return 2;
  if (content === 'joshi') {
    return level === 'advanced' ? 4 : 6;
  }
  if (content === 'hiragana') {
    if (level === 'advanced') return 4;
    return 6;
  }
  if (content === 'custom') {
    return level === 'advanced' ? 4 : 6;
  }
  if (content === 'kanji') {
    return 6;
  }
  return 6;
}

/** めいろ以外：各印刷ページは5問（ヘッダー・説明・カード高さはCSSで最適化） */
function usesFirstFourRestFiveLayout(content) {
  return content !== 'maze' && content !== 'maze_hiragana';
}

/**
 * 各ページの問題数の配列（実測レイアウトが無い環境向けのフォールバック）
 * スマホ PDF は app.js 側で .print-page 単位の実 DOM を使うため、ここは主に後方互換用。
 */
function getPrintPageChunkSizes(totalCards, content, level, customPayload) {
  return getFallbackPrintChunkSizes(Math.max(0, totalCards | 0), content, level, customPayload || {});
}

/** question-card HTML の配列を固定サイズで分割 */
function chunkCardsForPrint(cardHtmls, perPage) {
  const pages = [];
  for (let i = 0; i < cardHtmls.length; i += perPage) {
    pages.push(cardHtmls.slice(i, i + perPage));
  }
  return pages;
}

/**
 * ページごとに print-page でラップ。
 * - 1ページ目: 通常ヘッダー + 説明
 * - 2ページ目以降: 続き用の簡易ブロック（問題エリアを広く確保）
 * @param {boolean} putFooterOnLastQuestionPage 解答ページを別途付ける場合は false（フッターは解答側へ）
 * @param {string} [content] ジャンル（迷路系のみ .print-page--maze を付与し CSS で分離）
 */
function wrapPrintPagesHtml(chunks, header, instr, continuationStrip, footer, putFooterOnLastQuestionPage, totalCards, content) {
  if (putFooterOnLastQuestionPage === undefined) putFooterOnLastQuestionPage = true;
  const total = Number.isFinite(totalCards) ? totalCards : 0;
  const isMazeContent = content === 'maze' || content === 'maze_hiragana';
  return chunks
    .map((chunk, i, arr) => {
      const isFirst = i === 0;
      const isLast  = i === arr.length - 1;
      const cls = [
        'print-page',
        isFirst ? 'print-page--first' : 'print-page--continuation',
        isLast ? 'print-page--last' : '',
        `print-page--cards-${chunk.length}`,
        total > 0 ? `print-page--total-${total}` : '',
        isMazeContent ? 'print-page--maze' : '',
      ]
        .filter(Boolean)
        .join(' ');
      let html = `<div class="${cls}">`;
      if (isFirst) html += header + instr;
      else html += continuationStrip;
      html += `<div class="questions-grid">${chunk.join('')}</div>`;
      if (isLast && putFooterOnLastQuestionPage) html += footer;
      html += `</div>`;
      return html;
    })
    .join('');
}

/* ── メタ情報 ── */
function buildMeta(content, level) {
  const contentInfo = {
    joshi:    { label: '助詞',   emoji: '📝' },
    hiragana: { label: '50音', emoji: '🔤' },
    custom:   { label: '好きな単語（なぞり）', emoji: '✏️' },
    maze:     { label: 'めいろ', emoji: '🧩' },
    maze_hiragana: { label: 'ひらがな迷路', emoji: '🧩' },
    sentence: { label: '文章問題', emoji: '📚' },
    narabikae: { label: '並び替え', emoji: '🔀' },
    kanji: { label: '漢字', emoji: '字' },
  };
  const levelInfo = {
    beginner:     { label: '初級',  desc: 'なぞり書き',  badge: '🌱' },
    intermediate: { label: '中級',  desc: '選択問題',    badge: '🌼' },
    advanced:     { label: '上級',  desc: '記述問題',    badge: '🌟' },
  };
  const genreMeta = contentInfo[content] || { label: content, emoji: '' };
  const levelMeta = levelInfo[level] || { label: level, desc: '', badge: '' };
  const base = {
    ...genreMeta,
    ...levelMeta,
    label: genreMeta.label,
    genreLabel: genreMeta.label,
    levelLabel: levelMeta.label,
    titleLabel: `${genreMeta.label} ${levelMeta.label}`,
  };
  /* 50音・上級は絵つき単語のなぞり書きのため、ヘッダー説明を記述問題にしない */
  if (content === 'hiragana' && level === 'advanced') {
    base.desc = '絵つき・なぞり書き（単語）';
  }
  if (content === 'kanji') {
    if (level === 'beginner') base.desc = '短文・なぞり（1年生）';
    else if (level === 'intermediate') base.desc = '短文・選択（1年生）';
    else base.desc = '短文・記述（1年生）';
  }
  return {
    ...base,
    content,
    level,
  };
}

/* ── プリントヘッダー ── */
function buildPrintHeader(meta, showName, showDate) {
  const nameBlock = showName
    ? `<div class="print-header-field print-header-field--name">
        <span class="print-field-label">なまえ</span>
        <span class="print-field-line print-field-line--name"></span>
      </div>`
    : '';
  const dateBlock = showDate
    ? `<div class="print-header-field print-header-field--date" aria-label="日付">
        <span class="print-date-slot">
          <span class="print-date-blank print-date-blank--month"></span>
          <span class="print-date-suffix">がつ</span>
        </span>
        <span class="print-date-slot">
          <span class="print-date-blank print-date-blank--day"></span>
          <span class="print-date-suffix">にち</span>
        </span>
      </div>`
    : '';
  const fields =
    showName || showDate
      ? `<div class="print-header-fields">${nameBlock}${dateBlock}</div>`
      : '';

  return `<div class="print-header">
    <div class="print-header-main-row">
      <div class="print-header-left">
        <div class="print-title-row">
          <div class="print-title-block">
            <div class="print-category">${meta.emoji} ${meta.titleLabel} ／ ${meta.badge} ${meta.desc}</div>
            <h1 class="print-title"><span class="print-title-main">${meta.genreLabel}</span><span class="print-title-suffix"> ${meta.levelLabel}</span></h1>
          </div>
          <img src="images/logo.png" class="print-logo print-logo--header" alt="" width="48" height="48" />
        </div>
      </div>
      ${fields}
    </div>
  </div>`;
}

/* ── 説明文 ── */
function getInstructionText(meta) {
  const instructions = {
    joshi: {
      beginner:     'うすい もじを なぞって かきましょう。',
      intermediate: '（　）に あてはまる ことばを えらびましょう。',
      advanced:     '（　）に あてはまる ことばを じゆうに かきましょう。',
    },
    hiragana: {
      beginner:     'うすい もじを なぞり、下の マスに かきましょう。拗音は 大きい もじと 小さい や・ゆ・よ を 分けて かきましょう。',
      intermediate: 'えに あう ことばを えらびましょう。',
      advanced:     'えを みながら もじを なぞって かきましょう。',
    },
    custom: {
      beginner:     'じぶんで いれた ことばを なぞって かきましょう。',
      intermediate: 'じぶんで いれた ことばを なぞって かきましょう。',
      advanced:     'じぶんで いれた ことばを なぞって かきましょう。',
    },
    maze: {
      beginner:     'スタートから ゴールまで すすみましょう。',
      intermediate: 'わかれみちに きをつけて ゴールを めざしましょう。',
      advanced:     'いきどまりに きをつけて ゴールを めざしましょう。',
    },
    maze_hiragana: {
      beginner:     'もじを よみながら ゴールを めざしましょう。',
      intermediate: 'ルートの もじを つないで ことばを つくりましょう。',
      advanced:     'もじの じゅんばんを たしかめながら すすみましょう。',
    },
    sentence: {
      beginner:     'ぶんを よんで えらびましょう。',
      intermediate: 'ことばの じゅんばんを ならべましょう。',
      advanced:     'ぶんを よみ、しつもんに ぶんで こたえましょう。',
    },
    narabikae: {
      beginner: '3つの ことばを ならべて ただしい ぶんに しましょう。',
      intermediate: '4つの ことばを ならべて ぶんを つくりましょう。',
      advanced: '5つの ことばを ならべて ぶんを つくり、したに かきましょう。',
    },
    kanji: {
      beginner:
        'よむ：うすい よみかなを なぞりましょう。／ かく：□に 入る かんじを なぞりましょう。',
      intermediate:
        'よむ：ただしい よみかたを えらびましょう。／ かく：ただしい かんじを えらびましょう。',
      advanced:
        'よむ：（　　）に よみかたを かきましょう。／ かく：□に かんじを かきましょう。',
    },
  };
  return instructions[meta.content][meta.level];
}

function buildInstruction(meta) {
  const text = getInstructionText(meta);
  return `<div class="print-instruction">
    <i class="fas fa-info-circle"></i>　${text}
  </div>`;
}

/** 2ページ目以降：ヘッダー・説明のかわりに、1行タイトル＋短い説明のみ */
function buildPrintContinuationStrip(meta) {
  const text = escapeHtmlPrint(getInstructionText(meta));
  return `<div class="print-continuation-strip">
    <div class="print-continuation-kicker">${meta.emoji} ${escapeHtmlPrint(meta.titleLabel)} ／ ${meta.badge} ${escapeHtmlPrint(meta.desc)}</div>
    <div class="print-continuation-title">つづき</div>
    <p class="print-continuation-hint">${text}</p>
  </div>`;
}

/* ====================================================
   漢字（データ: js/data/kanjiGrade*.js → src/data/kanji/kanjiGrade*.ts と同期）
   短文1題・difficulty×kanjiMode（src/generators/kanji.ts と同ロジック）
   ==================================================== */
function getKanjiPool(grade, mode) {
  const g = typeof globalThis !== 'undefined' ? globalThis : {};
  const m = mode === 'writing' ? 'writing' : 'reading';
  if (g.KANJI_GRADE_CATALOG && g.KANJI_GRADE_CATALOG[grade]) {
    const byMode = g.KANJI_GRADE_CATALOG[grade][m];
    if (Array.isArray(byMode)) return byMode;
  }
  if (grade === 1 && Array.isArray(g.KANJI_GRADE_1)) return g.KANJI_GRADE_1;
  return [];
}

function kanjiPickContext(entry) {
  const list = entry.entries;
  if (!list || !list.length) return null;
  return list[Math.floor(Math.random() * list.length)] || null;
}

function kanjiCollectAllReadings(pool) {
  const set = new Set();
  for (let i = 0; i < pool.length; i++) {
    const ent = pool[i].entries;
    if (!ent) continue;
    for (let j = 0; j < ent.length; j++) {
      if (ent[j].reading) set.add(ent[j].reading);
    }
  }
  return [...set];
}

/** 漢数字：固定表のみ（src/data/kanji/numeralReadings.ts と同一）。「つ」の連結生成はしない。 */
const KANJI_NUMERAL_TSU_READINGS = {
  一: 'ひとつ',
  二: 'ふたつ',
  三: 'みっつ',
  四: 'よっつ',
  五: 'いつつ',
  六: 'むっつ',
  七: 'ななつ',
  八: 'やっつ',
  九: 'ここのつ',
  十: 'とお',
};
const KANJI_NUMERAL_SUUJI_READINGS = {
  一: 'いち',
  二: 'に',
  三: 'さん',
  四: 'し',
  五: 'ご',
  六: 'ろく',
  七: 'なな',
  八: 'はち',
  九: 'きゅう',
  十: 'じゅう',
};
const KANJI_NUMERAL_CHARS = '一二三四五六七八九十';

function resolveKanjiContextReading(char, sentence, dataReading) {
  if (!KANJI_NUMERAL_CHARS.includes(char)) return dataReading;
  const idx = sentence.indexOf(char);
  if (idx === -1) return dataReading;
  const after = sentence.slice(idx + char.length);
  if (/^\s*つ/.test(after)) {
    return KANJI_NUMERAL_TSU_READINGS[char] != null ? KANJI_NUMERAL_TSU_READINGS[char] : dataReading;
  }
  return KANJI_NUMERAL_SUUJI_READINGS[char] != null ? KANJI_NUMERAL_SUUJI_READINGS[char] : dataReading;
}

function kanjiSplitAtTarget(sentence, char) {
  const i = sentence.indexOf(char);
  if (i === -1) return null;
  return { before: sentence.slice(0, i), after: sentence.slice(i + char.length) };
}

function kanjiHtmlReadingIntermediate(sentence, char) {
  const p = kanjiSplitAtTarget(sentence, char);
  if (!p) return escapeHtmlPrint(sentence);
  return `${escapeHtmlPrint(p.before)}<span class="kanji-drill-target">${escapeHtmlPrint(char)}</span>${escapeHtmlPrint(p.after)}`;
}

function kanjiHtmlReadingBeginner(sentence, char, reading) {
  const p = kanjiSplitAtTarget(sentence, char);
  if (!p) return escapeHtmlPrint(sentence);
  return `${escapeHtmlPrint(p.before)}<span class="kanji-stack" lang="ja"><span class="kanji-stack__top kanji-stack__top--trace">${escapeHtmlPrint(reading)}</span><span class="kanji-stack__bottom kanji-stack__bottom--kanji">${escapeHtmlPrint(char)}</span></span>${escapeHtmlPrint(p.after)}`;
}

function kanjiHtmlReadingAdvanced(sentence, char, reading) {
  const p = kanjiSplitAtTarget(sentence, char);
  if (!p) return escapeHtmlPrint(sentence);
  void reading;
  return `${escapeHtmlPrint(p.before)}<span class="kanji-stack kanji-stack--reading-adv" lang="ja"><span class="kanji-reading-blank-line" aria-hidden="true">（　　　　）</span><span class="kanji-stack__bottom kanji-stack__bottom--kanji">${escapeHtmlPrint(char)}</span></span>${escapeHtmlPrint(p.after)}`;
}

function kanjiHtmlWritingIntermediate(sentence, char, yomi) {
  const p = kanjiSplitAtTarget(sentence, char);
  if (!p) return escapeHtmlPrint(sentence);
  return `${escapeHtmlPrint(p.before)}（${escapeHtmlPrint(yomi)}）${escapeHtmlPrint(p.after)}`;
}

function kanjiHtmlWritingBeginner(sentence, char, yomi) {
  const p = kanjiSplitAtTarget(sentence, char);
  if (!p) return escapeHtmlPrint(sentence);
  return `${escapeHtmlPrint(p.before)}<span class="kanji-stack" lang="ja"><span class="kanji-stack__top kanji-stack__top--trace">${escapeHtmlPrint(char)}</span><span class="kanji-stack__bottom kanji-stack__bottom--slot">（${escapeHtmlPrint(yomi)}）</span></span>${escapeHtmlPrint(p.after)}`;
}

function kanjiHtmlWritingAdvanced(sentence, char, yomi) {
  const p = kanjiSplitAtTarget(sentence, char);
  if (!p) return escapeHtmlPrint(sentence);
  void char;
  return `${escapeHtmlPrint(p.before)}<span class="kanji-stack kanji-stack--writing-adv" lang="ja"><span class="kanji-stack__yomi-read kanji-stack__yomi-read--writing">${escapeHtmlPrint(yomi)}</span><span class="kanji-stack__masu-row kanji-stack__masu-row--write"><span class="kanji-blank-square" aria-hidden="true"></span></span></span>${escapeHtmlPrint(p.after)}`;
}

function buildKanjiReadingSentence(entry, sentence, reading, pool, level) {
  const lineClass = 'choice-sentence kanji-sentence-line kanji-sentence-line--prominent kanji-sentence-line--nowrap';

  if (level === 'beginner') {
    const marked = kanjiHtmlReadingBeginner(sentence, entry.char, reading);
    const inner = `<div class="kanji-wrap"><div class="${lineClass}">${marked}</div></div>`;
    return { html: inner, answer: reading };
  }

  if (level === 'intermediate') {
    const marked = kanjiHtmlReadingIntermediate(sentence, entry.char);
    const line = `<div class="${lineClass}">${marked}</div>`;
    const answer = reading;
    const poolReadings = kanjiCollectAllReadings(pool);
    const wrong = shuffle(poolReadings.filter((r) => r !== answer))
      .filter((y, idx, a) => a.indexOf(y) === idx)
      .slice(0, 3);
    const choices = shuffle([answer, ...wrong]).slice(0, 4);
    const choicesHtml = choices.map((c) => `<span class="choice-item">${escapeHtmlPrint(c)}</span>`).join('');
    const inner = `<div class="kanji-wrap">${line}
      <div class="emoji-question-prompt">「${escapeHtmlPrint(entry.char)}」の よみかたは どれですか。</div>
      <div class="choices-row">
        <span class="choice-label">こたえ：</span>
        ${choicesHtml}
      </div></div>`;
    return { html: inner, answer };
  }

  const marked = kanjiHtmlReadingAdvanced(sentence, entry.char, reading);
  const inner = `<div class="kanji-wrap"><div class="${lineClass}">${marked}</div></div>`;
  return { html: inner, answer: reading };
}

function buildKanjiWritingSentence(entry, sentence, reading, pool, level) {
  const lineClass = 'choice-sentence kanji-sentence-line kanji-sentence-line--prominent kanji-sentence-line--nowrap';

  if (level === 'beginner') {
    const marked = kanjiHtmlWritingBeginner(sentence, entry.char, reading);
    const inner = `<div class="kanji-wrap"><div class="${lineClass}">${marked}</div></div>`;
    return { html: inner, answer: entry.char };
  }

  if (level === 'intermediate') {
    const marked = kanjiHtmlWritingIntermediate(sentence, entry.char, reading);
    const line = `<div class="${lineClass}">${marked}</div>`;
    const answer = entry.char;
    const wrong = shuffle(pool.filter((e) => e.char !== answer))
      .map((e) => e.char)
      .filter((c, idx, a) => a.indexOf(c) === idx)
      .slice(0, 3);
    const choices = shuffle([answer, ...wrong]).slice(0, 4);
    const choicesHtml = choices.map((c) => `<span class="choice-item">${escapeHtmlPrint(c)}</span>`).join('');
    const inner = `<div class="kanji-wrap">${line}
      <div class="emoji-question-prompt">（　）に 入る かんじは どれですか。</div>
      <div class="choices-row">
        <span class="choice-label">こたえ：</span>
        ${choicesHtml}
      </div></div>`;
    return { html: inner, answer };
  }

  const marked = kanjiHtmlWritingAdvanced(sentence, entry.char, reading);
  const inner = `<div class="kanji-wrap"><div class="${lineClass}">${marked}</div></div>`;
  return { html: inner, answer: entry.char };
}

function buildKanjiByLevel(count, customPayload, _allowKatakana, _kanaMode, level) {
  const grade = customPayload && customPayload.kanjiGrade != null ? Number(customPayload.kanjiGrade) : 1;
  const mode = customPayload && customPayload.kanjiMode === 'writing' ? 'writing' : 'reading';
  const pool = getKanjiPool(grade, mode);
  if (!pool.length) return { cardHtmls: [], answers: [] };
  const data = pickRandom(pool, count);
  const diff = level || 'beginner';

  const answers = [];
  const cards = data.map((entry, i) => {
    const ctx = kanjiPickContext(entry);
    const sentence = ctx && ctx.sentence ? ctx.sentence : '';
    const rawReading = ctx && ctx.reading ? ctx.reading : '';
    const reading = resolveKanjiContextReading(entry.char, sentence, rawReading);
    if (!ctx || !sentence || !reading || sentence.indexOf(entry.char) === -1) {
      answers.push('');
      const inner = '<p class="emoji-question-prompt">データの 例文に かんじが ありません。</p>';
      return questionCard(i + 1, inner);
    }
    const built =
      mode === 'writing'
        ? buildKanjiWritingSentence(entry, sentence, reading, pool, diff)
        : buildKanjiReadingSentence(entry, sentence, reading, pool, diff);
    answers.push(built.answer);
    return questionCard(i + 1, built.html);
  });
  return { cardHtmls: cards, answers };
}

/* ─────────────────────────────────────────────
   問題本体ビルダー（コンテンツ×レベル）
───────────────────────────────────────────── */
function buildQuestionBodyStructured(content, level, count, customPayload, allowKatakana, kanaMode) {
  const genreClassMap = {
    joshi: 'joshi',
    hiragana: 'hiragana',
    maze: 'maze',
    maze_hiragana: 'maze-hiragana',
    sentence: 'sentence',
    narabikae: 'narabikae',
    kanji: 'kanji',
    custom: 'custom',
  };
  function withGenreClass(result, genreKey) {
    const genreClass = genreClassMap[genreKey] || String(genreKey || '').replace(/_/g, '-');
    if (!result || !Array.isArray(result.cardHtmls)) return result;
    return {
      ...result,
      cardHtmls: result.cardHtmls.map((html) => {
        if (html.includes(` question ${genreClass}`)) return html;
        return html.replace('class="question-card question"', `class="question-card question ${genreClass}"`);
      }),
    };
  }

  if (content === 'custom') {
    const words = Array.isArray(customPayload?.words)
      ? customPayload.words
          .map((w) => String(w || '').trim().slice(0, 15))
          .filter(Boolean)
      : [];
    if (!words.length) {
      return { cardHtmls: [], answers: [] };
    }
    const built = buildCustomTrace(count, words);
    return withGenreClass(built, content);
  }
  if (content === 'maze_hiragana') {
    return withGenreClass(buildHiraganaMazeByLevel(count, '', false, 'mix', level, 'all'), content);
  }
  const builders = {
    joshi: {
      beginner:     buildJoshiBeginner,
      intermediate: buildJoshiIntermediate,
      advanced:     buildJoshiAdvanced,
    },
    hiragana: {
      beginner:     buildHiraganaBeginner,
      intermediate: buildHiraganaIntermediate,
      advanced:     buildHiraganaAdvanced,
    },
    maze: {
      beginner: buildMazeByLevel,
      intermediate: buildMazeByLevel,
      advanced: buildMazeByLevel,
    },
    maze_hiragana: {
      beginner: buildHiraganaMazeByLevel,
      intermediate: buildHiraganaMazeByLevel,
      advanced: buildHiraganaMazeByLevel,
    },
    sentence: {
      beginner: buildSentenceBeginner,
      intermediate: buildSentenceIntermediate,
      advanced: buildSentenceAdvanced,
    },
    narabikae: {
      beginner: buildNarabikaeBeginner,
      intermediate: buildNarabikaeIntermediate,
      advanced: buildNarabikaeAdvanced,
    },
    kanji: {
      beginner: buildKanjiByLevel,
      intermediate: buildKanjiByLevel,
      advanced: buildKanjiByLevel,
    },
  };
  const built = builders[content][level](count, customPayload || '', !!allowKatakana, kanaMode || 'mix', level);
  return withGenreClass(built, content);
}

/** @deprecated 直接は使わず buildQuestionBodyStructured を優先 */
function buildQuestionBody(content, level, count, customWord) {
  return buildQuestionBodyStructured(content, level, count, customWord).cardHtmls;
}

/* ====================================================
   助詞
   ==================================================== */

function buildJoshiBeginner(count, _cw) {
  const data  = pickRandom(APP_DATA.joshi.beginner, count);
  const answers = data.map((q) => q.answer);
  const cards = data.map((q, i) => {
    const traceHtml = `
      <div class="trace-area">
        <span class="trace-char">${q.before}</span>
        <span class="trace-target">${q.answer}</span>
        <span class="trace-char">${q.after}</span>
      </div>
      <div class="trace-second-row">
        <span class="trace-second-label">もう一度かいてみよう →</span>
        <div class="write-box write-box-inline"></div>
      </div>`;
    return questionCard(i + 1, traceHtml);
  });
  return { cardHtmls: cards, answers };
}

function buildJoshiIntermediate(count, _cw) {
  const data  = pickRandom(APP_DATA.joshi.intermediate, count);
  const answers = data.map((q) => q.answer);
  const cards = data.map((q, i) => {
    const choicesHtml = q.choices.map(c =>
      `<span class="choice-item">${c}</span>`
    ).join('');
    const inner = `
      <div class="choice-sentence">${q.sentence}</div>
      <div class="choices-row">
        <span class="choice-label">こたえ：</span>
        ${choicesHtml}
      </div>`;
    return questionCard(i + 1, inner);
  });
  return { cardHtmls: cards, answers };
}

function buildJoshiAdvanced(count, _cw) {
  const data  = pickRandom(APP_DATA.joshi.advanced, count);
  const answers = data.map((q) => q.answer || '');
  const cards = data.map((q, i) => {
    const sentence = escapeHtmlPrint(q.sentence).replace(
      '（　）',
      '<span class="joshi-inline-blank" aria-hidden="true">（　　　）</span>'
    );
    const inner = `
      <div class="advanced-compact advanced-compact--joshi">
        <div class="desc-sentence">${sentence}</div>
      </div>`;
    return questionCard(i + 1, inner);
  });
  return { cardHtmls: cards, answers };
}

/* ====================================================
   ひらがな
   ==================================================== */

function buildHiraganaBeginner(count, customPayload, allowKatakana, kanaMode) {
  const setsPool = APP_DATA.hiragana.beginner_sets;
  const order =
    customPayload && customPayload.hiraganaSetOrder === 'random' ? 'random' : 'sequential';
  const rawSets =
    order === 'random'
      ? pickRandom(setsPool, count)
      : pickHiraganaBeginnerSetsOrdered(setsPool, count);
  /* 出題モードは UI の kanaMode を優先（ひらがなのみ／カタカナのみ／ミックス）。未指定時のみ checkbox 相当でフォールバック */
  const km = kanaMode || 'mix';
  let mode;
  if (km === 'hiragana' || km === 'katakana' || km === 'mix') {
    mode = km;
  } else {
    mode = allowKatakana ? km : 'hiragana';
  }
  const sets = rawSets.map((set, i) => {
    if (mode === 'katakana') return mapBeginnerSetToKatakana(set);
    if (mode === 'mix') {
      const useKata = i % 2 === 1;
      return useKata ? mapBeginnerSetToKatakana(set) : set;
    }
    return set;
  });
  const answers = sets.map((set) => `${set.group}：${set.chars.join('・')}`);
  const cards = sets.map((set, i) => {
    const katakana =
      mode === 'katakana' || (mode === 'mix' && i % 2 === 1);
    const groupCount = set.chars.length;
    const cellsHtml = set.chars
      .map((c) => buildBeginnerTraceCells(c, katakana))
      .join('');
    const inner = `
      <div class="hira-group-label">${set.group}</div>
      <div class="${beginnerGridClass(groupCount)}">${cellsHtml}</div>`;
    return questionCard(i + 1, inner);
  });
  return { cardHtmls: cards, answers };
}

function buildHiraganaIntermediate(count, _cw, allowKatakana) {
  const source = allowKatakana
    ? APP_DATA.hiragana.intermediate
    : filterOutKatakanaHiraganaIntermediate(APP_DATA.hiragana.intermediate);
  const data  = pickRandom(source, count);
  const answers = data.map((q) => q.word);
  const cards = data.map((q, i) => {
    const choicesHtml = q.choices.map(c =>
      `<span class="choice-item">${c}</span>`
    ).join('');
    const inner = `
      <div class="emoji-question-row">
        <span class="emoji-large">${q.emoji}</span>
        <div class="emoji-question-body">
          <div class="emoji-question-prompt">このえは なんという ことばですか？</div>
          <div class="choices-row">${choicesHtml}</div>
        </div>
      </div>`;
    return questionCard(i + 1, inner);
  });
  return { cardHtmls: cards, answers };
}

function buildHiraganaAdvanced(count, _cw, allowKatakana) {
  /* 上級：中級と同じ絵つき単語プールで、なぞり書き（初級型のマス） */
  const source = allowKatakana
    ? APP_DATA.hiragana.intermediate
    : filterOutKatakanaHiraganaIntermediate(APP_DATA.hiragana.intermediate);
  const data = pickRandom(source, count);
  const answers = data.map((q) => q.word);
  const cards = data.map((q, i) => {
    const boxes = q.word.split('').map((c) =>
      `<div class="seikatsu-char-col">
        <span class="seikatsu-trace">${c}</span>
        <div class="hira-write"></div>
      </div>`
    ).join('');
    const inner = `
      <div class="emoji-question-row emoji-question-row--tight">
        <span class="emoji-large">${q.emoji}</span>
        <div class="emoji-question-body">
          <div class="emoji-question-prompt">なぞってかこう</div>
          <div class="hiragana-advanced-trace-row">${boxes}</div>
        </div>
      </div>`;
    return questionCard(i + 1, inner);
  });
  return { cardHtmls: cards, answers };
}

/* ====================================================
   カスタム問題（入力語をすべて出題）
   ==================================================== */
function normalizeCustomWords(words) {
  return (Array.isArray(words) ? words : [])
    .map((w) => String(w || '').trim().slice(0, 15))
    .filter(Boolean);
}

function buildCustomWordSequence(words, count) {
  const base = normalizeCustomWords(words);
  if (!base.length) return [];
  const total = Math.max(count, base.length);
  const seq = [];
  for (let i = 0; i < total; i++) {
    seq.push(base[i % base.length]);
  }
  return seq;
}

function buildCustomTrace(count, words) {
  const seq = buildCustomWordSequence(words, count);
  const cards = seq.map((w, i) => {
    const charsHtml = [...w].map((c) => (c === ' '
      ? '<div class="seikatsu-char-gap" aria-hidden="true"></div>'
      : `<div class="seikatsu-char-col">
        <span class="seikatsu-trace">${escapeHtmlPrint(c)}</span>
        <div class="hira-write"></div>
      </div>`)
    ).join('');
    const inner = `
      <div class="emoji-question-row emoji-question-row--tight">
        <span class="emoji-large">✏️</span>
        <div class="emoji-question-body">
          <div>${charsHtml}</div>
        </div>
      </div>`;
    return questionCard(i + 1, inner);
  });
  return { cardHtmls: cards, answers: seq };
}

function buildCustomCopy(count, words) {
  const seq = buildCustomWordSequence(words, count);
  const cards = seq.map((w, i) => {
    const boxes = [...w].map((c) => (c === ' '
      ? '<div class="seikatsu-char-gap" aria-hidden="true"></div>'
      : '<div class="write-box write-box-tight"></div>')
    ).join('');
    const inner = `
      <div class="emoji-question-row">
        <span class="emoji-large">📝</span>
        <div class="emoji-question-body">
          <div class="emoji-question-prompt">おてほん：${escapeHtmlPrint(w)}</div>
          <div class="adv-prompt-sub">したの ますに ししゃ しましょう</div>
          <div class="adv-write-row">${boxes}</div>
        </div>
      </div>`;
    return questionCard(i + 1, inner);
  });
  return { cardHtmls: cards, answers: seq };
}

/* ── 共通：問題カード ── */
function questionCard(num, innerHtml) {
  return `<div class="question-card question">
    <div class="question-num">${num}</div>
    <div class="question-card-content">${innerHtml}</div>
  </div>`;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOne(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function createMazeCells(w, h) {
  return Array.from({ length: h }, () =>
    Array.from({ length: w }, () => ({ top: true, right: true, bottom: true, left: true }))
  );
}

function removeWall(cells, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 1) { cells[y1][x1].right = false; cells[y2][x2].left = false; }
  if (dx === -1) { cells[y1][x1].left = false; cells[y2][x2].right = false; }
  if (dy === 1) { cells[y1][x1].bottom = false; cells[y2][x2].top = false; }
  if (dy === -1) { cells[y1][x1].top = false; cells[y2][x2].bottom = false; }
}

function mazeNeighbors(x, y, w, h) {
  return [
    [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1],
  ].filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < w && ny < h);
}

function isConnected(cells, x1, y1, x2, y2) {
  if (x2 === x1 + 1) return !cells[y1][x1].right;
  if (x2 === x1 - 1) return !cells[y1][x1].left;
  if (y2 === y1 + 1) return !cells[y1][x1].bottom;
  if (y2 === y1 - 1) return !cells[y1][x1].top;
  return false;
}

function buildPerfectMaze(w, h) {
  const cells = createMazeCells(w, h);
  const visited = Array.from({ length: h }, () => Array(w).fill(false));
  const stack = [[randInt(0, w - 1), randInt(0, h - 1)]];
  visited[stack[0][1]][stack[0][0]] = true;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const nexts = shuffle(mazeNeighbors(x, y, w, h).filter(([nx, ny]) => !visited[ny][nx]));
    if (!nexts.length) {
      stack.pop();
      continue;
    }
    const [nx, ny] = nexts[0];
    removeWall(cells, x, y, nx, ny);
    visited[ny][nx] = true;
    stack.push([nx, ny]);
  }
  return cells;
}

function solveMazePath(cells, start, goal) {
  const h = cells.length;
  const w = cells[0].length;
  const q = [start];
  const seen = Array.from({ length: h }, () => Array(w).fill(false));
  const prev = Array.from({ length: h }, () => Array(w).fill(null));
  seen[start[1]][start[0]] = true;
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    if (x === goal[0] && y === goal[1]) break;
    mazeNeighbors(x, y, w, h).forEach(([nx, ny]) => {
      if (seen[ny][nx]) return;
      if (!isConnected(cells, x, y, nx, ny)) return;
      seen[ny][nx] = true;
      prev[ny][nx] = [x, y];
      q.push([nx, ny]);
    });
  }
  if (!seen[goal[1]][goal[0]]) return null;
  const path = [];
  let cur = goal;
  while (cur) {
    path.push(cur);
    const p = prev[cur[1]][cur[0]];
    cur = p;
  }
  return path.reverse();
}

function openExtraWalls(cells, amount) {
  const h = cells.length;
  const w = cells[0].length;
  for (let i = 0; i < amount; i++) {
    const x = randInt(0, w - 1);
    const y = randInt(0, h - 1);
    const n = pickOne(mazeNeighbors(x, y, w, h));
    removeWall(cells, x, y, n[0], n[1]);
  }
}

function buildBorderPoints(w, h) {
  const pts = [];
  for (let x = 0; x < w; x++) {
    pts.push({ x, y: 0, side: 'top' });
    pts.push({ x, y: h - 1, side: 'bottom' });
  }
  for (let y = 1; y < h - 1; y++) {
    pts.push({ x: 0, y, side: 'left' });
    pts.push({ x: w - 1, y, side: 'right' });
  }
  return pts;
}

function randomStartGoal(w, h) {
  const pts = buildBorderPoints(w, h);
  const start = pickOne(pts);
  let goal = pickOne(pts);
  let guard = 0;
  while (
    (goal.x === start.x && goal.y === start.y) ||
    (Math.abs(goal.x - start.x) + Math.abs(goal.y - start.y)) < Math.floor((w + h) * 0.8)
  ) {
    goal = pickOne(pts);
    guard += 1;
    if (guard > 120) break;
  }
  return { start, goal };
}

/** BFS でスタートからの最短ステップ数（隣接セル＝1）。未到達は -1。 */
function shortestStepDistances(cells, sx, sy, w, h) {
  const dist = Array.from({ length: h }, () => Array(w).fill(-1));
  const q = [[sx, sy]];
  dist[sy][sx] = 0;
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    const d = dist[y][x];
    mazeNeighbors(x, y, w, h).forEach(([nx, ny]) => {
      if (dist[ny][nx] !== -1) return;
      if (!isConnected(cells, x, y, nx, ny)) return;
      dist[ny][nx] = d + 1;
      q.push([nx, ny]);
    });
  }
  return dist;
}

/**
 * 境界上のスタートから、境界上で到達可能な最遠セルをゴールにする（最短経路が長くなりやすい）。
 * 数回ランダムスタートを試し、最良の（境界上の最大ステップ数）組を採用。
 */
function pickStartGoalLongBorderPath(cells, w, h) {
  const pts = buildBorderPoints(w, h);
  if (!pts.length) return randomStartGoal(w, h);
  let bestPair = null;
  let bestSteps = -1;
  const trials = Math.min(12, Math.max(6, Math.floor((w + h) / 3)));
  for (let t = 0; t < trials; t++) {
    const startPt = pickOne(pts);
    const distMap = shortestStepDistances(cells, startPt.x, startPt.y, w, h);
    for (const g of pts) {
      if (g.x === startPt.x && g.y === startPt.y) continue;
      const s = distMap[g.y][g.x];
      if (s < 0) continue;
      if (s > bestSteps) {
        bestSteps = s;
        bestPair = { start: startPt, goal: g };
      }
    }
  }
  if (bestPair) return bestPair;
  return randomStartGoal(w, h);
}

function getMazeDifficultyProfile(level) {
  const lv = level || 'beginner';
  const map = {
    beginner: {
      minPathLen: 16,
      minBranchOnPath: 2,
      maxBranchOnPath: 14,
      maxDeadEnds: 28,
      minTurnCount: 6,
      minMisleadCount: 3,
      maxPathRatio: 0.62,
      extraOpenRange: [5, 10],
    },
    intermediate: {
      minPathLen: 24,
      minBranchOnPath: 5,
      maxBranchOnPath: 22,
      minDeadEnds: 8,
      minTurnCount: 10,
      minMisleadCount: 6,
      maxPathRatio: 0.5,
      extraOpenRange: [8, 16],
    },
    advanced: {
      minPathLen: 34,
      minBranchOnPath: 9,
      minDeadEnds: 14,
      minTurnCount: 14,
      minMisleadCount: 10,
      maxPathRatio: 0.42,
      extraOpenRange: [12, 22],
    },
  };
  return map[lv] || map.beginner;
}

function mazeCellDegree(cells, x, y) {
  const h = cells.length;
  const w = cells[0].length;
  return mazeNeighbors(x, y, w, h).filter(([nx, ny]) => isConnected(cells, x, y, nx, ny)).length;
}

function countReachableCells(cells, start) {
  const h = cells.length;
  const w = cells[0].length;
  const seen = Array.from({ length: h }, () => Array(w).fill(false));
  const q = [[start[0], start[1]]];
  seen[start[1]][start[0]] = true;
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    mazeNeighbors(x, y, w, h).forEach(([nx, ny]) => {
      if (seen[ny][nx]) return;
      if (!isConnected(cells, x, y, nx, ny)) return;
      seen[ny][nx] = true;
      q.push([nx, ny]);
    });
  }
  return q.length;
}

function countPathTurns(path) {
  if (!path || path.length < 3) return 0;
  let turns = 0;
  let prevDx = path[1][0] - path[0][0];
  let prevDy = path[1][1] - path[0][1];
  for (let i = 2; i < path.length; i++) {
    const dx = path[i][0] - path[i - 1][0];
    const dy = path[i][1] - path[i - 1][1];
    if (dx !== prevDx || dy !== prevDy) turns += 1;
    prevDx = dx;
    prevDy = dy;
  }
  return turns;
}

function getMazeMetrics(cells, path, start, goal) {
  const pathSet = new Set(path.map(([x, y]) => `${x},${y}`));
  const reachableCount = countReachableCells(cells, [start.x, start.y]);
  let branchOnPath = 0;
  let deadEnds = 0;
  let misleadCount = 0;
  for (let y = 0; y < cells.length; y++) {
    for (let x = 0; x < cells[0].length; x++) {
      const d = mazeCellDegree(cells, x, y);
      const key = `${x},${y}`;
      const onPath = pathSet.has(key);
      if (onPath && d >= 3) branchOnPath += 1;
      if (d === 1) {
        deadEnds += 1;
        if (!onPath && !(x === start.x && y === start.y) && !(x === goal.x && y === goal.y)) {
          misleadCount += 1;
        }
      }
    }
  }
  return {
    routeLength: path.length,
    branchCount: branchOnPath,
    deadEndCount: deadEnds,
    turnCount: countPathTurns(path),
    misleadCount,
    routeRatio: reachableCount > 0 ? path.length / reachableCount : 1,
  };
}

function passesMazeDifficulty(profile, metrics, relaxStage) {
  const relax = Math.max(0, relaxStage | 0);
  const minPathLen = Math.max(10, profile.minPathLen - relax * 3);
  const minBranch = Math.max(0, (profile.minBranchOnPath || 0) - relax * 2);
  const minDeadEnds = Math.max(0, (profile.minDeadEnds || 0) - relax * 2);
  const minTurns = Math.max(2, (profile.minTurnCount || 2) - relax * 2);
  const minMislead = Math.max(0, (profile.minMisleadCount || 0) - relax * 2);
  const maxBranch = profile.maxBranchOnPath == null ? Infinity : profile.maxBranchOnPath + relax * 4;
  const maxDeadEnds = profile.maxDeadEnds == null ? Infinity : profile.maxDeadEnds + relax * 5;
  const maxRatio = profile.maxPathRatio == null ? 1 : profile.maxPathRatio + relax * 0.08;
  if (metrics.routeLength < minPathLen) return false;
  if (metrics.branchCount < minBranch) return false;
  if (metrics.branchCount > maxBranch) return false;
  if (metrics.deadEndCount < minDeadEnds) return false;
  if (metrics.deadEndCount > maxDeadEnds) return false;
  if (metrics.turnCount < minTurns) return false;
  if (metrics.misleadCount < minMislead) return false;
  if (metrics.routeRatio > maxRatio) return false;
  return true;
}

function isGoalReachableSkippingPoint(cells, start, goal, blocked) {
  const h = cells.length;
  const w = cells[0].length;
  const [bx, by] = blocked;
  if ((start[0] === bx && start[1] === by) || (goal[0] === bx && goal[1] === by)) return false;
  const seen = Array.from({ length: h }, () => Array(w).fill(false));
  const q = [[start[0], start[1]]];
  seen[start[1]][start[0]] = true;
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    if (x === goal[0] && y === goal[1]) return true;
    mazeNeighbors(x, y, w, h).forEach(([nx, ny]) => {
      if (seen[ny][nx]) return;
      if (nx === bx && ny === by) return;
      if (!isConnected(cells, x, y, nx, ny)) return;
      seen[ny][nx] = true;
      q.push([nx, ny]);
    });
  }
  return false;
}

function pickEvenlySpacedPoints(points, count) {
  if (!Array.isArray(points) || points.length < count || count <= 0) return null;
  if (count === 1) return [points[Math.floor(points.length / 2)]];
  const out = [];
  let prev = -1;
  for (let i = 0; i < count; i++) {
    const raw = Math.floor((i * (points.length - 1)) / (count - 1));
    const idx = Math.max(prev + 1, Math.min(raw, points.length - (count - i)));
    out.push(points[idx]);
    prev = idx;
  }
  return out;
}

function buildRequiredPointPlacements(model, word) {
  const chars = [...word];
  if (!chars.length || !model || !Array.isArray(model.path)) return null;
  const path = model.path;
  if (path.length < chars.length + 3) return null;
  const start = [model.start.x, model.start.y];
  const goal = [model.goal.x, model.goal.y];
  const mandatoryPathPoints = [];
  for (let i = 2; i <= path.length - 3; i++) {
    const p = path[i];
    if (!isGoalReachableSkippingPoint(model.cells, start, goal, p)) {
      mandatoryPathPoints.push(p);
    }
  }
  const selected = pickEvenlySpacedPoints(mandatoryPathPoints, chars.length);
  if (!selected) return null;
  const placements = selected.map((p, idx) => ({ x: p[0], y: p[1], char: chars[idx] }));
  return { placements, requiredPoints: selected };
}

function getGoalReachIndexStates(cells, start, goal, requiredPoints) {
  const h = cells.length;
  const w = cells[0].length;
  const req = requiredPoints || [];
  const k = req.length;
  const reqIndexMap = new Map(req.map((p, i) => [`${p[0]},${p[1]}`, i]));
  const seen = Array.from({ length: h }, () => Array.from({ length: w }, () => Array(k + 1).fill(false)));
  const q = [[start[0], start[1], 0]];
  seen[start[1]][start[0]][0] = true;
  const goalStates = new Set();
  for (let i = 0; i < q.length; i++) {
    const [x, y, idx] = q[i];
    if (x === goal[0] && y === goal[1]) goalStates.add(idx);
    mazeNeighbors(x, y, w, h).forEach(([nx, ny]) => {
      if (!isConnected(cells, x, y, nx, ny)) return;
      let nextIdx = idx;
      const reqPos = reqIndexMap.get(`${nx},${ny}`);
      if (reqPos === idx) nextIdx = idx + 1;
      if (seen[ny][nx][nextIdx]) return;
      seen[ny][nx][nextIdx] = true;
      q.push([nx, ny, nextIdx]);
    });
  }
  return goalStates;
}

function validateHiraganaRouteConstraints(model, requiredPoints) {
  if (!model || !model.cells || !model.start || !model.goal) return false;
  const goalStates = getGoalReachIndexStates(
    model.cells,
    [model.start.x, model.start.y],
    [model.goal.x, model.goal.y],
    requiredPoints || []
  );
  const reqLen = (requiredPoints || []).length;
  return goalStates.size === 1 && goalStates.has(reqLen);
}

function buildMazeModel(level, mazeType, requireMinPathLen) {
  const confByLevel = {
    beginner: { w: 12, h: 9, cell: 30, width: [4.1, 6.0] },
    intermediate: { w: 14, h: 10, cell: 28, width: [3.7, 5.4] },
    advanced: { w: 16, h: 12, cell: 26, width: [3.3, 4.9] },
  };
  const profile = getMazeDifficultyProfile(level);
  const [extraMin, extraMax] = profile.extraOpenRange || [8, 14];
  const typeExtra = { normal: 2, soft: 4, curve: 4, distort: 3, single: -2, branchy: 7, trap: 11 };
  const base = { ...(confByLevel[level] || confByLevel.beginner) };
  if (mazeType === 'single') {
    base.w = Math.max(10, base.w - 2);
    base.h = Math.max(8, base.h - 2);
  }
  if (mazeType === 'branchy' || mazeType === 'trap') {
    base.w += 1;
    base.h += 1;
  }
  for (let attempt = 0; attempt < 18; attempt++) {
    const cells = buildPerfectMaze(base.w, base.h);
    const relaxStage = attempt < 8 ? 0 : attempt < 13 ? 1 : 2;
    const extra = randInt(
      Math.max(0, extraMin + (typeExtra[mazeType] || 0)),
      Math.max(0, extraMax + (typeExtra[mazeType] || 0))
    );
    openExtraWalls(cells, extra);
    const { start, goal } = pickStartGoalLongBorderPath(cells, base.w, base.h);
    const path = solveMazePath(cells, [start.x, start.y], [goal.x, goal.y]);
    if (!path) continue;
    if (requireMinPathLen && path.length < requireMinPathLen) continue;
    const metrics = getMazeMetrics(cells, path, start, goal);
    if (!passesMazeDifficulty(profile, metrics, relaxStage)) continue;
    return {
      w: base.w,
      h: base.h,
      cell: base.cell,
      strokeWidth: randInt(Math.round(base.width[0] * 10), Math.round(base.width[1] * 10)) / 10,
      type: mazeType === 'curve' ? 'soft' : mazeType,
      cells,
      start,
      goal,
      path,
      metrics,
    };
  }
  return null;
}

function buildMazeEmergencyModel(level) {
  const confByLevel = {
    beginner: { w: 12, h: 9, cell: 30, width: [4.1, 6.0] },
    intermediate: { w: 14, h: 10, cell: 28, width: [3.7, 5.4] },
    advanced: { w: 16, h: 12, cell: 26, width: [3.3, 4.9] },
  };
  const base = { ...(confByLevel[level] || confByLevel.beginner) };
  const cells = buildPerfectMaze(base.w, base.h);
  openExtraWalls(cells, 6);
  const { start, goal } = pickStartGoalLongBorderPath(cells, base.w, base.h);
  const path = solveMazePath(cells, [start.x, start.y], [goal.x, goal.y]);
  if (!path) return null;
  return {
    w: base.w,
    h: base.h,
    cell: base.cell,
    strokeWidth: randInt(Math.round(base.width[0] * 10), Math.round(base.width[1] * 10)) / 10,
    type: 'normal',
    cells,
    start,
    goal,
    path,
  };
}

function getNodeOffsetMap(w, h, cell, intensity) {
  const map = [];
  for (let y = 0; y <= h; y++) {
    const row = [];
    for (let x = 0; x <= w; x++) {
      const edge = x === 0 || y === 0 || x === w || y === h;
      const amp = edge ? 0 : cell * intensity;
      row.push([amp ? (Math.random() * amp * 2 - amp) : 0, amp ? (Math.random() * amp * 2 - amp) : 0]);
    }
    map.push(row);
  }
  return map;
}

function pointWithOffset(x, y, pad, cell, offsetMap, originX, originY) {
  const ox = offsetMap ? offsetMap[y][x][0] : 0;
  const oy = offsetMap ? offsetMap[y][x][1] : 0;
  return [originX + pad + x * cell + ox, originY + pad + y * cell + oy];
}

function wallSegmentPath(x1, y1, x2, y2, smooth) {
  if (!smooth) return `M${x1} ${y1} L${x2} ${y2}`;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return `M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`;
}

function getMazeLabelProfile() {
  let width = 1200;
  let ua = '';
  try {
    width = window.innerWidth || 1200;
    ua = navigator.userAgent || '';
  } catch (_e) {
    // ignore
  }
  const isIPhone = /iPhone/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isMobileWidth = width <= 768;
  if (isIPhone && isMobileWidth) {
    return { offsetCoef: 0.98, edgePadX: 28, edgePadY: 14 };
  }
  if (isAndroid && isMobileWidth) {
    return { offsetCoef: 1.04, edgePadX: 26, edgePadY: 13 };
  }
  if (isMobileWidth) {
    return { offsetCoef: 1.0, edgePadX: 26, edgePadY: 13 };
  }
  return { offsetCoef: 0.9, edgePadX: 24, edgePadY: 12 };
}

function buildMazeSvgWithLetters(model, lettersOnPath) {
  const pad = 2;
  const labelPad = Math.max(10, Math.floor(model.cell * 0.55));
  const mazeWidth = model.w * model.cell + pad * 2;
  const mazeHeight = model.h * model.cell + pad * 2;
  const width = mazeWidth + labelPad * 2;
  const height = mazeHeight + labelPad * 2;
  const originX = labelPad;
  const originY = labelPad;
  const smooth = model.type === 'soft' || model.type === 'single';
  const distort = model.type === 'distort';
  const offsetMap = distort ? getNodeOffsetMap(model.w, model.h, model.cell, 0.1) : null;
  const wallPaths = [];
  const shouldSkipBorderWall = (x, y, side) =>
    (model.start.x === x && model.start.y === y && model.start.side === side) ||
    (model.goal.x === x && model.goal.y === y && model.goal.side === side);

  for (let y = 0; y < model.h; y++) {
    for (let x = 0; x < model.w; x++) {
      const c = model.cells[y][x];
      if (c.top && !shouldSkipBorderWall(x, y, 'top')) {
        const a = pointWithOffset(x, y, pad, model.cell, offsetMap, originX, originY);
        const b = pointWithOffset(x + 1, y, pad, model.cell, offsetMap, originX, originY);
        wallPaths.push(wallSegmentPath(a[0], a[1], b[0], b[1], smooth));
      }
      if (c.left && !shouldSkipBorderWall(x, y, 'left')) {
        const a = pointWithOffset(x, y, pad, model.cell, offsetMap, originX, originY);
        const b = pointWithOffset(x, y + 1, pad, model.cell, offsetMap, originX, originY);
        wallPaths.push(wallSegmentPath(a[0], a[1], b[0], b[1], smooth));
      }
      if (x === model.w - 1 && c.right && !shouldSkipBorderWall(x, y, 'right')) {
        const a = pointWithOffset(x + 1, y, pad, model.cell, offsetMap, originX, originY);
        const b = pointWithOffset(x + 1, y + 1, pad, model.cell, offsetMap, originX, originY);
        wallPaths.push(wallSegmentPath(a[0], a[1], b[0], b[1], smooth));
      }
      if (y === model.h - 1 && c.bottom && !shouldSkipBorderWall(x, y, 'bottom')) {
        const a = pointWithOffset(x, y + 1, pad, model.cell, offsetMap, originX, originY);
        const b = pointWithOffset(x + 1, y + 1, pad, model.cell, offsetMap, originX, originY);
        wallPaths.push(wallSegmentPath(a[0], a[1], b[0], b[1], smooth));
      }
    }
  }
  const center = (cx, cy) => {
    const a = pointWithOffset(cx, cy, pad, model.cell, offsetMap, originX, originY);
    const b = pointWithOffset(cx + 1, cy + 1, pad, model.cell, offsetMap, originX, originY);
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  };
  const s = center(model.start.x, model.start.y);
  const g = center(model.goal.x, model.goal.y);
  const letters = (lettersOnPath || []).map((m) => {
    const p = center(m.x, m.y);
    return `<text class="maze-char-on-path" x="${p[0]}" y="${p[1]}" text-anchor="middle" dominant-baseline="middle">${escapeHtmlPrint(m.char)}</text>`;
  }).join('');
  const cls = model.type === 'soft' ? 'maze-walls maze-walls--curve' : 'maze-walls';
  const labelProfile = getMazeLabelProfile();
  const labelPos = (p) => {
    const c = center(p.x, p.y);
    const m = model.cell * labelProfile.offsetCoef;
    if (p.side === 'top') return [c[0], Math.max(labelProfile.edgePadY, c[1] - m)];
    if (p.side === 'bottom') return [c[0], Math.min(height - labelProfile.edgePadY, c[1] + m)];
    if (p.side === 'left') return [Math.max(labelProfile.edgePadX, c[0] - m), c[1]];
    return [Math.min(width - labelProfile.edgePadX, c[0] + m), c[1]];
  };
  const sl = labelPos(model.start);
  const gl = labelPos(model.goal);
  return `<svg class="maze-svg maze-type-${model.type}" viewBox="0 0 ${width} ${height}" role="img" aria-label="めいろ">
    <path class="${cls}" style="stroke-width:${model.strokeWidth}" d="${wallPaths.join(' ')}"></path>
    <circle class="maze-start" cx="${s[0]}" cy="${s[1]}" r="8"></circle>
    <rect class="maze-goal" x="${g[0] - 8}" y="${g[1] - 8}" width="16" height="16" rx="2"></rect>
    <text class="maze-label maze-label--start" x="${sl[0]}" y="${sl[1]}" text-anchor="middle" dominant-baseline="middle">スタート</text>
    <text class="maze-label maze-label--goal" x="${gl[0]}" y="${gl[1]}" text-anchor="middle" dominant-baseline="middle">ゴール</text>
    ${letters}
  </svg>`;
}

function buildMazeByLevel(count, _cw, _allowKatakana, _kanaMode, levelArg, forcedType) {
  const level = levelArg || 'beginner';
  const typePoolByLevel = {
    beginner: ['normal', 'soft'],
    intermediate: ['normal', 'soft'],
    advanced: ['normal', 'soft'],
  };
  const cards = [];
  const answers = [];
  const minLenByLevel = level === 'beginner' ? 17 : level === 'intermediate' ? 22 : 28;
  const totalTarget = Math.max(0, Number(count) || 0);
  const maxAttempts = Math.max(totalTarget * 60, 160);
  let attempts = 0;

  while (cards.length < totalTarget && attempts < maxAttempts) {
    attempts += 1;
    const startedAt = Date.now();
    const progress = cards.length / Math.max(1, totalTarget);
    const depth = attempts < maxAttempts * 0.45 ? 0 : attempts < maxAttempts * 0.78 ? 1 : 2;
    const fallbackLevel = depth >= 2 && progress < 0.7 ? 'beginner' : level;
    const typePool = typePoolByLevel[fallbackLevel] || typePoolByLevel.beginner;
    const mazeType = forcedType || pickOne(typePool);
    const minLen =
      depth === 0
        ? minLenByLevel
        : depth === 1
          ? Math.max(12, minLenByLevel - 4)
          : Math.max(9, minLenByLevel - 8);
    const model = buildMazeModel(fallbackLevel, mazeType, minLen);
    if (!model) continue;
    const idx = cards.length + 1;
    const svg = buildMazeSvgWithLetters(model);
    cards.push(questionCard(idx, `<div class="maze-card maze-card--normal">${svg}</div>`));
    answers.push(`めいろ${idx}：経路長 ${model.path.length}`);
    console.info('[maze-gen]', {
      difficulty: level,
      routeLength: model.metrics?.routeLength || model.path.length,
      branchCount: model.metrics?.branchCount || 0,
      deadEndCount: model.metrics?.deadEndCount || 0,
      generationTimeMs: Date.now() - startedAt,
      hiraganaRequiredPointsCount: 0,
      hiraganaValidationPassed: true,
    });
  }

  if (cards.length < totalTarget) {
    console.warn(
      `[maze] generation shortage ${cards.length}/${totalTarget}; filling with emergency fallback`
    );
  }
  while (cards.length < totalTarget) {
    const idx = cards.length + 1;
    const model =
      buildMazeModel('beginner', 'normal', 0) ||
      buildMazeModel(level, 'normal', 0) ||
      buildMazeModel('beginner', 'soft', 0) ||
      buildMazeEmergencyModel(level);
    if (!model) {
      console.error('[maze] emergency fallback failed');
      break;
    }
    const svg = buildMazeSvgWithLetters(model);
    cards.push(questionCard(idx, `<div class="maze-card maze-card--normal">${svg}</div>`));
    answers.push(`めいろ${idx}：経路長 ${model.path.length}`);
    console.info('[maze-gen]', {
      difficulty: level,
      routeLength: model.path.length,
      branchCount: model.metrics?.branchCount || 0,
      deadEndCount: model.metrics?.deadEndCount || 0,
      generationTimeMs: 0,
      hiraganaRequiredPointsCount: 0,
      hiraganaValidationPassed: true,
    });
  }
  return { cardHtmls: cards, answers };
}

const HIRAGANA_MAZE_WORDS = {
  food: [
    'かれーらいす', 'はんばーぐ', 'らーめん', 'おすし', 'やきとり', 'たこやき', 'おにぎり', 'ぱん',
    'ぴざ', 'どーなつ', 'あいすくりーむ', 'かきごおり', 'かまめし', 'おむらいす', 'ぎょうざ', 'やきそば',
    'てんぷら', 'うどん', 'おでん', 'ちゃーはん', 'からあげ', 'みそしる', 'しちゅー', 'ぐらたん',
    'ほっとけーき', 'くっきー', 'ぷりん', 'おべんとう', 'たまごやき', 'とんかつ',
  ],
  fruit: [
    'すいか', 'いちご', 'みかん', 'りんご', 'ばなな', 'ぶどう', 'さくらんぼ', 'めろん', 'もも',
    'なし', 'ぱいなっぷる', 'きうい', 'れもん', 'かき', 'まんごー', 'ぶるーべりー',
  ],
  vehicle: [
    'でんしゃ', 'しんかんせん', 'どくたーいえろー', 'ばす', 'たくしー', 'ぱとかー', 'しょうぼうしゃ',
    'だんぷかー', 'とらっく', 'ひこうき', 'へりこぷたー', 'ふね', 'じてんしゃ', 'きゅうきゅうしゃ',
    'みにかー', 'ろーぷうぇい', 'ごんどら', 'よっと',
  ],
  animal: [
    'いぬ', 'ねこ', 'うさぎ', 'ぞう', 'きりん', 'らいおん', 'くま', 'ぱんだ', 'さる', 'とり',
    'ぺんぎん', 'いるか', 'こあら', 'しまうま', 'かば', 'りす', 'きつね', 'たぬき',
    'しろくま', 'うま', 'ひつじ', 'やぎ', 'ふくろう', 'わに',
  ],
};

let LAST_HIRAGANA_MAZE_CATEGORY = '';
let LAST_HIRAGANA_MAZE_WORD = '';
const HIRAGANA_CATEGORY_LABEL_JA = {
  food: 'たべもの',
  fruit: 'くだもの',
  animal: 'どうぶつ',
  vehicle: 'のりもの',
  transport: 'のりもの',
};

function pickHiraganaMazeWord(categoryArg) {
  const keys = categoryArg && categoryArg !== 'all' && HIRAGANA_MAZE_WORDS[categoryArg]
    ? [categoryArg]
    : Object.keys(HIRAGANA_MAZE_WORDS);
  let catPool = [...keys];
  if (catPool.length > 1 && LAST_HIRAGANA_MAZE_CATEGORY) {
    catPool = catPool.filter((k) => k !== LAST_HIRAGANA_MAZE_CATEGORY);
    if (!catPool.length) catPool = [...keys];
  }
  const cat = pickOne(catPool);
  let words = [...HIRAGANA_MAZE_WORDS[cat]];
  if (words.length > 1 && LAST_HIRAGANA_MAZE_WORD) {
    words = words.filter((w) => w !== LAST_HIRAGANA_MAZE_WORD);
    if (!words.length) words = [...HIRAGANA_MAZE_WORDS[cat]];
  }
  const word = pickOne(words);
  LAST_HIRAGANA_MAZE_CATEGORY = cat;
  LAST_HIRAGANA_MAZE_WORD = word;
  return { category: cat, word };
}

function buildPathLetterPlacements(path, word) {
  if (!path || path.length < word.length + 2) return null;
  const chars = [...word];
  const placements = [];
  const first = 1;
  const last = path.length - 2;
  const span = last - first;
  for (let i = 0; i < chars.length; i++) {
    const idx = first + Math.round((span * i) / Math.max(1, chars.length - 1));
    const p = path[idx];
    placements.push({ x: p[0], y: p[1], char: chars[i] });
  }
  return placements;
}

function pickWordFitPath(category, maxLen) {
  const base =
    category && HIRAGANA_MAZE_WORDS[category]
      ? HIRAGANA_MAZE_WORDS[category]
      : Object.values(HIRAGANA_MAZE_WORDS).flat();
  const allowed = base.filter((w) => [...String(w || '')].length <= maxLen);
  if (allowed.length) return pickOne(allowed);
  const shortest = [...base].sort((a, b) => [...a].length - [...b].length)[0] || 'ことば';
  const chars = [...shortest];
  return chars.slice(0, Math.max(1, maxLen)).join('');
}

function buildHiraganaMazeByLevel(count, _cw, _allowKatakana, _kanaMode, levelArg, categoryArg) {
  const level = levelArg || 'beginner';
  const cards = [];
  const answers = [];
  const totalTarget = Math.max(0, Number(count) || 0);
  const maxAttempts = Math.max(totalTarget * 70, 220);
  let attempts = 0;

  while (cards.length < totalTarget && attempts < maxAttempts) {
    attempts += 1;
    const startedAt = Date.now();
    const progress = cards.length / Math.max(1, totalTarget);
    const depth = attempts < maxAttempts * 0.4 ? 0 : attempts < maxAttempts * 0.75 ? 1 : 2;
    const picked = pickHiraganaMazeWord(categoryArg);
    const baseWord = picked.word;
    const minPath =
      depth === 0
        ? [...baseWord].length + 10
        : depth === 1
          ? [...baseWord].length + 6
          : [...baseWord].length + 3;
    const fallbackLevel = depth >= 2 && progress < 0.65 ? 'beginner' : level;
    const model = buildMazeModel(fallbackLevel, pickOne(['normal', 'soft']), Math.max(8, minPath));
    if (!model || !model.path) continue;

    const maxWordLen = Math.max(1, model.path.length - 3);
    const word =
      [...baseWord].length <= maxWordLen ? baseWord : pickWordFitPath(picked.category, maxWordLen);
    const placement = buildRequiredPointPlacements(model, word);
    if (!placement) continue;
    const validationPassed = validateHiraganaRouteConstraints(model, placement.requiredPoints);
    if (!validationPassed) continue;

    const idx = cards.length + 1;
    const svg = buildMazeSvgWithLetters(model, placement.placements);
    const boxes = [...word]
      .map(() => '<div class="maze-answer-box"></div>')
      .join('');
    cards.push(questionCard(idx, `<div class="maze-card maze-card--hiragana">${svg}<div class="maze-answer-row">${boxes}</div></div>`));
    const catJa = HIRAGANA_CATEGORY_LABEL_JA[picked.category] || picked.category;
    answers.push(`${word}（${catJa}）`);
    console.info('[maze-gen]', {
      difficulty: level,
      routeLength: model.metrics?.routeLength || model.path.length,
      branchCount: model.metrics?.branchCount || 0,
      deadEndCount: model.metrics?.deadEndCount || 0,
      generationTimeMs: Date.now() - startedAt,
      hiraganaRequiredPointsCount: placement.requiredPoints.length,
      hiraganaValidationPassed: validationPassed,
    });
  }

  if (cards.length < totalTarget) {
    console.warn(
      `[maze_hiragana] generation shortage ${cards.length}/${totalTarget}; filling with emergency fallback`
    );
  }
  while (cards.length < totalTarget) {
    const picked = pickHiraganaMazeWord(categoryArg);
    const model =
      buildMazeModel('beginner', 'normal', 0) ||
      buildMazeModel(level, 'normal', 0) ||
      buildMazeModel('beginner', 'soft', 0) ||
      buildMazeEmergencyModel(level);
    if (!model || !model.path) {
      console.error('[maze_hiragana] emergency fallback failed');
      break;
    }
    const maxWordLen = Math.max(1, model.path.length - 3);
    const word = pickWordFitPath(picked.category, maxWordLen);
    const placement = buildRequiredPointPlacements(model, word);
    if (!placement) break;
    const validationPassed = validateHiraganaRouteConstraints(model, placement.requiredPoints);
    if (!validationPassed) break;
    const idx = cards.length + 1;
    const svg = buildMazeSvgWithLetters(model, placement.placements);
    const boxes = [...word]
      .map(() => '<div class="maze-answer-box"></div>')
      .join('');
    cards.push(questionCard(idx, `<div class="maze-card maze-card--hiragana">${svg}<div class="maze-answer-row">${boxes}</div></div>`));
    const catJa = HIRAGANA_CATEGORY_LABEL_JA[picked.category] || picked.category;
    answers.push(`${word}（${catJa}）`);
    console.info('[maze-gen]', {
      difficulty: level,
      routeLength: model.path.length,
      branchCount: model.metrics?.branchCount || 0,
      deadEndCount: model.metrics?.deadEndCount || 0,
      generationTimeMs: 0,
      hiraganaRequiredPointsCount: placement.requiredPoints.length,
      hiraganaValidationPassed: validationPassed,
    });
  }
  return { cardHtmls: cards, answers };
}

const SENTENCE_WHERE = ['こうえん', 'がっこう', 'いえ', 'どうぶつえん', 'うみ', 'みち', 'きょうしつ', 'こうてい'];
const SENTENCE_SUBJECTS = [
  { word: 'おとこのこ', kind: 'human' },
  { word: 'おんなのこ', kind: 'human' },
  { word: 'せんせい', kind: 'human' },
  { word: 'いぬ', kind: 'animal' },
  { word: 'ねこ', kind: 'animal' },
  { word: 'とり', kind: 'animal' },
  { word: 'おかあさん', kind: 'human' },
  { word: 'おとうさん', kind: 'human' },
];
const SENTENCE_ACTIONS = [
  { text: 'あそんでいます', allow: ['human', 'animal'] },
  { text: 'はしっています', allow: ['human', 'animal'] },
  { text: 'あるいています', allow: ['human', 'animal'] },
  { text: 'ねています', allow: ['human', 'animal'] },
  { text: 'たべています', allow: ['human', 'animal'] },
  { text: 'よんでいます', allow: ['human'] },
  { text: 'みています', allow: ['human', 'animal'] },
  { text: 'べんきょうしています', allow: ['human'] },
];

function buildSentenceScene() {
  const where = pickOne(SENTENCE_WHERE);
  const subject = pickOne(SENTENCE_SUBJECTS);
  const action = pickOne(SENTENCE_ACTIONS.filter((a) => a.allow.includes(subject.kind)));
  return {
    where,
    who: subject.word,
    action: action.text,
    sentence: `${where}で ${subject.word}が ${action.text}。`,
  };
}

function pickUniqueScenes(n) {
  const out = [];
  const used = new Set();
  let guard = 0;
  while (out.length < n && guard < n * 20) {
    const s = buildSentenceScene();
    const sig = `${s.where}|${s.who}|${s.action}`;
    if (!used.has(sig)) {
      used.add(sig);
      out.push(s);
    }
    guard += 1;
  }
  while (out.length < n) out.push(buildSentenceScene());
  return out;
}

function buildThreeChoices(correct, pool) {
  const wrong = shuffle(pool.filter((v) => v !== correct)).slice(0, 2);
  return shuffle([correct, ...wrong]);
}

function buildSentenceBeginner(count, payload) {
  const trialSet = [
    { where: 'こうえん', who: 'おとこのこ', action: 'あそんでいます', sentence: 'こうえんで おとこのこが あそんでいます。' },
    { where: 'いえ', who: 'いぬ', action: 'ねています', sentence: 'いえで いぬが ねています。' },
    { where: 'がっこう', who: 'せんせい', action: 'よんでいます', sentence: 'がっこうで せんせいが よんでいます。' },
    { where: 'みち', who: 'ねこ', action: 'あるいています', sentence: 'みちで ねこが あるいています。' },
    { where: 'こうてい', who: 'おんなのこ', action: 'はしっています', sentence: 'こうていで おんなのこが はしっています。' },
  ];
  let scenes = payload && payload.sentenceTrialQuality
    ? trialSet.slice(0, Math.min(count, trialSet.length))
    : pickUniqueScenes(count);
  if (scenes.length < count) {
    scenes = scenes.concat(pickUniqueScenes(count - scenes.length));
  }
  const qKinds = ['who', 'where', 'action'];
  const cards = scenes.map((s, i) => {
    const qKind = qKinds[i % qKinds.length];
    const questionText =
      qKind === 'who' ? 'だれが？' : qKind === 'where' ? 'どこで？' : 'なにをしている？';
    const choicePool =
      qKind === 'who'
        ? SENTENCE_SUBJECTS.map((x) => x.word)
        : qKind === 'where'
          ? SENTENCE_WHERE
          : SENTENCE_ACTIONS.map((x) => x.text);
    const correct = qKind === 'who' ? s.who : qKind === 'where' ? s.where : s.action;
    const choices = buildThreeChoices(correct, choicePool);
    const choicesHtml = choices.map((c) => `<span class="choice-item">${c}</span>`).join('');
    const inner = `<div class="choice-sentence">${s.sentence}</div>
      <div class="emoji-question-prompt">しつもん：${questionText}</div>
      <div class="choices-row">${choicesHtml}</div>`;
    return questionCard(i + 1, inner);
  });
  const answers = scenes.map((s, i) => {
    const qKind = qKinds[i % qKinds.length];
    return qKind === 'who' ? s.who : qKind === 'where' ? s.where : s.action;
  });
  return { cardHtmls: cards, answers };
}

function buildSentenceIntermediate(count) {
  const scenes = pickUniqueScenes(count);
  const qKinds = ['who', 'where', 'action'];
  const cards = scenes.map((s, i) => {
    const qKind = qKinds[i % qKinds.length];
    const questionText =
      qKind === 'who' ? 'だれが？' : qKind === 'where' ? 'どこで？' : 'なにをしている？';
    const inner = `<div class="choice-sentence">${s.sentence}</div>
      <div class="emoji-question-prompt">しつもん：${questionText}（ことばで かこう）</div>
      <div class="answer-line"></div>`;
    return questionCard(i + 1, inner);
  });
  const answers = scenes.map((s, i) => {
    const qKind = qKinds[i % qKinds.length];
    return qKind === 'who' ? s.who : qKind === 'where' ? s.where : s.action;
  });
  return { cardHtmls: cards, answers };
}

const SENTENCE_ILLUST_TEMPLATES = [
  ['boy_run', 'おとこのこ', 'はしっている', 'M20 70 L40 30 L60 70 M40 40 L20 50 M40 40 L60 52'],
  ['girl_read', 'おんなのこ', 'よんでいる', 'M20 70 L38 34 L56 70 M30 52 L50 52 M27 56 L50 56'],
  ['dog_sleep', 'いぬ', 'ねている', 'M20 65 Q36 44 56 64 M22 66 L56 66 M24 70 L34 70'],
  ['cat_eat', 'ねこ', 'たべている', 'M18 62 Q36 42 58 62 M52 66 L62 66 M16 40 L24 48 M28 38 L36 48'],
  ['teacher_walk', 'せんせい', 'あるいている', 'M20 70 L42 30 L64 70 M42 42 L56 54'],
  ['bird_watch', 'とり', 'みている', 'M18 58 Q34 42 52 58 M34 58 L30 68 M38 58 L44 68'],
  ['mother_study', 'おかあさん', 'べんきょうしている', 'M20 70 L40 32 L60 70 M30 48 L52 48 M30 52 L52 52'],
  ['father_play', 'おとうさん', 'あそんでいる', 'M22 70 L40 30 L58 70 M24 56 L56 44'],
  ['boy_eat', 'おとこのこ', 'たべている', 'M20 70 L40 30 L60 70 M32 50 L50 50 M50 50 L60 44'],
  ['girl_run', 'おんなのこ', 'はしっている', 'M22 70 L42 32 L62 70 M22 58 L38 50'],
  ['dog_walk', 'いぬ', 'あるいている', 'M20 64 Q36 46 56 64 M20 68 L56 68'],
  ['cat_sleep', 'ねこ', 'ねている', 'M20 65 Q36 46 56 65 M22 66 L56 66'],
  ['teacher_read', 'せんせい', 'よんでいる', 'M22 70 L42 30 L62 70 M30 50 L54 50 M30 54 L54 54'],
  ['bird_eat', 'とり', 'たべている', 'M18 58 Q34 42 52 58 M52 58 L62 54'],
  ['mother_watch', 'おかあさん', 'みている', 'M22 70 L42 32 L62 70 M46 45 L58 45'],
  ['father_run', 'おとうさん', 'はしっている', 'M22 70 L42 30 L62 70 M24 56 L38 50'],
  ['boy_walk', 'おとこのこ', 'あるいている', 'M20 70 L40 30 L60 70 M24 56 L38 56'],
  ['girl_sleep', 'おんなのこ', 'ねている', 'M18 66 Q36 44 58 66 M22 68 L56 68'],
  ['dog_watch', 'いぬ', 'みている', 'M20 64 Q36 46 56 64 M56 62 L62 58'],
  ['cat_run', 'ねこ', 'はしっている', 'M18 62 Q36 42 58 62 M20 40 L28 48 M32 38 L40 48'],
  ['teacher_study', 'せんせい', 'べんきょうしている', 'M20 70 L40 32 L60 70 M28 48 L52 48'],
  ['bird_walk', 'とり', 'あるいている', 'M18 58 Q34 42 52 58 M30 58 L28 68 M38 58 L42 68'],
  ['mother_read', 'おかあさん', 'よんでいる', 'M20 70 L40 32 L60 70 M30 50 L52 50'],
  ['father_eat', 'おとうさん', 'たべている', 'M20 70 L40 30 L60 70 M48 50 L60 44'],
  ['boy_watch', 'おとこのこ', 'みている', 'M20 70 L40 30 L60 70 M44 46 L56 46'],
  ['girl_walk', 'おんなのこ', 'あるいている', 'M22 70 L42 32 L62 70 M24 56 L40 56'],
  ['dog_run', 'いぬ', 'はしっている', 'M20 64 Q36 46 56 64 M20 68 L56 68 M42 64 L56 56'],
  ['cat_watch', 'ねこ', 'みている', 'M18 62 Q36 42 58 62 M56 60 L62 56'],
  ['teacher_play', 'せんせい', 'あそんでいる', 'M22 70 L42 30 L62 70 M24 56 L56 44'],
  ['bird_sleep', 'とり', 'ねている', 'M18 58 Q34 42 52 58 M22 60 L50 60'],
];

function buildSentenceIllustSvg(pathD) {
  return `<svg class="sentence-illust-svg" viewBox="0 0 80 80" role="img" aria-label="イラスト">
    <rect x="1" y="1" width="78" height="78" rx="8" ry="8" class="sentence-illust-frame"></rect>
    <path d="${pathD}" class="sentence-illust-line"></path>
    <circle cx="40" cy="18" r="7" class="sentence-illust-head"></circle>
  </svg>`;
}

function buildSentenceAdvanced(count) {
  const scenes = pickUniqueScenes(count);
  const cards = scenes.map((s, i) => {
    const qType = i % 3;
    const pattern =
      qType === 0
        ? 'だれが なにを していますか。'
        : qType === 1
          ? `だれが どこで ${s.action}か。`
          : 'どこで なにを していますか。';
    const inner = `<div class="advanced-compact advanced-compact--sentence">
      <div class="choice-sentence">${s.sentence}</div>
      <div class="emoji-question-prompt">しつもん：${pattern}</div>
      <div class="answer-line"></div>
    </div>`;
    return questionCard(i + 1, inner);
  });
  const answers = scenes.map((s, i) => {
    const qType = i % 3;
    if (qType === 0) return `${s.who}が ${s.action}`;
    if (qType === 1) return `${s.who}が ${s.where}で ${s.action}`;
    return `${s.where}で ${s.action}`;
  });
  return { cardHtmls: cards, answers };
}

/** プリントの level → 並び替えジェネレータの difficulty */
function narabikaeLevelToSortDifficulty(level) {
  if (level === 'beginner') return 'easy';
  if (level === 'intermediate') return 'medium';
  return 'hard';
}

function buildNarabikaeSentence(level) {
  if (typeof generateSortQuestion !== 'function') {
    const fb = globalThis.SORT_QUESTION_DATA && globalThis.SORT_QUESTION_DATA.fallback
      ? globalThis.SORT_QUESTION_DATA.fallback
      : null;
    const diff = narabikaeLevelToSortDifficulty(level);
    const pack = fb && fb[diff] ? fb[diff] : { answerParts: ['いぬが', 'にわで', 'はしっています'], answerText: 'いぬが にわで はしっています' };
    return {
      questionParts: shuffle(pack.answerParts),
      answerParts: pack.answerParts,
      answerText: pack.answerText,
    };
  }
  return generateSortQuestion(narabikaeLevelToSortDifficulty(level));
}

function buildNarabikaeCard(num, level) {
  const made = buildNarabikaeSentence(level);
  const chips = made.questionParts.map((p) => `<span class="choice-item">${escapeHtmlPrint(p)}</span>`).join('');
  const compactCls = level === 'advanced' ? 'advanced-compact advanced-compact--narabikae' : '';
  const layoutCls = ['narabikae-layout', compactCls].filter(Boolean).join(' ');
  const inner = `<div class="${layoutCls}">
    <div class="choices-row narabikae-choices-row">${chips}</div>
    <div class="adv-prompt-sub">こたえを したに かこう</div>
    <div class="answer-line narabikae-answer-line"></div></div>`;
  return { html: questionCard(num, inner), answer: made.answerText };
}

function buildNarabikaeBeginner(count) {
  const cards = [];
  const answers = [];
  for (let i = 0; i < count; i++) {
    const c = buildNarabikaeCard(i + 1, 'beginner');
    cards.push(c.html);
    answers.push(c.answer);
  }
  return { cardHtmls: cards, answers };
}

function buildNarabikaeIntermediate(count) {
  const cards = [];
  const answers = [];
  for (let i = 0; i < count; i++) {
    const c = buildNarabikaeCard(i + 1, 'intermediate');
    cards.push(c.html);
    answers.push(c.answer);
  }
  return { cardHtmls: cards, answers };
}

function buildNarabikaeAdvanced(count) {
  const cards = [];
  const answers = [];
  for (let i = 0; i < count; i++) {
    const c = buildNarabikaeCard(i + 1, 'advanced');
    cards.push(c.html);
    answers.push(c.answer);
  }
  return { cardHtmls: cards, answers };
}

/** TypeScript（PlanCore）から既存HTMLエンジンを参照するための公開API */
if (typeof window !== 'undefined') {
  window.PrintGenerator = {
    generatePrintHTML,
    buildQuestionBodyStructured,
  };
}
