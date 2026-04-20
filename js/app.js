/**
 * app.js  —  UI操作・モーダル・FAQ・印刷・PDF（印刷ダイアログ経由）
 * 家庭学習プリント工房 v2
 */

/** 有料版の案内・お申し込み（LINE） */
const LINE_SIGNUP_URL = 'https://lin.ee/QrdTzUH';

/** ?plan=pro（大文字小文字・前後空白を許容） */
function readIsProPlanFromUrl() {
  try {
    const raw = new URLSearchParams(window.location.search).get('plan');
    return String(raw || '').trim().toLowerCase() === 'pro';
  } catch (_e) {
    return false;
  }
}
const isProUser = readIsProPlanFromUrl();

/* ════════════════════════════════════════
   選択状態
════════════════════════════════════════ */
let selectedContent = 'joshi';
let selectedLevel   = 'beginner';
let selectedCustomMode = 'trace';
let selectedKanaMode = 'mix';
/** 五十音・初級：出題順（ランダム／あ〜わ順） */
let selectedHiraganaOrder = 'random';
/** 漢字：学年（#kanjiGrade） */
let selectedKanjiGrade = 1;
/** 漢字：読み／書き（#kanjiMode） */
let selectedKanjiMode = 'reading';
const CUSTOM_WORD_MAX_COUNT = 8;
const CUSTOM_WORD_MAX_LEN = 15;
const CUSTOM_WORD_PLACEHOLDERS = [
  '例：りんご',
  '例：いぬ',
  '例：くつ',
  '例：かばん',
  '例：じてんしゃ',
  '例：えんぴつ',
  '例：もも',
  '例：とり',
];

function getEffectiveLevelForContent(content, levelFromUi) {
  if (content !== 'custom') return levelFromUi;
  return selectedCustomMode === 'trace' ? 'beginner' : 'advanced';
}

function getLevelLabel(level, content) {
  if (content === 'custom') {
    return level === 'advanced' ? '視写' : 'なぞり書き';
  }
  const levelLabels = { beginner: '初級', intermediate: '中級', advanced: '上級' };
  return levelLabels[level] || level;
}

/** plan-core.bundle.js（src/config/planRules.ts）と同一値 */
const PlanCore = typeof window !== 'undefined' ? window.PlanCore : undefined;

/** 無料版のみカウント（planRules と一致） */
const FREE_GENERATION_LIMIT = PlanCore?.FREE_GENERATION_LIMIT ?? 3;
/** ひらがな迷路の最大問題数（PDF 負荷軽減・planRules と一致） */
const MAZE_HIRAGANA_MAX_QUESTIONS = PlanCore?.MAZE_HIRAGANA_MAX_QUESTIONS ?? 10;
/** 有料ジャンル体験の対象（案内文言の共通化） */
const PREMIUM_TRIAL_GENRE_LABEL = '文章問題・並び替え・ひらがな迷路';
const LS_FREE_GEN_TOTAL_KEY = 'homePrint_freeGenTotal_v2';
const LS_FREE_GEN_DATE_KEY = 'homePrint_freeGenDateJst_v2';
/** 旧「通算1回」体験フラグ（日次 trial へ移行時に参照） */
const LS_PREMIUM_GENRE_TRIAL_KEY = 'homePrint_premiumGenreTrialConsumed_v1';
const LS_SENTENCE_TRIAL_COUNT_KEY = 'homePrint_sentenceTrialCount_v1';
const LS_NARABIKAE_TRIAL_COUNT_KEY = 'homePrint_narabikaeTrialCount_v1';
const LS_MAZE_HIRAGANA_TRIAL_KEY = 'homePrint_mazeHiraganaTrialConsumed_v1';
/** 日次 trial（v2）移行済みマーカー */
const LS_TRIAL_DAILY_MIGRATED_V2 = 'homePrint_premiumTrialDailyMigration_v2';

/** ジャンルごとに「最後に無料体験を使った日」（YYYY-MM-DD JST）。当日と一致すれば本日分消化済み */
function getTrialLastYmdStorageKey(genre) {
  return `homePrint_premiumTrialLastYmd_${genre}`;
}

/** 履歴からの再生成時、保存済み customPayload をそのまま使う */
let __historyGenOverride = null;

/** JST のカレンダー日を常に YYYY-MM-DD で統一（locale 差・全角数字の混入を避ける） */
function formatYmdInTokyo(millis) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(millis);
  } catch (_e) {
    return new Date(millis).toISOString().slice(0, 10);
  }
}

function normalizeTrialYmdKey(raw) {
  if (raw == null || typeof raw !== 'string') return '';
  const t = raw.trim();
  const m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!m) return '';
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
}

/** 前日の日付キー（JST・移行用） */
function getYesterdayJstDateKey() {
  return formatYmdInTokyo(Date.now() - 86400000);
}

function getTrialLastUseYmd(genre) {
  try {
    return localStorage.getItem(getTrialLastYmdStorageKey(genre)) || '';
  } catch (_e) {
    return '';
  }
}

function setTrialLastUseYmd(genre, ymd) {
  try {
    localStorage.setItem(getTrialLastYmdStorageKey(genre), ymd);
  } catch (_e) {
    /* ignore */
  }
}

/**
 * 旧「通算1回」ストレージを「前日に使った」日次 trial に移す（翌日から毎日1回に戻す）
 */
function migrateLegacyTrialKeysToDailyPerGenre() {
  if (isProUser) return;
  try {
    if (localStorage.getItem(LS_TRIAL_DAILY_MIGRATED_V2) === '1') return;

    const yYesterday = normalizeTrialYmdKey(getYesterdayJstDateKey()) || getYesterdayJstDateKey();
    const legacyPrem = localStorage.getItem(LS_PREMIUM_GENRE_TRIAL_KEY) === '1';
    const legacyMaze = localStorage.getItem(LS_MAZE_HIRAGANA_TRIAL_KEY) === '1';
    let s = 0;
    let n = 0;
    try {
      s = parseInt(localStorage.getItem(LS_SENTENCE_TRIAL_COUNT_KEY) || '0', 10) || 0;
      n = parseInt(localStorage.getItem(LS_NARABIKAE_TRIAL_COUNT_KEY) || '0', 10) || 0;
    } catch (_e) {
      /* ignore */
    }

    if (legacyPrem || s > 0 || n > 0) {
      if (!getTrialLastUseYmd('sentence')) setTrialLastUseYmd('sentence', yYesterday);
      if (!getTrialLastUseYmd('narabikae')) setTrialLastUseYmd('narabikae', yYesterday);
    }
    if (legacyMaze) {
      if (!getTrialLastUseYmd('maze_hiragana')) setTrialLastUseYmd('maze_hiragana', yYesterday);
    }

    localStorage.setItem(LS_TRIAL_DAILY_MIGRATED_V2, '1');
  } catch (_e) {
    /* ignore */
  }
}

/** 旧キーからの移行（日次キーが未設定のときのみ） */
function migratePremiumGenreTrialFromLegacy() {
  if (isProUser) return;
  try {
    if (localStorage.getItem(LS_PREMIUM_GENRE_TRIAL_KEY) !== null) return;
    const s = parseInt(localStorage.getItem(LS_SENTENCE_TRIAL_COUNT_KEY) || '0', 10) || 0;
    const n = parseInt(localStorage.getItem(LS_NARABIKAE_TRIAL_COUNT_KEY) || '0', 10) || 0;
    if (s > 0 || n > 0) localStorage.setItem(LS_PREMIUM_GENRE_TRIAL_KEY, '1');
  } catch (_e) {
    /* ignore */
  }
}

function getJstDateKey() {
  const raw = formatYmdInTokyo(Date.now());
  return normalizeTrialYmdKey(raw) || raw;
}

function ensureDailyFreeQuotaSynced() {
  if (isProUser) return;
  try {
    const today = getJstDateKey();
    const storedDate = localStorage.getItem(LS_FREE_GEN_DATE_KEY) || '';
    if (storedDate !== today) {
      localStorage.setItem(LS_FREE_GEN_DATE_KEY, today);
      localStorage.setItem(LS_FREE_GEN_TOTAL_KEY, '0');
    }
  } catch (_e) {
    /* ignore */
  }
}

/** trial 判定の直前に必ず呼ぶ（レガシー移行・日次 v2 移行） */
function ensurePremiumTrialStorageReady() {
  if (isProUser) return;
  migratePremiumGenreTrialFromLegacy();
  migrateLegacyTrialKeysToDailyPerGenre();
}

/** 無料版：当該ジャンルで「本日の体験分」を既に使ったか（JST の日付キーで比較） */
function isPremiumTrialUsedToday(genre) {
  if (!isPremiumTrialGenre(genre) || isProUser) return false;
  ensurePremiumTrialStorageReady();
  const last = normalizeTrialYmdKey(getTrialLastUseYmd(genre));
  const today = normalizeTrialYmdKey(getJstDateKey());
  if (last.length !== 10 || today.length !== 10) return false;
  return last === today;
}

function isPremiumTrialAvailableToday(genre) {
  if (!isPremiumTrialGenre(genre) || isProUser) return true;
  return !isPremiumTrialUsedToday(genre);
}

function markPremiumTrialUsedTodayForGenre(genre) {
  if (!isPremiumTrialGenre(genre) || isProUser) return;
  setTrialLastUseYmd(genre, getJstDateKey());
}

/** 有料ジャンル体験の対象ジャンルか（判定・マークの共通化） */
function isPremiumTrialGenre(content) {
  return content === 'sentence' || content === 'narabikae' || content === 'maze_hiragana';
}

/**
 * 無料体験カードの見た目（本日分消化済みのみ終了表示。未使用時は DOM からラベルを除去して誤表示を防ぐ）
 */
