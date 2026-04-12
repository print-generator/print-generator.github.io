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
/** 漢字：学年（UI #kanjiGrade、データ追加まで 1 のみ） */
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

/** 無料版のみカウント（1日あたり3回まで） */
const FREE_GENERATION_LIMIT = PlanCore?.FREE_GENERATION_LIMIT ?? 3;
const LS_FREE_GEN_TOTAL_KEY = 'homePrint_freeGenTotal_v2';
const LS_FREE_GEN_DATE_KEY = 'homePrint_freeGenDateJst_v2';
/** 文章問題・並び替えの「有料ジャンル体験」は通算1回まで（'1' で使用済み） */
const LS_PREMIUM_GENRE_TRIAL_KEY = 'homePrint_premiumGenreTrialConsumed_v1';
const LS_SENTENCE_TRIAL_COUNT_KEY = 'homePrint_sentenceTrialCount_v1';
const LS_NARABIKAE_TRIAL_COUNT_KEY = 'homePrint_narabikaeTrialCount_v1';
/** ひらがな迷路：無料1回体験済み（'1'） */
const LS_MAZE_HIRAGANA_TRIAL_KEY = 'homePrint_mazeHiraganaTrialConsumed_v1';

function isMazeHiraganaTrialConsumed() {
  if (isProUser) return false;
  try {
    return localStorage.getItem(LS_MAZE_HIRAGANA_TRIAL_KEY) === '1';
  } catch (_e) {
    return false;
  }
}

function markMazeHiraganaTrialConsumed() {
  if (isProUser) return;
  try {
    localStorage.setItem(LS_MAZE_HIRAGANA_TRIAL_KEY, '1');
  } catch (_e) {
    /* ignore */
  }
}

