import type { GenerateOptions, KanjiGrade, KanjiMode, Problem } from '../types';
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

function questionCard(num: number, inner: string): string {
  return `<div class="question-card">
    <div class="question-num">${num}</div>
    <div class="question-card-content">${inner}</div>
  </div>`;
}

function buildReadingInner(entry: KanjiEntry, pool: KanjiEntry[]): { html: string; answer: string } {
  const answer = entry.yomi;
  const wrong = shuffle(pool.filter((e) => e.yomi !== answer))
    .map((e) => e.yomi)
    .filter((y, i, a) => a.indexOf(y) === i)
    .slice(0, 3);
  const choices = shuffle([answer, ...wrong]).slice(0, 4);
  const choicesHtml = choices.map((c) => `<span class="choice-item">${esc(c)}</span>`).join('');
  const inner = `
      <div class="emoji-question-row emoji-question-row--tight">
        <div class="emoji-question-body" style="flex:1">
          <div class="kanji-drill-char" style="font-size:clamp(2.5rem,8vw,4rem);font-weight:900;text-align:center;margin-bottom:8px;">${esc(entry.char)}</div>
          <div class="emoji-question-prompt">この かんじの よみかたは どれですか。</div>
          <div class="choices-row">
            <span class="choice-label">こたえ：</span>
            ${choicesHtml}
          </div>
        </div>
      </div>`;
  return { html: inner, answer };
}

function buildWritingInner(entry: KanjiEntry): { html: string; answer: string } {
  const inner = `
      <div class="emoji-question-prompt">「${esc(entry.yomi)}」と よむ かんじを かきましょう。</div>
      <div class="trace-area" style="justify-content:center;margin-top:10px;">
        <div class="write-box" style="width:64px;height:64px;font-size:2rem;"></div>
      </div>`;
  return { html: inner, answer: entry.char };
}

/**
 * 漢字ドリル（学年・読み/書きは GenerateOptions で指定）
 */
export function generateKanji(options: GenerateOptions): Problem[] {
  const grade = (options.kanjiGrade ?? 1) as KanjiGrade;
  const mode = (options.kanjiMode ?? 'reading') as KanjiMode;
  const pool = poolForGrade(grade);
  const n = Math.max(1, options.questionCount | 0);
  const picked = pickRandom(pool, n);
  if (!picked.length) return [];

  return picked.map((entry, i) => {
    const built =
      mode === 'writing'
        ? buildWritingInner(entry)
        : buildReadingInner(entry, pool);
    return {
      id: `kanji-${grade}-${i + 1}`,
      type: 'kanji',
      question: questionCard(i + 1, built.html),
      answer: built.answer,
      meta: {
        genre: 'kanji',
        grade,
        mode,
        char: entry.char,
      },
    };
  });
}