function refreshPremiumTrialGenreCards() {
  document.querySelectorAll('.content-btn--trial').forEach((btn) => {
    const g = btn.dataset.value;
    if (!g || !isPremiumTrialGenre(g)) return;
    const exhausted = !isProUser && isPremiumTrialUsedToday(g) === true;
    btn.classList.toggle('genre-card--trial-exhausted-today', exhausted);
    const existing = btn.querySelector('.genre-trial-day-badge');
    if (!exhausted) {
      existing?.remove();
      btn.removeAttribute('aria-label');
      return;
    }
    let badge = btn.querySelector('.genre-trial-day-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'genre-trial-day-badge';
      badge.setAttribute('aria-hidden', 'true');
      btn.appendChild(badge);
    }
    badge.textContent = '本日の無料体験は終了';
    btn.setAttribute(
      'aria-label',
      `${btn.querySelector('.genre-card-name')?.textContent?.trim() || ''}（本日の無料体験は終了）`
    );
  });
}

/** 有料版ではジャンル右上の「無料／有料／体験」バッジを出さない */
function refreshGenreCardPlanBadgesVisibility() {
  document.querySelectorAll('#contentOptions .genre-card .genre-card-badge').forEach((el) => {
    el.hidden = !!isProUser;
  });
}

/** 有料版のみ選択可。五十音・初級は教材上10問固定で選択より優先 */
const PRO_QUESTION_COUNT_OPTIONS = PlanCore?.PRO_QUESTION_COUNT_OPTIONS ?? [5, 10, 15, 20, 25];

function clampMazeHiraganaQuestionCount(content, count) {
  if (content !== 'maze_hiragana') return count;
  const c = Number(count);
  if (!Number.isFinite(c)) return MAZE_HIRAGANA_MAX_QUESTIONS;
  return Math.min(Math.max(1, c), MAZE_HIRAGANA_MAX_QUESTIONS);
}

function resolveQuestionCountForPrint(content, level) {
  const sel = document.getElementById('questionCountPro');
  const raw = sel?.value;
  const n = raw != null && raw !== '' ? parseInt(raw, 10) : NaN;
  let resolved;
  if (PlanCore && typeof PlanCore.resolveQuestionCount === 'function') {
    resolved = PlanCore.resolveQuestionCount({
      genre: content,
      difficulty: level,
      isPro: isProUser,
      selectedProCount: Number.isFinite(n) ? n : undefined,
    });
  } else if (content === 'hiragana' && level === 'beginner') {
    resolved = 10;
  } else if (isProUser) {
    resolved = PRO_QUESTION_COUNT_OPTIONS.includes(n) ? n : 5;
  } else {
    resolved = 5;
  }
  return clampMazeHiraganaQuestionCount(content, resolved);
}

/** 問題数ピルとヒント（五十音・初級は10問固定でピルは無効化） */
function refreshQuestionCountUI() {
  const hint = document.getElementById('questionCountProHint');
  const sel = document.getElementById('questionCountPro');
  const levelRaw = document.querySelector('.level-btn.active')?.dataset.value || selectedLevel;
  const level = getEffectiveLevelForContent(selectedContent, levelRaw);
  const fixedHiraganaBeginner = selectedContent === 'hiragana' && level === 'beginner';
  const isMazeH = selectedContent === 'maze_hiragana';

  if (sel && !isProUser) sel.value = '5';
  if (sel && isMazeH) {
    const cur = parseInt(sel.value, 10) || 5;
    if (cur > MAZE_HIRAGANA_MAX_QUESTIONS) sel.value = String(MAZE_HIRAGANA_MAX_QUESTIONS);
  }

  document.querySelectorAll('#questionCountPills .count-pill').forEach((btn) => {
    const q = btn.dataset.qty;
    const active = sel && String(sel.value) === q;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    const n = parseInt(q, 10);
    let disabled = false;
    if (!isProUser && n !== 5) disabled = true;
    if (isProUser && fixedHiraganaBeginner) disabled = true;
    if (isProUser && isMazeH && n > MAZE_HIRAGANA_MAX_QUESTIONS) disabled = true;
    btn.disabled = disabled;
    btn.classList.toggle('count-pill--disabled', disabled);
  });

  if (hint) {
    if (fixedHiraganaBeginner) {
      hint.textContent = '五十音・初級は10問で出題されます。';
    } else if (isMazeH && isProUser) {
      hint.textContent = `ひらがな迷路は最大${MAZE_HIRAGANA_MAX_QUESTIONS}問までです（PDF負荷軽減のため）。`;
    } else if (!isProUser) {
      hint.textContent = '無料プランは5問で生成されます。';
    } else {
      hint.textContent = '5〜20問から選べます。';
    }
  }
}

/** 有料ジャンル体験終了の共通案内（文章・並び替え・ひらがな迷路で同一） */
function showPremiumGenreTrialExhaustedNotice() {
  if (isProUser) return;
  updateTrialNotice(true, PREMIUM_TRIAL_GENRE_LABEL, 'limit');
}

function updateTrialNotice(show, featureName = '', mode = 'limit') {
  const el = document.getElementById('sentenceTrialNotice');
  const title = document.getElementById('trialNoticeTitle');
  const sub = document.getElementById('trialNoticeSub');
  const btn = el?.querySelector('.sentence-trial-btn');
  if (!el) return;
  if (isProUser) {
    el.hidden = true;
    return;
  }
  if (show && title && sub) {
    if (mode === 'after-first-use') {
      title.textContent = '有料ジャンルをおためしできました！';
      sub.textContent = `${PREMIUM_TRIAL_GENRE_LABEL}は有料プランでいつでもご利用いただけます。`;
      if (btn) btn.textContent = '有料プランを見る';
    } else {
      title.textContent = '本日の無料体験は終了しました';
      sub.textContent = `${featureName || PREMIUM_TRIAL_GENRE_LABEL}は、きょうはもう無料で生成できません。明日になればまた1回お試しいただけます。続けて使うには有料プランをご利用ください。`;
      if (btn) btn.textContent = '有料プランを見る';
    }
  }
  el.hidden = !show;
}

function getFreeGenerationsUsed() {
  ensureDailyFreeQuotaSynced();
  try {
    return parseInt(localStorage.getItem(LS_FREE_GEN_TOTAL_KEY) || '0', 10) || 0;
  } catch (e) {
    return 0;
  }
}

function incrementFreeGenerationCount() {
  if (isProUser) return;
  ensureDailyFreeQuotaSynced();
  try {
    const used = getFreeGenerationsUsed();
    localStorage.setItem(LS_FREE_GEN_TOTAL_KEY, String(used + 1));
  } catch (e) {
    /* ignore */
  }
}

function updateFreeGenQuotaUI() {
  const el = document.getElementById('freeGenQuota');
  if (!el) return;
  if (isProUser) {
    el.hidden = true;
    return;
  }
  el.hidden = false;
  const used = getFreeGenerationsUsed();
  const left = Math.max(0, FREE_GENERATION_LIMIT - used);
  el.textContent = `無料プラン：残り ${left} 回 / 1日${FREE_GENERATION_LIMIT}回まで`;
}

function refreshKatakanaGenerateNote() {
  const el = document.getElementById('katakanaGenerateNote');
  if (!el) return;
  el.hidden = isProUser;
}

function refreshKatakanaToggleRow() {
  const row = document.getElementById('katakanaToggleRow');
  const cb = document.getElementById('includeKatakana');
  const hint = document.getElementById('katakanaToggleHint');
  const isHiragana = selectedContent === 'hiragana';
  if (row) row.hidden = !isHiragana;
  if (!cb) return;
  if (!isHiragana) return;
  if (!isProUser) {
    cb.checked = false;
    if (hint) hint.textContent = '※有料版のみ利用できます';
  } else if (hint) {
    hint.textContent = 'ONでひらがなとカタカナ、OFFでひらがなのみ';
  }
}

function getAllowKatakana() {
  if (!isProUser) return false;
  return !!document.getElementById('includeKatakana')?.checked;
}

/** 五十音：カタカナ含むONならミックス、OFFならひらがなのみ（従来セレクト廃止） */
function getKanaMode() {
  if (!isProUser) return 'hiragana';
  if (selectedContent !== 'hiragana') return 'mix';
  return getAllowKatakana() ? 'mix' : 'hiragana';
}

