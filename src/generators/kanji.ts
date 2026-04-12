import type { Difficulty, GenerateOptions, KanjiGrade, KanjiMode, Problem } from '../types';
import { GRADE_1_KANJI } from '../data/kanji/grade1';
import type { KanjiEntry } from '../data/kanji/types';

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
  if (grade === 1) return GRADE_1_KANJI;
  return [];
}

function pickRandom<T>(arr: T[], n: number): T[] {
  if (!arr.length || n <= 0) return [];
  return shuffle(arr).slice(0, Math.min(n, arr.length));
}

function pickSentence(entry: KanjiEntry): string {
  const list = entry.sentences;
  if (!list || !list.length) return '';
  return list[Math.floor(Math.random() * list.length)] || '';
}

/** 文中の対象漢字1字をマーク（1箇所のみ） */
function htmlSentenceReading(sentence: string, char: string): string {
  const i = sentence.indexOf(char);
  if (i === -1) return esc(sentence);
  const before = sentence.slice(0, i);
  const after = sentence.slice(i + char.length);
  return `${esc(before)}<span class="kanji-drill-target">${esc(char)}</span>${esc(after)}`;
}

/** 書き：対象漢字をひらがな（よみ）に置き換えた文 */
function htmlSentenceWriting(sentence: string, char: string, yomi: string): string {
  const i = sentence.indexOf(char);
  if (i === -1) return esc(sentence);
  const before = sentence.slice(0, i);
  const after = sentence.slice(i + char.length);
  return `${esc(before)}（${esc(yomi)}）${esc(after)}`;
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
  pool: KanjiEntry[],
  difficulty: Difficulty
): { html: string; answer: string; choices?: string[]; format: string } {
  const marked = htmlSentenceReading(sentence, entry.char);
  const line = `<div class="choice-sentence kanji-sentence-line">${marked}</div>`;

  if (difficulty === 'beginner') {
    const inner = `${line}
      <div class="emoji-question-prompt">「${esc(entry.char)}」の よみかたを なぞりましょう。</div>
      <div class="trace-area kanji-yomi-trace">
        <span class="trace-target">${esc(entry.yomi)}</span>
      </div>`;
    return { html: inner, answer: entry.yomi, format: formatKey('beginner', 'reading') };
  }

  if (difficulty === 'intermediate') {
    const answer = entry.yomi;
    const wrong = shuffle(pool.filter((e) => e.char !== entry.char && e.yomi !== answer))
      .map((e) => e.yomi)
      .filter((y, idx, a) => a.indexOf(y) === idx)
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

  /* advanced */
  const inner = `${line}
    <div class="desc-sentence">「${esc(entry.char)}」の よみかたを （　　　）に かきましょう。</div>
    <div class="answer-line"></div>`;
  return { html: inner, answer: entry.yomi, format: formatKey('advanced', 'reading') };
}

function buildWriting(
  entry: KanjiEntry,
  sentence: string,
  pool: KanjiEntry[],
  difficulty: Difficulty
): { html: string; answer: string; choices?: string[]; format: string } {
  const hiraganaLine = htmlSentenceWriting(sentence, entry.char, entry.yomi);
  const line = `<div class="choice-sentence kanji-sentence-line">${hiraganaLine}</div>`;

  if (difficulty === 'beginner') {
    const inner = `${line}
      <div class="emoji-question-prompt">□に 入る かんじを なぞりましょう。</div>
      <div class="emoji-question-row emoji-question-row--tight">
        <div class="seikatsu-char-col">
          <span class="seikatsu-trace">${esc(entry.char)}</span>
          <div class="hira-write"></div>
        </div>
      </div>`;
    return { html: inner, answer: entry.char, format: formatKey('beginner', 'writing') };
  }

  if (difficulty === 'intermediate') {
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

  const inner = `${line}
    <div class="emoji-question-prompt">□に かんじを かきましょう。</div>
    <div class="trace-area" style="justify-content:center;margin-top:8px;">
      <div class="write-box" style="width:56px;height:56px;"></div>
    </div>`;
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
    const sentence = pickSentence(entry);
    if (!sentence || sentence.indexOf(entry.char) === -1) {
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
        ? buildWriting(entry, sentence, pool, difficulty)
        : buildReading(entry, sentence, pool, difficulty);

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
      },
    };
  });
}