function getJstDateKey() {
  try {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const y = parts.find((p) => p.type === 'year')?.value || '0000';
    const m = parts.find((p) => p.type === 'month')?.value || '00';
    const d = parts.find((p) => p.type === 'day')?.value || '00';
    return `${y}-${m}-${d}`;
  } catch (_e) {
    return new Date().toISOString().slice(0, 10);
  }
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

/** 旧キーから移行：すでに文章／並び替えを使っていたユーザーは体験済みとみなす */
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

function isPremiumGenreTrialConsumed() {
  if (isProUser) return false;
  migratePremiumGenreTrialFromLegacy();
  try {
    return localStorage.getItem(LS_PREMIUM_GENRE_TRIAL_KEY) === '1';
  } catch (_e) {
    return false;
  }
}

function markPremiumGenreTrialConsumed() {
  if (isProUser) return;
  try {
    localStorage.setItem(LS_PREMIUM_GENRE_TRIAL_KEY, '1');
  } catch (_e) {
    /* ignore */
  }
}

/** 有料版のみ選択可。五十音・初級は教材上10問固定で選択より優先 */
const PRO_QUESTION_COUNT_OPTIONS = PlanCore?.PRO_QUESTION_COUNT_OPTIONS ?? [5, 10, 15, 20, 25];

function resolveQuestionCountForPrint(content, level) {
  const sel = document.getElementById('questionCountPro');
  const raw = sel?.value;
  const n = raw != null && raw !== '' ? parseInt(raw, 10) : NaN;
  if (PlanCore && typeof PlanCore.resolveQuestionCount === 'function') {
    return PlanCore.resolveQuestionCount({
      genre: content,
      difficulty: level,
      isPro: isProUser,
      selectedProCount: Number.isFinite(n) ? n : undefined,
    });
  }
  if (content === 'hiragana' && level === 'beginner') return 10;
  if (isProUser) {
    if (PRO_QUESTION_COUNT_OPTIONS.includes(n)) return n;
    return 5;
  }
  return 5;
}

/** 問題数行：五十音・初級のみ非表示（10問固定）。無料は表示のまま disabled＋固定5問 */
function refreshQuestionCountRow() {
  const row = document.getElementById('questionCountRow');
  const hint = document.getElementById('questionCountProHint');
  const sel = document.getElementById('questionCountPro');
  if (!row) return;
  const levelRaw = document.querySelector('.level-btn.active')?.dataset.value || selectedLevel;
  const level = getEffectiveLevelForContent(selectedContent, levelRaw);
  const fixedHiraganaBeginner = selectedContent === 'hiragana' && level === 'beginner';
  row.hidden = fixedHiraganaBeginner;
  if (sel) {
    sel.disabled = !isProUser;
    sel.classList.toggle('setting-select--locked', !isProUser);
    if (!isProUser) sel.value = '5';
  }
  if (hint) {
    if (row.hidden) {
      hint.textContent = '';
    } else if (!isProUser) {
      hint.textContent = '無料版は5問固定です。有料版で変更できます。';
    } else {
      hint.textContent = '5〜25問から選べます。';
    }
  }
}

function updateTrialNotice(show, featureName = '', mode = 'limit') {
  const el = document.getElementById('sentenceTrialNotice');
  const title = document.getElementById('trialNoticeTitle');
  const sub = document.getElementById('trialNoticeSub');
  const btn = el?.querySelector('.sentence-trial-btn');
  if (!el) return;
  if (show && title && sub) {
    if (mode === 'after-first-use') {
      title.textContent = '有料ジャンルをおためしできました！';
      sub.textContent = '文章問題・並び替えは有料プランでいつでもご利用いただけます。';
      if (btn) btn.textContent = '有料プランを見る';
    } else {
      title.textContent = '有料ジャンルの体験は終了しました。';
      sub.textContent = `${featureName || '文章問題・並び替え'}は有料プランでご利用いただけます。`;
      if (btn) btn.textContent = '月額300円の有料版を見る';
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
  el.textContent = `無料版の生成：残り ${left} 回（1日${FREE_GENERATION_LIMIT}回まで）`;
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
    hint.textContent = 'オン：ひらがな＋カタカナ／オフ：ひらがなのみ';
  }
  refreshKanaModeControl();
}

function getAllowKatakana() {
  if (!isProUser) return false;
  return !!document.getElementById('includeKatakana')?.checked;
}

/** 五十音：セレクトの値をそのまま生成に渡す（有料・五十音選択時）。無料は常にひらがなのみ */
function getKanaMode() {
  if (!isProUser) return 'hiragana';
  if (selectedContent !== 'hiragana') return 'mix';
  const sel = document.getElementById('kanaMode');
  if (!sel || sel.disabled) return selectedKanaMode || 'hiragana';
  const v = sel.value || 'mix';
  selectedKanaMode = v;
  return v;
}

function refreshKanaModeControl() {
  const row = document.getElementById('kanaModeRow');
  const select = document.getElementById('kanaMode');
  const hint = document.getElementById('kanaModeHint');
  const isHiragana = selectedContent === 'hiragana';
  const show = isHiragana;
  if (row) row.hidden = !show;
  if (!select) return;
  if (!show) {
    select.disabled = true;
    if (hint) {
      hint.textContent = '「五十音」を選ぶと設定できます。';
    }
    return;
  }
  if (isProUser) {
    select.disabled = false;
    selectedKanaMode = select.value || 'mix';
    if (hint) {
      hint.textContent =
        '初級のなぞりに反映されます（あ行〜わ行の10問構成はそのまま）。ミックスは行ごとにひらがな／カタカナ、カタカナのみ・ひらがなのみも選べます。';
    }
  } else {
    select.disabled = true;
    if (hint) {
      hint.textContent = '有料版で「五十音」を選ぶと、カタカナの出題モードを選べます。';
    }
  }
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
  el.textContent = isProUser ? '有料版利用中' : '無料版利用中';
  el.title = isProUser
    ? '有料プランをご利用中です'
    : '【有料版】月額300円・回数無制限・1枚5問（五十音・初級のみ10問）・上級モード・解答付き';
  el.classList.toggle('plan-badge--pro', isProUser);
  el.classList.toggle('plan-badge--free', !isProUser);
}

function refreshAnswerSheetRow() {
  const row = document.getElementById('answerSheetRow');
  const cb = document.getElementById('includeAnswersSheet');
  if (row) row.hidden = !isProUser;
  if (cb && !isProUser) cb.checked = false;
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
  const customModeCard = document.getElementById('customModeStepCard');
  if (levelCard) levelCard.hidden = isCustom;
  if (customModeCard) customModeCard.hidden = !isCustom;
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

/** 無料時は上級を選べないよう UI を更新 */
function refreshLevelButtons() {
  const adv = document.querySelector('.level-btn[data-value="advanced"]');
  if (!adv) return;
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
  if (freeNotice) freeNotice.hidden = !!isProUser;
  if (proBanner) proBanner.hidden = !isProUser;
  if (upgradeNote) upgradeNote.hidden = !!isProUser;
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
  updateTrialNotice(false);
  refreshKatakanaGenerateNote();
  refreshKatakanaToggleRow();
  refreshKanaModeControl();
  refreshKanjiSettingsRow();
  refreshQuestionCountRow();
  syncModalPanelsForPlan();
  ensureCustomWordInputsReady();
  refreshCustomWordButtons();
  const customBtn = document.getElementById('contentBtnCustom');
  if (customBtn) {
    customBtn.classList.toggle('content-btn--locked', !isProUser);
    customBtn.setAttribute('aria-disabled', !isProUser ? 'true' : 'false');
  }
  const hiraMazeBtn = document.getElementById('contentBtnMazeHiragana');
  if (hiraMazeBtn) {
    const mazeLocked = !isProUser && isMazeHiraganaTrialConsumed();
    hiraMazeBtn.classList.toggle('content-btn--locked', mazeLocked);
    hiraMazeBtn.setAttribute('aria-disabled', mazeLocked ? 'true' : 'false');
  }
}

/* ════════════════════════════════════════
   ボタントグル（コンテンツ / レベル）
════════════════════════════════════════ */
document.querySelectorAll('.content-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!isProUser && btn.dataset.value === 'maze_hiragana' && isMazeHiraganaTrialConsumed()) {
      openPlanModal(
        'ひらがな迷路の無料体験は終了しました。有料版でいつでもご利用いただけます。'
      );
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
    refreshQuestionCountRow();
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
    refreshQuestionCountRow();
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
    refreshKanaModeControl();
  });
}

const kanaModeEl = document.getElementById('kanaMode');
if (kanaModeEl) {
  const syncKanaMode = () => {
    selectedKanaMode = kanaModeEl.value || 'mix';
  };
  kanaModeEl.addEventListener('change', syncKanaMode);
  kanaModeEl.addEventListener('input', syncKanaMode);
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyPlanTierToUI);
} else {
  applyPlanTierToUI();
}