function setHiraganaOrder(order) {
  selectedHiraganaOrder = order === 'sequential' ? 'sequential' : 'random';
  document.querySelectorAll('#hiraganaOrderPills .pill-duo-btn').forEach((b) => {
    const on = b.dataset.order === selectedHiraganaOrder;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}

function refreshHiraganaOrderPills() {
  setHiraganaOrder(selectedHiraganaOrder);
}

function openFeatureLockedModal(feature) {
  const modal = document.getElementById('planModal');
  const heading = document.getElementById('planPitchHeading');
  const ctx = document.getElementById('planModalContext');
  const pitchList = modal?.querySelector('[data-modal-panel="pitch"] .plan-pitch-list');
  const line = modal?.querySelector('[data-modal-panel="pitch"] .plan-pitch-line');
  if (!modal || !heading || !pitchList || !line) {
    openPlanModal();
    return;
  }

  const conf =
    feature === 'katakana'
      ? {
          context: 'カタカナ機能は有料版で利用できます',
          title: 'カタカナ機能は有料版で利用できます',
          bullets: [
            'ひらがな＋カタカナの出題に対応',
            '学習状況に合わせてON/OFF切り替え可能',
            '月額300円でご利用できます',
          ],
        }
      : {
          context: 'カスタム問題は有料版で利用できます',
          title: 'カスタム問題は有料版で利用できます',
          bullets: [
            '自分専用の単語でプリント作成',
            '最大8単語まで入力可能',
            'なぞり書き・視写に対応',
            '月額300円でご利用できます',
          ],
        };

  heading.textContent = conf.title;
  pitchList.innerHTML = conf.bullets.map((b) => `<li>${b}</li>`).join('');
  line.textContent = '有料版を利用する';
  if (ctx) {
    ctx.textContent = conf.context;
    ctx.hidden = false;
  }
  syncModalPanelsForPlan();
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  modal.querySelector('.modal-close')?.focus();
}


function updatePlanBadge() {
  const el = document.getElementById('planBadge');
  if (!el) return;
  el.textContent = isProUser ? '有料版をご利用中です' : '無料版利用中';
  el.title = isProUser
    ? 'すべての機能が利用可能です'
    : '【有料版】月額300円・回数無制限・1枚5問（五十音・初級のみ10問）・上級モード・解答付き';
  el.classList.toggle('plan-badge--pro', isProUser);
  el.classList.toggle('plan-badge--free', !isProUser);
}

function refreshAnswerSheetRow() {
  const cb = document.getElementById('includeAnswersSheet');
  const hint = document.getElementById('answerSheetHint');
  if (cb) {
    cb.disabled = !isProUser;
    if (!isProUser) cb.checked = false;
  }
  if (hint) hint.hidden = !!isProUser;
}

function refreshOneClickRow() {
  const row = document.getElementById('oneClickRow');
  if (row) row.hidden = !isProUser;
}

function refreshKanjiSettingsRow() {
  const row = document.getElementById('kanjiSettingsRow');
  const gEl = document.getElementById('kanjiGrade');
  const mEl = document.getElementById('kanjiMode');
  const show = selectedContent === 'kanji';
  if (row) row.hidden = !show;
  if (gEl && show) {
    selectedKanjiGrade = parseInt(gEl.value, 10) || 1;
  }
  if (mEl && show) {
    selectedKanjiMode = mEl.value === 'writing' ? 'writing' : 'reading';
  }
}

function getKanjiPayloadFromUI() {
  const gEl = document.getElementById('kanjiGrade');
  const mEl = document.getElementById('kanjiMode');
  const g = gEl ? parseInt(gEl.value, 10) || 1 : selectedKanjiGrade;
  const m = mEl && mEl.value === 'writing' ? 'writing' : 'reading';
  return { kanjiGrade: g, kanjiMode: m };
}

function refreshCustomWordControl() {
  const hint = document.getElementById('customWordHint');
  const row = document.getElementById('customWordRow');
  const isCustom = selectedContent === 'custom';
  const show = isCustom;
  if (row) row.hidden = !show;
  const levelCard = document.getElementById('levelStepCard');
  if (levelCard) levelCard.hidden = isCustom;
  if (!show) {
    if (hint) {
      hint.textContent = isProUser
        ? '「カスタム問題」を選ぶと入力できます（最大15文字）。'
        : 'カスタム問題は有料版で利用できます。';
    }
  } else {
    if (hint) {
      hint.textContent = '1単語15文字まで。入力した単語はすべて問題に反映されます。';
    }
  }
}

function buildCustomWordRow(value = '', inputId = '', placeholderIndex = 0) {
  const row = document.createElement('div');
  row.className = 'custom-word-row';
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'setting-input custom-word-input';
  if (inputId) input.id = inputId;
  input.maxLength = CUSTOM_WORD_MAX_LEN;
  input.autocomplete = 'off';
  input.placeholder =
    CUSTOM_WORD_PLACEHOLDERS[placeholderIndex % CUSTOM_WORD_PLACEHOLDERS.length];
  input.value = value;

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'custom-remove-btn';
  removeBtn.innerHTML = '<i class="fas fa-trash"></i> 削除';
  removeBtn.addEventListener('click', () => {
    const list = document.getElementById('customWordsList');
    if (!list) return;
    if (list.children.length <= 1) {
      input.value = '';
      input.focus();
      return;
    }
    row.remove();
    refreshCustomWordButtons();
  });

  row.appendChild(input);
  row.appendChild(removeBtn);
  row.addEventListener('click', () => {
    if (!isProUser) openFeatureLockedModal('custom');
  });
  input.addEventListener('focus', () => {
    if (!isProUser) {
      input.blur();
      openFeatureLockedModal('custom');
    }
  });
  return row;
}

function refreshCustomWordButtons() {
  const list = document.getElementById('customWordsList');
  const addBtn = document.getElementById('addCustomWordBtn');
  if (!list || !addBtn) return;
  addBtn.disabled = list.children.length >= CUSTOM_WORD_MAX_COUNT;
}

function ensureCustomWordInputsReady() {
  const list = document.getElementById('customWordsList');
  const addBtn = document.getElementById('addCustomWordBtn');
  if (!list || !addBtn || list.dataset.ready === '1') return;

  list.appendChild(buildCustomWordRow('', 'customWord1', 0));
  list.dataset.ready = '1';
  refreshCustomWordButtons();

  addBtn.addEventListener('click', () => {
    if (!isProUser) {
      openFeatureLockedModal('custom');
      return;
    }
    if (list.children.length >= CUSTOM_WORD_MAX_COUNT) return;
    const nextId = `customWord${list.children.length + 1}`;
    const phIdx = list.children.length;
    list.appendChild(buildCustomWordRow('', nextId, phIdx));
    refreshCustomWordButtons();
    const last = list.querySelector('.custom-word-row:last-child .custom-word-input');
    if (last) last.focus();
  });
}

function getCustomWordsFromUI() {
  const list = document.getElementById('customWordsList');
  if (!list) return [];
  return Array.from(list.querySelectorAll('.custom-word-input'))
    .map((el) => (el.value || '').trim())
    .filter((v) => v.length > 0)
    .slice(0, CUSTOM_WORD_MAX_COUNT);
}

function setCustomWordsFromSnapshot(words) {
  ensureCustomWordInputsReady();
  const list = document.getElementById('customWordsList');
  if (!list) return;
  const arr = Array.isArray(words) ? words.slice(0, CUSTOM_WORD_MAX_COUNT) : [];
  list.innerHTML = '';
  list.dataset.ready = '1';
  if (arr.length === 0) {
    list.appendChild(buildCustomWordRow('', 'customWord1', 0));
  } else {
    arr.forEach((w, i) => {
      const id = i === 0 ? 'customWord1' : `customWord${i + 1}`;
      list.appendChild(buildCustomWordRow(w, id, i));
    });
  }
  refreshCustomWordButtons();
}

const HISTORY_CONTENT_LABELS = {
  joshi: '助詞',
  hiragana: '五十音',
  maze: 'めいろ',
  kanji: '漢字',
  narabikae: '並び替え',
  maze_hiragana: 'ひらがな迷路',
  sentence: '文章問題',
  custom: 'カスタム',
};

function cloneJson(obj) {
  if (obj === undefined) return undefined;
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (_e) {
    return obj;
  }
}

function formatAutoHistoryTitle(entry) {
  const c = HISTORY_CONTENT_LABELS[entry.content] || entry.content || 'プリント';
  const eff =
    entry.effectiveLevel ||
    getEffectiveLevelForContent(entry.content, entry.levelRaw || 'beginner');
  const lvl = getLevelLabel(eff, entry.content);
  const n = entry.effectiveCount;
  if (typeof n === 'number' && Number.isFinite(n)) {
    return `${c}・${lvl}・${n}問`;
  }
  return `${c}・${lvl}`;
}

function formatDisplayTitle(entry) {
  const t = entry.title != null ? String(entry.title).trim() : '';
  if (t) return t;
  return formatAutoHistoryTitle(entry);
}

function formatHistoryDate(ts) {
  try {
    const d = new Date(ts);
    return new Intl.DateTimeFormat('ja-JP', { dateStyle: 'short', timeStyle: 'short' }).format(d);
  } catch (_e) {
    return '';
  }
}

function saveSuccessfulGenerationToHistory({
  content,
  levelRaw,
  level,
  count,
  customPayload,
  wantAnswers,
  generatedPrintHtml,
  generatedIsMazeSheet,
}) {
  const HS = typeof HistoryStore !== 'undefined' ? HistoryStore : null;
  if (!HS) return;
  const beforeHistory = typeof HS.loadHistory === 'function' ? HS.loadHistory() : [];
  const kanji = getKanjiPayloadFromUI();
  const snap = {
    content,
    levelRaw: levelRaw || selectedLevel,
    effectiveLevel: level,
    effectiveCount: count,
    customMode: selectedCustomMode,
    kanaMode: getKanaMode(),
    hiraganaSetOrder: selectedHiraganaOrder,
    includeKatakana: !!document.getElementById('includeKatakana')?.checked,
    kanjiGrade: kanji.kanjiGrade,
    kanjiMode: kanji.kanjiMode,
    questionCountPro: document.getElementById('questionCountPro')?.value || '5',
    customWords: getCustomWordsFromUI(),
    includeAnswersSheet: !!wantAnswers,
    customPayload: cloneJson(customPayload),
    generatedPrintHtml: typeof generatedPrintHtml === 'string' ? generatedPrintHtml : '',
    generatedIsMazeSheet: !!generatedIsMazeSheet,
    title: '',
  };
  const nextHistory = HS.prependHistory(snap, isProUser) || [];
  if (!isProUser) {
    const nextIds = new Set(nextHistory.map((e) => e && e.id).filter(Boolean));
    const removed = beforeHistory.filter((e) => e && e.id && !nextIds.has(e.id));
    if (removed.length > 0) {
      showHistoryLimitToast(
        '履歴は5件までのため、古い履歴を1件整理しました。残したいプリントはお気に入り保存がおすすめです。'
      );
    }
  }
  refreshHistoryEntryActions();
}

function showHistoryLimitToast(message) {
  const text = String(message || '').trim();
  if (!text) return;
  let toast = document.getElementById('historyLimitToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'historyLimitToast';
    toast.className = 'history-limit-toast no-print';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.classList.add('history-limit-toast--show');
  clearTimeout(showHistoryLimitToast._timer);
  showHistoryLimitToast._timer = setTimeout(() => {
    toast.classList.remove('history-limit-toast--show');
  }, 3200);
}

function getHistoryItemsForEntryAction() {
  const HS = typeof HistoryStore !== 'undefined' ? HistoryStore : null;
  if (!HS || typeof HS.loadHistory !== 'function') return [];
  const rows = HS.loadHistory();
  return Array.isArray(rows) ? rows : [];
}

function refreshHistoryEntryActions() {
  const openBtn = document.getElementById('openHistoryBtn');
  const heroHint = document.getElementById('heroHistoryHint');
  if (!openBtn && !heroHint) return;

  const items = getHistoryItemsForEntryAction();
  const count = items.length;
  if (openBtn) {
    openBtn.innerHTML = `<i class="fas fa-clock-rotate-left"></i> 作成履歴を見る <span class="hero-history-btn-count">（${count}件）</span>`;
  }
  if (heroHint) {
    if (count > 0) {
      heroHint.hidden = false;
      heroHint.innerHTML =
        '前に作ったプリントを、履歴からすぐ再利用できます。<br>気に入った設定はお気に入り保存がおすすめです。';
    } else {
      heroHint.hidden = true;
      heroHint.textContent = '';
    }
  }
}

/**
 * 履歴／お気に入りの1件を UI に反映（再編集・再生成の前に実行）
 */
function applySnapshotToUI(entry) {
  if (!entry || typeof entry !== 'object') return;
  const content = entry.content || 'joshi';
  selectedContent = content;
  document.querySelectorAll('.content-btn').forEach((b) => {
    const on = b.dataset.value === content;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });

  const levelRaw = entry.levelRaw || 'beginner';
  selectedLevel = levelRaw;
  document.querySelectorAll('.level-btn').forEach((b) => {
    const on = b.dataset.value === levelRaw;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });

  selectedCustomMode = entry.customMode === 'copy' ? 'copy' : 'trace';
  document.querySelectorAll('.custom-mode-btn').forEach((b) => {
    const on = b.dataset.value === selectedCustomMode;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });

  if (entry.hiraganaSetOrder === 'random' || entry.hiraganaSetOrder === 'sequential') {
    setHiraganaOrder(entry.hiraganaSetOrder);
  } else if (entry.customPayload && entry.customPayload.hiraganaSetOrder) {
    setHiraganaOrder(entry.customPayload.hiraganaSetOrder);
  } else if (content === 'hiragana') {
    setHiraganaOrder('sequential');
  }

  const kat = document.getElementById('includeKatakana');
  if (kat) kat.checked = !!entry.includeKatakana;

  const kg = document.getElementById('kanjiGrade');
  if (kg && entry.kanjiGrade != null) kg.value = String(entry.kanjiGrade);
  selectedKanjiGrade = kg
    ? parseInt(kg.value, 10) || 1
    : (entry.kanjiGrade != null ? parseInt(entry.kanjiGrade, 10) || 1 : selectedKanjiGrade || 1);

  const km = document.getElementById('kanjiMode');
  const wm = entry.kanjiMode === 'writing' ? 'writing' : 'reading';
  if (km) km.value = wm;
  selectedKanjiMode = wm;

  const qc = document.getElementById('questionCountPro');
  if (qc && entry.questionCountPro != null) qc.value = String(entry.questionCountPro);

  const as = document.getElementById('includeAnswersSheet');
  if (as) as.checked = !!entry.includeAnswersSheet;

  setCustomWordsFromSnapshot(entry.customWords);

  refreshCustomWordControl();
  refreshKatakanaToggleRow();
  refreshKanjiSettingsRow();
  refreshQuestionCountUI();
  refreshHiraganaOrderPills();
  refreshAnswerSheetRow();
  applyPlanTierToUI();
}

function openHistoryModal() {
  const modal = document.getElementById('historyModal');
  renderHistoryPanels();
  if (modal) {
    modal.classList.add('open');
  }
  syncModalStackState();
}

function closeHistoryModal() {
  const modal = document.getElementById('historyModal');
  if (modal) modal.classList.remove('open');
  syncModalStackState();
}

function closeHistoryModalOutside(event) {
  if (event.target === document.getElementById('historyModal')) {
    closeHistoryModal();
  }
}

function setHistoryTab(which) {
  const listPanel = document.getElementById('historyListPanel');
  const favPanel = document.getElementById('historyFavPanel');
  const tabList = document.getElementById('historyTabBtn');
  const tabFav = document.getElementById('historyFavTabBtn');
  const isList = which === 'list';
  if (listPanel) listPanel.hidden = !isList;
  if (favPanel) favPanel.hidden = isList;
  tabList?.classList.toggle('history-tab--active', isList);
  tabFav?.classList.toggle('history-tab--active', !isList);
  tabList?.setAttribute('aria-selected', isList ? 'true' : 'false');
  tabFav?.setAttribute('aria-selected', !isList ? 'true' : 'false');
}

function renderHistoryPanels() {
  const HS = typeof HistoryStore !== 'undefined' ? HistoryStore : null;
  const listEl = document.getElementById('historyListPanel');
  const favEl = document.getElementById('historyFavPanel');
  const hint = document.getElementById('historyPlanHint');
  if (!listEl || !favEl) return;

  if (!HS) {
    listEl.innerHTML = '<p class="history-empty">履歴機能を読み込めませんでした。</p>';
    favEl.innerHTML = '';
    return;
  }

  const items = HS.loadHistory();
  const legacyCount = items.filter(
    (entry) => !(typeof entry?.generatedPrintHtml === 'string' && entry.generatedPrintHtml.trim().length > 0)
  ).length;
  if (hint) {
    const base = isProUser
      ? '履歴は新しい順です。「この内容で開く」は保存内容を復元、「この条件で再生成」は新しい問題を作成します。'
      : '履歴は5件まで保存されます。残したいプリントはお気に入り保存がおすすめです。お気に入りは1件まで保存できます。';
    hint.textContent =
      legacyCount > 0
        ? `${base}（旧履歴 ${legacyCount} 件は「この内容で開く（再生成）」表示になります）`
        : base;
  }
  if (!items.length) {
    listEl.innerHTML =
      '<p class="history-empty">まだ履歴がありません。<br>「プリントを生成する」ときに自動で保存されます。</p>';
  } else {
    listEl.innerHTML = '';
    items.forEach((entry) => {
      listEl.appendChild(buildHistoryCardEl(entry, 'history'));
    });
  }

  const favs = HS.loadFavorites();
  if (!favs.length) {
    favEl.innerHTML = isProUser
      ? '<p class="history-empty">お気に入りはありません。<br>履歴の「お気に入り」から追加できます。</p>'
      : '<p class="history-empty">お気に入りはありません。<br>履歴の「お気に入り」から追加できます（無料版は1件まで）。</p>';
  } else {
    favEl.innerHTML = '';
    favs.forEach((entry) => {
      favEl.appendChild(buildHistoryCardEl(entry, 'favorite'));
    });
  }
  refreshHistoryEntryActions();
}

function buildHistoryCardEl(entry, kind) {
  const wrap = document.createElement('div');
  wrap.className = 'history-card';
  const HS = typeof HistoryStore !== 'undefined' ? HistoryStore : null;
  const isHistoryKind = kind === 'history';
  const isFav = isHistoryKind && HS ? HS.isHistoryFavorited(entry.id) : kind === 'favorite';
  const favCount = HS && typeof HS.loadFavorites === 'function' ? HS.loadFavorites().length : 0;
  const favoriteLimitReached = !isProUser && favCount >= 1;

  const titleEl = document.createElement('p');
  titleEl.className = 'history-card-title';
  titleEl.textContent = formatDisplayTitle(entry);

  const metaEl = document.createElement('p');
  metaEl.className = 'history-card-meta';
  const auto = formatAutoHistoryTitle(entry);
  metaEl.textContent = `${formatHistoryDate(entry.createdAt || entry.favoritedAt)} · ${auto}`;

  const top = document.createElement('div');
  top.className = 'history-card-top';
  top.appendChild(titleEl);
  if (isFav) {
    const badge = document.createElement('span');
    badge.className = 'history-card-badge-fav';
    badge.innerHTML = '<i class="fas fa-star"></i> お気に入り済み';
    top.appendChild(badge);
  }

  const actions = document.createElement('div');
  actions.className = 'history-card-actions';
  const hasSavedPrintHtml =
    typeof entry?.generatedPrintHtml === 'string' && entry.generatedPrintHtml.trim().length > 0;

  const openBtn = document.createElement('button');
  openBtn.type = 'button';
  openBtn.className = 'history-mini-btn history-mini-btn--primary';
  openBtn.innerHTML = hasSavedPrintHtml
    ? '<i class="fas fa-folder-open"></i> この内容で開く'
    : '<i class="fas fa-folder-open"></i> この内容で開く（再生成）';
  if (!hasSavedPrintHtml) {
    openBtn.title = 'この履歴は旧形式のため、設定から再生成で開きます。';
  }
  openBtn.onclick = () => historyOpenSavedPrint(entry);

  const regenBtn = document.createElement('button');
  regenBtn.type = 'button';
  regenBtn.className = 'history-mini-btn history-mini-btn--secondary';
  regenBtn.innerHTML = '<i class="fas fa-rotate-right"></i> この条件で再生成';
  regenBtn.onclick = () => historyRegenerate(entry);

  actions.appendChild(openBtn);
  actions.appendChild(regenBtn);

  if (isHistoryKind) {
    const fav = document.createElement('button');
    fav.type = 'button';
    fav.className = 'history-mini-btn history-mini-btn--fav';
    fav.innerHTML = isFav
      ? '<i class="fas fa-star"></i> お気に入り済み'
      : favoriteLimitReached
        ? '<i class="far fa-star"></i> お気に入り保存（有料）'
        : '<i class="far fa-star"></i> お気に入り保存';
    if (isFav) fav.classList.add('history-mini-btn--fav-on');
    fav.onclick = () => historyToggleFavorite(entry);
    actions.appendChild(fav);

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'history-mini-btn history-mini-btn--danger';
    del.innerHTML = '<i class="fas fa-trash"></i> 削除';
    del.onclick = () => historyDelete(entry.id);
    actions.appendChild(del);
  } else {
    const unfav = document.createElement('button');
    unfav.type = 'button';
    unfav.className = 'history-mini-btn history-mini-btn--fav history-mini-btn--fav-on';
    unfav.innerHTML = '<i class="fas fa-star"></i> お気に入り解除';
    unfav.onclick = () => historyRemoveFavorite(entry.id);
    actions.appendChild(unfav);
  }

  wrap.appendChild(top);
  wrap.appendChild(metaEl);
  wrap.appendChild(actions);
  return wrap;
}

function historyRegenerate(entry) {
  closeHistoryModal();
  applySnapshotToUI(entry);
  __historyGenOverride = {
    fromHistory: true,
    forContent: entry.content,
    customPayload: entry.customPayload === undefined ? null : cloneJson(entry.customPayload),
  };
  generatePrint();
}

function historyOpenSavedPrint(entry) {
  closeHistoryModal();
  applySnapshotToUI(entry);
  __historyGenOverride = null;
  const section = document.getElementById('previewSection');
  const sheet = document.getElementById('printSheet');
  if (!section || !sheet) return;

  const html = typeof entry?.generatedPrintHtml === 'string' ? entry.generatedPrintHtml : '';
  if (!html.trim()) {
    historyRegenerate(entry);
    return;
  }

  sheet.innerHTML = html;
  sheet.classList.toggle('a4-sheet--maze', !!entry.generatedIsMazeSheet);
  section.style.display = 'block';
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function historyEdit(entry) {
  closeHistoryModal();
  applySnapshotToUI(entry);
  document.getElementById('controlPanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function historyToggleFavorite(entry) {
  const HS = HistoryStore;
  const res = HS.toggleFavoriteFromHistory(entry, isProUser);
  if (!res.ok && res.reason === 'limit') {
    openFavoriteUpgradeModal();
    return;
  }
  renderHistoryPanels();
}

function openFavoriteUpgradeModal() {
  openPlanModal('よく使う設定を保存して、次回すぐ再利用できます。');
  const modal = document.getElementById('planModal');
  const heading = document.getElementById('planPitchHeading');
  const pitchList = modal?.querySelector('[data-modal-panel="pitch"] .plan-pitch-list');
  const line = modal?.querySelector('[data-modal-panel="pitch"] .plan-pitch-line');
  const detailBtn = modal?.querySelector('.modal-footer .modal-detail-btn');
  if (heading) heading.textContent = 'お気に入りをもっと使うには';
  if (pitchList) {
    pitchList.innerHTML = [
      '<li>よく使う設定を保存して、次回すぐ再利用</li>',
      '<li>お気に入り一覧から直接開ける</li>',
      '<li>お気に入りからすぐ再生成できる</li>',
      '<li>有料版ならお気に入りを複数保存できます</li>',
    ].join('');
  }
  if (line) line.textContent = '有料版を見る';
  if (detailBtn) {
    detailBtn.innerHTML = '<i class="fas fa-file-alt"></i> 有料版を見る';
    detailBtn.title = '料金・無料版との違い・申し込み導線を見る';
  }
}

function historyRemoveFavorite(id) {
  HistoryStore.removeFavorite(id);
  renderHistoryPanels();
  refreshHistoryEntryActions();
}

function historyDelete(id) {
  if (!id || typeof HistoryStore === 'undefined') return;
  if (typeof HistoryStore.removeHistory === 'function') {
    HistoryStore.removeHistory(id);
  }
  renderHistoryPanels();
  refreshHistoryEntryActions();
}

function historyRename(entry, kind) {
  const HS = HistoryStore;
  const cur = formatDisplayTitle(entry);
  const next = window.prompt('表示名（一覧に表示されます）', cur);
  if (next === null) return;
  const trimmed = String(next).trim();
  if (kind === 'history') {
    HS.updateHistoryTitle(entry.id, trimmed);
  } else {
    HS.updateFavoriteTitle(entry.id, trimmed);
  }
  renderHistoryPanels();
  refreshHistoryEntryActions();
}

/** 無料時は上級を選べないよう UI を更新 */
function refreshLevelButtons() {
  const adv = document.querySelector('.level-btn[data-value="advanced"]');
  if (!adv) return;
  const lock = adv.querySelector('.level-pill-lock');
  if (lock) lock.hidden = !!isProUser;
  if (!isProUser) {
    adv.classList.add('level-btn--locked');
    adv.setAttribute('aria-disabled', 'true');
    if (selectedLevel === 'advanced') {
      selectedLevel = 'beginner';
      document.querySelectorAll('.level-btn').forEach((b) => {
        const on = b.dataset.value === 'beginner';
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
  } else {
    adv.classList.remove('level-btn--locked');
    adv.removeAttribute('aria-disabled');
  }
}

function updatePlanPromoVisibility() {
  const freeNotice = document.getElementById('freePlanNotice');
  const proBanner = document.getElementById('proPlanBanner');
  const upgradeNote = document.getElementById('generateUpgradeNote');
  const planCta = document.getElementById('plan-cta');
  const heroFreeNote = document.querySelector('.hero-flow-note');
  const navPro = document.querySelector('.nav-link--pro');
  const footerPro = document.querySelector('.footer-link-pro');
  const planBadge = document.getElementById('planBadge');
  if (freeNotice) freeNotice.hidden = !!isProUser;
  if (proBanner) proBanner.hidden = !isProUser;
  if (upgradeNote) upgradeNote.hidden = !!isProUser;
  if (planCta) planCta.hidden = !!isProUser;
  if (heroFreeNote) heroFreeNote.hidden = !!isProUser;
  if (navPro) navPro.hidden = !!isProUser;
  if (footerPro) footerPro.hidden = !!isProUser;
  /* 有料時は #proPlanBanner のみで状態表示（ヘッダーバッジは無料訴求と二重にならないよう非表示） */
  if (planBadge) planBadge.hidden = !!isProUser;
}

function applyPlanTierToUI() {
  document.body.classList.toggle('plan-pro', isProUser);
  document.body.classList.toggle('plan-free', !isProUser);
  updatePlanBadge();
  updatePlanPromoVisibility();
  if (!isProUser && selectedContent === 'custom') {
    selectedContent = 'joshi';
    document.querySelectorAll('.content-btn').forEach((b) => {
      const on = b.dataset.value === 'joshi';
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  refreshCustomWordControl();
  refreshLevelButtons();
  refreshAnswerSheetRow();
  refreshOneClickRow();
  updateFreeGenQuotaUI();
  migratePremiumGenreTrialFromLegacy();
  migrateLegacyTrialKeysToDailyPerGenre();
  updateTrialNotice(false);
  refreshKatakanaGenerateNote();
  refreshKatakanaToggleRow();
  refreshKanjiSettingsRow();
  refreshQuestionCountUI();
  refreshHiraganaOrderPills();
  syncModalPanelsForPlan();
  ensureCustomWordInputsReady();
  refreshCustomWordButtons();
  const customBtn = document.getElementById('contentBtnCustom');
  if (customBtn) {
    customBtn.classList.toggle('content-btn--locked', !isProUser);
    customBtn.setAttribute('aria-disabled', !isProUser ? 'true' : 'false');
  }
  refreshGenreCardPlanBadgesVisibility();
  refreshPremiumTrialGenreCards();
}

/* ════════════════════════════════════════
   ボタントグル（コンテンツ / レベル）
════════════════════════════════════════ */
/** スマホ：STEP2 / STEP3 へ自然にスクロール（768px以下のみ） */
function scrollMobileFlowStepIntoView(stepId) {
  if (window.innerWidth > 768) return;
  const el = document.getElementById(stepId);
  if (!el) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  requestAnimationFrame(() => {
    el.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  });
}

document.querySelectorAll('.content-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const pick = btn.dataset.value;
    if (!isProUser && isPremiumTrialGenre(pick) && isPremiumTrialUsedToday(pick)) {
      showPremiumGenreTrialExhaustedNotice();
      return;
    }
    if (!isProUser && btn.dataset.value === 'custom') {
      openFeatureLockedModal('custom');
      return;
    }
    document.querySelectorAll('.content-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    selectedContent = btn.dataset.value;
    refreshCustomWordControl();
    refreshKatakanaToggleRow();
    refreshKanjiSettingsRow();
    refreshQuestionCountUI();
    scrollMobileFlowStepIntoView('levelStepCard');
  });
});

document.querySelectorAll('.level-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!isProUser && btn.dataset.value === 'advanced') {
      openPlanModal('上級は有料版で利用可能です');
      return;
    }
    document.querySelectorAll('.level-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    selectedLevel = btn.dataset.value;
    refreshQuestionCountUI();
    scrollMobileFlowStepIntoView('detailSettingsCard');
  });
});

const includeKatakanaEl = document.getElementById('includeKatakana');
if (includeKatakanaEl) {
  includeKatakanaEl.addEventListener('change', () => {
    if (!isProUser) {
      includeKatakanaEl.checked = false;
      openFeatureLockedModal('katakana');
      return;
    }
  });
}

const kanjiGradeEl = document.getElementById('kanjiGrade');
const kanjiModeEl = document.getElementById('kanjiMode');
if (kanjiGradeEl) {
  kanjiGradeEl.addEventListener('change', () => {
    selectedKanjiGrade = parseInt(kanjiGradeEl.value, 10) || 1;
  });
}
if (kanjiModeEl) {
  kanjiModeEl.addEventListener('change', () => {
    selectedKanjiMode = kanjiModeEl.value === 'writing' ? 'writing' : 'reading';
  });
}
document.querySelectorAll('.custom-mode-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.custom-mode-btn').forEach((b) => {
      const on = b === btn;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    selectedCustomMode = btn.dataset.value || 'trace';
  });
});

document.querySelectorAll('#questionCountPills .count-pill').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    const sel = document.getElementById('questionCountPro');
    if (!sel) return;
    sel.value = btn.dataset.qty || '5';
    refreshQuestionCountUI();
  });
});

