import type { Difficulty, GenerateOptions, KanjiGrade, KanjiMode, Problem } from '../types';
import { getKanjiPool } from '../data/kanji/pools';
import { resolveKanjiContextReading } from '../data/kanji/numeralReadings';
import type { KanjiEntry, KanjiSentenceEntry } from '../data/kanji/types';

function esc(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function poolForGrade(grade: KanjiGrade): KanjiEntry[] {
  return getKanjiPool(grade);
}

function pickRandom<T>(arr: T[], n: number): T[] {
  if (!arr.length || n <= 0) return [];
  return shuffle(arr).slice(0, Math.min(n, arr.length));
}

function pickContext(entry: KanjiEntry): KanjiSentenceEntry | null {
  const list = entry.entries;
  if (!list || !list.length) return null;
  return list[Math.floor(Math.random() * list.length)] ?? null;
}

function collectAllReadings(pool: KanjiEntry[]): string[] {
  const set = new Set<string>();
  for (const e of pool) {
    for (const line of e.entries) {
      set.add(line.reading);
    }
  }
  return [...set];
}

function splitAtTarget(sentence: string, char: string): { before: string; after: string } | null {
  const i = sentence.indexOf(char);
  if (i === -1) return null;
  return { before: sentence.slice(0, i), after: sentence.slice(i + char.length) };
}

/** 読み・中級：ターゲットのみ下線 */
function htmlReadingIntermediate(sentence: string, char: string): string {
  const p = splitAtTarget(sentence, char);
  if (!p) return esc(sentence);
  return `${esc(p.before)}<span class="kanji-drill-target">${esc(char)}</span>${esc(p.after)}`;
}

/** 読み・初級：上段＝薄い読み、下段＝漢字 */
function htmlReadingBeginner(sentence: string, char: string, reading: string): string {
  const p = splitAtTarget(sentence, char);
  if (!p) return esc(sentence);
  return `${esc(p.before)}<span class="kanji-stack" lang="ja"><span class="kanji-stack__top kanji-stack__top--trace">${esc(reading)}</span><span class="kanji-stack__bottom kanji-stack__bottom--kanji">${esc(char)}</span></span>${esc(p.after)}`;
}

/** 読み・上級：横長の読み記入欄（1枠）＋本文中の漢字 */
function htmlReadingAdvanced(sentence: string, char: string, reading: string): string {
  void reading;
  const p = splitAtTarget(sentence, char);
  if (!p) return esc(sentence);
  return `${esc(p.before)}<span class="kanji-stack kanji-stack--reading-adv" lang="ja"><span class="kanji-reading-blank-line" aria-hidden="true">（　　　　）</span><span class="kanji-stack__bottom kanji-stack__bottom--kanji">${esc(char)}</span></span>${esc(p.after)}`;
}

/** 書き・中級：（よみ）に置換（従来どおり） */
function htmlWritingIntermediate(sentence: string, char: string, yomi: string): string {
  const p = splitAtTarget(sentence, char);
  if (!p) return esc(sentence);
  return `${esc(p.before)}（${esc(yomi)}）${esc(p.after)}`;
}

/** 書き・初級：上段＝薄い漢字、下段＝（よみ） */
function htmlWritingBeginner(sentence: string, char: string, yomi: string): string {
  const p = splitAtTarget(sentence, char);
  if (!p) return esc(sentence);
  return `${esc(p.before)}<span class="kanji-stack" lang="ja"><span class="kanji-stack__top kanji-stack__top--trace">${esc(char)}</span><span class="kanji-stack__bottom kanji-stack__bottom--slot">（${esc(yomi)}）</span></span>${esc(p.after)}`;
}

/** 書き・上級：小さなよみ → 大きな漢字（本文）→ その下に書字マス */
function htmlWritingAdvanced(sentence: string, char: string, yomi: string): string {
  const p = splitAtTarget(sentence, char);
  if (!p) return esc(sentence);
  return `${esc(p.before)}<span class="kanji-stack kanji-stack--writing-adv" lang="ja"><span class="kanji-stack__yomi-read kanji-stack__yomi-read--writing">${esc(yomi)}</span><span class="kanji-stack__bottom kanji-stack__bottom--kanji kanji-stack__bottom--primary">${esc(char)}</span><span class="kanji-stack__masu-row kanji-stack__masu-row--write"><span class="kanji-masu kanji-masu--kanji" aria-hidden="true"></span></span></span>${esc(p.after)}`;
}

function questionCard(num: number, inner: string): string {
  return `<div class="question-card">
    <div class="question-num">${num}</div>
    <div class="question-card-content">${inner}</div>
  </div>`;
}

function formatKey(diff: Difficulty, mode: KanjiMode): string {
  return `kanji.sentence.${mode}.${diff}`;
}

function buildReading(
  entry: KanjiEntry,
  sentence: string,
  reading: string,
  pool: KanjiEntry[],
  difficulty: Difficulty
): { html: string; answer: string; choices?: string[]; format: string } {
  const lineClass = 'choice-sentence kanji-sentence-line kanji-sentence-line--prominent kanji-sentence-line--nowrap';

  if (difficulty === 'beginner') {
    const marked = htmlReadingBeginner(sentence, entry.char, reading);
    const inner = `<div class="${lineClass}">${marked}</div>`;
    return { html: inner, answer: reading, format: formatKey('beginner', 'reading') };
  }

  if (difficulty === 'intermediate') {
    const marked = htmlReadingIntermediate(sentence, entry.char);
    const line = `<div class="${lineClass}">${marked}</div>`;
    const answer = reading;
    const poolReadings = collectAllReadings(pool);
    const wrong = shuffle(poolReadings.filter((r) => r !== answer))
      .filter((r, idx, a) => a.indexOf(r) === idx)
      .slice(0, 3);
    const choices = shuffle([answer, ...wrong]).slice(0, 4);
    const choicesHtml = choices.map((c) => `<span class="choice-item">${esc(c)}</span>`).join('');
    const inner = `${line}
      <div class="emoji-question-prompt">「${esc(entry.char)}」の よみかたは どれですか。</div>
      <div class="choices-row">
        <span class="choice-label">こたえ：</span>
        ${choicesHtml}
      </div>`;
    return { html: inner, answer, choices, format: formatKey('intermediate', 'reading') };
  }

  const marked = htmlReadingAdvanced(sentence, entry.char, reading);
  const inner = `<div class="${lineClass}">${marked}</div>`;
  return { html: inner, answer: reading, format: formatKey('advanced', 'reading') };
}

function buildWriting(
  entry: KanjiEntry,
  sentence: string,
  reading: string,
  pool: KanjiEntry[],
  difficulty: Difficulty
): { html: string; answer: string; choices?: string[]; format: string } {
  const lineClass = 'choice-sentence kanji-sentence-line kanji-sentence-line--prominent kanji-sentence-line--nowrap';

  if (difficulty === 'beginner') {
    const marked = htmlWritingBeginner(sentence, entry.char, reading);
    const inner = `<div class="${lineClass}">${marked}</div>`;
    return { html: inner, answer: entry.char, format: formatKey('beginner', 'writing') };
  }

  if (difficulty === 'intermediate') {
    const marked = htmlWritingIntermediate(sentence, entry.char, reading);
    const line = `<div class="${lineClass}">${marked}</div>`;
    const answer = entry.char;
    const wrong = shuffle(pool.filter((e) => e.char !== answer))
      .map((e) => e.char)
      .filter((c, idx, a) => a.indexOf(c) === idx)
      .slice(0, 3);
    const choices = shuffle([answer, ...wrong]).slice(0, 4);
    const choicesHtml = choices.map((c) => `<span class="choice-item">${esc(c)}</span>`).join('');
    const inner = `${line}
      <div class="emoji-question-prompt">（　）に 入る かんじは どれですか。</div>
      <div class="choices-row">
        <span class="choice-label">こたえ：</span>
        ${choicesHtml}
      </div>`;
    return { html: inner, answer, choices, format: formatKey('intermediate', 'writing') };
  }

  const marked = htmlWritingAdvanced(sentence, entry.char, reading);
  const inner = `<div class="${lineClass}">${marked}</div>`;
  return { html: inner, answer: entry.char, format: formatKey('advanced', 'writing') };
}

/**
 * 漢字：短文1題（difficulty × kanjiMode で形式のみ変更、同じ例文を使い回し）
 */
export function generateKanji(options: GenerateOptions): Problem[] {
  const grade = (options.kanjiGrade ?? 1) as KanjiGrade;
  const mode = (options.kanjiMode ?? 'reading') as KanjiMode;
  const difficulty = options.difficulty;
  const pool = poolForGrade(grade);
  const n = Math.max(1, options.questionCount | 0);
  const picked = pickRandom(pool, n);
  if (!picked.length) return [];

  return picked.map((entry, i) => {
    const ctx = pickContext(entry);
    const sentence = ctx?.sentence ?? '';
    const rawReading = ctx?.reading ?? '';
    const reading = resolveKanjiContextReading(entry.char, sentence, rawReading);
    if (!ctx || !sentence || !reading || sentence.indexOf(entry.char) === -1) {
      return {
        id: `kanji-${grade}-${i + 1}`,
        type: 'kanji.sentence.error',
        question: questionCard(i + 1, `<p>データ不備（例文に漢字がありません）</p>`),
        answer: '',
        meta: { genre: 'kanji', char: entry.char },
      };
    }

    const built =
      mode === 'writing'
        ? buildWriting(entry, sentence, reading, pool, difficulty)
        : buildReading(entry, sentence, reading, pool, difficulty);

    return {
      id: `kanji-${grade}-${i + 1}`,
      type: built.format,
      question: questionCard(i + 1, built.html),
      answer: built.answer,
      choices: built.choices,
      meta: {
        genre: 'kanji',
        grade,
        kanjiMode: mode,
        difficulty,
        kanjiFormat: built.format,
        char: entry.char,
        sentence,
        reading,
      },
    };
  });
}