document.getElementById('trialNoticeCloseBtn')?.addEventListener('click', () => {
  updateTrialNotice(false);
});

/* ════════════════════════════════════════
   プリント生成
════════════════════════════════════════ */
function generatePrint() {
  const levelRaw = document.querySelector('.level-btn.active')?.dataset.value || selectedLevel;
  const content  = document.querySelector('.content-btn.active')?.dataset.value || selectedContent;
  const level = getEffectiveLevelForContent(content, levelRaw);
  const count = resolveQuestionCountForPrint(content, level);
  const showName = true;
  const showDate = true;

  const premiumTrialStillAvailable = !isProUser && !isPremiumGenreTrialConsumed();

  if (PlanCore && typeof PlanCore.validateGenerationGate === 'function') {
    const gate = PlanCore.validateGenerationGate({
      isPro: isProUser,
      genre: content,
      difficulty: level,
      freeGenerationsUsed: getFreeGenerationsUsed(),
      premiumGenreTrialConsumed: isPremiumGenreTrialConsumed(),
      mazeHiraganaTrialConsumed: isMazeHiraganaTrialConsumed(),
    });
    if (!gate.ok) {
      /* 旧 plan-core.bundle では迷路を無条件ブロックしていた場合の救済（体験未使用なら続行） */
      const allowMazeFreeTrialDespiteStaleBundle =
        gate.kind === 'maze_hiragana_locked' &&
        !isProUser &&
        content === 'maze_hiragana' &&
        !isMazeHiraganaTrialConsumed();
      if (!allowMazeFreeTrialDespiteStaleBundle) {
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
        if (gate.kind === 'maze_hiragana_locked') {
          openPlanModal(gate.message || '');
          return;
        }
        if (gate.kind === 'premium_trial_exhausted') {
          updateTrialNotice(true, '文章問題・並び替え', 'limit');
          return;
        }
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
    if (content === 'maze_hiragana' && isMazeHiraganaTrialConsumed()) {
      openPlanModal(
        'ひらがな迷路の無料体験は終了しました。有料版でいつでもご利用いただけます。'
      );
      return;
    }
    if ((content === 'sentence' || content === 'narabikae') && isPremiumGenreTrialConsumed()) {
      updateTrialNotice(true, '文章問題・並び替え', 'limit');
      return;
    }
  }
  updateTrialNotice(false);

  const wantAnswers =
    isProUser && document.getElementById('includeAnswersSheet')?.checked;

  let customPayload = null;
  if (content === 'custom') {
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
  } else if (content === 'sentence' && premiumTrialStillAvailable) {
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

      const section = document.getElementById('previewSection');
      section.style.display = 'block';
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      incrementFreeGenerationCount();
      if (
        !isProUser &&
        (content === 'sentence' || content === 'narabikae') &&
        premiumTrialStillAvailable
      ) {
        markPremiumGenreTrialConsumed();
        updateTrialNotice(true, '', 'after-first-use');
      }
      if (!isProUser && content === 'maze_hiragana') {
        markMazeHiraganaTrialConsumed();
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

    const cards = Array.from(sheet.querySelectorAll('.question-card'));
    /* generator.js の getPrintPageChunkSizes と同一：通常は各ページ5問（めいろ系は2問刻み） */
    const sizes = typeof getPrintPageChunkSizes === 'function'
      ? getPrintPageChunkSizes(cards.length, contentSel)
      : [cards.length];
    const pageSlices = [];
    let offset = 0;
    sizes.forEach((sz) => {
      pageSlices.push(cards.slice(offset, offset + sz));
      offset += sz;
    });

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
 * PC 印刷の getPrintPageChunkSizes（各ページ5問）に合わせた枚数。
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

/** 万一 .print-page キャプチャが失敗したとき用（非表示DOM・同じ分割ルール） */
async function savePdfViaHtml2CanvasFallbackSlices(sheet, contentSel, levelSel) {
  void levelSel;
  const cards = Array.from(sheet.querySelectorAll('.question-card'));
  const sizes = typeof getPrintPageChunkSizes === 'function'
    ? getPrintPageChunkSizes(cards.length, contentSel)
    : [cards.length];
  const pageSlices = [];
  let offset = 0;
  sizes.forEach((sz) => {
    pageSlices.push(cards.slice(offset, offset + sz));
    offset += sz;
  });

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

function syncModalPanelsForPlan() {
  document.querySelectorAll('[data-modal-panel="pitch"]').forEach((el) => {
    el.hidden = isProUser;
  });
  document.querySelectorAll('[data-modal-panel="pro-active"]').forEach((el) => {
    el.hidden = !isProUser;
  });
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
      '<li>1枚あたり5〜25問から選択（五十音・初級のみ10問固定）</li>',
      '<li>上級モードあり</li>',
      '<li>解答付き</li>',
    ].join('');
  }
  if (line) line.textContent = '有料版のお申し込みはLINEから';
  if (ctx) {
    if (contextMessage) {
      ctx.textContent = contextMessage;
      ctx.hidden = false;
    } else {
      ctx.textContent = '';
      ctx.hidden = true;
    }
  }
  syncModalPanelsForPlan();
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  modal.querySelector('.modal-close').focus();
}

/** ワンクリック自動生成（有料版のみUI表示） */
function runOneClickGenerate() {
  if (!isProUser) {
    openPlanModal('ワンクリック自動生成は有料版限定機能です。');
    return;
  }
  const contents = ['joshi', 'hiragana', 'maze', 'kanji', 'sentence', 'narabikae', 'maze_hiragana'];
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
  refreshQuestionCountRow();
  const effLevel = getEffectiveLevelForContent(selectedContent, selectedLevel);
  const qc = document.getElementById('questionCountPro');
  if (qc && !(selectedContent === 'hiragana' && effLevel === 'beginner')) {
    qc.value = String(PRO_QUESTION_COUNT_OPTIONS[Math.floor(Math.random() * PRO_QUESTION_COUNT_OPTIONS.length)]);
  }
  generatePrint();
}

function closePlanModal() {
  const modal = document.getElementById('planModal');
  modal.classList.remove('open');
  document.body.style.overflow = '';
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
  // Escape → モーダルを閉じる
  if (e.key === 'Escape') {
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