document.querySelectorAll('#hiraganaOrderPills .pill-duo-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    setHiraganaOrder(btn.dataset.order || 'random');
  });
});

/** スマホ用：下部固定の生成（メイン #generateBtn が1pxでも見えたら非表示） */
let mobileGenStickyObserver = null;
let mobileGenStickyShown = false;
let mobileGenStickyRaf = 0;

function initMobileGenStickyBar() {
  const bar = document.getElementById('mobileGenSticky');
  const btn = document.getElementById('generateBtn');
  if (!bar || !btn) return;

  function setStickyBarVisible(show) {
    if (show === mobileGenStickyShown) return;
    mobileGenStickyShown = show;
    bar.hidden = !show;
    document.documentElement.classList.toggle('has-mobile-gen-sticky-pad', show);
  }

  function apply() {
    mobileGenStickyShown = false;
    document.documentElement.classList.remove('has-mobile-gen-sticky-pad');
    bar.hidden = true;
    if (mobileGenStickyObserver) {
      mobileGenStickyObserver.disconnect();
      mobileGenStickyObserver = null;
    }
    if (window.innerWidth > 768) return;

    mobileGenStickyObserver = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (!e) return;
        /* viewport と少しでも交差していればメインが見えている → 固定バーは出さない */
        const mainVisible = e.isIntersecting;
        cancelAnimationFrame(mobileGenStickyRaf);
        mobileGenStickyRaf = requestAnimationFrame(() => {
          setStickyBarVisible(!mainVisible);
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: [0, 0.01, 0.05, 0.1, 0.25, 0.5, 0.75, 1],
      }
    );
    mobileGenStickyObserver.observe(btn);
  }

  apply();
  if (!initMobileGenStickyBar._resizeBound) {
    initMobileGenStickyBar._resizeBound = true;
    window.addEventListener(
      'resize',
      () => {
        clearTimeout(initMobileGenStickyBar._t);
        initMobileGenStickyBar._t = setTimeout(apply, 150);
      },
      { passive: true }
    );
  }
}

/** スマホ：FAQ は初期ですべて閉じる（復元状態の差し引き用） */
function closeAllFaqItems() {
  document.querySelectorAll('.faq-q').forEach((q) => {
    q.classList.remove('open');
    const a = q.nextElementSibling;
    if (a && a.classList) a.classList.remove('open');
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    applyPlanTierToUI();
    refreshHistoryEntryActions();
    initMobileGenStickyBar();
    if (window.innerWidth <= 768) closeAllFaqItems();
  });
} else {
  applyPlanTierToUI();
  refreshHistoryEntryActions();
  initMobileGenStickyBar();
  if (window.innerWidth <= 768) closeAllFaqItems();
}

document.getElementById('trialNoticeCloseBtn')?.addEventListener('click', () => {
  updateTrialNotice(false);
});

/* ════════════════════════════════════════
   プリント生成
════════════════════════════════════════ */
function generatePrint() {
  const histOverrideSnap = __historyGenOverride;
  __historyGenOverride = null;

  const levelRaw = document.querySelector('.level-btn.active')?.dataset.value || selectedLevel;
  const content  = document.querySelector('.content-btn.active')?.dataset.value || selectedContent;
  const level = getEffectiveLevelForContent(content, levelRaw);
  const count = resolveQuestionCountForPrint(content, level);
  const showName = true;
  const showDate = true;

  const premiumTrialUsedTodayGate =
    !isProUser && isPremiumTrialGenre(content) && isPremiumTrialUsedToday(content);

  if (PlanCore && typeof PlanCore.validateGenerationGate === 'function') {
    const gate = PlanCore.validateGenerationGate({
      isPro: isProUser,
      genre: content,
      difficulty: level,
      freeGenerationsUsed: getFreeGenerationsUsed(),
      premiumGenreTrialConsumed: premiumTrialUsedTodayGate,
      mazeHiraganaTrialConsumed:
        !isProUser && content === 'maze_hiragana' && isPremiumTrialUsedToday('maze_hiragana'),
    });
    if (!gate.ok) {
      if (gate.kind === 'quota') {
        openPlanModal(gate.message || '');
        return;
      }
      if (gate.kind === 'advanced_locked') {
        openPlanModal(gate.message || '');
        return;
      }
      if (gate.kind === 'custom_locked') {
        openFeatureLockedModal('custom');
        return;
      }
      /* 旧 bundle が maze_hiragana_locked を返す場合も、体験終了と同じ案内に統一 */
      if (gate.kind === 'premium_trial_exhausted' || gate.kind === 'maze_hiragana_locked') {
        showPremiumGenreTrialExhaustedNotice();
        return;
      }
    }
  } else if (!isProUser) {
    if (getFreeGenerationsUsed() >= FREE_GENERATION_LIMIT) {
      openPlanModal(
        `無料版は1日${FREE_GENERATION_LIMIT}回までです。有料版（月額300円・回数無制限）をご利用ください。`
      );
      return;
    }
    if (level === 'advanced') {
      openPlanModal('上級は有料版で利用可能です');
      return;
    }
    if (content === 'custom') {
      openFeatureLockedModal('custom');
      return;
    }
    if (premiumTrialUsedTodayGate) {
      showPremiumGenreTrialExhaustedNotice();
      return;
    }
  }
  updateTrialNotice(false);

  const wantAnswers =
    isProUser && document.getElementById('includeAnswersSheet')?.checked;

  const useHistPayload =
    histOverrideSnap &&
    histOverrideSnap.fromHistory &&
    histOverrideSnap.forContent === content;

  let customPayload = null;
  if (useHistPayload) {
    customPayload =
      histOverrideSnap.customPayload === undefined ? null : cloneJson(histOverrideSnap.customPayload);
  } else if (content === 'custom') {
    const words = getCustomWordsFromUI();
    if (words.length < 1) {
      alert('カスタム問題では単語を1つ以上入力してください。');
      return;
    }
    if (words.some((w) => w.length > CUSTOM_WORD_MAX_LEN)) {
      alert('各単語は15文字までです。');
      return;
    }
    customPayload = { words, mode: selectedCustomMode };
  } else if (content === 'hiragana') {
    customPayload = { hiraganaSetOrder: selectedHiraganaOrder };
  } else if (content === 'sentence' && isPremiumTrialAvailableToday('sentence')) {
    customPayload = { sentenceTrialQuality: true };
  } else if (content === 'kanji') {
    customPayload = getKanjiPayloadFromUI();
  }

  const overlay = document.getElementById('loadingOverlay');
  overlay.style.display = 'flex';

  setTimeout(() => {
    try {
      const html =
        PlanCore && typeof PlanCore.buildPrintHtml === 'function'
          ? PlanCore.buildPrintHtml({
              content,
              level,
              count,
              showName,
              showDate,
              customPayload,
              wantAnswers,
              allowKatakana: getAllowKatakana(),
              kanaMode: getKanaMode(),
            })
          : generatePrintHTML(
              content,
              level,
              count,
              showName,
              showDate,
              customPayload,
              wantAnswers,
              getAllowKatakana(),
              getKanaMode()
            );
      const sheet = document.getElementById('printSheet');
      sheet.innerHTML = html;
      /* 迷路系のみ a4-sheet--maze（印刷・プレビュー・PDF で共通レイアウト最適化の影響を切り離す） */
      sheet.classList.toggle('a4-sheet--maze', content === 'maze' || content === 'maze_hiragana');

      if (typeof localStorage !== 'undefined' && localStorage.getItem('printPackDebug') === '1') {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            try {
              const firstPage = sheet.querySelector('.print-page:not(.print-page--answer)');
              const card = firstPage && firstPage.querySelector(':scope > .questions-grid > .question-card');
              const firstGrid = firstPage && firstPage.querySelector(':scope > .questions-grid');
              const m = typeof globalThis !== 'undefined' ? globalThis.__PRINT_PACK_LAST : null;
              if (card && m && typeof m.firstCardStackDeltaPx === 'number') {
                const h = card.getBoundingClientRect().height;
                console.warn('[printPackDebug] rendered 1st card vs meter stack delta', {
                  renderedCardHeightPx: Math.round(h * 100) / 100,
                  meterFirstCardStackDeltaPx: m.firstCardStackDeltaPx,
                  diffPx: Math.round((h - m.firstCardStackDeltaPx) * 100) / 100,
                });
              }
              if (firstGrid && m && typeof m.firstPageGridHeightPx === 'number') {
                const gridH = firstGrid.scrollHeight;
                console.warn('[printPackDebug] rendered 1st page grid vs meter', {
                  renderedFirstPageGridPx: Math.round(gridH * 100) / 100,
                  meterFirstPageGridPx: m.firstPageGridHeightPx,
                  diffPx: Math.round((gridH - m.firstPageGridHeightPx) * 100) / 100,
                  firstPageCardsClass: m.firstPageCardsClass,
                });
              }
            } catch (eDbg) {
              /* ignore */
            }
          });
        });
      }

      const section = document.getElementById('previewSection');
      section.style.display = 'block';
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      saveSuccessfulGenerationToHistory({
        content,
        levelRaw,
        level,
        count,
        customPayload,
        wantAnswers,
        generatedPrintHtml: html,
        generatedIsMazeSheet: content === 'maze' || content === 'maze_hiragana',
      });
      incrementFreeGenerationCount();
      if (!isProUser && isPremiumTrialGenre(content)) {
        markPremiumTrialUsedTodayForGenre(content);
        updateTrialNotice(true, '', 'after-first-use');
        applyPlanTierToUI();
      }
      updateFreeGenQuotaUI();
    } catch (e) {
      console.error('生成エラー:', e);
      alert('プリントの生成中にエラーが発生しました。再度お試しください。');
    } finally {
      overlay.style.display = 'none';
    }
  }, 400);
}

/* ════════════════════════════════════════
   印刷
════════════════════════════════════════ */
function printSheet() {
  if (shouldUseMobilePdfHint()) {
    alert('スマホでは直接印刷できない場合があります。「PDF保存」から保存してご利用ください。');
    return;
  }
  window.print();
}

/* ════════════════════════════════════════
   PDF 保存
   ・PC：印刷ダイアログ経由（ベクターに近い）
   ・スマホ：html2canvas + jsPDF（window.print 禁止回避）
════════════════════════════════════════ */
/** 狭い画面またはモバイル UA ならスマホ扱い */
function shouldUseMobilePdfHint() {
  try {
    if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) return true;
  } catch (e) { /* ignore */ }
  const ua = navigator.userAgent || '';
  return /iPhone|iPod|iPad|Android/i.test(ua);
}

async function savePDF() {
  const sheet = document.getElementById('printSheet');

  if (!sheet || !sheet.innerHTML.trim()) {
    alert('まずプリントを生成してください。');
    return;
  }

  if (!sheet.querySelector('.question-card')) {
    alert('プリントに問題が含まれていません。');
    return;
  }

  if (shouldUseMobilePdfHint()) {
    const overlay = document.getElementById('loadingOverlay');
    const loadingP = overlay && overlay.querySelector('p');
    const prevText = loadingP ? loadingP.textContent : '';
    if (loadingP) loadingP.textContent = 'スマホ用のPDFを作成しています。少しお待ちください。';
    if (overlay) overlay.style.display = 'flex';
    try {
      await savePdfViaHtml2Canvas();
    } finally {
      if (overlay) overlay.style.display = 'none';
      if (loadingP) loadingP.textContent = prevText || 'プリントを生成しています…';
    }
    return;
  }

  alert(
    'このあと印刷画面が開きます。\n\n左下の「PDF」から「PDFに保存」を選んでください。'
  );
  window.print();
}

function sleepPdf(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForPaintPdf() {
  await new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
  await sleepPdf(50);
}

/** .a4-sheet と同じ印字幅（210mm − @page 左右余白 12mm×2） */
const MOBILE_PDF_CONTENT_WIDTH_MM = 186;
const MOBILE_PDF_SIDE_MARGIN_MM = 12;

/**
 * スマホ向け：.print-page を cloneNode し、body 直下の可視一時コンテナ内で html2canvas。
 * 一時コンテナは 186mm 固定（スマホ viewport に引っ張られない）。
 */
async function savePdfViaHtml2Canvas() {
  const sheet = document.getElementById('printSheet');

  if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
    alert('PDFライブラリの読み込みに失敗しました。\nページを再読み込みして再度お試しください。');
    return;
  }

  if (!sheet.querySelector('.question-card')) {
    alert('プリントに問題が含まれていません。');
    return;
  }

  const contentSel =
    document.querySelector('.content-btn.active')?.dataset.value || selectedContent;
  const levelSel = getEffectiveLevelForContent(
    contentSel,
    document.querySelector('.level-btn.active')?.dataset.value || selectedLevel
  );

  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    await waitForPaintPdf();
    await sleepPdf(120);

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const dpr = window.devicePixelRatio || 2;
    const scale = Math.min(3, Math.max(2.5, dpr * 1.1));

    /* 改ページは generator.js の実測パック結果を .print-page 単位でそのまま踏襲（枚数推定とズレない） */
    const pageSlices = getQuestionCardSlicesFromPrintSheet(sheet);
    if (!pageSlices.length) {
      alert('PDFのページ分割に失敗しました。プリントを再生成してからお試しください。');
      return;
    }

    const host = document.createElement('div');
    host.id = 'pdfTempCaptureHost';
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = [
      'position:fixed',
      'left:0',
      'top:0',
      'z-index:2147483646',
      'opacity:1',
      'visibility:visible',
      'pointer-events:none',
      'background:#ffffff',
      'box-sizing:border-box',
      'overflow:hidden',
      'width:186mm',
      'min-width:186mm',
      'max-width:none',
    ].join(';');

    document.body.classList.add('pdf-mobile-capture');
    document.body.appendChild(host);

    try {
      for (let p = 0; p < pageSlices.length; p++) {
        const frag = buildMobilePdfSheetFragment(
          sheet,
          pageSlices[p],
          p === 0,
          p === pageSlices.length - 1
        );
        host.appendChild(frag);
        void frag.offsetHeight;
        await waitForPaintPdf();
        await sleepPdf(50);

        const canvas = await html2canvas(frag, {
          scale,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          foreignObjectRendering: false,
          allowTaint: false,
          imageTimeout: 20000,
        });

        host.removeChild(frag);

        if (!canvas || canvas.width < 2 || canvas.height < 2) {
          throw new Error('empty canvas');
        }
        addCanvasPageToPdf(
          pdf,
          canvas,
          MOBILE_PDF_SIDE_MARGIN_MM,
          MOBILE_PDF_CONTENT_WIDTH_MM,
          p > 0
        );
      }

      const contentLabels = {
        joshi: '助詞',
        hiragana: '50音',
        custom: 'カスタム問題',
        maze: 'めいろ',
        maze_hiragana: 'ひらがな迷路',
        kanji: '漢字',
        sentence: '文章問題',
        narabikae: '並び替え',
      };
      pdf.save(
        `プリント_${contentLabels[contentSel]}_${getLevelLabel(levelSel, contentSel)}_${dateStamp()}.pdf`
      );
    } finally {
      document.body.classList.remove('pdf-mobile-capture');
      host.remove();
    }
  } catch (e) {
    console.error('PDF保存エラー:', e);
    try {
      await savePdfViaHtml2CanvasFallbackSlices(sheet, contentSel, levelSel);
    } catch (e2) {
      console.error('PDFフォールバック失敗:', e2);
      alert('PDFの生成に失敗しました。\n通信環境を確認のうえ、再度お試しください。');
    }
  }
}

/**
 * 画像を A4 に貼る。canvas は幅 MOBILE_PDF_CONTENT_WIDTH_MM mm 分のコンテンツとして扱う。
 * @param {number} sideMarginMm 左右余白（210 = 2*sideMargin + contentWidth となるよう揃える）
 * @param {number} contentWidthMm 印字域の幅（mm）— クローン幅と一致させる
 */
function addCanvasPageToPdf(pdf, canvas, sideMarginMm, contentWidthMm, addPageBefore) {
  const pxPerMm = canvas.width / contentWidthMm;
  const imgHeightMm = canvas.height / pxPerMm;
  const img = canvas.toDataURL('image/png');
  if (addPageBefore) pdf.addPage();
  pdf.addImage(img, 'PNG', sideMarginMm, sideMarginMm, contentWidthMm, imgHeightMm);
}

/**
 * スマホPDF用：既存プリントから question-card を複製し、186mm 幅の 1 ページ相当 DOM を組み立てる。
 * 分割枚数は .print-page ごと（generatePrintHTML の実測ベース改ページと一致）。
 */
function buildMobilePdfSheetFragment(sheet, cardSlice, isFirst, isLastPageOfDoc) {
  const header = sheet.querySelector('.print-header');
  const instr = sheet.querySelector('.print-instruction');
  const continuationStrip = sheet.querySelector('.print-continuation-strip');
  const footer = sheet.querySelector('.print-footer');
  const grid = sheet.querySelector('.questions-grid');
  const cs = getComputedStyle(sheet);
  const gridCs = grid ? getComputedStyle(grid) : null;

  const wrap = document.createElement('div');
  wrap.className = `${sheet.className} pdf-export-surface pdf-capturing`.trim();
  wrap.style.cssText = [
    'width:186mm',
    'min-width:186mm',
    'max-width:none',
    `box-sizing:${cs.boxSizing}`,
    `padding:${cs.padding}`,
    'margin:0',
    'background:#fff',
    'display:flex',
    'flex-direction:column',
    'visibility:visible',
  ].join(';');

  if (isFirst) {
    if (header) wrap.appendChild(header.cloneNode(true));
    if (instr) wrap.appendChild(instr.cloneNode(true));
  } else if (continuationStrip) {
    wrap.appendChild(continuationStrip.cloneNode(true));
  }
  const g = document.createElement('div');
  g.className = grid ? grid.className : 'questions-grid';
  g.style.display = 'flex';
  g.style.flexDirection = 'column';
  g.style.flex = 'none';
  g.style.gap = gridCs ? gridCs.gap : '8px';
  cardSlice.forEach((c) => g.appendChild(c.cloneNode(true)));
  wrap.appendChild(g);
  if (isLastPageOfDoc && footer) wrap.appendChild(footer.cloneNode(true));
  return wrap;
}

function buildPrintChunkPayloadForContent(contentSel) {
  if (contentSel === 'kanji' && typeof getKanjiPayloadFromUI === 'function') {
    return getKanjiPayloadFromUI();
  }
  return {};
}

/**
 * プレビュー済み .a4-sheet 内の「問題用 .print-page」ごとに question-card を束ねる。
 * （解答ページ・カード無しページは除外）
 */
function getQuestionCardSlicesFromPrintSheet(sheet) {
  if (!sheet) return [];
  const pages = Array.from(sheet.querySelectorAll('.print-page:not(.print-page--answer)'));
  const slices = pages
    .map((pp) => Array.from(pp.querySelectorAll(':scope > .questions-grid > .question-card')))
    .filter((cards) => cards.length > 0);
  if (slices.length) return slices;
  const flat = Array.from(sheet.querySelectorAll('.question-card'));
  return flat.length ? [flat] : [];
}

/** 万一 .print-page キャプチャが失敗したとき用（非表示DOM・同じ分割ルール） */
async function savePdfViaHtml2CanvasFallbackSlices(sheet, contentSel, levelSel) {
  const pageSlices = getQuestionCardSlicesFromPrintSheet(sheet);

  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  host.style.cssText =
    'position:fixed;left:-9999px;top:0;width:186mm;min-width:186mm;max-width:none;margin:0;pointer-events:none;z-index:-1;opacity:1;visibility:visible;overflow:visible;';

  document.body.classList.add('pdf-mobile-capture');
  document.body.appendChild(host);

  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
    await waitForPaintPdf();

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const dpr = window.devicePixelRatio || 2;
    const pdfScale = Math.min(3, Math.max(2.5, dpr * 1.1));

    for (let p = 0; p < pageSlices.length; p++) {
      const isFirst = p === 0;
      const isLastPageOfDoc = p === pageSlices.length - 1;
      const frag = buildMobilePdfSheetFragment(sheet, pageSlices[p], isFirst, isLastPageOfDoc);
      host.appendChild(frag);
      void frag.offsetHeight;
      await waitForPaintPdf();

      const canvas = await html2canvas(frag, {
        scale: pdfScale,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        foreignObjectRendering: false,
        allowTaint: false,
        imageTimeout: 20000,
      });

      host.removeChild(frag);

      if (!canvas || canvas.width < 2) {
        throw new Error('blank canvas');
      }

      addCanvasPageToPdf(
        pdf,
        canvas,
        MOBILE_PDF_SIDE_MARGIN_MM,
        MOBILE_PDF_CONTENT_WIDTH_MM,
        p > 0
      );
    }

    const contentLabels = {
      joshi: '助詞',
      hiragana: '50音',
      custom: 'カスタム問題',
      maze: 'めいろ',
      maze_hiragana: 'ひらがな迷路',
      kanji: '漢字',
      sentence: '文章問題',
      narabikae: '並び替え',
    };
    pdf.save(
      `プリント_${contentLabels[contentSel]}_${getLevelLabel(levelSel, contentSel)}_${dateStamp()}.pdf`
    );
  } finally {
    document.body.classList.remove('pdf-mobile-capture');
    host.remove();
  }
}

function dateStamp() {
  const d  = new Date();
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

/* ════════════════════════════════════════
   有料プランモーダル
════════════════════════════════════════ */
function openLineSignup() {
  window.open(LINE_SIGNUP_URL, '_blank', 'noopener,noreferrer');
}

function syncPlanModalUpgradeChrome() {
  const modal = document.getElementById('planModal');
  if (!modal) return;
  const hidePaidSignup = !!isProUser;
  modal.querySelectorAll('.modal-footer .modal-detail-btn, .modal-footer .modal-pro-app-btn').forEach((el) => {
    el.hidden = hidePaidSignup;
  });
  modal.querySelectorAll('.plan-modal-active-pro .plan-modal-pro-line-btn').forEach((el) => {
    el.hidden = hidePaidSignup;
  });
  const proNote = modal.querySelector('.plan-modal-active-pro .plan-modal-pro-note');
  if (proNote) proNote.hidden = hidePaidSignup;
}

function syncModalPanelsForPlan() {
  document.querySelectorAll('[data-modal-panel="pitch"]').forEach((el) => {
    el.hidden = isProUser;
  });
  document.querySelectorAll('[data-modal-panel="pro-active"]').forEach((el) => {
    el.hidden = !isProUser;
  });
  syncPlanModalUpgradeChrome();
}

function syncBodyScrollLock() {
  const planOpen = document.getElementById('planModal')?.classList.contains('open');
  const historyOpen = document.getElementById('historyModal')?.classList.contains('open');
  document.body.style.overflow = planOpen || historyOpen ? 'hidden' : '';
}

function syncModalStackState() {
  const planModal = document.getElementById('planModal');
  const historyModal = document.getElementById('historyModal');
  const planOpen = !!planModal?.classList.contains('open');
  const historyOpen = !!historyModal?.classList.contains('open');
  const stacked = planOpen && historyOpen;

  if (historyModal) {
    historyModal.classList.toggle('modal-overlay--inactive', stacked);
    if (stacked) {
      historyModal.setAttribute('aria-hidden', 'true');
    } else {
      historyModal.removeAttribute('aria-hidden');
    }
  }
  syncBodyScrollLock();
}

function openPlanModal(contextMessage) {
  const modal = document.getElementById('planModal');
  const ctx = document.getElementById('planModalContext');
  const heading = document.getElementById('planPitchHeading');
  const pitchList = modal?.querySelector('[data-modal-panel="pitch"] .plan-pitch-list');
  const line = modal?.querySelector('[data-modal-panel="pitch"] .plan-pitch-line');
  if (heading) heading.textContent = '有料版でできること';
  if (pitchList) {
    pitchList.innerHTML = [
      '<li>月額300円</li>',
      '<li>回数無制限</li>',
      '<li>1枚あたり5〜25問から選択（五十音・初級のみ10問固定・ひらがな迷路は最大10問）</li>',
      '<li>上級モードあり</li>',
      '<li>解答付き</li>',
    ].join('');
  }
  if (line) line.textContent = '有料版のお申し込みはLINEから';
  if (ctx) {
    if (isProUser) {
      ctx.textContent = '';
      ctx.hidden = true;
    } else if (contextMessage) {
      ctx.textContent = contextMessage;
      ctx.hidden = false;
    } else {
      ctx.textContent = '';
      ctx.hidden = true;
    }
  }
  syncModalPanelsForPlan();
  modal.classList.add('open');
  syncModalStackState();
  modal.querySelector('.modal-close').focus();
}

/** ワンクリック自動生成（有料版のみUI表示） */
function runOneClickGenerate() {
  if (!isProUser) {
    openPlanModal('ワンクリック自動生成は有料版限定機能です。');
    return;
  }
  const contents = ['joshi', 'hiragana', 'maze', 'sentence', 'narabikae', 'maze_hiragana', 'kanji'];
  const levels = ['beginner', 'intermediate', 'advanced'];
  selectedContent = contents[Math.floor(Math.random() * contents.length)];
  selectedLevel = levels[Math.floor(Math.random() * levels.length)];
  document.querySelectorAll('.content-btn').forEach((b) => {
    const on = b.dataset.value === selectedContent;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  document.querySelectorAll('.level-btn').forEach((b) => {
    const on = b.dataset.value === selectedLevel;
    b.classList.toggle('active', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  refreshKatakanaToggleRow();
  refreshQuestionCountUI();
  const effLevel = getEffectiveLevelForContent(selectedContent, selectedLevel);
  const qc = document.getElementById('questionCountPro');
  if (qc && !(selectedContent === 'hiragana' && effLevel === 'beginner')) {
    const opts =
      selectedContent === 'maze_hiragana' ? [5, 10] : [5, 10, 15, 20, 25];
    qc.value = String(opts[Math.floor(Math.random() * opts.length)]);
  }
  generatePrint();
}

function closePlanModal() {
  const modal = document.getElementById('planModal');
  modal.classList.remove('open');
  syncModalStackState();
}

// オーバーレイ外クリックで閉じる
function closePlanModalOutside(event) {
  if (event.target === document.getElementById('planModal')) {
    closePlanModal();
  }
}

/** 有料プランの説明ページ（料金・比較・LINE） */
function openPricingPage() {
  window.location.href = 'pricing.html';
}

/** 有料版の利用申込（LINE） */
function openProAppPage() {
  openLineSignup();
}

/* ════════════════════════════════════════
   FAQアコーディオン
════════════════════════════════════════ */
function toggleFaq(btn) {
  const isOpen = btn.classList.contains('open');
  const answer = btn.nextElementSibling; // .faq-a

  // 一度すべて閉じる（1つだけ開く仕様）
  document.querySelectorAll('.faq-q').forEach(q => {
    q.classList.remove('open');
    const a = q.nextElementSibling;
    if (a) a.classList.remove('open');
  });

  // クリックしたものが閉じていたら開く
  if (!isOpen) {
    btn.classList.add('open');
    answer.classList.add('open');
  }
}

/* ════════════════════════════════════════
   キーボードショートカット
════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  // Escape → 手前のモーダルを閉じる
  if (e.key === 'Escape') {
    const plan = document.getElementById('planModal');
    if (plan && plan.classList.contains('open')) {
      closePlanModal();
      return;
    }
    const hist = document.getElementById('historyModal');
    if (hist && hist.classList.contains('open')) {
      closeHistoryModal();
      return;
    }
    closePlanModal();
  }
  // Enter（input以外）→ プリント生成
  if (e.key === 'Enter') {
    const tag = document.activeElement.tagName;
    if (tag !== 'SELECT' && tag !== 'BUTTON' && tag !== 'INPUT') {
      generatePrint();
    }
  }
});
